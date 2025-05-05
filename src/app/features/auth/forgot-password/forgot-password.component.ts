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
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
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
  
  // Handle OTP form submission
  onOtpSubmit(): void {
    if (this.otpForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.verifyPasswordResetOTP(this.userEmail, this.otpForm.value.otp).subscribe({
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