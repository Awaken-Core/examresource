# Article providers (Phases 2 and 3)

## Provider error troubleshooting

Errors identify the selected provider/model and distinguish rejected keys, permissions, insufficient credits, rate limits, JSON generation failures, image rejection and context limits. Raw provider messages and failed generations are never returned to the browser.

Successful HTTP responses are also checked for their completion status. Rejection messages include the model and finish reason, distinguishing `length` (provider output limit), `content_filter`/refusal, missing article text and other unfinished responses. The server records only provider/model, finish reason, content character count and the presence of an upstream error. It never logs article text or reasoning. Omitting an app token cap does not disable provider-side output limits.

Groq models in the catalog run on Groq's high-speed free developer tier:
- [GPT OSS 120B](https://console.groq.com/docs/models) (`openai/gpt-oss-120b`): High-accuracy open model for detailed technical and bilingual content.
- [GPT OSS 20B](https://console.groq.com/docs/models) (`openai/gpt-oss-20b`): Ultra-fast generation running with local JSON validation.
- [Qwen 3.8 27B](https://console.groq.com/docs/models) (`qwen/qwen3.8-27b`): Multimodal vision-capable model supporting attached image analysis.

OpenRouter exclusively includes 100% free models ($0 balance required, no paid credits needed):
- [OpenRouter Free Models Router](https://openrouter.ai/models/openrouter/free) (`openrouter/free`): Automatically routes requests to an available free zero-cost model on OpenRouter. Supports text and multimodal image input.
- [NVIDIA Nemotron 3 Ultra](https://openrouter.ai/models/nvidia/nemotron-3-ultra-550b-a55b:free) (`nvidia/nemotron-3-ultra-550b-a55b:free`): Frontier 550B hybrid MoE reasoning model with 1M context, running without format constraints for complex technical and analytical content.
- [NVIDIA Nemotron 3.5 Super VL](https://openrouter.ai/models/nvidia/nemotron-3.5-super-vl:free) (`nvidia/nemotron-3.5-super-vl:free`): 100% free multimodal vision model with 1M context for attached reference images.
- [NVIDIA Nemotron 3.5 Lightning](https://openrouter.ai/models/nvidia/nemotron-3.5-lightning:free) (`nvidia/nemotron-3.5-lightning:free`): High-efficiency free text model with fast response times.
- [Google Gemma 4 26B](https://openrouter.ai/models/google/gemma-4-26b-a4b-it:free) (`google/gemma-4-26b-a4b-it:free`): Multimodal open model by Google.
- [Cohere North Mini Code](https://openrouter.ai/models/cohere/north-mini-code:free) (`cohere/north-mini-code:free`): Free model optimized for technical formatting.

Gemini remains the default. Translation, SEO tools, article prompts, returned fields and saving are unchanged. The reference article writer now has Provider and Model selectors. Choices load only when the modal opens, from the authenticated `GET /api/v1/blogs/ai/providers` endpoint. The response contains configured providers, their code-defined models, image capabilities and default model IDs; it never contains keys or base URLs and is marked private/no-store.

For OpenRouter or Groq, configure the corresponding server-only `API_KEY`, `BASE_URL`, and `MODEL` variables shown in `apps/server/.env.example`. The base URL includes the provider's API version prefix and excludes `/chat/completions`. Default base URLs are automatically provided if omitted:
- OpenRouter: `https://openrouter.ai/api/v1`
- Groq: `https://api.groq.com/openai/v1`

Available models, display labels and image capabilities live in `apps/server/src/modules/blog/article-models.ts`. Set `OPENROUTER_MODEL` and `GROQ_MODEL` to a model ID from that provider's catalog to choose its default. Both requested and default models must appear in the catalog; unknown models are rejected before an API call. Add or update options in code, not in environment lists. Text-only models reject image requests before an API call. Gemini's existing model selection remains unchanged.

Restart the server after configuration changes. In production, put keys in Cloudflare secrets and non-secret configuration in deployment variables. No credentials are returned to the browser. Existing Worker bootstrap forwards string bindings to the validated server configuration.

The application does not send a maximum output-token setting. Providers use their own default output limits, which may be lower than the model's maximum capacity. Truncated output is still rejected so an incomplete response is not treated as a completed article.

Both authenticated generation endpoints accept an optional `provider` (`gemini`, `openrouter`, or `groq`) and optional `model`. Omitting the provider preserves Gemini behavior; omitting the model uses the selected provider's default. The existing stage/complete/error stream format and article result fields are preserved. `providerUsed` and `modelUsed` identify the provider and requested model that produced the successful response. The editor shows both in the results card.

`AI_REQUEST_TIMEOUT_MS` bounds each provider attempt (default 60 seconds, maximum 120 seconds); Gemini retains its existing retry behavior. New providers make one attempt and never silently switch providers. Rate limits, credential failures, timeouts, blocked or truncated output produce an error. Provider response bodies are not exposed. Full bilingual content validation remains scheduled for Phase 4.

The editor initially selects Gemini when configured, otherwise the first enabled provider. Changing providers selects its server-configured default model. Gemini article generation also honors `GEMINI_MODEL`. Providers with missing credentials or an unlisted default are omitted. Failed or empty discovery offers a retry action without clearing the reference input. Provider/model controls are locked during generation. Attached images require a vision-capable selection; both streaming and fallback requests send the same complete image payload. Translation and the standalone SEO tools remain on Gemini.
