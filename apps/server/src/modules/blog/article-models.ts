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
      id: 'openrouter/free',
      label: 'OpenRouter Free Models Router',
      vision: true,
    },
    {
      id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      label: 'NVIDIA Nemotron 3 Ultra (free)',
      vision: false,
    },
    {
      id: 'nvidia/nemotron-3.5-lightning:free',
      label: 'NVIDIA Nemotron 3.5 Lightning (free)',
      vision: false,
    },
    {
      id: 'nvidia/nemotron-3.5-super-vl:free',
      label: 'NVIDIA Nemotron 3.5 Super VL (free)',
      vision: true,
    },
    {
      id: 'google/gemma-4-26b-a4b-it:free',
      label: 'Google Gemma 4 26B (free)',
      vision: true,
    },
    {
      id: 'cohere/north-mini-code:free',
      label: 'Cohere North Mini Code (free)',
      vision: false,
    },
  ],
  groq: [
    { id: 'openai/gpt-oss-120b', label: 'GPT OSS 120B', vision: false },
    { id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B', vision: false },
    { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B (Preview)', vision: true },
  ],
} as const;

export function getArticleProviders() {
  const openrouterDefault = env.OPENROUTER_MODEL || 'openrouter/free';

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
      enabled: Boolean(env.OPENROUTER_API_KEY),
      defaultModel: openrouterDefault,
      models: [...ARTICLE_MODELS.openrouter] as Array<{
        id: string;
        label: string;
        vision: boolean;
      }>,
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
