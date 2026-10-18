import 'dotenv/config';
import mongoose from 'mongoose';
import pg from 'pg';

const pgUrl = process.env.PG_DATABASE_URL || process.env.OLD_DATABASE_URL;
const mongoUrl = process.env.DATABASE_URL;
if (!pgUrl) throw new Error('PG_DATABASE_URL is required.');
if (!mongoUrl?.startsWith('mongodb')) throw new Error('DATABASE_URL must be a MongoDB URI.');

const date = (value) => (value ? new Date(value) : null);
const now = () => new Date();

async function upsert(collection, filter, document) {
  await collection.updateOne(filter, { $setOnInsert: document }, { upsert: true });
  const result = await collection.findOne(filter, { projection: { _id: 1 } });
  if (!result) throw new Error(`Could not save ${collection.collectionName}.`);
  return result._id;
}

async function migrate() {
  const source = new pg.Pool({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  await mongoose.connect(mongoUrl);
  const db = mongoose.connection.db;
  try {
    const [categories, tags, users] = await Promise.all([
      source.query('SELECT * FROM category'), source.query('SELECT * FROM tag'), source.query('SELECT * FROM users'),
    ]);
    const categoryIds = new Map(); const tagIds = new Map(); const userIds = new Map();
    for (const row of categories.rows) categoryIds.set(row.id, await upsert(db.collection('categories'), { slug: row.slug }, {
      name: row.name, slug: row.slug, description: row.description ?? null, createdAt: date(row.createdAt) ?? now(), updatedAt: date(row.updatedAt) ?? now(),
    }));
    for (const row of tags.rows) tagIds.set(row.id, await upsert(db.collection('tags'), { slug: row.slug }, {
      name: row.name, slug: row.slug, createdAt: date(row.createdAt) ?? now(), updatedAt: date(row.createdAt) ?? now(),
    }));
    for (const row of users.rows) userIds.set(row.id, await upsert(db.collection('users'), { email: row.email.toLowerCase() }, {
      name: row.name, email: row.email.toLowerCase(), phone: row.phone ?? null, googleSubject: row.google_subject ?? null,
      passwordHash: row.password_hash ?? null, emailVerifiedAt: date(row.email_verified_at), role: row.role ?? 'student', status: row.status ?? 'active',
      createdAt: date(row.created_at) ?? now(), updatedAt: date(row.updated_at) ?? now(),
    }));

    const results = await Promise.all([
      source.query('SELECT * FROM blog'), source.query('SELECT * FROM sessions'), source.query('SELECT * FROM oauth_states'),
      source.query('SELECT * FROM password_reset_tokens'), source.query('SELECT * FROM email_verification_tokens'),
      source.query('SELECT * FROM blog_revision'), source.query('SELECT * FROM blog_block'), source.query('SELECT * FROM blog_category'),
      source.query('SELECT * FROM blog_tag'), source.query('SELECT * FROM url_redirect'), source.query('SELECT * FROM notifications'),
      source.query('SELECT * FROM notification_reads'),
    ]);
    const [blogs, sessions, oauthStates, passwordTokens, emailTokens, revisions, blocks, blogCategories, blogTags, redirects, notifications, notificationReads] = results.map((result) => result.rows);
    const blogIds = new Map(); const notificationIds = new Map();
    for (const row of blogs) {
      const authorId = userIds.get(row.authorId); if (!authorId) continue;
      blogIds.set(row.id, await upsert(db.collection('blogs'), { slug: row.slug, language: row.language ?? 'HINGLISH' }, {
        title: row.title, slug: row.slug, description: row.description ?? null, coverImage: row.coverImage ?? null, status: row.status ?? 'DRAFT',
        publishedAt: date(row.publishedAt), scheduledAt: date(row.scheduledAt), authorId, categoryId: row.categoryId ? categoryIds.get(row.categoryId) ?? null : null,
        metaTitle: row.metaTitle ?? null, metaDescription: row.metaDescription ?? null, canonicalUrl: row.canonicalUrl ?? null, imageAlt: row.imageAlt ?? null,
        imageCaption: row.imageCaption ?? null, noindex: Boolean(row.noindex), language: row.language ?? 'HINGLISH', translationGroupId: row.translationGroupId ?? null,
        version: row.version ?? 1, createdAt: date(row.createdAt) ?? now(), updatedAt: date(row.updatedAt) ?? now(),
      }));
    }
    for (const row of sessions) {
      const userId = userIds.get(row.user_id); if (!userId) continue;
      await upsert(db.collection('sessions'), { tokenHash: row.token_hash }, { userId, tokenHash: row.token_hash, expiresAt: date(row.expires_at), revokedAt: date(row.revoked_at), lastUsedAt: date(row.last_used_at) ?? now(), createdAt: date(row.created_at) ?? now(), updatedAt: date(row.created_at) ?? now() });
    }
    for (const [rows, collection, hashField] of [[oauthStates, 'oauth_states', 'stateHash'], [passwordTokens, 'password_reset_tokens', 'tokenHash'], [emailTokens, 'email_verification_tokens', 'tokenHash']]) {
      for (const row of rows) {
        const hash = row.state_hash ?? row.token_hash; const userId = row.user_id ? userIds.get(row.user_id) : null;
        if (!hash || (row.user_id && !userId)) continue;
        await upsert(db.collection(collection), { [hashField]: hash }, { [hashField]: hash, ...(userId ? { userId } : {}), expiresAt: date(row.expires_at), usedAt: date(row.used_at), createdAt: date(row.created_at) ?? now(), updatedAt: date(row.created_at) ?? now() });
      }
    }
    for (const row of blocks) {
      const blogId = blogIds.get(row.blogId); if (!blogId) continue;
      await upsert(db.collection('blog_blocks'), { blogId, position: row.position }, { blogId, type: row.type, value: row.value, position: row.position, metadata: row.metadata ?? null, createdAt: date(row.createdAt) ?? now(), updatedAt: date(row.updatedAt) ?? now() });
    }
    for (const row of revisions) {
      const blogId = blogIds.get(row.blogId); const authorId = userIds.get(row.authorId); if (!blogId || !authorId) continue;
      await upsert(db.collection('blog_revisions'), { blogId, version: row.version }, { blogId, authorId, title: row.title, description: row.description ?? null, version: row.version, snapshot: row.snapshot, createdAt: date(row.createdAt) ?? now(), updatedAt: date(row.createdAt) ?? now() });
    }
    for (const [rows, collection, ids, field] of [[blogCategories, 'blog_categories', categoryIds, 'categoryId'], [blogTags, 'blog_tags', tagIds, 'tagId']]) {
      for (const row of rows) {
        const blogId = blogIds.get(row.blogId); const relatedId = ids.get(row[field]); if (!blogId || !relatedId) continue;
        await upsert(db.collection(collection), { blogId, [field]: relatedId }, { blogId, [field]: relatedId, createdAt: now(), updatedAt: now() });
      }
    }
    for (const row of redirects) await upsert(db.collection('url_redirects'), { sourcePath: row.sourcePath }, { sourcePath: row.sourcePath, targetPath: row.targetPath, statusCode: row.statusCode ?? 301, createdAt: date(row.createdAt) ?? now(), updatedAt: date(row.createdAt) ?? now() });
    for (const row of notifications) {
      const filter = row.source_key ? { sourceKey: row.source_key } : { legacyId: row.id };
      notificationIds.set(row.id, await upsert(db.collection('notifications'), filter, { ...filter, kind: row.kind, title: row.title, body: row.body, href: row.href ?? null, sourceKey: row.source_key ?? null, audienceUserId: row.audience_user_id ? userIds.get(row.audience_user_id) ?? null : null, createdById: row.created_by_id ? userIds.get(row.created_by_id) ?? null : null, createdAt: date(row.created_at) ?? now(), updatedAt: date(row.created_at) ?? now() }));
    }
    for (const row of notificationReads) {
      const notificationId = notificationIds.get(row.notification_id); const userId = userIds.get(row.user_id); if (!notificationId || !userId) continue;
      await upsert(db.collection('notification_reads'), { notificationId, userId }, { notificationId, userId, readAt: date(row.read_at) ?? now(), createdAt: date(row.read_at) ?? now(), updatedAt: date(row.read_at) ?? now() });
    }
    console.log('PostgreSQL to MongoDB migration completed successfully.');
  } finally { await Promise.all([source.end(), mongoose.disconnect()]); }
}

migrate().catch((error) => { console.error('Migration failed:', error); process.exitCode = 1; });
