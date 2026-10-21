import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Chapter,
  ChapterSchema,
  Exam,
  ExamSchema,
  Question,
  QuestionSchema,
  ReportedQuestion,
  ReportedQuestionSchema,
  SavedQuestion,
  SavedQuestionSchema,
  Subject,
  SubjectSchema,
  TestSeries,
  TestSeriesSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { BlogModule } from '../blog/blog.module.js';
import { QuestionController } from './question.controller.js';
import { QuestionService } from './question.service.js';

@Module({
  imports: [
    AuthModule,
    BlogModule,
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: SavedQuestion.name, schema: SavedQuestionSchema },
      { name: ReportedQuestion.name, schema: ReportedQuestionSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: TestSeries.name, schema: TestSeriesSchema },
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
