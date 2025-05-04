export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

export enum PostType {
  IMAGE = 'image',
  VIDEO = 'video',
  CAROUSEL = 'carousel',
  STORY = 'story',
  REEL = 'reel'
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface Post {
  id: string;
  caption: string;
  mediaItems: MediaItem[];
  hashtags: string[];
  status: PostStatus;
  type: PostType;
  scheduledFor?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  userId: number;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  engagement?: PostEngagement;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
}

export interface DraftPost {
  caption: string;
  mediaItems: MediaItem[];
  hashtags: string[];
  type: PostType;
  location?: string;
  scheduledFor?: Date;
  userId: number;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
}
