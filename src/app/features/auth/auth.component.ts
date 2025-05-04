import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { TourService } from '../../core/services/tour.service';
import { User } from '../../core/models/user.model';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastService } from '../../shared/services/toast.service';
import { OtpVerificationComponent } from './otp-verification/otp-verification.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    SkeletonLoaderComponent, 
    RouterModule,
    OtpVerificationComponent
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLogin = true; // Toggle between login and register views
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';
  
  // OTP verification modal
  showOtpVerification = false;
  otpEmail = '';
  
  // Add success messages for completed registration and verified email
  successMessage = '';
  registrationComplete = false;
  verifiedEmail = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private tourService: TourService,
    private toastService: ToastService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

    // Initialize login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Initialize register form
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Check for registration completion in session storage
    if (sessionStorage.getItem('registrationComplete') === 'true') {
      this.registrationComplete = true;
      this.verifiedEmail = sessionStorage.getItem('verifiedEmail') || '';
      this.successMessage = `Registration complete! Your account has been verified. Please log in with your credentials.`;
      
      // Pre-fill the email field if available
      if (this.verifiedEmail) {
        this.loginForm.patchValue({ email: this.verifiedEmail });
      }
      
      // Clear the session storage
      sessionStorage.removeItem('registrationComplete');
      sessionStorage.removeItem('verifiedEmail');
      
      // Ensure we're on the login view
      this.isLogin = true;
    }
    
    // Check for social login success
    if (sessionStorage.getItem('socialLoginSuccess')) {
      this.successMessage = sessionStorage.getItem('socialLoginSuccess') || '';
      sessionStorage.removeItem('socialLoginSuccess');
    }
  }

  ngOnInit(): void {
    // Set initial loading state
    this.isLoading = true;
    
    // Simulate loading delay
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }
  
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  toggleView(): void {
    this.isLogin = !this.isLogin;
    this.errorMessage = '';
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.success('Login successful! Welcome back.');
        // Manually navigate to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Login failed. Please try again.';
        this.toastService.error('Login failed. Please check your credentials.');
        this.isLoading = false;
      }
    });
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
  
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
  
    this.authService.register({
      fullName: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.needsOtpVerification) {
          // Show OTP verification modal
          this.otpEmail = this.registerForm.value.email;
          this.showOtpVerification = true;
          this.toastService.info('Please verify your email with the OTP code we just sent.');
        } else {
          // If no OTP verification is needed, show success message
          this.successMessage = 'Registration successful! You can now log in.';
          this.toastService.success('Registration successful!');
          this.isLogin = true; // Switch to login form automatically
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Registration failed. Please try again.';
        this.toastService.error('Registration failed. Please try again with a different email.');
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Handle OTP verification success
   */
  onOtpVerified(success: boolean): void {
    this.showOtpVerification = false;
    if (success) {
      this.successMessage = 'Email verified successfully! You can now log in.';
      this.toastService.success('Email verified successfully!');
      this.isLogin = true; // Switch to login form
      
      // Pre-fill the email field
      this.loginForm.patchValue({ email: this.otpEmail });
    }
  }
  
  /**
   * Close OTP verification modal
   */
  onOtpModalClosed(): void {
    this.showOtpVerification = false;
  }

  /**
   * Handle login with Google OAuth
   */
  loginWithGoogle(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: (response) => {
        this.toastService.success('Google login successful!');
        this.handleOAuthSuccess(response.user);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Google login failed. Please try again.';
        this.toastService.error('Google login failed. Please try again.');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Handle login with Apple OAuth
   */
  loginWithApple(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginWithApple().subscribe({
      next: (response) => {
        this.toastService.success('Apple login successful!');
        this.handleOAuthSuccess(response.user);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Apple login failed. Please try again.';
        this.toastService.error('Apple login failed. Please try again.');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Common handler for OAuth success
   * Determines if onboarding should be shown and navigates user
   */
  private handleOAuthSuccess(user: User): void {
    // If user hasn't completed onboarding, mark as incomplete
    if (user.hasCompletedOnboarding === false) {
      // This will show the onboarding tour when the user is redirected
      localStorage.removeItem('tour_completed');
      localStorage.removeItem('hasCompletedOnboarding');
    }
    
    // Check if this seems to be a new registration
    const isNewUser = this.checkIfNewUser(user);
    
    // Determine where to navigate
    // Since onboarding component has been removed, all users go to dashboard
    this.router.navigate([this.returnUrl]);
  }
  
  /**
   * Check if this is likely a new user 
   * based on the proximity of createdAt and lastLogin timestamps
   */
  private checkIfNewUser(user: User): boolean {
    if (user.createdAt && user.lastLogin) {
      const createdDate = new Date(user.createdAt);
      const loginDate = new Date(user.lastLogin);
      // If account was created very recently compared to login time, it's likely a new registration
      if ((loginDate.getTime() - createdDate.getTime()) < 10000) {
        return true;
      }
    }
    
    // If there's an explicit flag, use that
    if (user.hasCompletedOnboarding === false) {
      return true;
    }
    
    return false;
  }
  
}
