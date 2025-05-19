import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd, NavigationError, NavigationCancel } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastMessageComponent } from './shared/components/toast-message/toast-message.component';
import { AuthService } from './core/auth/auth.service';
import { ToastService } from './shared/services/toast.service';
import { ErrorHandler } from '@angular/core';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ToastMessageComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SocialTrendz';
  isSidebarOpen = false;
  isSidebarCollapsed = true; // Start with collapsed sidebar
  isLoading = false; // Track loading state
  
  isAuthPage = false;
  
  // For cleanup of subscriptions
  private destroy$ = new Subject<void>();
  
  // Track visibility of the app for performance improvements
  private isVisible = true;
  
  constructor(
    public authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private errorHandler: ErrorHandler
  ) {
    // Track and handle routing errors
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationError) {
          // Handle navigation errors
          this.errorHandler.handleError(event.error);
          this.toastService.error('Navigation error occurred. Please try again.');
        } else if (event instanceof NavigationCancel) {
          // Handle cancelled navigation
          console.warn('Navigation cancelled:', event);
        }
      });
  }
  
  ngOnInit(): void {
    // Check the current route to determine if we're on an auth page
    this.checkIfAuthPage(this.router.url);
    
    // Subscribe to future route changes to update isAuthPage
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkIfAuthPage(event.url);
    });
    
    // Listen for content creation page load to auto-collapse sidebar
    document.addEventListener('content-creation-loaded', () => {
      // Only collapse if sidebar is open
      if (this.isSidebarOpen) {
        this.toggleSidebar();
      }
    });
  }
  
  /**
   * Check if the current URL is an auth page (login/register)
   */
  checkIfAuthPage(url: string): void {
    // Check if the URL is for authentication pages
    this.isAuthPage = url.includes('/auth') || url.includes('/login') || url.includes('/register');
  }
  
  /**
   * Toggle sidebar open/closed state
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    
    // Add/remove no-scroll class to body when sidebar is open/closed
    if (this.isSidebarOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }
  
  /**
   * Closes the sidebar on mobile and tablet views
   */
  closeSidebar(): void {
    this.isSidebarOpen = false;
    document.body.classList.remove('no-scroll');
    
    // Make sure the sidebar is properly hidden
    const sidebarEl = document.querySelector('.sidebar');
    if (sidebarEl) {
      sidebarEl.classList.remove('show');
      
      // Reset any platform dropdown state
      const platformDropdown = sidebarEl.querySelector('.platform-dropdown');
      if (platformDropdown) {
        platformDropdown.classList.remove('show');
      }
    }
    
    // Make sure the overlay is properly hidden
    const overlayEl = document.querySelector('.sidebar-overlay');
    if (overlayEl) {
      overlayEl.classList.remove('active');
    }
  }
  
  /**
   * Handle sidebar collapse state changes
   */
  onSidebarCollapsedChange(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed;
  }
  
  /**
   * Optimize app performance when page is hidden
   */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    this.isVisible = document.visibilityState === 'visible';
    
    // When app becomes visible again, check auth status
    if (this.isVisible) {
      this.authService.getCurrentUser();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}