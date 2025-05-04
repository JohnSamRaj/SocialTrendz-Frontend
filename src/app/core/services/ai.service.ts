import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
  // In a real app, this would connect to an AI API like Gemini
  
  constructor() { }

  generateCaption(mediaUrls: string[], context?: string): Observable<AIGenerationResponse> {
    // Mock AI caption generation
    const captions = [
      "Embracing the vibrant colors of life 🌈 #LiveAuthentic",
      "The best memories are made when we're together ✨",
      "Finding beauty in the everyday moments ❤️",
      "New adventures await just around the corner 🚶‍♀️",
      "Creating my own sunshine, one day at a time ☀️"
    ];
    
    const alternatives = [
      "Living my best life, one photo at a time 📸",
      "The journey is the destination 🗺️",
      "Collecting moments, not things ✨",
      "Life happens, coffee helps ☕"
    ];
    
    // Select a random caption
    const randomIndex = Math.floor(Math.random() * captions.length);
    
    return of({
      content: captions[randomIndex],
      alternativeOptions: alternatives
    }).pipe(delay(1500)); // Simulate API delay
  }

  generateHashtags(mediaUrls: string[], context?: string): Observable<AIGenerationResponse> {
    // Mock AI hashtag generation
    const hashtagSets = [
      "#instagram #instagood #instadaily #photooftheday #photography",
      "#lifestyle #travel #adventure #explore #wanderlust",
      "#fashion #style #ootd #beauty #trendy",
      "#food #foodie #delicious #yummy #tasty",
      "#fitness #health #workout #motivation #gym"
    ];
    
    const alternatives = [
      "#love #happy #joy #life #inspiration",
      "#nature #beautiful #amazing #wonderful #awesome",
      "#art #creative #design #inspiration #artist",
      "#business #success #entrepreneur #motivation #hustle"
    ];
    
    // Select a random set
    const randomIndex = Math.floor(Math.random() * hashtagSets.length);
    
    return of({
      content: hashtagSets[randomIndex],
      alternativeOptions: alternatives
    }).pipe(delay(1200)); // Simulate API delay
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
