import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaItem } from '../../../core/models/post.model';
import { LazyLoadImageDirective } from '../../directives/lazy-load-image.directive';

@Component({
  selector: 'app-instagram-preview',
  standalone: true,
  imports: [CommonModule, LazyLoadImageDirective],
  templateUrl: './instagram-preview.component.html',
  styleUrls: ['./instagram-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstagramPreviewComponent implements OnChanges {
  @Input() hashtags: string[] = [];
  @Input() media_items: MediaItem[] = [];
  @Input() user_name: string = 'user_name';
  @Input() user_profile_image: string = 'assets/images/default-profile.png';
  @Input() description: string = '';
  
  formattedCaption: string = '';
  formattedHashtags: string = '';
  currentSlide: number = 0;
  
  constructor(private cdr: ChangeDetectorRef) { }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['media_items']) {
      this.currentSlide = 0;
    }
    if (changes['description'] || changes['hashtags']) {
      this.formatCaptionAndHashtags();
    }
  }
  
  formatCaptionAndHashtags(): void {
    this.formattedCaption = this.description;
    
    // Format hashtags with # symbol
    this.formattedHashtags = this.hashtags
      .map(tag => `#${tag}`)
      .join(' ');
  }
  
  nextSlide(): void {
    if (this.currentSlide < this.media_items.length - 1) {
      this.currentSlide++;
    }
  }
  
  prevSlide(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }
  
  get currentMedia(): MediaItem | null {
    return this.media_items.length > 0 ? this.media_items[this.currentSlide] : null;
  }
  
  // Cache for media orientations to avoid recalculation
  private mediaOrientationCache: Map<string, string> = new Map();
  
  // Detect media orientation for proper display (portrait, landscape, or square)
  getMediaOrientation(media: MediaItem): string {
    // Return from cache if already calculated
    if (this.mediaOrientationCache.has(media.id)) {
      return this.mediaOrientationCache.get(media.id)!;
    }
    
    // Default to square until we can determine the actual orientation
    this.mediaOrientationCache.set(media.id, 'square');
    
    if (media.type === 'image') {
      const img = new Image();
      
      // When the image loads, calculate and cache its orientation
      img.onload = () => {
        let orientation = 'square';
        
        if (img.naturalWidth > img.naturalHeight) {
          orientation = 'landscape';
        } else if (img.naturalWidth < img.naturalHeight) {
          orientation = 'portrait';
        }
        
        this.mediaOrientationCache.set(media.id, orientation);
        // Trigger change detection to update the UI
        this.cdr.detectChanges();
      };
      
      img.src = media.url;
    }
    
    return this.mediaOrientationCache.get(media.id)!;
  }
  
  get formattedDate(): string {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * TrackBy function for media items to improve ngFor performance
   * @param index Index in the array
   * @param item Media item
   * @returns Unique identifier for the media item
   */
  trackByMediaId(index: number, item: MediaItem): string {
    return item.id;
  }
}