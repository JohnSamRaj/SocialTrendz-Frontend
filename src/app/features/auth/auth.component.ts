import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
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
  // Form groups for login and registration
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  
  // Component state variables
  isLogin = true;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';
  
  // OTP verification state
  showOtpVerification = false;
  otpEmail = '';
  
  // Success messages
  successMessage = '';
  registrationComplete = false;
  verifiedEmail = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

    this.initializeForms();
    this.checkSessionStorage();
  }

  ngOnInit(): void {
    this.isLoading = true;
    setTimeout(() => this.isLoading = false, 1000);
  }

  /**
   * Initialize login and registration forms with validators
   */
  private initializeForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }
    
  /**
   * Check session storage for registration completion or social login success
   */
  private checkSessionStorage(): void {
    if (sessionStorage.getItem('registrationComplete') === 'true') {
      this.registrationComplete = true;
      this.verifiedEmail = sessionStorage.getItem('verifiedEmail') || '';
      this.successMessage = `Registration complete! Your account has been verified. Please log in with your credentials.`;
      
      if (this.verifiedEmail) {
        this.loginForm.patchValue({ email: this.verifiedEmail });
      }
      
      sessionStorage.removeItem('registrationComplete');
      sessionStorage.removeItem('verifiedEmail');
      this.isLogin = true;
    }
    
    if (sessionStorage.getItem('socialLoginSuccess')) {
      this.successMessage = sessionStorage.getItem('socialLoginSuccess') || '';
      sessionStorage.removeItem('socialLoginSuccess');
    }
  }

  /**
   * Validates if password and confirm password match
   */
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  /**
   * Toggle between login and register views
   */
  toggleView(): void {
    this.isLogin = !this.isLogin;
    this.errorMessage = '';
  }

  /**
   * Handle login form submission
   */
  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('Login successful! Welcome back.');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Login failed. Please try again.';
        this.toastService.error('Login failed. Please check your credentials.');
        this.isLoading = false;
      }
    });
  }

  /**
   * Handle registration form submission
   */
  onRegisterSubmit(): void {
    if (this.registerForm.invalid) return;
  
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
  
    this.authService.register({
      full_name: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.needsOtpVerification) {
          this.otpEmail = this.registerForm.value.email;
          this.showOtpVerification = true;
          this.toastService.info('Please verify your email with the OTP code we just sent.');
        } else {
          this.successMessage = 'Registration successful! You can now log in.';
          this.toastService.success('Registration successful!');
          this.isLogin = true;
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
      this.isLogin = true;
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
   * Handle Google OAuth login
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
   * Handle Apple OAuth login
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
   * Handle OAuth login success and navigation
   */
  private handleOAuthSuccess(user: User): void {
    if (user.has_completed_onboarding === false) {
      localStorage.removeItem('tour_completed');
      localStorage.removeItem('has_completed_onboarding');
    }
    this.router.navigate([this.returnUrl]);
  }
}
