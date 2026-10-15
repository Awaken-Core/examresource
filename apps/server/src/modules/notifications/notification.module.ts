import { Module } from '@nestjs/common';
import { ClerkAuthModule } from '../clerk-auth/clerk-auth.module.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';

@Module({
  imports: [ClerkAuthModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
