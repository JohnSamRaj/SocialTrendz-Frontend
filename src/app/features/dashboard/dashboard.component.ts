import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InstagramService } from '../../core/services/instagram.service';
import { AuthService } from '../../core/auth/auth.service';
import { TourService } from '../../core/services/tour.service';
import { Post, PostStatus } from '../../core/models/post.model';
import { ConnectedAccount } from '../../core/models/connected-account.model';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { OnboardingModalComponent } from '../../shared/components/onboarding-modal/onboarding-modal.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';
import { ToastService } from '../../shared/services/toast.service';
import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PostCardComponent,
    OnboardingModalComponent,
    SkeletonLoaderComponent,
    SkeletonCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  posts: Post[] = [];
  recentPosts: Post[] = [];
  draftPosts: Post[] = [];
  scheduledPosts: Post[] = [];

  engagementData: any = {};
  growthData: any = {};

  isLoading = true;
  error: string | null = null;
  isOnboardingModalVisible = false;
  
  // For enum access in template
  PostStatus = PostStatus;

  constructor(
    private instagramService: InstagramService,
    public authService: AuthService,
    private tourService: TourService,
    private toastService: ToastService
  ) { }

  // Helper methods for the template
  getScheduledPostsCount(): number {
    return this.posts.filter(post => post.status === PostStatus.SCHEDULED).length;
  }

  getDraftPostsCount(): number {
    return this.posts.filter(post => post.status === PostStatus.DRAFT).length;
  }

  getPublishedPostsCount(): number {
    return this.posts.filter(post => post.status === PostStatus.PUBLISHED).length;
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Load posts
    this.instagramService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.recentPosts = posts
          .filter(post => post.status === PostStatus.PUBLISHED)
          .sort((a, b) => 
            (new Date(b.published_at || 0)).getTime() - 
            (new Date(a.published_at || 0)).getTime()
          )
          .slice(0, 4);

        this.draftPosts = posts
          .filter(post => post.status === PostStatus.DRAFT)
          .slice(0, 3);

        this.scheduledPosts = posts
          .filter(post => post.status === PostStatus.SCHEDULED)
          .sort((a, b) => 
            (new Date(a.scheduled_at || 0)).getTime() - 
            (new Date(b.scheduled_at || 0)).getTime()
          )
          .slice(0, 3);

        this.loadAnalytics();
      },
      error: (err) => {
        // this.error = 'Failed to load posts. Please try again.';
        this.isLoading = false;
        console.error('Error loading posts:', err);
      }
    });
  }

  loadAnalytics(): void {
    this.instagramService.getInstagramInsights().subscribe({
      next: (analytics) => {
        // Prepare engagement data for chart
        const dates = analytics.engagementMetrics.slice(-14).map((metric: any) => 
          new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );

        const engagementRates = analytics.engagementMetrics.slice(-14).map((metric: any) => 
          metric.engagementRate.toFixed(2)
        );

        this.engagementData = {
          labels: dates,
          datasets: [
            {
              label: 'Engagement Rate (%)',
              data: engagementRates,
              borderColor: '#FF6701',
              backgroundColor: '#FFC288',
              tension: 0.4,
              fill: true
            }
          ]
        };

        // Prepare followers growth data
        const growthDates = analytics.accountGrowth.slice(-7).map((growth: any) => 
          new Date(growth.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );

        const followersCount = analytics.accountGrowth.slice(-7).map((growth: any) => 
          growth.followers
        );

        this.growthData = {
          labels: growthDates,
          datasets: [
            {
              label: 'Followers',
              data: followersCount,
              backgroundColor: '#FFC288',
              borderRadius: 6
            }
          ]
        };

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load analytics. Please try again.';
        this.isLoading = false;
        console.error('Error loading analytics:', err);
      }
    });
  }

  handleEdit(post: Post): void {
    // Navigate to edit post
    window.location.href = `/content-creation?id=${post.id}`;
  }

  handleDelete(post: Post): void {
    this.instagramService.deletePost(post.id).subscribe({
      next: (success) => {
        if (success) {
          this.toastService.success('Post deleted successfully!');
          this.loadDashboardData();
        } else {
          this.toastService.error('Failed to delete post. Please try again.');
        }
      },
      error: (err) => {
        console.error('Error deleting post:', err);
        this.toastService.error('Failed to delete post. Please try again.');
      }
    });
  }

  handlePublish(post: Post): void {
    this.instagramService.publishPost(post.id).subscribe({
      next: (updatedPost) => {
        this.toastService.success('Post published successfully!');
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Error publishing post:', err);
        this.toastService.error('Failed to publish post. Please try again.');
      }
    });
  }

  handleSchedule(data: { post: Post, date: Date }): void {
    const scheduledDate = new Date(data.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    this.instagramService.schedulePost(data.post.id, data.date).subscribe({
      next: (updatedPost) => {
        this.toastService.success(`Post scheduled successfully for ${scheduledDate}!`);
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Error scheduling post:', err);
        this.toastService.error('Failed to schedule post. Please try again.');
      }
    });
  }

  /**
   * Check if the user has connected accounts 
   * This is now just informational and doesn't block dashboard content
   */
  checkConnectedAccounts(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return;
    }
    
    // Get connected accounts from the service
    this.instagramService.getConnectedAccounts().subscribe({
      next: (accounts: ConnectedAccount[]) => {
        // Log connected accounts for debugging
        console.debug('Connected accounts:', accounts);
      },
      error: (err: Error) => {
        console.error('Error checking connected accounts:', err);
      }
    });
  }

  showOnboardingModal(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.has_completed_onboarding) {
      this.isOnboardingModalVisible = true;
      // Clear any session storage flags to ensure modal shows
      sessionStorage.removeItem('has_seen_onboarding');
    } else {
      this.toastService.info('You have already completed the onboarding process.');
    }
  }

  onOnboardingCompleted(): void {
    this.isOnboardingModalVisible = false;
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      currentUser.has_completed_onboarding = true;
      this.authService.updateCurrentUser(currentUser);
    }
    this.loadDashboardData();
  }

  onOnboardingSkipped(): void {
    this.isOnboardingModalVisible = false;
  }

  ngOnInit(): void {
    // Start with loading state
    this.isLoading = true;
    
    // Load dashboard data
    this.loadDashboardData();
    
    // Check connected accounts
    this.checkConnectedAccounts();
    
    // Show welcome message after a short delay
    setTimeout(() => {
      // Check if we need to show a social login success message
      const socialLoginSuccess = sessionStorage.getItem('socialLoginSuccess');
      if (socialLoginSuccess) {
        // Show toast message using the service
        this.toastService.success(socialLoginSuccess);
        
        // Clear the flag so it doesn't trigger again
        sessionStorage.removeItem('socialLoginSuccess');
      }
      
      // Check if we need to show a platform connection error message
      const platformConnectError = sessionStorage.getItem('platformConnectError');
      if (platformConnectError) {
        // Show toast message using the service
        this.toastService.error(platformConnectError);
        
        // Clear the flag so it doesn't trigger again
        sessionStorage.removeItem('platformConnectError');
      }
    }, 1500);
  }
}