import { bindArticleReading } from './article-reading';
import type { ArticleLangBundle, ArticleLangVersion } from './article-lang';

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

function renderBodyHtml(version: ArticleLangVersion): string {
  const parts: string[] = [];
  if (version.coverImage) {
    const alt = escapeAttr(version.imageAlt || version.title);
    const src = escapeAttr(version.coverImage);
    parts.push(`<figure class="my-2" data-article-cover>
      <img
        src="${src}"
        alt="${alt}"
        class="max-h-[28rem] w-full rounded-xl border border-border object-cover"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        width="800"
        height="420"
      />
      ${version.imageCaption ? `<figcaption class="mt-2 text-center text-xs text-muted">${escapeAttr(version.imageCaption)}</figcaption>` : ''}
    </figure>`);
  }
  parts.push(`<div class="prose-markdown markdown-preview-content max-w-none" data-article-html>${version.htmlBody}</div>`);
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

/** Swap article content client-side. Returns true if swap succeeded. */
export function swapArticleLanguage(lang: string): boolean {
  const normalized = lang === 'en' || lang === 'english' || lang === 'ENGLISH' ? 'en' : 'hinglish';
  const langKey = normalized === 'en' ? 'ENGLISH' : 'HINGLISH';
  const bundle = parseBundle();
  const version = bundle?.[langKey];
  if (!version) return false;

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

  const bodyEl = document.getElementById('article-body');
  if (bodyEl) {
    bodyEl.innerHTML = renderBodyHtml(version);
  }

  document.title = version.pageTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', version.pageDescription);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', version.pageTitle);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', version.pageDescription);

  // Keep the exact same clean URL without ?lang=en or /language extension
  history.replaceState({ articleLang: normalized }, '', window.location.pathname);

  document.querySelectorAll<HTMLElement>('[data-article-lang]').forEach((el) => {
    el.dataset.articleLang = normalized;
  });

  updateSwitcherUi(langKey);
  bindArticleReading();

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
