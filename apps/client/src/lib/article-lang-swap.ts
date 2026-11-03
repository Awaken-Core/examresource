import { bindArticleReading } from './article-reading';
import type { ArticleLangBundle, ArticleLangVersion } from './article-lang';
import { API_URL } from './api';
import { processArticleHtml } from './article-lang';

function escapeAttr(value: string): string {
  let text = value || '';
  for (let i = 0; i < 4 && text.includes('&amp;'); i++) {
    text = text.replaceAll('&amp;amp;', '&amp;').replaceAll('&amp;', '&');
  }
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function parseBundle(): ArticleLangBundle | null {
  const el = document.getElementById('article-lang-data');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as ArticleLangBundle;
  } catch {
    return null;
  }
}

// In-memory cache for resolved article bodies across language toggles
const memoryBodyCache = new Map<string, string>();
let currentSwapGeneration = 0;
let latestSwapLangKey: 'HINGLISH' | 'ENGLISH' | null = null;

function renderBodyHtml(version: ArticleLangVersion, bodyContent?: string): string {
  const parts: string[] = [];
  if (version.coverImage) {
    const alt = escapeAttr(version.imageAlt || version.title);
    const src = escapeAttr(version.coverImage);
    parts.push(`<figure class="my-1 sm:my-3" data-article-cover>
      <img
        src="${src}"
        alt="${alt}"
        class="max-h-56 sm:max-h-80 md:max-h-[28rem] w-full rounded-xl border border-border object-cover"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        width="800"
        height="420"
      />
      ${version.imageCaption ? `<figcaption class="mt-1.5 text-center text-xs text-muted">${escapeAttr(version.imageCaption)}</figcaption>` : ''}
    </figure>`);
  }
  const content = bodyContent || version.htmlBody || '';
  parts.push(`<div class="prose-markdown markdown-preview-content max-w-none" data-article-html>${content}</div>`);
  return parts.join('');
}

function updateSwitcherUi(langKey: 'HINGLISH' | 'ENGLISH') {
  document.querySelectorAll<HTMLAnchorElement>('.language-switcher-pill a[data-lang]').forEach((el) => {
    const isHinglish = el.dataset.lang === 'hinglish';
    const isActive = langKey === 'HINGLISH' ? isHinglish : !isHinglish;
    el.setAttribute('aria-current', isActive ? 'true' : 'false');
    if (isActive) {
      if (isHinglish) {
        el.className =
          'flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all duration-200 shrink-0 bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs';
      } else {
        el.className =
          'flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all duration-200 shrink-0 bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs';
      }
    } else {
      el.className =
        'flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all duration-200 shrink-0 text-muted hover:text-white hover:bg-white/5';
    }
  });
}

function applyVersionMetadata(version: ArticleLangVersion, normalized: 'en' | 'hinglish', langKey: 'HINGLISH' | 'ENGLISH') {
  const titleEl = document.querySelector<HTMLElement>('[data-article-title]');
  if (titleEl) titleEl.textContent = version.title;

  const descEl = document.querySelector<HTMLElement>('[data-article-description]');
  if (descEl) {
    if (version.description) {
      descEl.textContent = version.description;
      descEl.hidden = false;
    } else {
      descEl.textContent = '';
      descEl.hidden = true;
    }
  }

  const crumbEl = document.querySelector<HTMLElement>('[data-article-crumb-title]');
  if (crumbEl) crumbEl.textContent = version.title;

  const readEl = document.querySelector<HTMLElement>('[data-article-read-time]');
  if (readEl) readEl.textContent = `${version.readMinutes} min read`;

  const updatedEl = document.querySelector<HTMLElement>('[data-article-updated]');
  if (updatedEl) updatedEl.textContent = `Updated ${version.updatedDate}`;

  document.title = version.pageTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', version.pageDescription);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', version.pageTitle);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', version.pageDescription);

  history.replaceState({ articleLang: normalized }, '', window.location.pathname);

  document.querySelectorAll<HTMLElement>('[data-article-lang]').forEach((el) => {
    el.dataset.articleLang = normalized;
  });

  document.querySelectorAll<HTMLElement>('[data-share-btn]').forEach((el) => {
    el.setAttribute('data-share-title', version.title);
  });

  updateSwitcherUi(langKey);
}

