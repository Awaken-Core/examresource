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
      case 'ul': {
        const bulletMatch = attributes.match(/data-bullet=["'](disc|circle|square)["']/i);
        blocks.push({
          type: 'BULLET_LIST',
          value: innerContent,
          metadata: { bullet: bulletMatch ? bulletMatch[1].toLowerCase() : 'disc' },
        });
        break;
      }
      case 'figure': {
        const image = readImageTag(innerContent);
        if (image) blocks.push(image);
        break;
      }
      case 'ol':
        blocks.push({ type: 'NUMBERED_LIST', value: innerContent });
        break;
      case 'hr':
        blocks.push({ type: 'DIVIDER', value: '' });
        break;
      case 'img': {
        const image = readImageTag(`<img${attributes}>`);
        if (image) blocks.push(image);
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
        const onlyCode = innerContent.match(/^<code([^>]*)>([\s\S]*?)<\/code>$/i);
        if (tagName === 'p' && onlyCode) {
          const langMatch = onlyCode[1].match(/language-([a-zA-Z0-9_+-]+)/i);
          const codeText = stripTags(onlyCode[2]);
          blocks.push({
            type: 'CODE',
            value: codeText,
            metadata: { language: langMatch?.[1] || guessCodeLanguage(codeText) },
          });
          break;
        }
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
        case 'IMAGE': {
          const altRaw = (meta.alt as string) || '';
          const alt = (!altRaw || altRaw.toLowerCase().includes('pasted image') || altRaw.toLowerCase() === 'image')
            ? escapeHtml((meta.caption as string) || 'Official examination notice and recruitment details')
            : escapeHtml(altRaw);
          const caption = (meta.caption as string) || '';
          const layouts = ['content', 'wide', 'full', 'left', 'center', 'right'];
          const layout = layouts.includes(String(meta.layout)) ? String(meta.layout) : 'full';
          const align = ['left', 'center', 'right'].includes(String(meta.align))
            ? String(meta.align)
            : layout === 'left' || layout === 'right' || layout === 'center'
              ? layout
              : 'center';
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
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return cleaned || 'section';
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

function readImageTag(html: string): BlockRecord | null {
  const tag = html.match(/<img([^>]*)>/i);
  if (!tag) return null;
  const attributes = tag[1];
  const srcMatch = attributes.match(/src=["']([^"']+)["']/i);
  if (!srcMatch) return null;
  const altMatch = attributes.match(/alt=["']([^"']*)["']/i);
  const titleMatch = attributes.match(/title=["']([^"']*)["']/i);
  const dataCaptionMatch = attributes.match(/data-caption=["']([^"']*)["']/i);
  const captionMatch = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
  const alignMatch = attributes.match(/data-align=["'](left|center|right)["']/i);
  const layoutMatch = attributes.match(/data-layout=["'](content|wide|full|left|center|right)["']/i);
  const widthMatch = attributes.match(/\bwidth=["'](\d+)["']/i);
  const heightMatch = attributes.match(/\bheight=["'](\d+)["']/i);
  const width = widthMatch ? Number(widthMatch[1]) : null;
  const height = heightMatch ? Number(heightMatch[1]) : null;
  return {
    type: 'IMAGE',
    value: srcMatch[1],
    metadata: {
      alt: altMatch ? altMatch[1] : '',
      caption: captionMatch ? stripTags(captionMatch[1]) : dataCaptionMatch ? dataCaptionMatch[1] : titleMatch ? titleMatch[1] : '',
      align: alignMatch ? alignMatch[1] : 'center',
      layout: layoutMatch ? layoutMatch[1] : 'full',
      ...(width && width >= 80 ? { width } : {}),
      ...(height && height >= 40 ? { height } : {}),
    },
  };
}

function sanitizeListHtml(html: string): string {
  if (!html) return '';
  return sanitizeInlineHtml(html);
}

function sanitizeTableHtml(html: string): string {
  if (!html) return '';
  return sanitizeInlineHtml(html);
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
  if (!sourceBlocks || sourceBlocks.length === 0) return targetBlocks || [];
  if (!targetBlocks || targetBlocks.length === 0) {
    return sourceBlocks.filter((b) => b.type === 'IMAGE');
  }

  const sourceImages = sourceBlocks.filter((b) => b.type === 'IMAGE');
  if (sourceImages.length === 0) return targetBlocks;

  const targetImageUrls = new Set(
    targetBlocks.filter((b) => b.type === 'IMAGE').map((b) => b.value),
  );

  const missingImages = sourceImages.filter((img) => !targetImageUrls.has(img.value));
  if (missingImages.length === 0) return targetBlocks;

  const result = [...targetBlocks];

  const isHeading = (b: BlockRecord) =>
    ['HEADING_1', 'HEADING_2', 'HEADING_3', 'HEADING_4', 'HEADING_5', 'HEADING_6'].includes(
      b.type,
    );

  for (const img of missingImages) {
    const sourceIdx = sourceBlocks.indexOf(img);

    // 1. Count headings before this image in source & blocks after last heading
    let headingsBefore = 0;
    let blocksAfterLastHeading = 0;
    for (let i = 0; i < sourceIdx; i++) {
      if (isHeading(sourceBlocks[i])) {
        headingsBefore++;
        blocksAfterLastHeading = 0;
      } else if (sourceBlocks[i].type !== 'IMAGE') {
        blocksAfterLastHeading++;
      }
    }

    // 2. Find matching location in target
    let targetInsertIdx = -1;
    if (headingsBefore > 0) {
      let targetHeadingsFound = 0;
      for (let j = 0; j < result.length; j++) {
        if (isHeading(result[j])) {
          targetHeadingsFound++;
          if (targetHeadingsFound === headingsBefore) {
            // Found matching heading in target. Advance by blocksAfterLastHeading, but stop before next heading
            let offset = 0;
            let k = j + 1;
            while (
              k < result.length &&
              !isHeading(result[k]) &&
              offset < blocksAfterLastHeading
            ) {
              if (result[k].type !== 'IMAGE') offset++;
              k++;
            }
            targetInsertIdx = k;
            break;
          }
        }
      }
    } else {
      // Image is before any headings (introductory section)
      let offset = 0;
      let k = 0;
      while (
        k < result.length &&
        !isHeading(result[k]) &&
        offset < blocksAfterLastHeading
      ) {
        if (result[k].type !== 'IMAGE') offset++;
        k++;
      }
      targetInsertIdx = k;
    }

    // 3. Fallback to relative ratio if targetInsertIdx is still -1
    if (targetInsertIdx === -1) {
      const sourceTotal = Math.max(1, sourceBlocks.length);
      const ratio = sourceIdx / sourceTotal;
      targetInsertIdx = Math.min(
        result.length,
        Math.max(0, Math.round(ratio * result.length)),
      );
    }

    // Insert image block into target at the calculated position
    result.splice(targetInsertIdx, 0, {
      type: 'IMAGE',
      value: img.value,
      metadata: img.metadata ? { ...img.metadata } : null,
    });
  }

  return result;
}
