import { env } from '../../core/config/env.js';

// Keep provider model choices and capabilities here; .env selects only the default.
export const ARTICLE_MODELS = {
  gemini: [
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', vision: true },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', vision: true },
    {
      id: 'gemini-3.1-pro-preview',
      label: 'Gemini 3.1 Pro Preview',
      vision: true,
    },
    { id: 'gemini-flash-latest', label: 'Gemini Flash Latest', vision: true },
  ],
  openrouter: [
    {
      id: 'anthropic/claude-sonnet-4.6',
      label: 'Claude Sonnet 4.6',
      vision: true,
    },
    {
      id: 'google/gemini-3.1-pro-preview',
      label: 'Gemini 3.1 Pro (Preview)',
      vision: true,
    },
    { id: 'openai/gpt-4.1', label: 'GPT-4.1', vision: true },
    { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2', vision: false },
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', vision: true },
    { id: 'openai/gpt-4.1-mini', label: 'GPT-4.1 Mini', vision: true },
  ],
  groq: [
    { id: 'openai/gpt-oss-120b', label: 'GPT OSS 120B', vision: false },
    { id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B', vision: false },
    { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B (Preview)', vision: true },
  ],
} as const;

export function getArticleProviders() {
  const providers: Array<{
    id: string;
    label: string;
    enabled: boolean;
    defaultModel?: string;
    models: Array<{ id: string; label: string; vision: boolean }>;
  }> = [
    {
      id: 'gemini',
      label: 'Google Gemini',
      enabled: Boolean(env.GEMINI_API_KEY || env.GEMINI_BACKUP_API_KEY),
      defaultModel: env.GEMINI_MODEL || 'gemini-3.8-flash',
      models: [...ARTICLE_MODELS.gemini] as Array<{
        id: string;
        label: string;
        vision: boolean;
      }>,
    },
    {
      id: 'openrouter',
      label: 'OpenRouter',
      enabled: Boolean(
        env.OPENROUTER_API_KEY &&
        env.OPENROUTER_BASE_URL &&
        env.OPENROUTER_MODEL,
      ),
      defaultModel: env.OPENROUTER_MODEL,
      models: [...ARTICLE_MODELS.openrouter],
    },
    {
      id: 'groq',
      label: 'Groq',
      enabled: Boolean(env.GROQ_API_KEY && env.GROQ_BASE_URL && env.GROQ_MODEL),
      defaultModel: env.GROQ_MODEL,
      models: [...ARTICLE_MODELS.groq],
    },
  ];
  // Gemini already accepts custom configured models; retain that existing behavior.
  const gemini = providers[0];
  if (!gemini.models.some((model) => model.id === gemini.defaultModel)) {
    gemini.models.push({
      id: gemini.defaultModel!,
      label: gemini.defaultModel!,
      vision: true,
    });
  }
  return providers
    .filter(
      (provider) =>
        provider.enabled &&
        provider.models.some((model) => model.id === provider.defaultModel),
    )
    .map(({ id, label, defaultModel, models }) => ({
      id,
      label,
      defaultModel,
      models,
    }));
}
