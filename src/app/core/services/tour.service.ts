import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * This is a simplified TourService that only manages the onboarding experience
 * The actual onboarding UI is handled by the OnboardingModalComponent
 */
@Injectable({
  providedIn: 'root'
})
export class TourService {
  private hasCompletedOnboardingSubject = new BehaviorSubject<boolean>(false);
  public hasCompletedOnboarding$ = this.hasCompletedOnboardingSubject.asObservable();

  constructor() {
    // Load completed status from localStorage
    const hasCompleted = localStorage.getItem('hasCompletedOnboarding') === 'true';
    this.hasCompletedOnboardingSubject.next(hasCompleted);
  }
  
  /**
   * Checks if the user has completed the onboarding
   * @returns boolean indicating if user has completed onboarding
   */
  hasCompletedTour(): boolean {
    return this.hasCompletedOnboardingSubject.value || localStorage.getItem('tour_completed') === 'true';
  }

  /**
   * Marks the onboarding as completed
   */
  completeOnboarding(): void {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    this.hasCompletedOnboardingSubject.next(true);
  }
  
  /**
   * Start the onboarding modal process
   * This is a simplification of the previous tour functionality
   * that now just triggers the onboarding modal
   */
  startFirstTimeTour(): void {
    // This is now a stub method that should trigger the onboarding modal
    // The actual implementation will be in the components that use this
    console.log('Onboarding tour started - open the onboarding modal');
    
    // For backward compatibility, we'll set the old tour flag as well
    localStorage.setItem('tour_completed', 'true');
  }
}