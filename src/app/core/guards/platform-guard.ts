import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { PlatformConnectionService } from '../services/platform-connection.service';
import { AuthService } from '../auth/auth.service';

export const platformGuard: CanActivateFn = (route, state) => {
  const platformConnectionService = inject(PlatformConnectionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // First, check if the user is authenticated
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth']);
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
          router.navigate(['/accounts-connect']);
          return false;
        }
      }),
      catchError(error => {
        // In case of error, log it and redirect to accounts connect page
        console.error('Error in platform guard:', error);
        router.navigate(['/accounts-connect']);
        return of(false);
      })
    );
  } catch (error) {
    console.error('Critical error in platform guard:', error);
    router.navigate(['/accounts-connect']);
    return false;
  }
};