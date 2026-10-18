import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;
export type TagDocument = HydratedDocument<Tag>;
export type BlogCategoryDocument = HydratedDocument<BlogCategory>;
export type BlogTagDocument = HydratedDocument<BlogTag>;

@Schema({ collection: 'categories', timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  slug: string;

  @Prop({ type: String, default: null })
  description?: string | null;
}
export const CategorySchema = SchemaFactory.createForClass(Category);

@Schema({ collection: 'tags', timestamps: true })
export class Tag {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  slug: string;
}
export const TagSchema = SchemaFactory.createForClass(Tag);

@Schema({ collection: 'blog_categories', timestamps: true })
export class BlogCategory {
  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true, index: true })
  blogId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;
}
export const BlogCategorySchema = SchemaFactory.createForClass(BlogCategory);
BlogCategorySchema.index({ blogId: 1, categoryId: 1 }, { unique: true });

@Schema({ collection: 'blog_tags', timestamps: true })
export class BlogTag {
  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true, index: true })
  blogId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tag', required: true, index: true })
  tagId: Types.ObjectId;
}
export const BlogTagSchema = SchemaFactory.createForClass(BlogTag);
BlogTagSchema.index({ blogId: 1, tagId: 1 }, { unique: true });
