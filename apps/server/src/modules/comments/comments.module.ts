import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '../../core/schema/index.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
})
export class CommentsModule {}
