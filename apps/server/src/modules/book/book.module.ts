import { Module } from '@nestjs/common';
import { ClerkAuthModule } from '../clerk-auth/clerk-auth.module.js';
import { BookController } from './book.controller.js';
import { BookService } from './book.service.js';

@Module({
  imports: [ClerkAuthModule],
  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}
