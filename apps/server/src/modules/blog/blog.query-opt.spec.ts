import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { BlogService } from './blog.service.js';

function createMockQuery(result: any) {
  const query: any = {
    sort: () => query,
    skip: () => query,
    limit: () => query,
    populate: () => query,
    select: () => query,
    lean: async () => result,
  };
  return query;
}

describe('BlogService listPublished Query Optimization & Invariants', () => {
  it('should immediately return empty array when base query returns 0 rows', async () => {
    const mockBlogModel = {
      find: () => createMockQuery([]),
    } as any;

    const service = new BlogService(
      mockBlogModel,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const result = await service.listPublished({ limit: 10 });
    expect(result).toEqual([]);
  });

  it('should resolve and map published articles with related image blocks and categories', async () => {
    const blog1Id = new Types.ObjectId();
    const blog2Id = new Types.ObjectId();
    const catId = new Types.ObjectId();
    const authorId = new Types.ObjectId();

    const mockBlogs = [
      {
        _id: blog1Id,
        title: 'Article 1',
        slug: 'article-1',
        language: 'HINGLISH',
        translationGroupId: 'group-1',
        description: 'Test description',
        coverImage: null,
        imageAlt: null,
        metaTitle: null,
        metaDescription: null,
        publishedAt: new Date(),
        scheduledAt: null,
        updatedAt: new Date(),
        categoryId: { _id: catId, name: 'SSC', slug: 'ssc' },
        authorId: { _id: authorId, name: 'Admin' },
      },
    ];

    const mockBlogModel = {
      find: (filter: any) => {
        if (filter?.translationGroupId) {
          return createMockQuery([{ _id: blog2Id, translationGroupId: 'group-1' }]);
        }
        return createMockQuery(mockBlogs);
      },
    } as any;

    const mockBlogBlockModel = {
      find: () =>
        createMockQuery([
          { blogId: blog2Id, value: 'https://r2/blog2-image.jpg', position: 1 },
        ]),
    } as any;

    const mockBlogCategoryModel = {
      find: () =>
        createMockQuery([
          {
            blogId: blog1Id,
            categoryId: { _id: catId, name: 'SSC', slug: 'ssc' },
          },
        ]),
    } as any;

    const service = new BlogService(
      mockBlogModel,
      mockBlogBlockModel,
      {} as any,
      {} as any,
      {} as any,
      mockBlogCategoryModel,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const result = await service.listPublished({ limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0].firstImage).toBe('https://r2/blog2-image.jpg');
    expect(result[0].categories).toHaveLength(1);
  });
});

describe('BlogService getPublished Deterministic Slug Resolution & Regression', () => {
  const catId = new Types.ObjectId();
  const authorId = new Types.ObjectId();

  function buildBlogDoc(overrides: Partial<any>) {
    return {
      _id: new Types.ObjectId(),
      title: 'Default Title',
      slug: 'default-slug',
      language: 'HINGLISH',
      translationGroupId: 'group-1',
      description: 'Desc',
      coverImage: null,
      imageAlt: null,
      imageCaption: null,
      metaTitle: null,
      metaDescription: null,
      canonicalUrl: null,
      noindex: false,
      publishedAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      categoryId: { _id: catId, name: 'SSC', slug: 'ssc' },
      authorId: { _id: authorId, name: 'Admin' },
      ...overrides,
    };
  }

  function setupService(candidateList: any[], redirectTarget: any = null) {
    const mockBlogModel = {
      find: (filter: any) => {
        if (filter?.slug?.$in) {
          const inList: string[] = filter.slug.$in;
          const matched = candidateList.filter((b) => inList.includes(b.slug));
          return createMockQuery(matched);
        }
        return createMockQuery([]);
      },
      findOne: (filter: any) => {
        if (filter?.translationGroupId) {
          const match = candidateList.find(
            (b) =>
              b.translationGroupId === filter.translationGroupId &&
              (!filter.language || b.language === filter.language) &&
              (!filter._id?.$ne || b._id.toString() !== filter._id.$ne.toString()),
          );
          return createMockQuery(match || null);
        }
        return createMockQuery(null);
      },
    } as any;

    const mockBlockModel = {
      find: () => createMockQuery([]),
    } as any;

    const mockCategoryModel = {
      find: () => createMockQuery([]),
    } as any;

    const mockTagModel = {
      find: () => createMockQuery([]),
    } as any;

    const mockRedirectModel = {
      findOne: () => createMockQuery(redirectTarget),
    } as any;

    return new BlogService(
      mockBlogModel,
      mockBlockModel,
      {} as any,
      {} as any,
      {} as any,
      mockCategoryModel,
      mockTagModel,
      mockRedirectModel,
      {} as any,
      {} as any,
      {} as any,
    );
  }

  it('1. Exact clean slug: returns exact matching article and requested language', async () => {
    const blogHinglish = buildBlogDoc({ slug: 'ssc-cgl-exam', language: 'HINGLISH', title: 'SSC CGL Hinglish' });
    const blogEnglish = buildBlogDoc({ slug: 'ssc-cgl-exam-english', language: 'ENGLISH', title: 'SSC CGL English' });
    const service = setupService([blogHinglish, blogEnglish]);

    const result = await service.getPublished('ssc-cgl-exam', 'HINGLISH');
    expect(result.title).toBe('SSC CGL Hinglish');
    expect(result.language).toBe('HINGLISH');
  });

  it('2. Legacy suffixed slug: resolves directly without wrong-post mismatch', async () => {
    const blogEnglish = buildBlogDoc({ slug: 'ssc-cgl-exam-english', language: 'ENGLISH', title: 'SSC CGL English' });
    const service = setupService([blogEnglish]);

    const result = await service.getPublished('ssc-cgl-exam-english', 'ENGLISH');
    expect(result.title).toBe('SSC CGL English');
    expect(result.language).toBe('ENGLISH');
  });

  it('3. Both variants existing simultaneously: exact slug takes precedence, preventing wrong post', async () => {
    const articleClean = buildBlogDoc({
      slug: 'ssc-cgl-exam',
      language: 'ENGLISH',
      translationGroupId: 'group-A',
      title: 'Target Post A Clean',
    });
    const articleLegacy = buildBlogDoc({
      slug: 'ssc-cgl-exam-english',
      language: 'ENGLISH',
      translationGroupId: 'group-B',
      title: 'Unrelated Legacy Post B',
    });
    // Regardless of order returned by $in
    const service = setupService([articleLegacy, articleClean]);

    const resClean = await service.getPublished('ssc-cgl-exam', 'ENGLISH');
    expect(resClean.title).toBe('Target Post A Clean');

    const resLegacy = await service.getPublished('ssc-cgl-exam-english', 'ENGLISH');
    expect(resLegacy.title).toBe('Unrelated Legacy Post B');
  });

  it('4. Both languages existing: translates sibling via translationGroupId when requested', async () => {
    const hinglish = buildBlogDoc({
      slug: 'upsc-strategy',
      language: 'HINGLISH',
      translationGroupId: 'group-upsc',
      title: 'UPSC Strategy in Hinglish',
    });
    const english = buildBlogDoc({
      slug: 'upsc-strategy-english',
      language: 'ENGLISH',
      translationGroupId: 'group-upsc',
      title: 'UPSC Strategy in English',
    });
    const service = setupService([hinglish, english]);

    const resEn = await service.getPublished('upsc-strategy', 'ENGLISH');
    expect(resEn.title).toBe('UPSC Strategy in English');
    expect(resEn.language).toBe('ENGLISH');
  });

  it('5. Missing slug: throws NotFoundException or handles redirect', async () => {
    const service = setupService([]);
    await expect(service.getPublished('non-existent-slug')).rejects.toThrow('Blog was not found.');
  });

  it('6. Duplicate candidate matches: deterministic selection does not return random candidate', async () => {
    const cand1 = buildBlogDoc({ slug: 'railway-alp', language: 'HINGLISH', title: 'Railway Candidate 1' });
    const cand2 = buildBlogDoc({ slug: 'railway-alp', language: 'HINGLISH', title: 'Railway Candidate 2' });
    const service = setupService([cand1, cand2]);

    const res1 = await service.getPublished('railway-alp', 'HINGLISH');
    const res2 = await service.getPublished('railway-alp', 'HINGLISH');
    expect(res1.title).toBe(res2.title);
  });
});
