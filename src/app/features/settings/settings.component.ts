import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SkeletonLoaderComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  notificationForm: FormGroup;
  securityForm: FormGroup;
  connectedAccountsForm: FormGroup;
  
  activeTab: 'profile' | 'notifications' | 'security' | 'connectedAccounts' = 'profile';
  isLoading = false;
  successMessage = '';
  
  // Email verification properties
  isEmailVerified = false;
  isSendingVerification = false;
  showVerificationInput = false;
  verificationCode = '';
  isVerifyingOtp = false;
  canResendVerification = true;
  resendCountdown = 60;
  private countdownSubscription: Subscription | null = null;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    // Initialize forms
    this.profileForm = this.fb.group({
      fullName: [''],
      email: [''],
      bio: [''],
      location: [''],
      website: ['']
    });
    
    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [true],
      postActivityNotifications: [true],
      accountNotifications: [true],
      marketingEmails: [false]
    });
    
    this.securityForm = this.fb.group({
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: ['']
    });
    
    this.connectedAccountsForm = this.fb.group({
      instagramConnected: [false],
      facebookConnected: [false],
      twitterConnected: [false],
      linkedinConnected: [false]
    });
  }
  
  ngOnInit(): void {
    // Start with loading state
    this.isLoading = true;
    
    // Simulate loading delay
    setTimeout(() => {
      // Load user data
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.profileForm.patchValue({
          fullName: currentUser.full_name,
          email: currentUser.email
        });
        
        // Check if user's email is verified
        this.isEmailVerified = currentUser.isVerified || false;
      }
      
      // End loading state
      this.isLoading = false;
    }, 1000);
  }
  
  ngOnDestroy(): void {
    // Clean up any subscriptions when component is destroyed
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = null;
    }
  }
  
  /**
   * Send verification email to the user's email address
   */
  sendVerificationEmail(): void {
    const userEmail = this.profileForm.get('email')?.value;
    if (!userEmail) {
      this.toastService.error('No email address available to verify');
      return;
    }
    
    this.isSendingVerification = true;
    
    // Here you would normally call an API endpoint to send the verification email
    // For now, we'll simulate the API call
    setTimeout(() => {
      this.isSendingVerification = false;
      this.showVerificationInput = true;
      this.toastService.success('Verification code sent to your email address');
      
      // Start countdown for resend button
      this.startResendCountdown();
    }, 1500);
  }
  
  /**
   * Start countdown timer for resend verification code button
   */
  private startResendCountdown(): void {
    this.canResendVerification = false;
    this.resendCountdown = 60;
    
    // Clean up any existing subscription
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    
    // Start a new countdown timer
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.resendCountdown--;
      
      if (this.resendCountdown <= 0) {
        this.canResendVerification = true;
        this.countdownSubscription?.unsubscribe();
        this.countdownSubscription = null;
      }
    });
  }
  
  /**
   * Verify the OTP code entered by the user
   */
  verifyOtp(): void {
    const userEmail = this.profileForm.get('email')?.value;
    if (!userEmail || !this.verificationCode) {
      this.toastService.error('Please enter the verification code');
      return;
    }
    
    this.isVerifyingOtp = true;
    
    // Here you would normally call an API endpoint to verify the code
    // For now, we'll simulate the API call
    setTimeout(() => {
      this.isVerifyingOtp = false;
      
      // For demo purposes, any 6-digit code is accepted
      if (this.verificationCode.length === 6) {
        this.isEmailVerified = true;
        this.showVerificationInput = false;
        this.toastService.success('Email verified successfully!');
        
        // Update the current user's verified status
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          currentUser.isVerified = true;
          this.authService.updateCurrentUser(currentUser);
        }
      } else {
        this.toastService.error('Invalid verification code. Please try again.');
      }
    }, 1500);
  }
  
  setActiveTab(tab: 'profile' | 'notifications' | 'security' | 'connectedAccounts'): void {
    this.activeTab = tab;
  }
  
  saveProfileSettings(): void {
    this.isLoading = true;
    this.successMessage = '';
    
    // Simulate API call delay
    setTimeout(() => {
      // Save profile settings logic would go here
      
      this.isLoading = false;
      this.successMessage = 'Profile settings saved successfully!';
      this.toastService.success('Profile settings saved successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1000);
  }
  
  saveNotificationSettings(): void {
    this.isLoading = true;
    this.successMessage = '';
    
    // Simulate API call delay
    setTimeout(() => {
      // Save notification settings logic would go here
      
      this.isLoading = false;
      this.successMessage = 'Notification settings saved successfully!';
      this.toastService.success('Notification settings saved successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1000);
  }
  
  saveSecuritySettings(): void {
    this.isLoading = true;
    this.successMessage = '';
    
    // Simulate API call delay
    setTimeout(() => {
      // Save security settings logic would go here
      
      this.isLoading = false;
      this.successMessage = 'Security settings saved successfully!';
      this.toastService.success('Security settings saved successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1000);
  }
  
  connectAccount(platform: string): void {
    // Logic for connecting to a social media platform would go here
    console.log(`Connecting to ${platform}...`);
    this.toastService.info(`Initiating connection to ${platform}...`);
    
    // Simulate successful connection
    setTimeout(() => {
      this.toastService.success(`Successfully connected to ${platform}!`);
    }, 1500);
  }
  
  disconnectAccount(platform: string): void {
    // Logic for disconnecting from a social media platform would go here
    console.log(`Disconnecting from ${platform}...`);
    this.toastService.warning(`Disconnecting from ${platform}...`);
    
    // Simulate successful disconnection
    setTimeout(() => {
      this.toastService.success(`Successfully disconnected from ${platform}.`);
    }, 1500);
  }
}