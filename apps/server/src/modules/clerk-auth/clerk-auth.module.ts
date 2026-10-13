import { Module } from '@nestjs/common';
import { ClerkAuthController } from './clerk-auth.controller.js';
import { ClerkAuthService } from './clerk-auth.service.js';

@Module({
  controllers: [ClerkAuthController],
  providers: [ClerkAuthService],
  exports: [ClerkAuthService],
})
export class ClerkAuthModule {}
