import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, ilike, isNull, ne, or, sql, lte } from 'drizzle-orm';
import { db } from '../../core/config/db.js';
import {
  blogBlocks,
  blogs,
  categories,
  tags,
  blogTags,
  blogCategories,
  blogRevisions,
  urlRedirects,
  users,
} from '../../core/schema/index.js';
import type {
  CreateBlockInput,
  CreateBlogInput,
  CreateCategoryInput,
  CreateTagInput,
  UpdateBlockInput,
  UpdateBlogInput,
  UpdateCategoryInput,
} from './dto/blog.dto.js';
import { htmlToBlocks, blocksToHtml, syncImageBlocks } from './blog-content.adapter.js';
import { createBlogPublishedNotification } from '../notifications/notification.store.js';
import { GeminiService } from './gemini.service.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    if (this.store.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (now > v.expiresAt) this.store.delete(k);
      }
      if (this.store.size > 1000) {
        let count = 0;
        for (const k of this.store.keys()) {
          this.store.delete(k);
          if (++count >= 200) break;
        }
      }
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}

type CurrentUser = {
  id: string;
  role: 'student' | 'editor' | 'admin';
};

@Injectable()
export class BlogService {
  private cache = new MemoryCache();

  constructor(private readonly gemini: GeminiService = {} as any) {}

  public invalidateCache(): void {
    this.cache.clear();
  }
  // ==========================================
  // Public Blog Endpoints (SEO & SSR)
  // ==========================================

