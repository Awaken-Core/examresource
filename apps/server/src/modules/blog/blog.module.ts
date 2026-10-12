import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
