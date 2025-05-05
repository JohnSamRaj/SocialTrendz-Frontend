import { Component, OnInit, OnDestroy, HostListener, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, NavigationError, NavigationCancel } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastMessageComponent } from './shared/components/toast-message/toast-message.component';
import { OnboardingModalComponent } from './shared/components/onboarding-modal/onboarding-modal.component';
import { AuthService } from './core/auth/auth.service';
import { ToastService } from './shared/services/toast.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ToastMessageComponent,
    OnboardingModalComponent
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
  showOnboardingModal = false;
  
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
   * Toggles the mobile sidebar menu open/closed
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    
    // Add no-scroll class to body when sidebar is open on mobile
    if (this.isSidebarOpen) {
      document.body.classList.add('no-scroll');
      
      // For mobile and tablet devices, ensure the sidebar is visible with a slight delay
      // Increased the width check to capture tablets as well (1024px)
      if (window.innerWidth <= 1024) {
        setTimeout(() => {
          const sidebarEl = document.querySelector('.sidebar');
          if (sidebarEl) {
            sidebarEl.classList.add('show');
            
            // For tablets and mobiles, make sure sidebar elements aren't collapsed
            if (window.innerWidth <= 768) {
              // Ensure dropdown arrows are visible in mobile view
              const dropdownArrows = sidebarEl.querySelectorAll('.dropdown-arrow');
              dropdownArrows.forEach(arrow => {
                arrow.classList.remove('desktop-collapsed');
              });
              
              // Ensure platform name is visible in mobile view
              const platformNames = sidebarEl.querySelectorAll('.platform-name');
              platformNames.forEach(name => {
                name.classList.remove('desktop-collapsed');
              });
            }
          }
          
          // Ensure the overlay is also properly shown
          const overlayEl = document.querySelector('.sidebar-overlay');
          if (overlayEl) {
            overlayEl.classList.add('active');
          }
        }, 50);
      }
    } else {
      // If closing the sidebar, call the dedicated close function for consistency
      this.closeSidebar();
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
   * Opens the onboarding modal
   */
  openOnboardingModal(): void {
    this.showOnboardingModal = true;
  }
  
  /**
   * Handler for onboarding completed event
   * Redirects to accounts-connect page after onboarding is completed
   */
  onOnboardingCompleted(): void {
    this.showOnboardingModal = false;
    // Update user's onboarding status in the service
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      currentUser.hasCompletedOnboarding = true;
      this.authService.updateCurrentUser(currentUser);
      
      // For both new and existing users, redirect to accounts-connect
      // page if they don't have any connected platforms
      if (!currentUser.connectedPlatforms || currentUser.connectedPlatforms.length === 0) {
        setTimeout(() => {
          this.router.navigate(['/accounts-connect']);
        }, 300);
      }
    }
  }
  
  /**
   * Handler for onboarding skipped event
   */
  onOnboardingSkipped(): void {
    this.showOnboardingModal = false;
  }
  
  /**
   * Clean up resources when component is destroyed
   */
  ngOnDestroy(): void {
    // Complete the destroy subject and unsubscribe from all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
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
}