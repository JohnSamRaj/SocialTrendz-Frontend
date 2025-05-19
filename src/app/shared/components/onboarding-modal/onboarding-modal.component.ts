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
import { ToastService } from '../../services/toast.service';
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
    if (value) {
      const currentUser = this.authService.getCurrentUser();
      const has_completed_onboarding = currentUser?.has_completed_onboarding || false;
      const has_seen_onboarding = sessionStorage.getItem('has_seen_onboarding') === 'true';
      const isManuallyTriggered = sessionStorage.getItem('manually_triggered_onboarding') === 'true';
      
      // Show modal if:
      // 1. It's manually triggered (Get Started button clicked)
      // 2. User hasn't completed onboarding AND hasn't seen it this session
      if (isManuallyTriggered || (!has_completed_onboarding && !has_seen_onboarding)) {
        this.isVisible = true;
        this.showIntro = true;
        this.showOutro = false;
        this.currentQuestionIndex = 0;
        
        // Only set the session storage flag if it's not manually triggered
        if (!isManuallyTriggered) {
          sessionStorage.setItem('has_seen_onboarding', 'true');
        }
      } else {
        this.isVisible = false;
        this.visibleChange.emit(false);
      }
    } else {
      this.isVisible = false;
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
    private router: Router,
    private toastService: ToastService
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
        case QuestionType.SINGLE_SELECT:
          form = this.fb.group({
            questionId: [question.id],
            selectedOptionId: ['', question.required ? Validators.required : null]
          });
          break;
        case QuestionType.MULTI_SELECT:
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
        next: (questions: any[]) => {
          if (questions && questions.length > 0) {

            this.questions = questions.map(q => ({
              q:q,
              id: q.id,
              text: q.text,
              type: this.mapAnswerTypeToEnum(q.type),
              required: true, // or set based on backend if available
              description: q.description || '',
              options: q.options || []
            }));
            console.log("questions ",this.questions);
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


  private mapAnswerTypeToEnum(answerType: string): QuestionType {
    switch (answerType) {
      case 'single-select':
        return QuestionType.SINGLE_SELECT;
      case 'multi-select':
        return QuestionType.MULTI_SELECT;
      case 'text':
      default:
        return QuestionType.TEXT;
    }
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
    if (this.currentQuestion.type === QuestionType.MULTI_SELECT) {
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

    if (this.currentQuestion.type === QuestionType.SINGLE_SELECT) {
      // give Angular a tick to update the form state, then advance
      setTimeout(() => this.nextQuestion(), 0);
    }
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
        case QuestionType.SINGLE_SELECT:
          // Select the first option by default for required multiple choice questions
          if (this.currentQuestion.options && this.currentQuestion.options.length > 0) {
            this.selectOption(this.currentQuestion.options[0].id);
          }
          break;
        case QuestionType.MULTI_SELECT:
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
    // Clear all onboarding-related session storage flags
    sessionStorage.removeItem('manually_triggered_onboarding');
    sessionStorage.removeItem('has_seen_onboarding');
    
    this.hide();
    this.skipped.emit();
    this.toastService.info('You can complete the onboarding process later by clicking the "Get Started" button.');
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

    this.onboardingService.submitAnswers(answers)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          // Update onboarding status to completed
          this.authService.updateOnboardingStatus(true).subscribe({
            next: () => {
              // Clear all onboarding-related session storage flags
              sessionStorage.removeItem('manually_triggered_onboarding');
              sessionStorage.removeItem('has_seen_onboarding');
              
              this.hide();
              this.completed.emit(true);
              this.router.navigate(['/dashboard']);
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
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 0;

    this.questionForms.forEach((form, index) => {
      const question = this.questions[index];
      const ans: QuestionAnswer = {
        question_id:   question.id,
        question_text: question.text,
        question_type: question.type,
        user_id: userId.toString(),
        answers:       []                             // we'll fill this below
      };

      switch (question.type) {
        case QuestionType.SINGLE_SELECT:
          const selectedId = form.get('selectedOptionId')!.value;

          const selectedOpt = question.options?.find(o => o.id === selectedId);
          ans.answers = [{
            option_id:   selectedId,
            answer_text: selectedOpt?.text || ''
          }];
          break;
        case QuestionType.MULTI_SELECT:
          const optsArray = this.getOptionsArray(form);
          ans.answers = optsArray.controls
          .filter(c => c.get('selected')!.value)
          .map(c => {
            const id = c.get('optionId')!.value;
            // find the matching QuestionOption to grab its text
            const opt = question.options?.find(o => o.id === id);
            return {
              option_id:   id,
              answer_text: opt?.text || ''
            };
          });
        break;
        case QuestionType.TEXT:
          default:
            ans.answers = [{
              option_id:   undefined,         // not used
              answer_text: form.get('textAnswer')!.value
            }];
            break;
      }

      answers.push(ans);
    });

    return answers;
  }
}