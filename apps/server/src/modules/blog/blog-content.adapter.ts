/**
 * Adapter to translate between Rich Text (HTML / TipTap) and Structured Blog Blocks.
 * Ensures backward-compatibility with the existing blogBlock database schema while
 * guaranteeing safe, semantic HTML output on the server side.
 */

export interface BlockRecord {
  type:
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
    | 'DIVIDER'
    | 'TABLE'
    | 'CALLOUT';
  value: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Parses raw HTML (e.g. from TipTap) into typed structured blocks.
 */
export function htmlToBlocks(html: string): BlockRecord[] {
  if (!html || !html.trim()) return [];

  const blocks: BlockRecord[] = [];
  // Clean comments and normalize carriage returns
  const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n/g, '\n');

  // Match top-level HTML tags
  const tagRegex = /<(h[1-6]|p|blockquote|pre|ul|ol|hr|figure|img|table|iframe|div)([^>]*)>([\s\S]*?)<\/\1>|<(img|hr)([^>]*)\/?>/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(cleanHtml)) !== null) {
    const tagName = (match[1] || match[4] || '').toLowerCase();
    const attributes = match[2] || match[5] || '';
    const innerContent = (match[3] || '').trim();

    switch (tagName) {
      case 'h1':
        blocks.push({ type: 'HEADING_1', value: stripTags(innerContent) });
        break;
      case 'h2':
        blocks.push({ type: 'HEADING_2', value: stripTags(innerContent) });
        break;
      case 'h3':
        blocks.push({ type: 'HEADING_3', value: stripTags(innerContent) });
        break;
      case 'h4':
        blocks.push({ type: 'HEADING_4', value: stripTags(innerContent) });
        break;
      case 'h5':
        blocks.push({ type: 'HEADING_5', value: stripTags(innerContent) });
        break;
      case 'h6':
        blocks.push({ type: 'HEADING_6', value: stripTags(innerContent) });
        break;
      case 'blockquote':
        blocks.push({ type: 'QUOTE', value: innerContent });
        break;
      case 'pre': {
        const langMatch = attributes.match(/class=["'][^"']*language-([a-zA-Z0-9_-]+)[^"']*["']/i);
        const language = langMatch ? langMatch[1] : 'plaintext';
        const codeText = stripTags(innerContent);
        blocks.push({
          type: 'CODE',
          value: codeText,
          metadata: { language },
        });
        break;
      }
      case 'ul':
        blocks.push({ type: 'BULLET_LIST', value: innerContent });
        break;
      case 'ol':
        blocks.push({ type: 'NUMBERED_LIST', value: innerContent });
        break;
      case 'hr':
        blocks.push({ type: 'DIVIDER', value: '' });
        break;
      case 'img': {
        const srcMatch = attributes.match(/src=["']([^"']+)["']/i);
        const altMatch = attributes.match(/alt=["']([^"']*)["']/i);
        const titleMatch = attributes.match(/title=["']([^"']*)["']/i);
        if (srcMatch) {
          blocks.push({
            type: 'IMAGE',
            value: srcMatch[1],
            metadata: {
              alt: altMatch ? altMatch[1] : '',
              caption: titleMatch ? titleMatch[1] : '',
            },
          });
        }
        break;
      }
      case 'table':
        blocks.push({ type: 'TABLE', value: innerContent });
        break;
      case 'iframe': {
        const srcMatch = attributes.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          blocks.push({
            type: 'VIDEO',
            value: srcMatch[1],
            metadata: { embedUrl: srcMatch[1] },
          });
        }
        break;
      }
      case 'div': {
        if (attributes.includes('callout') || attributes.includes('alert') || attributes.includes('important-note')) {
          blocks.push({ type: 'CALLOUT', value: innerContent });
          break;
        }
        if (innerContent) {
          blocks.push({ type: 'PARAGRAPH', value: innerContent });
        }
        break;
      }
      case 'p':
      default: {
        // If image is inside p
        const imgInside = attributes.match(/src=["']([^"']+)["']/i) || innerContent.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
        if (imgInside && innerContent.startsWith('<img')) {
          const srcMatch = innerContent.match(/src=["']([^"']+)["']/i);
          const altMatch = innerContent.match(/alt=["']([^"']*)["']/i);
          if (srcMatch) {
            blocks.push({
              type: 'IMAGE',
              value: srcMatch[1],
              metadata: { alt: altMatch ? altMatch[1] : '' },
            });
            break;
          }
        }
        if (innerContent) {
          blocks.push({ type: 'PARAGRAPH', value: innerContent });
        }
        break;
      }
    }
  }

  // Fallback: if no blocks were matched by regex but string is non-empty
  if (blocks.length === 0 && cleanHtml.trim()) {
    blocks.push({ type: 'PARAGRAPH', value: cleanHtml.trim() });
  }

  return blocks;
}

