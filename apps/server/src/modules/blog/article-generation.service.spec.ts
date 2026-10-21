import { describe, expect, it, vi } from 'vitest';
import { ArticleGenerationService } from './article-generation.service.js';
import { ChatCompletionService } from './chat-completion.service.js';
import { GeminiService } from './gemini.service.js';

describe('ArticleGenerationService', () => {
  it.each(['openrouter', 'groq'])(
    'routes %s through the shared article workflow',
    async (provider) => {
      const gemini = { generateContent: vi.fn() };
      const chat = {
        generateContent: vi
          .fn()
          .mockResolvedValue({ text: '{}', model: 'provider-default' }),
      };
      const service = new ArticleGenerationService(
        gemini as unknown as GeminiService,
        chat as unknown as ChatCompletionService,
      );
      const result = await service.generateBilingualFromReference({
        referenceContent: 'Reference',
        provider,
      });
      expect(gemini.generateContent).not.toHaveBeenCalled();
      expect(chat.generateContent).toHaveBeenCalledWith(
        provider,
        expect.stringContaining('DEVANAGARI'),
        expect.stringContaining('Reference'),
        [],
        expect.any(Function),
        undefined,
      );
      expect(result.modelUsed).toBe('provider-default');
    },
  );

  it('rejects unsupported providers', async () => {
    const service = new ArticleGenerationService(
      {} as GeminiService,
      {} as ChatCompletionService,
    );
    await expect(
      service.generateBilingualFromReference({
        referenceContent: 'Reference',
        provider: 'unknown',
      }),
    ).rejects.toThrow('Unsupported AI provider');
  });
  it('passes reference, instructions, images and selected model to Gemini and preserves the result', async () => {
    const article = {
      title: 'Exam notice',
      slug: 'exam-notice',
      excerpt: 'Summary',
      content: '## Important dates\nDetails',
      metaTitle: 'Exam notice',
      metaDescription: 'Summary',
      keywords: ['exam'],
    };
    const output = {
      hinglish: article,
      english: article,
      seoScore: 85,
      detectedCategory: 'jobs',
    };
    const generateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify(output),
      model: 'selected-model',
    });
    const service = new ArticleGenerationService(
      {
        generateContent,
      } as unknown as GeminiService,
      {} as ChatCompletionService,
    );
    const stages = vi.fn();
    const result = await service.generateBilingualFromReference(
      {
        referenceContent: 'Reference exam announcement',
        category: 'jobs',
        additionalInstructions: 'Keep all dates',
        model: 'selected-model',
        images: [
          {
            url: '/notice.png',
            base64: 'aW1hZ2U=',
            mimeType: 'image/png',
            altText: 'Notice',
          },
        ],
      },
      stages,
    );

    expect(result).toEqual({ ...output, modelUsed: 'selected-model' });
    const [system, user, images, onModelSwitch, model] =
      generateContent.mock.calls[0];
    expect(system).toContain('DEVANAGARI');
    expect(system).toContain('Notice');
    expect(user).toContain('Reference exam announcement');
    expect(user).toContain('Keep all dates');
    expect(images).toEqual([
      { mimeType: 'image/png', data: 'aW1hZ2U=', url: '/notice.png' },
    ]);
    expect(model).toBe('selected-model');
    onModelSwitch(model);
    expect(stages).toHaveBeenCalledWith(
      'MODEL_SWITCH',
      'Engaging model: selected-model...',
    );
    expect(stages).toHaveBeenCalledWith('FINALIZING', expect.any(String));
  });

  it('keeps the default Gemini model and existing output defaults', async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: '```json\n{}\n```',
      model: 'gemini-3.8-flash',
    });
    const service = new ArticleGenerationService(
      {
        generateContent,
      } as unknown as GeminiService,
      {} as ChatCompletionService,
    );
    const result = await service.generateBilingualFromReference({
      referenceContent: 'Reference',
      category: 'jobs',
    });
    expect(generateContent.mock.calls[0][4]).toBe('gemini-3.8-flash');
    expect(result.hinglish.title).toBe('Untitled Hinglish Article');
    expect(result.english.content).toBe('');
    expect(result.detectedCategory).toBe('jobs');
    expect(result.seoScore).toBe(75);
  });

  it('preserves parse errors and provider errors', async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValue({ text: 'invalid json', model: 'model' });
    const service = new ArticleGenerationService(
      {
        generateContent,
      } as unknown as GeminiService,
      {} as ChatCompletionService,
    );
    await expect(
      service.generateBilingualFromReference({ referenceContent: 'Reference' }),
    ).rejects.toThrow(
      'Failed to parse AI blog generation output. Please try again.',
    );
    generateContent.mockRejectedValueOnce(new Error('Provider unavailable'));
    await expect(
      service.generateBilingualFromReference({ referenceContent: 'Reference' }),
    ).rejects.toThrow('Provider unavailable');
  });
});
