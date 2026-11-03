const DEFAULT_DEV_API_URL = 'http://localhost:5000/api/v1';

function resolveApiUrl(): string {
  const envUrl = (import.meta.env.PUBLIC_API_URL || '').trim().replace(/\/$/, '');

  if (envUrl) {
    if (/^https?:\/\//i.test(envUrl)) {
      return envUrl;
    }
    // Relative path resolution in browser
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${envUrl.startsWith('/') ? '' : '/'}${envUrl}`;
    }
    // Relative path resolution during SSR using PUBLIC_SITE_URL
    const siteUrl = (import.meta.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
    if (siteUrl && /^https?:\/\//i.test(siteUrl)) {
      return `${siteUrl}${envUrl.startsWith('/') ? '' : '/'}${envUrl}`;
    }
    return envUrl;
  }

  // Development environment fallback to local API server
  if (import.meta.env.DEV) {
    return DEFAULT_DEV_API_URL;
  }

  // In production, preview, or staging builds, do not silently fallback to an assumed production URL
  throw new Error(
    '[api] Missing required environment variable PUBLIC_API_URL for non-development build. Configure PUBLIC_API_URL in deployment settings.',
  );
}

export const API_URL = resolveApiUrl();

export function isClientAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem('auth_active') === '1' ||
      document.documentElement.getAttribute('data-authenticated') === 'true' ||
      document.cookie.includes('logged_in=1') ||
      window.location.search.includes('login=success')
    );
  } catch {
    return false;
  }
}

export function getCachedCurrentUser(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    if (localStorage.getItem('auth_active') !== '1') return null;
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function safeFetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, init);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
