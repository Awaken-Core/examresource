export type AppNotification = {
  id: string;
  kind: 'welcome' | 'blog' | 'broadcast';
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  read: boolean;
};

import { API_URL } from './api';
import { siteName } from '../data/site';
const FIRED_STORAGE_KEY = 'gp_fired_notification_ids';

let currentItems: AppNotification[] = [];
let currentToken: string | null = null;

export function relativeTime(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(delta / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

/** Same-origin / relative hrefs soft-navigate via ClientRouter when available; externals hard-navigate. */
function goToNotificationHref(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin) {
      const path = `${url.pathname}${url.search}${url.hash}`;
      void import('astro:transitions/client')
        .then(({ navigate }) => navigate(path))
        .catch(() => { window.location.assign(href); });
      return;
    }
  } catch {
    // Ignored: Malformed URL string; fall back to standard window.location.assign
  }
  window.location.assign(href);
}

export function iconFor(kind: AppNotification['kind']) {
  if (kind === 'blog') return '📰';
  if (kind === 'broadcast') return '🔔';
  return '📢';
}

function getFiredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveFiredIds(ids: Set<string>) {
  try {
    const arr = Array.from(ids).slice(-100);
    localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // Ignored: Storage quota exceeded or disabled in private browsing
  }
}

async function showSingleNotification(
  item: AppNotification,
  swReg: ServiceWorkerRegistration | null,
) {
  const title = item.title ? `${siteName}: ${item.title}` : `${siteName} Alert`;
  const body = item.body || 'New examination notification published.';
  const options: NotificationOptions = {
    body,
    icon: '/logo.png',
    badge: '/favicon.svg',
    tag: item.id,
    data: { url: item.href || '/' },
  };

  if (swReg && 'showNotification' in swReg) {
    try {
      await swReg.showNotification(title, options);
      return;
    } catch {
      // Ignored: Fallback to standard window.Notification if service worker showNotification rejects
    }
  }

  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (item.href) {
        goToNotificationHref(item.href);
      }
    };
  } catch (err) {
    console.warn('System Notification error:', err);
  }
}

export async function fireUnreadToSystem(unreadItems: AppNotification[]) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const firedIds = getFiredIds();
  const isFirstRun = localStorage.getItem(FIRED_STORAGE_KEY) === null;

  const candidates = unreadItems.filter((item) => !item.read && !firedIds.has(item.id));
  const toFire = isFirstRun ? candidates.slice(0, 2) : candidates;

  for (const item of candidates) {
    firedIds.add(item.id);
  }
  saveFiredIds(firedIds);

  if (toFire.length === 0) return;

  let swReg: ServiceWorkerRegistration | null = null;
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
    swReg = reg ?? null;
  }

  await Promise.all(toFire.map((item) => showSingleNotification(item, swReg)));
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') {
    updateBrowserNotificationUI();
    return true;
  }
  if (Notification.permission === 'denied') {
    updateBrowserNotificationUI();
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    updateBrowserNotificationUI();
    if (permission === 'granted') {
      const unread = currentItems.filter((i) => !i.read);
      void fireUnreadToSystem(unread);
      return true;
    }
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
  }
  return false;
}

export function updateBrowserNotificationUI() {
  if (typeof window === 'undefined') return;
  const supported = 'Notification' in window;
  const permission = supported ? Notification.permission : 'denied';

  document.querySelectorAll<HTMLElement>('[data-browser-notification-prompt]').forEach((el) => {
    el.classList.toggle('hidden', !supported || permission !== 'default');
  });
}

