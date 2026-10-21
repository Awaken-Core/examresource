import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ExamDocument = HydratedDocument<Exam>;
export type TestAttemptDocument = HydratedDocument<TestAttempt>;

/**
 * Embedded snapshot of a question option for historical fidelity.
 * Preserves the exact choice text, image, and correctness even if
 * the central question bank is edited in the future.
 */
@Schema({ _id: false })
export class QuestionOptionSnapshot {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: String, default: null })
  imageUrl?: string | null;

  @Prop({ required: true, type: Number })
  position: number;

  @Prop({ type: Boolean, default: false })
  isCorrect: boolean;

  @Prop({ type: Map, of: String, default: {} })
  translations?: Record<string, string>;
}

export const QuestionOptionSnapshotSchema = SchemaFactory.createForClass(QuestionOptionSnapshot);

/**
 * Embedded snapshot of the question content and configuration.
 * Preserves mathematical formulas, image references, tables, and explanations
 * at the time of test publication or attempt start.
 */
@Schema({ _id: false })
export class QuestionSnapshot {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: Map, of: String, default: {} })
  translations?: Record<string, string>;

  @Prop({ type: String, default: null })
  explanation?: string | null;

  @Prop({ type: Map, of: String, default: {} })
  explanationTranslations?: Record<string, string>;

  @Prop({
    type: String,
    enum: ['single_choice', 'multiple_choice', 'numerical'],
    required: true,
  })
  type: 'single_choice' | 'multiple_choice' | 'numerical';

  @Prop({ type: String, default: null, trim: true })
  numericalAnswer?: string | null;

  @Prop({ type: [QuestionOptionSnapshotSchema], default: [] })
  options: QuestionOptionSnapshot[];

  @Prop({ type: Number, default: 1 })
  marks: number;

  @Prop({ type: Number, default: 0 })
  negativeMarks: number;
}

export const QuestionSnapshotSchema = SchemaFactory.createForClass(QuestionSnapshot);

/**
 * Question item assigned to an exam or section.
 * Supports both manual direct assignment and snapshotting for published versions.
 */
@Schema({ _id: false })
export class ExamQuestionItem {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  position: number;

  @Prop({ type: Number, default: null })
  marks?: number | null;

  @Prop({ type: Number, default: null })
  negativeMarks?: number | null;

  @Prop({ type: String, default: null })
  sectionId?: string | null;

  @Prop({ type: QuestionSnapshotSchema, default: null })
  snapshot?: QuestionSnapshot | null;
}

export const ExamQuestionItemSchema = SchemaFactory.createForClass(ExamQuestionItem);

/**
 * Configurable Section within a Full Test.
 * Each section can have its own topic, question count, duration,
 * positive marks, and negative marking rules.
 */
@Schema({ _id: true })
export class ExamSection {
  @Prop({ required: true, trim: true })
  name: string; // e.g. 'General Intelligence & Reasoning', 'Quantitative Aptitude'

  @Prop({ type: String, default: null, trim: true })
  topic?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Subject', default: null })
  subjectId?: Types.ObjectId | null;

  @Prop({ required: true, type: Number, default: 0 })
  order: number;

  @Prop({ type: Number, default: null })
  durationMinutes?: number | null; // Section-level timer when applicable

  @Prop({ type: Number, required: true, default: 1 })
  positiveMarks: number; // Positive marks per correct answer in this section

  @Prop({ type: Boolean, default: false })
  negativeMarkingEnabled: boolean;

  @Prop({ type: Number, default: 0 })
  negativeMarks: number; // Penalty per wrong answer in this section

  @Prop({
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual',
  })
  selectionMode: 'manual' | 'automatic';

  @Prop({
    type: String,
    enum: ['fixed', 'randomized'],
    default: 'fixed',
  })
  questionOrderMode: 'fixed' | 'randomized';

  @Prop({
    type: String,
    enum: ['fixed', 'random_per_attempt'],
    default: 'fixed',
  })
  questionSetMode: 'fixed' | 'random_per_attempt';

  @Prop({ type: Types.ObjectId, ref: 'Chapter', default: null })
  chapterId?: Types.ObjectId | null;

  @Prop({ type: Number, default: null })
  requiredQuestionCount?: number | null;

  @Prop({ type: [ExamQuestionItemSchema], default: [] })
  questions: ExamQuestionItem[];
}

export const ExamSectionSchema = SchemaFactory.createForClass(ExamSection);

/**
 * Individual Test Model (reused and extended from existing Exam model).
 * Represents an individual test paper (Subject-wise, Chapter-wise, or Full Test).
 */
