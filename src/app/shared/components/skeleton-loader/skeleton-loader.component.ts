import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton-loader"
      [ngClass]="type"
      [ngStyle]="{
        width: width,
        height: height,
        borderRadius: borderRadius
      }"
    ></div>
  `,
  styles: [`
    .skeleton-loader {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      margin-bottom: 8px;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    .text {
      height: 16px;
      border-radius: 4px;
    }

    .title {
      height: 24px;
      border-radius: 4px;
    }

    .circle {
      border-radius: 50%;
    }

    .card {
      height: 200px;
      border-radius: 8px;
    }
    
    .rect {
      border-radius: 4px;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: 'text' | 'title' | 'circle' | 'card' | 'rect' = 'text';
  @Input() width: string = '100%';
  @Input() height: string = '16px';
  @Input() borderRadius: string = '';
}