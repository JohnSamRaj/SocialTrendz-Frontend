import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InstagramService } from '../../core/services/instagram.service';
import { Post, PostStatus } from '../../core/models/post.model';
import { CalendarComponent } from '../../shared/components/calendar/calendar.component';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CalendarComponent,
    PostCardComponent,
    SkeletonLoaderComponent,
    SkeletonCardComponent
  ],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  posts: Post[] = [];
  scheduledPosts: Post[] = [];
  selectedDate: Date | null = null;
  selectedPost: Post | null = null;
  
  isLoading = true;
  error: string | null = null;
  
  // Bulk scheduling
  showBulkScheduler = false;
  selectedPosts: { [id: string]: boolean } = {};
  bulkScheduleDate: string = '';
  bulkScheduleTime: string = '';
  
  // For template use
  PostStatus = PostStatus;
  
  constructor(private instagramService: InstagramService) { }
  
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  getUnpublishedPosts(): Post[] {
    return this.posts.filter(p => p.status !== PostStatus.PUBLISHED);
  }

  ngOnInit(): void {
    // Start with loading state
    this.isLoading = true;
    
    // Simulate initial loading delay
    setTimeout(() => {
      this.loadPosts();
    }, 1000);
  }
  
  loadPosts(): void {
    this.isLoading = true;
    this.error = null;
    
    this.instagramService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.scheduledPosts = posts.filter(post => post.status === PostStatus.SCHEDULED);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load posts';
        this.isLoading = false;
        console.error('Error loading posts:', err);
      }
    });
  }
  
  onDaySelected(date: Date): void {
    this.selectedDate = date;
    this.selectedPost = null;
  }
  
  onPostSelected(post: Post): void {
    this.selectedPost = post;
  }
  
  isDateToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  getFormattedDate(date: Date): string {
    if (this.isDateToday(date)) {
      return 'Today';
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }
  
  getPostsForSelectedDate(): Post[] {
    if (!this.selectedDate) return [];
    
    return this.posts.filter(post => {
      const targetDate = post.scheduledFor || post.publishedAt;
      if (!targetDate) return false;
      
      const postDate = new Date(targetDate);
      return postDate.getDate() === this.selectedDate!.getDate() &&
             postDate.getMonth() === this.selectedDate!.getMonth() &&
             postDate.getFullYear() === this.selectedDate!.getFullYear();
    });
  }
  
  handleEdit(post: Post): void {
    // Navigate to edit post
    window.location.href = `/content-creation?id=${post.id}`;
  }
  
  handleDelete(post: Post): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.instagramService.deletePost(post.id).subscribe({
        next: () => {
          this.loadPosts();
          if (this.selectedPost && this.selectedPost.id === post.id) {
            this.selectedPost = null;
          }
        },
        error: (err) => {
          this.error = 'Failed to delete post';
          console.error('Error deleting post:', err);
        }
      });
    }
  }
  
  handlePublish(post: Post): void {
    if (confirm('Are you sure you want to publish this post now?')) {
      this.instagramService.publishPost(post.id).subscribe({
        next: () => {
          this.loadPosts();
          if (this.selectedPost && this.selectedPost.id === post.id) {
            this.loadPostDetails(post.id);
          }
        },
        error: (err) => {
          this.error = 'Failed to publish post';
          console.error('Error publishing post:', err);
        }
      });
    }
  }
  
  handleSchedule(data: { post: Post, date: Date }): void {
    this.instagramService.schedulePost(data.post.id, data.date).subscribe({
      next: () => {
        this.loadPosts();
        if (this.selectedPost && this.selectedPost.id === data.post.id) {
          this.loadPostDetails(data.post.id);
        }
      },
      error: (err) => {
        this.error = 'Failed to schedule post';
        console.error('Error scheduling post:', err);
      }
    });
  }
  
  loadPostDetails(postId: string): void {
    this.instagramService.getPostById(postId).subscribe({
      next: (post) => {
        if (post) {
          this.selectedPost = post;
        }
      },
      error: (err) => {
        console.error('Error loading post details:', err);
      }
    });
  }
  
  toggleBulkScheduler(): void {
    this.showBulkScheduler = !this.showBulkScheduler;
    if (!this.showBulkScheduler) {
      this.selectedPosts = {};
    }
  }
  
  togglePostSelection(post: Post): void {
    if (this.selectedPosts[post.id]) {
      delete this.selectedPosts[post.id];
    } else {
      this.selectedPosts[post.id] = true;
    }
  }
  
  isPostSelected(post: Post): boolean {
    return !!this.selectedPosts[post.id];
  }
  
  getSelectedPostsCount(): number {
    return Object.keys(this.selectedPosts).length;
  }
  
  scheduleBulkPosts(): void {
    if (this.getSelectedPostsCount() === 0) {
      this.error = 'Please select at least one post to schedule';
      return;
    }
    
    if (!this.bulkScheduleDate || !this.bulkScheduleTime) {
      this.error = 'Please select both date and time for scheduling';
      return;
    }
    
    const scheduledDateTime = new Date(`${this.bulkScheduleDate}T${this.bulkScheduleTime}`);
    
    if (scheduledDateTime <= new Date()) {
      this.error = 'Scheduled time must be in the future';
      return;
    }
    
    const selectedPostIds = Object.keys(this.selectedPosts);
    let completedCount = 0;
    let errorCount = 0;
    
    selectedPostIds.forEach(postId => {
      this.instagramService.schedulePost(postId, scheduledDateTime).subscribe({
        next: () => {
          completedCount++;
          if (completedCount + errorCount === selectedPostIds.length) {
            this.finishBulkScheduling(errorCount);
          }
        },
        error: () => {
          errorCount++;
          if (completedCount + errorCount === selectedPostIds.length) {
            this.finishBulkScheduling(errorCount);
          }
        }
      });
    });
  }
  
  finishBulkScheduling(errorCount: number): void {
    this.loadPosts();
    this.selectedPosts = {};
    this.showBulkScheduler = false;
    
    if (errorCount > 0) {
      this.error = `Scheduling completed with ${errorCount} errors`;
    } else {
      alert('All selected posts have been scheduled successfully');
    }
  }
}
