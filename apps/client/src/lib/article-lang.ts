export type ArticleLangVersion = {
  language: 'HINGLISH' | 'ENGLISH';
  title: string;
  description: string;
  pageTitle: string;
  pageDescription: string;
  htmlBody: string;
  readMinutes: number;
  updatedDate: string;
  coverImage: string | null;
  imageAlt: string | null;
  imageCaption: string | null;
  url: string;
};

export type ArticleLangBundle = {
  HINGLISH?: ArticleLangVersion;
  ENGLISH?: ArticleLangVersion;
};

type ListTag = 'ul' | 'ol' | 'li';

export function toHeadingSlug(text: string): string {
  let s = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\\+/g, '')
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  while (s.startsWith('-')) s = s.slice(1);
  while (s.endsWith('-')) s = s.slice(0, -1);
  return s || 'section';
}

function stripHtmlTags(html: string): string {
  let out = '';
  let inTag = false;
  for (const char of html) {
    if (char === '<') {
      inTag = true;
    } else if (char === '>') {
      inTag = false;
    } else if (!inTag) {
      out += char;
    }
  }
  return out;
}

function cleanPlainText(str: string): string {
  if (!str) return '';
  return stripHtmlTags(str).replace(/\s+/g, ' ').trim();
}

function normalizeHeadingTags(htmlBody: string, title: string) {
  const tocItems: { id: string; text: string; level: number }[] = [];
  tocItems.push({ id: 'overview-top', text: title, level: 2 });

  let hasEncounteredH2 = false;
  let hIdx = 0;

  const normalizedHtml = htmlBody.replace(
    /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_full, rawLvl, attrs = '', content = '') => {
      let lvl = Number.parseInt(rawLvl, 10);
      if (lvl >= 3 && !hasEncounteredH2) {
        lvl = 2;
      }
      if (lvl === 2) hasEncounteredH2 = true;

      const cleanText = cleanPlainText(content);
      const idMatch = /id=["']([^"']+)["']/i.exec(attrs);
      const id = idMatch ? idMatch[1] : toHeadingSlug(cleanText) || `heading-${++hIdx}`;
      const cleanAttrs = attrs.replace(/id=["'][^"']*["']/i, '').trim();

      if (cleanText) {
        tocItems.push({ level: lvl, id, text: cleanText });
      }

      const attrSuffix = cleanAttrs ? ` ${cleanAttrs}` : '';
      return `<h${lvl} id="${id}"${attrSuffix}>${content.replace(/\\+/g, '')}</h${lvl}>`;
    },
  );

  return { normalizedHtml, tocItems };
}

function sanitizeImageAlt(attrs: string, title: string): string {
  const altMatch = /alt=["']([^"']*)["']/i.exec(attrs);
  const currentAlt = altMatch ? altMatch[1].trim() : '';
  const altLower = currentAlt.toLowerCase();
  if (!currentAlt || altLower.includes('pasted image') || altLower === 'image') {
    const safeTitle = title.replaceAll('"', '&quot;');
    const contextualAlt = `${safeTitle} - Official Notice & Guide Details`;
    if (altMatch) {
      return attrs.replace(/alt=["'][^"']*["']/i, `alt="${contextualAlt}"`);
    }
    return `${attrs} alt="${contextualAlt}"`;
  }
  return attrs;
}

