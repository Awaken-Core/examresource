import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  const content = `# Default rules for all web search crawlers
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /editor
Disallow: /editor/
Disallow: /login
Disallow: /signup

# Explicit permissions for AI Search Engines & Grounding Bots (OpenAI ChatGPT, Anthropic Claude, Grok, Gemini, Perplexity)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Bingbot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: cohere-ai
Allow: /

# XML Sitemap and RSS Feed locations
Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/rss.xml
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
