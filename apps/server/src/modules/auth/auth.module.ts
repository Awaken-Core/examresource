import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmailVerificationToken,
  EmailVerificationTokenSchema,
  Notification,
  NotificationSchema,
  OauthState,
  OauthStateSchema,
  PasswordResetToken,
  PasswordResetTokenSchema,
  Session,
  SessionSchema,
  User,
  UserSchema,
} from '../../core/schema/index.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: OauthState.name, schema: OauthStateSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
      { name: EmailVerificationToken.name, schema: EmailVerificationTokenSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
