interface CacheRecord<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheRecord<any>>();
const DEFAULT_TTL_MS = 60_000; // 60 seconds SSR memory cache

export async function fetchPublicJson<T>(path: string, ttlMs = DEFAULT_TTL_MS): Promise<T | null> {
  const base = import.meta.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) return null;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const cacheKey = `${base}${cleanPath}`;

  const now = Date.now();
  const cached = memoryCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    return cached.data as T;
  }

  try {
    const response = await fetch(cacheKey, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      if (cached) return cached.data as T;
      return null;
    }
    const data = (await response.json()) as T;
    memoryCache.set(cacheKey, { data, expiresAt: now + ttlMs });
    return data;
  } catch {
    if (cached) return cached.data as T;
    return null;
  }
}
