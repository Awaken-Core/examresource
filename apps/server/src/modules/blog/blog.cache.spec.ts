import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('BlogController Public Cache-Control & Security Headers', () => {
  let app: INestApplication;

  const mockBlogService = {
    listPublished: () => Promise.resolve([{ id: '1', title: 'Test Article' }]),
    getPublished: (slug: string) => Promise.resolve({ id: '1', slug, title: 'Article Detail' }),
    listCategories: () => Promise.resolve([{ id: 'c1', name: 'Banking' }]),
    listTags: () => Promise.resolve([{ id: 't1', name: 'Admit Card' }]),
    getSitemapEntries: () => Promise.resolve([{ url: 'https://example.com/test' }]),
    checkRedirect: (path: string) => Promise.resolve({ targetPath: '/canonical' }),
    listManageable: () => Promise.resolve({ data: [{ id: 'admin-1', title: 'Draft' }] }),
  };

  const mockAuthService = {
    requireUser: () => Promise.resolve({ id: 'user-1', email: 'admin@example.com', role: 'admin' }),
    getUser: () => Promise.resolve({ id: 'user-1', email: 'admin@example.com', role: 'admin' }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [
        { provide: BlogService, useValue: mockBlogService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/blogs should have public Cache-Control with s-maxage=120 and stale-while-revalidate=300', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/blogs');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe(
      'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
    );
  });

  it('GET /api/v1/blogs/:slug should have public Cache-Control with s-maxage=300 and stale-while-revalidate=600', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/blogs/upsc-2026');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe(
      'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
    );
  });

  it('GET /api/v1/categories should have public Cache-Control with s-maxage=600 and stale-while-revalidate=1800', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe(
      'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
    );
  });

  it('GET /api/v1/tags should have public Cache-Control with s-maxage=600 and stale-while-revalidate=1800', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe(
      'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
    );
  });

  it('GET /api/v1/sitemap-entries should have public Cache-Control with s-maxage=1800 and stale-while-revalidate=3600', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/sitemap-entries');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe(
      'public, max-age=600, s-maxage=1800, stale-while-revalidate=3600',
    );
  });

  it('GET /api/v1/redirects/check should have public Cache-Control with s-maxage=600', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/redirects/check?path=/old');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe(
      'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
    );
  });

  it('GET /api/v1/me/blogs (authenticated admin route) must NEVER have public Cache-Control', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me/blogs');
    // Ensure no public caching is leaked to authenticated responses
    const cacheHeader = res.headers['cache-control'] || '';
    expect(cacheHeader).not.toContain('public');
    expect(cacheHeader).not.toContain('s-maxage');
  });
});