function computeImageDimensions(attrs: string): { newAttrs: string; widthVal: number; heightVal: number } {
  let newAttrs = attrs;
  const widthMatch = /\bwidth=["'](\d+)["']/i.exec(newAttrs);
  const heightMatch = /\bheight=["'](\d+)["']/i.exec(newAttrs);
  let widthVal = widthMatch ? Number.parseInt(widthMatch[1], 10) : 0;
  let heightVal = heightMatch ? Number.parseInt(heightMatch[1], 10) : 0;

  if (widthVal > 0 && (!heightVal || heightVal <= 0)) {
    heightVal = Math.round((widthVal * 9) / 16);
    newAttrs += ` height="${heightVal}"`;
  } else if (!widthVal && !heightVal) {
    widthVal = 800;
    heightVal = 450;
    newAttrs += ` width="${widthVal}" height="${heightVal}"`;
  }
  return { newAttrs, widthVal, heightVal };
}

function applyImageStyle(attrs: string, widthVal: number, heightVal: number): string {
  if (widthVal <= 0) return attrs;

  const alignMatch = /\bdata-align=["']([^"']*)["']/i.exec(attrs);
  const alignVal = alignMatch ? alignMatch[1].toLowerCase() : 'center';

  let alignStyle = 'display: block; margin-left: auto; margin-right: auto;';
  if (alignVal === 'left') {
    alignStyle = 'float: left; margin: 0.5rem 1.25rem 0.75rem 0;';
  } else if (alignVal === 'right') {
    alignStyle = 'float: right; margin: 0.5rem 0 0.75rem 1.25rem;';
  }

  const calcHeight = heightVal || Math.round((widthVal * 9) / 16);
  const widthStyle = `width: ${widthVal}px; max-width: 100%; height: auto; ${alignStyle} aspect-ratio: ${widthVal} / ${calcHeight};`;
  const styleMatch = /\bstyle=["']([^"']*)["']/i.exec(attrs);

  if (styleMatch) {
    const currentStyle = styleMatch[1].trim();
    const separator = currentStyle && !currentStyle.endsWith(';') ? ';' : '';
    return attrs.replace(/\bstyle=["'][^"']*["']/i, `style="${currentStyle}${separator} ${widthStyle}"`);
  }
  return `${attrs} style="${widthStyle}"`;
}

function optimizeSingleImage(attrs: string, title: string, isFirstImage: boolean): string {
  let updated = sanitizeImageAlt(attrs, title);
  const { newAttrs, widthVal, heightVal } = computeImageDimensions(updated);
  updated = applyImageStyle(newAttrs, widthVal, heightVal);

  if (isFirstImage) {
    updated = updated
      .replace(/\bloading=["'][^"']*["']/gi, '')
      .replace(/\bfetchpriority=["'][^"']*["']/gi, '')
      .replace(/\bdecoding=["'][^"']*["']/gi, '');
    updated += ' loading="eager" fetchpriority="high" decoding="async"';
  } else {
    if (!updated.includes('loading=')) updated += ' loading="lazy"';
    if (!updated.includes('decoding=')) updated += ' decoding="async"';
  }

  return `<img ${updated.replace(/\s+/g, ' ').trim()}>`;
}

function handleListClose(tagName: 'ul' | 'ol', fullTag: string, listStack: ListTag[]): string {
  let result = '';
  if (listStack.at(-1) === 'li') {
    result += '</li>';
    listStack.pop();
  }
  if (listStack.at(-1) === tagName) {
    result += fullTag;
    listStack.pop();
  } else {
    result += fullTag;
  }
  return result;
}

function handleListTag(tagName: 'ul' | 'ol', isClosing: boolean, fullTag: string, listStack: ListTag[]): string {
  if (isClosing) {
    return handleListClose(tagName, fullTag, listStack);
  }
  listStack.push(tagName);
  return fullTag;
}

function handleListItemTag(isClosing: boolean, fullTag: string, listStack: ListTag[]): string {
  if (isClosing) {
    if (listStack.at(-1) === 'li') {
      listStack.pop();
    }
    return fullTag;
  }
  let result = '';
  if (listStack.at(-1) === 'li') {
    result += '</li>';
    listStack.pop();
  }
  listStack.push('li');
  return `${result}${fullTag}`;
}

function closeOpenLists(listStack: ListTag[]): string {
  let closed = '';
  while (listStack.length > 0) {
    closed += `</${listStack.pop()}>`;
  }
  return closed;
}

/**
 * Repairs unclosed list tags (<ul>, <ol>, <li>) before top-level block elements
 * such as headings, horizontal rules, tables, and sections.
 */
export function repairUnclosedLists(html: string): string {
  if (!html) return '';

  const tagRegex = /<\/?(ul|ol|li|h[1-6]|hr|section|table)\b[^>]*>/gi;
  const listStack: ListTag[] = [];
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const isClosing = fullTag.startsWith('</');
    const tagName = match[1].toLowerCase();

    result += html.slice(lastIndex, match.index);
    lastIndex = tagRegex.lastIndex;

    if (tagName === 'ul' || tagName === 'ol') {
      result += handleListTag(tagName, isClosing, fullTag, listStack);
    } else if (tagName === 'li') {
      result += handleListItemTag(isClosing, fullTag, listStack);
    } else {
      if (!isClosing) {
        result += closeOpenLists(listStack);
      }
      result += fullTag;
    }
  }

  result += html.slice(lastIndex);
  result += closeOpenLists(listStack);

  return result;
}

export function processArticleHtml(rawHtml: string, title: string) {
  let htmlBody = rawHtml || '';

  // 1. Repair unclosed lists so headings/tables are never swallowed into <li>
  htmlBody = repairUnclosedLists(htmlBody);

  // 2. Normalize Headings
  const { normalizedHtml, tocItems } = normalizeHeadingTags(htmlBody, title);
  htmlBody = normalizedHtml;

  // 3. Optimize Images
  let imageCounter = 0;
  htmlBody = htmlBody.replace(/<img\b([^>]*)>/gi, (_full, attrs = '') => {
    imageCounter += 1;
    return optimizeSingleImage(attrs, title, imageCounter === 1);
  });

  // 4. Clean Figcaptions
  htmlBody = htmlBody.replace(/<figcaption([^>]*)>([\s\S]*?)<\/figcaption>/gi, (_full, attrs = '', content = '') => {
    let text = content;
    for (let i = 0; i < 4 && text.includes('&amp;'); i++) {
      text = text.replaceAll('&amp;amp;', '&amp;').replaceAll('&amp;', '&');
    }
    const safeText = text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
    return `<figcaption${attrs}>${safeText}</figcaption>`;
  });

  // 5. Transform FAQ Section
  htmlBody = transformFaqSection(htmlBody);

  return { htmlBody, tocItems };
}

interface FaqHeadingInfo {
  tag: string;
  attrs: string;
  id: string;
  text: string;
  full: string;
  start: number;
  end: number;
}

interface FaqItem {
  question: string;
  answer: string;
  num: number;
}

function findFaqHeading(html: string): FaqHeadingInfo | null {
  const faqH2Regex = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = faqH2Regex.exec(html)) !== null) {
    const rawHeadingText = cleanPlainText(match[3]);
    if (/(faq|frequently asked questions|अक्सर पूछे जाने वाले सवाल)/i.test(rawHeadingText)) {
      const idMatch = /id=["']([^"']+)["']/i.exec(match[2]);
      return {
        tag: `h${match[1]}`,
        attrs: match[2],
        id: idMatch ? idMatch[1] : toHeadingSlug(rawHeadingText) || 'faqs',
        text: rawHeadingText,
        full: match[0],
        start: match.index,
        end: faqH2Regex.lastIndex,
      };
    }
  }
  return null;
}

