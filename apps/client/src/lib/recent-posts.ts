import { API_URL } from './api';

export type ListingPost = {
  slug: string;
  title: string;
  description?: string | null;
  metaDescription?: string | null;
  coverImage?: string | null;
  imageAlt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  category?: { slug?: string; name?: string } | null;
};

// In-memory cache shared across SSR requests within the serverless instance runtime
const memoryCache: Record<string, { posts: ListingPost[]; expiresAt: number }> = {};
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

/**
 * Fetches recent posts with an in-memory SSR cache and short timeout (2s).
 * Prevents recent posts from ever blocking or delaying the primary article SSR.
 */
export async function getRecentPosts(language: string, currentSlug?: string): Promise<ListingPost[]> {
  const now = Date.now();
  const langKey = language || 'HINGLISH';
  const cached = memoryCache[langKey];

  // Return from memory cache if fresh (takes 0ms)
  if (cached && now < cached.expiresAt && cached.posts.length > 0) {
    return filterAndSlice(cached.posts, currentSlug);
  }

  try {
    const res = await fetch(`${API_URL}/blogs?limit=6&language=${langKey}&includeImages=false`, {
      signal: AbortSignal.timeout(2000), // Strict 2s timeout so article page never hangs
    });

    if (res.ok) {
      const data = (await res.json()) as ListingPost[];
      if (Array.isArray(data) && data.length > 0) {
        memoryCache[langKey] = {
          posts: data,
          expiresAt: now + CACHE_TTL_MS,
        };
        return filterAndSlice(data, currentSlug);
      }
    }
  } catch {
    // If network or timeout occurs, return stale cache if available
    if (cached?.posts && cached.posts.length > 0) {
      return filterAndSlice(cached.posts, currentSlug);
    }
  }

  return [];
}

function filterAndSlice(posts: ListingPost[], currentSlug?: string): ListingPost[] {
  if (!currentSlug) return posts.slice(0, 5);
  const normalized = currentSlug.toLowerCase().trim();
  return posts.filter((p) => p.slug.toLowerCase().trim() !== normalized).slice(0, 5);
}
