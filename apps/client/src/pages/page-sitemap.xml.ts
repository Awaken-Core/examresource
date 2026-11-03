import type { APIRoute } from 'astro';
import { siteUrl } from '../data/site';

export const GET: APIRoute = () => {
  return new Response(null, {
    status: 301,
    headers: {
      Location: `${siteUrl}/sitemap.xml`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
