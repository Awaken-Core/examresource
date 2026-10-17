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

  const headingRegex = /<h([2-4])(?:\s+([^>]*))>([\s\S]*?)<\/h\1>/gi;
  let match;
  let hIdx = 0;
  while ((match = headingRegex.exec(htmlBody)) !== null) {
    const level = parseInt(match[1], 10);
    const attrs = match[2] || '';
    const innerContent = match[3] || '';
    const cleanText = innerContent.replace(/<[^>]*>/g, '').replace(/\\+/g, '').trim();
    if (!cleanText) continue;
    const idMatch = attrs.match(/id=["']([^"']+)["']/i);
    const id = idMatch ? idMatch[1] : toHeadingSlug(cleanText) || `heading-${++hIdx}`;
    tocItems.push({ level, id, text: cleanText });
  }

  htmlBody = htmlBody.replace(
    /<h([2-4])(?:\s+([^>]*))?>([\s\S]*?)<\/h\1>/gi,
    (_full, lvl, attrs = '', content = '') => {
      const cleanText = content.replace(/<[^>]*>/g, '').replace(/\\+/g, '').trim();
      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const id = idMatch ? idMatch[1] : toHeadingSlug(cleanText) || `heading-${++hIdx}`;
      const cleanAttrs = attrs.replace(/id=["'][^"']*["']/i, '').trim();
      return `<h${lvl} id="${id}"${cleanAttrs ? ` ${cleanAttrs}` : ''}>${content.replace(/\\+/g, '')}</h${lvl}>`;
    },
  );

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
    url: opts.language === 'ENGLISH' ? `/${opts.slug}?lang=en` : `/${opts.slug}`,
  };
}
