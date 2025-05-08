import { Component, OnInit, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { InstagramService } from '../../core/services/instagram.service';
import { AIService } from '../../core/services/ai.service';
import { ToastService } from '../../shared/services/toast.service';
import { Post, PostStatus, PostType, MediaItem, DraftPost } from '../../core/models/post.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { InstagramPreviewComponent } from '../../shared/components/instagram-preview/instagram-preview.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { ConnectedAccountsService } from '../../core/services/connected-accounts.service';
import { PlatformInfo, ConnectedAccount } from '../../core/models/connected-account.model';
import { LazyLoadImageDirective } from '../../shared/directives/lazy-load-image.directive';
import { ContentWizardComponent, ContentWizardData } from './content-wizard/content-wizard.component';
import { ApiService } from '../../core/services/api.service';

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
    ContentWizardComponent
  ],
  templateUrl: './content-creation.component.html',
  styleUrls: ['./content-creation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentCreationComponent implements OnInit {
  currentTab: 'create' | 'drafts' = 'create';
  
  // For template access
  PostStatus = PostStatus;
  
  // Helper method for template
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  // New post data
  newPost: DraftPost = {
    caption: '',
    mediaItems: [],
    hashtags: [],
    type: PostType.IMAGE,
    userId: 0,
    platform: 'instagram'
  };
  
  // For editing an existing post
  isEditing = false;
  editingPostId = '';
  
  // AI generation
  isGeneratingCaption = false;
  isGeneratingHashtags = false;
  aiCaptionSuggestions: string[] = [];
  aiHashtagSuggestions: string[] = [];
  
  // UI state
  hashtags = '';
  allDrafts: Post[] = [];
  selectedScheduleDate: string = '';
  selectedScheduleTime: string = '';
  username: string = 'yourhandle';
  profileImage: string = 'assets/images/default-profile.svg';
  
  // Platform selection
  availablePlatforms: PlatformInfo[] = [];
  connectedAccounts: ConnectedAccount[] = [];
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
  
  // Errors and loading states
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  
  // Content Wizard state
  isContentWizardOpen = false;
  
  constructor(
    private instagramService: InstagramService,
    private aiService: AIService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private connectedAccountsService: ConnectedAccountsService,
    private cdr: ChangeDetectorRef,
    private apiService: ApiService
  ) { 
    // Set user ID and username from service
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      if (currentUser.id) {
        this.newPost.userId = currentUser.id;
      }
      if (currentUser.fullName) {
        this.username = currentUser.fullName.split(' ')[0].toLowerCase();
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
    
    // Load available platforms and connected accounts
    this.loadPlatforms();
    
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
    this.loadDrafts();
    
    // Trigger sidebar collapse on component init
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('content-creation-loaded'));
    }, 100);
  }
  
  /**
   * Load available social media platforms
   */
  loadPlatforms(): void {
    this.connectedAccountsService.getPlatformInfo().subscribe({
      next: (platforms) => {
        this.availablePlatforms = platforms.filter(p => p.available);
        this.cdr.markForCheck(); // Trigger change detection
      },
      error: (err) => {
        console.error('Error loading platforms:', err);
      }
    });
    
    this.connectedAccountsService.getConnectedAccounts().subscribe({
      next: (accounts) => {
        this.connectedAccounts = accounts;
        this.cdr.markForCheck(); // Trigger change detection
      },
      error: (err) => {
        console.error('Error loading connected accounts:', err);
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
    this.cdr.markForCheck();
    
    if (this.isPlatformDropdownOpen) {
      // Add click outside listener to close dropdown when clicking elsewhere
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick);
      });
    }
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
    this.isEditing = true;
    this.editingPostId = postId;
    
    this.instagramService.getPostById(postId).subscribe({
      next: (post) => {
        if (post) {
          this.newPost = {
            caption: post.caption,
            mediaItems: [...post.mediaItems],
            hashtags: [...post.hashtags],
            type: post.type,
            userId: post.userId,
            platform: post.platform,
            scheduledFor: post.scheduledFor
          };
          
          // Set hashtags for display
          this.hashtags = post.hashtags.join(' ');
          
          // Set schedule date/time if available
          if (post.scheduledFor) {
            const date = new Date(post.scheduledFor);
            this.selectedScheduleDate = date.toISOString().split('T')[0];
            this.selectedScheduleTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
          
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load post for editing';
        this.isLoading = false;
        console.error('Error loading post:', err);
      }
    });
  }
  
  loadDrafts(): void {
    this.instagramService.getDraftPosts().subscribe({
      next: (drafts) => {
        this.allDrafts = drafts;
      },
      error: (err) => {
        console.error('Error loading drafts:', err);
      }
    });
  }
  
  switchTab(tab: 'create' | 'drafts'): void {
    this.currentTab = tab;
    if (tab === 'drafts') {
      this.loadDrafts();
    }
  }
  
  handleFileInput(event: any): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    this.mediaUploadError = null;
    
    // Validate file types (only images and videos)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        this.mediaUploadError = 'Only image and video files are allowed';
        return;
      }
      
      // Add to media files
      this.mediaFiles.push(file);
      
      // Create a preview and add to post media items
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const mediaItem: MediaItem = {
          id: `temp-${Date.now()}-${i}`,
          url: e.target.result,
          type: file.type.startsWith('image/') ? 'image' : 'video'
        };
        this.newPost.mediaItems.push(mediaItem);
      };
      reader.readAsDataURL(file);
    }
    
    // In a real app, we would upload these files to a server
    // For now, we'll just use the local preview URLs
  }
  
  removeMedia(index: number): void {
    this.newPost.mediaItems.splice(index, 1);
    this.mediaFiles.splice(index, 1);
  }
  
  generateCaption(): void {
    if (this.newPost.mediaItems.length === 0) {
      this.error = 'Please upload at least one image or video first';
      return;
    }
    
    this.isGeneratingCaption = true;
    this.aiCaptionSuggestions = [];
    
    const mediaUrls = this.newPost.mediaItems.map(item => item.url);
    
    this.aiService.generateCaption(mediaUrls).subscribe({
      next: (response) => {
        this.newPost.caption = response.content;
        if (response.alternativeOptions) {
          this.aiCaptionSuggestions = response.alternativeOptions;
        }
        this.isGeneratingCaption = false;
      },
      error: (err) => {
        this.error = 'Failed to generate caption';
        this.isGeneratingCaption = false;
        console.error('Error generating caption:', err);
      }
    });
  }
  
  selectAlternativeCaption(caption: string): void {
    this.newPost.caption = caption;
  }
  
  generateHashtags(): void {
    if (this.newPost.mediaItems.length === 0 && !this.newPost.caption) {
      this.error = 'Please upload media or add a caption first';
      return;
    }
    
    this.isGeneratingHashtags = true;
    this.aiHashtagSuggestions = [];
    
    const mediaUrls = this.newPost.mediaItems.map(item => item.url);
    const context = this.newPost.caption;
    
    this.aiService.generateHashtags(mediaUrls, context).subscribe({
      next: (response) => {
        this.hashtags = response.content;
        this.newPost.hashtags = this.hashtags
          .split(' ')
          .map(tag => tag.startsWith('#') ? tag.substring(1) : tag)
          .filter(tag => tag.trim().length > 0);
        
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
      .split(' ')
      .map(tag => tag.startsWith('#') ? tag.substring(1) : tag)
      .filter(tag => tag.trim().length > 0);
  }
  
  updateHashtags(): void {
    this.newPost.hashtags = this.hashtags
      .split(' ')
      .map(tag => tag.startsWith('#') ? tag.substring(1) : tag)
      .filter(tag => tag.trim().length > 0);
  }
  
  saveAsDraft(): void {
    if (this.validateForm()) {
      this.isSaving = true;
      
      if (this.isEditing) {
        this.instagramService.updatePost(this.editingPostId, {
          caption: this.newPost.caption,
          mediaItems: this.newPost.mediaItems,
          hashtags: this.newPost.hashtags,
          status: PostStatus.DRAFT
        }).subscribe({
          next: () => {
            this.isSaving = false;
            this.toastService.success('Post updated successfully');
            this.resetForm();
            this.loadDrafts();
            this.currentTab = 'drafts';
          },
          error: (err) => {
            this.error = 'Failed to update post';
            this.isSaving = false;
            console.error('Error updating post:', err);
          }
        });
      } else {
        this.instagramService.createPost(this.newPost).subscribe({
          next: () => {
            this.isSaving = false;
            this.toastService.success('Draft saved successfully');
            this.resetForm();
            this.loadDrafts();
            this.currentTab = 'drafts';
          },
          error: (err) => {
            this.error = 'Failed to save draft';
            this.isSaving = false;
            console.error('Error saving draft:', err);
          }
        });
      }
    }
  }
  
  schedulePost(): void {
    if (!this.selectedScheduleDate || !this.selectedScheduleTime) {
      this.error = 'Please select both date and time for scheduling';
      return;
    }
    
    if (this.validateForm()) {
      const scheduledDateTime = new Date(`${this.selectedScheduleDate}T${this.selectedScheduleTime}`);
      
      if (scheduledDateTime <= new Date()) {
        this.error = 'Scheduled time must be in the future';
        return;
      }
      
      this.isSaving = true;
      this.newPost.scheduledFor = scheduledDateTime;
      
      if (this.isEditing) {
        this.instagramService.updatePost(this.editingPostId, {
          caption: this.newPost.caption,
          mediaItems: this.newPost.mediaItems,
          hashtags: this.newPost.hashtags,
          status: PostStatus.SCHEDULED,
          scheduledFor: scheduledDateTime
        }).subscribe({
          next: () => {
            this.isSaving = false;
            this.toastService.success('Post scheduled successfully');
            this.resetForm();
          },
          error: (err) => {
            this.error = 'Failed to schedule post';
            this.isSaving = false;
            console.error('Error scheduling post:', err);
          }
        });
      } else {
        this.instagramService.createPost(this.newPost).subscribe({
          next: () => {
            this.isSaving = false;
            this.toastService.success('Post scheduled successfully');
            this.resetForm();
          },
          error: (err) => {
            this.error = 'Failed to schedule post';
            this.isSaving = false;
            console.error('Error scheduling post:', err);
          }
        });
      }
    }
  }
  
  publishNow(): void {
    if (this.validateForm()) {
      this.isSaving = true;
      
      if (this.isEditing) {
        this.instagramService.updatePost(this.editingPostId, {
          caption: this.newPost.caption,
          mediaItems: this.newPost.mediaItems,
          hashtags: this.newPost.hashtags
        }).subscribe({
          next: (updatedPost) => {
            this.instagramService.publishPost(updatedPost.id).subscribe({
              next: () => {
                this.isSaving = false;
                this.toastService.success('Post published successfully');
                this.resetForm();
              },
              error: (err) => {
                this.error = 'Failed to publish post';
                this.isSaving = false;
                console.error('Error publishing post:', err);
              }
            });
          },
          error: (err) => {
            this.error = 'Failed to update post';
            this.isSaving = false;
            console.error('Error updating post:', err);
          }
        });
      } else {
        this.instagramService.createPost(this.newPost).subscribe({
          next: (newPost) => {
            this.instagramService.publishPost(newPost.id).subscribe({
              next: () => {
                this.isSaving = false;
                this.toastService.success('Post published successfully');
                this.resetForm();
              },
              error: (err) => {
                this.error = 'Failed to publish post';
                this.isSaving = false;
                console.error('Error publishing post:', err);
              }
            });
          },
          error: (err) => {
            this.error = 'Failed to create post';
            this.isSaving = false;
            console.error('Error creating post:', err);
          }
        });
      }
    }
  }
  
  validateForm(): boolean {
    this.error = null;
    
    if (this.newPost.mediaItems.length === 0) {
      this.error = 'Please upload at least one image or video';
      this.toastService.error(this.error);
      return false;
    }
    
    if (!this.newPost.caption || this.newPost.caption.trim().length === 0) {
      this.error = 'Please enter a caption for your post';
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
      caption: '',
      mediaItems: [],
      hashtags: [],
      type: PostType.IMAGE,
      userId: this.newPost.userId,
      platform: 'instagram'
    };
    this.hashtags = '';
    this.mediaFiles = [];
    this.selectedScheduleDate = '';
    this.selectedScheduleTime = '';
    this.error = null;
    this.isEditing = false;
    this.editingPostId = '';
    this.aiCaptionSuggestions = [];
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
   * TrackBy function for account lists to improve ngFor performance
   * @param index Index in the array
   * @param item Connected account item
   * @returns Unique identifier for the account
   */
  trackByAccountId(index: number, item: ConnectedAccount): string {
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
  
  editDraft(post: Post): void {
    this.loadPostForEditing(post.id);
    this.currentTab = 'create';
  }
  
  deleteDraft(post: Post): void {
    if (confirm('Are you sure you want to delete this draft?')) {
      this.toastService.info('Deleting draft...');
      this.instagramService.deletePost(post.id).subscribe({
        next: () => {
          this.toastService.success('Draft deleted successfully');
          this.loadDrafts();
        },
        error: (err) => {
          this.error = 'Failed to delete draft';
          this.toastService.error('Failed to delete draft');
          console.error('Error deleting draft:', err);
        }
      });
    }
  }
  
  scheduleDraft(data: { post: Post, date: Date }): void {
    this.toastService.info('Scheduling post...');
    this.instagramService.schedulePost(data.post.id, data.date).subscribe({
      next: () => {
        this.toastService.success('Post scheduled successfully');
        this.loadDrafts();
      },
      error: (err) => {
        this.error = 'Failed to schedule post';
        this.toastService.error('Failed to schedule post');
        console.error('Error scheduling post:', err);
      }
    });
  }
  
  publishDraft(post: Post): void {
    this.toastService.info('Publishing post...');
    this.instagramService.publishPost(post.id).subscribe({
      next: () => {
        this.toastService.success('Post published successfully');
        this.loadDrafts();
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

    // Always send the correct platform
    payload.platform = data.platform;

    this.apiService.post<any>('prompt/get-content', payload).subscribe({
      next: (response) => {
        // 1. Extract description/caption
        let caption = '';
        // Try to find the first paragraph after "Content Insight and Strategy" or similar
        const insightMatch = response.result.match(/(?:Content Insight and Strategy:|Description:|### Instagram Reel Description:|^\\d+\\.\\s*)[\\s\\S]*?(?:\\n|\\r|\\r\\n)([\\s\\S]*?)(?:\\n\\d+\\.|\\n#|\\n\\*\\*|\\n4\\.|$)/i);
        if (insightMatch && insightMatch[1]) {
          caption = insightMatch[1].trim();
        } else {
          // fallback: use the whole result
          caption = response.result.trim();
        }
        this.newPost.caption = caption;

        // 2. Extract hashtags (look for lines with #)
        let hashtags = '';
        const hashtagMatch = response.result.match(/#\\w[\\w\\d_# ]+/);
        if (hashtagMatch) {
          hashtags = hashtagMatch[0].trim();
        } else {
          // fallback: look for Hashtags/Keywords section
          const hashSection = response.result.match(/Hashtags[\\s\\S]*?#([\\w# ]+)/i);
          if (hashSection && hashSection[1]) {
            hashtags = hashSection[1].trim();
          }
        }
        this.hashtags = hashtags;
        this.newPost.hashtags = hashtags
          .split(/[#\\s]+/)
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        // 3. Set image if present
        if (response.imageUrl) {
          this.newPost.mediaItems = [{
            id: Date.now().toString(),
            url: response.imageUrl,
            type: 'image'
          }];
        } else {
          this.newPost.mediaItems = [];
        }

        // 4. Set platform and type
        this.newPost.platform = data.platform.toLowerCase() as any;
        this.newPost.type = data.generateImage ? PostType.IMAGE : PostType.IMAGE;

        // 5. Close wizard and update UI
        this.closeContentWizard();
        this.toastService.show('Content generated successfully!', 'success');
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
}
