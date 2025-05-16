// callback.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-callback',
  template: `
    <div class="callback-container">
      <div class="spinner"></div>
      <p>Processing login...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class CallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    // Add a small delay to ensure URL parameters are properly parsed
    setTimeout(() => {
      this.authService.handleOAuthCallback().subscribe({
        next: (response) => {
          if (response.user) {
            if (response.needsOtpVerification) {
              this.router.navigate(['/auth/verify'], { replaceUrl: true });
            } else {
              // Check onboarding status
              if (!response.user.has_completed_onboarding) {
                this.router.navigate(['/onboarding'], { replaceUrl: true });
              } else if (!response.user.connected_platforms || response.user.connected_platforms.length === 0) {
                this.router.navigate(['/accounts-connect'], { replaceUrl: true });
              } else {
                this.router.navigate(['/dashboard'], { replaceUrl: true });
              }
              console.log('Login successful, redirecting...');
            }
          } else {
            this.toastService.error('Failed to get user data');
            this.router.navigate(['/auth'], { replaceUrl: true });
          }
        },
        error: (error) => {
          console.error('Callback error:', error);
          this.toastService.error(error.message || 'Authentication failed');
          this.router.navigate(['/auth'], { replaceUrl: true });
        }
      });
    }, 100);
  }
}