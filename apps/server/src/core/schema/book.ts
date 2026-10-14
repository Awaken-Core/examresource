import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const books = pgTable(
  'books',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    coverImage: text('cover_image').notNull(),
    relatedCovers: text('related_covers').array().notNull().default([]),
        displayPrice: numeric('display_price', { mode: 'number' }).notNull(), // This is the show only price to manipulate user
        price: numeric('price', { mode: 'number' }).notNull(), // This is the original price
        discount: numeric('discount', { mode: 'number' }).notNull().default(0), // This is in percentage
    tags: text('tags').array().notNull().default([]),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    author: text('author'),
    originalPublisher: text('original_publisher'),
    entryBy: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('books_archived_published_at_idx').on(
      table.isArchived,
      table.publishedAt,
    ),
    index('books_entry_by_idx').on(table.entryBy),
  ],
);
