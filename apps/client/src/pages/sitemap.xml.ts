import type { APIRoute } from 'astro';
import { API_URL } from '../lib/api';

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeCdata(str: string): string {
  if (!str) return '';
  return str.replace(/]]>/g, ']]]]><![CDATA[>');
}

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  const siteName = import.meta.env.PUBLIC_SITE_NAME;
  const currentDate = new Date().toISOString().split('T')[0];

  let sitemapEntries: any[] = [];
  let categories: any[] = [];

  try {
    const [entriesRes, catRes] = await Promise.all([
      fetch(`${API_URL}/sitemap-entries`, { signal: AbortSignal.timeout(6000) }).catch(() => null),
      fetch(`${API_URL}/categories`, { signal: AbortSignal.timeout(6000) }).catch(() => null),
    ]);

    if (entriesRes && entriesRes.ok) {
      sitemapEntries = await entriesRes.json();
    } else {
      // Fallback to /blogs if sitemap-entries fails
      const blogRes = await fetch(`${API_URL}/blogs?limit=200`, { signal: AbortSignal.timeout(6000) }).catch(() => null);
      if (blogRes && blogRes.ok) {
        sitemapEntries = await blogRes.json();
      }
    }

    if (catRes && catRes.ok) {
      categories = await catRes.json();
    }
  } catch (e) {
    sitemapEntries = [];
  }

  // Core Static URLs
  const staticUrls: { loc: string; lastmod: string; changefreq: string; priority: string; image?: { loc: string; title: string } }[] = [
    {
      loc: `${siteUrl}/`,
      changefreq: 'daily',
      priority: '1.0',
      lastmod: currentDate,
      image: {
        loc: `${siteUrl}/og-image.jpg`,
        title: `${siteName} | Government Exam Updates & Sarkari Jobs`,
      },
    },
    { loc: `${siteUrl}/privacy-policy`, changefreq: 'monthly', priority: '0.4', lastmod: currentDate },
    { loc: `${siteUrl}/terms-of-service`, changefreq: 'monthly', priority: '0.4', lastmod: currentDate },
    { loc: `${siteUrl}/contact-us`, changefreq: 'monthly', priority: '0.5', lastmod: currentDate },
    { loc: `${siteUrl}/sitemap`, changefreq: 'weekly', priority: '0.7', lastmod: currentDate },
  ];

  if (Array.isArray(categories) && categories.length > 0) {
    for (const c of categories) {
      if (!c?.slug) continue;
      staticUrls.push({
        loc: `${siteUrl}/category/${c.slug}`,
        changefreq: 'daily',
        priority: '0.85',
        lastmod: currentDate,
      });
    }
  }

  // Known fallback articles to guarantee crawler coverage if API is offline
  const fallbackSlugs = [
    'mp-police-constable-driver-recruitment-2026',
    'upessc-prt-assistant-teacher-recruitment-2026',
    'rrb-ntpc-undergraduate-recruitment-2026',
    'rrb-ntpc-graduate-recruitment-2026',
    'bhel-artisan-recruitment-2026',
    'afcat-2-2026-notification-exam-date-eligibility',
    'up-polytechnic-jeecup-2027-application-form',
    'fifa-world-cup-2026-standings-points-table-results',
  ];

  const seenUrls = new Set<string>(staticUrls.map((u) => u.loc));
  const dynamicUrls: { loc: string; lastmod: string; changefreq: string; priority: string; image?: { loc: string; title: string } }[] = [];

  if (Array.isArray(sitemapEntries) && sitemapEntries.length > 0) {
    for (const post of sitemapEntries) {
      if (!post.slug || post.noindex) continue;
      const cleanSlug = String(post.slug)
        .replace(/^\//, '')
        .replace(/-(english|hinglish)$/i, '');
      const loc = `${siteUrl}/${cleanSlug}`;
      if (!seenUrls.has(loc)) {
        seenUrls.add(loc);
        const imgUrl = post.coverImage || post.firstImage || null;
        dynamicUrls.push({
          loc,
          lastmod: post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : currentDate,
          changefreq: 'weekly',
          priority: '0.9',
          image: imgUrl
            ? {
                loc: imgUrl.startsWith('http') ? imgUrl : `${siteUrl}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`,
                title: post.title || `${siteName} Notification`,
              }
            : undefined,
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
          priority: '0.9',
        });
      }
    }
  }

  const allUrls = [...staticUrls, ...dynamicUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>${
      u.image
        ? `\n    <image:image>
      <image:loc>${escapeXml(u.image.loc)}</image:loc>
      <image:title><![CDATA[${safeCdata(u.image.title)}]]></image:title>
    </image:image>`
        : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};

