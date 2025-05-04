import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { ConnectedAccount, PlatformInfo } from '../../core/models/connected-account.model';
import { PlatformConnectionService, PlatformType } from '../../core/services/platform-connection.service';
import { SocialAccountsApiService } from '../../core/services/social-accounts-api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-accounts-connect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accounts-connect.component.html',
  styleUrls: ['./accounts-connect.component.css']
})
export class AccountsConnectComponent implements OnInit {
  availablePlatforms: PlatformInfo[] = [];
  selectedPlatform: PlatformInfo | null = null;
  loading = false;
  error: string | null = null;
  isNewUser = false;

  constructor(
    private platformConnectionService: PlatformConnectionService,
    private socialAccountsApiService: SocialAccountsApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAvailablePlatforms();
    this.checkIfNewUser();
  }

  /**
   * Check if the user is new (just completed onboarding)
   */
  checkIfNewUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isNewUser = !currentUser.hasCompletedOnboarding;
    }
  }

  /**
   * Load available platforms from the service
   */
  loadAvailablePlatforms(): void {
    this.loading = true;
    this.error = null;

    // For now, we only support Instagram
    this.availablePlatforms = [
      {
        id: 'instagram',
        name: 'Instagram',
        icon: 'assets/icons/instagram-logo.svg',
        available: true,
        description: 'Connect your Instagram Business account to schedule posts and view analytics.'
      },
      {
        id: 'facebook',
        name: 'Facebook',
        icon: 'assets/icons/facebook-logo.svg',
        available: false,
        description: 'Connect your Facebook page to schedule posts and view insights. (Coming Soon)'
      },
      {
        id: 'twitter',
        name: 'Twitter',
        icon: 'assets/icons/twitter-logo.svg',
        available: false,
        description: 'Connect your Twitter account to schedule tweets and analyze engagement. (Coming Soon)'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: 'assets/icons/linkedin-logo.svg',
        available: false,
        description: 'Connect your LinkedIn profile to schedule posts and monitor performance. (Coming Soon)'
      }
    ];

    // Check which platforms are connected
    this.platformConnectionService.getConnectionStatuses()
      .pipe(take(1))
      .subscribe({
        next: (statuses) => {
          // Update the available platforms with connection status
          this.availablePlatforms.forEach(platform => {
            const platformId = platform.id as PlatformType;
            if (statuses[platformId] !== undefined) {
              platform.connectedAccounts = statuses[platformId] ? [{ 
                id: platform.id,
                platform: platformId as 'instagram' | 'facebook' | 'twitter' | 'linkedin',
                username: `${platformId}_user`,
                isConnected: true,
                userId: 1
              }] : [];
            }
          });
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading platform statuses:', err);
          this.error = 'Failed to load platform connection statuses';
          this.loading = false;
        }
      });
  }

  /**
   * Select a platform for connection details
   */
  selectPlatform(platform: PlatformInfo): void {
    if (!platform.available) {
      return;
    }
    this.selectedPlatform = platform;
  }

  /**
   * Connect to the selected platform
   */
  connectPlatform(): void {
    if (!this.selectedPlatform) {
      return;
    }

    this.loading = true;
    const platformId = this.selectedPlatform.id as PlatformType;

    // For now, we're focusing on Instagram
    if (platformId === 'instagram') {
      this.connectInstagram();
    } else {
      this.error = `${this.selectedPlatform.name} integration is not available yet.`;
      this.loading = false;
    }
  }

  /**
   * Connect to Instagram by redirecting to the auth URL
   */
  connectInstagram(): void {
    this.socialAccountsApiService.getInstagramAuthUrl()
      .pipe(take(1))
      .subscribe({
        next: (authUrl) => {
          // Redirect to the Instagram authorization URL
          window.location.href = authUrl;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error getting Instagram auth URL:', err);
          this.error = 'Failed to connect to Instagram';
          this.loading = false;
        }
      });
  }

  /**
   * Go back to dashboard or previous page
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}