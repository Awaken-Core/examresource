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
