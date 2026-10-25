import { API_URL } from './api';
import { clearDeskCache } from './deskCache';

export interface DeskUser {
  id: string;
  name?: string;
  email: string;
  role: 'admin' | 'editor' | 'student';
}

export interface DeskSession {
  id: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  current: boolean;
}

export type DeskGate = 'login' | 'home' | 'posts' | 'ok';

/** Public desk path. `/admin` stays unused so a casual visit does not open the login screen. */
export const DESK_PATH = '/administrator';

/** Only staff destinations may be used as a post-login return path. */
export function safeDeskReturn(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) return null;
  const path = value.split(/[?#]/)[0];
  const allowed =
    path === DESK_PATH ||
    path.startsWith(`${DESK_PATH}/`) ||
    path === '/editor' ||
    path.startsWith('/editor/');
  return allowed ? value.slice(0, 240) : null;
}

const FRESH_MS = 20_000;

let cache: { user: DeskUser | null; at: number } | null = null;
let inflight: Promise<DeskUser | null> | null = null;

function remember(user: DeskUser | null) {
  cache = { user, at: Date.now() };
  (window as Window & { __deskUser?: DeskUser | null }).__deskUser = user;
  try {
    if (user) {
      sessionStorage.setItem(
        'desk_user',
        JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }),
      );
    } else {
      clearDeskCache();
    }
  } catch {
    /* ignore */
  }
}

export function peekSession(): DeskUser | null | undefined {
  if (cache && Date.now() - cache.at < FRESH_MS) return cache.user;
  const stored = (window as Window & { __deskUser?: DeskUser | null }).__deskUser;
  if (stored) return stored;
  try {
    const raw = sessionStorage.getItem('desk_user');
    if (!raw) return undefined;
    const user = JSON.parse(raw) as DeskUser;
    if (user?.id && user.email && user.role) return user;
  } catch {
    /* ignore */
  }
  return undefined;
}

/** One in-flight /me request shared by the layout guard and the desk app. */
export function loadSession(force = false): Promise<DeskUser | null> {
  if (!force && cache && Date.now() - cache.at < FRESH_MS) return Promise.resolve(cache.user);
  if (!force && inflight) return inflight;

  inflight = fetch(`${API_URL}/me`, { credentials: 'include' })
    .then(async (res) => {
      if (res.status === 401 || res.status === 204) return null;
      if (!res.ok) throw new Error(`Profile request failed with ${res.status}`);
      const text = await res.text();
      if (!text) return null;
      const user = JSON.parse(text) as DeskUser | null;
      return user && user.id ? user : null;
    })
    .then((user) => {
      remember(user);
      return user;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function deskGate(user: DeskUser | null, path: string): DeskGate {
  if (!user) return 'login';
  if (user.role !== 'admin' && user.role !== 'editor') return 'home';
  const adminOnly =
    path === `${DESK_PATH}/users` ||
    path.startsWith(`${DESK_PATH}/users/`) ||
    path === `${DESK_PATH}/notifications` ||
    path.startsWith(`${DESK_PATH}/notifications/`);
  if (adminOnly && user.role !== 'admin') return 'posts';
  return 'ok';
}

export async function logoutSession() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Protection': '1' },
  });
  remember(null);
  clearDeskCache();
  try {
    localStorage.removeItem('auth_active');
  } catch {
    /* storage can be blocked */
  }
}

async function sessionFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
    headers.set('X-CSRF-Protection', '1');
  }
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    } catch {
      /* non-json */
    }
    throw new Error(message);
  }
  if (response.status === 204) return null as T;
  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) return response.json();
  return null as T;
}

export function listSessions() {
  return sessionFetch<DeskSession[]>('/me/sessions');
}

export function revokeSession(id: string) {
  return sessionFetch<null>(`/me/sessions/${id}`, { method: 'DELETE' });
}

export function roleLabel(role: DeskUser['role'] | undefined) {
  if (role === 'admin') return 'Administrator';
  if (role === 'editor') return 'Editor';
  if (role === 'student') return 'Student';
  return 'Staff';
}
