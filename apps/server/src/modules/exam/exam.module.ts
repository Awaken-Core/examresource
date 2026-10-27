import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Exam,
  ExamSchema,
  Question,
  QuestionSchema,
  TestAttempt,
  TestAttemptSchema,
  Subject,
  SubjectSchema,
  TestSeries,
  TestSeriesSchema,
  TestSeriesSubject,
  TestSeriesSubjectSchema,
  Chapter,
  ChapterSchema,
  QuestionMapping,
  QuestionMappingSchema,
  User,
  UserSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentsModule } from '../payments/payment.module.js';
import { ExamController } from './exam.controller.js';
import { ExamService } from './exam.service.js';

@Module({
  imports: [
    AuthModule,
    PaymentsModule,
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: TestSeries.name, schema: TestSeriesSchema },
      { name: TestSeriesSubject.name, schema: TestSeriesSubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: QuestionMapping.name, schema: QuestionMappingSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
