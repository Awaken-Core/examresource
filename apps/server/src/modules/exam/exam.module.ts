import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Exam,
  ExamSchema,
  Question,
  QuestionSchema,
  TestAttempt,
  TestAttemptSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { ExamController } from './exam.controller.js';
import { ExamService } from './exam.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
    ]),
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
