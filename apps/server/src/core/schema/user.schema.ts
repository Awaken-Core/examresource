import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ type: String, default: null })
  phone?: string | null;

  @Prop({ type: String, default: null, index: true, sparse: true })
  googleSubject?: string | null;

  @Prop({ type: String, default: null })
  passwordHash?: string | null;

  @Prop({ type: Date, default: null })
  emailVerifiedAt?: Date | null;

  @Prop({ type: String, enum: ['student', 'editor', 'admin'], default: 'student' })
  role: 'student' | 'editor' | 'admin';

  @Prop({ type: String, enum: ['active', 'suspended'], default: 'active' })
  status: 'active' | 'suspended';
}

export const UserSchema = SchemaFactory.createForClass(User);
