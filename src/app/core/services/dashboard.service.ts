import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Post } from '../models/post.model';
import { environment } from '../../../environments/environment';

interface DashboardData {
  posts: Post[];
  analytics: {
    engagementRate: number;
    followersGrowth: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get user's dashboard data including posts and analytics
   */
  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }

  /**
   * Get recent posts
   */
  getRecentPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/recent-posts`);
  }

  /**
   * Get draft posts
   */
  getDraftPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/draft-posts`);
  }

  /**
   * Get scheduled posts
   */
  getScheduledPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/scheduled-posts`);
  }

  /**
   * Get user's analytics data
   */
  getAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics`);
  }

  /**
   * Get user's profile data
   */
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  /**
   * Update user's onboarding status
   */
  updateOnboardingStatus(completed: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/onboarding`, { completed });
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}`);
  }

  publishPost(postId: string): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts/${postId}/publish`, {});
  }
} 