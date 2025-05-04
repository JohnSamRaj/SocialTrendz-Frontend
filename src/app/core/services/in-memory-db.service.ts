import { Injectable } from '@angular/core';
import { User, AuthCredentials, RegisterCredentials } from '../models/user.model';
import { Observable, of, throwError } from 'rxjs';
import { Post, PostStatus, PostType, DraftPost } from '../models/post.model';
import { AnalyticsOverview } from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class InMemoryDbService {
  private users: User[] = [
    {
      id: 1,
      fullName: 'Demo User',
      email: 'demo@example.com',
      profilePicture: 'https://via.placeholder.com/150',
      createdAt: new Date('2023-01-01'),
      lastLogin: new Date()
    }
  ];

  private posts: Post[] = [
    {
      id: '1',
      caption: 'Check out this amazing sunset! #nature #photography',
      mediaItems: [
        {
          id: 'm1',
          url: 'https://images.unsplash.com/photo-1496449903678-68ddcb189a24',
          type: 'image'
        }
      ],
      hashtags: ['nature', 'photography', 'sunset'],
      status: PostStatus.PUBLISHED,
      type: PostType.IMAGE,
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2023-06-01'),
      publishedAt: new Date('2023-06-01'),
      userId: 1,
      platform: 'instagram',
      engagement: {
        likes: 120,
        comments: 14,
        shares: 5,
        saves: 10,
        impressions: 500,
        reach: 450
      }
    },
    {
      id: '2',
      caption: 'New product launch coming soon! Stay tuned for updates. #business #launch',
      mediaItems: [
        {
          id: 'm2',
          url: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93',
          type: 'image'
        }
      ],
      hashtags: ['business', 'launch', 'product'],
      status: PostStatus.SCHEDULED,
      type: PostType.IMAGE,
      scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 1,
      platform: 'instagram'
    },
    {
      id: '3',
      caption: 'Draft post about our team retreat',
      mediaItems: [
        {
          id: 'm3',
          url: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a',
          type: 'image'
        }
      ],
      hashtags: ['team', 'retreat', 'company'],
      status: PostStatus.DRAFT,
      type: PostType.CAROUSEL,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 1,
      platform: 'instagram'
    }
  ];

  private passwords: Map<string, string> = new Map([
    ['demo@example.com', 'password123']
  ]);

  constructor() { }

  // Auth methods
  login(credentials: AuthCredentials): Observable<User> {
    const user = this.users.find(u => u.email === credentials.email);
    
    if (!user || this.passwords.get(credentials.email) !== credentials.password) {
      return throwError(() => new Error('Invalid email or password'));
    }

    // Update last login
    user.lastLogin = new Date();
    
    return of({...user});
  }

  register(credentials: RegisterCredentials): Observable<User> {
    if (this.users.some(u => u.email === credentials.email)) {
      return throwError(() => new Error('Email already in use'));
    }

    const newUser: User = {
      id: this.users.length + 1,
      fullName: credentials.fullName,
      email: credentials.email,
      createdAt: new Date(),
      lastLogin: new Date()
    };

    this.users.push(newUser);
    this.passwords.set(credentials.email, credentials.password);

    return of({...newUser});
  }

  // Posts methods
  getPosts(userId: number): Observable<Post[]> {
    return of(this.posts.filter(post => post.userId === userId));
  }

  getPostById(postId: string): Observable<Post | undefined> {
    return of(this.posts.find(post => post.id === postId));
  }

  createPost(post: DraftPost): Observable<Post> {
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
      status: post.scheduledFor ? PostStatus.SCHEDULED : PostStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.posts.push(newPost);
    return of({...newPost});
  }

  updatePost(postId: string, updates: Partial<Post>): Observable<Post> {
    const postIndex = this.posts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) {
      return throwError(() => new Error('Post not found'));
    }

    const updatedPost = {
      ...this.posts[postIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.posts[postIndex] = updatedPost;
    return of({...updatedPost});
  }

  deletePost(postId: string): Observable<boolean> {
    const initialLength = this.posts.length;
    this.posts = this.posts.filter(p => p.id !== postId);
    
    return of(this.posts.length < initialLength);
  }

  // Analytics methods
  getAnalytics(userId: number): Observable<AnalyticsOverview> {
    // Generate mock analytics data
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const mockData: AnalyticsOverview = {
      timeframe: {
        start: thirtyDaysAgo,
        end: now
      },
      accountGrowth: Array.from({ length: 30 }, (_, i) => {
        const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const followers = 1000 + i * 10 + Math.floor(Math.random() * 20);
        const previousFollowers = i === 0 ? 1000 : 1000 + (i - 1) * 10 + Math.floor(Math.random() * 20);
        const followersGrowth = followers - previousFollowers;
        const followersGrowthPercentage = (followersGrowth / previousFollowers) * 100;
        
        return {
          date,
          followers,
          followersGrowth,
          followersGrowthPercentage
        };
      }),
      engagementMetrics: Array.from({ length: 30 }, (_, i) => {
        const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const likes = 50 + Math.floor(Math.random() * 50);
        const comments = 5 + Math.floor(Math.random() * 15);
        const shares = 2 + Math.floor(Math.random() * 8);
        const saves = 3 + Math.floor(Math.random() * 12);
        const impressions = 500 + Math.floor(Math.random() * 300);
        const reach = 450 + Math.floor(Math.random() * 250);
        const engagementRate = ((likes + comments + shares + saves) / reach) * 100;
        
        return {
          date,
          likes,
          comments,
          shares,
          saves,
          impressions,
          reach,
          engagementRate
        };
      }),
      contentPerformance: this.posts
        .filter(post => post.userId === userId && post.status === PostStatus.PUBLISHED)
        .map(post => ({
          postId: post.id,
          postType: post.type,
          publishedAt: post.publishedAt || new Date(),
          likes: post.engagement?.likes || Math.floor(Math.random() * 100),
          comments: post.engagement?.comments || Math.floor(Math.random() * 20),
          shares: post.engagement?.shares || Math.floor(Math.random() * 10),
          saves: post.engagement?.saves || Math.floor(Math.random() * 15),
          impressions: post.engagement?.impressions || 500 + Math.floor(Math.random() * 300),
          reach: post.engagement?.reach || 450 + Math.floor(Math.random() * 250),
          engagementRate: Math.random() * 5 + 1 // 1-6%
        })),
      audienceDemographics: {
        ageRanges: [
          { range: '13-17', percentage: 5 },
          { range: '18-24', percentage: 28 },
          { range: '25-34', percentage: 35 },
          { range: '35-44', percentage: 18 },
          { range: '45-54', percentage: 9 },
          { range: '55+', percentage: 5 }
        ],
        genders: [
          { gender: 'Female', percentage: 65 },
          { gender: 'Male', percentage: 34 },
          { gender: 'Other', percentage: 1 }
        ],
        topLocations: [
          { location: 'United States', percentage: 45 },
          { location: 'United Kingdom', percentage: 15 },
          { location: 'Canada', percentage: 12 },
          { location: 'Australia', percentage: 8 },
          { location: 'Germany', percentage: 5 }
        ],
        activeHours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          activity: i >= 8 && i <= 23 
            ? 10 + Math.floor(Math.random() * 90) 
            : Math.floor(Math.random() * 20)
        }))
      }
    };
    
    return of(mockData);
  }
}
