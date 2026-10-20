import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => {
  const siteUrl = import.meta.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  const siteDomain = import.meta.env.PUBLIC_SITE_DOMAIN;
  const siteName = import.meta.env.PUBLIC_SITE_NAME;

  const catalog = {
    specVersion: '1.0',
    host: {
      domain: siteDomain,
      name: siteName,
    },
    entries: [
      {
        id: 'llms-manifest',
        type: 'llms-txt',
        url: `${siteUrl}/llms.txt`,
        description: `Concise LLM knowledge manifest for ${siteName} government examination notifications, admit cards, and results.`,
      },
      {
        id: 'llms-full',
        type: 'llms-txt',
        url: `${siteUrl}/llms-full.txt`,
        description: `Comprehensive LLM knowledge document with recruitment portal references and official commission details for ${siteName}.`,
      },
      {
        id: 'rss-feed',
        type: 'feed',
        url: `${siteUrl}/rss.xml`,
        description: `Real-time RSS 2.0 feed of newly published government exam updates and notifications.`,
      },
      {
        id: 'search-api',
        type: 'api',
        url: `${siteUrl}/api/search`,
        description: `Fast search endpoint for government examinations, notifications, and admit cards.`,
      },
      {
        id: 'sitemap-xml',
        type: 'sitemap',
        url: `${siteUrl}/sitemap.xml`,
        description: `Complete XML index of all published recruitment articles and categories on ${siteName}.`,
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
};
