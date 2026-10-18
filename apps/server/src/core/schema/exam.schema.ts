import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ExamDocument = HydratedDocument<Exam>;
export type TestAttemptDocument = HydratedDocument<TestAttempt>;

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
}

export const ExamQuestionItemSchema = SchemaFactory.createForClass(ExamQuestionItem);

@Schema({ collection: 'exams', timestamps: true })
export class Exam {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  @Prop({
    type: String,
    enum: ['exam', 'quiz', 'current_affairs_quiz'],
    required: true,
    index: true,
  })
  type: 'exam' | 'quiz' | 'current_affairs_quiz';

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'published' | 'archived';

  @Prop({ type: String, default: null, trim: true, index: true })
  subject?: string | null;

  @Prop({ type: Number, default: null })
  durationMinutes?: number | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: [ExamQuestionItemSchema], default: [] })
  questions: ExamQuestionItem[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);
ExamSchema.index({ status: 1, createdAt: -1 });

@Schema({ _id: true, timestamps: true })
export class AttemptAnswer {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], default: [] })
  optionIds: Types.ObjectId[];

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
}

export const AttemptAnswerSchema = SchemaFactory.createForClass(AttemptAnswer);

@Schema({ collection: 'test_attempts', timestamps: true })
export class TestAttempt {
  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true, index: true })
  testId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 1 })
  attemptNumber: number;

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

  @Prop({ type: Number, default: null })
  timeSpentSeconds?: number | null;

  @Prop({ type: [AttemptAnswerSchema], default: [] })
  answers: AttemptAnswer[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const TestAttemptSchema = SchemaFactory.createForClass(TestAttempt);
TestAttemptSchema.index({ userId: 1, testId: 1, attemptNumber: 1 }, { unique: true });
TestAttemptSchema.index({ userId: 1, startedAt: -1 });
TestAttemptSchema.index({ testId: 1, status: 1 });
