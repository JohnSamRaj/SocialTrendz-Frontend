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
    
    // Get current user data directly from the auth service's observable
    // This ensures we always have the latest data from the backend
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      
      console.log('Current user from backend:', user);
      
      if (this.user) {
        // Populate form with user data from backend
        this.profileForm.patchValue({
          fullName: this.user.full_name || '',
          email: this.user.email || '',
          // Additional profile fields would be populated here with real values
          // For now using defaults if data is missing
          bio: this.user.bio || 'Digital marketer and content creator',
          location: this.user.location || 'San Francisco, CA',
          website: this.user.website || 'https://example.com',
          instagram: this.user.instagram || '@socialuser',
          facebook: this.user.facebook || 'socialmediauser',
          twitter: this.user.twitter || '@socialuser'
        });
      } else {
        console.error('Failed to load user profile data');
      }
      
      this.isLoading = false;
    });
  }
  
  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }
    
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    // Get form values
    const formValues = this.profileForm.value;
    
    // Create updated user object with form values
    if (this.user) {
      const updatedUser: User = {
        ...this.user,
        full_name: formValues.fullName,
        email: formValues.email,
        // In a real implementation, we would also update these fields
        // bio: formValues.bio,
        // location: formValues.location,
        // website: formValues.website,
        // instagram: formValues.instagram,
        // facebook: formValues.facebook,
        // twitter: formValues.twitter
      };
      
      // Log the update we're about to make
      console.log('Updating user profile:', updatedUser);
      
      // Update user in the auth service
      this.authService.updateCurrentUser(updatedUser);
      
      // Here we would typically make an API call to update the profile
      // For now just show success message
      this.isSaving = false;
      this.successMessage = 'Profile updated successfully!';
      this.toastService.success('Profile updated successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } else {
      this.isSaving = false;
      this.errorMessage = 'Failed to update profile. User data not found.';
      this.toastService.error('Failed to update profile. Please try again.');
    }
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