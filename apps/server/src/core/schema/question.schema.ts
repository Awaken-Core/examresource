import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;
export type SavedQuestionDocument = HydratedDocument<SavedQuestion>;
export type ReportedQuestionDocument = HydratedDocument<ReportedQuestion>;

@Schema({ _id: true, timestamps: true })
export class QuestionOption {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: String, default: null })
  imageUrl?: string | null;

  @Prop({ required: true, type: Number })
  position: number;

  @Prop({ required: true, type: Boolean, default: false })
  isCorrect: boolean;

  /**
   * Optional localized translations for this option.
   * Keyed by language code/name (e.g., 'hi' / 'Hindi': 'विकल्प सामग्री').
   * Always maintains the same underlying option ID and isCorrect status.
   */
  @Prop({ type: Map, of: String, default: {} })
  translations?: Record<string, string>;
}

export const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

@Schema({ collection: 'questions', timestamps: true })
export class Question {
  @Prop({ required: true, trim: true })
  content: string;

  /**
   * Optional localized question text translations.
   * Keyed by language (e.g., 'hi' / 'Hindi': 'प्रश्न सामग्री').
   */
  @Prop({ type: Map, of: String, default: {} })
  translations?: Record<string, string>;

  @Prop({ type: String, default: null })
  explanation?: string | null;

  /**
   * Optional localized explanation translations.
   */
  @Prop({ type: Map, of: String, default: {} })
  explanationTranslations?: Record<string, string>;

  @Prop({
    type: String,
    enum: ['single_choice', 'multiple_choice', 'numerical'],
    default: 'single_choice',
    index: true,
  })
  type: 'single_choice' | 'multiple_choice' | 'numerical';

  /**
   * For numerical questions: exact expected answer string (e.g. "42", "3.14", "-15").
   * Numerical answer evaluation requires exact matching per project specifications.
   */
  @Prop({ type: String, default: null, trim: true })
  numericalAnswer?: string | null;

  @Prop({
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true,
  })
  difficulty: 'easy' | 'medium' | 'hard';

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'published' | 'archived';

  /**
   * Safe deletion flag: when set to false, question cannot be picked for new tests
   * while existing historical published tests and attempts remain completely intact.
   */
  @Prop({ type: Boolean, default: true, index: true })
  isAvailableForNewTests: boolean;

  @Prop({ required: true, trim: true, index: true })
  subject: string;

  @Prop({ type: Types.ObjectId, ref: 'Subject', default: null, index: true })
  subjectId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', default: null, index: true })
  chapterId?: Types.ObjectId | null;

  @Prop({ type: String, default: null, trim: true, index: true })
  topic?: string | null;

  @Prop({ type: String, default: null, trim: true })
  subtopic?: string | null;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ type: Number, default: 1 })
  marks: number;

  @Prop({ type: Number, default: 0 })
  negativeMarks: number;

  @Prop({ type: String, default: null })
  source?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [QuestionOptionSchema], default: [] })
  options: QuestionOption[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
QuestionSchema.index({ status: 1, createdAt: -1 });
QuestionSchema.index({ subject: 1, topic: 1 });
QuestionSchema.index({ subjectId: 1, chapterId: 1 });
QuestionSchema.index({ isAvailableForNewTests: 1, status: 1 });

@Schema({ collection: 'saved_questions', timestamps: true })
export class SavedQuestion {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true, index: true })
  questionId: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SavedQuestionSchema = SchemaFactory.createForClass(SavedQuestion);
SavedQuestionSchema.index({ userId: 1, questionId: 1 }, { unique: true });
SavedQuestionSchema.index({ userId: 1, createdAt: -1 });

@Schema({ collection: 'reported_questions', timestamps: true })
export class ReportedQuestion {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true, index: true })
  questionId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ type: String, default: null })
  details?: string | null;

  @Prop({
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
    index: true,
  })
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  @Prop({ type: String, default: null })
  resolutionNote?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReportedQuestionSchema = SchemaFactory.createForClass(ReportedQuestion);
ReportedQuestionSchema.index({ userId: 1, questionId: 1 }, { unique: true });
ReportedQuestionSchema.index({ status: 1, createdAt: -1 });
