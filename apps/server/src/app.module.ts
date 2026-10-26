import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './core/database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BlogModule } from './modules/blog/blog.module.js';
import { BookModule } from './modules/book/book.module.js';
import { ExamModule } from './modules/exam/exam.module.js';
import { LearnerAnalyticsModule } from './modules/learner-analytics/learner-analytics.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { NotificationModule } from './modules/notifications/notification.module.js';
import { QuestionModule } from './modules/question/question.module.js';
import { TestSeriesModule } from './modules/test-series/test-series.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    AuthModule,
    BlogModule,
    BookModule,
    ExamModule,
    LearnerAnalyticsModule,
    MediaModule,
    NotificationModule,
    QuestionModule,
    TestSeriesModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
