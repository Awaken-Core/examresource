import { describe, expect, it } from 'vitest';
import { normalizeNotificationHref } from './notification.store.js';

describe('normalizeNotificationHref', () => {
  it('accepts site paths and https links', () => {
    expect(normalizeNotificationHref('/blog/jobs/rrb-ntpc')).toBe('/blog/jobs/rrb-ntpc');
    expect(normalizeNotificationHref('https://govtpariksha.com/blog')).toBe('https://govtpariksha.com/blog');
    expect(normalizeNotificationHref('  ')).toBeNull();
    expect(normalizeNotificationHref(null)).toBeNull();
  });

  it('rejects protocol-relative and non-https links', () => {
    expect(() => normalizeNotificationHref('//evil.example')).toThrow();
    expect(() => normalizeNotificationHref('http://example.com')).toThrow();
  });
});
