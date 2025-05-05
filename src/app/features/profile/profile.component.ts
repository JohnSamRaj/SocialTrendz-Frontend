import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';
import { ToastService } from '../../shared/services/toast.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonLoaderComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  user: User | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.profileForm = this.fb.group({
      fullName: [''],
      email: [''],
      bio: [''],
      location: [''],
      website: [''],
      instagram: [''],
      facebook: [''],
      twitter: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadUserProfile();
  }
  
  loadUserProfile(): void {
    this.isLoading = true;
    
    // Get current user data
    this.user = this.authService.getCurrentUser();
    
    // Simulate API call delay
    setTimeout(() => {
      if (this.user) {
        // Populate form with user data
        this.profileForm.patchValue({
          fullName: this.user.full_name,
          email: this.user.email,
          // Additional profile fields would be populated here
          bio: 'Digital marketer and content creator',
          location: 'San Francisco, CA',
          website: 'https://example.com',
          instagram: '@socialuser',
          facebook: 'socialmediauser',
          twitter: '@socialuser'
        });
      }
      
      this.isLoading = false;
    }, 800);
  }
  
  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }
    
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    // Simulate API call delay
    setTimeout(() => {
      // Here we would typically make an API call to update the user profile
      
      // Update local user data
      if (this.user) {
        this.user.full_name = this.profileForm.value.fullName;
        // Other fields would be updated in a real implementation
      }
      
      this.isSaving = false;
      this.successMessage = 'Profile updated successfully!';
      this.toastService.success('Profile updated successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1500);
  }
  
  // Function to handle profile image upload
  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    const file = input.files[0];
    // Here we would handle the file upload to a server
    // For now, we just log it
    console.log('Profile image selected:', file.name);
    
    // Display a success message
    this.successMessage = 'Profile image selected. Ready to save.';
    this.toastService.info('Profile image selected. Ready to save.');
  }
  
  // Function to discard changes and reload the form
  discardChanges(): void {
    this.loadUserProfile();
    this.successMessage = '';
    this.errorMessage = '';
    this.toastService.info('Changes discarded. Form has been reset.');
  }
}