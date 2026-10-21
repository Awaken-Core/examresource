# Article providers (Phase 2)

Additional OpenRouter options include [Claude Sonnet 4.6](https://openrouter.ai/anthropic/claude-sonnet-4.6), [Gemini 3.1 Pro Preview](https://openrouter.ai/google/gemini-3.1-pro-preview), [GPT-4.1](https://openrouter.ai/openai/gpt-4.1), and text-only [DeepSeek V3.2](https://openrouter.ai/deepseek/deepseek-v3.2). These are candidates for comparison on the same bilingual reference, not a measured quality ranking. Premium models can cost more and reasoning models can take longer than the default request timeout. Existing environment defaults are unchanged. Provider account access and JSON-mode routing still require live verification.

Gemini remains the default. Translation, SEO tools, article prompts, returned fields and saving are unchanged. The editor provider/model controls are deferred to Phase 3.

For OpenRouter or Groq, configure the corresponding server-only `API_KEY`, `BASE_URL`, and `MODEL` variables shown in `apps/server/.env.example`. The base URL includes the provider's API version prefix and excludes `/chat/completions`. Obtain it from the official API documentation:

- [OpenRouter Chat Completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request)
- [Groq API reference](https://console.groq.com/docs/api-reference)

Available models, display labels and image capabilities live in `apps/server/src/modules/blog/article-models.ts`. Set `OPENROUTER_MODEL` and `GROQ_MODEL` to a model ID from that provider?s catalog to choose its default. Both requested and default models must appear in the catalog; unknown models are rejected before an API call. Add or update options in code, not in environment lists. Text-only models reject image requests before an API call. Gemini?s existing model selection remains unchanged.

Restart the server after configuration changes. In production, put keys in Cloudflare secrets and non-secret configuration in deployment variables. No credentials are returned to the browser. Existing Worker bootstrap forwards string bindings to the validated server configuration.

Each provider's `MAX_OUTPUT_TOKENS` defaults to 16000 to accommodate both articles. Adjust it to the selected model's supported output limit. Models with smaller limits may be unsuitable for full bilingual articles.

Both authenticated generation endpoints accept an optional `provider` (`gemini`, `openrouter`, or `groq`) and optional `model`. Omitting the provider preserves Gemini behavior; omitting the model uses the selected provider's default. The existing stage/complete/error stream format and article result fields are preserved. `modelUsed` identifies the requested model that produced the successful response.

`AI_REQUEST_TIMEOUT_MS` bounds each provider attempt (default 60 seconds, maximum 120 seconds); Gemini retains its existing retry behavior. New providers make one attempt and never silently switch providers. Rate limits, credential failures, timeouts, blocked or truncated output produce an error. Provider response bodies are not exposed. Full bilingual content validation remains scheduled for Phase 4.

Live provider quality, account access and model limits need verification with configured credentials; mocked tests do not establish writing quality.

Catalog references: [OpenRouter Gemini 2.5 Flash](https://openrouter.ai/google/gemini-2.5-flash), [OpenRouter GPT-4.1 Mini](https://openrouter.ai/openai/gpt-4.1-mini), [Groq models](https://console.groq.com/docs/models), [Groq vision](https://console.groq.com/docs/vision). The Groq Qwen vision option is a preview model; account availability and provider limits still apply.
