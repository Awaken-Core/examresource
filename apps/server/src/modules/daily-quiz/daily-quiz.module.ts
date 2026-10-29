import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DailyQuiz,
  DailyQuizAttempt,
  DailyQuizAttemptSchema,
  DailyQuizSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { DailyQuizController } from './daily-quiz.controller.js';
import { DailyQuizService } from './daily-quiz.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: DailyQuiz.name, schema: DailyQuizSchema },
      { name: DailyQuizAttempt.name, schema: DailyQuizAttemptSchema },
    ]),
  ],
  controllers: [DailyQuizController],
  providers: [DailyQuizService],
  exports: [DailyQuizService],
})
export class DailyQuizModule {}
