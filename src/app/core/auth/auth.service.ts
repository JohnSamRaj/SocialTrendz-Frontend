/**
 * Authentication Service
 * Handles user authentication, session management, and user-related operations.
 */
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, map, delay, shareReplay, finalize } from 'rxjs/operators';
import { User, AuthCredentials, RegisterCredentials, AuthProvider } from '../models/user.model';
import { DataService } from '../services/data.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Current user state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Tracking state for optimization
  private authRequestInProgress = false;
  private sessionRequest$: Observable<User> | null = null;
  
  constructor(
    private router: Router,
    private dataService: DataService,
    private toastService: ToastService,
    private apiService: ApiService
  ) {
    // Initialize user data
    this.initUserData();
  }

  /**
   * Initialize user data from storage or service with optimized loading
   */
  private initUserData(): void {
    // Try to load from local state first (fastest)
    const cachedUser = this.tryLoadFromLocalStorage();
    if (cachedUser) {
      this.currentUserSubject.next(cachedUser);
    }
    
    // Subscribe to user data from data service as backup and to keep in sync
    this.dataService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserSubject.next(user);
        // Update localStorage with latest data
        this.storeUserData(user);
      }
    });
    
    // Try to restore session
    this.dataService.tryRestoreSession();
  }
  
  /**
   * Try to load user data from localStorage for faster initial load
   */
  private tryLoadFromLocalStorage(): User | null {
    try {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        return JSON.parse(userJson) as User;
      }
    } catch (e) {
      console.error('Failed to parse user data from localStorage', e);
      localStorage.removeItem('currentUser');
    }
    return null;
  }

  /**
   * Get current authenticated user
   * @returns User object or null if not logged in
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if a user is currently logged in
   * @returns boolean indicating login status
   */
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Login with email and password
   * @param credentials User login credentials
   * @returns Observable with user data and verification status
   */
  login(credentials: AuthCredentials): Observable<any> {
    return this.apiService.post<any>('auth/login', credentials).pipe(
      tap(user => this.currentUserSubject.next(user)),
      map(user => ({ user, needsOtpVerification: false })),
      catchError(error => throwError(() => new Error('Login failed: ' + error.message)))
    );
  }

  /**
   * Register a new user account
   * @param credentials Registration information
   * @returns Observable with success message
   */
  register(credentials: RegisterCredentials): Observable<{ user: User; needsOtpVerification: boolean }> {
    return this.apiService.post<{ user: User; needsOtpVerification: boolean }>('auth/signup', credentials)
    .pipe(
      map(response => ({
        user: response.user,
        needsOtpVerification: true
      })),
      catchError((error: HttpErrorResponse) => {
        console.error('Registration failed:', error);
        
        return throwError(() => new Error(
          error.error?.error || 'Registration failed. Please try again.'
        )).pipe(delay(800));
      })
    );
  }
  
  /**
   * Verify OTP for user registration or password reset
   * @param email User's email address
   * @param otp One-time password to verify
   * @returns Observable indicating success
   */
  verifyOtp(email: string, otp: string): Observable<boolean> {
    return this.apiService.post<{ verified: boolean }>('auth/verify-otp', { email, otp })
      .pipe(
        map(response => {
          if (response.verified) {
            // Store registration completion in session so login page can show success message
            sessionStorage.setItem('registrationComplete', 'true');
            sessionStorage.setItem('verifiedEmail', email);
            return true;
          }
          return false;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('OTP verification failed:', error);
          return throwError(() => new Error(
            error.error?.error || 'Invalid verification code. Please try again.'
          ));
        })
      );
  }
  
  /**
   * Resend OTP to user's email
   * @param email User's email address
   * @returns Observable indicating success
   */
  resendOtp(email: string): Observable<boolean> {
    // In a real implementation, this would call an API endpoint to resend the OTP
    return of(true).pipe(delay(800)); // Simulate network delay
  }
  
  /**
   * Login with Google OAuth
   * @returns Observable with user data
   */
  loginWithGoogle(): Observable<{ user: User; needsOtpVerification: boolean }> {
    // Direct Supabase OAuth URL
    const supabaseUrl = 'https://cbzqqsrdwfuyyoidztky.supabase.co/auth/v1/authorize';
    const params = new URLSearchParams({
      provider: 'google',
      redirect_to: 'https://cbzqqsrdwfuyyoidztky.supabase.co/auth/v1/callback'
    });

    // Redirect directly to Supabase
    window.location.href = `${supabaseUrl}?${params.toString()}`;

    // Return a default response since we're redirecting
    return of({
      user: null as unknown as User,
      needsOtpVerification: false
    });
  }
  
  /**
   * Login with Apple OAuth (mock implementation)
   * @returns Observable with user data
   * @deprecated This method uses mock data and should be replaced with actual Apple OAuth integration
   * TODO: Implement actual Apple OAuth flow
   */
  loginWithApple(): Observable<{ user: User; needsOtpVerification: boolean }> {
    // DATABASE INTEGRATION: Replace this mock implementation with actual Apple OAuth flow
    // Similar to the Google implementation above, this should redirect to the proper OAuth provider
    const appleUser: User = this.createMockUser('Apple User', AuthProvider.APPLE);
    this.updateCurrentUser(appleUser);
    
    return of({
      user: appleUser,
      needsOtpVerification: false
    }).pipe(delay(800)); // Simulate network delay
  }
  
  /**
   * Creates a mock user for demo purposes
   * @param name User name
   * @param provider Auth provider
   * @returns User object
   * @deprecated This method uses mock data and should be replaced with actual user data from the backend
   * TODO: Remove when real authentication is implemented
   */
  private createMockUser(name: string, provider: AuthProvider): User {
    // DATABASE INTEGRATION: This entire method should be removed
    // when real authentication with database is implemented
    return {
      id: Date.now(),
      full_name: name,
      email: `${name.toLowerCase().replace(' ', '-')}@example.com`,
      profilePicture: 'assets/images/default-profile.svg',
      createdAt: new Date(),
      lastLogin: new Date(),
      isVerified: true,
      hasCompletedOnboarding: false,
      authProvider: provider,
      connectedPlatforms: []
    };
  }
  
  /**
   * Handle OAuth callback for social sign-in
   * @returns Observable with user data
   */
  handleOAuthCallback(): Observable<{ user: User; needsOtpVerification: boolean }> {
    // Get the access token from URL
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const expiresAt = urlParams.get('expires_at');
    const providerToken = urlParams.get('provider_token');
    const refreshToken = urlParams.get('refresh_token');

    if (!accessToken) {
      this.router.navigate(['/auth'], { replaceUrl: true });
      return throwError(() => new Error('No access token found'));
    }

    // Store tokens in localStorage
    localStorage.setItem('access_token', accessToken);
    if (expiresAt) localStorage.setItem('expires_at', expiresAt);
    if (providerToken) localStorage.setItem('provider_token', providerToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

    // Get user data from Supabase session
    return this.apiService.get<{ user: User; needsOtpVerification: boolean }>('auth/session').pipe(
      tap(response => {
        if (response.user) {
          // Store user data
          this.storeUserData(response.user);
          this.currentUserSubject.next(response.user);

          // Set session storage for success message
          sessionStorage.setItem('socialLoginSuccess', 'Welcome back! Logged in successfully.');

          // Check if user needs to complete onboarding
          if (!response.user.hasCompletedOnboarding) {
            sessionStorage.setItem('openOnboardingModal', 'true');
          }

          // Force navigation to dashboard
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        } else {
          // If no user data, redirect to auth
          this.router.navigate(['/auth'], { replaceUrl: true });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to get session:', error);
        // Clear any stored tokens on error
        localStorage.removeItem('access_token');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('provider_token');
        localStorage.removeItem('refresh_token');
        
        // Redirect to auth page on error
        this.router.navigate(['/auth'], { replaceUrl: true });
        return throwError(() => new Error(
          error.error?.error || 'Failed to complete Google login. Please try again.'
        ));
      })
    );
  }

  /**
   * Store user data in local storage
   */
  private storeUserData(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  /**
   * Complete authentication and redirect user
   * @param user Authenticated user
   * @param redirectToLogin Whether to redirect to login page
   */
  completeAuthentication(user: User, redirectToLogin: boolean = false): void {
    if (redirectToLogin) {
      this.router.navigate(['/auth']);
      return;
    }
    
    // Check if user needs to complete onboarding first
    if (!user.hasCompletedOnboarding) {
      this.router.navigate(['/dashboard']); // Onboarding modal will appear here
      return;
    }
    
    // If user has completed onboarding but has no connected platforms,
    // redirect to accounts connect page
    if (!user.connectedPlatforms || user.connectedPlatforms.length === 0) {
      this.router.navigate(['/accounts-connect']);
      return;
    }
    
    // Otherwise, go to dashboard
    this.router.navigate(['/dashboard']);
  }

  /**
   * Log out the current user
   */
  logout(): void {
    // Show toast notification before logout
    this.toastService.info('Logging out...');
    
    this.dataService.logout().subscribe({
      next: () => this.handleLogoutSuccess(),
      error: (error) => {
        console.error('Logout error:', error);
        this.handleLogoutSuccess(); // Still logout on error
      }
    });
  }
  
  /**
   * Handle successful logout
   */
  private handleLogoutSuccess(): void {
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth']);
  }

  /**
   * Update current user data
   * @param user Updated user object
   */
  updateCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  /**
   * Update user onboarding status
   * @param completed Whether onboarding is completed
   * @returns Observable with updated user
   */
  updateOnboardingStatus(completed: boolean): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No authenticated user'));
    }
    
    const updatedUser = {
      ...currentUser,
      hasCompletedOnboarding: completed
    };
    
    this.updateCurrentUser(updatedUser);
    
    // If onboarding is marked as completed, and the user doesn't have any connected platforms,
    // redirect to the accounts-connect page after a slight delay
    if (completed && (!updatedUser.connectedPlatforms || updatedUser.connectedPlatforms.length === 0)) {
      setTimeout(() => {
        this.router.navigate(['/accounts-connect']);
      }, 300);
    }
    
    return of(updatedUser);
  }

  /**
   * Request a password reset by providing the user's email
   * @param email User's email address
   * @returns Observable indicating success
   * @deprecated This method simulates password reset and should be replaced with actual API integration
   * TODO: Implement actual password reset with backend API
   */
  requestPasswordReset(email: string): Observable<boolean> {
    // DATABASE INTEGRATION: Replace with actual API endpoint call
    // This simulation should be replaced with a real implementation
    return of(true).pipe(
      delay(1500),
      tap(() => {
        // In a real app, this is where we'd send the email with OTP
        console.log(`Password reset requested for ${email}`);
        
        // Store email in sessionStorage for the flow
        sessionStorage.setItem('resetEmail', email);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Password reset request failed:', error);
        return throwError(() => new Error('Failed to process your request. Please try again.'));
      })
    );
  }

  /**
   * Verify the OTP sent for password reset
   * @param email User's email address
   * @param otp One-time password code
   * @returns Observable indicating success
   * @deprecated This method simulates OTP verification and should be replaced with actual API validation
   * TODO: Implement actual OTP verification against backend
   */
  verifyPasswordResetOTP(email: string, otp: string): Observable<boolean> {
    // DATABASE INTEGRATION: Replace with actual API validation
    // Currently using simplified validation logic that should be replaced
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return throwError(() => new Error('Invalid verification code. Must be a 6-digit number.'));
    }
    
    // Store the OTP in sessionStorage for the final reset step
    sessionStorage.setItem('resetOTP', otp);
    
    return of(true).pipe(
      delay(1000),
      catchError((error: HttpErrorResponse) => {
        console.error('OTP verification failed:', error);
        return throwError(() => new Error('Invalid verification code. Please try again.'));
      })
    );
  }

  /**
   * Reset the user's password after email and OTP verification
   * @param email User's email address
   * @param otp Verified one-time password
   * @param newPassword New password to set
   * @returns Observable indicating success
   * @deprecated This method simulates password reset and should be replaced with actual API call
   * TODO: Implement actual password change via backend API
   */
  resetPassword(email: string, otp: string, newPassword: string): Observable<boolean> {
    // DATABASE INTEGRATION: Replace with actual API call
    // Current simulation should be replaced with a real implementation
    
    // Validate that the OTP matches what was verified
    const storedOTP = sessionStorage.getItem('resetOTP');
    if (storedOTP !== otp) {
      return throwError(() => new Error('Verification failed. Please restart the process.'));
    }
    
    return of(true).pipe(
      delay(1500),
      tap(() => {
        // Clear reset-related session data
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetOTP');
        
        // In a real app, this is where the password would be updated
        console.log(`Password reset completed for ${email}`);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Password reset failed:', error);
        return throwError(() => new Error('Failed to reset password. Please try again.'));
      })
    );
  }
} 