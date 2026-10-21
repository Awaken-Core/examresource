import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubjectDocument = HydratedDocument<Subject>;
export type TestSeriesDocument = HydratedDocument<TestSeries>;
export type TestSeriesSubjectDocument = HydratedDocument<TestSeriesSubject>;
export type ChapterDocument = HydratedDocument<Chapter>;
export type QuestionMappingDocument = HydratedDocument<QuestionMapping>;

/**
 * 1. Global / Shared Subject
 * Created once (e.g., Mathematics, General Intelligence & Reasoning, English Language, General Studies)
 * and can be associated with multiple TestSeries.
 */
@Schema({ collection: 'subjects', timestamps: true })
export class Subject {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true, lowercase: true, index: true })
  slug: string;

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  @Prop({ type: String, default: null, trim: true })
  iconUrl?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
SubjectSchema.index({ name: 1 });

/**
 * 2. Test Series Parent
 * Represents a competitive examination target (e.g. RRB NTPC Graduate Level, SSC CGL, IBPS PO, UPSC CSE).
 */
@Schema({ collection: 'test_series', timestamps: true })
export class TestSeries {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, unique: true, lowercase: true, index: true })
  slug: string;

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  @Prop({ required: true, trim: true, index: true })
  targetExam: string; // e.g. 'RRB NTPC', 'SSC CGL', 'UPSC CSE'

  @Prop({ required: true, trim: true, index: true })
  category: string; // 'central-government' | 'state-exams' | 'banking' | 'ssc-railways' | 'teaching' | 'defence' | 'others'

  @Prop({ type: String, default: null, trim: true })
  organization?: string | null; // e.g. 'Railway Recruitment Board', 'Staff Selection Commission'

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'published' | 'archived';

  @Prop({
    type: String,
    enum: ['free', 'premium', 'freemium'],
    default: 'free',
    index: true,
  })
  accessType: 'free' | 'premium' | 'freemium';

  @Prop({ type: [String], default: ['Hindi', 'English'] })
  supportedLanguages: string[];

  @Prop({ type: String, default: null })
  badge?: string | null; // e.g. 'Popular', 'Trending', 'New'

  @Prop({ type: String, default: null })
  logoUrl?: string | null;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  createdBy?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TestSeriesSchema = SchemaFactory.createForClass(TestSeries);
TestSeriesSchema.index({ status: 1, category: 1, order: 1 });
TestSeriesSchema.index({ targetExam: 1, status: 1 });

/**
 * 3. TestSeriesSubject (Pivot / Association)
 * Associates a shared subject to a specific TestSeries with custom display ordering
 * and series-specific metadata.
 */
@Schema({ collection: 'test_series_subjects', timestamps: true })
export class TestSeriesSubject {
  @Prop({ type: Types.ObjectId, ref: 'TestSeries', required: true, index: true })
  testSeriesId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: String, default: null, trim: true })
  customDisplayName?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TestSeriesSubjectSchema = SchemaFactory.createForClass(TestSeriesSubject);
TestSeriesSubjectSchema.index({ testSeriesId: 1, subjectId: 1 }, { unique: true });
TestSeriesSubjectSchema.index({ testSeriesId: 1, order: 1 });

/**
 * 4. Exam-Specific Chapter
 * Chapters are specific to an exam (TestSeries) and its assigned subject.
 * E.g., Mathematics for RRB NTPC can have chapters different from SSC CGL.
 */
@Schema({ collection: 'chapters', timestamps: true })
export class Chapter {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'TestSeries', required: true, index: true })
  testSeriesId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ type: String, default: null, trim: true })
  description?: string | null;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true,
  })
  status: 'draft' | 'published' | 'archived';

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);
ChapterSchema.index({ testSeriesId: 1, subjectId: 1, slug: 1 }, { unique: true });
ChapterSchema.index({ testSeriesId: 1, subjectId: 1, order: 1 });

/**
 * 5. Central Question Bank Mapping
 * Allows questions in the central Question Bank to be tagged/mapped across multiple
 * subjects, chapters, and test series without duplicating question documents.
 */
@Schema({ collection: 'question_mappings', timestamps: true })
export class QuestionMapping {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true, index: true })
  questionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TestSeries', default: null, index: true })
  testSeriesId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Chapter', default: null, index: true })
  chapterId?: Types.ObjectId | null;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const QuestionMappingSchema = SchemaFactory.createForClass(QuestionMapping);
QuestionMappingSchema.index(
  { questionId: 1, subjectId: 1, testSeriesId: 1, chapterId: 1 },
  { unique: true },
);
QuestionMappingSchema.index({ subjectId: 1, chapterId: 1 });
QuestionMappingSchema.index({ testSeriesId: 1, subjectId: 1 });
