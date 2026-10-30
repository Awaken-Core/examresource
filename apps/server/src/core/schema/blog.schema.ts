import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;
export type BlogBlockDocument = HydratedDocument<BlogBlock>;
export type BlogRevisionDocument = HydratedDocument<BlogRevision>;

@Schema({ collection: 'blogs', timestamps: true })
export class Blog {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, index: true })
  slug: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ type: String, default: null })
  coverImage?: string | null;

  @Prop({ type: String, enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT', index: true })
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

  @Prop({ type: Date, default: null, index: true })
  publishedAt?: Date | null;

  @Prop({ type: Date, default: null })
  scheduledAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null, index: true })
  categoryId?: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  metaTitle?: string | null;

  @Prop({ type: String, default: null })
  metaDescription?: string | null;

  @Prop({ type: String, default: null })
  canonicalUrl?: string | null;

  @Prop({ type: String, default: null })
  imageAlt?: string | null;

  @Prop({ type: String, default: null })
  imageCaption?: string | null;

  @Prop({ type: Boolean, default: false })
  noindex: boolean;

  @Prop({ type: String, enum: ['HINGLISH', 'ENGLISH'], default: 'HINGLISH', index: true })
  language: 'HINGLISH' | 'ENGLISH';

  @Prop({ type: String, default: null, index: true })
  translationGroupId?: string | null;

  @Prop({ type: Number, default: 1 })
  version: number;

  createdAt?: Date;
  updatedAt?: Date;
}
export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.index({ slug: 1, language: 1 }, { unique: true });
BlogSchema.index({ authorId: 1, createdAt: 1 });
BlogSchema.index({ status: 1, publishedAt: 1 });
BlogSchema.index({ status: 1, categoryId: 1, publishedAt: -1 });

@Schema({ collection: 'blog_blocks', timestamps: true })
export class BlogBlock {
  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true, index: true })
  blogId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'PARAGRAPH', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'HEADING_4',
      'HEADING_5', 'HEADING_6', 'IMAGE', 'VIDEO', 'QUOTE', 'CODE',
      'BULLET_LIST', 'NUMBERED_LIST', 'DIVIDER', 'TABLE', 'CALLOUT',
    ],
  })
  type: string;

  @Prop({ type: String, default: '' })
  value: string;

  @Prop({ required: true, type: Number })
  position: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  metadata?: Record<string, unknown> | null;

  createdAt?: Date;
  updatedAt?: Date;
}
export const BlogBlockSchema = SchemaFactory.createForClass(BlogBlock);
BlogBlockSchema.index({ blogId: 1, position: 1 }, { unique: true });

@Schema({ collection: 'blog_revisions', timestamps: true })
export class BlogRevision {
  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true, index: true })
  blogId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ required: true, type: Number })
  version: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  snapshot: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}
export const BlogRevisionSchema = SchemaFactory.createForClass(BlogRevision);
BlogRevisionSchema.index({ blogId: 1, version: 1 });
