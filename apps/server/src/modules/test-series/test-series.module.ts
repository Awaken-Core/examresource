import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Chapter,
  ChapterSchema,
  Exam,
  ExamSchema,
  Question,
  QuestionSchema,
  QuestionMapping,
  QuestionMappingSchema,
  Subject,
  SubjectSchema,
  TestSeries,
  TestSeriesSchema,
  TestSeriesSubject,
  TestSeriesSubjectSchema,
  TestAttempt,
  TestAttemptSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { TestSeriesController } from './test-series.controller.js';
import { TestSeriesService } from './test-series.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TestSeries.name, schema: TestSeriesSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: TestSeriesSubject.name, schema: TestSeriesSubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: QuestionMapping.name, schema: QuestionMappingSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
    ]),
  ],
  controllers: [TestSeriesController],
  providers: [TestSeriesService],
  exports: [TestSeriesService],
})
export class TestSeriesModule {}
