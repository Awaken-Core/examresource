import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pgUrl = process.env.OLD_DATABASE_URL || process.env.PG_DATABASE_URL || 'postgresql://neondb_owner:npg_a07LTAMiOCvl@ep-shiny-shadow-b591vxro-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
  console.log('--- Starting PostgreSQL -> MongoDB Migration ---');
  console.log('Connecting to PostgreSQL...');
  const pool = new pg.Pool({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  console.log('Connected to PostgreSQL.');

  console.log('Connecting to MongoDB via Prisma Client...');
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log('Connected to MongoDB.\n');

  try {
    // 1. Categories
    console.log('Migrating categories...');
    const catRes = await client.query('SELECT * FROM category');
    const categoryIdMap = new Map();
    for (const c of catRes.rows) {
      const created = await prisma.category.upsert({
        where: { slug: c.slug },
        create: {
          name: c.name,
          slug: c.slug,
          description: c.description,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        },
        update: {},
      });
      categoryIdMap.set(c.id, created.id);
    }
    console.log(`Migrated ${catRes.rows.length} categories.`);

    // 2. Tags
    console.log('Migrating tags...');
    const tagRes = await client.query('SELECT * FROM tag');
    const tagIdMap = new Map();
    for (const t of tagRes.rows) {
      const created = await prisma.tag.upsert({
        where: { slug: t.slug },
        create: {
          name: t.name,
          slug: t.slug,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        },
        update: {},
      });
      tagIdMap.set(t.id, created.id);
    }
    console.log(`Migrated ${tagRes.rows.length} tags.`);

    // 3. Users
    console.log('Migrating users...');
    const userRes = await client.query('SELECT * FROM users');
    const userIdMap = new Map();
    for (const u of userRes.rows) {
      const created = await prisma.user.upsert({
        where: { email: u.email },
        create: {
          clerkUserId: u.clerk_user_id || undefined,
          name: u.name,
          email: u.email,
          phone: u.phone || undefined,
          googleSubject: u.google_subject || undefined,
          passwordHash: u.password_hash || undefined,
          emailVerifiedAt: u.email_verified_at ? new Date(u.email_verified_at) : undefined,
          role: u.role || 'student',
          status: u.status || 'active',
          createdAt: u.created_at ? new Date(u.created_at) : new Date(),
          updatedAt: u.updated_at ? new Date(u.updated_at) : new Date(),
        },
        update: {},
      });
      userIdMap.set(u.id, created.id);
    }
    console.log(`Migrated ${userRes.rows.length} users.`);

    // 4. Sessions
    console.log('Migrating sessions...');
    const sessionRes = await client.query('SELECT * FROM sessions');
    let sessionCount = 0;
    for (const s of sessionRes.rows) {
      const newUserId = userIdMap.get(s.user_id);
      if (!newUserId) continue;
      await prisma.session.upsert({
        where: { tokenHash: s.token_hash },
        create: {
          userId: newUserId,
          tokenHash: s.token_hash,
          expiresAt: new Date(s.expires_at),
          revokedAt: s.revoked_at ? new Date(s.revoked_at) : null,
          createdAt: s.created_at ? new Date(s.created_at) : new Date(),
          lastUsedAt: s.last_used_at ? new Date(s.last_used_at) : new Date(),
        },
        update: {},
      });
      sessionCount++;
    }
    console.log(`Migrated ${sessionCount} sessions.`);

    // 5. Blogs
    console.log('Migrating blogs...');
    const blogRes = await client.query('SELECT * FROM blog');
    const blogIdMap = new Map();
    for (const b of blogRes.rows) {
      const newAuthorId = userIdMap.get(b.authorId);
      if (!newAuthorId) continue;
      const newCategoryId = b.categoryId ? categoryIdMap.get(b.categoryId) : null;

      const created = await prisma.blog.upsert({
        where: {
          slug_language: {
            slug: b.slug,
            language: b.language || 'HINGLISH',
          },
        },
        create: {
          title: b.title,
          slug: b.slug,
          description: b.description,
          coverImage: b.coverImage,
          status: b.status || 'DRAFT',
          publishedAt: b.publishedAt ? new Date(b.publishedAt) : null,
          scheduledAt: b.scheduledAt ? new Date(b.scheduledAt) : null,
          authorId: newAuthorId,
          categoryId: newCategoryId || undefined,
          metaTitle: b.metaTitle,
          metaDescription: b.metaDescription,
          canonicalUrl: b.canonicalUrl,
          imageAlt: b.imageAlt,
          imageCaption: b.imageCaption,
          noindex: Boolean(b.noindex),
          language: b.language || 'HINGLISH',
          translationGroupId: b.translationGroupId,
          version: b.version || 1,
          createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
          updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
        },
        update: {},
      });
      blogIdMap.set(b.id, created.id);
    }
    console.log(`Migrated ${blogIdMap.size} blogs.`);

    // 6. Blog Blocks
    console.log('Migrating blog blocks...');
    const blockRes = await client.query('SELECT * FROM blog_block');
    let blockCount = 0;
    for (const blk of blockRes.rows) {
      const newBlogId = blogIdMap.get(blk.blogId);
      if (!newBlogId) continue;
      await prisma.blogBlock.upsert({
        where: {
          blogId_position: {
            blogId: newBlogId,
            position: blk.position,
          },
        },
        create: {
          blogId: newBlogId,
          type: blk.type,
          value: blk.value,
          position: blk.position,
          metadata: blk.metadata || undefined,
          createdAt: blk.createdAt ? new Date(blk.createdAt) : new Date(),
          updatedAt: blk.updatedAt ? new Date(blk.updatedAt) : new Date(),
        },
        update: {},
      });
      blockCount++;
    }
    console.log(`Migrated ${blockCount} blog blocks.`);

    // 7. Blog Categories pivot
    console.log('Migrating blog category relations...');
    const bcRes = await client.query('SELECT * FROM blog_category');
    let bcCount = 0;
    for (const r of bcRes.rows) {
      const newBlogId = blogIdMap.get(r.blogId);
      const newCatId = categoryIdMap.get(r.categoryId);
      if (!newBlogId || !newCatId) continue;
      await prisma.blogCategory.upsert({
        where: {
          blogId_categoryId: {
            blogId: newBlogId,
            categoryId: newCatId,
          },
        },
        create: {
          blogId: newBlogId,
          categoryId: newCatId,
        },
        update: {},
      });
      bcCount++;
    }
    console.log(`Migrated ${bcCount} blog-category relations.`);

    // 8. Blog Tags pivot
    console.log('Migrating blog tag relations...');
    const btRes = await client.query('SELECT * FROM blog_tag');
    let btCount = 0;
    for (const r of btRes.rows) {
      const newBlogId = blogIdMap.get(r.blogId);
      const newTagId = tagIdMap.get(r.tagId);
      if (!newBlogId || !newTagId) continue;
      await prisma.blogTag.upsert({
        where: {
          blogId_tagId: {
            blogId: newBlogId,
            tagId: newTagId,
          },
        },
        create: {
          blogId: newBlogId,
          tagId: newTagId,
        },
        update: {},
      });
      btCount++;
    }
    console.log(`Migrated ${btCount} blog-tag relations.`);

    // 9. URL Redirects
    console.log('Migrating URL redirects...');
    const redRes = await client.query('SELECT * FROM url_redirect');
    for (const r of redRes.rows) {
      await prisma.urlRedirect.upsert({
        where: { sourcePath: r.sourcePath },
        create: {
          sourcePath: r.sourcePath,
          targetPath: r.targetPath,
          statusCode: r.statusCode || 301,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        },
        update: {},
      });
    }
    console.log(`Migrated ${redRes.rows.length} URL redirects.`);

    console.log('\n--- Migration Completed Successfully! ---');
  } catch (err) {
    console.error('Migration failed with error:', err);
  } finally {
    client.release();
    await pool.end();
    await prisma.$disconnect();
  }
}

migrate();
