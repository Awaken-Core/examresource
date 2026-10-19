import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';
import { Types } from 'mongoose';
import {
  type BlogBlockDocument,
  type BlogCategoryDocument,
  type BlogDocument,
  type BlogRevisionDocument,
  type BlogTagDocument,
  type CategoryDocument,
  type NotificationDocument,
  type TagDocument,
  type UrlRedirectDocument,
  type UserDocument,
  Blog,
  BlogBlock,
  BlogCategory,
  BlogRevision,
  BlogTag,
  Category,
  Notification,
  Tag,
  UrlRedirect,
  User,
} from '../../core/schema/index.js';
import { blocksToHtml, htmlToBlocks, syncImageBlocks } from './blog-content.adapter.js';
import type {
  CreateBlockInput,
  CreateBlogInput,
  CreateCategoryInput,
  CreateTagInput,
  UpdateBlockInput,
  UpdateBlogInput,
  UpdateCategoryInput,
} from './dto/blog.dto.js';
import { GeminiService } from './gemini.service.js';
import { createBlogPublishedNotification } from '../notifications/notification.store.js';

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

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

@Injectable()
export class BlogService {
  private cache = new MemoryCache();

  constructor(
    @InjectModel(Blog.name)
    private readonly blogModel: Model<BlogDocument>,
    @InjectModel(BlogBlock.name)
    private readonly blogBlockModel: Model<BlogBlockDocument>,
    @InjectModel(BlogRevision.name)
    private readonly blogRevisionModel: Model<BlogRevisionDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Tag.name)
    private readonly tagModel: Model<TagDocument>,
    @InjectModel(BlogCategory.name)
    private readonly blogCategoryModel: Model<BlogCategoryDocument>,
    @InjectModel(BlogTag.name)
    private readonly blogTagModel: Model<BlogTagDocument>,
    @InjectModel(UrlRedirect.name)
    private readonly urlRedirectModel: Model<UrlRedirectDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly gemini: GeminiService = {} as any,
  ) {}

  public invalidateCache(): void {
    this.cache.clear();
  }

  private async runInTransaction<T>(
    fn: (session?: ClientSession) => Promise<T>,
  ): Promise<T> {
    // A ClientSession is connection-bound. Model calls made through the
    // Durable Object are separate RPCs, so forwarding a Worker-created shim as
    // `options.session` would make Mongoose reject it. Complex atomic commands
    // must be implemented as one Durable Object operation.
    if ((this.connection as any).supportsTransactions === false) {
      return fn(undefined);
    }

    let session: ClientSession | null = null;
    try {
      session = await this.connection.startSession();
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err: any) {
      if (session?.inTransaction()) {
        await session.abortTransaction();
      }
      if (
        err?.message?.includes('Transactions are not supported') ||
        err?.message?.includes('replica set')
      ) {
        return fn(undefined);
      }
      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
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
    includeImages?: boolean;
  }) {
    const cacheKey = `list:${JSON.stringify(options || {})}`;
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = options?.offset ?? 0;

    const andConditions: any[] = [
      {
        $or: [
          { status: 'PUBLISHED' },
          { status: 'SCHEDULED', scheduledAt: { $lte: now } },
        ],
      },
    ];

    if (options?.categorySlug) {
      const catSlug = options.categorySlug.toLowerCase().trim();
      const cat = await this.categoryModel.findOne({ slug: catSlug }).lean();
      if (!cat) return [];

      const blogCatRows = await this.blogCategoryModel
        .find({ categoryId: cat._id })
        .select({ blogId: 1 })
        .lean();
      const matchedBlogIds = blogCatRows.map((r) => r.blogId);

      andConditions.push({
        $or: [
          { categoryId: cat._id },
          { _id: { $in: matchedBlogIds } },
        ],
      });
    }

    if (options?.tagSlug) {
      const tagSlug = options.tagSlug.toLowerCase().trim();
      const tag = await this.tagModel.findOne({ slug: tagSlug }).lean();
      if (!tag) return [];

      const blogTagRows = await this.blogTagModel
        .find({ tagId: tag._id })
        .select({ blogId: 1 })
        .lean();
      const matchedBlogIds = blogTagRows.map((r) => r.blogId);

      andConditions.push({ _id: { $in: matchedBlogIds } });
    }

    if (options?.search) {
      const regex = new RegExp(escapeRegex(options.search), 'i');
      andConditions.push({
        $or: [{ title: regex }, { description: regex }],
      });
    }

    if (options?.language) {
      andConditions.push({ language: options.language });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const rawRows = await this.blogModel
      .find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate<{ categoryId: CategoryDocument }>('categoryId')
      .populate<{ authorId: UserDocument }>('authorId')
      .lean();

    if (rawRows.length === 0) return [];

    const rows = rawRows.map((r: any) => ({
      id: r._id.toString(),
      title: r.title,
      slug: r.slug,
      language: r.language,
      translationGroupId: r.translationGroupId ?? null,
      description: r.description ?? null,
      coverImage: r.coverImage ?? null,
      imageAlt: r.imageAlt ?? null,
      metaTitle: r.metaTitle ?? null,
      metaDescription: r.metaDescription ?? null,
      publishedAt: r.publishedAt ?? null,
      scheduledAt: r.scheduledAt ?? null,
      updatedAt: r.updatedAt,
      category: r.categoryId
        ? {
            id: r.categoryId._id.toString(),
            name: r.categoryId.name,
            slug: r.categoryId.slug,
          }
        : null,
      author: r.authorId
        ? {
            id: r.authorId._id.toString(),
            name: r.authorId.name,
          }
        : null,
    }));

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

    const shouldFetchImages = options?.includeImages !== false;

    if (shouldFetchImages && groupIds.length > 0) {
      const siblingBlogs = await this.blogModel
        .find({ translationGroupId: { $in: groupIds } })
        .select({ _id: 1, translationGroupId: 1 })
        .lean();

      for (const s of siblingBlogs) {
        const sId = s._id.toString();
        if (s.translationGroupId) {
          blogGroupIdMap.set(sId, s.translationGroupId);
        }
      }

      allRelatedBlogIds = [
        ...new Set([...allRelatedBlogIds, ...siblingBlogs.map((s) => s._id.toString())]),
      ];
    }

    const relatedObjectIds = allRelatedBlogIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const promises: Promise<any>[] = [
      relatedObjectIds.length > 0
        ? this.blogCategoryModel
            .find({ blogId: { $in: relatedObjectIds } })
            .populate<{ categoryId: CategoryDocument }>('categoryId')
            .lean()
        : Promise.resolve([]),
    ];

    if (shouldFetchImages && relatedObjectIds.length > 0) {
      promises.push(
        this.blogBlockModel
          .find({
            blogId: { $in: relatedObjectIds },
            type: 'IMAGE',
          })
          .sort({ position: 1 })
          .select({ blogId: 1, value: 1, position: 1 })
          .lean(),
      );
    }

    const [catRows, imageBlocks = []] = await Promise.all(promises);

    const blogImageMap = new Map<string, string>();
    if (shouldFetchImages) {
      for (const img of imageBlocks as any[]) {
        const bId = img.blogId.toString();
        if (!blogImageMap.has(bId)) {
          blogImageMap.set(bId, img.value);
        }
      }
    }

    const groupImageMap = new Map<string, string>();
    if (shouldFetchImages && groupIds.length > 0) {
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
    for (const cr of catRows as any[]) {
      if (!cr.categoryId) continue;
      const bId = cr.blogId.toString();
      const list = blogCategoryMap.get(bId) || [];
      const catId = cr.categoryId._id.toString();
      if (!list.some((c) => c.id === catId)) {
        list.push({
          id: catId,
          name: cr.categoryId.name,
          slug: cr.categoryId.slug,
        });
      }
      blogCategoryMap.set(bId, list);
    }

    const result = rows.map((row) => {
      const firstInlineImage = shouldFetchImages
        ? (blogImageMap.get(row.id) ||
          (row.translationGroupId ? groupImageMap.get(row.translationGroupId) : null) ||
          null)
        : null;

      const firstImage = shouldFetchImages ? (firstInlineImage || row.coverImage || null) : null;
      const coverImage = shouldFetchImages ? (row.coverImage || firstInlineImage || null) : null;

      const attachedCats =
        blogCategoryMap.get(row.id) ||
        (row.category?.id ? [row.category] : []);
      const primaryCategory = attachedCats[0] || row.category;

      return {
        ...row,
        category: primaryCategory,
        categories: attachedCats,
        firstImage,
        coverImage,
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
    const requestedLang = language || 'HINGLISH';

    const baseCondition: any = {
      slug,
      language: requestedLang,
      $or: [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledAt: { $lte: now } },
      ],
    };

    let rawBlog = await this.blogModel
      .findOne(baseCondition)
      .populate<{ categoryId: CategoryDocument }>('categoryId')
      .populate<{ authorId: UserDocument }>('authorId')
      .lean();

    if (!rawBlog) {
      const anyBlogWithSlug = await this.blogModel
        .findOne({
          slug,
          $or: [
            { status: 'PUBLISHED' },
            { status: 'SCHEDULED', scheduledAt: { $lte: now } },
          ],
        })
        .select({ _id: 1, translationGroupId: 1 })
        .lean();

      if (anyBlogWithSlug?.translationGroupId) {
        const groupMatch = await this.blogModel
          .findOne({
            translationGroupId: anyBlogWithSlug.translationGroupId,
            language: requestedLang,
            $or: [
              { status: 'PUBLISHED' },
              { status: 'SCHEDULED', scheduledAt: { $lte: now } },
            ],
          })
          .populate<{ categoryId: CategoryDocument }>('categoryId')
          .populate<{ authorId: UserDocument }>('authorId')
          .lean();

        if (groupMatch) rawBlog = groupMatch;
      }
    }

    if (!rawBlog) {
      const fallback = await this.blogModel
        .findOne({
          slug,
          $or: [
            { status: 'PUBLISHED' },
            { status: 'SCHEDULED', scheduledAt: { $lte: now } },
          ],
        })
        .populate<{ categoryId: CategoryDocument }>('categoryId')
        .populate<{ authorId: UserDocument }>('authorId')
        .lean();
      if (fallback) rawBlog = fallback;
    }

    if (!rawBlog) {
      const redirect = await this.urlRedirectModel
        .findOne({
          sourcePath: { $in: [slug, `/${slug}`, `/blog/${slug}`] },
        })
        .lean();

      if (redirect) {
        throw new NotFoundException({
          message: 'Post has moved.',
          redirectUrl: redirect.targetPath,
          statusCode: redirect.statusCode,
        });
      }

      throw new NotFoundException('Blog was not found.');
    }

    const blog: any = {
      id: rawBlog._id.toString(),
      title: rawBlog.title,
      slug: rawBlog.slug,
      language: rawBlog.language,
      translationGroupId: rawBlog.translationGroupId ?? null,
      description: rawBlog.description ?? null,
      coverImage: rawBlog.coverImage ?? null,
      imageAlt: rawBlog.imageAlt ?? null,
      imageCaption: rawBlog.imageCaption ?? null,
      metaTitle: rawBlog.metaTitle ?? null,
      metaDescription: rawBlog.metaDescription ?? null,
      canonicalUrl: rawBlog.canonicalUrl ?? null,
      noindex: rawBlog.noindex ?? false,
      publishedAt: rawBlog.publishedAt ?? null,
      updatedAt: (rawBlog as any).updatedAt,
      version: rawBlog.version,
      category: rawBlog.categoryId
        ? {
            id: (rawBlog.categoryId as any)._id.toString(),
            name: (rawBlog.categoryId as any).name,
            slug: (rawBlog.categoryId as any).slug,
          }
        : null,
      author: rawBlog.authorId
        ? {
            id: (rawBlog.authorId as any)._id.toString(),
            name: (rawBlog.authorId as any).name,
          }
        : null,
    };

    let hasAlternateLanguage = false;
    let effectiveBlocks = await this.getBlocks(blog.id);
    let alternateArticle: any = null;

    if (blog.translationGroupId) {
      const alt = await this.blogModel
        .findOne({
          translationGroupId: blog.translationGroupId,
          _id: { $ne: rawBlog._id },
          $or: [
            { status: 'PUBLISHED' },
            { status: 'SCHEDULED', scheduledAt: { $lte: now } },
          ],
        })
        .lean();
      hasAlternateLanguage = !!alt;

      if (alt) {
        const altId = alt._id.toString();
        const altBlocks = await this.getBlocks(altId);
        effectiveBlocks = syncImageBlocks(effectiveBlocks as any, altBlocks as any) as any;
        alternateArticle = {
          id: altId,
          title: alt.title,
          slug: alt.slug,
          language: alt.language,
          description: alt.description ?? null,
          coverImage: alt.coverImage ?? null,
          imageAlt: alt.imageAlt ?? null,
          imageCaption: alt.imageCaption ?? null,
          metaTitle: alt.metaTitle ?? null,
          metaDescription: alt.metaDescription ?? null,
          publishedAt: alt.publishedAt ?? null,
          updatedAt: (alt as any).updatedAt,
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

  async checkRedirect(path: string) {
    return this.urlRedirectModel.findOne({ sourcePath: path }).lean();
  }

  async getSitemapEntries() {
    const now = new Date();
    const items = await this.blogModel
      .find({
        noindex: false,
        $or: [
          { status: 'PUBLISHED' },
          { status: 'SCHEDULED', scheduledAt: { $lte: now } },
        ],
      })
      .populate<{ categoryId: CategoryDocument }>('categoryId', 'slug')
      .sort({ updatedAt: -1 })
      .lean();

    return items.map((i: any) => ({
      slug: i.slug,
      language: i.language,
      categorySlug: i.categoryId?.slug ?? null,
      updatedAt: i.updatedAt,
      publishedAt: i.publishedAt,
      noindex: i.noindex,
    }));
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

    const conditions: any[] = [];

    if (currentUser.role !== 'admin') {
      conditions.push({ authorId: new Types.ObjectId(currentUser.id) });
    }

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push({ status: filters.status });
    }

    if (filters?.categoryId && filters.categoryId !== 'ALL') {
      if (Types.ObjectId.isValid(filters.categoryId)) {
        const catObjectId = new Types.ObjectId(filters.categoryId);
        const pivotRows = await this.blogCategoryModel
          .find({ categoryId: catObjectId })
          .select({ blogId: 1 })
          .lean();
        const pivotBlogIds = pivotRows.map((r) => r.blogId);
        conditions.push({
          $or: [
            { categoryId: catObjectId },
            { _id: { $in: pivotBlogIds } },
          ],
        });
      }
    }

    if (filters?.search) {
      const regex = new RegExp(escapeRegex(filters.search), 'i');
      conditions.push({
        $or: [{ title: regex }, { slug: regex }, { description: regex }],
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};

    const rawRows = await this.blogModel
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate<{ categoryId: CategoryDocument }>('categoryId')
      .populate<{ authorId: UserDocument }>('authorId')
      .lean();

    const rows = rawRows.map((r: any) => ({
      id: r._id.toString(),
      title: r.title,
      slug: r.slug,
      description: r.description ?? null,
      coverImage: r.coverImage ?? null,
      imageAlt: r.imageAlt ?? null,
      status: r.status,
      language: r.language,
      translationGroupId: r.translationGroupId ?? null,
      publishedAt: r.publishedAt ?? null,
      scheduledAt: r.scheduledAt ?? null,
      version: r.version,
      metaTitle: r.metaTitle ?? null,
      metaDescription: r.metaDescription ?? null,
      canonicalUrl: r.canonicalUrl ?? null,
      noindex: r.noindex ?? false,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      categoryId: r.categoryId ? (r.categoryId as any)._id.toString() : null,
      category: r.categoryId
        ? {
            id: (r.categoryId as any)._id.toString(),
            name: (r.categoryId as any).name,
            slug: (r.categoryId as any).slug,
          }
        : null,
      author: r.authorId
        ? {
            id: (r.authorId as any)._id.toString(),
            name: (r.authorId as any).name,
            email: (r.authorId as any).email,
          }
        : null,
    }));

    const allBlogObjectIds = rows
      .filter((r) => Types.ObjectId.isValid(r.id))
      .map((r) => new Types.ObjectId(r.id));

    const catRows =
      allBlogObjectIds.length > 0
        ? await this.blogCategoryModel
            .find({ blogId: { $in: allBlogObjectIds } })
            .populate<{ categoryId: CategoryDocument }>('categoryId')
            .lean()
        : [];

    const blogCategoryMap = new Map<string, { id: string; name: string; slug: string }[]>();
    for (const cr of catRows as any[]) {
      if (!cr.categoryId) continue;
      const bId = cr.blogId.toString();
      const list = blogCategoryMap.get(bId) || [];
      const cId = cr.categoryId._id.toString();
      if (!list.some((c) => c.id === cId)) {
        list.push({
          id: cId,
          name: cr.categoryId.name,
          slug: cr.categoryId.slug,
        });
      }
      blogCategoryMap.set(bId, list);
    }

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
      const alt = await this.blogModel
        .findOne({
          translationGroupId: blog.translationGroupId,
          _id: { $ne: new Types.ObjectId(blog.id) },
        })
        .lean();
      if (alt) {
        const altId = alt._id.toString();
        let altBlocks = await this.getBlocks(altId);
        const syncedBlocks = syncImageBlocks(blocks as any, altBlocks as any);
        const syncedAltBlocks = syncImageBlocks(altBlocks as any, blocks as any);
        blocks = syncedBlocks as any;
        altBlocks = syncedAltBlocks as any;

        linkedBlog = {
          id: altId,
          title: alt.title,
          slug: alt.slug,
          description: alt.description ?? null,
          coverImage: alt.coverImage ?? null,
          status: alt.status,
          language: alt.language,
          translationGroupId: alt.translationGroupId,
          version: alt.version,
          blocks: altBlocks,
          htmlContent: blocksToHtml(altBlocks as any),
        };
      }
    }

    const html = blocksToHtml(blocks as any);
    const postCategories = await this.getBlogCategories(blog.id);

    return {
      ...blog,
      category: postCategories[0] || (blog.categoryId ? { id: blog.categoryId } : null),
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

    const language = input.language ?? 'HINGLISH';
    const existingDraft = await this.blogModel
      .findOne({
        slug: input.slug,
        language,
        authorId: new Types.ObjectId(authorId),
      })
      .select({ _id: 1, status: 1 })
      .lean();

    if (existingDraft && existingDraft.status === 'DRAFT') {
      return this.update(existingDraft._id.toString(), input, currentUser);
    }

    await this.assertSlugAvailable(input.slug, undefined, language);

    try {
      const created = await this.runInTransaction(async (session) => {
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

        const [blog] = await this.blogModel.create(
          [
            {
              title: input.title,
              slug: input.slug,
              description: input.description,
              coverImage: input.coverImage,
              imageAlt: input.imageAlt,
              imageCaption: input.imageCaption,
              categoryId:
                primaryCategoryId && Types.ObjectId.isValid(primaryCategoryId)
                  ? new Types.ObjectId(primaryCategoryId)
                  : null,
              metaTitle: input.metaTitle,
              metaDescription: input.metaDescription,
              canonicalUrl: input.canonicalUrl || null,
              noindex: input.noindex ?? false,
              language,
              translationGroupId: input.translationGroupId || null,
              status,
              publishedAt,
              scheduledAt,
              version: 1,
              authorId: new Types.ObjectId(authorId),
            },
          ],
          { session },
        );

        const blogId = blog._id.toString();

        let blocksToInsert: CreateBlockInput[] = input.blocks ?? [];
        if (blocksToInsert.length === 0 && input.htmlContent) {
          blocksToInsert = htmlToBlocks(input.htmlContent) as any;
        }

        const blocks = await this.insertBlocks(blogId, blocksToInsert, session);

        if (input.tagIds && input.tagIds.length > 0) {
          await this.syncTags(blogId, input.tagIds, session);
        }

        if (initialCategoryIds.length > 0) {
          await this.syncCategories(blogId, initialCategoryIds, session);
        }

        await this.blogRevisionModel.create(
          [
            {
              blogId: blog._id,
              authorId: new Types.ObjectId(currentUser.id),
              title: blog.title,
              description: blog.description,
              version: 1,
              snapshot: { blog: blog.toObject(), blocks },
            },
          ],
          { session },
        );

        return {
          id: blogId,
          title: blog.title,
          slug: blog.slug,
          description: blog.description,
          coverImage: blog.coverImage,
          imageAlt: blog.imageAlt,
          imageCaption: blog.imageCaption,
          categoryId: primaryCategoryId,
          metaTitle: blog.metaTitle,
          metaDescription: blog.metaDescription,
          canonicalUrl: blog.canonicalUrl,
          noindex: blog.noindex,
          language: blog.language,
          translationGroupId: blog.translationGroupId,
          status: blog.status,
          publishedAt: blog.publishedAt,
          scheduledAt: blog.scheduledAt,
          version: blog.version,
          authorId,
          blocks,
          htmlContent: blocksToHtml(blocks as any),
        };
      });

      await this.announceIfNewlyPublished(created as any, false);
      this.invalidateCache();
      return created;
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

  async update(id: string, input: UpdateBlogInput, currentUser: CurrentUser) {
    const existing = await this.findManageable(id, currentUser);

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

    if (input.slug && input.slug !== existing.slug) {
      await this.assertSlugAvailable(input.slug, existing.id, existing.language);
    }

    const authorId =
      input.authorId !== undefined
        ? await this.resolveAuthorId(input.authorId, currentUser)
        : existing.authorId;

    try {
      const updated = await this.runInTransaction(async (session) => {
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

        if (
          input.slug &&
          input.slug !== existing.slug &&
          existing.status === 'PUBLISHED'
        ) {
          await this.urlRedirectModel.updateOne(
            { sourcePath: `/${existing.slug}` },
            {
              $set: {
                targetPath: `/${input.slug}`,
                statusCode: 301,
                createdAt: new Date(),
              },
              $setOnInsert: { sourcePath: `/${existing.slug}` },
            },
            { upsert: true, session },
          );
          await this.urlRedirectModel.updateOne(
            { sourcePath: `/blog/${existing.slug}` },
            {
              $set: {
                targetPath: `/${input.slug}`,
                statusCode: 301,
                createdAt: new Date(),
              },
              $setOnInsert: { sourcePath: `/blog/${existing.slug}` },
            },
            { upsert: true, session },
          );
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

        const updateFields: any = {
          version: nextVersion,
          authorId: new Types.ObjectId(authorId),
          updatedAt: new Date(),
        };
        if (input.title !== undefined) updateFields.title = input.title;
        if (input.slug !== undefined) updateFields.slug = input.slug;
        if (input.description !== undefined) updateFields.description = input.description;
        if (input.coverImage !== undefined) updateFields.coverImage = input.coverImage;
        if (input.imageAlt !== undefined) updateFields.imageAlt = input.imageAlt;
        if (input.imageCaption !== undefined) updateFields.imageCaption = input.imageCaption;
        if (updatedPrimaryCategoryId !== undefined) {
          updateFields.categoryId =
            updatedPrimaryCategoryId && Types.ObjectId.isValid(updatedPrimaryCategoryId)
              ? new Types.ObjectId(updatedPrimaryCategoryId)
              : null;
        }
        if (input.metaTitle !== undefined) updateFields.metaTitle = input.metaTitle;
        if (input.metaDescription !== undefined) updateFields.metaDescription = input.metaDescription;
        if (input.canonicalUrl !== undefined) updateFields.canonicalUrl = input.canonicalUrl;
        if (input.noindex !== undefined) updateFields.noindex = input.noindex;
        if (input.language !== undefined) updateFields.language = input.language;
        if (input.translationGroupId !== undefined) updateFields.translationGroupId = input.translationGroupId;
        if (input.status !== undefined) {
          updateFields.status = status;
          updateFields.publishedAt = publishedAt;
          updateFields.scheduledAt = scheduledAt;
        }

        const blogDoc = await this.blogModel.findByIdAndUpdate(
          existing.id,
          { $set: updateFields },
          { new: true, session },
        );
        if (!blogDoc) throw new NotFoundException('Blog was not found.');

        let blocksToPersist: CreateBlockInput[] | null = null;
        if (input.blocks && input.blocks.length > 0) {
          blocksToPersist = input.blocks;
        } else if (input.htmlContent !== undefined) {
          blocksToPersist = htmlToBlocks(input.htmlContent) as any;
        }

        let blocks = await this.getBlocks(existing.id);

        if (blocksToPersist !== null) {
          await this.blogBlockModel.deleteMany(
            { blogId: new Types.ObjectId(existing.id) },
            { session },
          );
          blocks = await this.insertBlocks(existing.id, blocksToPersist, session);
        }

        if (input.tagIds) {
          await this.syncTags(existing.id, input.tagIds, session);
        }

        if (updatedCategoryIds !== undefined) {
          await this.syncCategories(existing.id, updatedCategoryIds, session);
        }

        if (blogDoc.translationGroupId) {
          const sibling = await this.blogModel
            .findOne({
              translationGroupId: blogDoc.translationGroupId,
              _id: { $ne: blogDoc._id },
            })
            .select({ _id: 1 })
            .lean();

          const sharedFieldsToSync: any = {};
          if (input.status !== undefined) {
            sharedFieldsToSync.status = status;
            sharedFieldsToSync.publishedAt = publishedAt;
            sharedFieldsToSync.scheduledAt = scheduledAt;
          }
          if (input.coverImage !== undefined) sharedFieldsToSync.coverImage = blogDoc.coverImage;
          if (input.imageAlt !== undefined) sharedFieldsToSync.imageAlt = blogDoc.imageAlt;
          if (input.imageCaption !== undefined) sharedFieldsToSync.imageCaption = blogDoc.imageCaption;
          if (updatedPrimaryCategoryId !== undefined) {
            sharedFieldsToSync.categoryId = updateFields.categoryId;
          }
          if (input.noindex !== undefined) sharedFieldsToSync.noindex = blogDoc.noindex;

          if (Object.keys(sharedFieldsToSync).length > 0) {
            await this.blogModel.updateMany(
              {
                translationGroupId: blogDoc.translationGroupId,
                _id: { $ne: blogDoc._id },
              },
              { $set: sharedFieldsToSync },
              { session },
            );
          }

          if (sibling) {
            const siblingId = sibling._id.toString();
            if (input.tagIds) {
              await this.syncTags(siblingId, input.tagIds, session);
            }
            if (updatedCategoryIds !== undefined) {
              await this.syncCategories(siblingId, updatedCategoryIds, session);
            }
            if (blocksToPersist !== null) {
              const siblingBlocks = await this.getBlocks(siblingId);
              const syncedSiblingBlocks = syncImageBlocks(siblingBlocks as any, blocks as any);
              if (syncedSiblingBlocks.length !== siblingBlocks.length) {
                await this.blogBlockModel.deleteMany(
                  { blogId: sibling._id },
                  { session },
                );
                await this.insertBlocks(siblingId, syncedSiblingBlocks as any, session);
                await this.blogModel.updateOne(
                  { _id: sibling._id },
                  { $set: { updatedAt: new Date() } },
                  { session },
                );
              }
            }
          }
        }

        await this.blogRevisionModel.create(
          [
            {
              blogId: blogDoc._id,
              authorId: new Types.ObjectId(currentUser.id),
              title: blogDoc.title,
              description: blogDoc.description,
              version: nextVersion,
              snapshot: { blog: blogDoc.toObject(), blocks },
            },
          ],
          { session },
        );

        return {
          id: blogDoc._id.toString(),
          title: blogDoc.title,
          slug: blogDoc.slug,
          description: blogDoc.description,
          coverImage: blogDoc.coverImage,
          imageAlt: blogDoc.imageAlt,
          imageCaption: blogDoc.imageCaption,
          categoryId: blogDoc.categoryId ? blogDoc.categoryId.toString() : null,
          metaTitle: blogDoc.metaTitle,
          metaDescription: blogDoc.metaDescription,
          canonicalUrl: blogDoc.canonicalUrl,
          noindex: blogDoc.noindex,
          language: blogDoc.language,
          translationGroupId: blogDoc.translationGroupId,
          status: blogDoc.status,
          publishedAt: blogDoc.publishedAt,
          scheduledAt: blogDoc.scheduledAt,
          version: blogDoc.version,
          authorId: blogDoc.authorId.toString(),
          updatedAt: (blogDoc as any).updatedAt,
          blocks,
          htmlContent: blocksToHtml(blocks as any),
        };
      });

      await this.announceIfNewlyPublished(updated as any, existing.status === 'PUBLISHED');
      this.invalidateCache();
      return updated;
    } catch (error) {
      this.rethrowSlugConflict(error);
    }
  }

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

    return this.runInTransaction(async (session) => {
      const [newBlog] = await this.blogModel.create(
        [
          {
            title: `${source.title} (Copy)`,
            slug,
            description: source.description,
            coverImage: source.coverImage,
            imageAlt: source.imageAlt,
            imageCaption: source.imageCaption,
            categoryId:
              source.categoryId && Types.ObjectId.isValid(source.categoryId)
                ? new Types.ObjectId(source.categoryId)
                : null,
            metaTitle: source.metaTitle,
            metaDescription: source.metaDescription,
            canonicalUrl: null,
            noindex: true,
            status: 'DRAFT',
            publishedAt: null,
            authorId: new Types.ObjectId(currentUser.id),
            version: 1,
          },
        ],
        { session },
      );

      const newBlogId = newBlog._id.toString();

      const blocks = await this.insertBlocks(
        newBlogId,
        sourceBlocks.map((b) => ({
          type: b.type,
          value: b.value,
          metadata: b.metadata as any,
        })),
        session,
      );

      if (sourceTags.length > 0) {
        await this.syncTags(
          newBlogId,
          sourceTags.map((t) => t.id),
          session,
        );
      }

      return {
        id: newBlogId,
        title: newBlog.title,
        slug: newBlog.slug,
        description: newBlog.description,
        coverImage: newBlog.coverImage,
        imageAlt: newBlog.imageAlt,
        imageCaption: newBlog.imageCaption,
        categoryId: source.categoryId,
        metaTitle: newBlog.metaTitle,
        metaDescription: newBlog.metaDescription,
        canonicalUrl: null,
        noindex: true,
        status: 'DRAFT',
        publishedAt: null,
        authorId: currentUser.id,
        version: 1,
        blocks,
        htmlContent: blocksToHtml(blocks as any),
      };
    });
  }

  async remove(id: string, currentUser: CurrentUser) {
    const existing = await this.findManageable(id, currentUser);
    await this.runInTransaction(async (session) => {
      const idsToDelete = [existing.id];
      if (existing.translationGroupId) {
        const siblings = await this.blogModel
          .find({ translationGroupId: existing.translationGroupId })
          .select({ _id: 1 })
          .lean();
        for (const s of siblings) {
          const sId = s._id.toString();
          if (!idsToDelete.includes(sId)) idsToDelete.push(sId);
        }
      }

      for (const blogId of idsToDelete) {
        const bObjectId = new Types.ObjectId(blogId);
        await this.blogBlockModel.deleteMany({ blogId: bObjectId }, { session });
        await this.blogTagModel.deleteMany({ blogId: bObjectId }, { session });
        await this.blogCategoryModel.deleteMany({ blogId: bObjectId }, { session });
        await this.blogRevisionModel.deleteMany({ blogId: bObjectId }, { session });
        await this.blogModel.deleteOne({ _id: bObjectId }, { session });
      }
    });
    this.invalidateCache();
  }

  async listRevisions(blogId: string, currentUser: CurrentUser) {
    await this.findManageable(blogId, currentUser);
    const rows = await this.blogRevisionModel
      .find({ blogId: new Types.ObjectId(blogId) })
      .populate<{ authorId: UserDocument }>('authorId', 'name')
      .sort({ version: -1 })
      .lean();

    return rows.map((r: any) => ({
      id: r._id.toString(),
      version: r.version,
      title: r.title,
      createdAt: r.createdAt,
      author: r.authorId
        ? { id: r.authorId._id.toString(), name: r.authorId.name }
        : null,
    }));
  }

  async restoreRevision(
    blogId: string,
    revisionId: string,
    currentUser: CurrentUser,
  ) {
    const blog = await this.findManageable(blogId, currentUser);
    if (!Types.ObjectId.isValid(revisionId)) {
      throw new NotFoundException('Revision not found.');
    }
    const rev = await this.blogRevisionModel
      .findOne({
        _id: new Types.ObjectId(revisionId),
        blogId: new Types.ObjectId(blog.id),
      })
      .lean();

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

    const [categoriesList, blogCatCounts, directBlogCounts] = await Promise.all([
      this.categoryModel.find().sort({ name: 1 }).lean(),
      this.blogCategoryModel.aggregate([
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]),
      this.blogModel.aggregate([
        { $match: { categoryId: { $ne: null } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map<string, number>();
    for (const row of blogCatCounts) {
      if (row._id) countMap.set(row._id.toString(), row.count);
    }
    for (const row of directBlogCounts) {
      if (row._id) {
        const id = row._id.toString();
        countMap.set(id, Math.max(countMap.get(id) || 0, row.count));
      }
    }

    const res = categoriesList.map((c: any) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      createdAt: c.createdAt,
      postCount: countMap.get(c._id.toString()) || 0,
    }));

    this.cache.set(cacheKey, res, 300_000);
    return res;
  }

  async createCategory(
    input: CreateCategoryInput,
    currentUser: CurrentUser,
  ) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    const existing = await this.categoryModel.findOne({ slug: input.slug }).lean();

    if (existing) {
      throw new ConflictException(
        `A category with slug "${input.slug}" already exists. Please choose a different name or slug.`,
      );
    }

    try {
      const cat = await this.categoryModel.create(input);
      this.invalidateCache();
      return {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
      };
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException(
          `A category with this name or slug already exists.`,
        );
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
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Category not found.');
    if (input.slug) {
      const existing = await this.categoryModel.findOne({ slug: input.slug }).lean();
      if (existing && existing._id.toString() !== id) {
        throw new ConflictException(
          `A category with slug "${input.slug}" already exists.`,
        );
      }
    }

    try {
      const cat = await this.categoryModel
        .findByIdAndUpdate(id, { $set: input }, { new: true })
        .lean();
      if (!cat) throw new NotFoundException('Category not found.');
      this.invalidateCache();
      return {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
      };
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException(
          `A category with this name or slug already exists.`,
        );
      }
      throw err;
    }
  }

  async deleteCategory(id: string, currentUser: CurrentUser) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    if (!Types.ObjectId.isValid(id)) return;
    await this.categoryModel.deleteOne({ _id: new Types.ObjectId(id) });
    await this.blogCategoryModel.deleteMany({ categoryId: new Types.ObjectId(id) });
  }

  async listTags() {
    const cacheKey = 'tags:all';
    const cached = this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const [tagsList, blogTagCounts] = await Promise.all([
      this.tagModel.find().sort({ name: 1 }).lean(),
      this.blogTagModel.aggregate([
        { $group: { _id: '$tagId', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map<string, number>();
    for (const row of blogTagCounts) {
      if (row._id) countMap.set(row._id.toString(), row.count);
    }

    const res = tagsList.map((t: any) => ({
      id: t._id.toString(),
      name: t.name,
      slug: t.slug,
      postCount: countMap.get(t._id.toString()) || 0,
    }));

    this.cache.set(cacheKey, res, 300_000);
    return res;
  }

  async createTag(input: CreateTagInput, currentUser: CurrentUser) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    const tag = await this.tagModel.create(input);
    return {
      id: tag._id.toString(),
      name: tag.name,
      slug: tag.slug,
    };
  }

  async deleteTag(id: string, currentUser: CurrentUser) {
    this.assertAdmin(currentUser);
    this.invalidateCache();
    if (!Types.ObjectId.isValid(id)) return;
    await this.tagModel.deleteOne({ _id: new Types.ObjectId(id) });
    await this.blogTagModel.deleteMany({ tagId: new Types.ObjectId(id) });
  }

  // Block management
  async createBlock(
    blogId: string,
    input: CreateBlockInput,
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);

    const lastBlock = await this.blogBlockModel
      .findOne({ blogId: new Types.ObjectId(blogId) })
      .sort({ position: -1 })
      .select({ position: 1 })
      .lean();

    const block = await this.blogBlockModel.create({
      blogId: new Types.ObjectId(blogId),
      type: input.type,
      value: input.value ?? '',
      position: (lastBlock?.position ?? -1) + 1,
      metadata: input.metadata ? (input.metadata as any) : null,
    });

    return {
      id: block._id.toString(),
      blogId: block.blogId.toString(),
      type: block.type,
      value: block.value,
      position: block.position,
      metadata: block.metadata,
      createdAt: (block as any).createdAt,
      updatedAt: (block as any).updatedAt,
    };
  }

  async updateBlock(
    blogId: string,
    blockId: string,
    input: UpdateBlockInput,
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);
    if (!Types.ObjectId.isValid(blockId)) {
      throw new NotFoundException('Block was not found.');
    }

    const updateData: any = {};
    if (input.type !== undefined) updateData.type = input.type;
    if (input.value !== undefined) updateData.value = input.value;
    if ((input as any).position !== undefined) updateData.position = (input as any).position;
    if (input.metadata !== undefined) updateData.metadata = input.metadata as any;

    const block = await this.blogBlockModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(blockId), blogId: new Types.ObjectId(blogId) },
        { $set: updateData },
        { new: true },
      )
      .lean();

    if (!block) throw new NotFoundException('Block was not found.');

    return {
      id: block._id.toString(),
      blogId: block.blogId.toString(),
      type: block.type,
      value: block.value,
      position: block.position,
      metadata: block.metadata,
      createdAt: (block as any).createdAt,
      updatedAt: (block as any).updatedAt,
    };
  }

  async removeBlock(
    blogId: string,
    blockId: string,
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);
    if (!Types.ObjectId.isValid(blockId)) {
      throw new NotFoundException('Block was not found.');
    }

    const deleted = await this.blogBlockModel.deleteOne({
      _id: new Types.ObjectId(blockId),
      blogId: new Types.ObjectId(blogId),
    });

    if (deleted.deletedCount === 0) {
      throw new NotFoundException('Block was not found.');
    }
  }

  async reorderBlocks(
    blogId: string,
    blockIds: string[],
    currentUser: CurrentUser,
  ) {
    await this.findManageable(blogId, currentUser);

    const existing = await this.blogBlockModel
      .find({ blogId: new Types.ObjectId(blogId) })
      .select({ _id: 1 })
      .lean();

    const existingIds = new Set(existing.map((block) => block._id.toString()));
    if (
      existingIds.size !== blockIds.length ||
      blockIds.some((id) => !existingIds.has(id))
    ) {
      throw new ConflictException('Stale blocks list. Please refresh.');
    }

    for (const [position, blockId] of blockIds.entries()) {
      await this.blogBlockModel.updateOne(
        { _id: new Types.ObjectId(blockId) },
        { $set: { position } },
      );
    }

    return this.getBlocks(blogId);
  }

  // ==========================================
  // Private Helper Utilities
  // ==========================================

  private async resolveAuthorId(
    requested: string | null | undefined,
    currentUser: CurrentUser,
  ) {
    if (!requested || requested === currentUser.id) return currentUser.id;
    if (!Types.ObjectId.isValid(requested)) return currentUser.id;
    const author = await this.userModel
      .findById(requested)
      .select({ _id: 1, role: 1 })
      .lean();
    if (!author || (author.role !== 'admin' && author.role !== 'editor')) {
      return currentUser.id;
    }
    return author._id.toString();
  }

  private async findManageable(id: string, currentUser: CurrentUser) {
    this.assertCanWrite(currentUser);
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Blog was not found.');
    }

    const blog = await this.blogModel.findById(id).lean();

    if (!blog) throw new NotFoundException('Blog was not found.');
    const authorIdStr = blog.authorId.toString();
    if (currentUser.role !== 'admin' && authorIdStr !== currentUser.id) {
      throw new ForbiddenException('You cannot manage this blog.');
    }

    return {
      id: blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      description: blog.description ?? null,
      coverImage: blog.coverImage ?? null,
      imageAlt: blog.imageAlt ?? null,
      imageCaption: blog.imageCaption ?? null,
      categoryId: blog.categoryId ? blog.categoryId.toString() : null,
      metaTitle: blog.metaTitle ?? null,
      metaDescription: blog.metaDescription ?? null,
      canonicalUrl: blog.canonicalUrl ?? null,
      noindex: blog.noindex ?? false,
      language: blog.language,
      translationGroupId: blog.translationGroupId ?? null,
      status: blog.status,
      publishedAt: blog.publishedAt ?? null,
      scheduledAt: blog.scheduledAt ?? null,
      version: blog.version,
      authorId: authorIdStr,
      createdAt: (blog as any).createdAt,
      updatedAt: (blog as any).updatedAt,
    };
  }

  private async getBlocks(blogId: string) {
    const blocks = await this.blogBlockModel
      .find({ blogId: new Types.ObjectId(blogId) })
      .sort({ position: 1 })
      .lean();
    return blocks.map((b: any) => ({
      id: b._id.toString(),
      blogId: b.blogId.toString(),
      type: b.type,
      value: b.value,
      position: b.position,
      metadata: b.metadata ?? null,
    }));
  }

  private async getBlogTags(blogId: string) {
    const list = await this.blogTagModel
      .find({ blogId: new Types.ObjectId(blogId) })
      .populate<{ tagId: TagDocument }>('tagId')
      .lean();
    return (list as any[])
      .filter((item) => item.tagId)
      .map((item) => ({
        id: item.tagId._id.toString(),
        name: item.tagId.name,
        slug: item.tagId.slug,
      }));
  }

  private async getBlogCategories(blogId: string) {
    const list = await this.blogCategoryModel
      .find({ blogId: new Types.ObjectId(blogId) })
      .populate<{ categoryId: CategoryDocument }>('categoryId')
      .lean();
    return (list as any[])
      .filter((item) => item.categoryId)
      .map((item) => ({
        id: item.categoryId._id.toString(),
        name: item.categoryId.name,
        slug: item.categoryId.slug,
        description: item.categoryId.description ?? null,
      }));
  }

  private async syncTags(
    blogId: string,
    tagIds: string[],
    session?: ClientSession,
  ) {
    const blogObjectId = new Types.ObjectId(blogId);
    await this.blogTagModel.deleteMany({ blogId: blogObjectId }, { session });
    if (tagIds.length > 0) {
      const docs = tagIds
        .filter((tid) => Types.ObjectId.isValid(tid))
        .map((tid) => ({
          blogId: blogObjectId,
          tagId: new Types.ObjectId(tid),
        }));
      if (docs.length > 0) {
        await this.blogTagModel.insertMany(docs, { session });
      }
    }
  }

  private async syncCategories(
    blogId: string,
    categoryIds: string[],
    session?: ClientSession,
  ) {
    const blogObjectId = new Types.ObjectId(blogId);
    await this.blogCategoryModel.deleteMany({ blogId: blogObjectId }, { session });
    if (categoryIds.length > 0) {
      const docs = categoryIds
        .filter((cid) => Types.ObjectId.isValid(cid))
        .map((cid) => ({
          blogId: blogObjectId,
          categoryId: new Types.ObjectId(cid),
        }));
      if (docs.length > 0) {
        await this.blogCategoryModel.insertMany(docs, { session });
      }
    }
  }

  private async insertBlocks(
    blogId: string,
    blocks: CreateBlockInput[],
    session?: ClientSession,
  ) {
    if (blocks.length === 0) return [];
    const blogObjectId = new Types.ObjectId(blogId);
    const docs = blocks.map((b, position) => ({
      blogId: blogObjectId,
      type: b.type,
      value: b.value ?? '',
      position,
      metadata: b.metadata ?? null,
    }));
    const created = await this.blogBlockModel.insertMany(docs, { session });
    return created.map((b: any) => ({
      id: b._id.toString(),
      blogId: b.blogId.toString(),
      type: b.type,
      value: b.value,
      position: b.position,
      metadata: b.metadata ?? null,
    }));
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
      await createBlogPublishedNotification(this.notificationModel, {
        blogId: blog.id,
        title: blog.title,
        href: `/${blog.slug}`,
      });
    } catch (error) {
      console.error('Failed to create blog notification', error);
    }
  }

  private async isSlugAvailable(slug: string, excludeId?: string, language?: string) {
    const where: any = { slug };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      where._id = { $ne: new Types.ObjectId(excludeId) };
    }
    if (language) {
      where.language = language;
    }
    const existing = await this.blogModel.findOne(where).select({ _id: 1 }).lean();
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

    let translationGroupId = source.translationGroupId;
    if (!translationGroupId) {
      translationGroupId = crypto.randomUUID();
      await this.blogModel.updateOne(
        { _id: new Types.ObjectId(source.id) },
        { $set: { translationGroupId } },
      );
    }

    const existingTranslation = await this.blogModel
      .findOne({
        translationGroupId,
        language: targetLanguage,
      })
      .select({ _id: 1, slug: 1 })
      .lean();

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
      description: source.description || undefined,
      targetLanguage,
      blocks: sourceBlocks,
      htmlContent: source.htmlContent,
      metaTitle: source.metaTitle || undefined,
      metaDescription: source.metaDescription || undefined,
      imageAlt: source.imageAlt || undefined,
    });

    const sharedSlug = source.slug;
    const tagIds = (source.tags || []).map((t: any) => t.id);

    return this.create(
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

  async generateImageMeta(
    input: {
      articleTitle?: string;
      sectionHeading?: string;
      contextText?: string;
      language?: string;
    },
    currentUser: CurrentUser,
  ) {
    this.assertCanWrite(currentUser);
    return this.gemini.generateImageMeta(input);
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

    const sharedSlug = input.english.slug || input.hinglish.slug;
    input.hinglish.slug = sharedSlug;
    input.english.slug = sharedSlug;

    let hinglishHtml = input.hinglish.htmlContent || input.hinglish.markdown || '';
    if (hinglishHtml === '[object Promise]') hinglishHtml = input.hinglish.markdown || '';
    let englishHtml = input.english.htmlContent || input.english.markdown || '';
    if (englishHtml === '[object Promise]') englishHtml = input.english.markdown || '';

    let hBlocks = htmlToBlocks(hinglishHtml);
    let eBlocks = htmlToBlocks(englishHtml);
    hBlocks = syncImageBlocks(hBlocks, eBlocks);
    eBlocks = syncImageBlocks(eBlocks, hBlocks);
    hinglishHtml = blocksToHtml(hBlocks);
    englishHtml = blocksToHtml(eBlocks);

    if (translationGroupId) {
      const existingInGroup = await this.blogModel
        .find({ translationGroupId })
        .select({ _id: 1, language: 1 })
        .lean();

      for (const item of existingInGroup) {
        if (item.language === 'HINGLISH' && !input.hinglish.id) {
          input.hinglish.id = item._id.toString();
        }
        if (item.language === 'ENGLISH' && !input.english.id) {
          input.english.id = item._id.toString();
        }
      }
    }

    if (!input.hinglish.id && sharedSlug) {
      const existingHinglish = await this.blogModel
        .findOne({
          slug: sharedSlug,
          language: 'HINGLISH',
          authorId: new Types.ObjectId(currentUser.id),
        })
        .select({ _id: 1 })
        .lean();
      if (existingHinglish) {
        input.hinglish.id = existingHinglish._id.toString();
      }
    }

    if (!input.english.id && sharedSlug) {
      const existingEnglish = await this.blogModel
        .findOne({
          slug: sharedSlug,
          language: 'ENGLISH',
          authorId: new Types.ObjectId(currentUser.id),
        })
        .select({ _id: 1 })
        .lean();
      if (existingEnglish) {
        input.english.id = existingEnglish._id.toString();
      }
    }

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
    if (
      (error as { code?: number | string })?.code === 11000 ||
      (error as { code?: number | string })?.code === 'P2002'
    ) {
      throw new ConflictException('This blog slug is already in use.');
    }
    throw error;
  }
}
