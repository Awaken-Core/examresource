import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { swapArticleLanguage, memoryBodyCache } from '../src/lib/article-lang-swap';

describe('Article Language Swap - Identity, Race Condition & Error Recovery', () => {
  let mockElements: Record<string, any> = {};

  beforeEach(() => {
    memoryBodyCache.clear();
    mockElements = {};

    function toCamelCase(str: string): string {
      return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    }

    const createMockElement = (id = '', attrs: Record<string, string> = {}) => {
      const dataset: Record<string, string> = {};
      const attributes: Record<string, string> = {};

      for (const [k, v] of Object.entries(attrs)) {
        attributes[k] = v;
        if (k.startsWith('data-')) {
          dataset[toCamelCase(k.slice(5))] = v;
        }
      }

      const el: any = {
        id,
        innerHTML: '',
        textContent: '',
        dataset,
        hidden: false,
        className: '',
        classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
        _attributes: attributes,
        getAttribute: (name: string) => {
          if (attributes[name] !== undefined) return attributes[name];
          if (name.startsWith('data-')) {
            const camel = toCamelCase(name.slice(5));
            return dataset[camel] !== undefined ? dataset[camel] : null;
          }
          return null;
        },
        setAttribute: (name: string, val: string) => {
          attributes[name] = String(val);
          if (name.startsWith('data-')) {
            dataset[toCamelCase(name.slice(5))] = String(val);
          }
        },
        hasAttribute: (name: string) => attributes[name] !== undefined,
        removeAttribute: (name: string) => {
          delete attributes[name];
          if (name.startsWith('data-')) {
            delete dataset[toCamelCase(name.slice(5))];
          }
        },
        querySelector: () => createMockElement(),
        querySelectorAll: () => [],
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        append: vi.fn(),
        getBoundingClientRect: () => ({ top: 0, height: 1000, bottom: 1000, left: 0, right: 800, width: 800 }),
      };
      return el;
    };

    const articleBody = createMockElement('article-body');
    articleBody.innerHTML = '<p>Initial Hinglish Content for Article A</p>';

    const bundleEl = createMockElement('article-lang-data');
    bundleEl.textContent = JSON.stringify({
      HINGLISH: {
        language: 'HINGLISH',
        title: 'Article A - Hinglish',
        description: 'Hinglish Description',
        pageTitle: 'Article A Hinglish Page',
        pageDescription: 'Article A Hinglish Meta',
        htmlBody: '<p>Initial Hinglish Content for Article A</p>',
        readMinutes: 3,
        updatedDate: '2026-11-03',
        url: '/article-a',
      },
      ENGLISH: {
        language: 'ENGLISH',
        title: 'Article A - English',
        description: 'English Description',
        pageTitle: 'Article A English Page',
        pageDescription: 'Article A English Meta',
        htmlBody: '', // fetched on demand
        readMinutes: 1, // initially description length, to be recalculated
        updatedDate: '2026-11-03',
        url: '/article-a',
      },
    });

    const rootEl = createMockElement('overview-top', { 'data-article-slug': 'article-a', 'data-article-lang': 'hinglish' });
    const titleEl = createMockElement('', { 'data-article-title': 'true' });
    const readEl = createMockElement('', { 'data-article-read-time': 'true' });
    readEl.textContent = '3 min read';

    mockElements['article-body'] = articleBody;
    mockElements['article-lang-data'] = bundleEl;
    mockElements['[data-article-slug]'] = rootEl;
    mockElements['[data-article-title]'] = titleEl;
    mockElements['[data-article-read-time]'] = readEl;
    mockElements['[data-article-lang]'] = rootEl;

    // Setup global window and document mocks
    (global as any).document = {
      getElementById: (id: string) => mockElements[id] || null,
      querySelector: (selector: string) => mockElements[selector] || null,
      querySelectorAll: (selector: string) => (mockElements[selector] ? [mockElements[selector]] : []),
      createElement: (tag: string) => createMockElement(tag),
      body: createMockElement('body'),
      addEventListener: vi.fn(),
      title: 'Initial Title',
    };

    const win = {
      location: { pathname: '/article-a', search: '' },
      dispatchEvent: vi.fn(),
      history: { replaceState: vi.fn() },
      addEventListener: vi.fn(),
    };
    (global as any).window = win;
    (global as any).history = win.history;

    (global as any).CustomEvent = class {
      constructor(public type: string, public init: any) {}
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Article Identity: scopes memory cache so Article B never displays Article A body', async () => {
    // Mock fetch for Article A English body
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ htmlContent: '<p>English Body of Article A</p>' }),
    });

    // Step 1: Swap Article A to English
    const swappedA = await swapArticleLanguage('en');
    expect(swappedA).toBe(true);
    expect(memoryBodyCache.has('article-a:ENGLISH')).toBe(true);
    expect(mockElements['article-body'].innerHTML).toContain('English Body of Article A');

    // Step 2: Navigate to Article B (simulating ClientRouter navigation)
    mockElements['[data-article-slug]'].setAttribute('data-article-slug', 'article-b');
    (global as any).window.location.pathname = '/article-b';
    mockElements['article-body'].innerHTML = '<p>Initial Content for Article B</p>';
    mockElements['[data-article-lang]'].setAttribute('data-article-lang', 'hinglish');

    // Update bundle for Article B
    mockElements['article-lang-data'].textContent = JSON.stringify({
      HINGLISH: {
        language: 'HINGLISH',
        title: 'Article B - Hinglish',
        htmlBody: '<p>Initial Content for Article B</p>',
        readMinutes: 4,
        url: '/article-b',
      },
      ENGLISH: {
        language: 'ENGLISH',
        title: 'Article B - English',
        htmlBody: '',
        readMinutes: 1,
        url: '/article-b',
      },
    });

    // Verify Article B does NOT have an English body in cache!
    expect(memoryBodyCache.has('article-b:ENGLISH')).toBe(false);

    // Mock fetch for Article B English body
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ htmlContent: '<p>English Body of Article B ONLY</p>' }),
    });

    const swappedB = await swapArticleLanguage('en');
    expect(swappedB).toBe(true);
    // CRITICAL INVARIANT: Article B MUST display Article B content, NEVER Article A content!
    expect(mockElements['article-body'].innerHTML).toContain('English Body of Article B ONLY');
    expect(mockElements['article-body'].innerHTML).not.toContain('English Body of Article A');
    expect(memoryBodyCache.has('article-b:ENGLISH')).toBe(true);

    // Step 3: Navigate back to Article A and verify its own cache is reused
    mockElements['[data-article-slug]'].setAttribute('data-article-slug', 'article-a');
    (global as any).window.location.pathname = '/article-a';
    expect(memoryBodyCache.has('article-a:ENGLISH')).toBe(true);
    expect(memoryBodyCache.get('article-a:ENGLISH')).toContain('English Body of Article A');
  });

  it('2. Placeholder Guard: Never saves loading skeleton into memory cache', async () => {
    let resolveSlowFetch: any;
    (global as any).fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSlowFetch = resolve;
        }),
    );

    // Start swap to English (begins loading)
    const swapPromise = swapArticleLanguage('en');
    expect(mockElements['article-body'].getAttribute('data-is-loading')).toBe('true');
    expect(mockElements['article-body'].innerHTML).toContain('animate-pulse');

    // Check memory cache: MUST NOT contain placeholder!
    expect(memoryBodyCache.has('article-a:ENGLISH')).toBe(false);

    // Resolve fetch
    resolveSlowFetch({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ htmlContent: '<p>Loaded Body</p>' }),
    });

    await swapPromise;
    expect(mockElements['article-body'].hasAttribute('data-is-loading')).toBe(false);
    expect(memoryBodyCache.get('article-a:ENGLISH')).not.toContain('animate-pulse');
    expect(memoryBodyCache.get('article-a:ENGLISH')).toContain('<p>Loaded Body</p>');
  });

  it('3. Race Condition: Outdated slower response does not overwrite latest user selection', async () => {
    let resolveFirstFetch: any;

    (global as any).fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('language=ENGLISH')) {
        return new Promise((resolve) => {
          resolveFirstFetch = resolve;
        });
      }
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ htmlContent: '<p>Hinglish Body</p>' }),
      });
    });

    // 1. User clicks English (slow request starts)
    const englishPromise = swapArticleLanguage('en');

    // 2. User rapidly toggles back to Hinglish
    const hinglishPromise = swapArticleLanguage('hinglish');
    await hinglishPromise;
    expect(mockElements['[data-article-lang]'].dataset.articleLang).toBe('hinglish');

    // 3. The slow English request finishes late
    resolveFirstFetch({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ htmlContent: '<p>Late English Body</p>' }),
    });

    const resultEnglish = await englishPromise;
    // Late response was rejected because user is now on Hinglish!
    expect(resultEnglish).toBe(false);
    // DOM was NOT overwritten by the outdated late response!
    expect(mockElements['article-body'].innerHTML).not.toContain('Late English Body');
  });

  it('4. Error Recovery: HTTP 500 error restores previous body and metadata', async () => {
    // Setup initial Hinglish body in cache
    memoryBodyCache.set('article-a:HINGLISH', '<p>Initial Hinglish Content for Article A</p>');

    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
    });

    const result = await swapArticleLanguage('en');
    expect(result).toBe(false);

    // Must remove loading indicator
    expect(mockElements['article-body'].hasAttribute('data-is-loading')).toBe(false);
    // Must restore previous body content
    expect(mockElements['article-body'].innerHTML).toBe('<p>Initial Hinglish Content for Article A</p>');
  });

  it('5. Error Recovery: HTML response instead of JSON restores previous state', async () => {
    memoryBodyCache.set('article-a:HINGLISH', '<p>Initial Hinglish Content for Article A</p>');

    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/html' },
      json: () => Promise.resolve('<html>Error Page</html>'),
    });

    const result = await swapArticleLanguage('en');
    expect(result).toBe(false);
    expect(mockElements['article-body'].hasAttribute('data-is-loading')).toBe(false);
    expect(mockElements['article-body'].innerHTML).toBe('<p>Initial Hinglish Content for Article A</p>');
  });

  it('6. Reading Time Calculation: Accurately updates reading time when body is fetched', async () => {
    // 600 words body -> ~3 min read
    const words600 = new Array(600).fill('exam').join(' ');
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ htmlContent: `<p>${words600}</p>` }),
    });

    await swapArticleLanguage('en');
    expect(mockElements['[data-article-read-time]'].textContent).toBe('3 min read');
  });
});
