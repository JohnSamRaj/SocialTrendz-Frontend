export interface ConnectedAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  username: string;
  displayName?: string;
  profilePicture?: string;
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  userId: number;
  platformUserId?: string;
}

export interface PlatformInfo {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  description: string;
  connectedAccounts?: ConnectedAccount[];
}