import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  constructor(private apiService: ApiService) {}

  /**
   * Get the current user's profile
   * 
   * @returns Observable with user data
   */
  getUserProfile(): Observable<User> {
    return this.apiService.get<any>('users/profile')
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to get user profile');
          }
          return response.user;
        }),
        catchError(error => {
          console.error('Error getting user profile:', error);
          return throwError(() => new Error(error.message || 'Failed to get user profile'));
        })
      );
  }

  /**
   * Update the user's profile
   * 
   * @param userData Data to update (partial User object)
   * @returns Observable with updated user data
   */
  updateUserProfile(userData: Partial<User>): Observable<User> {
    return this.apiService.put<any>('users/profile', userData)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update user profile');
          }
          return response.user;
        }),
        catchError(error => {
          console.error('Error updating user profile:', error);
          return throwError(() => new Error(error.message || 'Failed to update user profile'));
        })
      );
  }

  /**
   * Mark user as having completed onboarding
   * 
   * @returns Observable with updated user data
   */
  completeOnboarding(): Observable<User> {
    return this.updateUserProfile({ hasCompletedOnboarding: true });
  }
}