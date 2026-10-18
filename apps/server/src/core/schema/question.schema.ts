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
}

export const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

@Schema({ collection: 'questions', timestamps: true })
export class Question {
  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: String, default: null })
  explanation?: string | null;

  @Prop({
    type: String,
    enum: ['single_choice', 'multiple_choice'],
    default: 'single_choice',
    index: true,
  })
  type: 'single_choice' | 'multiple_choice';

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

  @Prop({ required: true, trim: true, index: true })
  subject: string;

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
