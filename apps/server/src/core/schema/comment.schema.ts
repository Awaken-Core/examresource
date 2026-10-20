import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

export const commentStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SPAM'] as const;
export type CommentStatus = (typeof commentStatuses)[number];

@Schema({ collection: 'comments', timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Blog', required: true, index: true })
  blogId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
  parentCommentId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  authorUserId?: Types.ObjectId | null;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  authorName: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 2_000 })
  content: string;

  @Prop({ type: String, enum: commentStatuses, default: 'APPROVED', index: true })
  status: CommentStatus;

  // Only guest comments receive this value; the raw address is never stored.
  @Prop({ type: String, select: false, unique: true, sparse: true })
  anonymousIpHash?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  moderatedByUserId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  moderatedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({ blogId: 1, status: 1, createdAt: -1 });
CommentSchema.index({ parentCommentId: 1, status: 1, createdAt: 1 });
CommentSchema.index({ authorUserId: 1, createdAt: -1 });
