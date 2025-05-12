import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { PlatformConnectionService } from '../services/platform-connection.service';
import { AuthService } from '../auth/auth.service';

/**
 * Guard that checks if the user has connected at least one platform
 * If not, redirects them to the accounts-connect page
 * This ensures users can't access platform-specific features without connecting a platform
 */
export const platformGuard: CanActivateFn = (route, state) => {
  const platformConnectionService = inject(PlatformConnectionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // First, check if the user is authenticated
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth']);
    return false;
  }

  // Then check if the user has completed onboarding
  const currentUser = authService.getCurrentUser();
  if (currentUser && !currentUser.has_completed_onboarding) {
    console.log('User has not completed onboarding, redirecting to dashboard');
    router.navigate(['/dashboard']); // Onboarding modal will appear here
    return false;
  }

  try {
    // Check if user has connected at least one platform
    return platformConnectionService.getConnectionStatuses().pipe(
      map(statuses => {
        // Check if any platform is connected
        const hasConnectedPlatform = Object.values(statuses).some(status => status === true);
        
        if (hasConnectedPlatform) {
          // User has at least one connected platform
          console.log('At least one platform is connected, allowing access');
          return true;
        } else {
          // Redirect to accounts connect page if no platforms are connected
          console.log('No connected platforms found, redirecting to accounts connect page');
          // Don't redirect if already on accounts-connect page
          if (!state.url.includes('/accounts-connect')) {
            router.navigate(['/accounts-connect']);
          }
          return false;
        }
      }),
      catchError(error => {
        // In case of error, log it and redirect to accounts connect page
        console.error('Error in platform guard:', error);
        if (!state.url.includes('/accounts-connect')) {
          router.navigate(['/accounts-connect']);
        }
        return of(false);
      })
    );
  } catch (error) {
    console.error('Critical error in platform guard:', error);
    if (!state.url.includes('/accounts-connect')) {
      router.navigate(['/accounts-connect']);
    }
    return false;
  }
};