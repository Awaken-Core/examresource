import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ClerkAuthModule } from './modules/clerk-auth/clerk-auth.module.js';
import { BlogModule } from './modules/blog/blog.module.js';
import { BookModule } from './modules/book/book.module.js';
import { ExamModule } from './modules/exam/exam.module.js';
import { QuestionModule } from './modules/question/question.module.js';

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ClerkAuthModule,
    BlogModule,
    BookModule,
    QuestionModule,
    ExamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
