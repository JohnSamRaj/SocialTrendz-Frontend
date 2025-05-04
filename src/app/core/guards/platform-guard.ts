import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { InstagramService } from '../services/instagram.service';
import { AuthService } from '../auth/auth.service';

export const platformGuard: CanActivateFn = (route, state) => {
  const instagramService = inject(InstagramService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // First, check if the user is authenticated
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth']);
    return false;
  }

  try {
    // Check if user has connected at least one platform
    return instagramService.getConnectedAccounts().pipe(
      map(accounts => {
        if (!accounts || accounts.length === 0) {
          console.log('No connected accounts found, redirecting to Instagram connect page');
          router.navigate(['/instagram-connect']);
          return false;
        }

        // Check if there are any connected accounts
        const connectedAccounts = accounts.filter(account => account.isConnected);
        
        if (connectedAccounts.length > 0) {
          // User has at least one connected platform
          console.log('At least one platform is connected, allowing access');
          return true;
        } else {
          // Redirect to Instagram connect page if no platforms are connected
          console.log('No connected platforms found, redirecting to Instagram connect page');
          router.navigate(['/instagram-connect']);
          return false;
        }
      }),
      catchError(error => {
        // In case of error, log it and redirect to Instagram connect page
        console.error('Error in platform guard:', error);
        router.navigate(['/instagram-connect']);
        return of(false);
      })
    );
  } catch (error) {
    console.error('Critical error in platform guard:', error);
    router.navigate(['/instagram-connect']);
    return false;
  }
};