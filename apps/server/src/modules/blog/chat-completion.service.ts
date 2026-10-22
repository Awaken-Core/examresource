import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { env } from '../../core/config/env.js';
import { ARTICLE_MODELS } from './article-models.js';
import { ARTICLE_RESPONSE_FORMAT } from './article-response.schema.js';

export type ChatProvider = 'openrouter' | 'groq';

@Injectable()
export class ChatCompletionService {
  private readonly logger = new Logger(ChatCompletionService.name);
  async generateContent(
    provider: ChatProvider,
    systemPrompt: string,
    userPrompt: string,
    images: Array<{ mimeType: string; data: string; url?: string }>,
    onModelSwitch?: (model: string) => void,
    requestedModel?: string,
  ): Promise<{ text: string; model: string }> {
    const prefix = provider === 'openrouter' ? 'OPENROUTER' : 'GROQ';
    const apiKey = env[`${prefix}_API_KEY`];
    const baseUrl = env[`${prefix}_BASE_URL`];
    const model = requestedModel || env[`${prefix}_MODEL`];
    if (!apiKey || !baseUrl || !model) {
      throw new BadRequestException(
        `${provider} is not configured. Set its API key, base URL and model on the server.`,
      );
    }
    const selectedModel = ARTICLE_MODELS[provider].find(
      (entry) => entry.id === model,
    );
    if (!selectedModel) {
      throw new BadRequestException(
        `The selected model is not enabled for ${provider}.`,
      );
    }
    if (images.length && !selectedModel.vision) {
      throw new BadRequestException(
        `The selected ${provider} model is not enabled for image input. Select a vision model.`,
      );
    }
    const content: Array<unknown> = [{ type: 'text', text: userPrompt }];
    for (const image of images) {
      const data = image.data
        .replace(/^data:image\/[\w.+-]+;base64,/, '')
        .trim();
      const url = data ? `data:${image.mimeType};base64,${data}` : image.url;
      if (!url)
        throw new BadRequestException(
          'An attached image has no usable data or URL.',
        );
      content.push({ type: 'image_url', image_url: { url } });
    }
    onModelSwitch?.(model);
    // GPT OSS 20B rejected the full article with json_validate_failed in both JSON modes.
    // Keep the same JSON prompt and validate locally instead of using its failing format constraint.
    const promptOnly = provider === 'groq' && model === 'openai/gpt-oss-20b';
    try {
      const response = await fetch(
        `${baseUrl.replace(/\/+$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(env.AI_REQUEST_TIMEOUT_MS),
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: images.length ? content : userPrompt },
            ],
            temperature: 0.2,
            ...(promptOnly
              ? { reasoning_effort: 'low', include_reasoning: false }
              : {
                  response_format:
                    provider === 'groq'
                      ? ARTICLE_RESPONSE_FORMAT
                      : { type: 'json_object' },
                }),
            ...(provider === 'openrouter'
              ? { provider: { require_parameters: true } }
              : {}),
          }),
        },
      );
      if (!response.ok) {
        // Classify errors without exposing raw messages or failed generations containing article content.
        const body = (await response.json().catch(() => null)) as {
          error?: { code?: unknown; message?: unknown };
        } | null;
        const code = body?.error?.code;
        const message =
          typeof body?.error?.message === 'string'
            ? body.error.message.toLowerCase()
            : '';
        const reason =
          response.status === 402
            ? 'Insufficient provider credits for this request. With no app output-token cap, the provider may reserve its full default output allowance. Add credits or select another model.'
            : response.status === 401
              ? 'The API key was rejected. Check the selected provider key on the server.'
              : response.status === 403
                ? 'Your provider account does not have access to this model. Check its permissions.'
                : response.status === 429
                  ? 'Provider rate limit or quota reached. Wait and retry or select another provider.'
                  : response.status >= 500
                    ? 'The provider is temporarily unavailable. Please retry or select another provider.'
                    : code === 'json_validate_failed' ||
                        /failed to generate json|json validation/.test(message)
                      ? 'The model failed to generate valid article JSON. Please retry or select another model.'
                      : /context|too many tokens|token limit|request too large/.test(
                            message,
                          )
                        ? 'The reference and writing instructions exceed the model or account token limit. Shorten the reference or select another model.'
                        : /image|vision/.test(message)
                          ? 'The provider rejected an attached image. Check its format, size, count and URL accessibility.'
                          : /not found|decommissioned|does not exist|no endpoints/.test(
                                message,
                              )
                            ? 'The selected model or a compatible endpoint is unavailable for this account. Select another model.'
                            : /response_format|json_schema|json_object|temperature|unsupported|not supported/.test(
                                  message,
                                )
                              ? 'This model endpoint rejected the requested output format or generation options. Select another model.'
                              : 'The provider rejected the request. Check the selected model and account configuration or select another model.';
        throw new ServiceUnavailableException(
          `${provider} / ${model} (HTTP ${response.status}): ${reason}`,
        );
      }
      const data = (await response.json()) as {
        choices?: Array<{
          message?: { content?: unknown; refusal?: unknown };
          finish_reason?: string;
        }>;
        error?: unknown;
      };
      const choice = data?.choices?.[0];
      if (
        data?.error ||
        Boolean(choice?.message?.refusal) ||
        choice?.finish_reason !== 'stop' ||
        typeof choice.message?.content !== 'string' ||
        !choice.message.content.trim()
      ) {
        const finish = [
          'stop',
          'length',
          'content_filter',
          'tool_calls',
          'function_call',
          'error',
        ].includes(choice?.finish_reason || '')
          ? choice!.finish_reason
          : 'unknown';
        const contentCharacters =
          typeof choice?.message?.content === 'string'
            ? choice.message.content.length
            : 0;
        // Only record response structure; never log article text, reasoning, refusals or credentials.
        this.logger.warn(
          JSON.stringify({
            provider,
            model,
            finishReason: finish,
            contentCharacters,
            providerError: Boolean(data?.error),
          }),
        );
        const reason =
          finish === 'length'
            ? 'The provider stopped generation at its output limit before the article was complete. No app output-token cap is set. Shorten the reference or select another model.'
            : finish === 'content_filter' || Boolean(choice?.message?.refusal)
              ? 'The provider blocked or refused this request. Review the reference content or select another model.'
              : data?.error
                ? 'The provider reported an upstream error inside its response. Please retry or select another provider.'
                : !contentCharacters
                  ? 'The provider returned no article text. Please retry or select another model.'
                  : 'The provider did not report a completed article. Please retry or select another model.';
        throw new ServiceUnavailableException(
          `${provider} / ${model} (finish reason: ${finish}): ${reason}`,
        );
      }
      if (promptOnly) {
        try {
          const parsed = JSON.parse(
            choice.message.content
              .trim()
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```$/, ''),
          );
          for (const language of ['hinglish', 'english']) {
            if (
              typeof parsed?.[language]?.title !== 'string' ||
              !parsed[language].title.trim() ||
              typeof parsed[language].content !== 'string' ||
              !parsed[language].content.trim()
            ) {
              throw new Error('Incomplete bilingual article');
            }
          }
        } catch {
          throw new ServiceUnavailableException(
            `${provider} / ${model} returned invalid or incomplete article JSON. Please retry or select another model.`,
          );
        }
      }
      return { text: choice.message.content, model };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        `${provider} request timed out, failed to connect or returned an invalid response. Please retry or select another provider.`,
      );
    }
  }
}
