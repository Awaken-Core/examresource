import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { refreshNotifications, getNotifications } from '../src/lib/notifications';

describe('Notification Polling, Throttling & Multi-Account Isolation', () => {
  let fetchCallCount = 0;
  let lastFetchedUrl = '';

  beforeEach(() => {
    fetchCallCount = 0;
    lastFetchedUrl = '';

    (global as any).document = {
      cookie: '',
      documentElement: {
        getAttribute: () => null,
      },
      querySelectorAll: () => [],
      querySelector: () => null,
    };

    (global as any).localStorage = {
      store: {} as Record<string, string>,
      getItem: (k: string) => (global as any).localStorage.store[k] || null,
      setItem: (k: string, v: string) => { (global as any).localStorage.store[k] = v; },
      removeItem: (k: string) => { delete (global as any).localStorage.store[k]; },
    };

    (global as any).window = {
      location: { origin: 'https://govtpariksha.com', search: '' },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
    };

    (global as any).fetch = vi.fn().mockImplementation((url: string) => {
      fetchCallCount++;
      lastFetchedUrl = url;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                id: `notif-${fetchCallCount}`,
                kind: 'blog',
                title: `Notification ${fetchCallCount}`,
                body: 'Content',
                href: '/article-1',
                language: 'HINGLISH',
                createdAt: new Date().toISOString(),
                read: false,
              },
            ],
          }),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Guest notification fetch accesses /notifications/public endpoint', async () => {
    await refreshNotifications(null, true);
    expect(fetchCallCount).toBe(1);
    expect(lastFetchedUrl).toContain('/notifications/public');
  });

  it('2. Authenticated user accesses /me/notifications endpoint', async () => {
    await refreshNotifications('session', true);
    expect(fetchCallCount).toBe(1);
    expect(lastFetchedUrl).toContain('/me/notifications');
  });

  it('3. 45-second background polling cadence is preserved (20s throttle threshold)', async () => {
    vi.useFakeTimers();
    // Reset by passing a distinct token with forceRefresh
    await refreshNotifications('session-test-3', true);
    expect(fetchCallCount).toBe(1);

    // t = 10s: within 20s throttle -> skipped
    vi.advanceTimersByTime(10_000);
    await refreshNotifications('session-test-3', false);
    expect(fetchCallCount).toBe(1);

    // t = 45s: 45s poll interval in Layout.astro -> executed!
    vi.advanceTimersByTime(35_000);
    await refreshNotifications('session-test-3', false);
    expect(fetchCallCount).toBe(2);

    // t = 90s: next 45s poll -> executed!
    vi.advanceTimersByTime(45_000);
    await refreshNotifications('session-test-3', false);
    expect(fetchCallCount).toBe(3);

    vi.useRealTimers();
  });

  it('4. Force-refresh bypasses throttle interval immediately', async () => {
    await refreshNotifications('session-test-4', true);
    expect(fetchCallCount).toBe(1);

    // Immediate second call with forceRefresh = true
    await refreshNotifications('session-test-4', true);
    expect(fetchCallCount).toBe(2);
  });

  it('5. Account switch / logout clears notification cache', async () => {
    // User A logs in
    await refreshNotifications('user-A-token', true);
    expect(getNotifications().length).toBeGreaterThan(0);
    expect(getNotifications()[0].title).toBe('Notification 1');

    // User A logs out (token becomes null)
    await refreshNotifications(null, true);
    expect(lastFetchedUrl).toContain('/notifications/public');

    // User B logs in (token becomes user-B-token)
    await refreshNotifications('user-B-token', true);
    expect(lastFetchedUrl).toContain('/me/notifications');
  });

  it('6. Concurrent calls share in-flight promise to eliminate duplicate requests', async () => {
    let slowResolve: any;
    (global as any).fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      return new Promise((resolve) => {
        slowResolve = resolve;
      });
    });

    const p1 = refreshNotifications('session-test-6', true);
    const p2 = refreshNotifications('session-test-6', true);

    slowResolve({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    await Promise.all([p1, p2]);
    // Exactly 1 fetch was made, p2 attached to p1's inFlightPromise
    expect(fetchCallCount).toBe(1);
  });
});
