/**
 * Data Service
 * 
 * This service provides data management for the application.
 * In a real application, this would connect to backend APIs.
 * For this boilerplate, it uses in-memory data.
 */
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Post, PostStatus, PostType, DraftPost } from '../models/post.model';
import { ConnectedAccount } from '../models/connected-account.model';
import { AnalyticsOverview } from '../models/analytics.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // User state management
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // In-memory data stores
  private users = new Map<string, User>();
  private posts: Post[] = [];
  private connectedAccounts: ConnectedAccount[] = [];

  // Simulated API response delays (ms)
  private readonly SHORT_DELAY = 500;
  private readonly MEDIUM_DELAY = 800;
  private readonly LONG_DELAY = 1200;

  constructor() {
    this.initializeData();
  }

  /**
   * Sets up initial demo data
   */
  private initializeData(): void {
    // Create demo user
    const demoUser = this.createDemoUser();
    this.users.set(demoUser.email, demoUser);
    
    // Create demo posts
    this.posts = this.createDemoPosts(demoUser.id as number);
    
    // Create demo connected accounts
    this.connectedAccounts = this.createDemoConnectedAccounts(demoUser.id as number);
  }

  /**
   * Creates a demo user for the application
   */
  private createDemoUser(): User {
    return {
      id: 1,
      fullName: 'Demo User',
      email: 'demo@example.com',
      profilePicture: 'assets/images/default-profile.svg',
      createdAt: new Date('2023-01-15'),
      lastLogin: new Date(),
      isVerified: true,
      hasCompletedOnboarding: true,
      connectedPlatforms: ['instagram']
    };
  }

  /**
   * Creates demo posts for a user
   */
  private createDemoPosts(userId: number): Post[] {
    return [
      {
        id: '1',
        caption: 'This is a sample published post #socialmedia #marketing',
        mediaItems: [{
          id: '1-1',
          url: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546',
          type: 'image'
        }],
        hashtags: ['socialmedia', 'marketing'],
        status: PostStatus.PUBLISHED,
        type: PostType.IMAGE,
        publishedAt: new Date('2023-06-15'),
        createdAt: new Date('2023-06-14'),
        updatedAt: new Date('2023-06-15'),
        userId,
        platform: 'instagram',
        engagement: {
          likes: 120,
          comments: 18,
          shares: 5,
          saves: 10,
          impressions: 500,
          reach: 450
        }
      },
      {
        id: '2',
        caption: 'This is a scheduled post for tomorrow #planning',
        mediaItems: [{
          id: '2-1',
          url: 'https://images.unsplash.com/photo-1581287053822-fd7bf4f4bfec',
          type: 'image'
        }],
        hashtags: ['planning'],
        status: PostStatus.SCHEDULED,
        type: PostType.IMAGE,
        scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        platform: 'instagram'
      },
      {
        id: '3',
        caption: 'Draft post example #draft',
        mediaItems: [{
          id: '3-1',
          url: 'https://images.unsplash.com/photo-1542435503-956c469947f6',
          type: 'image'
        }],
        hashtags: ['draft'],
        status: PostStatus.DRAFT,
        type: PostType.IMAGE,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        platform: 'instagram'
      }
    ];
  }

  /**
   * Creates demo connected accounts for a user
   */
  private createDemoConnectedAccounts(userId: number): ConnectedAccount[] {
    return [
      {
        id: '1',
        platform: 'instagram',
        username: 'demo_instagram',
        displayName: 'Demo Instagram',
        profilePicture: 'assets/icons/instagram-logo.svg',
        isConnected: true,
        userId
      }
    ];
  }

  /**
   * Gets the current logged-in user
   * @returns Current user or null if not logged in
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Checks if a user is logged in
   * @returns Boolean indicating login status
   */
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Authenticates a user by email and password
   * @param email User email
   * @param password User password
   * @returns Observable with authenticated user
   */
  login(email: string, password: string): Observable<User> {
    if (this.users.has(email)) {
      return this.handleExistingUserLogin(email);
    }
    
    return this.handleNewUserLogin(email);
  }

  /**
   * Handles login for existing users
   */
  private handleExistingUserLogin(email: string): Observable<User> {
    const user = this.users.get(email)!;
    user.lastLogin = new Date();
    
    this.persistUserSession(user);
    return of(user).pipe(delay(this.MEDIUM_DELAY));
  }

  /**
   * Handles login for new users (creates account)
   */
  private handleNewUserLogin(email: string): Observable<User> {
    const newUser: User = {
      id: Date.now(),
      fullName: email.split('@')[0],
      email,
      createdAt: new Date(),
      lastLogin: new Date(),
      isVerified: true,
      hasCompletedOnboarding: false,
      connectedPlatforms: []
    };
    
    this.users.set(email, newUser);
    this.persistUserSession(newUser);
    return of(newUser).pipe(delay(this.MEDIUM_DELAY));
  }

  /**
   * Persists user session in storage and updates state
   */
  private persistUserSession(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Logs out the current user
   * @returns Observable indicating success
   */
  logout(): Observable<boolean> {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    return of(true).pipe(delay(this.SHORT_DELAY));
  }

  /**
   * Gets all posts for the current user
   * @returns Observable with posts array
   */
  getPosts(): Observable<Post[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return of([]);
    }
    
    const userPosts = this.posts.filter(post => post.userId === currentUser.id);
    return of(userPosts).pipe(delay(this.MEDIUM_DELAY));
  }

  /**
   * Gets a specific post by ID
   * @param postId Post identifier
   * @returns Observable with post or undefined
   */
  getPostById(postId: string): Observable<Post | undefined> {
    const post = this.posts.find(post => post.id === postId);
    return of(post).pipe(delay(this.SHORT_DELAY));
  }

  /**
   * Creates a new post
   * @param draftPost Post data
   * @returns Observable with created post
   */
  createPost(draftPost: DraftPost): Observable<Post> {
    const newPost: Post = {
      id: Date.now().toString(),
      ...draftPost,
      status: PostStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.posts.push(newPost);
    return of(newPost).pipe(delay(this.MEDIUM_DELAY));
  }

  /**
   * Updates an existing post
   * @param postId Post identifier
   * @param updates Post updates
   * @returns Observable with updated post
   */
  updatePost(postId: string, updates: Partial<Post>): Observable<Post> {
    const index = this.posts.findIndex(post => post.id === postId);
    if (index === -1) {
      throw new Error('Post not found');
    }
    
    const updatedPost = {
      ...this.posts[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.posts[index] = updatedPost;
    return of(updatedPost).pipe(delay(this.MEDIUM_DELAY));
  }

  /**
   * Deletes a post
   * @param postId Post identifier
   * @returns Observable indicating success
   */
  deletePost(postId: string): Observable<boolean> {
    const index = this.posts.findIndex(post => post.id === postId);
    if (index === -1) {
      return of(false);
    }
    
    this.posts.splice(index, 1);
    return of(true).pipe(delay(this.MEDIUM_DELAY));
  }

  /**
   * Schedules a post for future publishing
   * @param postId Post identifier
   * @param date Scheduled date
   * @returns Observable with updated post
   */
  schedulePost(postId: string, date: Date): Observable<Post> {
    return this.updatePost(postId, {
      status: PostStatus.SCHEDULED,
      scheduledFor: date
    });
  }

  /**
   * Publishes a post immediately
   * @param postId Post identifier
   * @returns Observable with updated post
   */
  publishPost(postId: string): Observable<Post> {
    return this.updatePost(postId, {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date()
    });
  }

  /**
   * Gets connected social accounts for current user
   * @returns Observable with connected accounts
   */
  getConnectedAccounts(): Observable<ConnectedAccount[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return of([]);
    }
    
    const accounts = this.connectedAccounts.filter(account => account.userId === currentUser.id);
    return of(accounts).pipe(delay(this.MEDIUM_DELAY));
  }

  /**
   * Gets analytics data for current user's content
   * @returns Observable with analytics data
   */
  getAnalytics(): Observable<AnalyticsOverview> {
    return of(this.generateAnalyticsData()).pipe(delay(this.LONG_DELAY));
  }

  /**
   * Generates demo analytics data
   */
  private generateAnalyticsData(): AnalyticsOverview {
    const now = new Date();
    
    // Helper to create dates in the past
    const daysAgo = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      return date;
    };
    
    return {
      timeframe: {
        start: daysAgo(30),
        end: now
      },
      accountGrowth: Array.from({ length: 30 }, (_, i) => ({
        date: daysAgo(29 - i),
        followers: 1000 + i * 10,
        followersGrowth: 10,
        followersGrowthPercentage: 1
      })),
      engagementMetrics: Array.from({ length: 30 }, (_, i) => ({
        date: daysAgo(29 - i),
        likes: 50 + Math.floor(Math.random() * 50),
        comments: 5 + Math.floor(Math.random() * 15),
        shares: 2 + Math.floor(Math.random() * 8),
        saves: 3 + Math.floor(Math.random() * 10),
        impressions: 500 + Math.floor(Math.random() * 200),
        reach: 450 + Math.floor(Math.random() * 150),
        engagementRate: 2 + Math.random() * 3
      })),
      contentPerformance: this.posts
        .filter(post => post.status === PostStatus.PUBLISHED)
        .map(post => ({
          postId: post.id,
          postType: post.type,
          publishedAt: post.publishedAt || new Date(),
          likes: post.engagement?.likes || Math.floor(Math.random() * 100),
          comments: post.engagement?.comments || Math.floor(Math.random() * 20),
          shares: post.engagement?.shares || Math.floor(Math.random() * 10),
          saves: post.engagement?.saves || Math.floor(Math.random() * 15),
          impressions: post.engagement?.impressions || 500 + Math.floor(Math.random() * 500),
          reach: post.engagement?.reach || 400 + Math.floor(Math.random() * 400),
          engagementRate: Math.random() * 5
        })),
      audienceDemographics: {
        ageRanges: [
          { range: '18-24', percentage: 25 },
          { range: '25-34', percentage: 40 },
          { range: '35-44', percentage: 20 },
          { range: '45-54', percentage: 10 },
          { range: '55+', percentage: 5 }
        ],
        genders: [
          { gender: 'Female', percentage: 65 },
          { gender: 'Male', percentage: 32 },
          { gender: 'Other', percentage: 3 }
        ],
        topLocations: [
          { location: 'United States', percentage: 40 },
          { location: 'United Kingdom', percentage: 15 },
          { location: 'Canada', percentage: 12 },
          { location: 'Australia', percentage: 8 },
          { location: 'Germany', percentage: 5 }
        ],
        activeHours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          activity: 20 + Math.floor(Math.random() * 80)
        }))
      }
    };
  }

  /**
   * Restores user session from storage
   */
  tryRestoreSession(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return;
    
    try {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
    } catch (e) {
      console.error('Failed to parse stored user data', e);
      localStorage.removeItem('currentUser');
    }
  }
}