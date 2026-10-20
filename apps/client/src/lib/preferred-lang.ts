export type AppLang = 'hinglish' | 'en';
export type BlogLanguage = 'HINGLISH' | 'ENGLISH';

export function normalizeAppLang(lang: string | null | undefined): AppLang {
  if (!lang) return 'hinglish';
  const v = lang.toLowerCase();
  return v === 'en' || v === 'english' ? 'en' : 'hinglish';
}

export function appLangToBlogLanguage(lang: AppLang): BlogLanguage {
  return lang === 'en' ? 'ENGLISH' : 'HINGLISH';
}

export function blogLanguageToAppLang(lang: string | null | undefined): AppLang {
  return lang === 'ENGLISH' || lang === 'en' ? 'en' : 'hinglish';
}

/** Read preferred_lang cookie from a Cookie header (SSR). */
export function preferredLangFromCookieHeader(cookieHeader: string | null | undefined): AppLang {
  if (!cookieHeader) return 'hinglish';
  const match = cookieHeader.match(/(?:^|;\s*)preferred_lang=([^;]*)/);
  return normalizeAppLang(match?.[1] ? decodeURIComponent(match[1].trim()) : null);
}

/** Resolve article language: URL ?lang= wins, else cookie preference. */
export function resolveArticleLanguage(opts: {
  langParam: string | null;
  cookieHeader?: string | null;
}): BlogLanguage {
  const fromUrl = normalizeAppLang(opts.langParam);
  if (opts.langParam != null && opts.langParam !== '') {
    return appLangToBlogLanguage(fromUrl);
  }
  return appLangToBlogLanguage(preferredLangFromCookieHeader(opts.cookieHeader));
}

export function articleHref(slug: string, _lang?: AppLang): string {
  const clean = slug.replace(/^\//, '');
  return `/${clean}`;
}
