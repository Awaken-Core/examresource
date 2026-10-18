import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema({ collection: 'books', timestamps: true })
export class Book {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  coverImage: string;

  @Prop({ type: [String], default: [] })
  relatedCovers: string[];

  @Prop({ required: true, type: Number })
  displayPrice: number;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ type: Date, required: true, index: true })
  publishedAt: Date;

  @Prop({ type: String, default: null })
  author?: string | null;

  @Prop({ type: String, default: null })
  originalPublisher?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  entryBy: Types.ObjectId;

  @Prop({ type: Boolean, default: false, index: true })
  isArchived: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BookSchema = SchemaFactory.createForClass(Book);
BookSchema.index({ isArchived: 1, publishedAt: -1, createdAt: -1 });
BookSchema.index({ entryBy: 1 });
