import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ToastService } from '../../shared/services/toast.service';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface AIGenerationRequest {
  mediaUrls: string[];
  contentType: 'caption' | 'hashtags' | 'thumbnail';
  context?: string;
}

interface AIGenerationResponse {
  content: string;
  alternativeOptions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private readonly API_BASE = '/api/ai';

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  /**
   * Generate caption for media
   */
  generateDescription(mediaUrls: string[]): Observable<AIGenerationResponse> {
    return this.apiService.post<AIGenerationResponse>(`${this.API_BASE}/generate-description`, {
      mediaUrls
    }).pipe(
      catchError(error => {
        this.toastService.error('Failed to generate description');
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate hashtags based on content
   */
  generateHashtags(mediaUrls: string[], context?: string): Observable<AIGenerationResponse> {
    return this.apiService.post<AIGenerationResponse>(`${this.API_BASE}/generate-hashtags`, {
      mediaUrls,
      context
    }).pipe(
      catchError(error => {
        this.toastService.error('Failed to generate hashtags');
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate image based on prompt
   */
  generateImage(prompt: string): Observable<{ imageUrl: string }> {
    return this.apiService.post<{ imageUrl: string }>(`${this.API_BASE}/generate-image`, {
      prompt
    }).pipe(
      catchError(error => {
        this.toastService.error('Failed to generate image');
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate content using the content wizard
   */
  generateContent(data: {
    platform: string;
    topic: string;
    tone: string;
    generateImage: boolean;
  }): Observable<{
    description: string;
    hashtags: string;
    imageUrl?: string;
  }> {
    return this.apiService.post<{
      description: string;
      hashtags: string;
      imageUrl?: string;
    }>(`${this.API_BASE}/generate-content`, data).pipe(
      catchError(error => {
        this.toastService.error('Failed to generate content');
        return throwError(() => error);
      })
    );
  }

  generateThumbnailSuggestion(mediaUrls: string[]): Observable<AIGenerationResponse> {
    // In a real app, this would suggest edits or generate thumbnails
    // For now, we'll just provide textual suggestions
    
    const suggestions = [
      "Try cropping the image to focus on the main subject for better engagement",
      "Add a subtle filter to enhance the colors and create a cohesive feed aesthetic",
      "Consider adding text overlay with a key message for more impact",
      "The rule of thirds would work well here - try repositioning the main elements",
      "The lighting looks great, but consider adjusting brightness slightly for better clarity"
    ];
    
    const randomIndex = Math.floor(Math.random() * suggestions.length);
    
    return of({
      content: suggestions[randomIndex]
    }).pipe(delay(2000)); // Simulate API delay
  }

  analyzeContent(text: string): Observable<any> {
    // Mock content analysis
    return of({
      sentiment: Math.random() > 0.3 ? 'positive' : 'neutral',
      readability: 'good',
      estimatedEngagement: Math.floor(Math.random() * 5) + 3 + '/10',
      suggestions: [
        'Consider adding more emojis for better engagement',
        'Your caption length is optimal for Instagram'
      ]
    }).pipe(delay(1000));
  }
}
