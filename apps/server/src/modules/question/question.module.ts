import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Exam,
  ExamSchema,
  Question,
  QuestionSchema,
  ReportedQuestion,
  ReportedQuestionSchema,
  SavedQuestion,
  SavedQuestionSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { QuestionController } from './question.controller.js';
import { QuestionService } from './question.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: SavedQuestion.name, schema: SavedQuestionSchema },
      { name: ReportedQuestion.name, schema: ReportedQuestionSchema },
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
