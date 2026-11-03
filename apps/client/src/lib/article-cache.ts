interface CachedArticle {
  livePost: any;
  alternatePost: any;
  savedAt: number;
}

const articleMemoryCache = new Map<string, CachedArticle>();
const MAX_STALE_ARTICLE_AGE_MS = 15 * 60 * 1000; // 15 minutes max stale fallback
const MAX_CACHE_SIZE = 150;

export function saveArticleToCache(slug: string, lang: string, livePost: any, alternatePost: any): void {
  const key = `${slug.toLowerCase()}:${lang.toUpperCase()}`;
  if (articleMemoryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = articleMemoryCache.keys().next().value;
    if (oldestKey) articleMemoryCache.delete(oldestKey);
  }
  articleMemoryCache.set(key, { livePost, alternatePost, savedAt: Date.now() });
}

export function getStaleArticleFromCache(slug: string, lang: string): { livePost: any; alternatePost: any } | null {
  const key = `${slug.toLowerCase()}:${lang.toUpperCase()}`;
  const entry = articleMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > MAX_STALE_ARTICLE_AGE_MS) {
    articleMemoryCache.delete(key);
    return null;
  }
  return { livePost: entry.livePost, alternatePost: entry.alternatePost };
}

