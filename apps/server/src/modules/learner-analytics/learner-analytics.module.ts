import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Chapter,
  ChapterSchema,
  Exam,
  ExamSchema,
  Subject,
  SubjectSchema,
  TestAttempt,
  TestAttemptSchema,
  TestSeries,
  TestSeriesSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { LearnerAnalyticsController } from './learner-analytics.controller.js';
import { LearnerAnalyticsService } from './learner-analytics.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TestAttempt.name, schema: TestAttemptSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: TestSeries.name, schema: TestSeriesSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
  ],
  controllers: [LearnerAnalyticsController],
  providers: [LearnerAnalyticsService],
  exports: [LearnerAnalyticsService],
})
export class LearnerAnalyticsModule {}
