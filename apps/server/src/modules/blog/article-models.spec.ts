import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../core/config/env.js';
import { ARTICLE_MODELS, getArticleProviders } from './article-models.js';
import { BlogService } from './blog.service.js';

describe('Article provider catalog', () => {
  const original = { ...env };
  beforeEach(() => {
    Object.assign(env, {
      GEMINI_API_KEY: '',
      GEMINI_BACKUP_API_KEY: '',
      OPENROUTER_API_KEY: '',
      GROQ_API_KEY: '',
    });
  });
  afterEach(() => Object.assign(env, original));

  it('returns no providers when none are configured', () => {
    expect(getArticleProviders()).toEqual([]);
  });

  it('returns only configured providers with valid defaults and no credentials', () => {
    Object.assign(env, {
      GEMINI_API_KEY: 'private-test-key',
      GEMINI_MODEL: 'gemini-3.5-flash',
      OPENROUTER_API_KEY: 'private-test-key',
      OPENROUTER_BASE_URL: env.CLIENT_URL,
      OPENROUTER_MODEL: 'openai/gpt-4.1',
      GROQ_API_KEY: 'private-test-key',
      GROQ_BASE_URL: env.CLIENT_URL,
      GROQ_MODEL: 'unlisted-model',
    });
    const providers = getArticleProviders();
    expect(providers.map((provider) => provider.id)).toEqual([
      'gemini',
      'openrouter',
    ]);
    expect(providers[0].defaultModel).toBe('gemini-3.5-flash');
    expect(providers[1].models).toEqual(ARTICLE_MODELS.openrouter);
    for (const provider of providers)
      expect(Object.keys(provider).sort()).toEqual([
        'defaultModel',
        'id',
        'label',
        'models',
      ]);
    expect(JSON.stringify(providers)).not.toContain('private-test-key');
  });

  it('retains custom Gemini defaults and backup-key-only configuration', () => {
    env.GEMINI_BACKUP_API_KEY = 'backup-key';
    env.GEMINI_MODEL = 'custom-gemini-model';
    expect(getArticleProviders()[0].models).toContainEqual({
      id: 'custom-gemini-model',
      label: 'custom-gemini-model',
      vision: true,
    });
  });

  it('requires editor access to read the catalog', () => {
    const blogs = Object.create(BlogService.prototype) as BlogService;
    expect(() =>
      blogs.getArticleProviders({ id: 'student', role: 'student' } as any),
    ).toThrow('Editor access is required');
  });
});
