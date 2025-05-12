export interface ConnectedAccount {
  id: number;
  user_id: number;
  platform: string;
  account_name: string;
  display_name: string;
  profile_image_url: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
  metadata?: {
    followers_count?: number;
    following_count?: number;
    posts_count?: number;
    [key: string]: any;
  };
}

export interface PlatformInfo {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  description: string;
  connectedAccounts?: ConnectedAccount[];
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'pending' | 'failed';
  account?: ConnectedAccount;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  account?: ConnectedAccount;
  error?: string;
  redirect_url?: string;
}

export interface PlatformAuthResponse {
  success: boolean;
  url: string;
  error?: string;
}

export interface PlatformConnectionResponse {
  success: boolean;
  account?: ConnectedAccount;
  error?: string;
}

export function mapBackendToFrontendAccount(account: any): ConnectedAccount {
  return {
    id: account.id,
    user_id: account.user_id,
    platform: account.platform,
    account_name: account.account_name,
    display_name: account.display_name,
    profile_image_url: account.profile_image_url,
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    token_expires_at: account.token_expires_at ? new Date(account.token_expires_at) : undefined,
    created_at: new Date(account.created_at),
    updated_at: new Date(account.updated_at),
    metadata: account.metadata
  };
}