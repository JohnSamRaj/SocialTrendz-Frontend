import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { ConnectedAccount } from '../models/connected-account.model';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocialAccountsApiService {
  // Cache key constants for better organization
  private readonly CONNECTED_ACCOUNTS_CACHE_KEY = 'connected_accounts';
  private readonly CONNECTED_ACCOUNTS_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

  // In-memory cache for frequently accessed data to prevent multiple HTTP requests
  private accountsCache$: Observable<ConnectedAccount[]> | null = null;

  constructor(
    private apiService: ApiService,
    private cacheService: CacheService
  ) {}

  /**
   * Get all connected social accounts for the current user
   * Uses caching to avoid repeated API calls in a short timeframe
   * 
   * @returns Observable with array of connected accounts
   */
  getConnectedAccounts(): Observable<ConnectedAccount[]> {
    // Check if we already have a request in progress
    if (this.accountsCache$) {
      return this.accountsCache$;
    }

    // Get from cache or API with shareReplay to share the response with multiple subscribers
    this.accountsCache$ = this.apiService.getCached<ConnectedAccount[]>(
      'social-accounts', 
      {}, 
      this.CONNECTED_ACCOUNTS_CACHE_TIME
    ).pipe(
      // Share the same response with all subscribers
      shareReplay(1),
      // Handle any errors from the API
      catchError(error => {
        console.error('Error fetching connected accounts:', error);
        // Reset the cache on error
        this.accountsCache$ = null;
        // If API is not available in development, use mock data
        if (environment.features.enableMockData) {
          return of([{
            id: '1',
            platform: 'instagram' as 'instagram',
            username: 'socialtrendz_demo',
            displayName: 'SocialTrendz Demo',
            profilePicture: 'assets/icons/instagram-logo.svg',
            isConnected: true,
            userId: 1
          }]);
        }
        return throwError(() => error);
      }),
      // Clear the cache reference after a timeout
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
   * 
   * @param accountData Social account data to connect
   * @returns Observable with the connected account
   */
  connectAccount(accountData: Partial<ConnectedAccount>): Observable<ConnectedAccount> {
    return this.apiService.post<ConnectedAccount>('social-accounts/connect', accountData).pipe(
      tap(() => {
        // Invalidate cache after connecting a new account
        this.invalidateCache();
      }),
      catchError(error => {
        console.error('Error connecting account:', error);
        // If API is not available in development, use mock data
        if (environment.features.enableMockData) {
          const defaultPlatform = 'instagram' as 'instagram' | 'facebook' | 'twitter' | 'linkedin';
          const newAccount: ConnectedAccount = {
            id: Math.random().toString(36).substring(2, 15),
            platform: (accountData.platform as 'instagram' | 'facebook' | 'twitter' | 'linkedin') || defaultPlatform,
            username: accountData.username || 'new_user',
            displayName: accountData.displayName || 'New User',
            profilePicture: accountData.profilePicture || 'assets/icons/user-placeholder.svg',
            isConnected: true,
            userId: 1
          };
          return of(newAccount);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Disconnect a social account
   * 
   * @param accountId ID of the account to disconnect
   * @returns Observable with success status
   */
  disconnectAccount(accountId: string): Observable<boolean> {
    return this.apiService.post<{ success: boolean }>(`social-accounts/${accountId}/disconnect`, {}).pipe(
      map(response => response.success),
      tap(() => {
        // Invalidate cache after disconnecting an account
        this.invalidateCache();
      }),
      catchError(error => {
        console.error('Error disconnecting account:', error);
        // If API is not available in development, use mock data
        if (environment.features.enableMockData) {
          return of(true);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Instagram authorization URL
   * 
   * @returns Observable with the authorization URL
   */
  getInstagramAuthUrl(): Observable<string> {
    return this.apiService.get<{ url: string }>('social-accounts/instagram/auth-url').pipe(
      map(response => response.url),
      catchError(error => {
        console.error('Error getting Instagram auth URL:', error);
        // If API is not available in development, use mock data
        if (environment.features.enableMockData) {
          return of('https://api.example.com/oauth/instagram');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Exchange Instagram authorization code for access token
   * 
   * @param code Authorization code from Instagram
   * @returns Observable with the connected account
   */
  exchangeInstagramCode(code: string): Observable<ConnectedAccount> {
    return this.apiService.post<ConnectedAccount>('social-accounts/instagram/exchange-code', { code }).pipe(
      tap(() => {
        // Invalidate cache after connecting a new account
        this.invalidateCache();
      }),
      catchError(error => {
        console.error('Error exchanging Instagram code:', error);
        // If API is not available in development, use mock data
        if (environment.features.enableMockData && code) {
          const mockAccount: ConnectedAccount = {
            id: Math.random().toString(36).substring(2, 15),
            platform: 'instagram' as 'instagram',
            username: 'instagram_user',
            displayName: 'Instagram User',
            profilePicture: 'assets/icons/instagram-logo.svg',
            isConnected: true,
            userId: 1,
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
          };
          return of(mockAccount);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Invalidate the accounts cache to force fresh data on next request
   */
  private invalidateCache(): void {
    this.accountsCache$ = null;
    this.cacheService.clear(this.CONNECTED_ACCOUNTS_CACHE_KEY);
  }
}