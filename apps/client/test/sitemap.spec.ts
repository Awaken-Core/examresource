import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET as getSitemapXml } from '../src/pages/sitemap.xml';
import { GET as getSitemapIndexXml } from '../src/pages/sitemap_index.xml';
import { GET as getPostSitemapXml } from '../src/pages/post-sitemap.xml';
import { GET as getCategorySitemapXml } from '../src/pages/category-sitemap.xml';
import { GET as getPageSitemapXml } from '../src/pages/page-sitemap.xml';
import { GET as getRobotsTxt } from '../src/pages/robots.txt';
import { siteUrl } from '../src/data/site';

describe('Sitemap & Robots Discovery Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Mock API fetch responses for sitemap generation
    globalThis.fetch = vi.fn((input: any) => {
      const url = String(input);
      if (url.includes('/sitemap-entries')) {
        return Promise.resolve(new Response(JSON.stringify([
          {
            title: 'SSC CGL 2026 Notification & Tier 1 Exam Date',
            slug: 'ssc-cgl-2026-notification',
            language: 'HINGLISH',
            categorySlug: 'ssc',
            updatedAt: '2026-03-01T10:00:00.000Z',
            coverImage: 'https://cdn.example.com/ssc-cgl-2026.webp',
            noindex: false,
          },
          {
            title: 'RRB NTPC Graduate Level Vacancy Guide',
            slug: 'rrb-ntpc-graduate-recruitment-2026-english',
            language: 'ENGLISH',
            categorySlug: 'railways',
            updatedAt: '2026-03-02T12:00:00.000Z',
            coverImage: '/uploads/rrb-ntpc.webp',
            noindex: false,
          },
          {
            title: 'Draft Hidden Notice',
            slug: 'draft-hidden-notice',
            noindex: true,
          }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }

      if (url.includes('/categories')) {
        return Promise.resolve(new Response(JSON.stringify([
          { name: 'Staff Selection Commission', slug: 'ssc' },
          { name: 'Railways', slug: 'railways' },
          { name: 'Banking', slug: 'banking' },
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }

      if (url.includes('/test-series')) {
        return Promise.resolve(new Response(JSON.stringify([
          {
            title: 'Quantitative Aptitude Master Series',
            slug: 'quantitative-aptitude-complete',
            status: 'published',
            updatedAt: '2026-03-01T08:00:00.000Z',
            logoUrl: 'https://cdn.example.com/qa-logo.png',
          },
          {
            title: 'Draft Unreleased Series',
            slug: 'draft-series',
            status: 'draft',
          }
        ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }

      return Promise.resolve(new Response('Not Found', { status: 404 }));
    }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('1. Primary sitemap.xml returns valid XML and includes all core platform routes', async () => {
    const res = await (getSitemapXml as any)({} as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toContain('public');

    const xml = await res.text();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');

    // Verify core static routes
    expect(xml).toContain(`<loc>${siteUrl}/</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/blogs</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/latest-updates</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/test-series</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/daily-quiz</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/rank-predictor</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/pricing</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/sitemap</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/contact-us</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/privacy-policy</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/terms-of-service</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/refund-policy</loc>`);
  });

  it('2. Category routes are correctly rendered in sitemap.xml', async () => {
    const res = await (getSitemapXml as any)({} as any);
    const xml = await res.text();

    expect(xml).toContain(`<loc>${siteUrl}/category/ssc</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/category/railways</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/category/banking</loc>`);
  });

  it('3. Dynamic articles and images are formatted with Google Image Sitemap metadata', async () => {
    const res = await (getSitemapXml as any)({} as any);
    const xml = await res.text();

    // Cleaned slugs
    expect(xml).toContain(`<loc>${siteUrl}/ssc-cgl-2026-notification</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/rrb-ntpc-graduate-recruitment-2026</loc>`);
    
    // Noindex filtered out
    expect(xml).not.toContain('draft-hidden-notice');

    // Image tags & CDATA
    expect(xml).toContain('<image:image>');
    expect(xml).toContain('<image:loc>https://cdn.example.com/ssc-cgl-2026.webp</image:loc>');
    expect(xml).toContain('<![CDATA[SSC CGL 2026 Notification & Tier 1 Exam Date]]>');
    expect(xml).toContain(`<image:loc>${siteUrl}/uploads/rrb-ntpc.webp</image:loc>`);
  });

  it('4. Test series detail landing pages are included while draft tests are excluded', async () => {
    const res = await (getSitemapXml as any)({} as any);
    const xml = await res.text();

    expect(xml).toContain(`<loc>${siteUrl}/test-series/quantitative-aptitude-complete</loc>`);
    expect(xml).toContain('<image:loc>https://cdn.example.com/qa-logo.png</image:loc>');
    expect(xml).not.toContain('draft-series');
  });

  it('5. Fallback coverage protects sitemap when API endpoints fail', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down')) as any;

    const res = await (getSitemapXml as any)({} as any);
    expect(res.status).toBe(200);
    const xml = await res.text();

    // Core fallback categories
    expect(xml).toContain(`<loc>${siteUrl}/category/central-government</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/category/state-exams</loc>`);

    // Core fallback articles
    expect(xml).toContain(`<loc>${siteUrl}/mp-police-constable-driver-recruitment-2026</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/rrb-ntpc-graduate-recruitment-2026</loc>`);

    // Core fallback series
    expect(xml).toContain(`<loc>${siteUrl}/test-series/quantitative-aptitude-complete</loc>`);
  });

  it('6. sitemap_index.xml correctly points to primary sitemap.xml', async () => {
    const res = await (getSitemapIndexXml as any)({} as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');

    const xml = await res.text();
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain(`<loc>${siteUrl}/sitemap.xml</loc>`);
  });

  it('7. Legacy WordPress/plugin sitemaps redirect cleanly with HTTP 301 to sitemap.xml', async () => {
    const postRes = await (getPostSitemapXml as any)({} as any);
    expect(postRes.status).toBe(301);
    expect(postRes.headers.get('Location')).toBe(`${siteUrl}/sitemap.xml`);

    const catRes = await (getCategorySitemapXml as any)({} as any);
    expect(catRes.status).toBe(301);
    expect(catRes.headers.get('Location')).toBe(`${siteUrl}/sitemap.xml`);

    const pageRes = await (getPageSitemapXml as any)({} as any);
    expect(pageRes.status).toBe(301);
    expect(pageRes.headers.get('Location')).toBe(`${siteUrl}/sitemap.xml`);
  });

  it('8. robots.txt declares sitemaps and enforces private CBT route disallows', async () => {
    const res = await (getRobotsTxt as any)({} as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');

    const txt = await res.text();
    expect(txt).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
    expect(txt).toContain(`Sitemap: ${siteUrl}/sitemap_index.xml`);
    expect(txt).toContain(`Sitemap: ${siteUrl}/rss.xml`);

    expect(txt).toContain('Disallow: /admin');
    expect(txt).toContain('Disallow: /test-series/cbt/');
    expect(txt).toContain('Disallow: /test-series/instructions/');
    expect(txt).toContain('Disallow: /test-series/results/');
  });
});

