import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonLoaderComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  
  // Flow steps: 
  // 1. Request email
  // 2. Verify OTP
  // 3. Reset password
  // 4. Success (redirect to login)
  currentStep = 1;
  
  // Forms for each step
  emailForm: FormGroup;
  otpForm: FormGroup;
  resetPasswordForm: FormGroup;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Store email for the whole process
  userEmail = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    // Initialize forms
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required]],
      digit2: ['', [Validators.required]],
      digit3: ['', [Validators.required]],
      digit4: ['', [Validators.required]],
      digit5: ['', [Validators.required]],
      digit6: ['', [Validators.required]]
    });
    
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }
  
  ngOnInit(): void {
    // Set initial loading state to show skeleton
    this.isLoading = true;
    
    // Simulate loading delay
    setTimeout(() => {
      this.isLoading = false;
    }, 800);
  }
  
  // Password match validator
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }
  
  // Handle email form submission
  onEmailSubmit(): void {
    if (this.emailForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.userEmail = this.emailForm.value.email;
    
    this.authService.requestPasswordReset(this.userEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 2; // Move to OTP verification
        this.successMessage = 'We have sent a verification code to your email.';
        this.toastService.success('Verification code sent to your email!');
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'Email not found. Please try again.';
        this.toastService.error('Email not found. Please try again.');
        this.isLoading = false;
      }
    });
  }
  
  // OTP input handling
  onDigitInput(event: Event, nextInput?: any, prevInput?: any): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Auto-navigate to next input when a digit is entered
    if (value.length === 1 && nextInput) {
      nextInput.focus();
    }
    
    // If value is cleared and there's a previous input, focus on it
    if (value.length === 0 && prevInput) {
      prevInput.focus();
    }
    
    this.checkOtpCompletion();
  }
  
  // Handle keydown events
  onKeyDown(event: KeyboardEvent, prevInput?: any): void {
    // If backspace and empty, focus on previous input
    if (event.key === 'Backspace' && (event.target as HTMLInputElement).value === '' && prevInput) {
      prevInput.focus();
    }
  }
  
  // Check if all OTP digits are filled
  private checkOtpCompletion(): void {
    if (this.otpForm.valid) {
      // Form is complete
      this.toastService.info('Verification code entered. Click Verify to continue.');
    }
  }
  
  // Resend OTP functionality
  resendTimer = 0;
  resendOtp(): void {
    if (this.resendTimer > 0) return;
    
    this.isLoading = true;
    this.authService.requestPasswordReset(this.userEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('A new verification code has been sent to your email!');
        
        // Start resend timer (60 second countdown)
        this.resendTimer = 60;
        const interval = setInterval(() => {
          this.resendTimer--;
          if (this.resendTimer <= 0) {
            clearInterval(interval);
          }
        }, 1000);
      },
      error: (error: Error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to resend verification code. Please try again.';
        this.toastService.error('Failed to resend verification code.');
      }
    });
  }
  
  // Handle OTP form submission
  onOtpSubmit(): void {
    if (this.otpForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    // Combine all digits into a single OTP string
    const otp = 
      this.otpForm.value.digit1 +
      this.otpForm.value.digit2 +
      this.otpForm.value.digit3 +
      this.otpForm.value.digit4 +
      this.otpForm.value.digit5 +
      this.otpForm.value.digit6;
    
    this.authService.verifyPasswordResetOTP(this.userEmail, otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 3; // Move to reset password
        this.successMessage = 'Verification successful! Please create a new password.';
        this.toastService.success('Verification code confirmed!');
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'Invalid verification code. Please try again.';
        this.toastService.error('Invalid verification code. Please try again.');
        this.isLoading = false;
      }
    });
  }
  
  // Handle reset password form submission
  onResetPasswordSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.resetPassword(
      this.userEmail, 
      this.resetPasswordForm.value.password
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.currentStep = 4; // Move to success
        this.successMessage = 'Password reset successfully! You can now log in with your new password.';
        this.toastService.success('Password reset successfully!');
        
        // Redirect to login after a delay
        setTimeout(() => {
          this.router.navigate(['/auth']);
        }, 3000);
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'Failed to reset password. Please try again.';
        this.toastService.error('Failed to reset password. Please try again.');
        this.isLoading = false;
      }
    });
  }
  
  // Go back to login
  backToLogin(): void {
    this.router.navigate(['/auth']);
  }
  
  // Go back to previous step
  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      this.successMessage = '';
    } else {
      this.backToLogin();
    }
  }
}