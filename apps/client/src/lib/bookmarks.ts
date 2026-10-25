export type FavoriteArticle = {
  slug: string;
  title: string;
  category?: string;
  url: string;
  savedAt: string;
};

export type BookmarkedArticle = FavoriteArticle;

const PRIMARY_STORAGE_KEY = 'exam_saved_favorites';
const LEGACY_STORAGE_KEY = 'exam_saved_bookmarks';

function safeGetStorage(): FavoriteArticle[] {
  if (typeof window === 'undefined') return [];
  try {
    let raw = localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (!raw) {
      // Migrate from legacy bookmarks storage if available
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(PRIMARY_STORAGE_KEY, raw);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeSetStorage(items: FavoriteArticle[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function getFavorites(): FavoriteArticle[] {
  return safeGetStorage();
}

export const getBookmarks = getFavorites;

export function isFavorite(slug: string): boolean {
  if (!slug) return false;
  const items = safeGetStorage();
  const normalized = slug.trim().toLowerCase();
  return items.some((item) => item.slug.trim().toLowerCase() === normalized);
}

export const isBookmarked = isFavorite;

export function toggleFavorite(data: { slug: string; title: string; category?: string; url?: string }): boolean {
  if (!data?.slug) return false;
  const items = safeGetStorage();
  const normalized = data.slug.trim().toLowerCase();
  const existsIndex = items.findIndex((i) => i.slug.trim().toLowerCase() === normalized);

  let isNowSaved = false;
  if (existsIndex >= 0) {
    items.splice(existsIndex, 1);
    isNowSaved = false;
  } else {
    items.unshift({
      slug: data.slug,
      title: data.title || 'Untitled Article',
      category: data.category || 'General',
      url: data.url || `/${data.slug}`,
      savedAt: new Date().toISOString(),
    });
    isNowSaved = true;
  }

  safeSetStorage(items);
  updateFavoritesUI();
  window.dispatchEvent(new CustomEvent('favorites-updated', { detail: { isNowSaved, slug: data.slug } }));
  window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { isNowSaved, slug: data.slug } }));
  return isNowSaved;
}

export const toggleBookmark = toggleFavorite;

export function removeFavorite(slug: string): void {
  if (!slug) return;
  const items = safeGetStorage();
  const normalized = slug.trim().toLowerCase();
  const updated = items.filter((i) => i.slug.trim().toLowerCase() !== normalized);
  safeSetStorage(updated);
  updateFavoritesUI();
  window.dispatchEvent(new CustomEvent('favorites-updated', { detail: { isNowSaved: false, slug } }));
  window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { isNowSaved: false, slug } }));
}

export const removeBookmark = removeFavorite;

export function clearAllFavorites(): void {
  safeSetStorage([]);
  updateFavoritesUI();
  window.dispatchEvent(new CustomEvent('favorites-updated', { detail: { cleared: true } }));
  window.dispatchEvent(new CustomEvent('bookmarks-updated', { detail: { cleared: true } }));
}

export const clearAllBookmarks = clearAllFavorites;

