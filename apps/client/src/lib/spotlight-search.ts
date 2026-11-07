import { API_URL } from './api';

export type SpotlightItem = {
  title: string;
  tag: string;
  href: string;
  category: string;
  source?: 'static' | 'blog' | 'test-series';
};

type StaticSearchItem = {
  title: string;
  tag: string;
  href: string;
  category: string;
  icon?: string;
};

let cachedStaticItems: StaticSearchItem[] | null = null;
let liveSearchTimer: ReturnType<typeof setTimeout> | null = null;
let liveSearchGeneration = 0;

export async function loadStaticSearchItems(): Promise<StaticSearchItem[]> {
  if (!cachedStaticItems) {
    const mod = await import('../data/site');
    cachedStaticItems = mod.searchItems;
  }
  return cachedStaticItems;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function fetchLiveResults(query: string): Promise<SpotlightItem[]> {
  if (!API_URL || query.trim().length < 2) return [];

  const q = encodeURIComponent(query.trim());
  const results: SpotlightItem[] = [];

  try {
    const [blogsRes, seriesRes] = await Promise.all([
      fetch(`${API_URL}/blogs?search=${q}&limit=8&includeImages=false`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      }),
      fetch(`${API_URL}/test-series?search=${q}&limit=6`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      }),
    ]);

    if (blogsRes.ok) {
      const contentType = blogsRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const blogs = await blogsRes.json();
        const list = Array.isArray(blogs) ? blogs : blogs?.data || [];
        for (const post of list.slice(0, 8)) {
          if (!post?.slug || !post?.title) continue;
          results.push({
            title: post.title,
            tag: post.category?.name || post.categories?.[0]?.name || 'Article',
            href: `/${post.slug}`,
            category: 'article',
            source: 'blog',
          });
        }
      }
    }

    if (seriesRes.ok) {
      const contentType = seriesRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const seriesPayload = await seriesRes.json();
        const list = Array.isArray(seriesPayload)
          ? seriesPayload
          : seriesPayload?.data || [];
        for (const series of list.slice(0, 6)) {
          const slug = series?.slug;
          if (!slug || !series?.title) continue;
          results.push({
            title: series.title,
            tag: series.targetExam || series.category || 'Test Series',
            href: `/test-series/${slug}`,
            category: 'test-series',
            source: 'test-series',
          });
        }
      }
    }
  } catch {
    // Live search is best-effort; static results still render.
  }

  return results;
}

export function scheduleLiveSpotlightSearch(
  query: string,
  onResults: (items: SpotlightItem[], generation: number) => void,
  debounceMs = 220,
): number {
  const generation = ++liveSearchGeneration;
  if (liveSearchTimer) clearTimeout(liveSearchTimer);
  liveSearchTimer = setTimeout(() => {
    void fetchLiveResults(query).then((items) => {
      if (generation !== liveSearchGeneration) return;
      onResults(items, generation);
    });
  }, debounceMs);
  return generation;
}

export function cancelLiveSpotlightSearch() {
  liveSearchGeneration += 1;
  if (liveSearchTimer) {
    clearTimeout(liveSearchTimer);
    liveSearchTimer = null;
  }
}

export function renderSpotlightResultHtml(
  items: SpotlightItem[],
  query: string,
): string {
  if (items.length === 0) {
    return `
      <div class="py-8 text-center text-muted text-body-sm">
        <p>No results found for "${escapeHtml(query)}"</p>
        <p class="text-caption-xs mt-1 text-muted/70">Try searching for UPSC, SSC, RRB, an article, or a test series</p>
      </div>
    `;
  }

  return items
    .map((item, idx) => {
      const external = item.href.startsWith('http');
      return `
      <a
        href="${escapeHtml(item.href)}"
        ${external ? 'target="_blank" rel="noopener"' : ''}
        data-astro-prefetch="${external ? 'false' : 'hover'}"
        data-search-result
        data-result-index="${idx}"
        class="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-raised transition-colors"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-heading truncate">${escapeHtml(item.title)}</p>
          <p class="text-caption-xs text-muted truncate">${escapeHtml(item.tag)}${item.source === 'blog' ? ' · Article' : item.source === 'test-series' ? ' · Test Series' : ''}</p>
        </div>
      </a>`;
    })
    .join('');
}

export function filterStaticSpotlightItems(
  items: StaticSearchItem[],
  query: string,
  category: string,
): Array<SpotlightItem & { icon?: string }> {
  const trimmed = query.trim().toLowerCase();
  return items
    .filter((item) => {
      const matchesCategory =
        category === 'all' || item.category === category || item.category === 'all';
      const matchesQuery =
        item.title.toLowerCase().includes(trimmed) ||
        item.tag.toLowerCase().includes(trimmed);
      return matchesCategory && matchesQuery;
    })
    .map((item) => ({ ...item, source: 'static' as const }));
}
