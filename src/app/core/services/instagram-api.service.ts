/**
 * Instagram API Service
 * 
 * Provides a mock implementation of Instagram API integration.
 * In a real application, this would authenticate with Instagram's API.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { HttpXhrBackend } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * Interface for Instagram account data
 */
interface InstagramAccount {
  id: string;
  user_id: string;
  platform: string;
  account_id: string;
  account_name: string;
  profile_image_url: string;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  token_expires_at: string;
  scopes: string[];
}
/**
 * Interface for Instagram post response
 */
interface InstagramPostResponse {
  success: boolean;
  postId: string;
  error?: string;
}

/**
 * Interface for API responses
 */
interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface InstagramError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

interface InstagramAnalytics {
  followers: number;
  following: number;
  posts: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  reach: {
    total: number;
    organic: number;
    paid: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InstagramApiService {
  private readonly API_URL = `${environment.apiUrl}/social-accounts`;
  private readonly TIMEOUT = 30000; // 30 seconds
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Add timeout to all HTTP requests
    this.http = new HttpClient(new HttpXhrBackend({
      build: () => {
        const xhr = new XMLHttpRequest();
        xhr.timeout = this.TIMEOUT;
        return xhr;
      }
    }));
  }

  /**
   * Gets the authorization URL for Instagram OAuth flow
   * @returns Observable with auth URL
   */
  getAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.API_URL}/instagram/auth-url`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Checks if the user has an Instagram account connected
   * @returns Observable with connection status and account info
   */
  checkInstagramStatus(): Observable<{ connected: boolean, account?: InstagramAccount }> {
    return this.http.get<InstagramAccount[]>(`${this.API_URL}?platform=instagram`)
      .pipe(
        map(accounts => ({
          connected: accounts.length > 0,
          account: accounts[0]
        })),
        catchError(error => {
          console.error('Error checking Instagram status:', error);
          return of({ connected: false });
        })
      );
  }

  /**
   * Posts content to Instagram
   * @param imageUrl URL of the image to post
   * @param caption Caption for the post
   * @param title Optional title for the post
   * @returns Observable with post result
   */
  postToInstagram(imageUrl: string, caption: string, title?: string): Observable<InstagramPostResponse> {
    if (!imageUrl || !caption) {
      return throwError(() => new Error('Image URL and caption are required'));
    }

    return this.http.post<InstagramPostResponse>(`${this.API_URL}/instagram/post`, {
      imageUrl,
      caption,
      title
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Disconnects the Instagram account
   * @returns Observable with disconnect result
   */
  disconnectInstagram(): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API_URL}/instagram`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  /**
   * Connects an Instagram account (mock implementation)
   * In a real app, this would process the OAuth callback code
   * @returns Observable with connection result
   */
  connectInstagramAccount(code: string): Observable<ApiResponse> {
    if (!code) {
      return throwError(() => new Error('Authorization code is required'));
    }

    return this.http.post<ApiResponse>(`${this.API_URL}/instagram/connect`, { code })
      .pipe(
        catchError(this.handleError)
      );
  }

    // Get Instagram account details
  getInstagramAccount(): Observable<InstagramAccount> {
    return this.http.get<InstagramAccount>(`${this.API_URL}/instagram`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Refresh Instagram token
  refreshToken(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/instagram/refresh`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get Instagram analytics
  getAnalytics(): Observable<InstagramAnalytics> {
    return this.http.get<InstagramAnalytics>(`${this.API_URL}/instagram/analytics`)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || errorMessage;
    }
    
    console.error('Instagram API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}