  async listPublished(options?: {
    categorySlug?: string;
    tagSlug?: string;
    search?: string;
    language?: 'HINGLISH' | 'ENGLISH';
    limit?: number;
    offset?: number;
  }) {
    const cacheKey = `list:${JSON.stringify(options || {})}`;
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = options?.offset ?? 0;

    // Deduplicate by translationGroupId showing one entry per article.
    // If an article exists in Hinglish, show Hinglish; if only English, show English.
    const conditions = [
      or(
        eq(blogs.status, 'PUBLISHED'),
        and(eq(blogs.status, 'SCHEDULED'), lte(blogs.scheduledAt, now)),
      ),
    ];

    if (options?.categorySlug) {
      const catSlug = options.categorySlug.toLowerCase().trim();
      conditions.push(
        or(
          eq(categories.slug, catSlug),
          sql`EXISTS (
            SELECT 1 FROM blog_category bc
            JOIN category c ON bc."categoryId" = c.id
            WHERE bc."blogId" = ${blogs.id} AND LOWER(c.slug) = ${catSlug}
          )`,
          sql`EXISTS (
            SELECT 1 FROM blog sibling
            JOIN blog_category bc ON bc."blogId" = sibling.id
            JOIN category c ON bc."categoryId" = c.id
            WHERE sibling."translationGroupId" = ${blogs.translationGroupId}
              AND LOWER(c.slug) = ${catSlug}
          )`,
        ),
      );
    }
    if (options?.search) {
      conditions.push(
        or(
          ilike(blogs.title, `%${options.search}%`),
          ilike(blogs.description, `%${options.search}%`),
        ),
      );
    }

    if (options?.language) {
      conditions.push(eq(blogs.language, options.language));
    } else {
      conditions.push(
        or(
          eq(blogs.language, 'HINGLISH'),
          and(
            eq(blogs.language, 'ENGLISH'),
            or(
              isNull(blogs.translationGroupId),
              sql`NOT EXISTS (
                SELECT 1 FROM blog b2
                WHERE b2."translationGroupId" = ${blogs.translationGroupId}
                  AND b2.language = 'HINGLISH'
                  AND (b2.status = 'PUBLISHED' OR (b2.status = 'SCHEDULED' AND b2."scheduledAt" <= ${now}))
              )`,
            ),
          ),
        ),
      );
    }

    let baseQuery = db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        language: blogs.language,
        translationGroupId: blogs.translationGroupId,
        description: blogs.description,
        coverImage: blogs.coverImage,
        imageAlt: blogs.imageAlt,
        metaTitle: blogs.metaTitle,
        metaDescription: blogs.metaDescription,
        publishedAt: blogs.publishedAt,
        scheduledAt: blogs.scheduledAt,
        updatedAt: blogs.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
        author: {
          id: users.id,
          name: users.name,
        },
      })
      .from(blogs)
      .innerJoin(users, eq(blogs.authorId, users.id))
      .leftJoin(categories, eq(blogs.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(blogs.publishedAt), desc(blogs.createdAt))
      .limit(limit)
      .offset(offset);

    const rows = await baseQuery;
    if (rows.length === 0) return [];

    // Find the first inline image block for each blog or its translation group
    const blogIds = rows.map((r) => r.id);
    const groupIds = rows
      .map((r) => r.translationGroupId)
      .filter((id): id is string => Boolean(id));

    let allRelatedBlogIds = [...blogIds];
    const blogGroupIdMap = new Map<string, string>();
    for (const r of rows) {
      if (r.translationGroupId) {
        blogGroupIdMap.set(r.id, r.translationGroupId);
      }
    }

    if (groupIds.length > 0) {
      const siblingBlogs = await db
        .select({ id: blogs.id, translationGroupId: blogs.translationGroupId })
        .from(blogs)
        .where(inArray(blogs.translationGroupId, groupIds));

      for (const s of siblingBlogs) {
        if (s.translationGroupId) {
          blogGroupIdMap.set(s.id, s.translationGroupId);
        }
      }

      allRelatedBlogIds = [
        ...new Set([...allRelatedBlogIds, ...siblingBlogs.map((s) => s.id)]),
      ];
    }

    // Parallelize image blocks and category queries for all related blogs
    const [imageBlocks, catRows] = await Promise.all([
      allRelatedBlogIds.length > 0
        ? db
            .select({
              blogId: blogBlocks.blogId,
              value: blogBlocks.value,
              position: blogBlocks.position,
            })
            .from(blogBlocks)
            .where(
              and(
                inArray(blogBlocks.blogId, allRelatedBlogIds),
                eq(blogBlocks.type, 'IMAGE'),
              ),
            )
            .orderBy(asc(blogBlocks.position))
        : Promise.resolve([]),
      allRelatedBlogIds.length > 0
        ? db
            .select({
              blogId: blogCategories.blogId,
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            })
            .from(blogCategories)
            .innerJoin(categories, eq(blogCategories.categoryId, categories.id))
            .where(inArray(blogCategories.blogId, allRelatedBlogIds))
        : Promise.resolve([]),
    ]);

    const blogImageMap = new Map<string, string>();
    for (const img of imageBlocks) {
      if (!blogImageMap.has(img.blogId)) {
        blogImageMap.set(img.blogId, img.value);
      }
    }

    const groupImageMap = new Map<string, string>();
    if (groupIds.length > 0) {
      for (const [bId, trGroupId] of blogGroupIdMap.entries()) {
        if (
          trGroupId &&
          blogImageMap.has(bId) &&
          !groupImageMap.has(trGroupId)
        ) {
          groupImageMap.set(trGroupId, blogImageMap.get(bId)!);
        }
      }
    }

    const blogCategoryMap = new Map<string, { id: string; name: string; slug: string }[]>();
    for (const cr of catRows) {
      const list = blogCategoryMap.get(cr.blogId) || [];
      if (!list.some((c) => c.id === cr.id)) {
        list.push({ id: cr.id, name: cr.name, slug: cr.slug });
      }
      blogCategoryMap.set(cr.blogId, list);
    }

    const result = rows.map((row) => {
      const firstInlineImage =
        blogImageMap.get(row.id) ||
        (row.translationGroupId ? groupImageMap.get(row.translationGroupId) : null) ||
        null;

      const firstImage = firstInlineImage || row.coverImage || null;

      const attachedCats =
        blogCategoryMap.get(row.id) ||
        (row.category?.id ? [row.category] : []);
      const primaryCategory = attachedCats[0] || row.category;

      return {
        ...row,
        category: primaryCategory,
        categories: attachedCats,
        firstImage,
        coverImage: row.coverImage || firstInlineImage || null,
      };
    });

    this.cache.set(cacheKey, result, 60_000);
    return result;
  }

  async getPublished(slug: string, language?: 'HINGLISH' | 'ENGLISH') {
    const cacheKey = `published:${slug}:${language || 'default'}`;
    const cached = this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    // Default to HINGLISH when no language specified (primary audience)
    const requestedLang = language || 'HINGLISH';
    const conditions = [
      eq(blogs.slug, slug),
      eq(blogs.language, requestedLang),
      or(
        eq(blogs.status, 'PUBLISHED'),
        and(eq(blogs.status, 'SCHEDULED'), lte(blogs.scheduledAt, now)),
      ),
    ];

    let [blog] = await db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        language: blogs.language,
        translationGroupId: blogs.translationGroupId,
        description: blogs.description,
        coverImage: blogs.coverImage,
        imageAlt: blogs.imageAlt,
        imageCaption: blogs.imageCaption,
        metaTitle: blogs.metaTitle,
        metaDescription: blogs.metaDescription,
        canonicalUrl: blogs.canonicalUrl,
        noindex: blogs.noindex,
        publishedAt: blogs.publishedAt,
        updatedAt: blogs.updatedAt,
        version: blogs.version,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
        author: {
          id: users.id,
          name: users.name,
        },
      })
      .from(blogs)
      .innerJoin(users, eq(blogs.authorId, users.id))
      .leftJoin(categories, eq(blogs.categoryId, categories.id))
      .where(and(...conditions))
      .limit(1);

    // If requested language not found directly by slug, check if a sibling in the translation group matches requested language
    if (!blog) {
      const [anyBlogWithSlug] = await db
        .select({
          id: blogs.id,
          translationGroupId: blogs.translationGroupId,
        })
        .from(blogs)
        .where(
          and(
            eq(blogs.slug, slug),
            or(
              eq(blogs.status, 'PUBLISHED'),
              and(eq(blogs.status, 'SCHEDULED'), lte(blogs.scheduledAt, now)),
            ),
          ),
        )
        .limit(1);

      if (anyBlogWithSlug?.translationGroupId) {
        const [groupMatch] = await db
          .select({
            id: blogs.id,
            title: blogs.title,
            slug: blogs.slug,
            language: blogs.language,
            translationGroupId: blogs.translationGroupId,
            description: blogs.description,
            coverImage: blogs.coverImage,
            imageAlt: blogs.imageAlt,
            imageCaption: blogs.imageCaption,
            metaTitle: blogs.metaTitle,
            metaDescription: blogs.metaDescription,
            canonicalUrl: blogs.canonicalUrl,
            noindex: blogs.noindex,
            publishedAt: blogs.publishedAt,
            updatedAt: blogs.updatedAt,
            version: blogs.version,
            category: {
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            },
            author: {
              id: users.id,
              name: users.name,
            },
          })
          .from(blogs)
          .innerJoin(users, eq(blogs.authorId, users.id))
          .leftJoin(categories, eq(blogs.categoryId, categories.id))
          .where(
            and(
              eq(blogs.translationGroupId, anyBlogWithSlug.translationGroupId),
              eq(blogs.language, requestedLang),
              or(
                eq(blogs.status, 'PUBLISHED'),
                and(eq(blogs.status, 'SCHEDULED'), lte(blogs.scheduledAt, now)),
              ),
            ),
          )
          .limit(1);

        if (groupMatch) blog = groupMatch;
      }
    }

    // If still not found, fallback to whichever language is available for this slug
    if (!blog) {
      const [fallback] = await db
        .select({
          id: blogs.id,
          title: blogs.title,
          slug: blogs.slug,
          language: blogs.language,
          translationGroupId: blogs.translationGroupId,
          description: blogs.description,
          coverImage: blogs.coverImage,
          imageAlt: blogs.imageAlt,
          imageCaption: blogs.imageCaption,
          metaTitle: blogs.metaTitle,
          metaDescription: blogs.metaDescription,
          canonicalUrl: blogs.canonicalUrl,
          noindex: blogs.noindex,
          publishedAt: blogs.publishedAt,
          updatedAt: blogs.updatedAt,
          version: blogs.version,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
          author: {
            id: users.id,
            name: users.name,
          },
        })
        .from(blogs)
        .innerJoin(users, eq(blogs.authorId, users.id))
        .leftJoin(categories, eq(blogs.categoryId, categories.id))
        .where(
          and(
            eq(blogs.slug, slug),
            or(
              eq(blogs.status, 'PUBLISHED'),
              and(eq(blogs.status, 'SCHEDULED'), lte(blogs.scheduledAt, now)),
            ),
          ),
        )
        .limit(1);
      if (fallback) blog = fallback;
    }

    if (!blog) {
      // Check if there is an active 301 redirect for this slug
      const [redirect] = await db
        .select()
        .from(urlRedirects)
        .where(
          or(
            eq(urlRedirects.sourcePath, slug),
            eq(urlRedirects.sourcePath, `/${slug}`),
            eq(urlRedirects.sourcePath, `/blog/${slug}`),
          ),
        )
        .limit(1);

      if (redirect) {
        throw new NotFoundException({
          message: 'Post has moved.',
          redirectUrl: redirect.targetPath,
          statusCode: redirect.statusCode,
        });
      }

      throw new NotFoundException('Blog was not found.');
    }

    // Check if alternate language version exists (both share the same slug)
    let hasAlternateLanguage = false;
    let effectiveBlocks = await this.getBlocks(blog.id);
    let alternateArticle: any = null;

    if (blog.translationGroupId) {
      const [alt] = await db
        .select({
          id: blogs.id,
          title: blogs.title,
          slug: blogs.slug,
          language: blogs.language,
          description: blogs.description,
          coverImage: blogs.coverImage,
          imageAlt: blogs.imageAlt,
          imageCaption: blogs.imageCaption,
          metaTitle: blogs.metaTitle,
          metaDescription: blogs.metaDescription,
          publishedAt: blogs.publishedAt,
          updatedAt: blogs.updatedAt,
        })
        .from(blogs)
        .where(
          and(
            eq(blogs.translationGroupId, blog.translationGroupId),
            ne(blogs.id, blog.id),
            or(
              eq(blogs.status, 'PUBLISHED'),
              and(eq(blogs.status, 'SCHEDULED'), lte(blogs.scheduledAt, now)),
            ),
          ),
        )
        .limit(1);
      hasAlternateLanguage = !!alt;

      if (alt) {
        // Sync any images from alternate language version into this language version
        const altBlocks = await this.getBlocks(alt.id);
        effectiveBlocks = syncImageBlocks(effectiveBlocks as any, altBlocks as any) as any;
        alternateArticle = {
          id: alt.id,
          title: alt.title,
          slug: alt.slug,
          language: alt.language,
          description: alt.description,
          coverImage: alt.coverImage,
          imageAlt: alt.imageAlt,
          imageCaption: alt.imageCaption,
          metaTitle: alt.metaTitle,
          metaDescription: alt.metaDescription,
          publishedAt: alt.publishedAt,
          updatedAt: alt.updatedAt,
          htmlContent: blocksToHtml(altBlocks as any),
        };
      }
    }

    const postTagsList = await this.getBlogTags(blog.id);
    const postCategories = await this.getBlogCategories(blog.id);
    const primaryCategory = postCategories[0] || blog.category;
    const html = blocksToHtml(effectiveBlocks as any);

    const result = {
      ...blog,
      category: primaryCategory,
      categories: postCategories,
      blocks: effectiveBlocks,
      tags: postTagsList,
      htmlContent: html,
      hasAlternateLanguage,
      alternateArticle,
    };

    this.cache.set(cacheKey, result, 120_000);
    return result;
  }

  // Check redirect path directly
  async checkRedirect(path: string) {
    const [redirect] = await db
      .select()
      .from(urlRedirects)
      .where(eq(urlRedirects.sourcePath, path))
      .limit(1);
    return redirect ?? null;
  }

  // Sitemap generator list
  async getSitemapEntries() {
    const now = new Date();
    return db
      .select({
        slug: blogs.slug,
        language: blogs.language,
        categorySlug: categories.slug,
        updatedAt: blogs.updatedAt,
        publishedAt: blogs.publishedAt,
        noindex: blogs.noindex,
      })
      .from(blogs)
      .leftJoin(categories, eq(blogs.categoryId, categories.id))
      .where(
        and(
          eq(blogs.noindex, false),
          or(
            eq(blogs.status, 'PUBLISHED'),
            and(eq(blogs.status, 'SCHEDULED'), lte(blogs.scheduledAt, now)),
          ),
        ),
      )
      .orderBy(desc(blogs.updatedAt));
  }

  // ==========================================
  // Admin & Editorial Management Endpoints
  // ==========================================

  async listManageable(
    currentUser: CurrentUser,
    filters?: {
      search?: string;
      status?: string;
      categoryId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    this.assertCanWrite(currentUser);

    const limit = Math.min(filters?.limit ?? 50, 200);
    const offset = filters?.offset ?? 0;

    const conditions = [];

    if (currentUser.role !== 'admin') {
      conditions.push(eq(blogs.authorId, currentUser.id));
    }

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(eq(blogs.status, filters.status as any));
    }

    if (filters?.categoryId && filters.categoryId !== 'ALL') {
      conditions.push(
        or(
          eq(blogs.categoryId, filters.categoryId),
          sql`EXISTS (
            SELECT 1 FROM blog_category bc
            WHERE bc."blogId" = ${blogs.id} AND bc."categoryId" = ${filters.categoryId}::uuid
          )`,
        ),
      );
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(blogs.title, `%${filters.search}%`),
          ilike(blogs.slug, `%${filters.search}%`),
          ilike(blogs.description, `%${filters.search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        description: blogs.description,
        coverImage: blogs.coverImage,
        imageAlt: blogs.imageAlt,
        status: blogs.status,
        language: blogs.language,
        translationGroupId: blogs.translationGroupId,
        publishedAt: blogs.publishedAt,
        scheduledAt: blogs.scheduledAt,
        version: blogs.version,
        metaTitle: blogs.metaTitle,
        metaDescription: blogs.metaDescription,
        canonicalUrl: blogs.canonicalUrl,
        noindex: blogs.noindex,
        createdAt: blogs.createdAt,
        updatedAt: blogs.updatedAt,
        categoryId: blogs.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(blogs)
      .innerJoin(users, eq(blogs.authorId, users.id))
      .leftJoin(categories, eq(blogs.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(blogs.updatedAt))
      .limit(limit)
      .offset(offset);

    const allBlogIds = rows.map((r) => r.id);
    const catRows =
      allBlogIds.length > 0
        ? await db
            .select({
              blogId: blogCategories.blogId,
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            })
            .from(blogCategories)
            .innerJoin(categories, eq(blogCategories.categoryId, categories.id))
            .where(inArray(blogCategories.blogId, allBlogIds))
        : [];

    const blogCategoryMap = new Map<string, { id: string; name: string; slug: string }[]>();
    for (const cr of catRows) {
      const list = blogCategoryMap.get(cr.blogId) || [];
      if (!list.some((c) => c.id === cr.id)) {
        list.push({ id: cr.id, name: cr.name, slug: cr.slug });
      }
      blogCategoryMap.set(cr.blogId, list);
    }

    // Group articles by translation group so bilingual versions are treated as 1 single article
    const groupedMap = new Map<string, any>();
    for (const row of rows) {
      const groupKey = row.translationGroupId || row.slug || row.id;
      const attachedCats =
        blogCategoryMap.get(row.id) ||
        (row.category?.id ? [row.category] : []);
      const primaryCategory = attachedCats[0] || row.category;
      const primaryCategoryId = primaryCategory?.id || row.categoryId || null;

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          ...row,
          categoryId: primaryCategoryId,
          category: primaryCategory,
          categories: attachedCats,
          languages: [
            {
              language: row.language,
              id: row.id,
              title: row.title,
            },
          ],
          hinglishId: row.language === 'HINGLISH' ? row.id : null,
          englishId: row.language === 'ENGLISH' ? row.id : null,
        });
      } else {
        const existing = groupedMap.get(groupKey);
        existing.languages.push({
          language: row.language,
          id: row.id,
          title: row.title,
        });
        if (row.language === 'HINGLISH') {
          existing.hinglishId = row.id;
          // Prefer Hinglish title as primary default
          existing.title = row.title;
          existing.id = row.id;
          existing.categoryId = primaryCategoryId || existing.categoryId;
          existing.category = primaryCategory || existing.category;
          if (attachedCats.length > 0) existing.categories = attachedCats;
        }
        if (row.language === 'ENGLISH') {
          existing.englishId = row.id;
        }
        if (new Date(row.updatedAt) > new Date(existing.updatedAt)) {
          existing.updatedAt = row.updatedAt;
        }
      }
    }

    return Array.from(groupedMap.values());
  }

  async getManageable(id: string, currentUser: CurrentUser) {
    const blog = await this.findManageable(id, currentUser);
    let blocks = await this.getBlocks(blog.id);
    const postTagsList = await this.getBlogTags(blog.id);

    let linkedBlog: any = null;
    if (blog.translationGroupId) {
      const [alt] = await db
        .select()
        .from(blogs)
        .where(
          and(
            eq(blogs.translationGroupId, blog.translationGroupId),
            ne(blogs.id, blog.id),
          ),
        )
        .limit(1);
      if (alt) {
        let altBlocks = await this.getBlocks(alt.id);
        // Bidirectional image sync so opening either blog in editor has all images synchronized
        const syncedBlocks = syncImageBlocks(blocks as any, altBlocks as any);
        const syncedAltBlocks = syncImageBlocks(altBlocks as any, blocks as any);
        blocks = syncedBlocks as any;
        altBlocks = syncedAltBlocks as any;

        linkedBlog = {
          ...alt,
          blocks: altBlocks,
          htmlContent: blocksToHtml(altBlocks as any),
        };
      }
    }

    const html = blocksToHtml(blocks as any);
    const postCategories = await this.getBlogCategories(blog.id);

    return {
      ...blog,
      category: postCategories[0] || blog.categoryId ? { id: blog.categoryId } : null,
      categories: postCategories,
      blocks,
      tags: postTagsList,
      htmlContent: html,
      linkedBlog,
    };
  }

  async create(input: CreateBlogInput, currentUser: CurrentUser) {
    this.assertCanWrite(currentUser);
    const authorId = await this.resolveAuthorId(input.authorId, currentUser);

    // If an existing draft with this slug + language already exists for this author, update it instead of duplicating
    const language = input.language ?? 'HINGLISH';
    const [existingDraft] = await db
      .select({ id: blogs.id, status: blogs.status })
      .from(blogs)
      .where(and(eq(blogs.slug, input.slug), eq(blogs.language, language), eq(blogs.authorId, authorId)))
      .limit(1);

    if (existingDraft && existingDraft.status === 'DRAFT') {
      return this.update(existingDraft.id, input, currentUser);
    }

    // Validate slug uniqueness proactively (per-language)
    await this.assertSlugAvailable(input.slug, undefined, language);

    try {
      const created = await db.transaction(async (tx) => {
        const now = new Date();
        const status = input.status ?? 'DRAFT';
        const publishedAt = status === 'PUBLISHED' ? now : null;
        const scheduledAt =
          status === 'SCHEDULED' && input.scheduledAt
            ? new Date(input.scheduledAt)
            : null;

        const initialCategoryIds =
          input.categoryIds && input.categoryIds.length > 0
            ? input.categoryIds
            : input.categoryId
              ? [input.categoryId]
              : [];
        const primaryCategoryId = initialCategoryIds[0] || null;

        const [blog] = await tx
          .insert(blogs)
          .values({
            title: input.title,
            slug: input.slug,
            description: input.description,
            coverImage: input.coverImage,
            imageAlt: input.imageAlt,
            imageCaption: input.imageCaption,
            categoryId: primaryCategoryId,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            canonicalUrl: input.canonicalUrl || null,
            noindex: input.noindex ?? false,
            language: input.language ?? 'HINGLISH',
            translationGroupId: input.translationGroupId || null,
            status,
            publishedAt,
            scheduledAt,
            version: 1,
            authorId,
          })
          .returning();

        if (!blog) throw new Error('Blog creation did not return a row.');

        // Content: either parsed from htmlContent or direct blocks
        let blocksToInsert: CreateBlockInput[] = input.blocks ?? [];
        if (blocksToInsert.length === 0 && input.htmlContent) {
          blocksToInsert = htmlToBlocks(input.htmlContent) as any;
        }

        const blocks = await this.insertBlocks(tx, blog.id, blocksToInsert);

        // Tags
        if (input.tagIds && input.tagIds.length > 0) {
          await this.syncTags(tx, blog.id, input.tagIds);
        }

        // Categories (multi-category support)
        if (initialCategoryIds.length > 0) {
          await this.syncCategories(tx, blog.id, initialCategoryIds);
        }

        // Create initial revision
        await tx.insert(blogRevisions).values({
          blogId: blog.id,
          authorId: currentUser.id,
          title: blog.title,
          description: blog.description,
          version: 1,
          snapshot: { blog, blocks },
        });

        return { ...blog, blocks, htmlContent: blocksToHtml(blocks as any) };
      });
      await this.announceIfNewlyPublished(created, false);
      this.invalidateCache();
      return created;
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  async update(id: string, input: UpdateBlogInput, currentUser: CurrentUser) {
    const existing = await this.findManageable(id, currentUser);

    // Optimistic Concurrency check
    if (
      input.currentVersion !== undefined &&
      input.currentVersion !== existing.version
    ) {
      throw new ConflictException({
        message:
          'This article was modified by another editor while you were editing. Please refresh and review changes.',
        serverVersion: existing.version,
      });
    }

    // Slug collision & 301 redirect management
    if (input.slug && input.slug !== existing.slug) {
      await this.assertSlugAvailable(input.slug, existing.id, existing.language);
    }

    const authorId =
      input.authorId !== undefined
        ? await this.resolveAuthorId(input.authorId, currentUser)
        : existing.authorId;

    try {
      const updated = await db.transaction(async (tx) => {
        const nextVersion = existing.version + 1;
        const status = input.status ?? existing.status;
        let publishedAt = existing.publishedAt;

        if (status === 'PUBLISHED' && !existing.publishedAt) {
          publishedAt = new Date();
        } else if (status === 'DRAFT') {
          publishedAt = null;
        }

        const scheduledAt =
          status === 'SCHEDULED' && input.scheduledAt
            ? new Date(input.scheduledAt)
            : existing.scheduledAt;

        // If published URL changed, record automatic 301 redirect (no /blog/ prefix)
        if (
          input.slug &&
          input.slug !== existing.slug &&
          existing.status === 'PUBLISHED'
        ) {
          await tx
            .insert(urlRedirects)
            .values({
              sourcePath: `/${existing.slug}`,
              targetPath: `/${input.slug}`,
              statusCode: 301,
            })
            .onConflictDoUpdate({
              target: urlRedirects.sourcePath,
              set: { targetPath: `/${input.slug}`, createdAt: new Date() },
            });
          // Also redirect old /blog/ paths for backwards compatibility
          await tx
            .insert(urlRedirects)
            .values({
              sourcePath: `/blog/${existing.slug}`,
              targetPath: `/${input.slug}`,
              statusCode: 301,
            })
            .onConflictDoUpdate({
              target: urlRedirects.sourcePath,
              set: { targetPath: `/${input.slug}`, createdAt: new Date() },
            });
        }

        const updatedCategoryIds =
          input.categoryIds !== undefined
            ? input.categoryIds
            : input.categoryId !== undefined
              ? (input.categoryId ? [input.categoryId] : [])
              : undefined;

        const updatedPrimaryCategoryId =
          updatedCategoryIds !== undefined
            ? (updatedCategoryIds[0] || null)
            : existing.categoryId;

        const [blog] = await tx
          .update(blogs)
          .set({
            title: input.title ?? existing.title,
            slug: input.slug ?? existing.slug,
            description: input.description ?? existing.description,
            coverImage: input.coverImage ?? existing.coverImage,
            imageAlt: input.imageAlt ?? existing.imageAlt,
            imageCaption: input.imageCaption ?? existing.imageCaption,
            categoryId: updatedPrimaryCategoryId,
            metaTitle: input.metaTitle ?? existing.metaTitle,
            metaDescription: input.metaDescription ?? existing.metaDescription,
            canonicalUrl:
              input.canonicalUrl !== undefined
                ? input.canonicalUrl
                : existing.canonicalUrl,
            noindex: input.noindex ?? existing.noindex,
            language: input.language ?? existing.language,
            translationGroupId:
              input.translationGroupId !== undefined
                ? input.translationGroupId
                : existing.translationGroupId,
            status,
            publishedAt,
            scheduledAt,
            version: nextVersion,
            authorId,
            updatedAt: new Date(),
          })
          .where(eq(blogs.id, existing.id))
          .returning();

        if (!blog) throw new NotFoundException('Blog was not found.');

        // Update blocks if provided either as htmlContent or blocks array
        let blocksToPersist: CreateBlockInput[] | null = null;
        if (input.blocks && input.blocks.length > 0) {
          blocksToPersist = input.blocks;
        } else if (input.htmlContent !== undefined) {
          blocksToPersist = htmlToBlocks(input.htmlContent) as any;
        }

        let blocks = await tx
          .select()
          .from(blogBlocks)
          .where(eq(blogBlocks.blogId, blog.id))
          .orderBy(asc(blogBlocks.position));

        if (blocksToPersist !== null) {
          // Replace all blocks with newly adapted blocks
          await tx.delete(blogBlocks).where(eq(blogBlocks.blogId, blog.id));
          blocks = await this.insertBlocks(tx, blog.id, blocksToPersist);
        }

        // Sync tags if provided
        if (input.tagIds) {
          await this.syncTags(tx, blog.id, input.tagIds);
        }

        // Sync categories if provided
        if (updatedCategoryIds !== undefined) {
          await this.syncCategories(tx, blog.id, updatedCategoryIds);
        }

        // Sync shared fields to sibling language version (coverImage, imageAlt, imageCaption, categoryId, tags)
        if (blog.translationGroupId) {
          const [sibling] = await tx
            .select({ id: blogs.id })
            .from(blogs)
            .where(
              and(
                eq(blogs.translationGroupId, blog.translationGroupId),
                ne(blogs.id, blog.id),
              ),
            )
            .limit(1);

          const sharedFieldsToSync: Record<string, any> = {};
          if (input.status !== undefined) {
            sharedFieldsToSync.status = status;
            sharedFieldsToSync.publishedAt = publishedAt;
            sharedFieldsToSync.scheduledAt = scheduledAt;
          }
          if (input.coverImage !== undefined) sharedFieldsToSync.coverImage = blog.coverImage;
          if (input.imageAlt !== undefined) sharedFieldsToSync.imageAlt = blog.imageAlt;
          if (input.imageCaption !== undefined) sharedFieldsToSync.imageCaption = blog.imageCaption;
          if (updatedPrimaryCategoryId !== undefined) sharedFieldsToSync.categoryId = updatedPrimaryCategoryId;
          if (input.noindex !== undefined) sharedFieldsToSync.noindex = blog.noindex;

          if (Object.keys(sharedFieldsToSync).length > 0) {
            sharedFieldsToSync.updatedAt = new Date();
            await tx
              .update(blogs)
              .set(sharedFieldsToSync)
              .where(
                and(
                  eq(blogs.translationGroupId, blog.translationGroupId),
                  ne(blogs.id, blog.id),
                ),
              );
          }

          // Sync tags to sibling
          if (input.tagIds && sibling) {
            await this.syncTags(tx, sibling.id, input.tagIds);
          }

          // Sync categories to sibling
          if (updatedCategoryIds !== undefined && sibling) {
            await this.syncCategories(tx, sibling.id, updatedCategoryIds);
          }

          // Sync inline image blocks to sibling language version
          if (sibling && blocksToPersist !== null) {
            const siblingBlocks = await tx
              .select()
              .from(blogBlocks)
              .where(eq(blogBlocks.blogId, sibling.id))
              .orderBy(asc(blogBlocks.position));

            const syncedSiblingBlocks = syncImageBlocks(siblingBlocks as any, blocks as any);
            if (syncedSiblingBlocks.length !== siblingBlocks.length) {
              await tx.delete(blogBlocks).where(eq(blogBlocks.blogId, sibling.id));
              await this.insertBlocks(tx, sibling.id, syncedSiblingBlocks as any);
              await tx
                .update(blogs)
                .set({ updatedAt: new Date() })
                .where(eq(blogs.id, sibling.id));
            }
          }
        }

        // Record revision snapshot
        await tx.insert(blogRevisions).values({
          blogId: blog.id,
          authorId: currentUser.id,
          title: blog.title,
          description: blog.description,
          version: nextVersion,
          snapshot: { blog, blocks },
        });

        return {
          ...blog,
          blocks,
          htmlContent: blocksToHtml(blocks as any),
        };
      });
      await this.announceIfNewlyPublished(updated, existing.status === 'PUBLISHED');
      this.invalidateCache();
      return updated;
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  // Duplicate an existing article as a draft
  async duplicate(id: string, currentUser: CurrentUser) {
    const source = await this.findManageable(id, currentUser);
    const sourceBlocks = await this.getBlocks(source.id);
    const sourceTags = await this.getBlogTags(source.id);

    const baseSlug = `${source.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    while (!(await this.isSlugAvailable(slug))) {
      slug = `${baseSlug}-${counter++}`;
    }

    return db.transaction(async (tx) => {
      const [newBlog] = await tx
        .insert(blogs)
        .values({
          title: `${source.title} (Copy)`,
          slug,
          description: source.description,
          coverImage: source.coverImage,
          imageAlt: source.imageAlt,
          imageCaption: source.imageCaption,
          categoryId: source.categoryId,
          metaTitle: source.metaTitle,
          metaDescription: source.metaDescription,
          canonicalUrl: null,
          noindex: true,
          status: 'DRAFT',
          publishedAt: null,
          authorId: currentUser.id,
          version: 1,
        })
        .returning();

      if (!newBlog) throw new Error('Duplication failed');

      const blocks = await this.insertBlocks(
        tx,
        newBlog.id,
        sourceBlocks.map((b) => ({
          type: b.type,
          value: b.value,
          metadata: b.metadata as any,
        })),
      );

      if (sourceTags.length > 0) {
        await this.syncTags(
          tx,
          newBlog.id,
          sourceTags.map((t) => t.id),
        );
      }

      return {
        ...newBlog,
        blocks,
        htmlContent: blocksToHtml(blocks as any),
      };
    });
  }

  async remove(id: string, currentUser: CurrentUser) {
    const existing = await this.findManageable(id, currentUser);
    await db.transaction(async (tx) => {
      const idsToDelete = [existing.id];
      if (existing.translationGroupId) {
        const siblings = await tx
          .select({ id: blogs.id })
          .from(blogs)
          .where(eq(blogs.translationGroupId, existing.translationGroupId));
        for (const s of siblings) {
          if (!idsToDelete.includes(s.id)) idsToDelete.push(s.id);
        }
      }

      for (const blogId of idsToDelete) {
        await tx.delete(blogBlocks).where(eq(blogBlocks.blogId, blogId));
        await tx.delete(blogTags).where(eq(blogTags.blogId, blogId));
        await tx.delete(blogRevisions).where(eq(blogRevisions.blogId, blogId));
        await tx.delete(blogs).where(eq(blogs.id, blogId));
      }
    });
    this.invalidateCache();
  }

  // Revision history list
  async listRevisions(blogId: string, currentUser: CurrentUser) {
    await this.findManageable(blogId, currentUser);
    return db
      .select({
        id: blogRevisions.id,
        version: blogRevisions.version,
        title: blogRevisions.title,
        createdAt: blogRevisions.createdAt,
        author: {
          id: users.id,
          name: users.name,
        },
      })
      .from(blogRevisions)
      .innerJoin(users, eq(blogRevisions.authorId, users.id))
      .where(eq(blogRevisions.blogId, blogId))
      .orderBy(desc(blogRevisions.version));
  }

  // Restore a revision
  async restoreRevision(
    blogId: string,
    revisionId: string,
    currentUser: CurrentUser,
  ) {
    const blog = await this.findManageable(blogId, currentUser);
    const [rev] = await db
      .select()
      .from(blogRevisions)
      .where(
        and(
          eq(blogRevisions.id, revisionId),
          eq(blogRevisions.blogId, blog.id),
        ),
      )
      .limit(1);

    if (!rev) throw new NotFoundException('Revision not found.');

    const snapshot = rev.snapshot as any;
    const blocksToRestore = snapshot?.blocks || [];

    return this.update(
      blog.id,
      {
        title: rev.title,
        description: rev.description,
        blocks: blocksToRestore,
      },
      currentUser,
    );
  }

  // ==========================================
  // Categories & Tags CRUD
  // ==========================================

  async listCategories() {
    const cacheKey = 'categories:all';
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const res = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        postCount: sql<number>`count(${blogs.id})::int`,
      })
      .from(categories)
      .leftJoin(blogs, eq(blogs.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));

    this.cache.set(cacheKey, res, 300_000);
    return res;
  }

  async createCategory(
    input: CreateCategoryInput,
    currentUser: CurrentUser,
  ) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, input.slug))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`A category with slug "${input.slug}" already exists. Please choose a different name or slug.`);
    }

    try {
      const [cat] = await db
        .insert(categories)
        .values(input)
        .returning();
      this.invalidateCache();
      return cat;
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(`A category with this name or slug already exists.`);
      }
      throw err;
    }
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
    currentUser: CurrentUser,
  ) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    if (input.slug) {
      const existing = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, input.slug))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        throw new ConflictException(`A category with slug "${input.slug}" already exists.`);
      }
    }

    try {
      const [cat] = await db
        .update(categories)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning();
      if (!cat) throw new NotFoundException('Category not found');
      this.invalidateCache();
      return cat;
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException(`A category with this name or slug already exists.`);
      }
      throw err;
    }
  }

  async deleteCategory(id: string, currentUser: CurrentUser) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    await db.delete(categories).where(eq(categories.id, id));
  }

  async listTags() {
    const cacheKey = 'tags:all';
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const res = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        postCount: sql<number>`count(${blogTags.blogId})::int`,
      })
      .from(tags)
      .leftJoin(blogTags, eq(blogTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(asc(tags.name));

    this.cache.set(cacheKey, res, 300_000);
    return res;
  }

  async createTag(input: CreateTagInput, currentUser: CurrentUser) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    const [t] = await db.insert(tags).values(input).returning();
    return t;
  }

  async deleteTag(id: string, currentUser: CurrentUser) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    await db.delete(tags).where(eq(tags.id, id));
  }

  // Block management
  async createBlock(
    blogId: string,
    input: CreateBlockInput,
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);

    return db.transaction(async (tx) => {
      const [lastBlock] = await tx
        .select({ position: blogBlocks.position })
        .from(blogBlocks)
        .where(eq(blogBlocks.blogId, blogId))
        .orderBy(desc(blogBlocks.position))
        .limit(1);

      const [block] = await tx
        .insert(blogBlocks)
        .values({
          blogId,
          ...input,
          position: (lastBlock?.position ?? -1) + 1,
        })
        .returning();

      return block;
    });
  }

  async updateBlock(
    blogId: string,
    blockId: string,
    input: UpdateBlockInput,
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);

    const [block] = await db
      .update(blogBlocks)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(blogBlocks.id, blockId), eq(blogBlocks.blogId, blogId)))
      .returning();

    if (!block) throw new NotFoundException('Block was not found.');
    return block;
  }

  async removeBlock(
    blogId: string,
    blockId: string,
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);

    const deleted = await db
      .delete(blogBlocks)
      .where(and(eq(blogBlocks.id, blockId), eq(blogBlocks.blogId, blogId)))
      .returning({ id: blogBlocks.id });

    if (!deleted.length) throw new NotFoundException('Block was not found.');
  }

  async reorderBlocks(
    blogId: string,
    blockIds: string[],
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);

    return db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: blogBlocks.id })
        .from(blogBlocks)
        .where(eq(blogBlocks.blogId, blogId));

      const existingIds = new Set(existing.map((block) => block.id));
      if (
        existingIds.size !== blockIds.length ||
        blockIds.some((id) => !existingIds.has(id))
      ) {
        throw new ConflictException('Stale blocks list. Please refresh.');
      }

      for (const [index, blockId] of blockIds.entries()) {
        await tx
          .update(blogBlocks)
          .set({ position: -(index + 1) })
          .where(
            and(eq(blogBlocks.id, blockId), eq(blogBlocks.blogId, blogId)),
          );
      }

      for (const [position, blockId] of blockIds.entries()) {
        await tx
          .update(blogBlocks)
          .set({ position, updatedAt: new Date() })
          .where(
            and(eq(blogBlocks.id, blockId), eq(blogBlocks.blogId, blogId)),
          );
      }

      return tx
        .select()
        .from(blogBlocks)
        .where(eq(blogBlocks.blogId, blogId))
        .orderBy(asc(blogBlocks.position));
    });
  }

  // ==========================================
  // Private Helper Utilities
  // ==========================================

  private async resolveAuthorId(
    requested: string | null | undefined,
    currentUser: CurrentUser,
  ) {
    if (!requested || requested === currentUser.id) return currentUser.id;
    const [author] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, requested))
      .limit(1);
    if (!author || (author.role !== 'admin' && author.role !== 'editor')) {
      return currentUser.id;
    }
    return author.id;
  }

  private async findManageable(id: string, currentUser: CurrentUser) {
    this.assertCanWrite(currentUser);

    const [blog] = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id))
      .limit(1);

    if (!blog) throw new NotFoundException('Blog was not found.');
    if (currentUser.role !== 'admin' && blog.authorId !== currentUser.id) {
      throw new ForbiddenException('You cannot manage this blog.');
    }

    return blog;
  }

  private async getBlocks(blogId: string) {
    return db
      .select()
      .from(blogBlocks)
      .where(eq(blogBlocks.blogId, blogId))
      .orderBy(asc(blogBlocks.position));
  }

  private async getBlogTags(blogId: string) {
    return db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(blogTags)
      .innerJoin(tags, eq(blogTags.tagId, tags.id))
      .where(eq(blogTags.blogId, blogId));
  }

  private async getBlogCategories(blogId: string) {
    return db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
      })
      .from(blogCategories)
      .innerJoin(categories, eq(blogCategories.categoryId, categories.id))
      .where(eq(blogCategories.blogId, blogId));
  }

  private async syncTags(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    blogId: string,
    tagIds: string[],
  ) {
    await tx.delete(blogTags).where(eq(blogTags.blogId, blogId));
    if (tagIds.length > 0) {
      await tx.insert(blogTags).values(
        tagIds.map((tagId) => ({
          blogId,
          tagId,
        })),
      );
    }
  }

  private async syncCategories(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    blogId: string,
    categoryIds: string[],
  ) {
    await tx.delete(blogCategories).where(eq(blogCategories.blogId, blogId));
    if (categoryIds.length > 0) {
      await tx.insert(blogCategories).values(
        categoryIds.map((categoryId) => ({
          blogId,
          categoryId,
        })),
      );
    }
  }

  private async insertBlocks(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    blogId: string,
    blocks: CreateBlockInput[],
  ) {
    if (blocks.length === 0) return [];

    return tx
      .insert(blogBlocks)
      .values(
        blocks.map((block, position) => ({
          blogId,
          type: block.type,
          value: block.value,
          position,
          metadata: block.metadata,
        })),
      )
      .returning();
  }

  private async announceIfNewlyPublished(
    blog: {
      id: string;
      title: string;
      slug: string;
      categoryId: string | null;
      status: string;
    },
    previouslyPublished: boolean,
  ) {
    if (blog.status !== 'PUBLISHED' || previouslyPublished) return;
    try {
      let categorySlug = 'general';
      if (blog.categoryId) {
        const [category] = await db
          .select({ slug: categories.slug })
          .from(categories)
          .where(eq(categories.id, blog.categoryId))
          .limit(1);
        if (category?.slug) categorySlug = category.slug;
      }
      await createBlogPublishedNotification({
        blogId: blog.id,
        title: blog.title,
        href: `/${blog.slug}`,
      });
    } catch (error) {
      console.error('Failed to create blog notification', error);
    }
  }

  private async isSlugAvailable(slug: string, excludeId?: string, language?: string) {
    const conditions = [eq(blogs.slug, slug)];
    if (excludeId) {
      conditions.push(sql`${blogs.id} != ${excludeId}`);
    }
    // With unified slugs, allow the same slug for different languages within the same translationGroup.
    // Only block if a different article (different translationGroup) uses the same slug.
    if (language) {
      conditions.push(eq(blogs.language, language as any));
    }
    const [existing] = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(and(...conditions))
      .limit(1);
    return !existing;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string, language?: string) {
    const available = await this.isSlugAvailable(slug, excludeId, language);
    if (!available) {
      throw new ConflictException('This URL slug is already taken.');
    }
  }

  async translateBlog(
    id: string,
    targetLanguage: 'HINGLISH' | 'ENGLISH',
    currentUser: CurrentUser,
  ) {
    this.assertCanWrite(currentUser);
    const source = await this.getManageable(id, currentUser);

    // Ensure source has a translationGroupId
    let translationGroupId = source.translationGroupId;
    if (!translationGroupId) {
      translationGroupId = crypto.randomUUID();
      await db
        .update(blogs)
        .set({ translationGroupId })
        .where(eq(blogs.id, source.id));
    }

    // Check if translation already exists for targetLanguage in this group
    const [existingTranslation] = await db
      .select({ id: blogs.id, slug: blogs.slug })
      .from(blogs)
      .where(
        and(
          eq(blogs.translationGroupId, translationGroupId),
          eq(blogs.language, targetLanguage),
        ),
      )
      .limit(1);

    if (existingTranslation) {
      throw new BadRequestException(
        `A ${targetLanguage} translation already exists for this article (Slug: ${existingTranslation.slug}).`,
      );
    }

    const sourceBlocks = (source.blocks || []).map((b: any) => ({
      type: b.type,
      value: b.value,
      metadata: b.metadata,
    }));

    const translated = await this.gemini.translateArticle({
      title: source.title,
      description: source.description,
      targetLanguage,
      blocks: sourceBlocks,
      htmlContent: source.htmlContent,
      metaTitle: source.metaTitle,
      metaDescription: source.metaDescription,
      imageAlt: source.imageAlt,
    });

    // Use the SAME slug as the source article — both language versions share one URL
    const sharedSlug = source.slug;

    // Create new translation draft with the same slug
    const tagIds = (source.tags || []).map((t: any) => t.id);
    const created = await this.create(
      {
        title: translated.title,
        slug: sharedSlug,
        description: translated.description,
        coverImage: source.coverImage,
        imageAlt: translated.imageAlt,
        imageCaption: source.imageCaption,
        categoryId: source.categoryId || null,
        metaTitle: translated.metaTitle,
        metaDescription: translated.metaDescription,
        canonicalUrl: source.canonicalUrl,
        noindex: source.noindex,
        language: targetLanguage,
        translationGroupId,
        status: 'DRAFT',
        tagIds,
        blocks: translated.blocks as any,
      },
      currentUser,
    );

    return created;
  }

  async getSeoSuggestions(
    input: {
      blogId?: string;
      title?: string;
      description?: string;
      content?: string;
      language?: 'HINGLISH' | 'ENGLISH';
    },
    currentUser: CurrentUser,
  ) {
    this.assertCanWrite(currentUser);

    let title = input.title || '';
    let description = input.description || '';
    let content = input.content || '';
    let language = input.language || 'HINGLISH';

    if (input.blogId) {
      const post = await this.getManageable(input.blogId, currentUser);
      title = title || post.title;
      description = description || post.description || '';
      language = (post.language as any) || language;
      if (!content) {
        content =
          post.htmlContent ||
          (post.blocks || []).map((b: any) => b.value).join('\n\n');
      }
    }

    if (!title && !content) {
      throw new BadRequestException(
        'Title or content is required for SEO optimization analysis.',
      );
    }

    return this.gemini.optimizeSeo({
      title,
      description,
      content,
      language,
    });
  }

  async translateMarkdownContent(
    input: {
      title: string;
      markdown: string;
      sourceLanguage?: 'AUTO' | 'HINGLISH' | 'ENGLISH';
      targetLanguage?: 'HINGLISH' | 'ENGLISH';
    },
    currentUser: CurrentUser,
  ) {
    this.assertCanWrite(currentUser);
    if (!input.title && !input.markdown) {
      throw new BadRequestException('Title or markdown content is required.');
    }
    return this.gemini.translateMarkdownContent(input);
  }

  async saveBilingual(
    input: {
      translationGroupId?: string;
      categoryId?: string | null;
      coverImage?: string | null;
      imageAlt?: string | null;
      tagIds?: string[];
      status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
      hinglish: {
        id?: string;
        title: string;
        slug: string;
        markdown?: string;
        htmlContent?: string;
        metaTitle?: string;
        metaDescription?: string;
        excerpt?: string;
      };
      english: {
        id?: string;
        title: string;
        slug: string;
        markdown?: string;
        htmlContent?: string;
        metaTitle?: string;
        metaDescription?: string;
        excerpt?: string;
      };
    },
    currentUser: CurrentUser,
  ) {
    this.assertCanWrite(currentUser);
    const translationGroupId = input.translationGroupId || crypto.randomUUID();
    const status = input.status || 'DRAFT';

    // Both language versions share the same slug (use the English slug as canonical)
    const sharedSlug = input.english.slug || input.hinglish.slug;
    input.hinglish.slug = sharedSlug;
    input.english.slug = sharedSlug;

    let hinglishHtml = input.hinglish.htmlContent || input.hinglish.markdown || '';
    if (hinglishHtml === '[object Promise]') hinglishHtml = input.hinglish.markdown || '';
    let englishHtml = input.english.htmlContent || input.english.markdown || '';
    if (englishHtml === '[object Promise]') englishHtml = input.english.markdown || '';

    // Bidirectional inline image synchronization between Hinglish and English versions
    let hBlocks = htmlToBlocks(hinglishHtml);
    let eBlocks = htmlToBlocks(englishHtml);
    hBlocks = syncImageBlocks(hBlocks, eBlocks);
    eBlocks = syncImageBlocks(eBlocks, hBlocks);
    hinglishHtml = blocksToHtml(hBlocks);
    englishHtml = blocksToHtml(eBlocks);

    // 0. Auto-resolve existing draft IDs to guarantee update instead of duplicate draft copies
    if (translationGroupId) {
      const existingInGroup = await db
        .select({ id: blogs.id, language: blogs.language })
        .from(blogs)
        .where(eq(blogs.translationGroupId, translationGroupId));

      for (const item of existingInGroup) {
        if (item.language === 'HINGLISH' && !input.hinglish.id) {
          input.hinglish.id = item.id;
        }
        if (item.language === 'ENGLISH' && !input.english.id) {
          input.english.id = item.id;
        }
      }
    }

    if (!input.hinglish.id && sharedSlug) {
      const [existingHinglish] = await db
        .select({ id: blogs.id })
        .from(blogs)
        .where(and(eq(blogs.slug, sharedSlug), eq(blogs.language, 'HINGLISH'), eq(blogs.authorId, currentUser.id)))
        .limit(1);
      if (existingHinglish) {
        input.hinglish.id = existingHinglish.id;
      }
    }

    if (!input.english.id && sharedSlug) {
      const [existingEnglish] = await db
        .select({ id: blogs.id })
        .from(blogs)
        .where(and(eq(blogs.slug, sharedSlug), eq(blogs.language, 'ENGLISH'), eq(blogs.authorId, currentUser.id)))
        .limit(1);
      if (existingEnglish) {
        input.english.id = existingEnglish.id;
      }
    }

    // 1. Save or update Hinglish article
    let hinglishPost;
    if (input.hinglish.id) {
      hinglishPost = await this.update(
        input.hinglish.id,
        {
          title: input.hinglish.title,
          slug: sharedSlug,
          description: input.hinglish.excerpt,
          coverImage: input.coverImage,
          imageAlt: input.imageAlt,
          categoryId: input.categoryId || null,
          metaTitle: input.hinglish.metaTitle,
          metaDescription: input.hinglish.metaDescription,
          language: 'HINGLISH',
          translationGroupId,
          status,
          htmlContent: hinglishHtml,
          tagIds: input.tagIds,
        },
        currentUser,
      );
    } else {
      hinglishPost = await this.create(
        {
          title: input.hinglish.title,
          slug: sharedSlug,
          description: input.hinglish.excerpt,
          coverImage: input.coverImage,
          imageAlt: input.imageAlt,
          categoryId: input.categoryId || null,
          metaTitle: input.hinglish.metaTitle,
          metaDescription: input.hinglish.metaDescription,
          language: 'HINGLISH',
          translationGroupId,
          status,
          htmlContent: hinglishHtml,
          tagIds: input.tagIds,
        },
        currentUser,
      );
    }

    // 2. Save or update English article (same slug)
    let englishPost;
    if (input.english.id) {
      englishPost = await this.update(
        input.english.id,
        {
          title: input.english.title,
          slug: sharedSlug,
          description: input.english.excerpt,
          coverImage: input.coverImage,
          imageAlt: input.imageAlt,
          categoryId: input.categoryId || null,
          metaTitle: input.english.metaTitle,
          metaDescription: input.english.metaDescription,
          language: 'ENGLISH',
          translationGroupId,
          status,
          htmlContent: englishHtml,
          tagIds: input.tagIds,
        },
        currentUser,
      );
    } else {
      englishPost = await this.create(
        {
          title: input.english.title,
          slug: sharedSlug,
          description: input.english.excerpt,
          coverImage: input.coverImage,
          imageAlt: input.imageAlt,
          categoryId: input.categoryId || null,
          metaTitle: input.english.metaTitle,
          metaDescription: input.english.metaDescription,
          language: 'ENGLISH',
          translationGroupId,
          status,
          htmlContent: englishHtml,
          tagIds: input.tagIds,
        },
        currentUser,
      );
    }

    return {
      translationGroupId,
      hinglish: hinglishPost,
      english: englishPost,
    };
  }

  /** Delegate generate-from-reference to GeminiService */
  async generateBilingualFromReference(
    input: { referenceContent: string; category?: string; additionalInstructions?: string },
    currentUser?: CurrentUser,
  ) {
    if (currentUser) this.assertCanWrite(currentUser);
    return this.gemini.generateBilingualFromReference(input);
  }

  private assertCanWrite(currentUser: CurrentUser) {
    if (currentUser.role === 'student') {
      throw new ForbiddenException('Editor access is required.');
    }
  }

  private assertAdmin(currentUser: CurrentUser) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Administrator access is required.');
    }
  }

  private rethrowSlugConflict(error: unknown): never {
    if ((error as { code?: string }).code === '23505') {
      throw new ConflictException('This blog slug is already in use.');
    }
    throw error;
  }
}
