import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

export const feedbackSources = ['test_result', 'footer', 'general'] as const;
export type FeedbackSource = (typeof feedbackSources)[number];

export const feedbackStatuses = ['NEW', 'REVIEWED', 'ARCHIVED'] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

@Schema({ collection: 'feedbacks', timestamps: true })
export class Feedback {
  @Prop({ type: String, enum: feedbackSources, required: true, index: true })
  source: FeedbackSource;

  @Prop({ type: String, required: true, trim: true, maxlength: 3000 })
  message: string;

  @Prop({ type: Number, min: 1, max: 5, default: null })
  rating?: number | null;

  @Prop({ type: String, trim: true, maxlength: 100, default: null })
  category?: string | null;

  // Attached test metadata if submitted from a test-result page
  @Prop({ type: Types.ObjectId, ref: 'Exam', default: null, index: true })
  testId?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, maxlength: 200, default: null })
  testTitle?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'TestAttempt', default: null, index: true })
  attemptId?: Types.ObjectId | null;

  // Learner identification
  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  userId?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, maxlength: 100, default: null })
  userName?: string | null;

  @Prop({ type: String, trim: true, maxlength: 150, default: null })
  userEmail?: string | null;

  @Prop({ type: String, trim: true, maxlength: 20, default: null })
  userPhone?: string | null;

  // Moderation & status
  @Prop({ type: String, enum: feedbackStatuses, default: 'NEW', index: true })
  status: FeedbackStatus;

  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  adminNotes?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedByUserId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ source: 1, status: 1, createdAt: -1 });
FeedbackSchema.index({ testId: 1, createdAt: -1 });
FeedbackSchema.index({ userId: 1, createdAt: -1 });

