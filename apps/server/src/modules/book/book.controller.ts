import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { ClerkAuthService } from '../clerk-auth/clerk-auth.service.js';
import { BookService } from './book.service.js';
import { createBookSchema, updateBookSchema } from './dto/book.dto.js';

@Controller('api/v1')
export class BookController {
  constructor(
    private readonly service: BookService,
    private readonly auth: ClerkAuthService,
  ) {}

  @Get('books')
  list() {
    return this.service.listPublished();
  }

  @Get('books/:id')
  get(@Param('id') id: string) {
    return this.service.getPublished(id);
  }

  @Get('me/books')
  async listManageable(@Req() req: Request) {
    return this.service.listManageable(await this.auth.requireUser(req));
  }

  @Get('me/books/:id')
  async getManageable(@Param('id') id: string, @Req() req: Request) {
    return this.service.getManageable(id, await this.auth.requireUser(req));
  }

  @Post('books')
  async create(@Req() req: Request) {
    return this.service.create(
      this.parse(createBookSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('books/:id')
  async update(@Param('id') id: string, @Req() req: Request) {
    return this.service.update(
      id,
      this.parse(updateBookSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Delete('books/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.service.remove(id, await this.auth.requireUser(req));
  }

  private parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Request body is invalid.',
        errors: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}