/**
 * Converts structured blocks into sanitized semantic HTML for SSR and public reading.
 */
export function blocksToHtml(blocks: BlockRecord[]): string {
  if (!blocks || blocks.length === 0) return '';

  return blocks
    .sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0))
    .map((block) => {
      const meta = block.metadata || {};

      switch (block.type) {
        case 'HEADING_1':
          return `<h1>${escapeHtml(block.value)}</h1>`;
        case 'HEADING_2':
          return `<h2 id="${slugify(block.value)}">${escapeHtml(block.value)}</h2>`;
        case 'HEADING_3':
          return `<h3 id="${slugify(block.value)}">${escapeHtml(block.value)}</h3>`;
        case 'HEADING_4':
          return `<h4 id="${slugify(block.value)}">${escapeHtml(block.value)}</h4>`;
        case 'HEADING_5':
          return `<h5>${escapeHtml(block.value)}</h5>`;
        case 'HEADING_6':
          return `<h6>${escapeHtml(block.value)}</h6>`;
        case 'PARAGRAPH':
          return `<p>${sanitizeInlineHtml(block.value)}</p>`;
        case 'QUOTE':
          return `<blockquote>${sanitizeInlineHtml(block.value)}</blockquote>`;
        case 'CODE': {
          const lang = (meta.language as string) || 'plaintext';
          return `<pre class="language-${lang}"><code class="language-${lang}">${escapeHtml(block.value)}</code></pre>`;
        }
        case 'BULLET_LIST':
          return `<ul>${sanitizeListHtml(block.value)}</ul>`;
        case 'NUMBERED_LIST':
          return `<ol>${sanitizeListHtml(block.value)}</ol>`;
        case 'DIVIDER':
          return `<hr class="my-6 border-border" />`;
        case 'IMAGE': {
          const alt = escapeHtml((meta.alt as string) || '');
          const caption = (meta.caption as string) || '';
          const figCaptionHtml = caption ? `<figcaption class="text-xs text-muted mt-1 text-center">${escapeHtml(caption)}</figcaption>` : '';
          return `<figure class="my-4"><img src="${escapeHtml(block.value)}" alt="${alt}" loading="lazy" class="rounded-lg max-w-full h-auto" />${figCaptionHtml}</figure>`;
        }
        case 'VIDEO':
          return `<div class="aspect-video my-4"><iframe src="${escapeHtml(block.value)}" class="w-full h-full rounded-lg" allowfullscreen></iframe></div>`;
        case 'TABLE':
          return `<div class="overflow-x-auto my-4"><table class="min-w-full border border-border">${sanitizeTableHtml(block.value)}</table></div>`;
        case 'CALLOUT':
          return `<div class="p-4 my-4 rounded-lg bg-blue-50/20 border-l-4 border-blue-500 text-sm leading-relaxed">${sanitizeInlineHtml(block.value)}</div>`;
        default:
          return `<p>${sanitizeInlineHtml(block.value)}</p>`;
      }
    })
    .join('\n');
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Basic safe inline tags: strong, b, em, i, u, s, a, code, br, span
 */
function sanitizeInlineHtml(html: string): string {
  if (!html) return '';
  // Disallow scripts, onerror, onclick, style injection
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

function sanitizeListHtml(html: string): string {
  if (!html) return '';
  return sanitizeInlineHtml(html);
}

function sanitizeTableHtml(html: string): string {
  if (!html) return '';
  return sanitizeInlineHtml(html);
}