@Schema({ collection: 'exams', timestamps: true })
export class Exam {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  /**
   * Preserves backward compatibility ('exam' | 'quiz' | 'current_affairs_quiz')
   * while supporting test series modes:
   * 'exam' can be further qualified by `testMode` ('subject' | 'chapter' | 'full').
   */
  @Prop({
    type: String,
    enum: ['exam', 'quiz', 'current_affairs_quiz', 'subject', 'chapter', 'full'],
    required: true,
    index: true,
  })
  type: 'exam' | 'quiz' | 'current_affairs_quiz' | 'subject' | 'chapter' | 'full';

  /**
   * Explicit test series mode:
   * - 'subject': Exam-specific subject test
   * - 'chapter': Exam -> Subject -> Chapter test
   * - 'full': Multi-section comprehensive mock test
   */
  @Prop({
    type: String,
    enum: ['subject', 'chapter', 'full', 'legacy'],
    default: 'legacy',
    index: true,
  })
  testMode: 'subject' | 'chapter' | 'full' | 'legacy';

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'published' | 'archived';

  /**
   * Access Tier: Free Tests vs. Premium Tests
   */
  @Prop({
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
    index: true,
  })
  access: 'free' | 'premium';

  /**
   * Association with parent TestSeries
   */
  @Prop({ type: Types.ObjectId, ref: 'TestSeries', default: null, index: true })
  testSeriesId?: Types.ObjectId | null;

  /**
   * Association with shared Subject
   */
  @Prop({ type: Types.ObjectId, ref: 'Subject', default: null, index: true })
  subjectId?: Types.ObjectId | null;

  /**
   * Association with exam-specific Chapter
   */
  @Prop({ type: Types.ObjectId, ref: 'Chapter', default: null, index: true })
  chapterId?: Types.ObjectId | null;

  /**
   * Preserved plain string subject for backward compatibility
   */
  @Prop({ type: String, default: null, trim: true, index: true })
  subject?: string | null;

  @Prop({ type: Number, default: null })
  durationMinutes?: number | null;

  /**
   * Configurable attempt policy:
   * null or 0 = unlimited attempts allowed; positive integer = max allowed attempts.
   */
  @Prop({ type: Number, default: null })
  maxAttempts?: number | null;

  /**
   * Language configuration
   */
  @Prop({ type: [String], default: ['Hindi', 'English'] })
  languages: string[];

  /**
   * Candidate instructions and exam rules
   */
  @Prop({ type: String, default: null })
  instructions?: string | null;

  /**
   * Test-level marking configuration (for subject and chapter tests)
   */
  @Prop({ type: Number, default: 1 })
  positiveMarks: number;

  @Prop({ type: Boolean, default: false })
  negativeMarkingEnabled: boolean;

  @Prop({ type: Number, default: 0 })
  negativeMarks: number;

  /**
   * Question selection configuration
   */
  @Prop({
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual',
  })
  questionSelectionMode: 'manual' | 'automatic';

  @Prop({
    type: String,
    enum: ['fixed', 'randomized'],
    default: 'fixed',
  })
  questionOrderMode: 'fixed' | 'randomized';

  /**
   * Question Set Sampling Mode:
   * - 'fixed': The same resolved question set is served for every candidate attempt.
   * - 'random_per_attempt': Dynamic candidate sampling from the configured eligible pool per attempt.
   */
  @Prop({
    type: String,
    enum: ['fixed', 'random_per_attempt'],
    default: 'fixed',
  })
  questionSetMode: 'fixed' | 'random_per_attempt';

  /**
   * Availability scheduling window (optional start and end dates).
   * Before availableFrom or after availableTo, the test is not accessible to candidates.
   */
  @Prop({ type: Date, default: null, index: true })
  availableFrom?: Date | null;

  @Prop({ type: Date, default: null, index: true })
  availableTo?: Date | null;

  /**
   * Configurable question count
   */
  @Prop({ type: Number, default: null })
  totalQuestionsCount?: number | null;

  /**
   * Versioning and Historical Immutability
   */
  @Prop({ type: Number, default: 1, index: true })
  version: number;

  @Prop({ type: Boolean, default: true, index: true })
  isCurrentVersion: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Exam', default: null, index: true })
  parentTestId?: Types.ObjectId | null; // Points to root or original published test

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  createdBy?: Types.ObjectId | null;

  /**
   * Sections for Full Tests (each section contains its own questions and config)
   */
  @Prop({ type: [ExamSectionSchema], default: [] })
  sections: ExamSection[];

