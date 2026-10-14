import { Module } from '@nestjs/common';
import { ClerkAuthModule } from '../clerk-auth/clerk-auth.module.js';
import { ExamController } from './exam.controller.js';
import { ExamService } from './exam.service.js';

@Module({
  imports: [ClerkAuthModule],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
