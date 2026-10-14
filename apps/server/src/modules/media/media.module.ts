import { Module } from '@nestjs/common';
import { ClerkAuthModule } from '../clerk-auth/clerk-auth.module.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';

@Module({
  imports: [ClerkAuthModule],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
