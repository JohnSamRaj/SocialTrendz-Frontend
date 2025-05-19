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
  private has_completed_onboardingSubject = new BehaviorSubject<boolean>(false);
  public has_completed_onboarding$ = this.has_completed_onboardingSubject.asObservable();

  constructor() {
    // Load completed status from localStorage
    const has_completed = localStorage.getItem('has_completed_onboarding') === 'true';
    this.has_completed_onboardingSubject.next(has_completed);
  }
  
  /**
   * Checks if the user has completed the onboarding
   * @returns boolean indicating if user has completed onboarding
   */
  hasCompletedTour(): boolean {
    return this.has_completed_onboardingSubject.value || localStorage.getItem('tour_completed') === 'true';
  }

  /**
   * Marks the onboarding as completed
   */
  completeOnboarding(): void {
    localStorage.setItem('has_completed_onboarding', 'true');
    this.has_completed_onboardingSubject.next(true);
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