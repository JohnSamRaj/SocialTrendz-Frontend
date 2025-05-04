import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  @Input() email: string = '';
  @Output() verified = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  otpForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  // Time remaining for resend (in seconds)
  resendTimer = 0;
  timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]]
    });
  }

  ngOnInit(): void {
    this.startResendTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onSubmit(): void {
    if (this.otpForm.invalid) {
      return;
    }

    const otp = Object.keys(this.otpForm.controls)
      .map(key => this.otpForm.get(key)?.value)
      .join('');

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyOtp(this.email, otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('OTP verification successful!');
        this.verified.emit(true);
      },
      error: (error) => {
        this.errorMessage = error.message || 'OTP verification failed. Please try again.';
        this.toastService.error('OTP verification failed. Please check your code and try again.');
        this.isLoading = false;
      }
    });
  }

  onDigitInput(event: any, nextInput?: HTMLInputElement, prevInput?: HTMLInputElement): void {
    const value = event.target.value;
    
    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) {
      event.target.value = '';
      return;
    }
    
    // Auto-move to next input on digit entry
    if (value.length === 1 && nextInput) {
      nextInput.focus();
    }
    
    // Move to previous input on backspace
    if (value.length === 0 && prevInput && event.inputType === 'deleteContentBackward') {
      prevInput.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, prevInput?: HTMLInputElement): void {
    // Handle backspace
    if (event.key === 'Backspace' && prevInput && (event.target as HTMLInputElement).value === '') {
      prevInput.focus();
    }
  }

  resendOtp(): void {
    if (this.resendTimer > 0) {
      return;
    }
    
    this.authService.resendOtp(this.email).subscribe({
      next: () => {
        this.toastService.success('New OTP has been sent to your email');
        this.startResendTimer();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to resend OTP. Please try again.';
        this.toastService.error('Failed to resend OTP. Please try again.');
      }
    });
  }

  private startResendTimer(): void {
    this.resendTimer = 60; // 60 seconds
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }
  
  closeModal(): void {
    this.close.emit();
  }
}