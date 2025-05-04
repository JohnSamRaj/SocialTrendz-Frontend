import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastMessageComponent } from './shared/components/toast-message/toast-message.component';
import { OnboardingModalComponent } from './shared/components/onboarding-modal/onboarding-modal.component';
import { AuthService } from './core/auth/auth.service';
import { filter } from 'rxjs/operators';

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
export class AppComponent implements OnInit {
  title = 'SocialTrendz';
  isSidebarOpen = false;
  isSidebarCollapsed = true; // Start with collapsed sidebar
  
  isAuthPage = false;
  showOnboardingModal = false;
  
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}
  
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
      
      // For mobile devices, ensure the sidebar is visible with a slight delay
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          const sidebarEl = document.querySelector('.sidebar');
          if (sidebarEl) {
            sidebarEl.classList.add('show');
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
   * Closes the sidebar on mobile
   */
  closeSidebar(): void {
    this.isSidebarOpen = false;
    document.body.classList.remove('no-scroll');
    
    // Make sure the sidebar is properly hidden
    const sidebarEl = document.querySelector('.sidebar');
    if (sidebarEl) {
      sidebarEl.classList.remove('show');
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
   */
  onOnboardingCompleted(): void {
    this.showOnboardingModal = false;
    // Update user's onboarding status in the service
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      currentUser.hasCompletedOnboarding = true;
      this.authService.updateCurrentUser(currentUser);
    }
  }
  
  /**
   * Handler for onboarding skipped event
   */
  onOnboardingSkipped(): void {
    this.showOnboardingModal = false;
  }
}