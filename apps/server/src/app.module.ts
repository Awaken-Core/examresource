import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { env } from './core/config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BlogModule } from './modules/blog/blog.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { NotificationModule } from './modules/notifications/notification.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(env.DATABASE_URL),
    AuthModule,
    BlogModule,
    MediaModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
