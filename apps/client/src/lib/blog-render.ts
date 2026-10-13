/**
 * Shared blog block helpers.
 *
 * The backend stores every article as an ordered list of typed blocks
 * (see apps/server/src/core/schema/blog.ts). This module converts those
 * blocks into clean, semantic, SEO-friendly HTML for public rendering, and
 * provides small utilities (slugify, excerpt, reading time) shared between the
 * admin editor and the public article page.
 *
 * It is intentionally framework-agnostic (no React / no DOM) so it can run on
 * the Astro server at request time.
 */

export type BackendBlockType =
  | 'PARAGRAPH'
  | 'HEADING_1'
  | 'HEADING_2'
  | 'HEADING_3'
  | 'HEADING_4'
  | 'HEADING_5'
  | 'HEADING_6'
  | 'IMAGE'
  | 'VIDEO'
  | 'QUOTE'
  | 'CODE'
  | 'BULLET_LIST'
  | 'NUMBERED_LIST'
  | 'DIVIDER';

export interface ApiBlock {
  id?: string;
  type: BackendBlockType;
  value: string;
  position?: number;
  metadata?: Record<string, unknown> | null;
}

export interface ApiBlog {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  author?: { id: string; name: string } | null;
  blocks?: ApiBlock[];
}

/** Turn a title into a stable, URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

const HEADING_LEVELS: Record<string, number> = {
  HEADING_1: 1,
  HEADING_2: 2,
  HEADING_3: 3,
  HEADING_4: 4,
  HEADING_5: 5,
  HEADING_6: 6,
};

/** Escape plain text for safe HTML output. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Minimal sanitizer for admin-authored rich HTML. Admins are trusted, but we
 * still strip script tags, inline event handlers and javascript: URLs as a
 * defense-in-depth measure against stored XSS.
 */
export function sanitizeRichHtml(html: string): string {
  return html
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'");
}

function stripOuterListTag(html: string): string {
  // Pull the <li>...</li> items out of a single-item <ul>/<ol> wrapper so we
  // can merge consecutive list blocks into one semantic list.
  const match = html.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/i);
  return match ? match[2] : html;
}

function isTableCarrier(block: ApiBlock): boolean {
  return (
    block.type === 'PARAGRAPH' &&
    typeof block.metadata === 'object' &&
    block.metadata !== null &&
    (block.metadata as Record<string, unknown>).kind === 'table'
  );
}

/**
 * Render an ordered list of backend blocks into semantic HTML.
 * Consecutive list items are merged into a single <ul>/<ol>.
 */
export function renderBlocksToHtml(blocks: ApiBlock[]): string {
  const ordered = [...blocks].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const parts: string[] = [];
  let listBuffer: { tag: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (listBuffer) {
      parts.push(
        `<${listBuffer.tag}>${listBuffer.items.join('')}</${listBuffer.tag}>`,
      );
      listBuffer = null;
    }
  };

  for (const block of ordered) {
    const meta = (block.metadata ?? {}) as Record<string, unknown>;

    if (block.type === 'BULLET_LIST' || block.type === 'NUMBERED_LIST') {
      const tag = block.type === 'BULLET_LIST' ? 'ul' : 'ol';
      const items = stripOuterListTag(sanitizeRichHtml(block.value)) ||
        `<li>${escapeHtml(block.value)}</li>`;
      if (listBuffer && listBuffer.tag === tag) {
        listBuffer.items.push(items);
      } else {
        flushList();
        listBuffer = { tag, items: [items] };
      }
      continue;
    }

    flushList();

    switch (block.type) {
      case 'HEADING_1':
      case 'HEADING_2':
      case 'HEADING_3':
      case 'HEADING_4':
      case 'HEADING_5':
      case 'HEADING_6': {
        const level = HEADING_LEVELS[block.type] ?? 2;
        const id = slugify(stripTags(block.value)) || undefined;
        const idAttr = id ? ` id="${id}"` : '';
        // Prefer raw inline HTML from the editor; fall back to escaped text.
        const inner = looksLikeHtml(block.value)
          ? innerOfTag(sanitizeRichHtml(block.value))
          : escapeHtml(block.value);
        parts.push(`<h${level}${idAttr}>${inner}</h${level}>`);
        break;
      }
      case 'IMAGE': {
        const url = String(block.value || '').trim();
        if (!url) break;
        const alt = typeof meta.alt === 'string' ? meta.alt : '';
        const caption = typeof meta.caption === 'string' ? meta.caption : '';
        const figcaption = caption
          ? `<figcaption>${escapeHtml(caption)}</figcaption>`
          : '';
        parts.push(
          `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(
            alt,
          )}" loading="lazy" decoding="async" />${figcaption}</figure>`,
        );
        break;
      }
      case 'VIDEO': {
        const url = String(block.value || '').trim();
        if (!url) break;
        parts.push(
          `<figure><video controls preload="metadata" src="${escapeHtml(
            url,
          )}"></video></figure>`,
        );
        break;
      }
      case 'CODE': {
        const lang = typeof meta.language === 'string' ? meta.language : '';
        const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        parts.push(
          `<pre><code${langClass}>${escapeHtml(block.value)}</code></pre>`,
        );
        break;
      }
      case 'QUOTE': {
        const inner = looksLikeHtml(block.value)
          ? sanitizeRichHtml(block.value)
          : `<p>${escapeHtml(block.value)}</p>`;
        parts.push(`<blockquote>${inner}</blockquote>`);
        break;
      }
      case 'DIVIDER': {
        parts.push('<hr />');
        break;
      }
      case 'PARAGRAPH':
      default: {
        if (isTableCarrier(block)) {
          // Table blocks are stored as a PARAGRAPH carrier (no TABLE enum in
          // the DB) with the full <table> HTML in value.
          parts.push(
            `<div class="table-scroll">${sanitizeRichHtml(block.value)}</div>`,
          );
          break;
        }
        if (!block.value || !block.value.trim()) break;
        const html = looksLikeHtml(block.value)
          ? sanitizeRichHtml(block.value)
          : `<p>${escapeHtml(block.value)}</p>`;
        parts.push(html);
        break;
      }
    }
  }

  flushList();
  return parts.join('\n');
}

function looksLikeHtml(value: string): boolean {
  return /<([a-z][a-z0-9]*)\b[^>]*>/i.test(value);
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Return the inner HTML of the first wrapping tag (e.g. strip <h2>..</h2>). */
function innerOfTag(value: string): string {
  const match = value.match(/<([a-z0-9]+)[^>]*>([\s\S]*)<\/\1>/i);
  return match ? match[2] : value;
}

/** Plain-text excerpt from blocks, used for meta description fallback. */
export function blocksToPlainText(blocks: ApiBlock[]): string {
  return blocks
    .map((b) => stripTags(b.value))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Rough reading time in minutes based on ~220 wpm. */
export function readingTimeMinutes(blocks: ApiBlock[]): number {
  const words = blocksToPlainText(blocks).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
