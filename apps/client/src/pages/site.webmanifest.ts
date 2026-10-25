import type { APIRoute } from 'astro';
import { siteName, siteDomain } from '../data/site';

export const prerender = false;

export const GET: APIRoute = () => {
  const manifest = {
    name: siteDomain,
    short_name: siteName,
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#FF4D00',
    background_color: '#ffffff',
    display: 'standalone',
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
