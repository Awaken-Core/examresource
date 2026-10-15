import {
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const notificationKind = pgEnum('notification_kind', [
  'welcome',
  'blog',
  'broadcast',
]);

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    kind: notificationKind('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    href: text('href'),
    audienceUserId: text('audience_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    createdById: text('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    sourceKey: text('source_key'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('notifications_source_key_unique').on(table.sourceKey),
    index('notifications_created_at_idx').on(table.createdAt),
    index('notifications_audience_user_id_idx').on(table.audienceUserId),
  ],
);

export const notificationReads = pgTable(
  'notification_reads',
  {
    notificationId: text('notification_id')
      .notNull()
      .references(() => notifications.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.notificationId, table.userId] }),
    index('notification_reads_user_id_idx').on(table.userId),
  ],
);
