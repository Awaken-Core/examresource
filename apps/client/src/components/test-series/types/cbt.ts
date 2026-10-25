export type QuestionPaletteStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_and_marked_for_review';

export type SavingActionType = 'save_and_next' | 'mark_review' | 'clear' | null;

export interface QuestionOption {
  readonly id: string;
  readonly _id?: string;
  readonly content: string;
  readonly translations?: Record<string, string>;
  readonly imageUrl?: string | null;
  readonly position: number;
}

export interface QuestionDetail {
  readonly id: string;
  readonly content: string;
  readonly translations?: Record<string, string>;
  readonly type: 'single_choice' | 'multiple_choice' | 'numerical';
  readonly options: readonly QuestionOption[];
  readonly marks: number;
  readonly negativeMarks: number;
}

export interface AttemptAnswer {
  readonly id?: string;
  readonly questionId: string;
  readonly sectionId?: string | null;
  readonly optionIds: readonly string[];
  readonly numericalValue?: string | null;
  readonly status: QuestionPaletteStatus;
  readonly timeSpentSeconds: number;
  readonly answeredAt?: string | null;
  readonly visitedAt?: string | null;
  readonly lastViewedAt?: string | null;
  readonly question: QuestionDetail | null;
  readonly isCorrect?: boolean;
  readonly marksAwarded?: number;
  readonly maximumMarks?: number;
  readonly negativeMarks?: number;
}

export interface SectionProgressItem {
  readonly sectionId: string;
  readonly name: string;
  readonly timeSpentSeconds: number;
  readonly isCompleted: boolean;
}

export interface AttemptDetail {
  readonly id: string;
  readonly _id?: string;
  readonly testId: string;
  readonly userId: string;
  readonly attemptNumber: number;
  readonly testVersion: number;
  readonly status: 'in_progress' | 'submitted' | 'abandoned';
  readonly startedAt: string;
  readonly endedAt?: string | null;
  readonly expiresAt?: string | null;
  readonly pausedAt?: string | null;
  readonly timeSpentSeconds?: number | null;
  readonly questionOrder: readonly string[];
  readonly sectionProgress: readonly SectionProgressItem[];
  readonly answers: readonly AttemptAnswer[];
  readonly marksAwarded?: number;
  readonly maximumMarks?: number;
}

export interface PublishedTestMetadata {
  readonly id: string;
  readonly title: string;
  readonly testMode: 'subject' | 'chapter' | 'full';
  readonly durationMinutes?: number | null;
  readonly sections?: ReadonlyArray<{
    readonly id?: string;
    readonly name: string;
    readonly durationMinutes?: number | null;
    readonly order?: number;
  }>;
}

export interface PaletteSummaryCounts {
  readonly answered: number;
  readonly not_answered: number;
  readonly marked_for_review: number;
  readonly answered_and_marked: number;
  readonly not_visited: number;
}