function extractDetailsItems(faqSectionRaw: string): FaqItem[] {
  const items: FaqItem[] = [];
  const detailsRegex = /<details\b([^>]*)>([\s\S]*?)<\/details>/gi;
  let dMatch: RegExpExecArray | null;
  let count = 0;

  while ((dMatch = detailsRegex.exec(faqSectionRaw)) !== null) {
    count++;
    const inner = dMatch[2];
    const summaryMatch = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i.exec(inner);
    const q = summaryMatch ? cleanPlainText(summaryMatch[1]) : `Question ${count}`;
    const a = summaryMatch ? inner.replace(summaryMatch[0], '').trim() : inner.trim();
    items.push({ question: q, answer: a, num: count });
  }
  return items;
}

function extractHeadingItems(faqSectionRaw: string): FaqItem[] {
  const items: FaqItem[] = [];
  const h3Regex = /<h[34]\b[^>]*>([\s\S]*?)<\/h[34]>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let h3Match: RegExpExecArray | null;
  let count = 0;

  while ((h3Match = h3Regex.exec(faqSectionRaw)) !== null) {
    count++;
    const q = cleanPlainText(h3Match[1]);
    const a = h3Match[2].trim();
    items.push({ question: q, answer: `<p>${a}</p>`, num: count });
  }
  return items;
}

function extractParagraphItems(faqSectionRaw: string): FaqItem[] {
  const items: FaqItem[] = [];
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch: RegExpExecArray | null;
  let count = 0;

  while ((pMatch = pRegex.exec(faqSectionRaw)) !== null) {
    const inner = pMatch[1].trim();

    if (inner.startsWith('<strong>')) {
      const strongEnd = inner.indexOf('</strong>');
      if (strongEnd > 8) {
        count++;
        const qText = cleanPlainText(inner.slice(8, strongEnd));
        let after = inner.slice(strongEnd + 9).trim();
        if (after.startsWith('<br>') || after.startsWith('<br/>')) {
          after = after.replace(/^<br\s*\/?>/i, '').trim();
        }
        after = after.replace(/^(?:<strong>)?(?:Ans\.?|Ans:|Answer:|उत्तर:?)(?:<\/strong>)?\s*[:-]?\s*/i, '').trim();
        items.push({ question: qText, answer: `<p>${after}</p>`, num: count });
      }
    } else {
      const dividerMatch = /<br\s*\/?>|\b(?:Ans|उत्तर|Answer)[:.]/i.exec(inner);
      if (dividerMatch && /^(?:Q\d*|प्रश्न\s*\d*|\d+)[:.]/i.test(inner)) {
        count++;
        const qPart = inner.slice(0, dividerMatch.index);
        const aPart = inner.slice(dividerMatch.index + dividerMatch[0].length);
        const q = cleanPlainText(qPart);
        const a = aPart.replace(/^(?:Ans\.?|Ans:|Answer:|उत्तर:?)\s*[:-]?\s*/i, '').trim();
        items.push({ question: q, answer: `<p>${a}</p>`, num: count });
      }
    }
  }
  return items;
}

