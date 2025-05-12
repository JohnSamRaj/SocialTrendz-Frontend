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
  user_id: number;
  title: string;
  description: string;
  media_items: MediaItem[];
  image_urls: string[];
  hashtags: string[];
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  scheduled_at?: Date;
  is_draft: boolean;
  status: PostStatus;
  type: PostType;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
  location?: string;
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
  user_id: number;
  title: string;
  description: string;
  media_items: MediaItem[];
  image_urls: string[];
  hashtags: string[];
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  scheduled_at?: Date;
  is_draft: boolean;
  type: PostType;
  location?: string;
}
