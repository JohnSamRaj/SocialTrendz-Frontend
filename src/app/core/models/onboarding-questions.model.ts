/**
 * Defines the types of questions available in the onboarding process
 */
export enum QuestionType {
  TEXT = 'text',
  MULTI_SELECT = 'multi-select',
  SINGLE_SELECT = 'single-select'
}

/**
 * Option for multiple choice and multiple answer questions
 */
export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  value?: string;
  order?: number;
}

/**
 * Represents a single onboarding question
 */
export interface OnboardingQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  order?: number;
  description?: string;
  options?: QuestionOption[];
}

/**
 * Represents a user's answer to an onboarding question
 */
export interface QuestionAnswer_old {
  questionId: string;
  textAnswer?: string;
  selectedOptionIds?: string[];
}

export interface QuestionAnswer {
  question_id: any;
  question_text: string;
  question_type: QuestionType;
  user_id?: string;
  answers?: any
}

/**
 * Complete set of user answers to submit
 */
export interface OnboardingAnswerSubmission {
  // userId: number;
  answers: QuestionAnswer[];
}