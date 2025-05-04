import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ConnectedAccount, PlatformInfo } from '../models/connected-account.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ConnectedAccountsService {
  private connectedAccountsSubject = new BehaviorSubject<ConnectedAccount[]>([]);
  public connectedAccounts$ = this.connectedAccountsSubject.asObservable();
  
  private platformInfoSubject = new BehaviorSubject<PlatformInfo[]>([
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'fab fa-instagram',
      available: true,
      description: 'Connect your Instagram account to schedule posts and analyze performance.'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'fab fa-facebook',
      available: false,
      description: 'Connect your Facebook pages and groups. (Coming Soon)'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'fab fa-twitter',
      available: false,
      description: 'Schedule tweets and analyze engagement. (Coming Soon)'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'fab fa-linkedin',
      available: false,
      description: 'Share content to your professional network. (Coming Soon)'
    }
  ]);
  public platformInfo$ = this.platformInfoSubject.asObservable();
  
  constructor(private authService: AuthService) {
    // Initialize with mock data
    const mockAccounts: ConnectedAccount[] = [
      {
        id: 'insta1',
        platform: 'instagram',
        username: 'social_media_pro',
        displayName: 'Social Media Professional',
        profilePicture: 'https://randomuser.me/api/portraits/women/42.jpg',
        isConnected: true,
        userId: 1,
        platformUserId: '12345678'
      }
    ];
    
    this.connectedAccountsSubject.next(mockAccounts);
    
    // Update connected accounts when user changes
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadConnectedAccounts(user);
      } else {
        this.connectedAccountsSubject.next([]);
      }
    });
  }
  
  /**
   * Load connected accounts for a specific user
   */
  private loadConnectedAccounts(user: User): void {
    // In a real app, this would fetch from an API
    // For now, we'll just use the mock data
    // The mock accounts would be filtered by userId in a real implementation
  }
  
  /**
   * Get all connected accounts for the current user
   */
  getConnectedAccounts(): Observable<ConnectedAccount[]> {
    return this.connectedAccounts$;
  }
  
  /**
   * Get connected accounts for a specific platform
   */
  getAccountsForPlatform(platform: string): Observable<ConnectedAccount[]> {
    return this.connectedAccounts$.pipe(
      map(accounts => accounts.filter(account => account.platform === platform))
    );
  }
  
  /**
   * Get information about all supported platforms
   */
  getPlatformInfo(): Observable<PlatformInfo[]> {
    return this.platformInfo$;
  }
  
  /**
   * Connect a new account for a specific platform
   * In a real app, this would initiate OAuth flow
   */
  connectAccount(platform: string): Observable<ConnectedAccount> {
    // Simulate API call delay
    return of({
      id: `${platform}${Date.now()}`,
      platform: 'instagram' as any, // Type assertion for the mock
      username: 'new_connected_account',
      displayName: 'Newly Connected Account',
      profilePicture: 'https://randomuser.me/api/portraits/women/43.jpg',
      isConnected: true,
      userId: this.authService.getCurrentUser()?.id || 1,
      platformUserId: '87654321'
    }).pipe(
      delay(800),
      map(newAccount => {
        // Add to the list of connected accounts
        const currentAccounts = this.connectedAccountsSubject.value;
        this.connectedAccountsSubject.next([...currentAccounts, newAccount]);
        return newAccount;
      })
    );
  }
  
  /**
   * Disconnect an account
   */
  disconnectAccount(accountId: string): Observable<boolean> {
    // Simulate API call delay
    return of(true).pipe(
      delay(800),
      map(() => {
        // Remove from the list of connected accounts
        const currentAccounts = this.connectedAccountsSubject.value;
        const updatedAccounts = currentAccounts.filter(account => account.id !== accountId);
        this.connectedAccountsSubject.next(updatedAccounts);
        return true;
      })
    );
  }
}