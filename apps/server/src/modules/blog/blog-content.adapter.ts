/**
 * Adapter to translate between Rich Text (HTML / TipTap) and Structured Blog Blocks.
 * Ensures backward-compatibility with the existing blogBlock database schema while
 * guaranteeing safe, semantic HTML output on the server side.
 */

import { sanitizeHtml } from '../../core/security/html-sanitizer.js';

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

function parseBlockFromTag(
  tagName: string,
  attributes: string,
  innerContent: string,
): BlockRecord | null {
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    const level = tagName[1];
    const type = `HEADING_${level}` as BlockRecord['type'];
    return { type, value: stripTags(innerContent) };
  }

  switch (tagName) {
    case 'blockquote':
      return { type: 'QUOTE', value: innerContent };
    case 'pre': {
      const langMatch = /class=["'][^"']*language-([a-z0-9_-]+)[^"']*["']/i.exec(attributes);
      const language = langMatch ? langMatch[1] : 'plaintext';
      return {
        type: 'CODE',
        value: stripTags(innerContent),
        metadata: { language },
      };
    }
    case 'ul': {
      const bulletMatch = /data-bullet=["'](disc|circle|square)["']/i.exec(attributes);
      return {
        type: 'BULLET_LIST',
        value: innerContent,
        metadata: { bullet: bulletMatch ? bulletMatch[1].toLowerCase() : 'disc' },
      };
    }
    case 'figure':
      return readImageTag(innerContent);
    case 'ol':
      return { type: 'NUMBERED_LIST', value: innerContent };
    case 'hr':
      return { type: 'DIVIDER', value: '' };
    case 'img':
      return readImageTag(`<img${attributes}>`);
    case 'table':
      return { type: 'TABLE', value: innerContent };
    case 'iframe': {
      const srcMatch = /src=["']([^"']+)["']/i.exec(attributes);
      if (srcMatch) {
        return {
          type: 'VIDEO',
          value: srcMatch[1],
          metadata: { embedUrl: srcMatch[1] },
        };
      }
      return null;
    }
    case 'div': {
      if (attributes.includes('callout') || attributes.includes('alert') || attributes.includes('important-note')) {
        return { type: 'CALLOUT', value: innerContent };
      }
      return innerContent ? { type: 'PARAGRAPH', value: innerContent } : null;
    }
    case 'p':
    default: {
      const onlyCode = /^<code([^>]*)>([\s\S]*?)<\/code>$/i.exec(innerContent);
      if (tagName === 'p' && onlyCode) {
        const langMatch = /language-([a-z0-9_+-]+)/i.exec(onlyCode[1]);
        const codeText = stripTags(onlyCode[2]);
        return {
          type: 'CODE',
          value: codeText,
          metadata: { language: langMatch?.[1] || guessCodeLanguage(codeText) },
        };
      }
      if (innerContent.startsWith('<img')) {
        const srcMatch = /src=["']([^"']+)["']/i.exec(innerContent);
        const altMatch = /alt=["']([^"']*)["']/i.exec(innerContent);
        if (srcMatch) {
          return {
            type: 'IMAGE',
            value: srcMatch[1],
            metadata: { alt: altMatch ? altMatch[1] : '' },
          };
        }
      }
      return innerContent ? { type: 'PARAGRAPH', value: innerContent } : null;
    }
  }
}

/**
 * Parses raw HTML (e.g. from TipTap) into typed structured blocks.
 */
export function htmlToBlocks(html: string): BlockRecord[] {
  if (!html?.trim()) return [];

  const blocks: BlockRecord[] = [];
  // Clean comments and normalize carriage returns
  const cleanHtml = html.replaceAll('\r\n', '\n').replace(/<!--[\s\S]*?-->/g, '');

  // Match top-level HTML tags
  const tagRegex = /<(h[1-6]|p|blockquote|pre|ul|ol|hr|figure|img|table|iframe|div)([^>]*)>([\s\S]*?)<\/\1>|<(img|hr)([^>]*)\/?>/gi;

  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(cleanHtml)) !== null) {
    const tagName = (match[1] || match[4] || '').toLowerCase();
    const attributes = match[2] || match[5] || '';
    const innerContent = (match[3] || '').trim();

    const block = parseBlockFromTag(tagName, attributes, innerContent);
    if (block) {
      blocks.push(block);
    }
  }

  // Fallback: if no blocks were matched by regex but string is non-empty
  if (blocks.length === 0 && cleanHtml.trim()) {
    blocks.push({ type: 'PARAGRAPH', value: cleanHtml.trim() });
  }

  return blocks;
}

