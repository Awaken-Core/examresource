const DEFAULT_DEV_API_URL = 'http://localhost:5000/api/v1';
const DEFAULT_PROD_API_URL = 'https://examresource.awakenstudioss.workers.dev/api/v1';

function resolveApiUrl(): string {
  const envUrl = (import.meta.env.PUBLIC_API_URL || '').trim().replace(/\/$/, '');

  if (envUrl) {
    if (/^https?:\/\//i.test(envUrl)) {
      return envUrl;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${envUrl.startsWith('/') ? '' : '/'}${envUrl}`;
    }
  }

  // Check if we are running in production mode or deployed on production domain
  const isProd =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'govtpariksha.com' ||
        window.location.hostname.endsWith('.govtpariksha.com')));

  if (isProd) {
    return DEFAULT_PROD_API_URL;
  }

  return DEFAULT_DEV_API_URL;
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
