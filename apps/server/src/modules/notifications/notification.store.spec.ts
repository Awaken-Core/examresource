import { describe, expect, it } from 'vitest';
import {
  deduplicateNotificationsByLanguage,
  normalizeNotificationHref,
  normalizeNotificationLanguage,
} from './notification.store.js';

describe('normalizeNotificationHref', () => {
  it('accepts site paths and https links', () => {
    expect(normalizeNotificationHref('/blog/jobs/rrb-ntpc')).toBe('/blog/jobs/rrb-ntpc');
    expect(normalizeNotificationHref('https://example.com/blog')).toBe('https://example.com/blog');
    expect(normalizeNotificationHref('  ')).toBeNull();
    expect(normalizeNotificationHref(null)).toBeNull();
  });

  it('rejects protocol-relative and non-https links', () => {
    expect(() => normalizeNotificationHref('//evil.example')).toThrow();
    expect(() => normalizeNotificationHref('http://example.com')).toThrow();
  });
});

describe('normalizeNotificationLanguage', () => {
  it('defaults to HINGLISH', () => {
    expect(normalizeNotificationLanguage()).toBe('HINGLISH');
    expect(normalizeNotificationLanguage(null)).toBe('HINGLISH');
    expect(normalizeNotificationLanguage('')).toBe('HINGLISH');
    expect(normalizeNotificationLanguage('hinglish')).toBe('HINGLISH');
  });

  it('detects ENGLISH variants', () => {
    expect(normalizeNotificationLanguage('en')).toBe('ENGLISH');
    expect(normalizeNotificationLanguage('english')).toBe('ENGLISH');
    expect(normalizeNotificationLanguage('ENGLISH')).toBe('ENGLISH');
  });
});

describe('deduplicateNotificationsByLanguage', () => {
  const sampleNotifications = [
    {
      id: 'notif-hi-1',
      kind: 'blog',
      title: 'रेलवे परीक्षा तिथि 2026',
      body: 'नई परीक्षा तिथि घोषित',
      href: '/rrb-exam-date',
      language: 'HINGLISH',
      translationGroupId: 'group-rrb-1',
      createdAt: new Date('2026-03-01T10:00:00Z'),
    },
    {
      id: 'notif-en-1',
      kind: 'blog',
      title: 'RRB Exam Date 2026',
      body: 'New examination schedule released',
      href: '/rrb-exam-date',
      language: 'ENGLISH',
      translationGroupId: 'group-rrb-1',
      createdAt: new Date('2026-03-01T10:05:00Z'),
    },
    {
      id: 'notif-broadcast',
      kind: 'broadcast',
      title: 'System Update',
      body: 'Scheduled maintenance tonight',
      href: null,
      language: null,
      translationGroupId: null,
      createdAt: new Date('2026-03-01T11:00:00Z'),
    },
  ];

  it('selects only the English notification when user prefers ENGLISH and drops the duplicate', () => {
    const result = deduplicateNotificationsByLanguage(sampleNotifications, 'ENGLISH');
    expect(result).toHaveLength(2); // 1 blog + 1 broadcast (duplicate blog dropped)
    const blog = result.find((item) => item.kind === 'blog');
    expect(blog?.id).toBe('notif-en-1');
    expect(blog?.title).toBe('RRB Exam Date 2026');
  });

  it('selects only the Hinglish notification when user prefers HINGLISH and drops the duplicate', () => {
    const result = deduplicateNotificationsByLanguage(sampleNotifications, 'HINGLISH');
    expect(result).toHaveLength(2);
    const blog = result.find((item) => item.kind === 'blog');
    expect(blog?.id).toBe('notif-hi-1');
    expect(blog?.title).toBe('रेलवे परीक्षा तिथि 2026');
  });

  it('deduplicates based on href when translationGroupId is missing', () => {
    const itemsWithoutGroup = [
      {
        id: 'hi-2',
        kind: 'blog',
        title: 'यूपी पुलिस कांस्टेबल',
        href: '/up-police-constable',
        language: 'HINGLISH',
        createdAt: new Date('2026-03-01T10:00:00Z'),
      },
      {
        id: 'en-2',
        kind: 'blog',
        title: 'UP Police Constable',
        href: '/up-police-constable?lang=en',
        language: 'ENGLISH',
        createdAt: new Date('2026-03-01T10:01:00Z'),
      },
    ];

    const resultEn = deduplicateNotificationsByLanguage(itemsWithoutGroup, 'ENGLISH');
    expect(resultEn).toHaveLength(1);
    expect(resultEn[0].id).toBe('en-2');

    const resultHi = deduplicateNotificationsByLanguage(itemsWithoutGroup, 'HINGLISH');
    expect(resultHi).toHaveLength(1);
    expect(resultHi[0].id).toBe('hi-2');
  });

  it('falls back to the available version if preferred language is not published', () => {
    const onlyHinglish = [
      {
        id: 'hi-only',
        kind: 'blog',
        title: 'केवल हिंदी पोस्ट',
        href: '/hindi-only',
        language: 'HINGLISH',
        translationGroupId: 'group-only-1',
        createdAt: new Date('2026-03-01T10:00:00Z'),
      },
    ];

    const result = deduplicateNotificationsByLanguage(onlyHinglish, 'ENGLISH');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('hi-only');
  });
});
