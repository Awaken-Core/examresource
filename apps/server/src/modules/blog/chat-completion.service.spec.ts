import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env, EnvSchema } from '../../core/config/env.js';
import { ChatCompletionService } from './chat-completion.service.js';
import { ARTICLE_RESPONSE_FORMAT } from './article-response.schema.js';

describe('ChatCompletionService', () => {
  const original = { ...env };
  const service = new ChatCompletionService();
  const fetchMock = vi.fn();
  beforeEach(() => {
    Object.assign(env, {
      OPENROUTER_API_KEY: 'test-key',
      OPENROUTER_BASE_URL: env.CLIENT_URL,
      OPENROUTER_MODEL: 'openrouter/free',
      GROQ_API_KEY: 'test-key',
      GROQ_BASE_URL: env.CLIENT_URL,
      GROQ_MODEL: 'openai/gpt-oss-120b',
    });
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    Object.assign(env, original);
    vi.unstubAllGlobals();
  });
  const success = () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: '{}' }, finish_reason: 'stop' }],
      }),
    );

  it.each(['openrouter', 'groq'] as const)(
    'sends authenticated JSON requests for %s',
    async (provider) => {
      fetchMock.mockResolvedValueOnce(success());
      const result = await service.generateContent(
        provider,
        'Return JSON',
        'Reference',
        [],
      );
      const expectedModel =
        provider === 'groq' ? env.GROQ_MODEL : env.OPENROUTER_MODEL;
      expect(result).toEqual({ text: '{}', model: expectedModel });
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${env.CLIENT_URL.replace(/\/+$/, '')}/chat/completions`,
      );
      expect(options.headers.Authorization).toBe('Bearer test-key');
      expect(options.signal).toBeUndefined();
      expect(JSON.parse(options.body)).not.toHaveProperty(
        'max_completion_tokens',
      );
      expect(JSON.parse(options.body)).not.toHaveProperty('max_tokens');
      expect(JSON.parse(options.body)).toMatchObject({
        model: expectedModel,
        response_format:
          provider === 'groq'
            ? ARTICLE_RESPONSE_FORMAT
            : { type: 'json_object' },
      });
    },
  );

  it('rejects unconfigured providers and unapproved models before fetching', async () => {
    await expect(
      service.generateContent(
        'openrouter',
        '',
        '',
        [],
        undefined,
        'unapproved',
      ),
    ).rejects.toThrow('not enabled');
    env.GROQ_API_KEY = '';
    await expect(service.generateContent('groq', '', '', [])).rejects.toThrow(
      'not configured',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows a catalog model other than the environment default', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: 'stop',
              message: {
                content: JSON.stringify({
                  hinglish: { title: 'Notice', content: 'Hindi article' },
                  english: { title: 'Notice', content: 'English article' },
                }),
              },
            },
          ],
        }),
      ),
    );
    const result = await service.generateContent(
      'groq',
      'Return JSON',
      'Reference',
      [],
      undefined,
      'openai/gpt-oss-20b',
    );
    expect(result.model).toBe('openai/gpt-oss-20b');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).not.toHaveProperty('response_format');
    expect(body).toMatchObject({
      reasoning_effort: 'low',
      include_reasoning: false,
    });
    expect(body).not.toHaveProperty('max_completion_tokens');
    expect(env.GROQ_MODEL).toBe('openai/gpt-oss-120b');
  });

  it('sends structured json_object format for openrouter/free', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: 'stop',
              message: {
                content: JSON.stringify({
                  hinglish: { title: 'Notice', content: 'Hindi article' },
                  english: { title: 'Notice', content: 'English article' },
                }),
              },
            },
          ],
        }),
      ),
    );
    const result = await service.generateContent(
      'openrouter',
      'Return JSON',
      'Reference',
      [],
      undefined,
      'openrouter/free',
    );
    expect(result.model).toBe('openrouter/free');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe('openrouter/free');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body).not.toHaveProperty('provider');
  });

  it('runs nvidia/nemotron-3-ultra-550b-a55b:free without format constraint on OpenRouter', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: 'stop',
              message: {
                content: JSON.stringify({
                  hinglish: { title: 'Notice', content: 'Hindi article' },
                  english: { title: 'Notice', content: 'English article' },
                }),
              },
            },
          ],
        }),
      ),
    );
    const result = await service.generateContent(
      'openrouter',
      'Return JSON',
      'Reference',
      [],
      undefined,
      'nvidia/nemotron-3-ultra-550b-a55b:free',
    );
    expect(result.model).toBe('nvidia/nemotron-3-ultra-550b-a55b:free');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe('nvidia/nemotron-3-ultra-550b-a55b:free');
    expect(body).not.toHaveProperty('response_format');
    expect(body).not.toHaveProperty('provider');
  });

  it.each([
    '[]',
    '{}',
    'invalid json',
    '{"hinglish":{"title":"Notice","content":""}}',
  ])('rejects incomplete prompt-only output: %s', async (content) => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ finish_reason: 'stop', message: { content } }],
        }),
      ),
    );
    await expect(
      service.generateContent(
        'groq',
        '',
        '',
        [],
        undefined,
        'openai/gpt-oss-20b',
      ),
    ).rejects.toThrow('invalid or incomplete article JSON');
  });

  it('rejects an environment default outside the code catalog', async () => {
    env.GROQ_MODEL = 'unlisted-default';
    await expect(service.generateContent('groq', '', '', [])).rejects.toThrow(
      'not enabled',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('guards vision capabilities and sends attached image data', async () => {
    const images = [
      { data: 'data:image/png;base64,YQ==', mimeType: 'image/png' },
    ];
    await expect(
      service.generateContent('groq', '', '', images),
    ).rejects.toThrow('image input');
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(success());
    await service.generateContent('openrouter', '', '', images);
    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body).messages[1].content[1],
    ).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/png;base64,YQ==' },
    });
  });

  it.each([401, 429, 503])(
    'reports HTTP %s without leaking provider response bodies or retrying',
    async (status) => {
      fetchMock.mockResolvedValueOnce(
        new Response('secret provider details', { status }),
      );
      const error = await service
        .generateContent('groq', '', '', [])
        .catch((error) => error);
      expect(error.message).toContain(`HTTP ${status}`);
      expect(error.message).not.toContain('secret provider details');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    [402, {}, 'Insufficient provider credits'],
    [
      400,
      { code: 'json_validate_failed', message: 'Failed to generate JSON' },
      'valid article JSON',
    ],
    [400, { message: 'Context length exceeded' }, 'Shorten the reference'],
    [400, { message: 'Image size too large' }, 'attached image'],
    [400, { message: 'response_format not supported' }, 'output format'],
    [404, { message: 'No endpoints found' }, 'compatible endpoint'],
  ])(
    'explains HTTP %s without exposing raw provider data',
    async (status, error, expected) => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { ...error, failed_generation: 'private article content' },
          }),
          { status: status as number },
        ),
      );
      const result = await service
        .generateContent('groq', '', '', [])
        .catch((error) => error);
      expect(result.message).toContain(expected);
      expect(result.message).toContain('openai/gpt-oss-120b');
      expect(result.message).not.toContain('private article content');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['length', 'content_filter'])(
    'rejects %s responses',
    async (finish_reason) => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{}' }, finish_reason }],
          }),
        ),
      );
      await expect(service.generateContent('groq', '', '', [])).rejects.toThrow(
        finish_reason === 'length' ? 'output limit' : 'blocked or refused',
      );
    },
  );

  it.each([
    [
      { choices: [{ finish_reason: 'stop', message: { content: '' } }] },
      'no article text',
    ],
    [
      {
        choices: [
          {
            finish_reason: 'stop',
            message: { content: '{}', refusal: 'private refusal text' },
          },
        ],
      },
      'blocked or refused',
    ],
    [
      {
        choices: [{ finish_reason: 'tool_calls', message: { content: '{}' } }],
      },
      'did not report a completed article',
    ],
    [{ error: { message: 'private provider text' } }, 'upstream error'],
  ])(
    'distinguishes rejected successful responses without leaking content',
    async (response, expected) => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(response)));
      const error = await service
        .generateContent('groq', '', '', [])
        .catch((error) => error);
      expect(error.message).toContain(expected);
      expect(error.message).toContain('openai/gpt-oss-120b');
      expect(error.message).not.toContain('private');
    },
  );

  it('handles invalid JSON, empty responses and network failures', async () => {
    for (const response of [new Response('invalid'), new Response('{}')]) {
      fetchMock.mockResolvedValueOnce(response);
      await expect(
        service.generateContent('groq', '', '', []),
      ).rejects.toThrow();
    }
    fetchMock.mockRejectedValueOnce(
      new DOMException('Aborted', 'TimeoutError'),
    );
    await expect(service.generateContent('groq', '', '', [])).rejects.toThrow(
      'failed to connect or returned an invalid response',
    );
  });

  it('validates configuration without making optional providers mandatory', () => {
    expect(
      EnvSchema.safeParse({
        ...original,
        OPENROUTER_BASE_URL: '',
        GROQ_BASE_URL: '',
      }).success,
    ).toBe(true);
    expect(
      EnvSchema.safeParse({ ...original, GROQ_BASE_URL: 'invalid' }).success,
    ).toBe(false);
    expect(
      EnvSchema.safeParse({ ...original, AI_REQUEST_TIMEOUT_MS: 0 }).success,
    ).toBe(false);
  });
});
