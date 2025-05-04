import { Directive, ElementRef, OnInit, Input, Renderer2 } from '@angular/core';

/**
 * Directive for lazy loading images to improve performance
 * Only loads images when they come into the viewport
 */
@Directive({
  selector: '[appLazyLoadImage]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit {
  @Input() appLazyLoadImage: string = '';
  
  private observer: IntersectionObserver | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // If Intersection Observer API is supported, use it
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            if (this.observer) {
              this.observer.disconnect();
            }
          }
        });
      }, { 
        threshold: 0.1 // Load when at least 10% of the image is visible
      });

      this.observer.observe(this.el.nativeElement);
    } else {
      // Fallback for browsers that don't support Intersection Observer
      this.loadImage();
    }
  }

  private loadImage(): void {
    // Add a loading state if needed
    this.renderer.addClass(this.el.nativeElement, 'loading');

    // Set the actual image source
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.appLazyLoadImage);

    // Listen for load event to remove loading state
    this.renderer.listen(this.el.nativeElement, 'load', () => {
      this.renderer.removeClass(this.el.nativeElement, 'loading');
      this.renderer.addClass(this.el.nativeElement, 'loaded');
    });

    // Listen for error event
    this.renderer.listen(this.el.nativeElement, 'error', () => {
      this.renderer.removeClass(this.el.nativeElement, 'loading');
      // Set a fallback image if needed
      this.renderer.setAttribute(this.el.nativeElement, 'src', 'assets/images/default-profile.svg');
    });
  }
}