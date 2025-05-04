import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  user: User | null = null;
  isProfileMenuOpen = false;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close the menu when clicking outside
    if (this.isProfileMenuOpen) {
      const userMenu = document.querySelector('.user-menu');
      if (userMenu && !userMenu.contains(event.target as Node)) {
        this.isProfileMenuOpen = false;
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.isProfileMenuOpen = false;
  }
}
