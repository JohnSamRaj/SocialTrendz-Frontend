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
      full_name: 'Demo User',
      email: 'demo@example.com',
      profile_picture: 'https://via.placeholder.com/150',
      created_at: new Date('2023-01-01').toISOString(),
      last_login: new Date().toISOString()
    }
  ];

  private posts: Post[] = [
    {
      id: '1',
      title: 'Check out this amazing sunset! #nature #photography',
      description: 'Check out this amazing sunset! #nature #photography',
      media_items: [
        {
          id: 'm1',
          url: 'https://images.unsplash.com/photo-1496449903678-68ddcb189a24',
          type: 'image'
        }
      ],
      image_urls: ['https://images.unsplash.com/photo-1496449903678-68ddcb189a24'],
      is_draft: false,
      hashtags: ['nature', 'photography', 'sunset'],
      status: PostStatus.PUBLISHED,
      type: PostType.IMAGE,
      created_at: new Date('2023-06-01'),
      updated_at: new Date('2023-06-01'),
      published_at: new Date('2023-06-01'),
      user_id: 1,
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
      title: 'New product launch coming soon! Stay tuned for updates. #business #launch',
      description: 'New product launch coming soon! Stay tuned for updates. #business #launch',
      media_items: [
        {
          id: 'm2',
          url: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93',
          type: 'image'
        }
      ],
      image_urls: ['https://images.unsplash.com/photo-1504805572947-34fad45aed93'],
      is_draft: false,
      hashtags: ['business', 'launch', 'product'],
      status: PostStatus.SCHEDULED,
      type: PostType.IMAGE,
      scheduled_at: new Date(Date.now() + 86400000), // Tomorrow
      created_at: new Date(),
      updated_at: new Date(),
      user_id: 1,
      platform: 'instagram'
    },
    {
      id: '3',
      title: 'Draft post about our team retreat',
      description: 'Draft post about our team retreat',
      media_items: [
        {
          id: 'm3',
          url: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a',
          type: 'image'
        }
      ],
      image_urls: ['https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a'],
      is_draft: true,
      hashtags: ['team', 'retreat', 'company'],
      status: PostStatus.DRAFT,
      type: PostType.CAROUSEL,
      created_at: new Date(),
      updated_at: new Date(),
      user_id: 1,
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
    user.last_login = new Date().toISOString();
    
    return of({...user});
  }

  register(credentials: RegisterCredentials): Observable<User> {
    if (this.users.some(u => u.email === credentials.email)) {
      return throwError(() => new Error('Email already in use'));
    }

    const newUser: User = {
      id: this.users.length + 1,
      full_name: credentials.full_name,
      email: credentials.email,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };

    this.users.push(newUser);
    this.passwords.set(credentials.email, credentials.password);

    return of({...newUser});
  }

  // Posts methods
  getPosts(userId: number): Observable<Post[]> {
    return of(this.posts.filter(post => post.user_id === userId));
  }

  getPostById(postId: string): Observable<Post | undefined> {
    return of(this.posts.find(post => post.id === postId));
  }

  createPost(post: DraftPost): Observable<Post> {
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
      status: post.scheduled_at ? PostStatus.SCHEDULED : PostStatus.DRAFT,
      created_at: new Date(),
      updated_at: new Date()
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
        .filter(post => post.user_id === userId && post.status === PostStatus.PUBLISHED)
        .map(post => ({
          postId: post.id,
          postType: post.type,
          publishedAt: post.published_at || new Date(),
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
