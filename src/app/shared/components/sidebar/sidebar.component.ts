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
  private mouseEnterTimeout: any;
  
  /**
   * More reliable way to detect mobile devices based on screen size and touch capability
   * This approach works better across different device types and orientations
   * 
   * @returns boolean indicating if the device is likely a mobile device
   */
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // First check for common mobile user agents
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || 
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4))) {
      return true;
    }
    
    // Check for touch capability as a second indicator
    const hasTouchCapability = 'ontouchstart' in window || 
                            navigator.maxTouchPoints > 0 || 
                            (navigator as any).msMaxTouchPoints > 0;
    
    // Check for screen size characteristics typical of mobile devices
    const hasSmallScreen = window.innerWidth <= 768;
    
    // For tablets, check mid-size screens with touch capability
    const isTabletSize = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    return hasSmallScreen || (isTabletSize && hasTouchCapability);
  }
  
  /**
   * Enhanced check for tablet devices that better handles various device types
   * 
   * @returns boolean indicating if the device is likely a tablet
   */
  private isTabletDevice(): boolean {
    // First check for common tablet user agents
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
      return true;
    }
    
    // Check for touch capability
    const hasTouchCapability = 'ontouchstart' in window || 
                            navigator.maxTouchPoints > 0 || 
                            (navigator as any).msMaxTouchPoints > 0;
    
    // Tablets typically have larger screens with touch capability
    const isTabletSize = window.innerWidth >= 768 && window.innerWidth <= 1280;
    
    return isTabletSize && hasTouchCapability;
  }
  
  /**
   * Check if the current device is mobile or tablet
   * This uses multiple detection methods for better accuracy
   */
  private isMobileOrTabletSize(): boolean {
    return this.isMobileDevice() || this.isTabletDevice() || window.innerWidth <= 1024;
  }
  
  get platformDisplayName(): string {
    if (this.selectedPlatform === 'all') {
      return 'All Platforms';
    } else {
      // If we have a connected account for this platform, show the username
      const account = this.connectedAccounts.find(acc => acc.platform === this.selectedPlatform);
      return account ? `@${account.account_name}` : 'Instagram';
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
      this.connectedAccountsService.getConnectedAccounts().subscribe((accounts: ConnectedAccount[]) => {
        this.connectedAccounts = accounts;
      })
    );
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }

  // toggleSidebar(): void {
  //   this.isCollapsed = !this.isCollapsed;
  //   this.sidebarCollapsedChange.emit(this.isCollapsed);
  // }

  // Mouse enter handler for hover-to-expand functionality
  onSidebarMouseEnter(): void {
    // Only apply hover behavior on desktop/larger screens
    if (!this.isMobileOrTabletSize() && this.isCollapsed) {
      // Use timeout to prevent unwanted expansions when quickly moving across the sidebar
      this.mouseEnterTimeout = setTimeout(() => {
        this.isCollapsed = false;
        this.sidebarCollapsedChange.emit(this.isCollapsed);
      }, 300);
    }

  }

  // Mouse leave handler
  onSidebarMouseLeave(): void {
    // Clear the timeout if mouse leaves before it triggers
    if (this.mouseEnterTimeout) {
      clearTimeout(this.mouseEnterTimeout);
    }
    
    // Only apply hover behavior on desktop/larger screens
    if (!this.isMobileOrTabletSize() && !this.isCollapsed) {
      this.isCollapsed = true;
      this.sidebarCollapsedChange.emit(this.isCollapsed);
    }
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
    this.router.navigate(['/accounts-connect']);
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
