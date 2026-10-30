interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
const DEFAULT_TTL_MS = 60_000; // 60 seconds SSR in-memory cache
const MAX_STALE_MS = 5 * 60_000; // Allow stale fallback for at most 5 minutes on transient 5xx/network errors
const MAX_CACHE_SIZE = 250;

function isUsableStale<T>(cached: CacheEntry<T> | undefined, now: number): boolean {
  if (!cached) return false;
  return now - cached.expiresAt < MAX_STALE_MS;
}

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

      // Never return stale data for 404 (resource was genuinely not found or deleted)
      if (response.status === 404) {
        memoryCache.delete(url);
        return null;
      }

      if (!response.ok) {
        // Return stale data only for transient server errors (>= 500) if within max stale window
        if (response.status >= 500 && isUsableStale(cached, Date.now())) {
          return cached!.data as T;
        }
        return null;
      }

      const data = (await response.json()) as T;

      // Avoid bloating cache with empty array responses for unknown category queries
      const isEmptyCategory = Array.isArray(data) && data.length === 0 && url.includes('category=');
      if (!isEmptyCategory) {
        if (memoryCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = memoryCache.keys().next().value;
          if (oldestKey) memoryCache.delete(oldestKey);
        }
        memoryCache.set(url, { data, expiresAt: Date.now() + ttlMs });
      }

      return data;
    } catch {
      // Fallback to stale cache only on temporary network disconnect/timeout within max stale age
      if (isUsableStale(cached, Date.now())) {
        return cached!.data as T;
      }
      return null;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}
