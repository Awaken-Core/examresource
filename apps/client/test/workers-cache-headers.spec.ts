import { describe, expect, it } from 'vitest';
import { applyWorkersCacheHeaders } from '../src/lib/workers-cache-headers';

function html(cacheControl: string, extra?: HeadersInit) {
  return new Response('<html></html>', {
    status: 200,
    headers: { 'Content-Type': 'text/html', 'Cache-Control': cacheControl, ...extra },
  });
}

describe('applyWorkersCacheHeaders', () => {
  it('moves s-maxage + SWR onto CDN-Cache-Control', () => {
    const out = applyWorkersCacheHeaders(
      html('public, max-age=0, s-maxage=300, stale-while-revalidate=900'),
    );
    expect(out.headers.get('Cache-Control')).toBe('public, max-age=0');
    expect(out.headers.get('CDN-Cache-Control')).toBe(
      'public, max-age=300, stale-while-revalidate=900',
    );
  });

  it('preserves browser max-age when already > 0', () => {
    const out = applyWorkersCacheHeaders(
      html('public, max-age=86400, s-maxage=86400'),
    );
    expect(out.headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect(out.headers.get('CDN-Cache-Control')).toBe('public, max-age=86400');
  });

  it('leaves private / no-store responses alone', () => {
    const privateRes = applyWorkersCacheHeaders(html('private, no-store'));
    expect(privateRes.headers.get('CDN-Cache-Control')).toBeNull();
    expect(privateRes.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('does not overwrite existing CDN-Cache-Control', () => {
    const out = applyWorkersCacheHeaders(
      html('public, max-age=0, s-maxage=60', {
        'CDN-Cache-Control': 'public, max-age=120',
      }),
    );
    expect(out.headers.get('CDN-Cache-Control')).toBe('public, max-age=120');
    expect(out.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=60',
    );
  });
});
