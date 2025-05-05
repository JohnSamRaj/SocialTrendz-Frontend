import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter, withViewTransitions, withPreloading, PreloadAllModules } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { apiInterceptor } from './core/interceptors/api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router configuration with performance optimizations
    provideRouter(
      routes, 
      withViewTransitions(), // Smooth transitions between routes
      withPreloading(PreloadAllModules) // Preload all lazy-loaded modules for faster navigation
    ),
    
    // HTTP client with custom interceptors
    provideHttpClient(
      withInterceptors([
        credentialsInterceptor,
        apiInterceptor
      ])
    ),
    
    // Animations support
    provideAnimations(),
    
    // Client hydration for better SSR support if needed in the future
    provideClientHydration()
  ]
};
