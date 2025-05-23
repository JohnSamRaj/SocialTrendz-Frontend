/**
 * Instagram Service
 * 
 * Provides Instagram-specific functionality by wrapping DataService.
 * Handles post management, analytics and account management for Instagram platform.
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Post, SavedPost, PostStatus } from '../models/post.model';
import { ConnectedAccount } from '../models/connected-account.model';
import { AnalyticsOverview } from '../models/analytics.model';
import { DataService } from './data.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class InstagramService {
  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {}

  private getCurrentUserId(): number {
    const user = this.authService.getCurrentUser();
    if (!user?.id) throw new Error('No authenticated user or invalid user ID');
    return user.id;
  }

  // Post Management Methods

  /**
   * Gets all posts for the current user
   * @returns Observable of posts array
   */
  getPosts(): Observable<Post[]> {
    return this.dataService.getPosts(this.getCurrentUserId());
  }
  
  /**
   * Gets only published posts
   * @returns Observable of published posts
   */
  getPublishedPosts(): Observable<Post[]> {
    return this.dataService.getPosts(this.getCurrentUserId()).pipe(
      map(posts => posts.filter(post => post.status === PostStatus.PUBLISHED))
    );
  }
  
  /**
   * Gets only draft posts
   * @returns Observable of draft posts
   */
  getSavedPosts(): Observable<Post[]> {
    return this.dataService.getPosts(this.getCurrentUserId()).pipe(
      map(posts => posts.filter(post => post.status === PostStatus.SAVED))
    );
  }

  /**
   * Gets scheduled posts ordered by scheduled date
   * @returns Observable of scheduled posts
   */
  getScheduledPosts(): Observable<Post[]> {
    return this.dataService.getPosts(this.getCurrentUserId()).pipe(
      map(posts => posts
        .filter(post => post.status === PostStatus.SCHEDULED)
        .sort((a, b) => {
          if (!a.scheduled_at || !b.scheduled_at) return 0;
          return a.scheduled_at.getTime() - b.scheduled_at.getTime();
        })
      )
    );
  }

  /**
   * Gets a specific post by ID
   * @param postId Post identifier
   * @returns Observable with post or undefined
   */
  getPostById(postId: string): Observable<Post> {
    return this.dataService.getPostById(postId);
  }

  /**
   * Creates a new Instagram post
   * @param post Post data
   * @returns Observable with created post
   */
  createPost(post: SavedPost): Observable<Post> {
    // Ensure the platform is set to Instagram
    const instagramPost: SavedPost = {
      ...post,
      platform: 'instagram'
    };
    return this.dataService.createPost(instagramPost);
  }

  /**
   * Updates an existing post
   * @param postId Post identifier
   * @param updates Post updates
   * @returns Observable with updated post
   */
  updatePost(postId: string, updates: Partial<Post>): Observable<Post> {
    return this.dataService.updatePost(postId, updates);
  }

  /**
   * Deletes a post
   * @param postId Post identifier
   * @returns Observable indicating success
   */
  deletePost(postId: string): Observable<unknown> {
    return this.dataService.deletePost(postId);
  }

  /**
   * Schedules a post for future publishing
   * @param postId Post identifier
   * @param date Scheduled date
   * @returns Observable with updated post
   */
  schedulePost(postId: string, date: Date): Observable<Post> {
    return this.dataService.schedulePost(postId, date);
  }

  /**
   * Publishes a post immediately
   * @param postId Post identifier
   * @returns Observable with updated post
   */
  publishPost(postId: string): Observable<Post> {
    return this.dataService.publishPost(postId);
  }

  // Account Management Methods

  /**
   * Gets all connected social accounts for the current user
   * @returns Observable with connected accounts
   */
  getConnectedAccounts(): Observable<ConnectedAccount[]> {
    return this.dataService.getConnectedAccounts(this.getCurrentUserId());
  }

  /**
   * Gets Instagram-specific accounts
   * @returns Observable with Instagram accounts
   */
  getInstagramAccounts(): Observable<ConnectedAccount[]> {
    return this.dataService.getConnectedAccounts(this.getCurrentUserId()).pipe(
      map(accounts => accounts.filter(account => account.platform === 'instagram'))
    );
  }

  /**
   * Gets Instagram insights and analytics data
   * @returns Observable with analytics data
   */
  getInstagramInsights(): Observable<AnalyticsOverview> {
    const userId = this.getCurrentUserId();
    const timeframe = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    };
    return this.dataService.getAnalytics(userId, timeframe);
  }
}