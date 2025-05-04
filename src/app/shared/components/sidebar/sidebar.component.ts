import { Component, HostListener, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConnectedAccountsService } from '../../../core/services/connected-accounts.service';
import { ConnectedAccount } from '../../../core/models/connected-account.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = true; // Start with collapsed sidebar by default
  showPlatformDropdown = false;
  selectedPlatform = 'instagram'; // Default to Instagram
  connectedAccounts: ConnectedAccount[] = [];
  private subscription = new Subscription();
  
  // Common tablet dimensions to check for
  private tabletDimensions = [
    { width: 768, height: 1024 }, // iPad
    { width: 820, height: 1180 }, // iPad Air
    { width: 834, height: 1194 }, // iPad Pro 11"
    { width: 810, height: 1080 }  // Some Android tablets
  ];
  
  /**
   * Check if the current device is an iPad or similar tablet
   * based on screen dimensions
   */
  private isTabletDevice(): boolean {
    return this.tabletDimensions.some(
      dim => (window.innerWidth === dim.width && window.innerHeight === dim.height) ||
             (window.innerHeight === dim.width && window.innerWidth === dim.height) // handle orientation
    );
  }
  
  /**
   * Check if the current device is mobile or tablet size
   */
  private isMobileOrTabletSize(): boolean {
    return window.innerWidth <= 1024 || this.isTabletDevice();
  }
  
  get platformDisplayName(): string {
    if (this.selectedPlatform === 'all') {
      return 'All Platforms';
    } else {
      // If we have a connected account for this platform, show the username
      const account = this.connectedAccounts.find(acc => acc.platform === this.selectedPlatform);
      return account ? `@${account.username}` : 'Instagram';
    }
  }
  
  @Output() closeMobileSidebar = new EventEmitter<void>();
  @Output() addAccountClicked = new EventEmitter<void>();
  @Output() sidebarCollapsedChange = new EventEmitter<boolean>();
  
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fa-chart-pie', route: '/dashboard', active: false },
    { label: 'Content Creation', icon: 'fa-edit', route: '/content-creation', active: false },
    { label: 'Schedule', icon: 'fa-calendar-alt', route: '/schedule', active: false },
    { label: 'Analytics', icon: 'fa-chart-line', route: '/analytics', active: false },
    { label: 'Help', icon: 'fa-question-circle', route: '/help', active: false }
  ];
  
  constructor(
    private router: Router,
    private connectedAccountsService: ConnectedAccountsService
  ) {
    this.setActiveRoute(this.router.url);
    
    // Subscribe to router events to update active item
    this.router.events.subscribe(() => {
      this.setActiveRoute(this.router.url);
    });
  }
  
  ngOnInit(): void {
    // Subscribe to connected accounts
    this.subscription.add(
      this.connectedAccountsService.getConnectedAccounts().subscribe(accounts => {
        this.connectedAccounts = accounts;
      })
    );
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarCollapsedChange.emit(this.isCollapsed);
  }

  setActiveRoute(url: string): void {
    this.navItems.forEach(item => {
      item.active = url.includes(item.route);
    });
  }
  
  // Close mobile/tablet sidebar when clicking a navigation item
  onNavItemClick(): void {
    // Check if we're on mobile/tablet view
    if (this.isMobileOrTabletSize()) {
      this.closeMobileSidebar.emit();
    }
  }
  
  // Handle closing the sidebar with close button on mobile
  closeSidebar(): void {
    // Ensure the sidebar is properly hidden both in the parent and in this component
    const sidebarEl = document.querySelector('.sidebar');
    if (sidebarEl) {
      sidebarEl.classList.remove('show');
    }
    
    // Emit event to notify parent component
    this.closeMobileSidebar.emit();
  }
  
  // Toggle platform selection dropdown
  togglePlatformDropdown(): void {
    // Allow toggling the dropdown in mobile and tablet views regardless of sidebar collapse state
    // For desktop (>1024px), only toggle if sidebar is not collapsed
    if (this.isMobileOrTabletSize() || !this.isCollapsed) {
      this.showPlatformDropdown = !this.showPlatformDropdown;
    }
  }
  
  // Select a platform from the dropdown
  selectPlatform(platform: string): void {
    this.selectedPlatform = platform;
    this.showPlatformDropdown = false;
  }
  
  // Show the add account popup (platform-connect functionality removed)
  showAddAccount(): void {
    // Display a notification that this feature is not available
    const event = new CustomEvent('show-toast', {
      detail: {
        message: 'Platform connect feature is not available in this version.',
        type: 'info'
      }
    });
    window.dispatchEvent(event);
    this.showPlatformDropdown = false;
  }
  
  // Close the dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Handle platform dropdown closing
    const platformSelector = document.querySelector('.platform-selector');
    const platformDropdown = document.querySelector('.platform-dropdown');
    
    if (platformSelector && platformDropdown) {
      const clickedInside = platformSelector.contains(event.target as Node) || 
                            platformDropdown.contains(event.target as Node);
      
      if (!clickedInside && this.showPlatformDropdown) {
        this.showPlatformDropdown = false;
      }
    }
    
    // Handle sidebar closing on mobile and tablet when clicking outside
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar && this.isMobileOrTabletSize()) {
      const clickedInsideSidebar = sidebar.contains(event.target as Node);
      const clickedToggle = mobileToggle ? mobileToggle.contains(event.target as Node) : false;
      
      // If click was outside sidebar and toggle button, and sidebar is shown
      if (!clickedInsideSidebar && !clickedToggle && sidebar.classList.contains('show')) {
        this.closeSidebar();
      }
    }
  }
}
