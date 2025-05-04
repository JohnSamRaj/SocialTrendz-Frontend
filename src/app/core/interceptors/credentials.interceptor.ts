import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Credentials interceptor that adds withCredentials: true to all requests
 * This ensures cookies are sent with every request
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and add withCredentials
  const authReq = req.clone({
    withCredentials: true
  });
  
  // Pass the cloned request with credentials to the next handler
  return next(authReq);
};