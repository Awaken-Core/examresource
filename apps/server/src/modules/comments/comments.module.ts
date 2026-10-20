import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { Blog, BlogSchema, Comment, CommentSchema } from '../../core/schema/index.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
