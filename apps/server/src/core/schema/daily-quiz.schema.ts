import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DailyQuizDocument = HydratedDocument<DailyQuiz>;
export type DailyQuizAttemptDocument = HydratedDocument<DailyQuizAttempt>;

@Schema({ _id: false })
export class DailyQuizBilingualText {
  @Prop({ required: true, trim: true })
  en: string;

  @Prop({ type: String, default: null, trim: true })
  hi?: string | null;
}
export const DailyQuizBilingualTextSchema = SchemaFactory.createForClass(DailyQuizBilingualText);

@Schema({ _id: false })
export class DailyQuizOption {
  @Prop({ required: true })
  id: string; // 'A', 'B', 'C', 'D'

  @Prop({ type: DailyQuizBilingualTextSchema, required: true })
  text: DailyQuizBilingualText;

  @Prop({ type: Boolean, default: false })
  isCorrect: boolean;
}
export const DailyQuizOptionSchema = SchemaFactory.createForClass(DailyQuizOption);

@Schema({ _id: true })
export class DailyQuizQuestionItem {
  _id: Types.ObjectId;

  @Prop({ type: DailyQuizBilingualTextSchema, required: true })
  content: DailyQuizBilingualText;

  @Prop({ type: [DailyQuizOptionSchema], default: [] })
  options: DailyQuizOption[];

  @Prop({ type: DailyQuizBilingualTextSchema, default: null })
  explanation?: DailyQuizBilingualText | null;

  @Prop({ type: DailyQuizBilingualTextSchema, default: null })
  examTip?: DailyQuizBilingualText | null;

  @Prop({ type: Number, default: 1 })
  marks: number;

  @Prop({ type: Number, default: 0.25 })
  negativeMarks: number;
}
export const DailyQuizQuestionItemSchema = SchemaFactory.createForClass(DailyQuizQuestionItem);

@Schema({ collection: 'daily_quizzes', timestamps: true })
export class DailyQuiz {
  @Prop({ required: true, index: true })
  date: string; // 'YYYY-MM-DD'

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    type: String,
    enum: ['current-affairs', 'quantitative-aptitude', 'reasoning', 'english', 'general-science'],
    default: 'current-affairs',
    index: true,
  })
  category: 'current-affairs' | 'quantitative-aptitude' | 'reasoning' | 'english' | 'general-science';

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  @Prop({ type: [String], default: ['ssc', 'rrb', 'banking'] })
  targetExams: string[];

  @Prop({ type: Number, default: 10 })
  durationMinutes: number;

  @Prop({ type: Number, default: 10 })
  totalMarks: number;

  @Prop({ type: [DailyQuizQuestionItemSchema], default: [] })
  questions: DailyQuizQuestionItem[];

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  @Prop({ type: Number, default: 0 })
  attemptsCount: number;

  @Prop({ type: Number, default: 0 })
  averageScore: number;

  createdAt?: Date;
  updatedAt?: Date;
}
export const DailyQuizSchema = SchemaFactory.createForClass(DailyQuiz);
DailyQuizSchema.index({ date: -1, category: 1 }, { unique: true });

@Schema({ collection: 'daily_quiz_attempts', timestamps: true })
export class DailyQuizAttempt {
  @Prop({ type: Types.ObjectId, ref: 'DailyQuiz', required: true, index: true })
  quizId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string; // 'YYYY-MM-DD'

  @Prop({ type: Number, required: true })
  score: number;

  @Prop({ type: Number, required: true })
  totalQuestions: number;

  @Prop({ type: Number, required: true })
  correctCount: number;

  @Prop({ type: Number, required: true })
  incorrectCount: number;

  @Prop({ type: Number, required: true })
  unattemptedCount: number;

  @Prop({ type: Number, required: true })
  timeSpentSeconds: number;

  @Prop({ type: Map, of: String, default: {} })
  userResponses: Record<string, string>; // questionId -> optionId

  createdAt?: Date;
}
export const DailyQuizAttemptSchema = SchemaFactory.createForClass(DailyQuizAttempt);
DailyQuizAttemptSchema.index({ userId: 1, date: -1 });
