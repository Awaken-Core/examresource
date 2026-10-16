import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || 'https://govtpariksha.com').replace(/\/$/, '');

  let sitemapEntries: any[] = [];
  try {
    const res = await fetch(`${API_URL}/sitemap-entries`);
    if (res.ok) {
      sitemapEntries = await res.json();
    }
  } catch (e) {
    sitemapEntries = [];
  }

  const currentDate = new Date().toISOString().split('T')[0];

  // Core Static URLs
  const staticUrls = [
    { loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0', lastmod: currentDate },
    { loc: `${siteUrl}/blog/central-government`, changefreq: 'daily', priority: '0.8', lastmod: currentDate },
    { loc: `${siteUrl}/blog/state-exams`, changefreq: 'daily', priority: '0.8', lastmod: currentDate },
    { loc: `${siteUrl}/blog/banking`, changefreq: 'daily', priority: '0.8', lastmod: currentDate },
    { loc: `${siteUrl}/blog/ssc-railways`, changefreq: 'daily', priority: '0.8', lastmod: currentDate },
    { loc: `${siteUrl}/blog/teaching`, changefreq: 'daily', priority: '0.8', lastmod: currentDate },
    { loc: `${siteUrl}/blog/defence`, changefreq: 'daily', priority: '0.8', lastmod: currentDate },
  ];

  // Known fallback articles to guarantee crawler coverage if API is offline
  const fallbackSlugs = [
    'mp-police-constable-driver-recruitment-2026',
    'upessc-prt-assistant-teacher-recruitment-2026-english',
  ];

  const seenUrls = new Set<string>(staticUrls.map(u => u.loc));
  const dynamicUrls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

  if (Array.isArray(sitemapEntries) && sitemapEntries.length > 0) {
    for (const post of sitemapEntries) {
      if (!post.slug) continue;
      const cleanSlug = post.slug.replace(/^\//, '');
      const loc = `${siteUrl}/${cleanSlug}`;
      if (!seenUrls.has(loc)) {
        seenUrls.add(loc);
        dynamicUrls.push({
          loc,
          lastmod: post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : currentDate,
          changefreq: 'weekly',
          priority: '0.8',
        });
      }
    }
  } else {
    for (const slug of fallbackSlugs) {
      const loc = `${siteUrl}/${slug}`;
      if (!seenUrls.has(loc)) {
        seenUrls.add(loc);
        dynamicUrls.push({
          loc,
          lastmod: currentDate,
          changefreq: 'weekly',
          priority: '0.8',
        });
      }
    }
  }

  const allUrls = [...staticUrls, ...dynamicUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
