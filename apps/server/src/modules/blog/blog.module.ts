import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';
import { GeminiService } from './gemini.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BlogController],
  providers: [BlogService, GeminiService],
  exports: [BlogService, GeminiService],
})
export class BlogModule {}
