export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  profile_picture?: string;
  created_at?: string;
  last_login?: string;
  auth_provider?: AuthProvider;
  is_verified?: boolean;
  has_completed_onboarding?: boolean;
  connected_platforms?: string[];
  token?: string;
  refresh_token?: string;

  // Platform-specific fields
  instagram_user_name?: string;
  instagram_profile_picture?: string;
  facebook_user_name?: string;
  facebook_profile_picture?: string;
  twitter_username?: string;
  twitter_profile_picture?: string;
  linkedin_username?: string;
  linkedin_profile_picture?: string;

  // Optional profile fields
  bio?: string;
  location?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
}

export interface OAuthCredentials {
  provider_id: string;
  access_token: string;
  provider: AuthProvider;
  email?: string;
  full_name?: string;
  profile_picture?: string;
}

export interface OAuthResponse {
  user: User;
  token: string;
}
