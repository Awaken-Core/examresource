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
  language?: 'HINGLISH' | 'ENGLISH' | null;
  translationGroupId?: string | null;
  createdAt: Date;
  read: boolean;
};

const TITLE_LIMIT = 120;
const BODY_LIMIT = 500;

export function normalizeNotificationLanguage(lang?: string | null): 'HINGLISH' | 'ENGLISH' {
  if (!lang) return 'HINGLISH';
  const l = lang.trim().toLowerCase();
  return l === 'en' || l === 'english' ? 'ENGLISH' : 'HINGLISH';
}

export function resolveNotificationLanguage(item: { language?: string | null; title?: string; body?: string }): 'HINGLISH' | 'ENGLISH' {
  if (item.language) {
    const l = item.language.trim().toUpperCase();
    if (l === 'ENGLISH' || l === 'EN') return 'ENGLISH';
    if (l === 'HINGLISH' || l === 'HI') return 'HINGLISH';
  }
  const text = `${item.title || ''} ${item.body || ''}`;
  return /[\u0900-\u097F]/.test(text) ? 'HINGLISH' : 'ENGLISH';
}

export function deduplicateNotificationsByLanguage<T extends {
  _id?: any;
  id?: any;
  kind?: string;
  href?: string | null;
  language?: string | null;
  translationGroupId?: string | null;
  createdAt?: any;
}>(
  items: T[],
  targetLang: 'HINGLISH' | 'ENGLISH',
): T[] {
  const target = targetLang.toUpperCase();
  const groupMap = new Map<string, T[]>();
  const ungrouped: T[] = [];

  for (const item of items) {
    let groupKey: string | null = null;
    if (item.translationGroupId) {
      groupKey = `group:${item.translationGroupId}`;
    } else if (item.kind === 'blog' && item.href) {
      const cleanHref = item.href.split('?')[0].replace(/\/+$/, '').toLowerCase();
      if (cleanHref) {
        groupKey = `href:${cleanHref}`;
      }
    }

    if (groupKey) {
      const list = groupMap.get(groupKey);
      if (list) {
        list.push(item);
      } else {
        groupMap.set(groupKey, [item]);
      }
    } else {
      ungrouped.push(item);
    }
  }

  const selectedFromGroups: T[] = [];
  for (const list of groupMap.values()) {
    if (list.length === 1) {
      selectedFromGroups.push(list[0]);
      continue;
    }
    // Prefer exact match with target language
    const match = list.find((it) => resolveNotificationLanguage(it as any) === target);
    selectedFromGroups.push(match || list[0]);
  }

  const combined = [...ungrouped, ...selectedFromGroups];
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return combined;
}

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
    language?: 'HINGLISH' | 'ENGLISH' | null;
    translationGroupId?: string | null;
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
          language: input.language ?? resolveNotificationLanguage({ title: input.title, body: input.title }),
          translationGroupId: input.translationGroupId ?? null,
          blogId: Types.ObjectId.isValid(input.blogId) ? new Types.ObjectId(input.blogId) : null,
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
    language: (doc as any).language ?? null,
    translationGroupId: (doc as any).translationGroupId ?? null,
    createdAt: (doc as any).createdAt,
  };
}

