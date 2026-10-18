import { BadRequestException } from '@nestjs/common';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { env } from '../../core/config/env.js';
import type {
  NotificationDocument,
  NotificationReadDocument,
  UserDocument,
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

export async function ensureWelcomeNotification(
  notificationModel: Model<NotificationDocument>,
  user: { id: string; name: string },
) {
  const name = user.name.trim() || 'there';
  const siteHost = new URL(env.CLIENT_URL).host;
  const sourceKey = `welcome:${user.id}`;

  try {
    await notificationModel.updateOne(
      { sourceKey },
      {
        $setOnInsert: {
          kind: 'welcome',
          title: 'Welcome',
          body: `Hi ${name}, your account is ready. Start preparing on ${siteHost}.`,
          audienceUserId: new Types.ObjectId(user.id),
          sourceKey,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error('Failed to ensure welcome notification', error);
  }
}

export async function createBlogPublishedNotification(
  notificationModel: Model<NotificationDocument>,
  input: {
    blogId: string;
    title: string;
    href: string;
  },
) {
  const sourceKey = `blog:${input.blogId}`;
  try {
    await notificationModel.updateOne(
      { sourceKey },
      {
        $setOnInsert: {
          kind: 'blog',
          title: 'New article',
          body: `New article published: ${input.title.trim()}`.slice(0, BODY_LIMIT),
          href: input.href,
          sourceKey,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error('Failed to create blog published notification', error);
  }
}

export async function createBroadcastNotification(
  notificationModel: Model<NotificationDocument>,
  adminId: string,
  input: { title: unknown; body: unknown; href?: unknown },
) {
  const title = requireText(input.title, 'Title', TITLE_LIMIT);
  const body = requireText(input.body, 'Message', BODY_LIMIT);
  const href = normalizeNotificationHref(input.href);

  const doc = await notificationModel.create({
    kind: 'broadcast',
    title,
    body,
    href,
    createdById: new Types.ObjectId(adminId),
  });
  return {
    id: doc._id.toString(),
    kind: doc.kind,
    title: doc.title,
    body: doc.body,
    href: doc.href ?? null,
    createdAt: (doc as any).createdAt,
  };
}

export async function listNotificationsForUser(
  notificationModel: Model<NotificationDocument>,
  notificationReadModel: Model<NotificationReadDocument>,
  userModel: Model<UserDocument>,
  userId: string,
): Promise<NotificationView[]> {
  const account = await userModel.findById(userId).select({ createdAt: 1, name: 1 });
  if (!account) return [];

  try {
    await ensureWelcomeNotification(notificationModel, { id: userId, name: account.name });
  } catch (error) {
    console.error('Failed to create welcome notification', error);
  }

  const userObjectId = new Types.ObjectId(userId);
  const items = await notificationModel
    .find({
      $or: [
        { audienceUserId: userObjectId },
        {
          audienceUserId: null,
          createdAt: { $gte: (account as any).createdAt },
        },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();

  if (items.length === 0) return [];

  const notificationIds = items.map((i) => i._id);
  const reads = await notificationReadModel
    .find({
      userId: userObjectId,
      notificationId: { $in: notificationIds },
    })
    .select({ notificationId: 1 })
    .lean();

  const readSet = new Set(reads.map((r) => r.notificationId.toString()));

  return items.map((row) => ({
    id: row._id.toString(),
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href || null,
    createdAt: (row as any).createdAt,
    read: readSet.has(row._id.toString()),
  }));
}

export async function markNotificationsRead(
  notificationModel: Model<NotificationDocument>,
  notificationReadModel: Model<NotificationReadDocument>,
  userModel: Model<UserDocument>,
  userId: string,
  ids?: string[],
) {
  const visible = await listNotificationsForUser(
    notificationModel,
    notificationReadModel,
    userModel,
    userId,
  );
  const allowed = new Set(visible.map((item) => item.id));
  const targetIds = (
    ids?.length ? ids : visible.filter((item) => !item.read).map((item) => item.id)
  ).filter((id) => allowed.has(id));

  if (!targetIds.length) return { updated: 0 };

  let count = 0;
  const userObjectId = new Types.ObjectId(userId);
  for (const notificationId of targetIds) {
    try {
      await notificationReadModel.updateOne(
        {
          notificationId: new Types.ObjectId(notificationId),
          userId: userObjectId,
        },
        {
          $setOnInsert: {
            notificationId: new Types.ObjectId(notificationId),
            userId: userObjectId,
            readAt: new Date(),
          },
        },
        { upsert: true },
      );
      count++;
    } catch (e) {
      console.error('Error marking notification as read', e);
    }
  }

  return { updated: count };
}

export async function listRecentNotifications(
  notificationModel: Model<NotificationDocument>,
  limit = 40,
) {
  const rows = await notificationModel
    .find({})
    .populate<{ createdById: UserDocument }>('createdById', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((r: any) => ({
    id: r._id.toString(),
    kind: r.kind,
    title: r.title,
    body: r.body,
    href: r.href || null,
    createdAt: r.createdAt,
    authorName: r.createdById?.name ?? null,
  }));
}
