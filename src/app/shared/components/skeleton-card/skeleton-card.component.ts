import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent],
  template: `
    <div class="skeleton-card">
      <app-skeleton-loader type="card" height="240px"></app-skeleton-loader>
      <div class="skeleton-card-content">
        <div class="skeleton-card-header">
          <app-skeleton-loader type="text" width="70%" height="18px"></app-skeleton-loader>
          <app-skeleton-loader type="text" width="30%" height="14px"></app-skeleton-loader>
        </div>
        <app-skeleton-loader type="text" width="90%"></app-skeleton-loader>
        <app-skeleton-loader type="text" width="60%"></app-skeleton-loader>
        <div class="skeleton-card-actions">
          <app-skeleton-loader type="rect" width="80px" height="30px" borderRadius="4px"></app-skeleton-loader>
          <app-skeleton-loader type="rect" width="80px" height="30px" borderRadius="4px"></app-skeleton-loader>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      background-color: #fff;
      margin-bottom: 16px;
    }

    .skeleton-card-content {
      padding: 16px;
    }

    .skeleton-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .skeleton-card-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
  `]
})
export class SkeletonCardComponent {}