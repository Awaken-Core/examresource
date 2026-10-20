import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const siteUrl = import.meta.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  return new Response(null, {
    status: 301,
    headers: {
      Location: `${siteUrl}/sitemap.xml`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
