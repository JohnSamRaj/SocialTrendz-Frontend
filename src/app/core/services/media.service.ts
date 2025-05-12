import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ToastService } from '../../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly API_BASE = '/api/media';

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  /**
   * Upload media files
   */
  uploadMedia(files: File[]): Observable<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('media', file);
    });

    return this.apiService.post<string[]>(`${this.API_BASE}/upload`, formData).pipe(
      catchError(error => {
        this.toastService.error('Failed to upload media');
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete media
   */
  deleteMedia(mediaId: string): Observable<void> {
    return this.apiService.delete(`${this.API_BASE}/${mediaId}`).pipe(
      catchError(error => {
        this.toastService.error('Failed to delete media');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get media preview URL
   */
  getMediaPreviewUrl(mediaId: string): string {
    return `${this.API_BASE}/preview/${mediaId}`;
  }

  /**
   * Validate media file
   */
  validateMediaFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!validTypes.includes(file.type)) {
      this.toastService.error('Invalid file type. Only JPG, PNG, GIF, and MP4 files are allowed.');
      return false;
    }

    if (file.size > maxSize) {
      this.toastService.error('File size too large. Maximum size is 100MB.');
      return false;
    }

    return true;
  }
} 