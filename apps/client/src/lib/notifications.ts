export type AppNotification = {
  id: string;
  kind: 'welcome' | 'blog' | 'broadcast';
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  read: boolean;
};

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

let currentItems: AppNotification[] = [];
let currentToken: string | null = null;

function relativeTime(iso: string) {
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

function iconFor(kind: AppNotification['kind']) {
  if (kind === 'blog') return '📰';
  if (kind === 'broadcast') return '🔔';
  return '📢';
}

function buildCard(item: AppNotification) {
  const card = document.createElement(item.href ? 'a' : 'div');
  card.className = item.read
    ? 'notification-item block border-l-3 border-l-border bg-surface-raised/20 hover:bg-surface-raised border border-border/30 rounded-xl p-3 transition opacity-80'
    : 'notification-item block border-l-3 border-l-accent bg-surface-raised/50 hover:bg-surface-raised border border-border/40 rounded-xl p-3 transition';
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
  const welcome = item.kind === 'welcome' ? item.body.match(/^Hi (.+?), ([\s\S]+)$/) : null;
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
  meta.className = 'flex items-center justify-end gap-1 mt-1.5 text-[11px] font-medium text-accent';
  if (!item.read) {
    const dot = document.createElement('span');
    dot.className = 'notification-unread-dot w-1.5 h-1.5 rounded-full bg-accent';
    meta.append(dot);
  }
  const time = document.createElement('span');
  time.textContent = relativeTime(item.createdAt);
  meta.append(time);

  content.append(message, meta);
  row.append(icon, content);
  card.append(row);
  return card;
}

function paint(items: AppNotification[]) {
  const unread = items.filter((item) => !item.read);
  const earlier = items.filter((item) => item.read);

  document.querySelectorAll<HTMLElement>('[data-notification-new]').forEach((list) => {
    list.replaceChildren();
    if (!unread.length) {
      const empty = document.createElement('p');
      empty.className = 'text-xs text-muted py-2 text-center';
      empty.textContent = 'No new notifications';
      list.append(empty);
      return;
    }
    unread.forEach((item) => list.append(buildCard(item)));
  });

  document.querySelectorAll<HTMLElement>('[data-notification-earlier]').forEach((list) => {
    list.replaceChildren(...earlier.map((item) => buildCard(item)));
  });

  document.querySelectorAll<HTMLElement>('[data-notification-caught-up]').forEach((node) => {
    node.classList.toggle('hidden', earlier.length > 0);
  });

  document.querySelectorAll('.notification-badge-count, .notification-pill-badge').forEach((node) => {
    node.textContent = String(unread.length);
    node.classList.toggle('opacity-50', unread.length === 0);
  });

  document.querySelectorAll('.notification-pill-text').forEach((node) => {
    node.textContent = unread.length === 0
      ? 'No new notifications'
      : `You have ${unread.length} new notification${unread.length === 1 ? '' : 's'}`;
  });

  document.querySelectorAll('.notification-dot-indicator').forEach((node) => {
    node.classList.toggle('hidden', unread.length === 0);
  });
}

export async function refreshNotifications(token: string | null) {
  currentToken = token;
  if (!token) {
    currentItems = [];
    paint([]);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/me/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const data = (await response.json()) as { items?: AppNotification[] };
    currentItems = data.items ?? [];
    paint(currentItems);
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
    headers: {
      Authorization: `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
    keepalive: true,
  }).catch(() => null);
}

export function markNotificationRead(id: string) {
  if (currentItems.every((item) => item.id !== id || item.read)) return;
  currentItems = currentItems.map((item) => (item.id === id ? { ...item, read: true } : item));
  paint(currentItems);
  if (!currentToken) return;
  void fetch(`${API_URL}/me/notifications/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: [id] }),
    keepalive: true,
  }).catch(() => null);
}
