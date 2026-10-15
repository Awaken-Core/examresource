import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, isNull, or } from 'drizzle-orm';
import { db } from '../../core/config/db.js';
import {
  notificationReads,
  notifications,
  users,
} from '../../core/schema/index.js';

export type NotificationView = {
  id: string;
  kind: 'welcome' | 'blog' | 'broadcast';
  title: string;
  body: string;
  href: string | null;
  createdAt: Date;
  read: boolean;
};

const TITLE_LIMIT = 120;
const BODY_LIMIT = 500;

export function normalizeNotificationHref(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BadRequestException('Link must be a site path or https URL.');
  }
  const href = value.trim();
  if (!href) return null;
  if (href.startsWith('/') && !href.startsWith('//') && !href.includes(' ')) {
    return href.slice(0, 500);
  }
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    throw new BadRequestException('Link must start with / or https://.');
  }
  if (url.protocol !== 'https:') {
    throw new BadRequestException('Link must start with / or https://.');
  }
  return url.toString().slice(0, 500);
}

function requireText(value: unknown, label: string, limit: number) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${label} is required.`);
  }
  const text = value.trim();
  if (text.length > limit) {
    throw new BadRequestException(`${label} must be ${limit} characters or fewer.`);
  }
  return text;
}

export async function ensureWelcomeNotification(user: { id: string; name: string }) {
  const name = user.name.trim() || 'there';
  await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      kind: 'welcome',
      title: 'Welcome',
      body: `Hi ${name}, your account is ready. Start preparing on govtpariksha.com.`,
      audienceUserId: user.id,
      sourceKey: `welcome:${user.id}`,
    })
    .onConflictDoNothing({ target: notifications.sourceKey });
}

export async function createBlogPublishedNotification(input: {
  blogId: string;
  title: string;
  href: string;
}) {
  await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      kind: 'blog',
      title: 'New article',
      body: `New article published: ${input.title.trim()}`.slice(0, BODY_LIMIT),
      href: input.href,
      sourceKey: `blog:${input.blogId}`,
    })
    .onConflictDoNothing({ target: notifications.sourceKey });
}

export async function createBroadcastNotification(
  adminId: string,
  input: { title: unknown; body: unknown; href?: unknown },
) {
  const title = requireText(input.title, 'Title', TITLE_LIMIT);
  const body = requireText(input.body, 'Message', BODY_LIMIT);
  const href = normalizeNotificationHref(input.href);
  const [created] = await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      kind: 'broadcast',
      title,
      body,
      href,
      createdById: adminId,
    })
    .returning({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      href: notifications.href,
      createdAt: notifications.createdAt,
    });
  return created;
}

export async function listNotificationsForUser(userId: string): Promise<NotificationView[]> {
  const [account] = await db
    .select({ createdAt: users.createdAt, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!account) return [];

  try {
    await ensureWelcomeNotification({ id: userId, name: account.name });
  } catch (error) {
    console.error('Failed to create welcome notification', error);
  }

  const rows = await db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      href: notifications.href,
      createdAt: notifications.createdAt,
      readAt: notificationReads.readAt,
    })
    .from(notifications)
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.notificationId, notifications.id),
        eq(notificationReads.userId, userId),
      ),
    )
    .where(
      or(
        eq(notifications.audienceUserId, userId),
        and(isNull(notifications.audienceUserId), gte(notifications.createdAt, account.createdAt)),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(40);

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href,
    createdAt: row.createdAt,
    read: Boolean(row.readAt),
  }));
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const visible = await listNotificationsForUser(userId);
  const allowed = new Set(visible.map((item) => item.id));
  const targetIds = (ids?.length ? ids : visible.filter((item) => !item.read).map((item) => item.id))
    .filter((id) => allowed.has(id));
  if (!targetIds.length) return { updated: 0 };

  await db
    .insert(notificationReads)
    .values(targetIds.map((notificationId) => ({ notificationId, userId })))
    .onConflictDoNothing();
  return { updated: targetIds.length };
}

export async function listRecentNotifications(limit = 40) {
  return db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      href: notifications.href,
      createdAt: notifications.createdAt,
      authorName: users.name,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.createdById, users.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