/** Swap article content client-side with on-demand body loading, race condition guard, and memory caching. */
export async function swapArticleLanguage(lang: string): Promise<boolean> {
  const normalized = lang === 'en' || lang === 'english' || lang === 'ENGLISH' ? 'en' : 'hinglish';
  const langKey = normalized === 'en' ? 'ENGLISH' : 'HINGLISH';
  const currentLangAttr = document.querySelector<HTMLElement>('[data-article-lang]')?.dataset.articleLang || 'hinglish';
  const currentNormalized = currentLangAttr === 'en' ? 'en' : 'hinglish';
  const currentLangKey = currentNormalized === 'en' ? 'ENGLISH' : 'HINGLISH';

  const bodyEl = document.getElementById('article-body');

  // If already displaying the requested language and not in a loading placeholder state, no-op
  if (currentLangKey === langKey && (!bodyEl || !bodyEl.hasAttribute('data-is-loading'))) {
    return true;
  }

  const bundle = parseBundle();
  const version = bundle?.[langKey];
  const previousVersion = bundle?.[currentLangKey];
  if (!version) return false;

  // Cache current body before switching away ONLY if it's a real rendered body (never cache loading placeholder)
  if (bodyEl && !bodyEl.hasAttribute('data-is-loading') && !memoryBodyCache.has(currentLangKey)) {
    const renderedHtml = bodyEl.innerHTML;
    if (!renderedHtml.includes('animate-pulse')) {
      memoryBodyCache.set(currentLangKey, renderedHtml);
    }
  }

  // Increment request generation and set latest requested language
  const generation = ++currentSwapGeneration;
  latestSwapLangKey = langKey;

  // Update UI metadata immediately
  applyVersionMetadata(version, normalized, langKey);

  // Render body: check memory cache first, then version.htmlBody, else fetch on demand
  if (bodyEl) {
    if (memoryBodyCache.has(langKey)) {
      bodyEl.removeAttribute('data-is-loading');
      bodyEl.innerHTML = memoryBodyCache.get(langKey)!;
      bindArticleReading();
      window.dispatchEvent(
        new CustomEvent('exam:language-change', { detail: { lang: normalized, source: 'article-swap' } }),
      );
      return true;
    }

    if (version.htmlBody) {
      const html = renderBodyHtml(version);
      memoryBodyCache.set(langKey, html);
      bodyEl.removeAttribute('data-is-loading');
      bodyEl.innerHTML = html;
      bindArticleReading();
      window.dispatchEvent(
        new CustomEvent('exam:language-change', { detail: { lang: normalized, source: 'article-swap' } }),
      );
      return true;
    }

    // Show smooth loading placeholder while fetching alternate language body
    bodyEl.setAttribute('data-is-loading', 'true');
    bodyEl.innerHTML = `
      <div class="animate-pulse space-y-4 py-8 max-w-none">
        <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5"></div>
        <div class="h-32 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl w-full my-4"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
      </div>
    `;

    try {
      const articleSlug = (version.url || window.location.pathname).replace(/^\//, '');
      const res = await fetch(`${API_URL}/blogs/${encodeURIComponent(articleSlug)}?language=${langKey}`);
      
      // Treat non-OK as failure
      if (!res.ok) {
        throw new Error(`Failed to fetch article body: HTTP ${res.status}`);
      }

      // Treat non-JSON as failure
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Invalid response content-type: expected application/json');
      }

      const data = await res.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response body format');
      }

      const processed = processArticleHtml(data.htmlContent || '', version.title);
      version.htmlBody = processed.htmlBody;
      const fullHtml = renderBodyHtml(version);
      
      // Cache valid parsed HTML into memory cache
      memoryBodyCache.set(langKey, fullHtml);

      // Verify this fetch is STILL the latest requested language and generation
      if (generation !== currentSwapGeneration || latestSwapLangKey !== langKey) {
        // User switched to another language in the meantime!
        // Do not overwrite the DOM with out-of-date content.
        return false;
      }

      bodyEl.removeAttribute('data-is-loading');
      bodyEl.innerHTML = fullHtml;
      bindArticleReading();

      window.dispatchEvent(
        new CustomEvent('exam:language-change', { detail: { lang: normalized, source: 'article-swap' } }),
      );
      return true;
    } catch (err) {
      // If a newer swap was already initiated, ignore this failure
      if (generation !== currentSwapGeneration) {
        return false;
      }

      bodyEl.removeAttribute('data-is-loading');

      // Revert to previous body and metadata if available
      if (previousVersion && memoryBodyCache.has(currentLangKey)) {
        applyVersionMetadata(previousVersion, currentNormalized, currentLangKey);
        bodyEl.innerHTML = memoryBodyCache.get(currentLangKey)!;
        bindArticleReading();
        window.dispatchEvent(
          new CustomEvent('exam:language-change', { detail: { lang: currentNormalized, source: 'article-swap' } }),
        );
      } else {
        // Fallback: reload page with query param
        window.location.search = `lang=${normalized}`;
      }
      return false;
    }
  }

  window.dispatchEvent(
    new CustomEvent('exam:language-change', { detail: { lang: normalized, source: 'article-swap' } }),
  );

  return true;
}

/** Language currently shown on the article page (URL / data attr / hinglish default). */
export function getDisplayedArticleLang(): 'hinglish' | 'en' | null {
  const view = document.querySelector<HTMLElement>('.blog-reading-view, [data-article-lang]');
  if (!view && !document.getElementById('article-lang-data')) return null;

  const fromAttr = view?.dataset.articleLang;
  if (fromAttr === 'en' || fromAttr === 'hinglish') return fromAttr;

  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang === 'en' || urlLang === 'english') return 'en';
  return 'hinglish';
}

export function canSwapArticleLanguage(lang: string): boolean {
  const normalized = lang === 'en' || lang === 'english' || lang === 'ENGLISH' ? 'en' : 'hinglish';
  const langKey = normalized === 'en' ? 'ENGLISH' : 'HINGLISH';
  const bundle = parseBundle();
  return Boolean(bundle?.[langKey]);
}