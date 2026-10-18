import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { env } from './core/config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BlogModule } from './modules/blog/blog.module.js';
import { BookModule } from './modules/book/book.module.js';
import { ExamModule } from './modules/exam/exam.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { NotificationModule } from './modules/notifications/notification.module.js';
import { QuestionModule } from './modules/question/question.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(env.DATABASE_URL, {
      maxPoolSize: 2,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    }),
    AuthModule,
    BlogModule,
    BookModule,
    ExamModule,
    MediaModule,
    NotificationModule,
    QuestionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
