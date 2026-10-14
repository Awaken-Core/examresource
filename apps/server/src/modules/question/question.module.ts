import { Module } from '@nestjs/common';
import { ClerkAuthModule } from '../clerk-auth/clerk-auth.module.js';
import { QuestionController } from './question.controller.js';
import { QuestionService } from './question.service.js';

@Module({
  imports: [ClerkAuthModule],
  controllers: [QuestionController],
  providers: [QuestionService],
})
export class QuestionModule {}
