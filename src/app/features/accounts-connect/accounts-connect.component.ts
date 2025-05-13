import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { ConnectedAccount, PlatformInfo } from '../../core/models/connected-account.model';
import { PlatformConnectionService } from '../../core/services/platform-connection.service';
import { SocialAccountsApiService } from '../../core/services/social-accounts-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

type SupportedPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin';

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
  connectingPlatform = false;
  error: string | null = null;
  isNewUser = false;

  constructor(
    private platformConnectionService: PlatformConnectionService,
    private socialAccountsApiService: SocialAccountsApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAvailablePlatforms();
    this.checkIfNewUser();
    this.handlePlatformConnectionCallback();
  }

  /**
   * Handle platform connection callback from OAuth redirect
   */
  private handlePlatformConnectionCallback(): void {
    this.route.queryParams.subscribe(params => {
      const platform = params['platform'] as SupportedPlatform;
      if (platform && params['connected']) {
        // Get platform user data from response
        const platformUserData = {
          user_name: params['user_name'],
          profile_picture: params['profile_picture']
        };

        // Update current user with platform data
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            [`${platform}_user_name`]: platformUserData.user_name,
            [`${platform}_profile_picture`]: platformUserData.profile_picture
          };
          this.authService.updateCurrentUser(updatedUser);
        }

        // Show success message
        this.toastService.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} Connected Successfully!`);
        
        // Clean up the URL by removing both query params and hash
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Refresh the platforms list
        this.loadAvailablePlatforms();

        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      } else if (params['error']) {
        this.toastService.error(`Connection failed: ${params['error']}`);
        // Clean up the URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    });
  }

  /**
   * Check if the user is new (just completed onboarding)
   */
  private checkIfNewUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.isNewUser = !currentUser.has_completed_onboarding;
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
            const platformId = platform.id as SupportedPlatform;
            if (statuses[platformId] !== undefined) {
              platform.connectedAccounts = statuses[platformId] ? [{
                id: Math.floor(Math.random() * 1000),
                user_id: this.authService.getCurrentUser()?.id || 0,
                platform: platformId,
                account_name: `${platformId}_account`,
                display_name: `${platformId} Account`,
                access_token: 'mock_token',
                profile_image_url: `assets/images/platforms/${platformId}.svg`,
                created_at: new Date(),
                updated_at: new Date()
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
   * Connect to a platform by redirecting to the auth URL
   */
  connectPlatform(): void {
    if (!this.selectedPlatform) {
      return;
    }

    try {
      this.connectingPlatform = true;
      const platformId = this.selectedPlatform.id as SupportedPlatform;
      const currentUser = this.authService.getCurrentUser();
      
      if (!currentUser?.refresh_token) {
        throw new Error('No refresh token available');
      }
      
      // Show loading toast
      this.toastService.info(`Connecting to ${this.selectedPlatform.name}...`);
      
      // Redirect to platform auth with refresh token
      window.location.href = `${environment.apiUrl}/auth/${platformId}?refresh_token=${currentUser.refresh_token}`;
    } catch (error) {
      console.error(`Error connecting to ${this.selectedPlatform.name}:`, error);
      this.toastService.error(`Failed to connect to ${this.selectedPlatform.name}. Please try again.`);
      this.connectingPlatform = false;
    }
  }

  /**
   * Go back to dashboard or previous page
   */
  goBack(): void {
    if (this.selectedPlatform) {
      this.selectedPlatform = null;
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}