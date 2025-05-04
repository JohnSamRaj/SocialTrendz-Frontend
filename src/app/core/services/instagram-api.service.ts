/**
 * Instagram API Service
 * 
 * Provides a mock implementation of Instagram API integration.
 * In a real application, this would authenticate with Instagram's API.
 */
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interface for Instagram account data
 */
interface InstagramAccount {
  id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  followers: number;
  following: number;
  bio: string;
}

/**
 * Interface for Instagram post response
 */
interface InstagramPostResponse {
  success: boolean;
  postId: string;
  imageUrl: string;
  caption: string;
  title?: string;
  createdAt: string;
}

/**
 * Interface for API responses
 */
interface ApiResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class InstagramApiService {
  // Connection state
  private isConnected = false;
  
  // API response delays (ms)
  private readonly SHORT_DELAY = 500;
  private readonly MEDIUM_DELAY = 800;
  private readonly LONG_DELAY = 1200;
  
  // Demo account data
  private mockAccount: InstagramAccount = {
    id: 'instagram123456',
    username: 'socialtrendz_demo',
    fullName: 'SocialTrendz Demo',
    profilePicture: 'assets/icons/instagram-logo.svg',
    followers: 1250,
    following: 420,
    bio: 'This is a mock Instagram account for demonstration purposes.'
  };

  constructor() {
    if (!environment.production) {
      console.log('Instagram API Service initialized in demo mode');
    }
  }

  /**
   * Gets the authorization URL for Instagram OAuth flow
   * @returns Observable with auth URL
   */
  getAuthUrl(): Observable<{ url: string }> {
    // In a real app, this would be Instagram's OAuth URL with your app's client ID
    // e.g., https://api.instagram.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user_profile,user_media&response_type=code
    return of({ 
      url: 'https://example.com/mock-instagram-auth' 
    }).pipe(delay(this.SHORT_DELAY));
  }

  /**
   * Checks if the user has an Instagram account connected
   * @returns Observable with connection status and account info
   */
  checkInstagramStatus(): Observable<{ connected: boolean, account?: InstagramAccount }> {
    return of({
      connected: this.isConnected,
      account: this.isConnected ? this.mockAccount : undefined
    }).pipe(delay(this.SHORT_DELAY));
  }

  /**
   * Posts content to Instagram
   * @param imageUrl URL of the image to post
   * @param caption Caption for the post
   * @param title Optional title for the post
   * @returns Observable with post result
   */
  postToInstagram(imageUrl: string, caption: string, title?: string): Observable<InstagramPostResponse> {
    // Verify account connection
    if (!this.isConnected) {
      return throwError(() => new Error('Instagram account not connected'));
    }
    
    // Generate a unique post ID for demo purposes
    const postId = 'post_' + Date.now().toString(36);
    
    // Return a successful post response
    return of({
      success: true,
      postId,
      imageUrl,
      caption,
      title,
      createdAt: new Date().toISOString()
    }).pipe(delay(this.MEDIUM_DELAY));
  }

  /**
   * Disconnects the Instagram account
   * @returns Observable with disconnect result
   */
  disconnectInstagram(): Observable<ApiResponse> {
    // Verify account connection
    if (!this.isConnected) {
      return throwError(() => new Error('No Instagram account connected'));
    }
    
    // Update connection state
    this.isConnected = false;
    
    return of({
      success: true,
      message: 'Instagram account disconnected successfully'
    }).pipe(delay(this.SHORT_DELAY));
  }
  
  /**
   * Connects an Instagram account (mock implementation)
   * In a real app, this would process the OAuth callback code
   * @returns Observable with connection result
   */
  connectInstagramAccount(): Observable<ApiResponse> {
    // Update connection state
    this.isConnected = true;
    
    return of({
      success: true,
      message: 'Instagram account connected successfully',
      account: this.mockAccount
    }).pipe(delay(this.MEDIUM_DELAY));
  }
}