export function timeAgo(isoString: string): string {
  try {
    const delta = Date.now() - new Date(isoString).getTime();
    const minutes = Math.max(0, Math.floor(delta / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return 'Saved';
  }
}

export function updateFavoritesUI(): void {
  if (typeof window === 'undefined') return;

  const favorites = safeGetStorage();
  const count = favorites.length;

  // 1. Update count badges
  document.querySelectorAll<HTMLElement>('.favorites-count-badge').forEach((el) => {
    el.textContent = String(count);
    if (count > 0) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // 2. Update dot indicators
  document.querySelectorAll<HTMLElement>('.favorites-dot-indicator').forEach((el) => {
    if (count > 0) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // 3. Update active state of in-page article favorite & bookmark buttons
  document.querySelectorAll<HTMLElement>('[data-favorite-slug], [data-bookmark-slug]').forEach((btn) => {
    const slug = btn.getAttribute('data-favorite-slug') || btn.getAttribute('data-bookmark-slug');
    if (!slug) return;
    const active = isFavorite(slug);
    btn.setAttribute('data-favorite-active', active ? 'true' : 'false');
    btn.setAttribute('data-bookmarked', active ? 'true' : 'false');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');

    const favIcon = btn.querySelector('.favorite-icon');
    if (favIcon) {
      if (active) {
        favIcon.classList.remove('text-muted');
        favIcon.classList.add('text-red-500', 'fill-current');
      } else {
        favIcon.classList.remove('text-red-500', 'fill-current');
        favIcon.classList.add('text-muted');
      }
    }

    const bookmarkIcon = btn.querySelector('.bookmark-icon');
    if (bookmarkIcon) {
      if (active) {
        bookmarkIcon.classList.remove('text-muted');
        bookmarkIcon.classList.add('text-accent', 'fill-current');
      } else {
        bookmarkIcon.classList.remove('text-accent', 'fill-current');
        bookmarkIcon.classList.add('text-muted');
      }
    }

    const favLabel = btn.querySelector('.favorite-label');
    if (favLabel) {
      favLabel.textContent = active ? 'Favorited' : 'Favorite';
    }

    const bookmarkLabel = btn.querySelector('.bookmark-label');
    if (bookmarkLabel) {
      bookmarkLabel.textContent = active ? 'Saved' : 'Favorite';
    }
  });

  // 4. Render favorite list containers
  document.querySelectorAll<HTMLElement>('[data-favorites-list]').forEach((container) => {
    container.innerHTML = '';

    if (favorites.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'py-7 px-4 text-center select-none';
      emptyDiv.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-surface-raised border border-border/80 flex items-center justify-center mx-auto mb-2.5 text-muted">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <p class="text-xs font-semibold text-white">No favorite articles yet</p>
        <p class="text-[11px] text-muted mt-1 leading-relaxed max-w-[220px] mx-auto">
          Add articles to your favorites while reading to quickly access them here anytime.
        </p>
      `;
      container.appendChild(emptyDiv);
      return;
    }

    const list = document.createElement('div');
    list.className = 'space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin';

    favorites.forEach((item) => {
      const itemRow = document.createElement('div');
      itemRow.className = 'flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-raised/40 hover:bg-surface-raised border border-border/40 hover:border-accent/40 transition group';

      const link = document.createElement('a');
      link.href = item.url;
      link.className = 'flex-1 min-w-0 pr-1 block text-left';
      link.innerHTML = `
        <div class="flex items-center gap-1.5 mb-0.5">
          <span class="text-[10px] uppercase font-bold tracking-wider text-accent truncate">${item.category || 'Article'}</span>
          <span class="text-muted/40">•</span>
          <span class="text-[10px] text-muted">${timeAgo(item.savedAt)}</span>
        </div>
        <p class="text-xs font-semibold text-white/95 group-hover:text-accent transition truncate leading-snug">${item.title}</p>
      `;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-surface-raised border border-transparent hover:border-border/60 transition cursor-pointer shrink-0';
      removeBtn.setAttribute('data-remove-favorite', item.slug);
      removeBtn.setAttribute('data-remove-bookmark', item.slug);
      removeBtn.setAttribute('title', 'Remove favorite');
      removeBtn.setAttribute('aria-label', `Remove ${item.title} from favorites`);
      removeBtn.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      `;

      itemRow.appendChild(link);
      itemRow.appendChild(removeBtn);
      list.appendChild(itemRow);
    });

    container.appendChild(list);
  });

  // 5. Toggle visibility of "Clear all" buttons
  document.querySelectorAll<HTMLElement>('[data-clear-favorites], [data-clear-bookmarks]').forEach((btn) => {
    btn.classList.toggle('hidden', count === 0);
  });
}
