import { formatSnippet, guessLanguage, highlightLine, languageLabel } from './highlight-code';

const sources = new WeakMap<HTMLElement, string>();
let listening = false;
let copyBound = false;
let lastTocId = '';

function articleElement() {
  return document.getElementById('article-body');
}

function readingPercent() {
  const article = articleElement();
  if (!article) return 0;
  const start = article.getBoundingClientRect().top + window.scrollY - 120;
  const end = start + article.offsetHeight - window.innerHeight * 0.35;
  if (end <= start) return 100;
  const value = ((window.scrollY - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function detectLanguage(pre: HTMLElement) {
  const code = pre.querySelector('code');
  const fromClass = `${pre.className} ${code?.className || ''}`;
  const match = /language-([\w#+]+)/i.exec(fromClass);
  return match?.[1] || pre.dataset.language || '';
}

function promoteInlineCode() {
  document.querySelectorAll<HTMLElement>('.blog-reading-view p').forEach((paragraph) => {
    const code = paragraph.querySelector('code');
    if (!code || code.closest('pre')) return;
    const paragraphText = (paragraph.textContent || '').trim();
    const codeText = (code.textContent || '').trim();
    if (!codeText || paragraphText !== codeText) return;
    const formatted = formatSnippet(codeText);
    const langMatch = /language-([\w#+-]+)/i.exec(code.className);
    const language = langMatch?.[1] || guessLanguage(formatted) || 'text';
    const pre = document.createElement('pre');
    pre.className = `language-${language}`;
    const next = document.createElement('code');
    next.className = `language-${language}`;
    next.textContent = formatted;
    pre.append(next);
    paragraph.replaceWith(pre);
  });
}

function enhanceCodeBlocks() {
  promoteInlineCode();
  const blocks = document.querySelectorAll<HTMLElement>('.blog-reading-view pre');
  blocks.forEach((pre) => {
    if (pre.closest('.tf-code')) return;
    const code = pre.querySelector('code');
    const raw = (code || pre).textContent?.replace(/\n$/, '') || '';
    const language = detectLanguage(pre);
    const wrap = document.createElement('div');
    wrap.className = 'tf-code';
    sources.set(wrap, raw);

    const bar = document.createElement('div');
    bar.className = 'tf-code-bar';
    bar.innerHTML = `
      <span class="tf-code-lang">${languageLabel(language)}</span>
      <button type="button" class="tf-code-copy" aria-label="Copy code">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"></rect>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span class="tf-code-copy-label">Copy</span>
      </button>
    `;

    const body = document.createElement('div');
    body.className = 'tf-code-body';
    const lines = raw.split('\n');
    const rows = lines
      .map((line, index) => {
        const html = highlightLine(line, language);
        return `<span class="tf-line"><span class="tf-ln">${index + 1}</span><span class="tf-lc">${html || ' '}</span></span>`;
      })
      .join('');
    body.innerHTML = `<pre><code>${rows}</code></pre>`;

    wrap.append(bar, body);
    pre.replaceWith(wrap);
  });
}

function ensureLightbox() {
  let dialog = document.getElementById('article-lightbox');
  if (dialog) return dialog;
  dialog = document.createElement('div');
  dialog.id = 'article-lightbox';
  dialog.className = 'article-lightbox';
  dialog.hidden = true;
  dialog.innerHTML = `
    <button type="button" class="article-lightbox-backdrop" aria-label="Close image"></button>
    <div class="article-lightbox-frame" role="dialog" aria-modal="true" aria-label="Article image">
      <div class="article-lightbox-toolbar">
        <span class="article-lightbox-title"></span>
        <button type="button" class="article-lightbox-close" aria-label="Close">Close</button>
      </div>
      <img class="article-lightbox-image" alt="" />
    </div>
  `;
  document.body.append(dialog);

  const close = () => {
    dialog!.hidden = true;
    document.body.classList.remove('overflow-hidden');
  };
  dialog.querySelector('.article-lightbox-backdrop')?.addEventListener('click', close);
  dialog.querySelector('.article-lightbox-close')?.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog!.hidden) close();
  });
  return dialog;
}

function bindLightbox() {
  const dialog = ensureLightbox();
  const image = dialog.querySelector<HTMLImageElement>('.article-lightbox-image');
  const title = dialog.querySelector('.article-lightbox-title');
  document.querySelectorAll<HTMLImageElement>('.blog-reading-view img').forEach((img) => {
    if (img.closest('.tf-code, .article-lightbox, a') || img.dataset.zoomBound) return;
    img.dataset.zoomBound = 'true';
    img.classList.add('article-zoomable');
    img.addEventListener('click', () => {
      if (!image) return;
      image.src = img.currentSrc || img.src;
      image.alt = img.alt || '';
      const caption = img.closest('figure')?.querySelector('figcaption')?.textContent?.trim();
      if (title) title.textContent = caption || img.alt || 'Image';
      dialog.hidden = false;
      document.body.classList.add('overflow-hidden');
      dialog.querySelector<HTMLButtonElement>('.article-lightbox-close')?.focus();
    });
  });
}

export function bindCodeCopy() {
  if (copyBound) return;
  copyBound = true;
  document.addEventListener('click', async (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('.tf-code-copy');
    if (!button) return;
    const wrap = button.closest<HTMLElement>('.tf-code');
    if (!wrap) return;
    const text =
      sources.get(wrap) ||
      Array.from(wrap.querySelectorAll('.tf-lc'))
        .map((line) => line.textContent || '')
        .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      const label = button.querySelector('.tf-code-copy-label');
      if (!label) return;
      const original = label.textContent;
      label.textContent = 'Copied';
      window.setTimeout(() => {
        label.textContent = original;
      }, 1600);
    } catch {
      /* clipboard can be unavailable */
    }
  });
}

function updateReadingProgress() {
  const percent = readingPercent();
  const label = document.getElementById('reading-progress-num');
  const bar = document.getElementById('reading-progress-bar');
  if (label) label.textContent = `${percent}%`;
  if (bar) bar.style.transform = `scaleX(${percent / 100})`;
}

function syncTocHighlight(activeLink: HTMLAnchorElement, activeId: string) {
  const highlight = document.getElementById('toc-highlight');
  const wash = document.getElementById('toc-highlight-bg');
  if (!highlight || !wash) return;

  const top = activeLink.offsetTop;
  const height = activeLink.offsetHeight;
  highlight.style.top = `${top}px`;
  highlight.style.height = `${height}px`;
  highlight.style.opacity = '1';
  wash.style.top = `${top}px`;
  wash.style.height = `${height}px`;
  wash.style.opacity = '1';

  if (activeId !== lastTocId) {
    lastTocId = activeId;
    const scroller = document.getElementById('toc-scroll');
    if (scroller) {
      const bottom = top + height;
      if (top < scroller.scrollTop) scroller.scrollTop = top;
      else if (bottom > scroller.scrollTop + scroller.clientHeight) {
        scroller.scrollTop = bottom - scroller.clientHeight;
      }
    }
  }
}

function updateReading() {
  updateReadingProgress();

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc-link'));
  if (!links.length) return;
  const headings = links
    .map((link) => {
      const id = link.dataset.tocId;
      return id ? document.getElementById(id) : null;
    })
    .filter((heading): heading is HTMLElement => Boolean(heading));

  let activeId = headings[0]?.id || '';
  const line = window.scrollY + 140;
  for (let index = headings.length - 1; index >= 0; index -= 1) {
    if (headings[index].offsetTop <= line) {
      activeId = headings[index].id;
      break;
    }
  }

  links.forEach((link) => {
    const active = link.dataset.tocId === activeId;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });

  const activeLink = links.find((link) => link.dataset.tocId === activeId);
  if (activeLink) {
    syncTocHighlight(activeLink, activeId);
  }
}

export function bindFaqAccordion() {
  // Radix UI / Shadcn Accordion: Native details & summary handles smooth state toggling
}

export function bindArticleReading() {
  lastTocId = '';
  enhanceCodeBlocks();
  bindLightbox();
  bindCodeCopy();
  bindFaqAccordion();
  updateReading();
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', updateReading, { passive: true });
  window.addEventListener('resize', updateReading);
}

