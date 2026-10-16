import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://govtpariksha.com';

  let sitemapEntries: any[] = [];
  try {
    const res = await fetch(`${API_URL}/sitemap-entries`);
    if (res.ok) {
      sitemapEntries = await res.json();
    }
  } catch (e) {}

  const staticUrls = [
    { loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0' },
  ];

  const dynamicUrls = sitemapEntries.map((post) => {
    return {
      loc: `${siteUrl}/${post.slug}`,
      lastmod: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.8',
    };
  });

  const allUrls = [...staticUrls, ...dynamicUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
