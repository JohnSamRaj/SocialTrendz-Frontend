import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  expiry: number;
}

/**
 * Service to cache HTTP responses to improve performance
 * and reduce unnecessary API calls
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  
  // Default cache time: 5 minutes (in milliseconds)
  private defaultCacheTime = 5 * 60 * 1000;

  constructor() {
    // Cleanup expired cache entries periodically
    setInterval(() => this.cleanupExpiredCache(), 60 * 1000);
  }

  /**
   * Gets an item from the cache if it exists and is not expired
   * @param key Cache key
   * @returns The cached data or null if not found/expired
   */
  get(key: string): any | null {
    if (!this.cache.has(key)) {
      return null;
    }

    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    if (entry.expiry < now) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Stores data in the cache with a specified expiry time
   * @param key Cache key
   * @param data Data to cache
   * @param cacheTime Time in milliseconds before the cache expires (optional)
   */
  set(key: string, data: any, cacheTime?: number): void {
    const expiry = Date.now() + (cacheTime || this.defaultCacheTime);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Clears a specific cache entry
   * @param key Cache key to clear
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears the entire cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Wraps an Observable to use cached data if available
   * @param key Cache key
   * @param observable Observable to wrap with caching
   * @param cacheTime Time in milliseconds before the cache expires (optional)
   * @returns Observable that emits cached data if available, or new data
   */
  cacheResponse<T>(key: string, observable: Observable<T>, cacheTime?: number): Observable<T> {
    const cached = this.get(key);
    
    if (cached) {
      return of(cached);
    }
    
    return observable.pipe(
      tap(data => this.set(key, data, cacheTime))
    );
  }

  /**
   * Removes all expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    this.cache.forEach((entry, key) => {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    });
  }
}