# Article providers (Phases 2 and 3)

## Provider error troubleshooting

Errors identify the selected provider/model and distinguish rejected keys, permissions, insufficient credits, rate limits, JSON generation failures, image rejection and context limits. Raw provider messages and failed generations are never returned to the browser.

Successful HTTP responses are also checked for their completion status. Rejection messages include the model and finish reason, distinguishing `length` (provider output limit), `content_filter`/refusal, missing article text and other unfinished responses. The server records only provider/model, finish reason, content character count and the presence of an upstream error. It never logs article text or reasoning. Omitting an app token cap does not disable provider-side output limits.

Groq GPT OSS 120B and Qwen use the existing bilingual article fields as a strict JSON schema. GPT OSS 20B rejected the full article request with `json_validate_failed` in live checks even with strict output enabled. Its compatibility path keeps the original JSON-writing prompt, omits the provider format constraint, uses low reasoning effort, and locally requires nonempty titles/content in both languages. This does not switch providers or add a token cap. See [Groq structured-output support](https://console.groq.com/docs/structured-outputs).

An OpenRouter HTTP 402 is an account credit/reservation issue. With no output cap in the request, its default allowance may require more credits than the final generated article would use. Add credits or choose another model/provider; the app does not silently reintroduce an output limit. Successful synthetic article checks do not establish quality or success for every reference and image combination.

Additional OpenRouter options include [Claude Sonnet 4.6](https://openrouter.ai/anthropic/claude-sonnet-4.6), [Gemini 3.1 Pro Preview](https://openrouter.ai/google/gemini-3.1-pro-preview), [GPT-4.1](https://openrouter.ai/openai/gpt-4.1), and text-only [DeepSeek V3.2](https://openrouter.ai/deepseek/deepseek-v3.2). These are candidates for comparison on the same bilingual reference, not a measured quality ranking. Premium models can cost more and reasoning models can take longer than the default request timeout. Existing environment defaults are unchanged. Provider account access and JSON-mode routing still require live verification.

Gemini remains the default. Translation, SEO tools, article prompts, returned fields and saving are unchanged. The reference article writer now has Provider and Model selectors. Choices load only when the modal opens, from the authenticated `GET /api/v1/blogs/ai/providers` endpoint. The response contains configured providers, their code-defined models, image capabilities and default model IDs; it never contains keys or base URLs and is marked private/no-store.

For OpenRouter or Groq, configure the corresponding server-only `API_KEY`, `BASE_URL`, and `MODEL` variables shown in `apps/server/.env.example`. The base URL includes the provider's API version prefix and excludes `/chat/completions`. Obtain it from the official API documentation:

- [OpenRouter Chat Completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request)
- [Groq API reference](https://console.groq.com/docs/api-reference)

Available models, display labels and image capabilities live in `apps/server/src/modules/blog/article-models.ts`. Set `OPENROUTER_MODEL` and `GROQ_MODEL` to a model ID from that provider's catalog to choose its default. Both requested and default models must appear in the catalog; unknown models are rejected before an API call. Add or update options in code, not in environment lists. Text-only models reject image requests before an API call. Gemini's existing model selection remains unchanged.

Restart the server after configuration changes. In production, put keys in Cloudflare secrets and non-secret configuration in deployment variables. No credentials are returned to the browser. Existing Worker bootstrap forwards string bindings to the validated server configuration.

The application does not send a maximum output-token setting. Providers use their own default output limits, which may be lower than the model's maximum capacity. Truncated output is still rejected so an incomplete response is not treated as a completed article.

Both authenticated generation endpoints accept an optional `provider` (`gemini`, `openrouter`, or `groq`) and optional `model`. Omitting the provider preserves Gemini behavior; omitting the model uses the selected provider's default. The existing stage/complete/error stream format and article result fields are preserved. `providerUsed` and `modelUsed` identify the provider and requested model that produced the successful response. The editor shows both in the results card.

`AI_REQUEST_TIMEOUT_MS` bounds each provider attempt (default 60 seconds, maximum 120 seconds); Gemini retains its existing retry behavior. New providers make one attempt and never silently switch providers. Rate limits, credential failures, timeouts, blocked or truncated output produce an error. Provider response bodies are not exposed. Full bilingual content validation remains scheduled for Phase 4.

Live provider quality, account access and model limits need verification with configured credentials; mocked tests do not establish writing quality.

Catalog references: [OpenRouter Gemini 2.5 Flash](https://openrouter.ai/google/gemini-2.5-flash), [OpenRouter GPT-4.1 Mini](https://openrouter.ai/openai/gpt-4.1-mini), [Groq models](https://console.groq.com/docs/models), [Groq vision](https://console.groq.com/docs/vision). The Groq Qwen vision option is a preview model; account availability and provider limits still apply.

The editor initially selects Gemini when configured, otherwise the first enabled provider. Changing providers selects its server-configured default model. Gemini article generation also honors `GEMINI_MODEL`. Providers with missing credentials/base URL/default or an unlisted default (OpenRouter/Groq) are omitted. Failed or empty discovery offers a retry action without clearing the reference input. Provider/model controls are locked during generation. Attached images require a vision-capable selection; both streaming and fallback requests send the same complete image payload. Translation and the standalone SEO tools remain on Gemini. Phase 4 output validation is still pending.
