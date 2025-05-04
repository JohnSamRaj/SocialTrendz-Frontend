import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ConnectedAccount } from '../models/connected-account.model';

@Injectable({
  providedIn: 'root'
})
export class SocialAccountsApiService {
  // Mock connected accounts data
  private mockAccounts: ConnectedAccount[] = [
    {
      id: '1',
      platform: 'instagram',
      username: 'socialtrendz_demo',
      displayName: 'SocialTrendz Demo',
      profilePicture: 'assets/icons/instagram-logo.svg',
      isConnected: true,
      userId: 1
    }
  ];

  constructor() {}

  /**
   * Get all connected social accounts for the current user
   * 
   * @returns Observable with array of connected accounts
   */
  getConnectedAccounts(): Observable<ConnectedAccount[]> {
    return of(this.mockAccounts).pipe(
      delay(500) // Simulate network delay
    );
  }

  /**
   * Connect a new social account
   * 
   * @param accountData Social account data to connect
   * @returns Observable with the connected account
   */
  connectAccount(accountData: Partial<ConnectedAccount>): Observable<ConnectedAccount> {
    // Generate a new account with random ID
    const newAccount: ConnectedAccount = {
      id: Math.random().toString(36).substring(2, 15),
      platform: accountData.platform || 'instagram',
      username: accountData.username || 'new_user',
      displayName: accountData.displayName || 'New User',
      profilePicture: accountData.profilePicture || 'assets/icons/user-placeholder.svg',
      isConnected: true,
      userId: 1,
      ...accountData
    };

    // Add to mock accounts
    this.mockAccounts.push(newAccount);

    return of(newAccount).pipe(
      delay(700) // Simulate network delay
    );
  }

  /**
   * Disconnect a social account
   * 
   * @param accountId ID of the account to disconnect
   * @returns Observable with success status
   */
  disconnectAccount(accountId: string): Observable<boolean> {
    // Find account index
    const index = this.mockAccounts.findIndex(account => account.id === accountId);
    
    if (index !== -1) {
      // Update account to disconnected
      this.mockAccounts[index].isConnected = false;
      return of(true).pipe(
        delay(500) // Simulate network delay
      );
    }
    
    return of(false).pipe(
      delay(500) // Simulate network delay
    );
  }

  /**
   * Get Instagram authorization URL
   * 
   * @returns Observable with the authorization URL
   */
  getInstagramAuthUrl(): Observable<string> {
    // Return mock URL
    return of('https://example.com/mock-instagram-auth').pipe(
      delay(400) // Simulate network delay
    );
  }

  /**
   * Exchange Instagram authorization code for access token
   * 
   * @param code Authorization code from Instagram
   * @returns Observable with the connected account
   */
  exchangeInstagramCode(code: string): Observable<ConnectedAccount> {
    // If code is present, create a mock connected account
    if (code) {
      const mockAccount: ConnectedAccount = {
        id: Math.random().toString(36).substring(2, 15),
        platform: 'instagram',
        username: 'instagram_user',
        displayName: 'Instagram User',
        profilePicture: 'assets/icons/instagram-logo.svg',
        isConnected: true,
        userId: 1,
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      };
      
      // Add to mock accounts
      this.mockAccounts.push(mockAccount);
      
      return of(mockAccount).pipe(
        delay(800) // Simulate network delay
      );
    }
    
    return throwError(() => new Error('Invalid authorization code'));
  }
}