import {
    boolean,
    pgTable,
    text,
    timestamp,
    numeric,
    uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const books = pgTable(
    'books',
    {
        id: uuid('id').primaryKey(),
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
            .references(() => users.id, { onDelete: 'set null' }),
        isArchived: boolean('is_archived').default(true),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    }
);