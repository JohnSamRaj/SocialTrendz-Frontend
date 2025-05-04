import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) { }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Create HTTP headers with auth token
   */
  private createHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any) {
    console.error('API error:', error);
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && error.error.message) {
      // Server-side error with message
      errorMessage = error.error.message;
    } else if (error.status) {
      // HTTP status code error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission to access this resource.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * HTTP GET request
   */
  get<T>(endpoint: string, params: any = {}): Observable<T> {
    const headers = this.createHeaders();
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { headers, params })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }
  
  /**
   * HTTP GET request with caching
   * @param endpoint API endpoint to call
   * @param params Query parameters
   * @param cacheTime Time in milliseconds to cache the response (optional)
   * @returns Observable with the response, from cache if available
   */
  getCached<T>(endpoint: string, params: any = {}, cacheTime?: number): Observable<T> {
    const headers = this.createHeaders();
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    
    // Create the API request observable
    const request = this.http.get<T>(`${this.apiUrl}/${endpoint}`, { headers, params })
      .pipe(
        catchError(error => this.handleError(error))
      );
    
    // Use the caching service to handle the request
    return this.cacheService.cacheResponse<T>(cacheKey, request, cacheTime);
  }

  /**
   * HTTP POST request
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    const headers = this.createHeaders();
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, { headers })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * HTTP PUT request
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    const headers = this.createHeaders();
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data, { headers })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * HTTP DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    const headers = this.createHeaders();
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Invalidate cache for a specific endpoint or pattern
   * @param endpointPattern The endpoint pattern to invalidate
   */
  invalidateCache(endpointPattern: string): void {
    // Find all cache keys that match the pattern
    this.cacheService.clearAll();
  }
}