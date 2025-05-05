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
   * Ensures consistent field names throughout the application
   */
  private initUserData(): void {
    // Try to load from local state first (fastest)
    const cachedUser = this.tryLoadFromLocalStorage();
    if (cachedUser) {
      // Always normalize during initialization
      const normalizedUser = this.normalizeUserData(cachedUser);
      console.log('Initialization: using normalized user data from localStorage:', normalizedUser);
      this.currentUserSubject.next(normalizedUser);
    }

    // Subscribe to user data from data service as backup and to keep in sync
    this.dataService.currentUser$.subscribe(user => {
      if (user) {
        // Always normalize user data from backend
        const normalizedUser = this.normalizeUserData(user);
        console.log('Initialization: using normalized user data from service:', normalizedUser);
        this.currentUserSubject.next(normalizedUser);
        
        // Update localStorage with latest normalized data
        this.storeUserData(normalizedUser);
      }
    });

    // Try to restore session
    this.dataService.tryRestoreSession();
  }

  /**
   * Try to load user data from localStorage for faster initial load
   * Returns the raw parsed data which will be normalized by the caller
   */
  private tryLoadFromLocalStorage(): User | null {
    try {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        const parsedUser = JSON.parse(userJson);
        
        if (parsedUser) {
          // Log the parsed user for debugging
          console.log('Loaded raw user data from localStorage:', parsedUser);
          
          // Return the raw parsed data - normalization will happen in the caller
          return parsedUser as User;
        }
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
      map(response => {
        // Create user object from response with basic fields
        const initialUser: User = {
          id: response.id || Date.now(),
          full_name: response.user_metadata?.full_name || response.full_name || response.email?.split('@')[0] || 'User',
          email: response.email || response.user_metadata?.email || '',
          profilePicture: response.user_metadata?.avatar_url || response.avatar_url || 'assets/images/default-profile.svg',
          createdAt: new Date(response.created_at) || new Date(),
          lastLogin: new Date(),
          isVerified: response.email_confirmed_at ? true : false,
          hasCompletedOnboarding: false,
          authProvider: AuthProvider.EMAIL,
          connectedPlatforms: []
        };
        
        // Apply normalization to ensure consistent field names
        const user = this.normalizeUserData(initialUser);
        console.log('Login: normalized user data:', user);

        // Store user data (which will apply normalization again)
        this.storeUserData(user);
        this.currentUserSubject.next(user);

        return { user, needsOtpVerification: false };
      }),
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
      map(response => {
        // Normalize user data to ensure consistent field names
        const normalizedUser = this.normalizeUserData(response.user);
        console.log('Register: normalized user data:', normalizedUser);
        
        return {
          user: normalizedUser,
          needsOtpVerification: true
        };
      }),
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

    // Make sure the callback URL matches exactly what's configured in Supabase
    const returnUrl = window.location.origin + '/auth/callback';

    console.log('Redirecting to Google OAuth with callback URL:', returnUrl);

    const params = new URLSearchParams({
      provider: 'google',
      redirect_to: returnUrl
    });

    // Set a flag in sessionStorage to indicate we're using OAuth
    sessionStorage.setItem('usingOAuth', 'true');

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
    console.log('Handling OAuth callback...');

    // Get the access token from URL
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const expiresAt = urlParams.get('expires_at');
    const providerToken = urlParams.get('provider_token');
    const refreshToken = urlParams.get('refresh_token');

    console.log('Access token present:', !!accessToken);

    if (!accessToken) {
      console.error('No access token found in callback URL');
      this.router.navigate(['/auth'], { replaceUrl: true });
      return throwError(() => new Error('No access token found'));
    }

    // Store tokens in localStorage
    localStorage.setItem('access_token', accessToken);
    if (expiresAt) localStorage.setItem('expires_at', expiresAt);
    if (providerToken) localStorage.setItem('provider_token', providerToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

    console.log('Stored tokens, fetching user session...');

    // Get user data from Supabase session
    return this.apiService.get<{ user: User; needsOtpVerification: boolean }>('auth/session').pipe(
      map(response => {
        console.log('Response from session API:', response);
        
        if (response && response.user) {
          // Process and normalize user data to ensure consistent field names
          const user = this.normalizeUserData(response.user);
          
          console.log('Processed user data:', user);
          
          // Store user data
          this.storeUserData(user);
          this.currentUserSubject.next(user);
          
          // Set session storage for success message
          sessionStorage.setItem('socialLoginSuccess', 'Welcome back! Logged in successfully.');
          
          return { 
            user, 
            needsOtpVerification: response.needsOtpVerification || false 
          };
        } else {
          // If no valid user data, create a fallback user (this shouldn't typically happen)
          console.error('Failed to get valid user data from session, using fallback');
          
          // Use fallback data for development purposes only
          const fallbackUser: User = {
            id: Date.now(),
            full_name: 'Google User',
            email: 'google-user@example.com',
            profilePicture: 'assets/images/default-profile.svg',
            createdAt: new Date(),
            lastLogin: new Date(),
            isVerified: true,
            hasCompletedOnboarding: false,
            authProvider: AuthProvider.GOOGLE,
            connectedPlatforms: []
          };
          
          // Store fallback user
          this.storeUserData(fallbackUser);
          this.currentUserSubject.next(fallbackUser);
          
          return { 
            user: fallbackUser, 
            needsOtpVerification: false 
          };
        }
      }),
      tap((response) => {
        console.log('Authentication successful, preparing navigation...');
        const userData = response.user;

        // Use setTimeout to ensure state updates are complete before navigation
        setTimeout(() => {
          if (!userData.hasCompletedOnboarding) {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          } else if (!userData.connectedPlatforms || userData.connectedPlatforms.length === 0) {
            this.router.navigate(['/accounts-connect'], { replaceUrl: true });
          } else {
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          }
        }, 100);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to process session:', error);
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
   * Ensures consistent field names are used
   */
  private storeUserData(user: User): void {
    // Make sure we always normalize before storing
    const normalizedUser = this.normalizeUserData(user);
    localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
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
   * Ensures user data has consistent field names
   * This helps maintain compatibility with backend field names
   * @param user User object to normalize
   * @returns User with consistent field names
   */
  private normalizeUserData(user: User): User {
    if (!user) return user;
    
    // Handle different possible naming patterns for backend fields
    // This is a type-safe approach that preserves the User type
    const userData = {...user};
    
    // Check existing full_name first
    if (!userData.full_name) {
      // Check for any alternative field names that might be present in the raw data
      const rawUser = user as any; // Use 'any' only for field detection
      userData.full_name = 
        rawUser.full_name || rawUser.name || rawUser.fullName || 
        rawUser.displayName || rawUser.username || 'User';
    }
    
    // Make sure email is set
    if (!userData.email) {
      const rawUser = user as any;
      userData.email = rawUser.email || rawUser.userEmail || '';
    }
    
    console.log('Normalized user data:', userData);
    return userData;
  }

  /**
   * Update current user data
   * @param user Updated user object
   */
  updateCurrentUser(user: User): void {
    // Normalize the user data to ensure consistent field naming
    const normalizedUser = this.normalizeUserData(user);
    
    // Update the user in the behavior subject
    this.currentUserSubject.next(normalizedUser);
    
    // Store in localStorage with consistent field names
    localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
    
    console.log('User data updated with normalized fields:', normalizedUser);
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