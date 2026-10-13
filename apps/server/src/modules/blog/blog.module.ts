import { Module } from '@nestjs/common';
import { ClerkAuthModule } from '../clerk-auth/clerk-auth.module.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';

@Module({
  imports: [ClerkAuthModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