export async function listNotificationsForUser(
  notificationModel: Model<NotificationDocument>,
  notificationReadModel: Model<NotificationReadDocument>,
  userModel: Model<UserDocument>,
  userId: string,
  requestedLang?: string | null,
): Promise<NotificationView[]> {
  const account = await userModel.findById(userId).select({ createdAt: 1, name: 1 });
  if (!account) return [];

  try {
    await ensureWelcomeNotification(notificationModel, { id: userId, name: account.name });
  } catch (error) {
    console.error('Failed to create welcome notification', error);
  }

  const userObjectId = new Types.ObjectId(userId);
  const rawItems = await notificationModel
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
    .limit(80)
    .lean();

  if (rawItems.length === 0) return [];

  const targetLang = normalizeNotificationLanguage(requestedLang);
  const items = deduplicateNotificationsByLanguage(rawItems as any, targetLang).slice(0, 40);

  const allRawIds = rawItems.map((i) => i._id);
  const reads = await notificationReadModel
    .find({
      userId: userObjectId,
      notificationId: { $in: allRawIds },
    })
    .select({ notificationId: 1 })
    .lean();

  const readSet = new Set(reads.map((r) => r.notificationId.toString()));

  // Map each translationGroupId and clean href to read status
  const groupReadMap = new Map<string, boolean>();
  for (const raw of rawItems) {
    const rawId = raw._id.toString();
    if (readSet.has(rawId)) {
      if (raw.translationGroupId) groupReadMap.set(`group:${raw.translationGroupId}`, true);
      if (raw.href) {
        const cleanHref = raw.href.split('?')[0].replace(/\/+$/, '').toLowerCase();
        if (cleanHref) groupReadMap.set(`href:${cleanHref}`, true);
      }
    }
  }

  return items.map((row: any) => {
    const id = row._id.toString();
    const groupKey = row.translationGroupId
      ? `group:${row.translationGroupId}`
      : row.href
      ? `href:${row.href.split('?')[0].replace(/\/+$/, '').toLowerCase()}`
      : null;
    const isGroupRead = groupKey ? groupReadMap.get(groupKey) === true : false;
    const isRead = readSet.has(id) || isGroupRead;

    return {
      id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      href: row.href || null,
      language: row.language ?? null,
      translationGroupId: row.translationGroupId ?? null,
      createdAt: row.createdAt,
      read: isRead,
    };
  });
}

export async function listPublicNotifications(
  notificationModel: Model<NotificationDocument>,
  requestedLang?: string | null,
  limit = 3,
): Promise<NotificationView[]> {
  const targetLang = normalizeNotificationLanguage(requestedLang);
  const rawItems = await notificationModel
    .find({ audienceUserId: null })
    .sort({ createdAt: -1 })
    .limit(Math.max(limit * 4, 20))
    .lean();

  if (rawItems.length === 0) return [];

  const items = deduplicateNotificationsByLanguage(rawItems as any, targetLang).slice(0, limit);

  return items.map((row: any) => ({
    id: row._id.toString(),
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href || null,
    language: row.language ?? null,
    translationGroupId: row.translationGroupId ?? null,
    createdAt: row.createdAt,
    read: false,
  }));
}

export async function markNotificationsRead(
  notificationModel: Model<NotificationDocument>,
  notificationReadModel: Model<NotificationReadDocument>,
  userModel: Model<UserDocument>,
  userId: string,
  ids?: string[],
) {
  const userObjectId = new Types.ObjectId(userId);
  let targetDocs: NotificationDocument[] = [];

  if (ids?.length) {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    targetDocs = await notificationModel.find({ _id: { $in: validIds } });
  } else {
    const visible = await listNotificationsForUser(notificationModel, notificationReadModel, userModel, userId);
    const validIds = visible.filter((i) => !i.read).map((i) => new Types.ObjectId(i.id));
    targetDocs = await notificationModel.find({ _id: { $in: validIds } });
  }

  if (!targetDocs.length) return { updated: 0 };

  const allIdsToMark = new Set<string>();
  const translationGroupIds: string[] = [];

  for (const doc of targetDocs) {
    allIdsToMark.add(doc._id.toString());
    if (doc.translationGroupId) {
      translationGroupIds.push(doc.translationGroupId);
    }
  }

  if (translationGroupIds.length > 0) {
    const peers = await notificationModel
      .find({ translationGroupId: { $in: translationGroupIds } })
      .select({ _id: 1 })
      .lean();
    for (const p of peers) {
      allIdsToMark.add(p._id.toString());
    }
  }

  let count = 0;
  for (const notificationId of allIdsToMark) {
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
    language: r.language ?? null,
    translationGroupId: r.translationGroupId ?? null,
    createdAt: r.createdAt,
    authorName: r.createdById?.name ?? null,
  }));
}
