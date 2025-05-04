import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // Only modify requests going to our API
  if (request.url.includes(environment.apiUrl) || request.url.includes('/api/')) {
    // Clone the request and add headers
    const apiRequest = request.clone({
      url: request.url.startsWith('http') ? request.url : `${environment.apiUrl}${request.url}`,
      setHeaders: token ? { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    });
    
    return next(apiRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle API errors
        console.error('API error:', error);
        
        // Handle 401 Unauthorized - redirect to login
        if (error.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/auth/login';
        }
        
        return throwError(() => new Error(
          error.error?.message || 'An unexpected error occurred. Please try again.'
        ));
      })
    );
  }
  
  // Pass through all other requests
  return next(request);
};
