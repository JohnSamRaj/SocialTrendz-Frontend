/**
 * Onboarding Modal Component
 * 
 * This component provides a multi-step onboarding experience with
 * intro, questionnaire, and completion screens. Supports required and
 * optional questions with various question types.
 * 
 * The modal guides users through:
 * 1. Welcome/intro screen
 * 2. Series of onboarding questions (multiple choice, multiple answer, or text input)
 * 3. Completion screen with next steps
 * 
 * Features include:
 * - Form validation for required questions
 * - Progress tracking
 * - Option to skip individual questions or entire onboarding
 * - Backend integration for saving answers
 * - Responsive design with backdrop blur effect
 */
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { OnboardingQuestionsService } from '../../services/onboarding-questions.service';
import { finalize } from 'rxjs/operators';
import { 
  OnboardingQuestion, 
  QuestionType, 
  QuestionOption,
  QuestionAnswer
} from '../../../core/models/onboarding-questions.model';

@Component({
  selector: 'app-onboarding-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './onboarding-modal.component.html',
  styleUrls: ['./onboarding-modal.component.css']
})
export class OnboardingModalComponent implements OnInit {
  @Input() set visible(value: boolean) {
    this.isVisible = value;
    if (value) {
      this.showIntro = true;
      this.showOutro = false;
      this.currentQuestionIndex = 0;
    }
  }

  @Output() completed = new EventEmitter<boolean>();
  @Output() skipped = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  // Question types enum reference for template
  QuestionType = QuestionType;

  // Component state
  questions: OnboardingQuestion[] = [];
  currentQuestionIndex = 0;
  totalQuestions = 0;
  showIntro = true;
  showOutro = false;
  isVisible = false;
  isLoading = false;
  errorMessage = '';

  // Form groups for each question
  questionForms: FormGroup[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private onboardingService: OnboardingQuestionsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuestionsFromService();
  }

