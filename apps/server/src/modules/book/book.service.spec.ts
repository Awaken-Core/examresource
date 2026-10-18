import { describe, expect, it, vi } from 'vitest';
import { BookService } from './book.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

describe('BookService', () => {
  const mockBookModel: any = {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };

  const service = new BookService(mockBookModel);

  const studentUser: CurrentUser = {
    id: '65f1a2b3c4d5e6f7a8b9c0d1',
    name: 'Student',
    email: 'student@example.com',
    phone: null,
    role: 'student',
    emailVerified: true,
  };

  const editorUser: CurrentUser = {
    id: '65f1a2b3c4d5e6f7a8b9c0d2',
    name: 'Editor',
    email: 'editor@example.com',
    phone: null,
    role: 'editor',
    emailVerified: true,
  };

  it('rejects create from student user with ForbiddenException', async () => {
    await expect(
      service.create(
        {
          title: 'Test Book',
          description: 'Desc',
          coverImage: 'https://example.com/cover.png',
          relatedCovers: [],
          displayPrice: 500,
          price: 300,
          discount: 40,
          tags: ['exam'],
          publishedAt: new Date(),
          isArchived: false,
        },
        studentUser,
      ),
    ).rejects.toThrow('Editor access is required.');
  });

  it('allows editor to create book', async () => {
    const fakeBookDoc = {
      _id: { toString: () => '65f1a2b3c4d5e6f7a8b9c0d9' },
      title: 'Editor Book',
      description: 'Desc',
      coverImage: 'https://example.com/cover.png',
      relatedCovers: [],
      displayPrice: 500,
      price: 300,
      discount: 40,
      tags: ['exam'],
      publishedAt: new Date(),
      author: null,
      originalPublisher: null,
      entryBy: { toString: () => editorUser.id },
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: () => fakeBookDoc,
    };

    mockBookModel.create.mockResolvedValue(fakeBookDoc);

    const result = await service.create(
      {
        title: 'Editor Book',
        description: 'Desc',
        coverImage: 'https://example.com/cover.png',
        relatedCovers: [],
        displayPrice: 500,
        price: 300,
        discount: 40,
        tags: ['exam'],
        publishedAt: new Date(),
        isArchived: false,
      },
      editorUser,
    );

    expect(result.id).toBe('65f1a2b3c4d5e6f7a8b9c0d9');
    expect(result.title).toBe('Editor Book');
  });
});
