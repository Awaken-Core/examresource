const MAX_AGE_MS = 30 * 60 * 1000;

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; data?: T };
    if (!parsed?.at || Date.now() - parsed.at > MAX_AGE_MS || parsed.data == null) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* private mode or a full quota */
  }
}

export function articleCacheKey(search: string, status: string, categoryId: string, page: number) {
  return `desk_articles:${search.trim()}|${status}|${categoryId}|${page}`;
}

export function readArticleCache<T>(key: string): T[] | null {
  const rows = read<T[]>(key);
  return Array.isArray(rows) ? rows : null;
}

export function writeArticleCache<T>(key: string, rows: T[]) {
  write(key, rows);
}

export function readCategoryCache<T>(): T[] | null {
  const rows = read<T[]>('desk_categories');
  return Array.isArray(rows) ? rows : null;
}

export function writeCategoryCache<T>(rows: T[]) {
  write('desk_categories', rows);
}

export function clearDeskCache() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('desk_')) keys.push(key);
    }
    keys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
