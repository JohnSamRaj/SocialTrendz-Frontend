import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { platformGuard } from './core/guards/platform-guard';

export const routes: Routes = [
  // Authentication Routes
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'login',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'register',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/callback/callback.component').then(m => m.CallbackComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  
  // Main App Routes - Requires authentication
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      canActivate: [authGuard]
  },
  {
    path: 'content-creation',
    loadComponent: () => import('./features/content-creation/content-creation.component').then(m => m.ContentCreationComponent),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'schedule',
    loadComponent: () => import('./features/schedule/schedule.component').then(m => m.ScheduleComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  // Accounts Connect Route
  {
    path: 'accounts-connect',
    loadComponent: () => import('./features/accounts-connect/accounts-connect.component').then(m => m.AccountsConnectComponent),
    canActivate: [authGuard]
  },
  // Instagram Auth Callback
  // {
  //   path: 'auth/instagram-callback',
  //   loadComponent: () => import('./features/auth/callback/callback.component').then(m => m.CallbackComponent)
  // },
  {
    path: 'help',
    loadComponent: () => import('./features/help/help.component').then(m => m.HelpComponent),
    canActivate: [authGuard]
  },
  
  // Default Routes
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