function stripQuestionPrefix(text: string): string {
  const sepIdx = text.search(/[:.]/);
  if (sepIdx > 0 && sepIdx <= 15) {
    const prefix = text.slice(0, sepIdx).trim().toLowerCase();
    if (prefix.startsWith('q') || prefix.startsWith('प्रश्न') || /^\d+$/.test(prefix)) {
      return text.slice(sepIdx + 1).trim() || text;
    }
  }
  return text;
}

function renderAccordionItem(item: FaqItem): string {
  const cleanQ = stripQuestionPrefix(item.question);

  return `<details class="faq-accordion-item group border-b border-border/70 last:border-b-0">
    <summary class="flex flex-1 items-center justify-between py-4 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 transition-all hover:text-accent cursor-pointer list-none select-none">
      <span class="leading-snug pr-4 text-left">${cleanQ}</span>
      <svg class="faq-chevron w-4 h-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </summary>
    <div class="faq-answer pb-4 pt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
      ${item.answer}
    </div>
  </details>`;
}

/**
 * Transforms standard FAQ sections (both H3-based and Paragraph-based from the DB)
 * into a minimal, clean, accessible shadcn / Radix UI style enclosed accordion.
 */
export function transformFaqSection(html: string): string {
  if (!html) return '';

  const faqHeading = findFaqHeading(html);
  if (!faqHeading) return html;

  const afterH2 = html.slice(faqHeading.end);
  const nextHeadingMatch = /<h[12]\b/i.exec(afterH2);
  const faqSectionRaw = nextHeadingMatch ? afterH2.slice(0, nextHeadingMatch.index) : afterH2;
  const remainder = nextHeadingMatch ? afterH2.slice(nextHeadingMatch.index) : '';

  let items: FaqItem[] = [];
  if (/<details\b/i.test(faqSectionRaw)) {
    items = extractDetailsItems(faqSectionRaw);
  }
  if (items.length === 0) {
    items = extractHeadingItems(faqSectionRaw);
  }
  if (items.length === 0) {
    items = extractParagraphItems(faqSectionRaw);
  }

  if (items.length === 0) return html;

  const renderedItems = items.map((item) => renderAccordionItem(item)).join('\n');

  const transformedSection = `
<section class="faq-accordion-section mt-8 mb-6 scroll-mt-20" aria-label="Frequently Asked Questions">
  <h2 id="${faqHeading.id}" class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-4 !mt-0">
    ${faqHeading.text}
  </h2>
  <div class="faq-accordion-root w-full border-t border-border/70 divide-y divide-border/70">
    ${renderedItems}
  </div>
</section>
`;

  return html.slice(0, faqHeading.start) + transformedSection + remainder;
}

export function buildLangVersion(opts: {
  language: 'HINGLISH' | 'ENGLISH';
  title: string;
  description: string;
  pageTitle: string;
  pageDescription: string;
  htmlBody: string;
  updatedDate: string;
  coverImage?: string | null;
  imageAlt?: string | null;
  imageCaption?: string | null;
  slug: string;
}): ArticleLangVersion {
  const rawText = opts.htmlBody || opts.description || '';
  const plainText = stripHtmlTags(rawText).replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));

  return {
    language: opts.language,
    title: opts.title,
    description: opts.description,
    pageTitle: opts.pageTitle,
    pageDescription: opts.pageDescription,
    htmlBody: opts.htmlBody,
    readMinutes,
    updatedDate: opts.updatedDate,
    coverImage: opts.coverImage || null,
    imageAlt: opts.imageAlt || null,
    imageCaption: opts.imageCaption || null,
    url: `/${opts.slug}`,
  };
}
