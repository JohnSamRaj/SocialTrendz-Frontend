/**
 * Onboarding Modal Component
 * 
 * This component provides a multi-step onboarding experience with
 * intro, questionnaire, and completion screens. Supports required and
 * optional questions with various question types.
 * 
 * Features backdrop blur effect when modal is active.
 */
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OnboardingQuestion, onboardingQuestions } from '../../../core/models/onboarding-questions.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

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

  questions: OnboardingQuestion[] = onboardingQuestions;
  currentQuestionIndex = 0;
  totalQuestions = this.questions.length;
  showIntro = true;
  showOutro = false;
  isVisible = false;

  questionForms: FormGroup[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize form groups for each question
    this.questions.forEach(question => {
      const form = this.fb.group({
        questionId: [question.id],
        answer: ['', question.required ? Validators.required : null]
      });
      this.questionForms.push(form);
    });
  }

  /**
   * Shows the onboarding modal
   */
  show(): void {
    this.isVisible = true;
    this.showIntro = true;
    this.showOutro = false;
    this.currentQuestionIndex = 0;
    this.visibleChange.emit(true);
  }

  /**
   * Hides the onboarding modal
   */
  hide(): void {
    this.isVisible = false;
    this.visibleChange.emit(false);
  }

  /**
   * Starts the questionnaire from the intro screen
   */
  startQuestionnaire(): void {
    this.showIntro = false;
  }

  /**
   * Gets the current question
   */
  get currentQuestion(): OnboardingQuestion {
    return this.questions[this.currentQuestionIndex];
  }

  /**
   * Gets the form for the current question
   */
  get currentForm(): FormGroup {
    return this.questionForms[this.currentQuestionIndex];
  }

  /**
   * Calculates the current progress percentage
   */
  get progress(): number {
    return ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
  }

  /**
   * Proceeds to the next question or completes the questionnaire
   */
  nextQuestion(): void {
    // Skip validation if question is not required
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
   * Returns to the previous question or screen
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
   * Selects an option when clicking anywhere on the option box
   * @param option The selected option value
   */
  selectOption(option: string): void {
    this.currentForm.get('answer')?.setValue(option);
  }

  /**
   * Skips the current question
   * For required questions, this will auto-fill with default value
   */
  skipQuestion(): void {
    // For required questions, fill with default value
    if (this.currentQuestion.required) {
      const defaultValue = this.currentQuestion.type === 'mcq' 
        ? (this.currentQuestion.options ? this.currentQuestion.options[0] : '')
        : 'Skipped';
      this.currentForm.get('answer')?.setValue(defaultValue);
    }
    this.nextQuestion();
  }

  /**
   * Skips the entire onboarding process
   */
  skipAll(): void {
    this.hide();
    this.skipped.emit();
  }

  /**
   * Completes the onboarding process and submits answers
   */
  finishOnboarding(): void {
    // Collect all answers
    const answers = this.questionForms.map(form => ({
      questionId: form.value.questionId,
      answer: form.value.answer
    }));

    // Submit answers to backend
    this.authService.updateOnboardingStatus(true).subscribe({
      next: () => {
        this.hide();
        this.completed.emit(true);
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        console.error('Error updating onboarding status:', err);
        // Emit completed anyway to avoid blocking the user
        this.hide();
        this.completed.emit(true);
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      }
    });
  }
}