import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConnectedAccount } from '../models/connected-account.model';
import { DataService } from './data.service';

export interface PlatformConnection {
  platformId: string;
  name: string;
  isConnected: boolean;
  lastSynced?: Date;
  profileData?: any;
}

export type PlatformType = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';

@Injectable({
  providedIn: 'root'
})
export class PlatformConnectionService {
  private platformsSubject = new BehaviorSubject<PlatformConnection[]>([]);
  public platforms$ = this.platformsSubject.asObservable();
  
  constructor(private dataService: DataService) {
    this.loadConnectedPlatforms();
  }

  /**
   * Load all connected platforms for the current user
   */
  loadConnectedPlatforms(): void {
    // Use the DataService to get connected accounts
    this.dataService.getConnectedAccounts().subscribe({
      next: (accounts) => {
        // Convert ConnectedAccount[] to PlatformConnection[]
        const platforms: PlatformConnection[] = accounts.map(account => ({
          platformId: account.id,
          name: account.platform,
          isConnected: account.isConnected,
          lastSynced: new Date(),
          profileData: {
            username: account.username,
            displayName: account.displayName,
            profilePicture: account.profilePicture
          }
        }));
        
        this.platformsSubject.next(platforms);
      },
      error: (err) => {
        console.error('Error loading connected platforms:', err);
        // If error, set empty array
        this.platformsSubject.next([]);
      }
    });
  }

  /**
   * Check if a specific platform is connected
   * @param platformType - The type of platform to check
   * @returns Observable boolean indicating connection status
   */
  isPlatformConnected(platformType: PlatformType): Observable<boolean> {
    return this.platforms$.pipe(
      map(platforms => 
        platforms.some(p => p.name.toLowerCase() === platformType && p.isConnected)
      )
    );
  }

  /**
   * Get connection status for all platforms
   * @returns Observable with object containing status for each platform
   */
  getConnectionStatuses(): Observable<Record<PlatformType, boolean>> {
    return this.platforms$.pipe(
      map(platforms => {
        const statuses = {
          instagram: false,
          facebook: false,
          twitter: false,
          linkedin: false,
          tiktok: false
        };
        
        platforms.forEach(platform => {
          const platformName = platform.name.toLowerCase() as PlatformType;
          if (platformName in statuses) {
            statuses[platformName] = platform.isConnected;
          }
        });
        
        return statuses;
      })
    );
  }

  /**
   * Connect a platform by initiating OAuth flow
   * @param platformType - The platform to connect
   * @returns Observable with connection result
   */
  connectPlatform(platformType: PlatformType): Observable<any> {
    // In a real implementation, this would redirect to OAuth page
    // For this mock, we'll simulate a successful connection
    
    const mockAuthResponse = {
      success: true,
      authUrl: `https://example.com/oauth/${platformType}`
    };
    
    console.log(`Simulating connection to ${platformType}...`);
    
    // Simulate a successful connection by adding a new connected platform
    const newPlatforms = [...this.platformsSubject.value];
    newPlatforms.push({
      platformId: Math.random().toString(36).substring(2, 15),
      name: platformType,
      isConnected: true,
      lastSynced: new Date()
    });
    
    this.platformsSubject.next(newPlatforms);
    
    return of(mockAuthResponse);
  }

  /**
   * Check connection status for a specific platform
   * @param platformType - The platform to check
   * @returns Observable with platform status
   */
  checkPlatformStatus(platformType: PlatformType): Observable<any> {
    const platformStatus = this.platformsSubject.value.find(
      p => p.name.toLowerCase() === platformType.toLowerCase()
    );
    
    return of({
      connected: platformStatus?.isConnected || false,
      status: platformStatus?.isConnected ? 'connected' : 'disconnected',
      lastSynced: platformStatus?.lastSynced || null
    });
  }

  /**
   * Disconnect a platform
   * @param platformType - The platform to disconnect
   * @returns Observable with disconnection result
   */
  disconnectPlatform(platformType: PlatformType): Observable<any> {
    // Update the platforms list to mark the platform as disconnected
    const updatedPlatforms = this.platformsSubject.value.map(platform => {
      if (platform.name.toLowerCase() === platformType.toLowerCase()) {
        return { ...platform, isConnected: false };
      }
      return platform;
    });
    
    this.platformsSubject.next(updatedPlatforms);
    
    return of({ success: true, message: `${platformType} disconnected successfully` });
  }
}
