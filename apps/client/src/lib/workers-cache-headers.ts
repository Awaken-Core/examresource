/**
 * Translate Astro Cache-Control (s-maxage + SWR) into headers that
 * Cloudflare Workers Cache honors for edge HITs without browser caching.
 *
 * Workers Cache uses max-age (not s-maxage) for freshness + SWR.
 * Prefer CDN-Cache-Control for edge TTL while keeping Cache-Control max-age=0
 * for browsers. See https://developers.cloudflare.com/workers/cache/
 */
export function applyWorkersCacheHeaders(response: Response): Response {
  const cacheControl = response.headers.get('Cache-Control');
  if (!cacheControl) return response;

  const lower = cacheControl.toLowerCase();
  if (
    lower.includes('private') ||
    lower.includes('no-store') ||
    (lower.includes('no-cache') && !lower.includes('s-maxage='))
  ) {
    return response;
  }

  if (
    response.headers.has('CDN-Cache-Control') ||
    response.headers.has('Cloudflare-CDN-Cache-Control')
  ) {
    return response;
  }

  const sMaxAge = /(?:^|,\s*)s-maxage=(\d+)/i.exec(cacheControl)?.[1];
  if (!sMaxAge) return response;

  const browserMaxAge = /(?:^|,\s*)max-age=(\d+)/i.exec(cacheControl)?.[1] ?? '0';
  const swr = /(?:^|,\s*)stale-while-revalidate=(\d+)/i.exec(cacheControl)?.[1];

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `public, max-age=${browserMaxAge}`);

  const edge = [`public`, `max-age=${sMaxAge}`];
  if (swr) edge.push(`stale-while-revalidate=${swr}`);
  headers.set('CDN-Cache-Control', edge.join(', '));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