function buildCard(item: AppNotification) {
  const card = document.createElement(item.href ? 'a' : 'div');
  card.className =
    'notification-item group/item relative block border-l-3 border-l-accent bg-surface-raised/50 hover:bg-surface-raised border border-border/40 rounded-xl p-3 transition pr-9';
  if (card instanceof HTMLAnchorElement && item.href) {
    card.href = item.href;
    card.dataset.notificationLink = item.id;
  }

  const row = document.createElement('div');
  row.className = 'flex items-start gap-2.5';

  const icon = document.createElement('span');
  icon.className = 'text-base shrink-0 leading-none mt-0.5';
  icon.textContent = iconFor(item.kind);

  const content = document.createElement('div');
  content.className = 'flex-1 min-w-0';

  const message = document.createElement('p');
  message.className = 'text-xs text-white/90 leading-relaxed font-normal';
  const welcome = item.kind === 'welcome' ? /^Hi (.+?), ([\s\S]+)$/.exec(item.body) : null;
  if (welcome) {
    message.append('Hi ');
    const name = document.createElement('span');
    name.className = 'notification-user-name font-semibold text-white';
    name.textContent = welcome[1] ?? '';
    message.append(name);
    message.append(`, ${welcome[2] ?? ''}`);
  } else {
    if (item.kind !== 'welcome' && item.title) {
      const label = document.createElement('span');
      label.className = 'block font-semibold text-white mb-0.5';
      label.textContent = item.title;
      message.append(label);
    }
    message.append(item.body);
  }

  const meta = document.createElement('div');
  meta.className = 'flex items-center justify-between gap-1 mt-1.5 text-[11px] font-medium text-accent';

  const dotWrap = document.createElement('div');
  dotWrap.className = 'flex items-center gap-1.5';
  const dot = document.createElement('span');
  dot.className = 'notification-unread-dot w-1.5 h-1.5 rounded-full bg-accent';
  const newLabel = document.createElement('span');
  newLabel.className = 'text-[10px] uppercase font-bold tracking-wider text-accent';
  newLabel.textContent = 'New';
  dotWrap.append(dot, newLabel);

  const time = document.createElement('span');
  time.className = 'text-muted text-[10px] font-normal';
  time.textContent = relativeTime(item.createdAt);
  meta.append(dotWrap, time);

  content.append(message, meta);
  row.append(icon, content);

  // Dismiss / Mark as Read button
  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.dataset.dismissNotification = item.id;
  dismissBtn.title = 'Mark as read and dismiss';
  dismissBtn.className =
    'absolute top-2.5 right-2.5 p-1 rounded-md text-muted hover:text-white hover:bg-surface-raised border border-transparent hover:border-border/40 transition opacity-70 group-hover/item:opacity-100 cursor-pointer';
  dismissBtn.innerHTML = `
    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  `;

  card.append(row, dismissBtn);
  return card;
}

function paint(items: AppNotification[]) {
  // Only display unread notifications - read ones are completely removed
  const unread = items.filter((item) => !item.read);

  document.querySelectorAll<HTMLElement>('[data-notification-new]').forEach((list) => {
    list.replaceChildren();
    if (!unread.length) {
      list.classList.add('hidden');
      return;
    }
    list.classList.remove('hidden');
    unread.forEach((item) => list.append(buildCard(item)));
  });

  document.querySelectorAll<HTMLElement>('[data-notification-caught-up]').forEach((node) => {
    node.classList.toggle('hidden', unread.length > 0);
  });

  document.querySelectorAll('.notification-badge-count, .notification-pill-badge').forEach((node) => {
    node.textContent = String(unread.length);
    node.classList.toggle('opacity-50', unread.length === 0);
  });

  const notifCount = unread.length;
  const pluralSuffix = notifCount === 1 ? '' : 's';
  const pillText = notifCount === 0
    ? 'No new notifications'
    : `You have ${notifCount} new notification${pluralSuffix}`;

  document.querySelectorAll('.notification-pill-text').forEach((node) => {
    node.textContent = pillText;
  });

  document.querySelectorAll('.notification-dot-indicator').forEach((node) => {
    node.classList.toggle('hidden', unread.length === 0);
  });

  updateBrowserNotificationUI();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { items, unreadCount: unread.length } }));
  }
}

export function getNotifications(): AppNotification[] {
  return currentItems;
}

export async function refreshNotifications(token: string | null) {
  currentToken = token;
  if (!token) {
    currentItems = [];
    paint([]);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/me/notifications`, { priority: 'low', credentials: 'include' } as any);
    if (!response.ok) return;
    const data = (await response.json()) as { items?: AppNotification[] };
    currentItems = data.items ?? [];
    paint(currentItems);
    void fireUnreadToSystem(currentItems.filter((item) => !item.read));
  } catch {
    // Keep the last rendered list if the request fails.
  }
}

export async function markAllNotificationsRead() {
  currentItems = currentItems.map((item) => ({ ...item, read: true }));
  paint(currentItems);
  if (!currentToken) return;
  await fetch(`${API_URL}/me/notifications/read`, {
    method: 'POST',
    priority: 'low',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Protection': '1',
    },
    credentials: 'include',
    body: '{}',
    keepalive: true,
  } as any).catch(() => null);
}

export function markNotificationRead(id: string) {
  if (currentItems.every((item) => item.id !== id || item.read)) return;
  currentItems = currentItems.map((item) => (item.id === id ? { ...item, read: true } : item));
  paint(currentItems);
  if (!currentToken) return;
  void fetch(`${API_URL}/me/notifications/read`, {
    method: 'POST',
    priority: 'low',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Protection': '1',
    },
    credentials: 'include',
    body: JSON.stringify({ ids: [id] }),
    keepalive: true,
  } as any).catch(() => null);
}
