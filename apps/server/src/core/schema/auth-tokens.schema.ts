import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OauthStateDocument = HydratedDocument<OauthState>;
export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;
export type EmailVerificationTokenDocument = HydratedDocument<EmailVerificationToken>;

@Schema({ collection: 'oauth_states', timestamps: true })
export class OauthState {
  @Prop({ required: true, unique: true, index: true })
  stateHash: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  usedAt?: Date | null;
}
export const OauthStateSchema = SchemaFactory.createForClass(OauthState);

@Schema({ collection: 'password_reset_tokens', timestamps: true })
export class PasswordResetToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  tokenHash: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  usedAt?: Date | null;
}
export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);

@Schema({ collection: 'email_verification_tokens', timestamps: true })
export class EmailVerificationToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  tokenHash: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  usedAt?: Date | null;
}
export const EmailVerificationTokenSchema = SchemaFactory.createForClass(EmailVerificationToken);
