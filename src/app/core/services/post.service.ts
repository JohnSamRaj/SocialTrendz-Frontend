import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ToastService } from '../../shared/services/toast.service';
import { Post, DraftPost } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly API_BASE = '/api/posts';

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  /**
   * Create a new post
   */
  createPost(post: DraftPost): Observable<Post> {
    return this.apiService.post<Post>(this.API_BASE, post).pipe(
      catchError(error => {
        this.toastService.error('Failed to create post');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all drafts
   */
  getDrafts(): Observable<Post[]> {
    return this.apiService.get<Post[]>(`${this.API_BASE}/drafts`).pipe(
      catchError(error => {
        this.toastService.error('Failed to fetch drafts');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get post by ID
   */
  getPostById(postId: string): Observable<Post> {
    return this.apiService.get<Post>(`${this.API_BASE}/${postId}`).pipe(
      catchError(error => {
        this.toastService.error('Failed to fetch post');
        return throwError(() => error);
      })
    );
  }

  /**
   * Update post
   */
  updatePost(postId: string, updates: Partial<Post>): Observable<Post> {
    return this.apiService.put<Post>(`${this.API_BASE}/${postId}`, updates).pipe(
      catchError(error => {
        this.toastService.error('Failed to update post');
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete post
   */
  deletePost(postId: string): Observable<void> {
    return this.apiService.delete(`${this.API_BASE}/${postId}`).pipe(
      map(() => void 0),
      catchError(error => {
        this.toastService.error('Failed to delete post');
        return throwError(() => error);
      })
    );
  }

  /**
   * Schedule post
   */
  schedulePost(postId: string, scheduledDate: Date): Observable<Post> {
    return this.apiService.put<Post>(`${this.API_BASE}/${postId}/schedule`, {
      scheduledDate
    }).pipe(
      catchError(error => {
        this.toastService.error('Failed to schedule post');
        return throwError(() => error);
      })
    );
  }

  /**
   * Publish post
   */
  publishPost(postId: string): Observable<Post> {
    return this.apiService.put<Post>(`${this.API_BASE}/${postId}/publish`, {}).pipe(
      catchError(error => {
        this.toastService.error('Failed to publish post');
        return throwError(() => error);
      })
    );
  }
} 