  /**
   * Initialize form groups for each question
   */
  private initializeFormGroups(): void {
    this.questionForms = [];
    this.questions.forEach(question => {
      let form: FormGroup;

      // Create different form structure based on question type
      switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
          form = this.fb.group({
            questionId: [question.id],
            selectedOptionId: ['', question.required ? Validators.required : null]
          });
          break;
        case QuestionType.MULTIPLE_ANSWER:
          // For multiple answer questions, create a FormArray with controls for each option
          const optionsControls: { optionId: string; selected: boolean }[] = [];
          
          // Prepare data for form array
          question.options?.forEach(option => {
            optionsControls.push({
              optionId: option.id,
              selected: false
            });
          });
          
          // Create the form group with the controls
          form = this.fb.group({
            questionId: [question.id],
            options: this.fb.array(
              optionsControls.map(optionControl => 
                this.fb.group({
                  optionId: [optionControl.optionId],
                  selected: [optionControl.selected]
                })
              )
            ),
            // Add validator if the question is required to ensure at least one option is selected
            hasSelection: ['', question.required ? Validators.requiredTrue : null]
          });
          break;
        case QuestionType.TEXT:
        default:
          form = this.fb.group({
            questionId: [question.id],
            textAnswer: ['', question.required ? Validators.required : null]
          });
          break;
      }

      this.questionForms.push(form);
    });
  }

  /**
   * Load questions from the service
   * Public method so it can be called from the template
   */
  loadQuestionsFromService(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.onboardingService.loadQuestions()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (questions: OnboardingQuestion[]) => {
          if (questions && questions.length > 0) {
            this.questions = questions;
            this.totalQuestions = this.questions.length;
            this.initializeFormGroups();
          } else {
            this.errorMessage = 'No onboarding questions available.';
          }
        },
        error: (err: Error) => {
          console.error('Error loading questions:', err);
          this.errorMessage = 'Failed to load onboarding questions. Please try again later.';
        }
      });
  }

  /**
   * Show the onboarding modal
   */
  show(): void {
    this.isVisible = true;
    this.showIntro = true;
    this.showOutro = false;
    this.currentQuestionIndex = 0;
    this.visibleChange.emit(true);
  }

  /**
   * Hide the onboarding modal
   */
  hide(): void {
    this.isVisible = false;
    this.visibleChange.emit(false);
  }

  /**
   * Start the questionnaire
   */
  startQuestionnaire(): void {
    this.showIntro = false;
  }

  /**
   * Get the current question
   */
  get currentQuestion(): OnboardingQuestion {
    return this.questions[this.currentQuestionIndex];
  }

  /**
   * Get the form for the current question
   */
  get currentForm(): FormGroup {
    return this.questionForms[this.currentQuestionIndex];
  }

  /**
   * Get the options FormArray for multiple answer questions
   */
  getOptionsArray(form: FormGroup): FormArray {
    return form.get('options') as FormArray;
  }

  /**
   * Calculate progress percentage
   */
  get progress(): number {
    return ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
  }

  /**
   * Move to the next question
   */
  nextQuestion(): void {
    // For multiple answer questions, check if at least one option is selected
    if (this.currentQuestion.type === QuestionType.MULTIPLE_ANSWER) {
      this.validateMultipleAnswerSelection();
    }

    if (!this.currentQuestion.required || this.currentForm.valid) {
      if (this.currentQuestionIndex < this.totalQuestions - 1) {
        this.currentQuestionIndex++;
      } else {
        this.showOutro = true;
      }
    } else {
      this.currentForm.markAllAsTouched();
    }
  }

  /**
   * Validate selection for multiple answer questions
   */
  private validateMultipleAnswerSelection(): void {
    const optionsArray = this.getOptionsArray(this.currentForm);
    const hasSelection = optionsArray.controls.some(control => 
      control.get('selected')?.value === true
    );
    
    this.currentForm.patchValue({
      hasSelection: hasSelection
    });
  }

  /**
   * Move to the previous question
   */
  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    } else if (this.showIntro) {
      // Do nothing when on intro screen
    } else if (this.showOutro) {
      this.showOutro = false;
      this.currentQuestionIndex = this.totalQuestions - 1;
    } else {
      this.showIntro = true;
    }
  }

  /**
   * Select option for multiple choice questions
   */
  selectOption(optionId: string): void {
    this.currentForm.patchValue({
      selectedOptionId: optionId
    });
  }

  /**
   * Toggle option selection for multiple answer questions
   */
  toggleOptionSelection(optionIndex: number): void {
    const optionsArray = this.getOptionsArray(this.currentForm);
    const control = optionsArray.at(optionIndex);
    const currentValue = control.get('selected')?.value;
    
    // Update the selected state
    control.get('selected')?.setValue(!currentValue);
    
    this.validateMultipleAnswerSelection();
  }

  /**
   * Check if a specific option is selected in multiple choice questions
   */
  isOptionSelected(optionId: string): boolean {
    return this.currentForm.get('selectedOptionId')?.value === optionId;
  }

  /**
   * Skip the current question
   */
  skipQuestion(): void {
    if (this.currentQuestion.required) {
      switch (this.currentQuestion.type) {
        case QuestionType.MULTIPLE_CHOICE:
          // Select the first option by default for required multiple choice questions
          if (this.currentQuestion.options && this.currentQuestion.options.length > 0) {
            this.selectOption(this.currentQuestion.options[0].id);
          }
          break;
        case QuestionType.MULTIPLE_ANSWER:
          // Select the first option by default for required multiple answer questions
          if (this.currentQuestion.options && this.currentQuestion.options.length > 0) {
            this.toggleOptionSelection(0);
          }
          break;
        case QuestionType.TEXT:
        default:
          // Set default text for required text questions
          this.currentForm.patchValue({
            textAnswer: 'Skipped'
          });
          break;
      }
    }
    this.nextQuestion();
  }

  /**
   * Skip the entire onboarding process
   */
  skipAll(): void {
    this.hide();
    this.skipped.emit();
  }

  /**
   * Finish onboarding and submit answers
   */
  finishOnboarding(): void {
    this.isLoading = true;
    
    // Prepare answers for submission
    const answers: QuestionAnswer[] = this.prepareAnswersForSubmission();

    // Get user ID from auth service
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 0;

    if (userId === 0) {
      console.error('No user ID available');
      this.isLoading = false;
      return;
    }

    this.onboardingService.submitAnswers(userId, answers)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.authService.updateOnboardingStatus(true).subscribe({
            next: () => {
              this.hide();
              this.completed.emit(true);
              this.router.navigate(['/accounts-connect']);
            },
            error: (err: Error) => {
              console.error('Error updating onboarding status:', err);
            }
          });
        },
        error: (err: Error) => {
          console.error('Error submitting onboarding answers:', err);
        }
      });
  }

  /**
   * Prepare answers from form values for submission
   */
  private prepareAnswersForSubmission(): QuestionAnswer[] {
    const answers: QuestionAnswer[] = [];

    this.questionForms.forEach((form, index) => {
      const question = this.questions[index];
      const answer: QuestionAnswer = {
        questionId: question.id
      };

      switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
          answer.selectedOptionIds = [form.get('selectedOptionId')?.value];
          break;
        case QuestionType.MULTIPLE_ANSWER:
          const optionsArray = this.getOptionsArray(form);
          answer.selectedOptionIds = optionsArray.controls
            .filter(control => control.get('selected')?.value === true)
            .map(control => control.get('optionId')?.value);
          break;
        case QuestionType.TEXT:
        default:
          answer.textAnswer = form.get('textAnswer')?.value;
          break;
      }

      answers.push(answer);
    });

    return answers;
  }
}