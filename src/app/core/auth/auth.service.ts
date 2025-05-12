import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, delay } from 'rxjs/operators';
import { User, AuthCredentials, RegisterCredentials, AuthProvider, OAuthResponse } from '../models/user.model';
import { DataService } from '../services/data.service';
import { ToastService } from '../../shared/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    REGISTRATION_COMPLETE: 'registrationComplete',
    VERIFIED_EMAIL: 'verifiedEmail',
    ONBOARDING_COMPLETED: 'has_completed_onboarding'
  };

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private dataService: DataService,
    private toastService: ToastService,
    private apiService: ApiService
  ) {
    this.initUserData();
  }

  private initUserData(): void {
    const cachedUser = this.tryLoadFromLocalStorage();
    if (cachedUser) {
      this.currentUserSubject.next(cachedUser);
    }
  }

  private tryLoadFromLocalStorage(): User | null {
    try {
      const userJson = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      return userJson ? JSON.parse(userJson) as User : null;
    } catch (e) {
      console.error('Failed to parse user data from localStorage', e);
      localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
      return null;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  login(credentials: AuthCredentials): Observable<{ user: User; needsOtpVerification: boolean }> {
    return this.apiService.post<any>('auth/login', credentials).pipe(
      map(response => {
        const user = {
          ...response.user,
          token: response.token,
          refresh_token: response.refresh_token
        } as User;
        this.storeUserData(user);
        this.currentUserSubject.next(user);
        return { user, needsOtpVerification: false };
      }),
      catchError(error => throwError(() => new Error('Login failed: ' + error.message)))
    );
  }

  register(credentials: RegisterCredentials): Observable<{ user: User; needsOtpVerification: boolean }> {
    return this.apiService.post<any>('auth/signup', credentials).pipe(
      map(response => {
        const user = response.user as User;
        return { user, needsOtpVerification: true };
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(
          error.error?.error || 'Registration failed. Please try again.'
        )).pipe(delay(800));
      })
    );
  }

  verifyOtp(email: string, otp: string): Observable<boolean> {
    return this.apiService.post<{ verified: boolean }>('auth/verify-otp', { email, otp }).pipe(
      map(response => {
        if (response.verified) {
          sessionStorage.setItem(this.STORAGE_KEYS.REGISTRATION_COMPLETE, 'true');
          sessionStorage.setItem(this.STORAGE_KEYS.VERIFIED_EMAIL, email);
          return true;
        }
        return false;
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(
          error.error?.error || 'Invalid verification code. Please try again.'
        ));
      })
    );
  }

  resendOtp(email: string): Observable<boolean> {
    return this.apiService.post<boolean>('auth/resend-otp', { email }).pipe(
      catchError(() => throwError(() => new Error('Failed to resend OTP')))
    );
  }

  loginWithGoogle(): Observable<OAuthResponse> {
    return this.apiService.get<any>('auth/google').pipe(
      map(response => {
        window.location.href = response.url;
        return response as OAuthResponse;
      }),
      catchError(() => throwError(() => new Error('Google login failed')))
    );
  }

  loginWithApple(): Observable<OAuthResponse> {
    return this.apiService.get<any>('auth/apple').pipe(
      map(response => {
        window.location.href = response.url;
        return response as OAuthResponse;
      }),
      catchError(() => throwError(() => new Error('Apple login failed')))
    );
  }

  handleOAuthCallback(): Observable<{ user: User; needsOtpVerification: boolean }> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      return throwError(() => new Error('OAuth authentication failed'));
    }

    if (!code) {
      return throwError(() => new Error('No authorization code received'));
    }

    return this.apiService.post<any>('auth/oauth-callback', { code }).pipe(
      map(response => {
        const user = response.user as User;
        this.storeUserData(user);
        this.currentUserSubject.next(user);
        return { user, needsOtpVerification: false };
      }),
      catchError(() => throwError(() => new Error('OAuth callback failed')))
    );
  }

  logout(): void {
    this.toastService.info('Logging out...');
    this.apiService.post('auth/logout', {}).subscribe({
      next: () => this.handleLogoutSuccess(),
      error: () => this.handleLogoutSuccess()
    });
  }

  private handleLogoutSuccess(): void {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    // localStorage.removeItem(this.STORAGE_KEYS.ONBOARDING_COMPLETED);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  updateCurrentUser(user: User): void {
    this.storeUserData(user);
    this.currentUserSubject.next(user);
  }

  updateOnboardingStatus(completed: boolean): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No authenticated user'));
    }

    const updatedUser = {
      ...currentUser,
      has_completed_onboarding: completed
    };

    this.updateCurrentUser(updatedUser);

    if (completed && (!updatedUser.connected_platforms || updatedUser.connected_platforms.length === 0)) {
      setTimeout(() => {
        this.router.navigate(['/accounts-connect']);
      }, 300);
    }

    return of(updatedUser);
  }

  requestPasswordReset(email: string): Observable<boolean> {
    return this.apiService.post<boolean>('auth/forgot-password', { email }).pipe(
      catchError(() => throwError(() => new Error('Failed to request password reset')))
    );
  }

  verifyPasswordResetOTP(email: string, otp: string): Observable<boolean> {
    return this.apiService.post<boolean>('auth/verify-otp', { email, otp }).pipe(
      catchError(() => throwError(() => new Error('Invalid OTP')))
    );
  }

  resetPassword(email: string, newPassword: string): Observable<boolean> {
    return this.apiService.post<boolean>('auth/reset-password', { email, newPassword }).pipe(
      catchError(() => throwError(() => new Error('Failed to reset password')))
    );
  }

    private storeUserData(user: User): void {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }

  completeAuthentication(user: User, redirectToLogin: boolean = false): void {
    if (redirectToLogin) {
      this.router.navigate(['/auth']);
      return;
    }

    if (!user.has_completed_onboarding) {
      this.router.navigate(['/dashboard']);
      return;
    }

    if (!user.connected_platforms || user.connected_platforms.length === 0) {
      this.router.navigate(['/accounts-connect']);
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}
