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

export function toHeadingSlug(text: string): string {
  const s = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\\+/g, '')
    .replace(/[^\p{L}\p{N}\s\-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return s || 'section';
}

export function processArticleHtml(rawHtml: string, title: string) {
  let htmlBody = rawHtml || '';
  const tocItems: { id: string; text: string; level: number }[] = [];
  tocItems.push({ id: 'overview-top', text: title, level: 2 });

  // 1. Normalize Heading Hierarchy (prevents Lighthouse "Headings not sequentially descending" error)
  // Ensure that no H3 or H4 appears before at least one H2 has been declared.
  let hasEncounteredH2 = false;
  let hIdx = 0;

  htmlBody = htmlBody.replace(
    /<h([2-4])(?:\s+([^>]*))?>([\s\S]*?)<\/h\1>/gi,
    (_full, rawLvl, attrs = '', content = '') => {
      let lvl = parseInt(rawLvl, 10);
      if (lvl >= 3 && !hasEncounteredH2) {
        // Promote early H3/H4 to H2 to preserve sequentially-descending hierarchy (H1 -> H2)
        lvl = 2;
      }
      if (lvl === 2) hasEncounteredH2 = true;

      const cleanText = content.replace(/<[^>]*>/g, '').replace(/\\+/g, '').trim();
      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const id = idMatch ? idMatch[1] : toHeadingSlug(cleanText) || `heading-${++hIdx}`;
      const cleanAttrs = attrs.replace(/id=["'][^"']*["']/i, '').trim();

      if (cleanText) {
        tocItems.push({ level: lvl, id, text: cleanText });
      }

      return `<h${lvl} id="${id}"${cleanAttrs ? ` ${cleanAttrs}` : ''}>${content.replace(/\\+/g, '')}</h${lvl}>`;
    },
  );

  // 2. Optimize Images (Guarantees zero CLS, eager LCP discovery, and accessibility alt text)
  let imageCounter = 0;
  htmlBody = htmlBody.replace(/<img\b([^>]*)>/gi, (_full, attrs = '') => {
    imageCounter += 1;
    let newAttrs = attrs;

    // A. Sanitize Alt text (replace generic "pasted image" with article context)
    const altMatch = newAttrs.match(/alt=["']([^"']*)["']/i);
    const currentAlt = altMatch ? altMatch[1].trim() : '';
    if (!currentAlt || currentAlt.toLowerCase().includes('pasted image') || currentAlt.toLowerCase() === 'image') {
      const safeTitle = title.replace(/"/g, '&quot;');
      const contextualAlt = `${safeTitle} - Official Notice & Guide Details`;
      if (altMatch) {
        newAttrs = newAttrs.replace(/alt=["'][^"']*["']/i, `alt="${contextualAlt}"`);
      } else {
        newAttrs += ` alt="${contextualAlt}"`;
      }
    }

    // B. Explicit Dimensions & Aspect-Ratio (Fixes "Unsized image element" & eliminates CLS)
    const widthMatch = newAttrs.match(/\bwidth=["'](\d+)["']/i);
    const heightMatch = newAttrs.match(/\bheight=["'](\d+)["']/i);
    let widthVal = widthMatch ? parseInt(widthMatch[1], 10) : 0;
    let heightVal = heightMatch ? parseInt(heightMatch[1], 10) : 0;

    if (widthVal > 0 && (!heightVal || heightVal <= 0)) {
      // Calculate 16:9 proportional height if height is missing
      heightVal = Math.round((widthVal * 9) / 16);
      newAttrs += ` height="${heightVal}"`;
    } else if (!widthVal && !heightVal) {
      widthVal = 800;
      heightVal = 450;
      newAttrs += ` width="${widthVal}" height="${heightVal}"`;
    }

    // Ensure style contains exact width and aspect-ratio reservation matching editor
    const alignMatch = newAttrs.match(/\bdata-align=["']([^"']*)["']/i);
    const alignVal = alignMatch ? alignMatch[1].toLowerCase() : 'center';

    let alignStyle = '';
    if (alignVal === 'left') {
      alignStyle = 'float: left; margin: 0.5rem 1.25rem 0.75rem 0;';
    } else if (alignVal === 'right') {
      alignStyle = 'float: right; margin: 0.5rem 0 0.75rem 1.25rem;';
    } else {
      alignStyle = 'display: block; margin-left: auto; margin-right: auto;';
    }

    if (widthVal > 0) {
      const widthStyle = `width: ${widthVal}px; max-width: 100%; height: auto; ${alignStyle}`;
      const styleMatch = newAttrs.match(/\bstyle=["']([^"']*)["']/i);
      if (styleMatch) {
        const currentStyle = styleMatch[1].trim();
        const separator = currentStyle && !currentStyle.endsWith(';') ? ';' : '';
        newAttrs = newAttrs.replace(
          /\bstyle=["'][^"']*["']/i,
          `style="${currentStyle}${separator} ${widthStyle} aspect-ratio: ${widthVal} / ${heightVal || Math.round((widthVal * 9) / 16)};"`,
        );
      } else {
        newAttrs += ` style="${widthStyle} aspect-ratio: ${widthVal} / ${heightVal || Math.round((widthVal * 9) / 16)};"`;
      }
    }

    // C. First image is LCP hero: MUST NOT be loading="lazy", MUST be fetchpriority="high"
    if (imageCounter === 1) {
      newAttrs = newAttrs.replace(/\bloading=["'][^"']*["']/gi, '');
      newAttrs = newAttrs.replace(/\bfetchpriority=["'][^"']*["']/gi, '');
      newAttrs = newAttrs.replace(/\bdecoding=["'][^"']*["']/gi, '');
      newAttrs += ' loading="eager" fetchpriority="high" decoding="async"';
    } else {
      // Subsequent images: ensure lazy loading
      if (!newAttrs.includes('loading=')) newAttrs += ' loading="lazy"';
      if (!newAttrs.includes('decoding=')) newAttrs += ' decoding="async"';
    }

    return `<img ${newAttrs.replace(/\s+/g, ' ').trim()}>`;
  });

  // 3. Clean and normalize Figcaptions (prevent visible double-escaped &amp; entities)
  htmlBody = htmlBody.replace(/<figcaption([^>]*)>([\s\S]*?)<\/figcaption>/gi, (_full, attrs = '', content = '') => {
    let text = content;
    for (let i = 0; i < 4 && text.includes('&amp;'); i++) {
      text = text.replace(/&amp;amp;/g, '&amp;').replace(/&amp;/g, '&');
    }
    const safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<figcaption${attrs}>${safeText}</figcaption>`;
  });

  return { htmlBody, tocItems };
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
  const plainText = (opts.htmlBody || opts.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
