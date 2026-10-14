import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../core/config/db.js';
import { books } from '../../core/schema/index.js';
import type { CurrentUser } from '../clerk-auth/clerk-auth.service.js';
import type { CreateBookInput, UpdateBookInput } from './dto/book.dto.js';

@Injectable()
export class BookService {
  listPublished() {
    return db
      .select()
      .from(books)
      .where(eq(books.isArchived, false))
      .orderBy(desc(books.publishedAt), desc(books.createdAt));
  }

  async getPublished(id: string) {
    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, id), eq(books.isArchived, false)))
      .limit(1);

    if (!book) {
      throw new NotFoundException('Book was not found.');
    }
    return book;
  }

  async listManageable(user: CurrentUser) {
    this.assertEditor(user);
    return user.role === 'admin'
      ? db.select().from(books).orderBy(desc(books.updatedAt))
      : db
          .select()
          .from(books)
          .where(eq(books.entryBy, user.id))
          .orderBy(desc(books.updatedAt));
  }

  getManageable(id: string, user: CurrentUser) {
    return this.findManageable(id, user);
  }

  async create(input: CreateBookInput, user: CurrentUser) {
    this.assertEditor(user);
    const [book] = await db
      .insert(books)
      .values({ ...input, entryBy: user.id })
      .returning();

    if (!book) {
      throw new Error('Book creation did not return a row.');
    }
    return book;
  }

  async update(id: string, input: UpdateBookInput, user: CurrentUser) {
    const existing = await this.findManageable(id, user);
    const [book] = await db
      .update(books)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(books.id, existing.id))
      .returning();

    if (!book) {
      throw new NotFoundException('Book was not found.');
    }
    return book;
  }

  async remove(id: string, user: CurrentUser) {
    const existing = await this.findManageable(id, user);
    await db.delete(books).where(eq(books.id, existing.id));
  }

  private async findManageable(id: string, user: CurrentUser) {
    this.assertEditor(user);
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);

    if (!book) {
      throw new NotFoundException('Book was not found.');
    }
    if (user.role !== 'admin' && book.entryBy !== user.id) {
      throw new ForbiddenException('You cannot manage this book.');
    }
    return book;
  }

  private assertEditor(user: CurrentUser) {
    if (user.role === 'student') {
      throw new ForbiddenException('Editor access is required.');
    }
  }
}
