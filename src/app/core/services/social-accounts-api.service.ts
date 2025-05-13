import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { 
  ConnectedAccount, 
  ConnectionStatus, 
  PlatformAuthResponse,
  PlatformConnectionResponse,
  PlatformInfo,
  mapBackendToFrontendAccount
} from '../models/connected-account.model';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocialAccountsApiService {
  private readonly CONNECTED_ACCOUNTS_CACHE_KEY = 'connected_accounts';
  private readonly CONNECTED_ACCOUNTS_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
  private readonly API_BASE = 'auth/instagram';

  private accountsCache$: Observable<ConnectedAccount[]> | null = null;

  constructor(
    private apiService: ApiService,
    private cacheService: CacheService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  /**
   * Get all connected social accounts for the current user
   * Uses caching to avoid repeated API calls in a short timeframe
   */
  getConnectedAccounts(): Observable<ConnectedAccount[]> {
    if (this.accountsCache$) {
      return this.accountsCache$;
    }

    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.accountsCache$ = this.apiService.getCached<ConnectedAccount[]>(
      `${this.API_BASE}/status`,
      {
        headers: {
          Authorization: `Bearer ${userId}`
        }
      }, 
      this.CONNECTED_ACCOUNTS_CACHE_TIME
    ).pipe(
      map(accounts => accounts.map(mapBackendToFrontendAccount)),
      shareReplay(1),
      catchError(error => {
        console.error('Error fetching connected accounts:', error);
        this.accountsCache$ = null;
        this.toastService.error('Failed to load connected accounts');
        return throwError(() => error);
      }),
      tap(() => {
        setTimeout(() => {
          this.accountsCache$ = null;
        }, this.CONNECTED_ACCOUNTS_CACHE_TIME);
      })
    );

    return this.accountsCache$;
  }

  /**
   * Connect a new social account
   */
  connectAccount(accountData: Omit<ConnectedAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Observable<ConnectedAccount> {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.apiService.post<ConnectedAccount>(`${this.API_BASE}/connect`, {
      ...accountData,
      user_id: userId
    }).pipe(
      map(mapBackendToFrontendAccount),
      tap(() => {
        this.invalidateCache();
        this.toastService.success('Account connected successfully');
      }),
      catchError(error => {
        console.error('Error connecting account:', error);
        this.toastService.error('Failed to connect account');
        return throwError(() => error);
      })
    );
  }

  /**
   * Disconnect a social account
   */
  disconnectAccount(platform: string): Observable<PlatformConnectionResponse> {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.apiService.delete<PlatformConnectionResponse>(`${this.API_BASE}/disconnect/${userId}/${platform}`).pipe(
      tap(() => {
        this.invalidateCache();
        this.toastService.success('Account disconnected successfully');
      }),
      catchError(error => {
        console.error('Error disconnecting account:', error);
        this.toastService.error('Failed to disconnect account');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get platform authorization URL
   */
  getPlatformAuthUrl(platform: string): Observable<string> {
    return this.apiService.get<PlatformAuthResponse>(`${this.API_BASE}/auth/${platform}`).pipe(
      map(response => response.url),
      catchError(error => {
        console.error(`Error getting ${platform} auth URL:`, error);
        this.toastService.error(`Failed to get ${platform} authorization URL`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check platform connection status
   */
  checkPlatformStatus(platform: string): Observable<ConnectionStatus> {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.apiService.get<ConnectionStatus>(
      `${this.API_BASE}/status/${userId}/${platform}`
    ).pipe(
      map(status => ({
        ...status,
        account: status.account ? mapBackendToFrontendAccount(status.account) : undefined
      })),
      catchError(error => {
        console.error(`Error checking ${platform} status:`, error);
        this.toastService.error(`Failed to check ${platform} connection status`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get available platform information
   */
  getPlatformInfo(): Observable<PlatformInfo[]> {
    return of([
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
    ]);
  }

  /**
   * Invalidate the accounts cache
   */
  private invalidateCache(): void {
    this.accountsCache$ = null;
    this.cacheService.clear(this.CONNECTED_ACCOUNTS_CACHE_KEY);
  }
}