import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ConnectedAccount } from '../models/connected-account.model';
import { DataService } from './data.service';
import { ApiService } from './api.service';
import { ToastService } from '../../shared/services/toast.service';

export interface ConnectedPlatform {
  id: number;
  platform: string;
  account_name: string;
  profile_image_url: string;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  token_expires_at: string;
  scopes: string[];
}

export type PlatformType = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';

export interface PlatformStatuses {
  instagram: boolean;
  facebook: boolean;
  twitter: boolean;
  linkedin: boolean;
  tiktok: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlatformConnectionService {
  private connectedPlatforms = new BehaviorSubject<ConnectedPlatform[]>([]);
  private readonly API_BASE = '/api/social-accounts';

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  // Get connected platforms as observable
  getConnectedPlatforms(): Observable<ConnectedPlatform[]> {
    return this.connectedPlatforms.asObservable();
  }

  // Get connection status for all platforms
  getConnectionStatuses(): Observable<PlatformStatuses> {
    return this.connectedPlatforms.pipe(
      map(platforms => {
        const statuses: PlatformStatuses = {
          instagram: false,
          facebook: false,
          twitter: false,
          linkedin: false,
          tiktok: false
        };
        
        platforms.forEach(platform => {
          const platformName = platform.platform.toLowerCase() as PlatformType;
          if (platformName in statuses) {
            statuses[platformName] = true;
          }
        });
        
        return statuses;
      })
    );
  }

  // Load connected platforms for a user
  loadConnectedPlatforms(userId: number): Promise<void> {
    return this.apiService.get<ConnectedPlatform[]>(`${this.API_BASE}/connected/${userId}`)
      .toPromise()
      .then(platforms => {
        this.connectedPlatforms.next(platforms || []);
      })
      .catch(error => {
        this.toastService.error('Failed to load connected platforms');
        console.error('Error loading platforms:', error);
        throw error;
      });
  }

  // Check if a platform is connected
  checkPlatformStatus(userId: number, platform: string): Observable<{ connected: boolean; account?: ConnectedPlatform }> {
    return this.apiService.get<{ connected: boolean; account?: ConnectedPlatform }>(
      `${this.API_BASE}/status/${userId}/${platform}`
    );
  }

  // Connect a platform
  connectPlatform(platformData: Omit<ConnectedPlatform, 'id'>): Promise<ConnectedPlatform> {
    return this.apiService.post<ConnectedPlatform>(`${this.API_BASE}/connect`, platformData)
      .toPromise()
      .then(response => {
        if (!response) {
          throw new Error('No response from server');
        }
        const platform = response;
        const currentPlatforms = this.connectedPlatforms.value;
        const existingIndex = currentPlatforms.findIndex(p => p.platform === platform.platform);
        
        if (existingIndex >= 0) {
          currentPlatforms[existingIndex] = platform;
        } else {
          currentPlatforms.push(platform);
        }
        
        this.connectedPlatforms.next([...currentPlatforms]);
        this.toastService.success(`${platform.platform} connected successfully`);
        return platform;
      })
      .catch(error => {
        this.toastService.error(`Failed to connect ${platformData.platform}`);
        console.error('Error connecting platform:', error);
        throw error;
      });
  }

  // Disconnect a platform
  disconnectPlatform(userId: number, platform: string): Promise<void> {
    return this.apiService.delete(`${this.API_BASE}/disconnect/${userId}/${platform}`)
      .toPromise()
      .then(() => {
        const currentPlatforms = this.connectedPlatforms.value;
        const updatedPlatforms = currentPlatforms.filter(p => p.platform !== platform);
        this.connectedPlatforms.next(updatedPlatforms);
        this.toastService.success(`${platform} disconnected successfully`);
      })
      .catch(error => {
        this.toastService.error(`Failed to disconnect ${platform}`);
        console.error('Error disconnecting platform:', error);
        throw error;
    });
  }

  // Check if user has any connected platforms
  hasConnectedPlatforms(): Observable<boolean> {
    return this.connectedPlatforms.pipe(
      map(platforms => platforms.length > 0)
    );
  }
}