  /**
   * Direct question items (for Subject/Chapter tests or legacy exams)
   */
  @Prop({ type: [ExamQuestionItemSchema], default: [] })
  questions: ExamQuestionItem[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
ExamSchema.index({ status: 1, createdAt: -1 });
ExamSchema.index({ testSeriesId: 1, testMode: 1, status: 1 });
ExamSchema.index({ testSeriesId: 1, subjectId: 1, status: 1 });
ExamSchema.index({ testSeriesId: 1, chapterId: 1, status: 1 });
ExamSchema.index({ parentTestId: 1, version: 1 });
ExamSchema.index({ isCurrentVersion: 1, status: 1 });

/**
 * Question Status for CBT Palette
 */
export type QuestionPaletteStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_and_marked_for_review';

@Schema({ _id: true, timestamps: true })
export class AttemptAnswer {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ type: String, default: null })
  sectionId?: string | null;

  @Prop({ type: [Types.ObjectId], default: [] })
  optionIds: Types.ObjectId[];

  /**
   * For numerical question answers (exact candidate input string)
   */
  @Prop({ type: String, default: null, trim: true })
  numericalValue?: string | null;

  /**
   * Question Palette Status (CBT standard)
   */
  @Prop({
    type: String,
    enum: [
      'not_visited',
      'not_answered',
      'answered',
      'marked_for_review',
      'answered_and_marked_for_review',
    ],
    default: 'not_visited',
    index: true,
  })
  status: QuestionPaletteStatus;

  @Prop({ type: Boolean, default: null })
  isCorrect?: boolean | null;

  @Prop({ type: Number, default: 0 })
  marksAwarded: number;

  @Prop({ type: Number, required: true, default: 0 })
  maximumMarks: number;

  @Prop({ type: Number, default: 0 })
  negativeMarks: number;

  @Prop({ type: Number, default: null })
  timeSpentSeconds?: number | null;

  @Prop({ type: Date, default: null })
  answeredAt?: Date | null;

  /**
   * Snapshot of question details at the moment the attempt was generated
   */
  @Prop({ type: QuestionSnapshotSchema, default: null })
  questionSnapshot?: QuestionSnapshot | null;
}

export const AttemptAnswerSchema = SchemaFactory.createForClass(AttemptAnswer);

/**
 * Section progress tracking within a test attempt
 */
@Schema({ _id: false })
export class AttemptSectionProgress {
  @Prop({ required: true })
  sectionId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  timeSpentSeconds: number;

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;
}

export const AttemptSectionProgressSchema = SchemaFactory.createForClass(AttemptSectionProgress);

@Schema({ collection: 'test_attempts', timestamps: true })
export class TestAttempt {
  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true, index: true })
  testId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 1 })
  attemptNumber: number;

  /**
   * Version of the test paper that was attempted
   */
  @Prop({ type: Number, required: true, default: 1 })
  testVersion: number;

  @Prop({
    type: String,
    enum: ['in_progress', 'submitted', 'abandoned'],
    default: 'in_progress',
    index: true,
  })
  status: 'in_progress' | 'submitted' | 'abandoned';

  @Prop({ type: Number, default: 0 })
  marksAwarded: number;

  @Prop({ type: Number, default: 0 })
  maximumMarks: number;

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  endedAt?: Date | null;

  // Deadline snapshot at attempt start
  @Prop({ type: Date, default: null, index: true })
  expiresAt?: Date | null;

  @Prop({ type: Number, default: null })
  timeSpentSeconds?: number | null;

  /**
   * Ordered list of question IDs presented to this student attempt
   * (preserves exact question ordering for randomized question selection)
   */
  @Prop({ type: [Types.ObjectId], default: [] })
  questionOrder: Types.ObjectId[];

  /**
   * Section-level tracking for multi-section full tests
   */
  @Prop({ type: [AttemptSectionProgressSchema], default: [] })
  sectionProgress: AttemptSectionProgress[];

  @Prop({ type: [AttemptAnswerSchema], default: [] })
  answers: AttemptAnswer[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const TestAttemptSchema = SchemaFactory.createForClass(TestAttempt);
TestAttemptSchema.index({ userId: 1, testId: 1, attemptNumber: 1 }, { unique: true });
TestAttemptSchema.index({ userId: 1, startedAt: -1 });
TestAttemptSchema.index({ testId: 1, status: 1 });
TestAttemptSchema.index({ testId: 1, testVersion: 1 });
