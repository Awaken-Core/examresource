interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
const DEFAULT_TTL_MS = 60_000; // 60 seconds SSR in-memory cache
const MAX_CACHE_SIZE = 250;

export async function fetchPublicJson<T>(path: string, ttlMs = DEFAULT_TTL_MS): Promise<T | null> {
  const base = import.meta.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) return null;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;
  const now = Date.now();

  const cached = memoryCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  // Deduplicate identical in-flight requests
  const existingPromise = inFlightRequests.get(url);
  if (existingPromise) {
    return existingPromise as Promise<T | null>;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) {
        if (cached) return cached.data as T;
        return null;
      }
      const data = (await response.json()) as T;

      if (memoryCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = memoryCache.keys().next().value;
        if (oldestKey) memoryCache.delete(oldestKey);
      }
      memoryCache.set(url, { data, expiresAt: Date.now() + ttlMs });
      return data;
    } catch {
      if (cached) return cached.data as T;
      return null;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}
