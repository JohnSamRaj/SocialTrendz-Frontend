import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post, PostStatus } from '../../../core/models/post.model';
import { FormsModule } from '@angular/forms';
import { LazyLoadImageDirective } from '../../directives/lazy-load-image.directive';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, LazyLoadImageDirective],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent {
  @Input() post!: Post;
  @Input() showActions: boolean = true;
  @Input() showStatus: boolean = true;
  
  @Output() edit = new EventEmitter<Post>();
  @Output() delete = new EventEmitter<Post>();
  @Output() publish = new EventEmitter<Post>();
  @Output() schedule = new EventEmitter<{ post: Post, date: Date }>();
  
  isOptionsOpen = false;
  isScheduleOpen = false;
  selectedDate: string = '';
  selectedTime: string = '';
  
  PostStatus = PostStatus; // Make enum available in template
  
  constructor() { }
  
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  toggleOptions(): void {
    this.isOptionsOpen = !this.isOptionsOpen;
    if (this.isOptionsOpen) {
      this.isScheduleOpen = false;
    }
  }
  
  toggleSchedule(): void {
    this.isScheduleOpen = !this.isScheduleOpen;
    if (this.isScheduleOpen) {
      this.isOptionsOpen = false;
      
      // Set default date and time (tomorrow, same time)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      this.selectedDate = tomorrow.toISOString().split('T')[0];
      this.selectedTime = `${String(tomorrow.getHours()).padStart(2, '0')}:${String(tomorrow.getMinutes()).padStart(2, '0')}`;
    }
  }
  
  onEdit(): void {
    this.edit.emit(this.post);
    this.isOptionsOpen = false;
  }
  
  onDelete(): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.delete.emit(this.post);
    }
    this.isOptionsOpen = false;
  }
  
  onPublish(): void {
    if (confirm('Are you sure you want to publish this post now?')) {
      this.publish.emit(this.post);
    }
    this.isOptionsOpen = false;
  }
  
  onScheduleSubmit(): void {
    if (!this.selectedDate || !this.selectedTime) {
      alert('Please select both date and time');
      return;
    }
    
    const scheduledDateTime = new Date(`${this.selectedDate}T${this.selectedTime}`);
    
    if (scheduledDateTime <= new Date()) {
      alert('Schedule time must be in the future');
      return;
    }
    
    this.schedule.emit({ post: this.post, date: scheduledDateTime });
    this.isScheduleOpen = false;
  }
  
  getFormattedDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getStatusClass(): string {
    if (!this.post.status) return '';
    
    switch (this.post.status) {
      case PostStatus.PUBLISHED:
        return 'status-published';
      case PostStatus.SCHEDULED:
        return 'status-scheduled';
      case PostStatus.SAVED:
        return 'status-saved';
      case PostStatus.FAILED:
        return 'status-failed';
      default:
        return '';
    }
  }
  
  getStatusLabel(): string {
    if (!this.post.status) return '';
    
    switch (this.post.status) {
      case PostStatus.PUBLISHED:
        return 'Published';
      case PostStatus.SCHEDULED:
        return 'Scheduled';
      case PostStatus.SAVED:
        return 'Saved';
      case PostStatus.FAILED:
        return 'Failed';
      default:
        return this.post.status;
    }
  }
  
  /**
   * TrackBy function for ngFor loops to improve performance
   * @param index Index of the item in the array
   */
  trackByIndex(index: number): number {
    return index;
  }
}
