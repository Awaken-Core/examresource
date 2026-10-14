import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, ilike, or, sql, lte } from 'drizzle-orm';
import { db } from '../../core/config/db.js';
import {
  blogBlocks,
  blogs,
  categories,
  tags,
  blogTags,
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
import { htmlToBlocks, blocksToHtml } from './blog-content.adapter.js';

type CurrentUser = {
  id: string;
  role: 'student' | 'editor' | 'admin';
};

@Injectable()
export class BlogService {
  // ==========================================
  // Public Blog Endpoints (SEO & SSR)
  // ==========================================

  async listPublished(options?: {
    categorySlug?: string;
    tagSlug?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const now = new Date();
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = options?.offset ?? 0;

    let baseQuery = db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
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
      .where(
        and(
          // Active published posts: status is PUBLISHED or (SCHEDULED and scheduledAt <= now)
          or(
            eq(blogs.status, 'PUBLISHED'),
            and(eq(blogs.status, 'SCHEDULED'), lte(blogs.scheduledAt, now)),
          ),
          options?.categorySlug
            ? eq(categories.slug, options.categorySlug)
            : undefined,
          options?.search
            ? or(
                ilike(blogs.title, `%${options.search}%`),
                ilike(blogs.description, `%${options.search}%`),
              )
            : undefined,
        ),
      )
      .orderBy(desc(blogs.publishedAt), desc(blogs.createdAt))
      .limit(limit)
      .offset(offset);

    const rows = await baseQuery;
    return rows;
  }

  async getPublished(slug: string) {
    const now = new Date();
    const [blog] = await db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
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

    if (!blog) {
      // Check if there is an active 301 redirect for this slug
      const [redirect] = await db
        .select()
        .from(urlRedirects)
        .where(
          or(
            eq(urlRedirects.sourcePath, slug),
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

    const blocks = await this.getBlocks(blog.id);
    const postTagsList = await this.getBlogTags(blog.id);
    const html = blocksToHtml(blocks as any);

    return {
      ...blog,
      blocks,
      tags: postTagsList,
      htmlContent: html,
    };
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
      conditions.push(eq(blogs.categoryId, filters.categoryId));
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
        publishedAt: blogs.publishedAt,
        scheduledAt: blogs.scheduledAt,
        version: blogs.version,
        metaTitle: blogs.metaTitle,
        metaDescription: blogs.metaDescription,
        canonicalUrl: blogs.canonicalUrl,
        noindex: blogs.noindex,
        createdAt: blogs.createdAt,
        updatedAt: blogs.updatedAt,
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

    return rows;
  }

  async getManageable(id: string, currentUser: CurrentUser) {
    const blog = await this.findManageable(id, currentUser);
    const blocks = await this.getBlocks(blog.id);
    const postTagsList = await this.getBlogTags(blog.id);
    const html = blocksToHtml(blocks as any);

    return {
      ...blog,
      blocks,
      tags: postTagsList,
      htmlContent: html,
    };
  }

  async create(input: CreateBlogInput, currentUser: CurrentUser) {
    this.assertCanWrite(currentUser);

    // Validate slug uniqueness proactively
    await this.assertSlugAvailable(input.slug);

    try {
      return await db.transaction(async (tx) => {
        const now = new Date();
        const status = input.status ?? 'DRAFT';
        const publishedAt = status === 'PUBLISHED' ? now : null;
        const scheduledAt =
          status === 'SCHEDULED' && input.scheduledAt
            ? new Date(input.scheduledAt)
            : null;

        const [blog] = await tx
          .insert(blogs)
          .values({
            title: input.title,
            slug: input.slug,
            description: input.description,
            coverImage: input.coverImage,
            imageAlt: input.imageAlt,
            imageCaption: input.imageCaption,
            categoryId: input.categoryId || null,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            canonicalUrl: input.canonicalUrl || null,
            noindex: input.noindex ?? false,
            status,
            publishedAt,
            scheduledAt,
            version: 1,
            authorId: currentUser.id,
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
      await this.assertSlugAvailable(input.slug, existing.id);
    }

    try {
      return await db.transaction(async (tx) => {
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

        // If published URL changed, record automatic 301 redirect
        if (
          input.slug &&
          input.slug !== existing.slug &&
          existing.status === 'PUBLISHED'
        ) {
          await tx
            .insert(urlRedirects)
            .values({
              sourcePath: `/blog/${existing.slug}`,
              targetPath: `/blog/${input.slug}`,
              statusCode: 301,
            })
            .onConflictDoUpdate({
              target: urlRedirects.sourcePath,
              set: { targetPath: `/blog/${input.slug}`, createdAt: new Date() },
            });
        }

        const [blog] = await tx
          .update(blogs)
          .set({
            title: input.title ?? existing.title,
            slug: input.slug ?? existing.slug,
            description: input.description ?? existing.description,
            coverImage: input.coverImage ?? existing.coverImage,
            imageAlt: input.imageAlt ?? existing.imageAlt,
            imageCaption: input.imageCaption ?? existing.imageCaption,
            categoryId:
              input.categoryId !== undefined
                ? input.categoryId
                : existing.categoryId,
            metaTitle: input.metaTitle ?? existing.metaTitle,
            metaDescription: input.metaDescription ?? existing.metaDescription,
            canonicalUrl:
              input.canonicalUrl !== undefined
                ? input.canonicalUrl
                : existing.canonicalUrl,
            noindex: input.noindex ?? existing.noindex,
            status,
            publishedAt,
            scheduledAt,
            version: nextVersion,
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
    await db.delete(blogs).where(eq(blogs.id, existing.id));
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
    return db
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
  }

  async createCategory(
    input: CreateCategoryInput,
    currentUser: CurrentUser,
  ) {
    this.assertAdmin(currentUser);
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
    await db.delete(categories).where(eq(categories.id, id));
  }

  async listTags() {
    return db
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
  }

  async createTag(input: CreateTagInput, currentUser: CurrentUser) {
    this.assertAdmin(currentUser);
    const [t] = await db.insert(tags).values(input).returning();
    return t;
  }

  async deleteTag(id: string, currentUser: CurrentUser) {
    this.assertAdmin(currentUser);
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

  private async isSlugAvailable(slug: string, excludeId?: string) {
    const conditions = [eq(blogs.slug, slug)];
    if (excludeId) {
      conditions.push(sql`${blogs.id} != ${excludeId}`);
    }
    const [existing] = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(and(...conditions))
      .limit(1);
    return !existing;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string) {
    const available = await this.isSlugAvailable(slug, excludeId);
    if (!available) {
      throw new ConflictException('This URL slug is already taken.');
    }
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
