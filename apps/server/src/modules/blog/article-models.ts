// Keep provider model choices and capabilities here; .env selects only the default.
export const ARTICLE_MODELS = {
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