function renderImageBlock(block: BlockRecord, meta: Record<string, unknown>): string {
  const altRaw = cleanHtmlEntities((meta.alt as string) || '');
  const caption = cleanHtmlEntities((meta.caption as string) || '');
  const alt = (!altRaw || altRaw.toLowerCase().includes('pasted image') || altRaw.toLowerCase() === 'image')
    ? escapeHtml(caption || 'Official examination notice and recruitment details')
    : escapeHtml(altRaw);

  const layouts = ['content', 'wide', 'full', 'left', 'center', 'right'];
  const layout = layouts.includes(String(meta.layout)) ? String(meta.layout) : 'full';

  let align = 'center';
  if (['left', 'center', 'right'].includes(String(meta.align))) {
    align = String(meta.align);
  } else if (layout === 'left' || layout === 'right' || layout === 'center') {
    align = layout;
  }

  const width = Number(meta.width);
  const height = Number(meta.height);
  const widthVal = Number.isFinite(width) && width >= 80 ? Math.round(width) : 800;
  const heightVal = Number.isFinite(height) && height >= 40 ? Math.round(height) : Math.round((widthVal * 9) / 16);
  const widthAttr = ` width="${widthVal}"`;
  const heightAttr = ` height="${heightVal}"`;
  const styleAttr = ` style="aspect-ratio: ${widthVal} / ${heightVal}; max-width: 100%;"`;
  const figCaptionHtml = caption ? `<figcaption class="text-xs text-muted mt-1 text-center">${escapeHtml(caption)}</figcaption>` : '';

  return `<figure class="article-figure" data-align="${align}" data-layout="${layout}"><img src="${escapeHtml(block.value)}" alt="${alt}" data-align="${align}" data-layout="${layout}"${widthAttr}${heightAttr}${styleAttr} loading="lazy" class="article-media rounded-lg h-auto" />${figCaptionHtml}</figure>`;
}

function renderSingleBlock(block: BlockRecord): string {
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
    case 'BULLET_LIST': {
      const bullet = ['disc', 'circle', 'square'].includes(String(meta.bullet))
        ? String(meta.bullet)
        : 'disc';
      return `<ul data-bullet="${bullet}">${sanitizeListHtml(block.value)}</ul>`;
    }
    case 'NUMBERED_LIST':
      return `<ol>${sanitizeListHtml(block.value)}</ol>`;
    case 'DIVIDER':
      return `<hr class="my-6 border-border" />`;
    case 'IMAGE':
      return renderImageBlock(block, meta);
    case 'VIDEO':
      return `<div class="aspect-video my-4"><iframe src="${escapeHtml(block.value)}" class="w-full h-full rounded-lg" allowfullscreen></iframe></div>`;
    case 'TABLE':
      return `<div class="overflow-x-auto my-4"><table class="min-w-full border border-border">${sanitizeTableHtml(block.value)}</table></div>`;
    case 'CALLOUT':
      return `<div class="p-4 my-4 rounded-lg bg-blue-50/20 border-l-4 border-blue-500 text-sm leading-relaxed">${sanitizeInlineHtml(block.value)}</div>`;
    default:
      return `<p>${sanitizeInlineHtml(block.value)}</p>`;
  }
}

/**
 * Converts structured blocks into sanitized semantic HTML for SSR and public reading.
 */
export function blocksToHtml(blocks: BlockRecord[]): string {
  if (!blocks?.length) return '';

  return [...blocks]
    .sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0))
    .map(renderSingleBlock)
    .join('\n');
}

export function cleanHtmlEntities(str: string): string {
  if (!str) return '';
  let prev = '';
  let curr = str;
  for (let i = 0; i < 5 && curr !== prev; i++) {
    prev = curr;
    curr = curr
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&#x27;', "'")
      .replaceAll('&#x2F;', '/');
  }
  return curr;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  const clean = cleanHtmlEntities(str);
  return clean
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\\+/g, '')
    .trim();
}

function guessCodeLanguage(source: string) {
  if (/\bpublic class\b|\bSystem\.out\b|\bvoid main\b/.test(source)) return 'java';
  if (/\bconsole\.log\b|\bfunction\b|\bconst\b|\blet\b/.test(source)) return 'javascript';
  if (/\bdef \b|\bprint\(/.test(source)) return 'python';
  return 'plaintext';
}

function slugify(text: string): string {
  const cleaned = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\\+/g, '')
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'section';
}

/**
 * Basic safe inline tags: strong, b, em, i, u, s, a, code, br, span
 */
function sanitizeInlineHtml(html: string): string {
  return sanitizeHtml(html, 'inline');
}

function sanitizeListHtml(html: string): string {
  return sanitizeHtml(html, 'list');
}

function sanitizeTableHtml(html: string): string {
  return sanitizeHtml(html, 'table');
}

