import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { BookController } from './book.controller.js';
import { BookService } from './book.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
