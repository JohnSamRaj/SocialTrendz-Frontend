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

  otpForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  private readonly RESEND_TIMEOUT = 60; // seconds
  resendTimer = 0;
  private timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.startResendTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private initializeForm(): void {
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]]
    });
  }

  onSubmit(): void {
    if (this.otpForm.invalid) return;

    const otp = this.getOtpFromForm();
    this.verifyOtp(otp);
  }

  private getOtpFromForm(): string {
    return Object.keys(this.otpForm.controls)
      .map(key => this.otpForm.get(key)?.value)
      .join('');
  }

  private verifyOtp(otp: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyOtp(this.email, otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('OTP verification successful!');
        this.verified.emit(true);
      },
      error: (error) => {
        this.handleVerificationError(error);
      }
    });
  }

  private handleVerificationError(error: any): void {
    this.errorMessage = error.message || 'OTP verification failed. Please try again.';
    this.toastService.error('OTP verification failed. Please check your code and try again.');
    this.isLoading = false;
  }

  onDigitInput(event: any, nextInput?: HTMLInputElement, prevInput?: HTMLInputElement): void {
    const value = event.target.value;
    
    if (!this.isValidDigit(value)) {
      event.target.value = '';
      return;
    }
    
    this.handleInputNavigation(value, nextInput, prevInput, event);
  }

  /**
   * Validate if input is a single digit
   */
  private isValidDigit(value: string): boolean {
    return Boolean(value && /^[0-9]$/.test(value));
  }

  private handleInputNavigation(
    value: string, 
    nextInput?: HTMLInputElement, 
    prevInput?: HTMLInputElement, 
    event?: any
  ): void {
    if (value.length === 1 && nextInput) {
      nextInput.focus();
    }
    
    if (value.length === 0 && prevInput && event?.inputType === 'deleteContentBackward') {
      prevInput.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, prevInput?: HTMLInputElement): void {
    if (event.key === 'Backspace' && prevInput && (event.target as HTMLInputElement).value === '') {
      prevInput.focus();
    }
  }

  resendOtp(): void {
    if (this.resendTimer > 0) return;
    
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
    this.resendTimer = this.RESEND_TIMEOUT;
    this.clearTimer();
    
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
  
  closeModal(): void {
    this.close.emit();
  }
}