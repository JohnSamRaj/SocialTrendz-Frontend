/**
 * Data Service
 * 
 * This service provides data management for the application.
 * In a real application, this would connect to backend APIs.
 * For this boilerplate, it uses in-memory data.
 */
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Post, PostStatus, PostType, DraftPost } from '../models/post.model';
import { ConnectedAccount, mapBackendToFrontendAccount } from '../models/connected-account.model';
import { AnalyticsOverview } from '../models/analytics.model';
import { ApiService } from './api.service';
import { ToastService } from '../../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly API_BASE = '/api';

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  getUserData(userId: number): Observable<User> {
    return this.apiService.get<User>(`${this.API_BASE}/users/${userId}`).pipe(
      catchError(error => {
        this.toastService.error('Failed to fetch user data');
        return throwError(() => error);
      })
    );
  }

  updateUserData(userId: number, data: Partial<User>): Observable<User> {
    return this.apiService.put<User>(`${this.API_BASE}/users/${userId}`, data).pipe(
      catchError(error => {
        this.toastService.error('Failed to update user data');
        return throwError(() => error);
      })
    );
  }

  getConnectedAccounts(userId: number): Observable<ConnectedAccount[]> {
    return this.apiService.get<ConnectedAccount[]>(`${this.API_BASE}/social-accounts/connected/${userId}`).pipe(
      map(accounts => accounts.map(mapBackendToFrontendAccount)),
      catchError(error => {
        // this.toastService.error('Failed to fetch connected accounts');
        return throwError(() => error);
      })
    );
  }

  getUserConnectedAccounts(userId: number): Observable<ConnectedAccount[]> {
    return this.getConnectedAccounts(userId).pipe(
      map(accounts => accounts.filter(account => account.user_id === userId))
    );
  }

  getPosts(userId: number): Observable<Post[]> {
    return this.apiService.get<Post[]>(`${this.API_BASE}/posts/user/${userId}`).pipe(
      catchError(error => {
        // this.toastService.error('Failed to fetch posts');
        return throwError(() => error);
      })
    );
  }

  getPostById(postId: string): Observable<Post> {
    return this.apiService.get<Post>(`${this.API_BASE}/posts/${postId}`).pipe(
      catchError(error => {
        this.toastService.error('Failed to fetch post');
        return throwError(() => error);
      })
    );
  }

  createPost(post: DraftPost): Observable<Post> {
    return this.apiService.post<Post>(`${this.API_BASE}/posts`, post).pipe(
      catchError(error => {
        this.toastService.error('Failed to create post');
        return throwError(() => error);
      })
    );
  }

  updatePost(postId: string, updates: Partial<Post>): Observable<Post> {
    return this.apiService.put<Post>(`${this.API_BASE}/posts/${postId}`, updates).pipe(
      catchError(error => {
        this.toastService.error('Failed to update post');
        return throwError(() => error);
      })
    );
  }

  deletePost(postId: string): Observable<unknown> {
    return this.apiService.delete(`${this.API_BASE}/posts/${postId}`).pipe(
      catchError(error => {
        this.toastService.error('Failed to delete post');
        return throwError(() => error);
      })
    );
  }

  schedulePost(postId: string, date: Date): Observable<Post> {
    return this.apiService.put<Post>(`${this.API_BASE}/posts/${postId}/schedule`, { scheduledFor: date }).pipe(
      catchError(error => {
        this.toastService.error('Failed to schedule post');
        return throwError(() => error);
      })
    );
  }

  publishPost(postId: string): Observable<Post> {
    return this.apiService.put<Post>(`${this.API_BASE}/posts/${postId}/publish`, {}).pipe(
      catchError(error => {
        this.toastService.error('Failed to publish post');
        return throwError(() => error);
      })
    );
  }

  getAnalytics(userId: number, timeframe: { start: Date; end: Date }): Observable<AnalyticsOverview> {
    return this.apiService.get<AnalyticsOverview>(`${this.API_BASE}/analytics/${userId}`, {
      start: timeframe.start.toISOString(),
      end: timeframe.end.toISOString()
    }).pipe(
      catchError(error => {
        this.toastService.error('Failed to fetch analytics data');
        return throwError(() => error);
      })
    );
  }
}