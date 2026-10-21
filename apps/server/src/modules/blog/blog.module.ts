import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Blog,
  BlogBlock,
  BlogBlockSchema,
  BlogCategory,
  BlogCategorySchema,
  BlogRevision,
  BlogRevisionSchema,
  BlogSchema,
  BlogTag,
  BlogTagSchema,
  Category,
  CategorySchema,
  Notification,
  NotificationSchema,
  Tag,
  TagSchema,
  UrlRedirect,
  UrlRedirectSchema,
  User,
  UserSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';
import { GeminiService } from './gemini.service.js';
import { ChatCompletionService } from './chat-completion.service.js';
import { ArticleGenerationService } from './article-generation.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: BlogBlock.name, schema: BlogBlockSchema },
      { name: BlogRevision.name, schema: BlogRevisionSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Tag.name, schema: TagSchema },
      { name: BlogCategory.name, schema: BlogCategorySchema },
      { name: BlogTag.name, schema: BlogTagSchema },
      { name: UrlRedirect.name, schema: UrlRedirectSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [BlogController],
  providers: [
    BlogService,
    GeminiService,
    ArticleGenerationService,
    ChatCompletionService,
  ],
  exports: [BlogService, GeminiService],
})
export class BlogModule {}
