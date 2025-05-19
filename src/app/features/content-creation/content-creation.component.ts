import { Component, OnInit, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { InstagramService } from '../../core/services/instagram.service';
import { AIService, ContentWizardData } from '../../core/services/ai.service';
import { ToastService } from '../../shared/services/toast.service';
import { Post, PostStatus, PostType, MediaItem, SavedPost } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { InstagramPreviewComponent } from '../../shared/components/instagram-preview/instagram-preview.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { SocialAccountsApiService } from '../../core/services/social-accounts-api.service';
import { PlatformInfo, ConnectedAccount } from '../../core/models/connected-account.model';
import { LazyLoadImageDirective } from '../../shared/directives/lazy-load-image.directive';
import { ContentWizardComponent } from './content-wizard/content-wizard.component';
import { ApiService } from '../../core/services/api.service';
import { DataService } from '../../core/services/data.service';
import { AuthService } from '../../core/auth/auth.service';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { User } from '../../core/models/user.model';
interface BackendPost {
  id: string;
  user_id: number;
  title: string;
  description: string;
  image_urls: string[];
  hashtags: string[];
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  scheduled_at?: string;
  is_draft: boolean;
}

interface BackendPostResponse {
  success: boolean;
  data?: BackendPost;
  error?: string;
}

@Component({
  selector: 'app-content-creation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PostCardComponent,
    InstagramPreviewComponent,
    SkeletonLoaderComponent,
    LazyLoadImageDirective,
    ContentWizardComponent,
    LazyLoadImageModule
  ],
  templateUrl: './content-creation.component.html',
  styleUrls: ['./content-creation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentCreationComponent implements OnInit {
  currentTab: 'create' | 'saved' = 'create';
  connectedAccounts: ConnectedAccount[] = [];
  
  // For template access
  PostStatus = PostStatus;
  
  // Helper method for template
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  // New post data
  newPost: SavedPost = {
    title: '',
    description: '',
    media_items: [],
    image_urls: [],
    hashtags: [],
    type: PostType.IMAGE,
    user_id: 0,
    platform: 'instagram',
    is_draft: true
  };
  
  // For editing an existing post
  isEditing = false;
  editingPostId = '';
  
  // AI generation
  isGeneratingDescription = false;
  isGeneratingHashtags = false;
  aiDescriptionSuggestions: string[] = [];
  aiHashtagSuggestions: string[] = [];
  
  // UI state
  hashtags = '';
  allSaved: Post[] = [];
  selectedScheduleDate: string = '';
  selectedScheduleTime: string = '';
  user_name: string = 'yourhandle';
  user_profile_image: string = 'assets/images/default-profile.svg';
  
  // Platform selection
  availablePlatforms: PlatformInfo[] = [];
  selectedPlatforms: { [key: string]: boolean } = {
    'instagram': true,
    'facebook': false,
    'twitter': false,
    'linkedin': false
  };
  isPlatformDropdownOpen = false; // Controls visibility of platform dropdown
  
  // Form state
  mediaFiles: File[] = [];
  mediaUploadError: string | null = null;
  isDragging = false;

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  private handleFiles(files: File[]): void {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      if (!isValidType) {
        this.mediaUploadError = 'Invalid file type. Please upload images or videos only.';
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      this.mediaUploadError = null;
      this.mediaFiles = [...this.mediaFiles, ...validFiles];
      
      // Process each file
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.newPost.media_items.push({
            id: `temp-${Date.now()}-${this.newPost.media_items.length}`,
            url: e.target.result,
            type: file.type.startsWith('image/') ? 'image' : 'video'
          });
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  handleFileInput(event: any): void {
    const files = event.target.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }
  
  // Errors and loading states
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  
  // Content Wizard state
  isContentWizardOpen = false;
  
  selectedAccount: ConnectedAccount | null = null;
  loading = false;

  currentUser: User | null = null;

  constructor(
    private instagramService: InstagramService,
    private aiService: AIService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private socialAccountsService: SocialAccountsApiService,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService,
    private router: Router,
    private dataService: DataService,
    private authService: AuthService
  ) {
    
    
    // Set user ID and username from service
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      if (currentUser.id) {
        this.newPost.user_id = currentUser.id;
      }
      if (currentUser.full_name) {
        this.user_name = currentUser.full_name.split(' ')[0].toLowerCase();
      }
    }
  }
  
  // Make sidebar collapse when in content creation mode
  @HostListener('window:load')
  onWindowLoad() {
    // Trigger an event to collapse sidebar
    document.dispatchEvent(new CustomEvent('content-creation-loaded'));
  }

  ngOnInit(): void {
    // Start with loading state
    this.isLoading = true;
    
    // Load available platforms
    this.loadAvailablePlatforms();
    
    // Check if we're editing an existing post
    this.route.queryParams.subscribe(params => {
      const postId = params['id'];
      if (postId) {
        this.loadPostForEditing(postId);
      } else {
        // If not editing, simulate loading delay
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.markForCheck(); // Trigger change detection
        }, 1000);
      }
    });
    
    // Load drafts
    this.loadSaved();
    
    // Trigger sidebar collapse on component init
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('content-creation-loaded'));
    }, 100);

    this.currentUser = this.authService.getCurrentUser();
  }
  
  /**
   * Load available platforms from the service
   */
  loadAvailablePlatforms(): void {
    this.loading = true;
    this.error = null;

    this.socialAccountsService.getPlatformInfo().subscribe({
      next: (platforms: PlatformInfo[]) => {
        this.availablePlatforms = platforms.filter(p => p.available);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        console.error('Error loading platforms:', err);
        this.error = 'Failed to load available platforms';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  /**
   * Handle platform selection change
   */
  onPlatformSelectionChange(platform: string, isChecked: boolean): void {
    this.selectedPlatforms[platform] = isChecked;
    
    // Update the post platform
    if (isChecked) {
      this.newPost.platform = platform as any;
    } else if (this.newPost.platform === platform) {
      // If the current platform was unchecked, select the first checked one
      const firstCheckedPlatform = Object.keys(this.selectedPlatforms)
        .find(p => this.selectedPlatforms[p]);
      
      if (firstCheckedPlatform) {
        this.newPost.platform = firstCheckedPlatform as any;
      }
    }
    
    this.cdr.markForCheck();
  }
  
  /**
   * Check if all available platforms are selected
   */
  isAllPlatformsSelected(): boolean {
    const platformKeys = Object.keys(this.selectedPlatforms);
    if (platformKeys.length === 0) return false;
    return platformKeys.every(platform => this.selectedPlatforms[platform]);
  }

  /**
   * Handle selecting/deselecting all platforms
   */
  onAllPlatformsSelectionChange(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    
    // Check if any platforms are available
    if (this.availablePlatforms.length === 0) {
      console.warn('No platforms available to select');
      return;
    }
    
    // If no platforms exist in the selected platforms object, add all available platforms
    if (Object.keys(this.selectedPlatforms).length === 0) {
      this.availablePlatforms.forEach(platform => {
        this.selectedPlatforms[platform.id] = isChecked;
      });
    } else {
      // Apply the same checked state to all available platforms
      Object.keys(this.selectedPlatforms).forEach(platform => {
        this.selectedPlatforms[platform] = isChecked;
      });
    }
    
    // If checked, set the platform to the first available one
    if (isChecked && this.availablePlatforms.length > 0) {
      this.newPost.platform = this.availablePlatforms[0].id as any;
    }
    
    // Close the dropdown after selection
    setTimeout(() => {
      this.isPlatformDropdownOpen = false;
    }, 300);
    
    this.cdr.markForCheck();
  }
  
  /**
   * Toggle platform dropdown visibility
   */
  togglePlatformDropdown(): void {
    this.isPlatformDropdownOpen = !this.isPlatformDropdownOpen;
  
    if (this.isPlatformDropdownOpen) {
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick);
      });
    } else {
      document.removeEventListener('click', this.handleOutsideClick);
    }
  
    this.cdr.markForCheck();
  }
  
  
  /**
   * Handle clicks outside the platform dropdown to close it
   */
  private handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.platform-dropdown');
    const container = document.querySelector('.platform-input-container');
    
    if (dropdown && container && 
        !dropdown.contains(target) && 
        !container.contains(target)) {
      this.isPlatformDropdownOpen = false;
      this.cdr.markForCheck();
      document.removeEventListener('click', this.handleOutsideClick);
    }
  }
  
  /**
   * Get selected platforms as text for display in input
   */
  getSelectedPlatformText(): string {
    const selected = Object.keys(this.selectedPlatforms)
      .filter(platform => this.selectedPlatforms[platform])
      .map(platform => {
        const platformInfo = this.availablePlatforms.find(p => p.id === platform);
        return platformInfo ? platformInfo.name : platform;
      });
    
    if (selected.length === 0) {
      return 'Select platforms...';
    }
    
    return selected.join(', ');
  }
  
  loadPostForEditing(postId: string): void {
    this.isLoading = true;
    this.apiService.get<{ drafts: any[] }>('post/draft/' + this.newPost.user_id).subscribe({
      next: (response) => {
        if (response.drafts && response.drafts.length > 0) {
          const draft = response.drafts.find(d => d.id === postId);
          if (draft) {
            // Parse the image_url string to array
            const imageUrls = JSON.parse(draft.image_url || '[]');
            // Parse the hashtags string to array
            const hashtags = JSON.parse(draft.socialAccount_post_hashtag || '[]');
            
            // Set the post data directly
            this.newPost = {
              title: '',
              description: draft.content || '',
              media_items: imageUrls.map((url: string) => ({ 
                id: Math.random().toString(36).substr(2, 9),
                url, 
                type: 'image' as const
              })),
              image_urls: imageUrls,
              hashtags: hashtags,
              type: PostType.IMAGE,
              user_id: this.newPost.user_id,
              platform: 'instagram',
              is_draft: true
            };

            // Set hashtags string for the textarea
            this.hashtags = hashtags.join(', ');

            this.isEditing = true;
            this.editingPostId = postId;
            this.currentTab = 'create';
          }
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.toastService.error(error.message || 'Failed to load post');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  loadSaved(): void {
    this.isLoading = true;
    this.apiService.get<{ drafts: any[] }>('post/draft/' + this.newPost.user_id).subscribe({
      next: (response) => {
        if (response.drafts && response.drafts.length > 0) {
          this.allSaved = response.drafts.map(draft => {
            // Parse the image_url string to array
            const imageUrls = JSON.parse(draft.image_url || '[]');
            // Parse the hashtags string to array
            const hashtags = JSON.parse(draft.socialAccount_post_hashtag || '[]');
            
            return {
              id: draft.id,
              title: '',
              description: draft.content || '',
              hashtags: hashtags,
              media_items: imageUrls.map((url: string) => ({
                id: Math.random().toString(36).substr(2, 9),
                url,
                type: 'image' as const
              })),
              image_urls: imageUrls,
              type: PostType.IMAGE,
              user_id: this.newPost.user_id,
              platform: 'instagram',
              status: PostStatus.SAVED,
              is_draft: true,
              created_at: new Date(),
              updated_at: new Date()
            };
          });
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.toastService.error(error.message || 'Failed to load drafts');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  switchTab(tab: 'create' | 'saved'): void {
    this.currentTab = tab;
    if (tab === 'saved') {
      this.loadSaved();
    }
  }
  
  removeMedia(index: number): void {
    this.newPost.media_items.splice(index, 1);
    this.mediaFiles.splice(index, 1);
  }
  
  generateDescription(): void {
    this.isGeneratingDescription = true;
    if (this.newPost.media_items.length === 0) {
      this.error = 'Please upload at least one image or video first';
      this.isGeneratingDescription = false;
      return;
    }
    
    this.aiDescriptionSuggestions = [];
    
    const mediaUrls = this.newPost.media_items.map(item => item.url);
    
    this.aiService.generateDescription(mediaUrls).subscribe({
      next: (response) => {
        this.newPost.description = response.content;
        if (response.alternativeOptions) {
          this.aiDescriptionSuggestions = response.alternativeOptions;
        }
        this.isGeneratingDescription = false;
      },
      error: (err) => {
        this.error = 'Failed to generate description';
        this.isGeneratingDescription = false;
        console.error('Error generating description:', err);
      }
    });
  }
  
  selectAlternativeDescription(description: string): void {
    this.newPost.description = description;
  }
  
  generateHashtags(): void {
    this.isGeneratingHashtags = true;
    if (this.newPost.media_items.length === 0 && !this.newPost.description) {
      this.error = 'Please upload media or add a description first';
      this.isGeneratingHashtags = false;
      return;
    }
    
    this.aiHashtagSuggestions = [];
    
    const mediaUrls = this.newPost.media_items.map(item => item.url);
    const context = this.newPost.description;
    
    this.aiService.generateHashtags(mediaUrls, context).subscribe({
      next: (response) => {
        this.hashtags = response.content;
        this.newPost.hashtags = this.hashtags
          .split(',')
          .map(tag => tag.replace(/^#/, '').trim())
          .filter(tag => tag.length > 0);
        
        if (response.alternativeOptions) {
          this.aiHashtagSuggestions = response.alternativeOptions;
        }
        this.isGeneratingHashtags = false;
      },
      error: (err) => {
        this.error = 'Failed to generate hashtags';
        this.isGeneratingHashtags = false;
        console.error('Error generating hashtags:', err);
      }
    });
  }
  
  selectAlternativeHashtags(hashtags: string): void {
    this.hashtags = hashtags;
    this.newPost.hashtags = this.hashtags
      .split(',')
      .map(tag => tag.replace(/^#/, '').trim())
      .filter(tag => tag.length > 0);
  }
  
  updateHashtags(): void {
    this.newPost.hashtags = this.hashtags
      .split(',')
      .map(tag => tag.replace(/^#/, '').trim())
      .filter(tag => tag.length > 0);
  }
  
  saved(): void {
    if (!this.validateForm()) return;

    this.isSaving = true;

    // First upload all media files
    const uploadPromises = this.mediaFiles.map(file => this.uploadImageToPublicUrl(file));

    Promise.all(uploadPromises)
      .then(uploadedUrls => {
        const postData = {
          user_id: this.newPost.user_id,
          content: this.newPost.description,
          image_url: uploadedUrls,
          hashtags: this.newPost.hashtags,
          platform: this.newPost.platform,
          is_draft: true
        };

        this.apiService.post<BackendPostResponse>('post/save-draft', postData).subscribe({
          next: (response) => {
            const successMessage = response.data?.id 
              ? `Draft saved successfully! (ID: ${response.data.id})`
              : 'Draft saved successfully!';
            this.toastService.success(successMessage);
            
            this.resetForm();
            this.currentTab = 'saved';
            
            // Fetch the latest draft
            this.apiService.get<{ success: boolean; data: BackendPost[] }>('post/draft/' + this.newPost.user_id).subscribe({
              next: (draftResponse) => {
                if (draftResponse.success && draftResponse.data.length > 0) {
                  const latestDraft = draftResponse.data[0];
                  this.allSaved = [{
                    id: latestDraft.id,
                    title: latestDraft.title || '',
                    description: latestDraft.description || '',
                    hashtags: latestDraft.hashtags || [],
                    media_items: latestDraft.image_urls.map(url => ({
                      id: Math.random().toString(36).substr(2, 9),
                      url,
                      type: 'image' as const
                    })),
                    image_urls: latestDraft.image_urls,
                    type: PostType.IMAGE,
                    user_id: latestDraft.user_id,
                    platform: latestDraft.platform,
                    status: PostStatus.SAVED,
                    is_draft: true,
                    created_at: new Date(),
                    updated_at: new Date()
                  }];
                }
                this.isSaving = false;
                this.cdr.markForCheck();
              },
              error: (error) => {
                this.toastService.error(error.message || 'Failed to load saved draft');
                this.isSaving = false;
                this.cdr.markForCheck();
              }
            });
          },
          error: (error) => {
            this.toastService.error(error.message || 'Failed to save draft');
            this.isSaving = false;
            this.cdr.markForCheck();
          }
        });
      })
      .catch(error => {
        this.toastService.error('Failed to upload images');
        this.isSaving = false;
        this.cdr.markForCheck();
      });
  }
  
  schedulePost(): void {
    if (!this.validateForm()) return;

    const scheduleDate = new Date(`${this.selectedScheduleDate}T${this.selectedScheduleTime}`);
    if (scheduleDate <= new Date()) {
      this.toastService.error('Please select a future date and time');
      return;
    }

    this.isSaving = true;
    const postData = {
      user_id: this.newPost.user_id,
      title: this.newPost.description.substring(0, 100),
      content: this.newPost.description,
      image_urls: this.newPost.media_items.map(item => item.url),
      hashtags: this.newPost.hashtags,
      platform: this.newPost.platform,
      scheduled_at: scheduleDate.toISOString(),
      is_draft: false
    };

    this.apiService.post<BackendPostResponse>('posts', postData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Post scheduled successfully');
          this.resetForm();
          this.loadSaved();
        }
        this.isSaving = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.toastService.error(error.message || 'Failed to schedule post');
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  async uploadImageToPublicUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);


      // Upload to your backend's image upload endpoint
      this.apiService.post<{ url: string }>('upload-image', formData, true).subscribe({
        next: (response) => {
          resolve(response.url);
        },
        error: (error) => {
          console.error('Upload failed:', error);
          reject(error);
        }
      });
      });
  }

  publishNow(): void {
    if (!this.validateForm()) return;
  
    this.isSaving = true;
  
    const file = this.mediaFiles[0];
  
    const publish = (imageUrl: string) => {
      const postData = {
        user_id: this.newPost.user_id,
        caption: this.newPost.description,
        imageUrl,
      };
  
      this.apiService.post<BackendPostResponse>('post/publish', postData).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Post published successfully');
            this.resetForm();
            this.loadSaved();
          } else {
            this.handlePublishError(response.error || 'Failed to publish post');
          }
          this.isSaving = false;
          this.cdr.markForCheck();
        },
        error: (error) => this.handleApiError(error)
      });
    };
  
    if (file) {
      this.uploadImageToPublicUrl(file).then(publish).catch(error => {
        this.toastService.error('Failed to upload image');
        this.isSaving = false;
        this.cdr.markForCheck();
      });
    } else if (this.newPost.media_items[0]?.url) {
      publish(this.newPost.media_items[0].url);
    } else {
      this.toastService.error('No image found for publishing');
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }  
  
  private handlePublishError(message: string, redirectToConnections: boolean = false) {
    this.toastService.error(message);
    if (redirectToConnections) {
      this.router.navigate(['/accounts-connect']);
    }
    this.isSaving = false;
    this.cdr.markForCheck();
  }
  
  private handleApiError(error: any) {
    let errorMessage = 'Failed to publish post';

    if (typeof error.error === 'string' && error.error.includes('<!DOCTYPE html>')) {
      errorMessage = 'Authentication failed. Please reconnect your Instagram account.';
      this.router.navigate(['/accounts-connect']);
    } else if (error.error?.code === 'AUTH_ERROR' || error.status === 401) {
      errorMessage = 'Authentication failed. Please reconnect your Instagram account.';
      this.router.navigate(['/accounts-connect']);
    } else if (error.error?.code === 'CONNECTION_ERROR' || error.status === 0) {
      errorMessage = 'Connection to Instagram failed. Please check your internet connection and try again.';
    } else if (error.error?.code) {
      switch (error.error.code) {
        case 190:
          errorMessage = 'Invalid or expired access token. Please reconnect your Instagram account.';
          this.router.navigate(['/accounts-connect']);
          break;
        case 100:
          errorMessage = 'Invalid parameter. Please check your post content.';
          break;
        case 200:
          errorMessage = 'Permission error. Please check your Instagram account permissions.';
          this.router.navigate(['/accounts-connect']);
          break;
        default:
          errorMessage = error.error.message || errorMessage;
      }
    }

    this.toastService.error(errorMessage);
    this.isSaving = false;
    this.cdr.markForCheck();
  }
  
  validateForm(): boolean {
    this.error = null;
    
    if (this.newPost.media_items.length === 0) {
      this.error = 'Please upload at least one image or video';
      this.toastService.error(this.error);
      return false;
    }
    
    if (!this.newPost.description || this.newPost.description.trim().length === 0) {
      this.error = 'Please enter a description for your post';
      this.toastService.error(this.error);
      return false;
    }
    
    // Check if at least one platform is selected
    const hasSelectedPlatform = Object.values(this.selectedPlatforms).some(value => value);
    if (!hasSelectedPlatform) {
      this.error = 'Please select at least one platform';
      this.toastService.error(this.error);
      return false;
    }
    
    return true;
  }
  
  resetForm(): void {
    this.newPost = {
      title: '',
      description: '',
      media_items: [],
      image_urls: [],
      hashtags: [],
      type: PostType.IMAGE,
      user_id: this.currentUser?.id || 0,
      platform: 'instagram',
      is_draft: true
    };
    this.hashtags = '';
    this.mediaFiles = [];
    this.selectedScheduleDate = '';
    this.selectedScheduleTime = '';
    this.error = null;
    this.isEditing = false;
    this.editingPostId = '';
    this.aiDescriptionSuggestions = [];
    this.aiHashtagSuggestions = [];
  }
  
  /**
   * TrackBy function for simple arrays to improve ngFor performance
   * @param index Index in the array
   * @returns Index as the identifier
   */
  trackByIndex(index: number): number {
    return index;
  }
  
  /**
   * TrackBy function for platform lists to improve ngFor performance
   * @param index Index in the array
   * @param item Platform item
   * @returns Unique identifier for the platform
   */
  trackByPlatformId(index: number, item: PlatformInfo): string {
    return item.id;
  }
  
  /**
   * TrackBy function for posts/drafts to improve ngFor performance
   * @param index Index in the array
   * @param item Post item
   * @returns Unique identifier for the post
   */
  trackByPostId(index: number, item: Post): string {
    return item.id;
  }
  
  editSaved(post: Post): void {
    this.loadPostForEditing(post.id);
    this.currentTab = 'create';
  }
  
  deleteSaved(post: Post): void {
    if (confirm('Are you sure you want to delete this saved post?')) {
      this.apiService.delete<BackendPostResponse>(`posts/${post.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Saved post deleted successfully');
            this.loadSaved();
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.toastService.error(error.message || 'Failed to delete saved post');
          this.cdr.markForCheck();
        }
      });
    }
  }
  
  scheduleSaved(data: { post: Post, date: Date }): void {
    this.toastService.info('Scheduling post...');
    this.instagramService.schedulePost(data.post.id, data.date).subscribe({
      next: () => {
        this.toastService.success('Post scheduled successfully');
        this.loadSaved();
      },
      error: (err) => {
        this.error = 'Failed to schedule post';
        this.toastService.error('Failed to schedule post');
        console.error('Error scheduling post:', err);
      }
    });
  }
  
  publishSaved(post: Post): void {
    this.toastService.info('Publishing post...');
    this.instagramService.publishPost(post.id).subscribe({
      next: () => {
        this.toastService.success('Post published successfully');
        this.loadSaved();
      },
      error: (err) => {
        this.error = 'Failed to publish post';
        this.toastService.error('Failed to publish post');
        console.error('Error publishing post:', err);
      }
    });
  }
  
  /**
   * Open the content wizard
   */
  openContentWizard(): void {
    this.isContentWizardOpen = true;
    this.cdr.markForCheck();
  }

  /**
   * Close the content wizard
   */
  closeContentWizard(): void {
    this.isContentWizardOpen = false;
    this.cdr.markForCheck();
  }

  /**
   * Handle content wizard submission
   */
  handleContentWizardSubmit(data: ContentWizardData): void {
    this.isLoading = true;
    this.error = null;
    const payload = { ...data };
    payload.platform = data.platform;
  
    this.apiService.post<any>('prompt/get-content', payload).subscribe({
      next: (response) => {
        try {
          // Parse the JSON string from the result
          const result = JSON.parse(response.result.replace(/```json\n|\n```/g, ''));
          
          // Set description directly from JSON
          this.newPost.description = result.description || '';
          
          // Set hashtags directly from JSON array
          this.hashtags = result.hashtags ? result.hashtags.join(' ') : '';
          this.newPost.hashtags = result.hashtags || [];
          
          // Set image if present in response
          if (response.imageUrl) {
            this.newPost.media_items = [{
              id: Date.now().toString(),
              url: response.imageUrl,
              type: 'image'
            }];
          } else {
            this.newPost.media_items = [];
          }
          
          // Set platform and type
          this.newPost.platform = data.platform.toLowerCase() as any;
          this.newPost.type = data.generateImage ? PostType.IMAGE : PostType.IMAGE;
          
          // Finalize
          this.closeContentWizard();
          this.toastService.show('Content generated successfully!', 'success');
        } catch (error) {
          this.error = 'Failed to parse content response';
          this.toastService.error(this.error);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Failed to generate content. Please try again.';
        this.isLoading = false;
        this.toastService.error(this.error);
        this.cdr.markForCheck();
      }
    });
  }
  

  loadPlatforms(): void {
    this.socialAccountsService.getConnectedAccounts().subscribe({
      next: (accounts: ConnectedAccount[]) => {
        this.connectedAccounts = accounts;
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        console.error('Error loading connected accounts:', err);
      }
    });
  }

  /**
   * TrackBy function for account lists to improve ngFor performance
   */
  trackByAccountId(index: number, item: ConnectedAccount): number {
    return item.id;
  }

  /**
   * Select an account for posting
   */
  selectAccount(account: ConnectedAccount): void {
    this.selectedAccount = account;
    this.newPost.platform = account.platform as 'instagram' | 'facebook' | 'twitter' | 'linkedin';
    this.cdr.markForCheck();
  }

  /**
   * Get account profile picture URL
   */
  getAccountProfilePicture(account: ConnectedAccount): string {
    return account.profile_image_url || 'assets/images/default-profile.svg';
  }

  /**
   * Get account display name
   */
  getAccountDisplayName(account: ConnectedAccount): string {
    return account.display_name || account.account_name || 'Unknown Account';
  }
}
