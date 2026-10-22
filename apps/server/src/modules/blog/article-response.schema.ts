const articleSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    excerpt: { type: 'string' },
    content: { type: 'string' },
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'title',
    'slug',
    'excerpt',
    'content',
    'metaTitle',
    'metaDescription',
    'keywords',
  ],
  additionalProperties: false,
};

// Preserve the existing article fields for Groq models using strict output.
export const ARTICLE_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'bilingual_article',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        hinglish: articleSchema,
        english: articleSchema,
        seoScore: { type: 'number' },
        detectedCategory: { type: 'string' },
      },
      required: ['hinglish', 'english', 'seoScore', 'detectedCategory'],
      additionalProperties: false,
    },
  },
} as const;
