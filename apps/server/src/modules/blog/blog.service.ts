import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../../core/config/db.js';
import { blogBlocks, blogs, users } from '../../core/schema/index.js';
import type {
  CreateBlockInput,
  CreateBlogInput,
  UpdateBlockInput,
  UpdateBlogInput,
} from './dto/blog.dto.js';

type CurrentUser = {
  id: string;
  role: 'student' | 'editor' | 'admin';
};

@Injectable()
export class BlogService {
  async listPublished() {
    return db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        description: blogs.description,
        coverImage: blogs.coverImage,
        publishedAt: blogs.publishedAt,
        author: {
          id: users.id,
          name: users.name,
        },
      })
      .from(blogs)
      .innerJoin(users, eq(blogs.authorId, users.id))
      .where(eq(blogs.status, 'PUBLISHED'))
      .orderBy(desc(blogs.publishedAt), desc(blogs.createdAt));
  }

  async getPublished(slug: string) {
    const [blog] = await db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        description: blogs.description,
        coverImage: blogs.coverImage,
        publishedAt: blogs.publishedAt,
        author: {
          id: users.id,
          name: users.name,
        },
      })
      .from(blogs)
      .innerJoin(users, eq(blogs.authorId, users.id))
      .where(and(eq(blogs.slug, slug), eq(blogs.status, 'PUBLISHED')))
      .limit(1);

    if (!blog) throw new NotFoundException('Blog was not found.');

    return {
      ...blog,
      blocks: await this.getBlocks(blog.id),
    };
  }

  async listManageable(currentUser: CurrentUser) {
    this.assertCanWrite(currentUser);

    const query = db.select().from(blogs);
    const rows =
      currentUser.role === 'admin'
        ? await query.orderBy(desc(blogs.updatedAt))
        : await query
            .where(eq(blogs.authorId, currentUser.id))
            .orderBy(desc(blogs.updatedAt));

    return rows;
  }

  async getManageable(id: string, currentUser: CurrentUser) {
    const blog = await this.findManageable(id, currentUser);
    return {
      ...blog,
      blocks: await this.getBlocks(blog.id),
    };
  }

  async create(input: CreateBlogInput, currentUser: CurrentUser) {
    this.assertCanWrite(currentUser);

    try {
      return await db.transaction(async (tx) => {
        const now = new Date();
        const [blog] = await tx
          .insert(blogs)
          .values({
            title: input.title,
            slug: input.slug,
            description: input.description,
            coverImage: input.coverImage,
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? now : null,
            authorId: currentUser.id,
          })
          .returning();

        if (!blog) throw new Error('Blog creation did not return a row.');

        const blocks = await this.insertBlocks(tx, blog.id, input.blocks ?? []);
        return { ...blog, blocks };
      });
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  async update(id: string, input: UpdateBlogInput, currentUser: CurrentUser) {
    const existing = await this.findManageable(id, currentUser);

    try {
      return await db.transaction(async (tx) => {
        const status = input.status ?? existing.status;
        const publishedAt =
          status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : null;

        const [blog] = await tx
          .update(blogs)
          .set({
            ...input,
            publishedAt,
            updatedAt: new Date(),
          })
          .where(eq(blogs.id, existing.id))
          .returning();

        if (!blog) throw new NotFoundException('Blog was not found.');

        const blocks = await tx
          .select()
          .from(blogBlocks)
          .where(eq(blogBlocks.blogId, blog.id))
          .orderBy(asc(blogBlocks.position));

        return { ...blog, blocks };
      });
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  async createBlock(
    blogId: string,
    input: CreateBlockInput,
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);

    try {
      return await db.transaction(async (tx) => {
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

        if (!block) throw new Error('Block creation did not return a row.');
        return block;
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          'The block order changed. Refresh the blog and try again.',
        );
      }
      throw error;
    }
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

  async removeBlock(blogId: string, blockId: string, currentUser: CurrentUser) {
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
        throw new ConflictException(
          'The block list is stale. Refresh the blog and try again.',
        );
      }

      // Move positions into a temporary negative range first to avoid the
      // unique (blogId, position) constraint while positions are swapped.
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

  async replaceBlocks(
    blogId: string,
    blocks: CreateBlockInput[],
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);

    return db.transaction(async (tx) => {
      await tx.delete(blogBlocks).where(eq(blogBlocks.blogId, blogId));

      await tx
        .update(blogs)
        .set({ updatedAt: new Date() })
        .where(eq(blogs.id, blogId));

      return this.insertBlocks(tx, blogId, blocks);
    });
  }

  async remove(id: string, currentUser: CurrentUser) {
    const existing = await this.findManageable(id, currentUser);
    await db.delete(blogs).where(eq(blogs.id, existing.id));
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

  private async insertBlocks(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    blogId: string,
    blocks: NonNullable<CreateBlogInput['blocks']>,
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

  private assertCanWrite(currentUser: CurrentUser) {
    if (currentUser.role === 'student') {
      throw new ForbiddenException('Editor access is required.');
    }
  }

  private rethrowSlugConflict(error: unknown): never {
    if ((error as { code?: string }).code === '23505') {
      throw new ConflictException('This blog slug is already in use.');
    }
    throw error;
  }
}
