import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;
export type NotificationReadDocument = HydratedDocument<NotificationRead>;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ required: true, enum: ['welcome', 'blog', 'broadcast'] })
  kind: 'welcome' | 'blog' | 'broadcast';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: String, default: null })
  href?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  audienceUserId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdById?: Types.ObjectId | null;

  @Prop({ type: String, default: null, unique: true, sparse: true })
  sourceKey?: string | null;

  @Prop({ type: String, enum: ['HINGLISH', 'ENGLISH'], default: null, index: true })
  language?: 'HINGLISH' | 'ENGLISH' | null;

  @Prop({ type: String, default: null, index: true })
  translationGroupId?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Blog', default: null, index: true })
  blogId?: Types.ObjectId | null;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);

@Schema({ collection: 'notification_reads', timestamps: true })
export class NotificationRead {
  @Prop({ type: Types.ObjectId, ref: 'Notification', required: true, index: true })
  notificationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  readAt: Date;
}
export const NotificationReadSchema = SchemaFactory.createForClass(NotificationRead);
NotificationReadSchema.index({ notificationId: 1, userId: 1 }, { unique: true });
