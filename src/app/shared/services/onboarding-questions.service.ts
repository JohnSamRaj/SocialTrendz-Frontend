/**
 * Onboarding Questions Service
 * 
 * This service manages fetching and handling onboarding questions from the backend.
 * It provides centralized access to all onboarding question operations:
 * - Loading questions from API
 * - Processing and transforming response data
 * - Error handling for question-related operations
 * - Submitting answers to backend
 */
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { 
  OnboardingQuestion, 
  QuestionType, 
  QuestionOption, 
  QuestionAnswer, 
  OnboardingAnswerSubmission 
} from '../../core/models/onboarding-questions.model';

@Injectable({
  providedIn: 'root'
})
export class OnboardingQuestionsService {
  
  constructor(private apiService: ApiService) { }

  /**
   * Loads onboarding questions from the backend API
   * Maps the backend response to the application's OnboardingQuestion model
   * 
   * @returns Observable<OnboardingQuestion[]> Stream of onboarding questions
   */
  loadQuestions(): Observable<OnboardingQuestion[]> {
    return this.apiService.get('onboarding/questions').pipe(
      map((response: any) => {
        if (response.questions && response.questions.length > 0) {
          // Transform API response to our model
          return this.mapQuestionsFromApi(response.questions);
        } else {
          // Return empty array if no questions found
          return [];
        }
      }),
      catchError(error => {
        console.error('Error loading onboarding questions:', error);
        return throwError(() => new Error('Failed to load onboarding questions'));
      }),
      tap(questions => {
        console.log(`Loaded ${questions.length} onboarding questions`);
      })
    );
  }

  /**
   * Maps the API response to our OnboardingQuestion model
   * 
   * @param apiQuestions Questions from the API
   * @returns Array of OnboardingQuestion objects
   */
  private mapQuestionsFromApi(apiQuestions: any[]): OnboardingQuestion[] {
    return apiQuestions.map(q => {
      // Map question type from API to our enum
      let questionType: QuestionType;
      switch (q.question_type?.toLowerCase()) {
        case 'single-select':
          questionType = QuestionType.SINGLE_SELECT;
          break;
        case 'multi-select':
          questionType = QuestionType.MULTI_SELECT;
          break;
        default:
          questionType = QuestionType.TEXT;
      }

      // Map options if they exist
      const options: QuestionOption[] = q.options ? 
        q.options.map((opt: any) => ({
          id: opt.id,
          questionId: q.id,
          text: opt.option_text,
          value: opt.option_value,
          order: opt.display_order
        })) : [];

      // Sort options by order if available
      if (options.length > 0 && options[0].order !== undefined) {
        options.sort((a, b) => {
          return (a.order || 0) - (b.order || 0);
        });
      }

      // Return the mapped question
      return {
        id: q.id,
        text: q.question_text,
        type: questionType,
        required: q.is_required || false,
        order: q.display_order,
        description: q.description,
        options: options
      };
    }).sort((a, b) => {
      // Sort questions by order if available
      return (a.order || 0) - (b.order || 0);
    });
  }

  /**
   * Submits answers to the onboarding questions to the backend
   * 
   * @param userId User ID
   * @param answers Array of answers to onboarding questions
   * @returns Observable with API response
   */
  submitAnswers(answers: QuestionAnswer[]): Observable<any> {
    if (!answers || answers.length === 0) {
      return throwError(() => new Error('No answers provided'));
    }

    // const submission: OnboardingAnswerSubmission = {
    //   userId: userId,
    //   answers: answers
    // };
        const submission =  answers
    

    return this.apiService.post('onboarding/answers', submission).pipe(
      tap(() => console.log('Successfully submitted onboarding answers')),
      catchError(error => {
        console.error('Error submitting onboarding answers:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Saves partial progress on onboarding questionnaire
   * 
   * @param userId User ID
   * @param answers Array of partial answers to save
   * @returns Observable with API response
   */
  saveProgress(userId: number, answers: QuestionAnswer[]): Observable<any> {
    if (!answers || answers.length === 0) {
      return throwError(() => new Error('No answers provided for progress saving'));
    }

    const submission: OnboardingAnswerSubmission = {
      // userId: userId,
      answers: answers
    };

    return this.apiService.post('onboarding/progress', submission).pipe(
      tap(() => console.log('Successfully saved onboarding progress')),
      catchError(error => {
        console.error('Error saving onboarding progress:', error);
        return throwError(() => error);
      })
    );
  }
}