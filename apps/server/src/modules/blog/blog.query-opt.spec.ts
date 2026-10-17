import { describe, it, expect, vi } from 'vitest';
import { BlogService } from './blog.service.js';
import { db } from '../../core/config/db.js';

describe('BlogService listPublished Query Optimization & Invariants', () => {
  it('should immediately return empty array when baseQuery returns 0 rows', async () => {
    const service = new BlogService();
    
    // Mock baseQuery returning []
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      }),
    });

    vi.spyOn(db, 'select').mockImplementation(mockSelect as any);

    const result = await service.listPublished({ limit: 10 });
    expect(result).toEqual([]);
    // Ensure only 1 query (baseQuery) was executed
    expect(mockSelect).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it('should eliminate redundant Query 4 and construct group images using in-memory mappings', async () => {
    const service = new BlogService();

    const mockRows = [
      {
        id: 'blog-1',
        title: 'Article 1',
        translationGroupId: 'group-1',
        coverImage: null,
        category: { id: 'c1', name: 'SSC' },
      },
    ];

    const mockSiblingBlogs = [
      { id: 'blog-2', translationGroupId: 'group-1' },
    ];

    const mockImageBlocks = [
      { blogId: 'blog-2', value: 'https://r2/blog2-image.jpg', position: 1 },
    ];

    const mockCatRows = [
      { blogId: 'blog-1', id: 'c1', name: 'SSC', slug: 'ssc' },
    ];

    let queryCount = 0;
    const queriesCalled: string[] = [];

    vi.spyOn(db, 'select').mockImplementation((fields?: any) => {
      queryCount++;
      return {
        from: (table: any) => {
          const tableName = table?.dbName || table?._?.name || 'unknown';
          queriesCalled.push(tableName);
          return {
            innerJoin: () => ({
              leftJoin: () => ({
                where: () => ({
                  orderBy: () => ({
                    limit: () => ({
                      offset: () => Promise.resolve(mockRows),
                    }),
                  }),
                }),
              }),
              where: () => Promise.resolve(mockCatRows),
            }),
            where: (condition: any) => {
              if (queryCount === 2) {
                // Sibling blogs query
                return Promise.resolve(mockSiblingBlogs);
              }
              return {
                orderBy: () => Promise.resolve(mockImageBlocks),
              };
            },
          } as any;
        },
      } as any;
    });

    const result = await service.listPublished({ limit: 10 });

    expect(result).toHaveLength(1);
    // Verified that firstImage fell back to sibling translation group image!
    expect(result[0].firstImage).toBe('https://r2/blog2-image.jpg');
    expect(result[0].categories).toHaveLength(1);

    // Verify Query 4 is NOT in queriesCalled:
    // Only baseQuery, siblingBlogs, imageBlocks, and catRows were invoked!
    expect(queryCount).toBe(4); // 1 base + 1 sibling + 2 parallel (imageBlocks & catRows)
    // Previously queryCount was 5 because Query 4 executed a redundant select on blogs.
    vi.restoreAllMocks();
  });
});