function readImageTag(html: string): BlockRecord | null {
  const tag = /<img([^>]*)>/i.exec(html);
  if (!tag) return null;
  const attributes = tag[1];
  const srcMatch = /src=["']([^"']+)["']/i.exec(attributes);
  if (!srcMatch) return null;

  const altMatch = /alt=["']([^"']*)["']/i.exec(attributes);
  const titleMatch = /title=["']([^"']*)["']/i.exec(attributes);
  const dataCaptionMatch = /data-caption=["']([^"']*)["']/i.exec(attributes);
  const captionMatch = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(html);
  const alignMatch = /data-align=["'](left|center|right)["']/i.exec(attributes);
  const layoutMatch = /data-layout=["'](content|wide|full|left|center|right)["']/i.exec(attributes);
  const widthMatch = /\bwidth=["'](\d+)["']/i.exec(attributes);
  const heightMatch = /\bheight=["'](\d+)["']/i.exec(attributes);

  const width = widthMatch ? Number(widthMatch[1]) : null;
  const height = heightMatch ? Number(heightMatch[1]) : null;

  let caption = '';
  if (captionMatch) {
    caption = stripTags(captionMatch[1]);
  } else if (dataCaptionMatch) {
    caption = dataCaptionMatch[1];
  } else if (titleMatch) {
    caption = titleMatch[1];
  }

  return {
    type: 'IMAGE',
    value: srcMatch[1],
    metadata: {
      alt: altMatch ? altMatch[1] : '',
      caption,
      align: alignMatch ? alignMatch[1] : 'center',
      layout: layoutMatch ? layoutMatch[1] : 'full',
      ...(width && width >= 80 ? { width } : {}),
      ...(height && height >= 40 ? { height } : {}),
    },
  };
}

const isHeadingBlock = (b: BlockRecord) => b.type.startsWith('HEADING_');

function findTargetInsertionIndex(
  result: BlockRecord[],
  sourceBlocks: BlockRecord[],
  img: BlockRecord,
): number {
  const sourceIdx = sourceBlocks.indexOf(img);
  let headingsBefore = 0;
  let blocksAfterHeading = 0;

  for (let i = 0; i < sourceIdx; i++) {
    if (isHeadingBlock(sourceBlocks[i])) {
      headingsBefore++;
      blocksAfterHeading = 0;
    } else if (sourceBlocks[i].type !== 'IMAGE') {
      blocksAfterHeading++;
    }
  }

  let currentHeading = 0;
  let targetIdx = -1;

  for (let j = 0; j < result.length; j++) {
    if (isHeadingBlock(result[j])) {
      currentHeading++;
      if (currentHeading === headingsBefore) {
        let offset = 0;
        let k = j + 1;
        while (k < result.length && !isHeadingBlock(result[k]) && offset < blocksAfterHeading) {
          if (result[k].type !== 'IMAGE') offset++;
          k++;
        }
        targetIdx = k;
        break;
      }
    }
  }

  if (targetIdx !== -1) return targetIdx;

  if (headingsBefore === 0) {
    let offset = 0;
    let k = 0;
    while (k < result.length && !isHeadingBlock(result[k]) && offset < blocksAfterHeading) {
      if (result[k].type !== 'IMAGE') offset++;
      k++;
    }
    return k;
  }

  const ratio = sourceIdx / Math.max(1, sourceBlocks.length);
  return Math.min(result.length, Math.max(0, Math.round(ratio * result.length)));
}

/**
 * Synchronizes inline IMAGE blocks from sourceBlocks into targetBlocks at corresponding
 * heading-based or relative positions.
 * Ensures that images added to one language version automatically appear at the matching
 * position in the sibling language version (e.g. Hindi/Hinglish).
 */
export function syncImageBlocks(
  targetBlocks: BlockRecord[],
  sourceBlocks: BlockRecord[],
): BlockRecord[] {
  if (!sourceBlocks?.length) return targetBlocks || [];
  if (!targetBlocks?.length) {
    return sourceBlocks.filter((b) => b.type === 'IMAGE');
  }

  const sourceImages = sourceBlocks.filter((b) => b.type === 'IMAGE');
  if (sourceImages.length === 0) return targetBlocks;

  const targetUrls = new Set(
    targetBlocks.filter((b) => b.type === 'IMAGE').map((b) => b.value),
  );

  const missing = sourceImages.filter((img) => !targetUrls.has(img.value));
  if (missing.length === 0) return targetBlocks;

  const result = [...targetBlocks];
  for (const img of missing) {
    const idx = findTargetInsertionIndex(result, sourceBlocks, img);
    result.splice(idx, 0, {
      type: 'IMAGE',
      value: img.value,
      metadata: img.metadata ? { ...img.metadata } : null,
    });
  }

  return result;
}
