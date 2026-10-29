/**
 * Comprehensive HTML Sanitizer for Rich Text & Content Blocks
 * Pure TypeScript implementation compatible with Node.js and Cloudflare Workers runtime.
 * Strips script execution vectors, unquoted/quoted event handlers, dangerous schemes,
 * and unauthorized tags.
 */

const DANGEROUS_ELEMENTS = new Set([
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'svg',
  'math',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'optgroup',
  'link',
  'meta',
  'base',
  'marquee',
  'blink',
  'portal',
  'dialog',
]);

const SAFE_INLINE_TAGS = new Set([
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'del',
  'strike',
  'code',
  'pre',
  'kbd',
  'sub',
  'sup',
  'a',
  'br',
  'span',
  'mark',
  'small',
  'time',
  'abbr',
]);

const SAFE_LIST_TAGS = new Set([
  ...SAFE_INLINE_TAGS,
  'ul',
  'ol',
  'li',
]);

const SAFE_TABLE_TAGS = new Set([
  ...SAFE_INLINE_TAGS,
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
]);

const SAFE_BLOCK_TAGS = new Set([
  ...SAFE_TABLE_TAGS,
  ...SAFE_LIST_TAGS,
  'p',
  'blockquote',
  'div',
  'figure',
  'figcaption',
  'img',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

const SAFE_ATTRIBUTES = new Set([
  'class',
  'id',
  'style',
  'href',
  'src',
  'alt',
  'title',
  'target',
  'rel',
  'width',
  'height',
  'loading',
  'colspan',
  'rowspan',
  'scope',
  'align',
  'valign',
  'data-align',
  'data-layout',
  'data-bullet',
  'data-caption',
]);

function decodeEntities(str: string): string {
  let prev = '';
  let curr = str;
  // Decode up to 3 passes to prevent nested entity obfuscation (e.g. &amp;lt;)
  for (let i = 0; i < 3 && curr !== prev; i++) {
    prev = curr;
    curr = curr
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#x2F;/gi, '/')
      .replace(/&#(\d+);?/g, (_, dec) => {
        const code = Number(dec);
        return code >= 32 && code <= 126 ? String.fromCharCode(code) : '';
      })
      .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => {
        const code = Number.parseInt(hex, 16);
        return code >= 32 && code <= 126 ? String.fromCharCode(code) : '';
      });
  }
  return curr;
}

function isSafeUrl(url: string, isImage = false): boolean {
  if (!url) return false;
  // eslint-disable-next-line no-control-regex
  const decoded = decodeEntities(url).trim().replace(/[\x00-\x1F\x7F\s]+/g, '');

  // Deny dangerous protocol schemes
  if (/^(?:javascript|vbscript|data):/i.test(decoded)) {
    // Only allow safe raster image data URIs if isImage
    if (isImage && /^data:image\/(?:png|jpeg|jpg|webp|gif|avif);base64,[a-z0-9+/=]+$/i.test(decoded)) {
      return true;
    }
    return false;
  }

  // Allow standard web protocols and relative paths
  return (
    /^(?:https?:|mailto:|tel:|\/|#|\.)/i.test(decoded) ||
    /^[a-z0-9_-]/i.test(decoded)
  );
}

function cleanAttributes(rawAttrs: string, tagName: string): string {
  if (!rawAttrs.trim()) return '';

  // Match attributes with double quotes, single quotes, or unquoted values
  const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  const cleaned: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    const rawName = match[1]!.toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? '';

    // 1. Unconditionally strip ANY event handler (on*, onload, onerror, onclick, etc.)
    if (rawName.startsWith('on')) {
      continue;
    }

    // 2. Reject attributes not on the allowlist (unless data-* or aria-*)
    if (
      !SAFE_ATTRIBUTES.has(rawName) &&
      !rawName.startsWith('data-') &&
      !rawName.startsWith('aria-')
    ) {
      continue;
    }

    // 3. Inspect style attributes for dangerous constructs
    if (rawName === 'style') {
      const decodedStyle = decodeEntities(val).toLowerCase();
      if (
        decodedStyle.includes('expression(') ||
        decodedStyle.includes('javascript:') ||
        decodedStyle.includes('url(') ||
        decodedStyle.includes('@import') ||
        decodedStyle.includes('behavior') ||
        decodedStyle.includes('-moz-binding')
      ) {
        continue;
      }
    }

    // 4. Validate URLs for href, src, and cite
    if (rawName === 'href' || rawName === 'src' || rawName === 'cite') {
      const isImg = tagName === 'img' || rawName === 'src';
      if (!isSafeUrl(val, isImg)) {
        continue;
      }
    }

    // 5. Enforce rel="noopener noreferrer" on target="_blank"
    if (tagName === 'a' && rawName === 'target' && val.toLowerCase() === '_blank') {
      cleaned.push('target="_blank"');
      if (!rawAttrs.includes('rel=')) {
        cleaned.push('rel="noopener noreferrer"');
      }
      continue;
    }

    // Safe escaped attribute output
    const safeVal = val
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    cleaned.push(`${rawName}="${safeVal}"`);
  }

  return cleaned.length > 0 ? ` ${cleaned.join(' ')}` : '';
}

export type SanitizeScope = 'inline' | 'list' | 'table' | 'block';

/**
 * Robust HTML sanitizer that strips all script injection vectors,
 * unquoted/quoted event handlers, and unauthorized tags.
 */
export function sanitizeHtml(html: string, scope: SanitizeScope = 'inline'): string {
  if (!html) return '';

  let allowedTags: Set<string>;
  switch (scope) {
    case 'block':
      allowedTags = SAFE_BLOCK_TAGS;
      break;
    case 'table':
      allowedTags = SAFE_TABLE_TAGS;
      break;
    case 'list':
      allowedTags = SAFE_LIST_TAGS;
      break;
    case 'inline':
    default:
      allowedTags = SAFE_INLINE_TAGS;
      break;
  }

  // 1. Strip raw script, style, and dangerous element blocks including contents
  let sanitized = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  for (const dangerous of DANGEROUS_ELEMENTS) {
    const blockRegex = new RegExp(`<${dangerous}\\b[\\s\\S]*?<\\/${dangerous}>`, 'gi');
    sanitized = sanitized.replace(blockRegex, '');
    const selfCloseRegex = new RegExp(`<${dangerous}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfCloseRegex, '');
  }

  // 2. Parse and filter all remaining HTML tags
  const tagRegex = /<\/?([a-zA-Z0-9_-]+)([^>]*)>/gi;
  sanitized = sanitized.replace(tagRegex, (fullTag, rawTagName, rawAttrs) => {
    const tagName = rawTagName.toLowerCase();

    // If tag is not in allowed tags list, strip it
    if (!allowedTags.has(tagName)) {
      return '';
    }

    // Handle closing tags
    if (fullTag.startsWith('</')) {
      return `</${tagName}>`;
    }

    // Clean attributes on opening/self-closing tags
    const cleanedAttrs = cleanAttributes(rawAttrs || '', tagName);
    const isSelfClosing = fullTag.endsWith('/>') || tagName === 'br' || tagName === 'hr' || tagName === 'img';
    return isSelfClosing ? `<${tagName}${cleanedAttrs} />` : `<${tagName}${cleanedAttrs}>`;
  });

  return sanitized;
}
