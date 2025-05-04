export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple'
}

export interface User {
  id?: number;
  fullName: string;
  email: string;
  profilePicture?: string;
  createdAt?: Date;
  lastLogin?: Date;
  authProvider?: AuthProvider;
  isVerified?: boolean;
  hasCompletedOnboarding?: boolean;
  connectedPlatforms?: string[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  fullName: string;
}

export interface OAuthCredentials {
  providerId: string;
  accessToken: string;
  provider: AuthProvider;
  email?: string;
  fullName?: string;
  profilePicture?: string;
}
