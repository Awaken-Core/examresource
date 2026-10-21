import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { env } from '../../core/config/env.js';
import { ARTICLE_MODELS } from './article-models.js';

export type ChatProvider = 'openrouter' | 'groq';

@Injectable()
export class ChatCompletionService {
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
            max_completion_tokens: env[`${prefix}_MAX_OUTPUT_TOKENS`],
            response_format: { type: 'json_object' },
            ...(provider === 'openrouter'
              ? { provider: { require_parameters: true } }
              : {}),
          }),
        },
      );
      if (!response.ok) {
        // Do not expose provider error bodies, which can contain submitted content or credentials.
        const reason =
          response.status === 429
            ? 'rate limited'
            : response.status >= 500
              ? 'temporarily unavailable'
              : 'request rejected; check server credentials and model capabilities';
        throw new ServiceUnavailableException(
          `${provider} is ${reason} (HTTP ${response.status}). Please retry or select another provider.`,
        );
      }
      const data = (await response.json()) as {
        choices?: Array<{
          message?: { content?: unknown };
          finish_reason?: string;
        }>;
        error?: unknown;
      };
      const choice = data?.choices?.[0];
      if (
        data?.error ||
        choice?.finish_reason !== 'stop' ||
        typeof choice.message?.content !== 'string' ||
        !choice.message.content.trim()
      ) {
        throw new ServiceUnavailableException(
          `${provider} returned an empty, incomplete or blocked response. Please retry or select another model.`,
        );
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
