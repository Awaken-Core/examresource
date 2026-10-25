import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { jsonrepair } from 'jsonrepair';
import { env } from '../../core/config/env.js';

export interface TranslateArticleInput {
  title: string;
  description?: string | null;
  targetLanguage: 'HINGLISH' | 'ENGLISH';
  blocks?: { type: string; value: string; position?: number; metadata?: any }[];
  htmlContent?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  imageAlt?: string | null;
}

export interface TranslatedArticleOutput {
  title: string;
  description: string;
  slugSuffix: string;
  metaTitle: string;
  metaDescription: string;
  imageAlt: string;
  blocks: { type: string; value: string; metadata?: any }[];
  htmlContent?: string;
}

export interface SeoOptimizationInput {
  title: string;
  description?: string | null;
  content: string;
  language?: 'HINGLISH' | 'ENGLISH';
}

export interface SeoOptimizationOutput {
  metaTitle: string;
  metaDescription: string;
  slugSuggestion: string;
  imageAltSuggestion: string;
  excerptSuggestion: string;
  keywords: {
    primary: string[];
    secondary: string[];
  };
  seoScore: number;
  formattingIssues: {
    type: 'warning' | 'error' | 'info';
    message: string;
    fix: string;
  }[];
  suggestions: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractCandidateText(data: unknown): string | undefined {
  if (!isRecord(data) || !Array.isArray(data.candidates)) return undefined;

  const candidate = data.candidates[0];
  if (!isRecord(candidate) || !isRecord(candidate.content)) return undefined;

  const { parts } = candidate.content;
  if (!Array.isArray(parts) || !isRecord(parts[0])) return undefined;

  return typeof parts[0].text === 'string' ? parts[0].text : undefined;
}

function parseRobustJson(raw: string): any {
  // 1. Strip DeepSeek R1 reasoning block <think>...</think>
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // 2. Strip Markdown code fences ```json ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // 3. Extract the outermost JSON object boundaries { ... }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    // Attempt 2: jsonrepair (fixes unescaped quotes inside strings, trailing commas, missing closing tags)
    try {
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired);
    } catch {
      // Attempt 3: Sanitize literal unescaped control characters inside strings and re-repair
      try {
        const sanitized = cleaned.replace(/[\x00-\x1F\x7F]/g, (char) => {
          if (char === '\n') return '\\n';
          if (char === '\r') return '\\r';
          if (char === '\t') return '\\t';
          return '';
        });
        const secondRepaired = jsonrepair(sanitized);
        return JSON.parse(secondRepaired);
      } catch {
        throw initialErr;
      }
    }
  }
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private getCandidateModels(): string[] {
    const configuredFallback = env.GEMINI_FALLBACK_MODELS
      ? env.GEMINI_FALLBACK_MODELS.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const defaultChain = [
      env.GEMINI_MODEL,
      ...configuredFallback,
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3-flash-preview',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.1-pro-preview',
      'gemini-flash-latest',
      'gemini-pro-latest',
    ].filter((m): m is string => Boolean(m));
    return Array.from(new Set(defaultChain));
  }

  private getApiKeys(): string[] {
    return [env.GEMINI_API_KEY, env.GEMINI_BACKUP_API_KEY].filter((k): k is string => Boolean(k));
  }

  private lastUsedModel = 'gemini-3.8-flash';

  public getLastUsedModel(): string {
    return this.lastUsedModel;
  }

  private buildGeminiPayload(
    systemPrompt: string,
    userPrompt: string,
    images?: Array<{ mimeType: string; data: string; url?: string }>,
  ) {
    const parts: any[] = [{ text: userPrompt }];

    if (images && images.length > 0) {
      for (const img of images) {
        if (img.data && img.mimeType) {
          const cleanBase64 = img.data.replace(/^data:[^;]+;base64,/, '').trim();
          if (cleanBase64) {
            parts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }
    }

    return {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 65536,
      },
    };
  }

  private async trySingleModelAttempt(
    url: string,
    body: unknown,
    model: string,
    attempt: number,
    maxRetries: number,
    requestedModel?: string,
  ): Promise<{ text?: string; shouldRetry: boolean; error: string }> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180000),
      });

      if (response.ok) {
        const data: unknown = await response.json();
        const candidateText = extractCandidateText(data);
        if (candidateText) {
          return { text: candidateText, shouldRetry: false, error: '' };
        }
        return {
          shouldRetry: false,
          error: `Model ${model} returned a successful response without candidate text.`,
        };
      }

      const errorText = await response.text();
      const lastError = `Model ${model} returned (${response.status}): ${errorText.slice(0, 300)}`;

      const isTransient = [429, 500, 503, 504].includes(response.status);
      if (isTransient) {
        if (attempt < maxRetries) {
          this.logger.warn(
            `Gemini temporary encounter on ${model} (${response.status}). Retrying attempt ${attempt + 1}/${maxRetries} after backoff...`,
          );
          await new Promise((r) => setTimeout(r, 1200 * attempt));
          return { shouldRetry: true, error: lastError };
        }
        if (requestedModel) {
          throw new BadRequestException(
            `Google Model "${model}" is temporarily under high peak traffic (HTTP ${response.status}). Please select another model from the dropdown (e.g. Gemini 3.5 Flash or Gemini 3.1 Pro) and retry.`,
          );
        }
      }

      return { shouldRetry: false, error: lastError };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      const message = err instanceof Error ? err.message : String(err);
      const lastError = `Network/fetch failed with ${model}: ${message}`;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        return { shouldRetry: true, error: lastError };
      }
      return { shouldRetry: false, error: lastError };
    }
  }

  private async callGemini(
    systemPrompt: string,
    userPrompt: string,
    images?: Array<{ mimeType: string; data: string; url?: string }>,
    onModelSwitch?: (model: string) => void,
    requestedModel?: string,
  ): Promise<string> {
    const apiKeys = this.getApiKeys();
    if (apiKeys.length === 0) {
      throw new BadRequestException(
        'GEMINI_API_KEY is not configured in server environment. Please set GEMINI_API_KEY in apps/server/.env',
      );
    }
    const candidateModels = requestedModel ? [requestedModel] : this.getCandidateModels();
    const payload = this.buildGeminiPayload(systemPrompt, userPrompt, images);
    const maxRetries = requestedModel ? 2 : 1;
    let lastError = '';

    for (const apiKey of apiKeys) {
      for (const model of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        this.logger.log(`Calling Gemini API using model: ${model}...`);
        onModelSwitch?.(model);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const result = await this.trySingleModelAttempt(url, payload, model, attempt, maxRetries, requestedModel);
          if (result.text) {
            this.lastUsedModel = model;
            return result.text;
          }
          lastError = result.error;
          if (!result.shouldRetry) break;
        }

        this.logger.warn(`Gemini try failed with ${model}: ${lastError}. Trying next candidate...`);
      }
    }

    throw new BadRequestException(
      `Gemini API request failed on ${requestedModel || 'all candidate models'}: ${lastError}`,
    );
  }

  private async callDeepSeek(
    systemPrompt: string,
    userPrompt: string,
    model = 'deepseek-chat',
    onModelSwitch?: (model: string) => void,
  ): Promise<string> {
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'DEEPSEEK_API_KEY is not configured in server environment. Please set DEEPSEEK_API_KEY in apps/server/.env or select another model.',
      );
    }
    const baseUrl = (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;

    this.logger.log(`Calling DeepSeek API with model: ${model}...`);
    onModelSwitch?.(`DeepSeek (${model})`);

    const isReasoner = model.toLowerCase().includes('reasoner') || model.toLowerCase().includes('r1');
    const body: Record<string, any> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 8192,
    };

    if (!isReasoner) {
      body.response_format = { type: 'json_object' };
      body.temperature = 0.2;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new BadRequestException(`DeepSeek API error (${res.status}): ${errText.slice(0, 300)}`);
    }

    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new BadRequestException('DeepSeek returned response without content text.');
    }

    this.lastUsedModel = `DeepSeek (${model})`;
    return content;
  }

  private async callOpenRouter(
    systemPrompt: string,
    userPrompt: string,
    model = 'deepseek/deepseek-chat',
    onModelSwitch?: (model: string) => void,
  ): Promise<string> {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'OPENROUTER_API_KEY is not configured in server environment. Please set OPENROUTER_API_KEY in apps/server/.env or select another model.',
      );
    }
    const baseUrl = (env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;

    this.logger.log(`Calling OpenRouter API with model: ${model}...`);
    onModelSwitch?.(`OpenRouter (${model})`);

    const isReasoner = model.toLowerCase().includes('reasoner') || model.toLowerCase().includes('r1');
    const body: Record<string, any> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 8192,
    };

    if (!isReasoner) {
      body.response_format = { type: 'json_object' };
      body.temperature = 0.2;
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': env.CLIENT_URL || 'http://localhost:3000',
      'X-Title': 'ExamResource Reference Rewriter',
    };

    let res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000),
    });

    if (!res.ok) {
      const errText = await res.text();
      // If the model does not support response_format (common on free/open-weight models), retry without it
      if (body.response_format && (res.status === 400 || errText.toLowerCase().includes('response_format') || errText.toLowerCase().includes('json'))) {
        this.logger.warn(`OpenRouter model ${model} rejected response_format. Retrying without structured output flag...`);
        delete body.response_format;
        res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(180000),
        });
      }

      if (!res.ok) {
        const finalErrText = await res.text();
        throw new BadRequestException(`OpenRouter API error (${res.status}): ${finalErrText.slice(0, 300)}`);
      }
    }

    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new BadRequestException('OpenRouter returned response without content text.');
    }

    this.lastUsedModel = `OpenRouter (${model})`;
    return content;
  }

  private async callAiModel(
    systemPrompt: string,
    userPrompt: string,
    images?: Array<{ mimeType: string; data: string; url?: string }>,
    onModelSwitch?: (model: string) => void,
    requestedModel?: string,
  ): Promise<{ text: string; modelUsed: string }> {
    const rawReq = (requestedModel || 'gemini-3.8-flash').trim();

    // 1. Explicit OpenRouter request
    if (rawReq.startsWith('openrouter:') || rawReq.startsWith('openrouter/')) {
      const orModel = rawReq.replace(/^openrouter[:/]/, '').trim() || 'deepseek/deepseek-chat';
      try {
        const text = await this.callOpenRouter(systemPrompt, userPrompt, orModel, onModelSwitch);
        return { text, modelUsed: this.lastUsedModel };
      } catch (err: any) {
        this.logger.warn(`OpenRouter execution failed: ${err.message}. Checking failovers...`);
        if (env.DEEPSEEK_API_KEY && orModel.includes('deepseek')) {
          const dsModel = orModel.includes('r1') ? 'deepseek-reasoner' : 'deepseek-chat';
          onModelSwitch?.(`Failover: Direct DeepSeek (${dsModel})...`);
          const text = await this.callDeepSeek(systemPrompt, userPrompt, dsModel, onModelSwitch);
          return { text, modelUsed: this.lastUsedModel };
        }
        if (env.GEMINI_API_KEY) {
          onModelSwitch?.('Failover: Google Gemini Flash...');
          const text = await this.callGemini(systemPrompt, userPrompt, images, onModelSwitch);
          return { text, modelUsed: this.lastUsedModel };
        }
        throw err;
      }
    }

    // 2. Explicit DeepSeek Direct request
    if (rawReq.startsWith('deepseek')) {
      const dsModel =
        rawReq === 'deepseek-r1' || rawReq === 'deepseek-reasoner' ? 'deepseek-reasoner' : 'deepseek-chat';
      try {
        const text = await this.callDeepSeek(systemPrompt, userPrompt, dsModel, onModelSwitch);
        return { text, modelUsed: this.lastUsedModel };
      } catch (err: any) {
        this.logger.warn(`Direct DeepSeek failed: ${err.message}. Checking failovers...`);
        if (env.OPENROUTER_API_KEY) {
          const orModel = dsModel === 'deepseek-reasoner' ? 'deepseek/deepseek-r1' : 'deepseek/deepseek-chat';
          onModelSwitch?.(`Failover: OpenRouter (${orModel})...`);
          const text = await this.callOpenRouter(systemPrompt, userPrompt, orModel, onModelSwitch);
          return { text, modelUsed: this.lastUsedModel };
        }
        if (env.GEMINI_API_KEY) {
          onModelSwitch?.('Failover: Google Gemini Flash...');
          const text = await this.callGemini(systemPrompt, userPrompt, images, onModelSwitch);
          return { text, modelUsed: this.lastUsedModel };
        }
        throw err;
      }
    }

    // 3. Google Gemini (default or explicitly requested)
    try {
      const text = await this.callGemini(systemPrompt, userPrompt, images, onModelSwitch, rawReq);
      return { text, modelUsed: this.lastUsedModel };
    } catch (err: any) {
      this.logger.warn(`Gemini call failed: ${err.message}. Checking failovers...`);
      if (env.DEEPSEEK_API_KEY) {
        onModelSwitch?.('Failover: DeepSeek V3 (Ultra-Fast)...');
        const text = await this.callDeepSeek(systemPrompt, userPrompt, 'deepseek-chat', onModelSwitch);
        return { text, modelUsed: this.lastUsedModel };
      }
      if (env.OPENROUTER_API_KEY) {
        onModelSwitch?.('Failover: OpenRouter (DeepSeek V3)...');
        const text = await this.callOpenRouter(systemPrompt, userPrompt, 'deepseek/deepseek-chat', onModelSwitch);
        return { text, modelUsed: this.lastUsedModel };
      }
      throw err;
    }
  }

  /**
   * 1-Click Bi-directional Markdown & Block Translation:
   * Detects whether input is Hinglish or English and translates to the opposite language.
   */
  async translateMarkdownContent(input: {
    title: string;
    markdown: string;
    sourceLanguage?: 'AUTO' | 'HINGLISH' | 'ENGLISH';
    targetLanguage?: 'HINGLISH' | 'ENGLISH';
  }): Promise<{
    detectedLanguage: 'HINGLISH' | 'ENGLISH';
    targetLanguage: 'HINGLISH' | 'ENGLISH';
    title: string;
    markdown: string;
    excerpt: string;
    metaTitle: string;
    metaDescription: string;
    slugSuggestion: string;
  }> {
    const systemPrompt = `You are an elite bilingual competitive exam content editor following the exact editorial standard of top Indian education portals like BiharHelp.in and SarkariResult.com.
Task: Detect the language of the provided Indian exam blog article and translate it completely into the OPPOSITE language.

Language Detection & Translation Rules:
- If source is HINDI / HINGLISH:
  Translate into clear, professional, authoritative, search-engine optimized ENGLISH.
- If source is ENGLISH:
  Translate into authentic Indian portal style: DEVANAGARI HINDI (देवनागरी लिपि) mixed naturally with standard English technical terms (BiharHelp & Sarkari Result style).
  Example: "अगर आप भी रेलवे में सरकारी नौकरी की तैयारी कर रहे हैं और NTPC के नए पदों के लिए आवेदन करना चाहते हैं, तो आपके लिए बहुत अच्छी खबर है। Railway Recruitment Boards (RRBs) ने CEN No. 05/2026 के तहत Full Notification जारी कर दी है।"
  - Write fluent sentences in Hindi (देवनागरी).
  - Keep official terms, post names, organizations, dates, and technical keywords in ENGLISH: "Railway Recruitment Boards (RRBs)", "CEN No. 05/2026", "NTPC Graduate Level", "Important Dates", "Application Fee", "Selection Process", "Eligibility Criteria", "Age Limit", "Admit Card", "Syllabus", "Direct Link", "Official Website".
  - Preserve all Markdown formatting intact: headings (##, ###), tables (| --- |), bullet points, bold/italic, code blocks, links, blockquotes.

Output must be valid JSON matching this schema:
{
  "detectedLanguage": "HINGLISH" or "ENGLISH",
  "targetLanguage": "ENGLISH" or "HINGLISH",
  "title": "translated article title string",
  "markdown": "translated full markdown content string",
  "excerpt": "concise 1-2 sentence summary in target language",
  "metaTitle": "SEO meta title under 60 chars in target language",
  "metaDescription": "SEO meta description under 160 chars in target language",
  "slugSuggestion": "url-slug-in-target-language"
}`;

    const userPrompt = JSON.stringify({
      specifiedSource: input.sourceLanguage || 'AUTO',
      specifiedTarget: input.targetLanguage || null,
      title: input.title,
      markdown: input.markdown,
    });

    const rawJson = await this.callGemini(systemPrompt, userPrompt);
    try {
      const parsed = JSON.parse(rawJson);
      return {
        detectedLanguage: parsed.detectedLanguage || (input.sourceLanguage === 'ENGLISH' ? 'ENGLISH' : 'HINGLISH'),
        targetLanguage: parsed.targetLanguage || (parsed.detectedLanguage === 'HINGLISH' ? 'ENGLISH' : 'HINGLISH'),
        title: parsed.title || input.title,
        markdown: parsed.markdown || input.markdown,
        excerpt: parsed.excerpt || '',
        metaTitle: parsed.metaTitle || parsed.title || input.title,
        metaDescription: parsed.metaDescription || parsed.excerpt || '',
        slugSuggestion: parsed.slugSuggestion || '',
      };
    } catch (err) {
      this.logger.error('Failed to parse Gemini bilingual markdown response', err);
      throw new BadRequestException('Failed to process bilingual translation output.');
    }
  }

  /**
   * Translate complete article between English and conversational Hinglish.
   */
  async translateArticle(input: TranslateArticleInput): Promise<TranslatedArticleOutput> {
    const isTargetHinglish = input.targetLanguage === 'HINGLISH';

    const systemPrompt = `You are an expert bilingual content editor specializing in Indian Government Exam portals and recruitment articles (following BiharHelp.in and SarkariResult.com style).
Target Language: ${isTargetHinglish ? 'DEVANAGARI HINDI (देवनागरी लिपि) mixed with standard English technical terms' : 'Professional, clear, informative ENGLISH'}.

Rules for Hindi / Hinglish:
1. Write in authentic DEVANAGARI HINDI (देवनागरी लिपि) for normal sentences and explanations. Example: "Railway Recruitment Board (RRB) ने NTPC 10+2 पदों के लिए Official Notification जारी कर दी है। सभी योग्य उम्मीदवार 15 अक्टूबर से 13 नवंबर तक ऑनलाइन आवेदन कर सकते हैं।"
2. Keep official exam keywords in English: "Admit Card", "Eligibility Criteria", "Application Fee", "Selection Process", "Exam Pattern", "Syllabus", "Cut-off", "Direct Link", "Official Notification PDF", "Vacancies", "Age Limit".
3. Do NOT write purely Romanized Hindi. Use Devanagari Hindi with English keywords.

Rules for Structure:
- Translate the title, description/excerpt, metaTitle, metaDescription, and imageAlt.
- If blocks are provided, preserve all block types ('PARAGRAPH', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'IMAGE', 'TABLE', 'CALLOUT', 'BULLET_LIST', 'NUMBERED_LIST', 'QUOTE', 'CODE', 'DIVIDER') and their positions. Only translate the 'value' text of each block. Keep all HTML tags inside block values (like <strong>, <a>, <table>, <tr>, <td>) intact.
- If htmlContent is provided, translate text nodes while preserving all HTML tags and attributes.
- Generate a clean slugSuffix: leave it as an empty string "" since both language versions now share the same URL slug.

Output must be valid JSON matching this schema:
{
  "title": "translated title string",
  "description": "translated short excerpt string",
  "slugSuffix": "",
  "metaTitle": "translated SEO meta title string (under 60 chars)",
  "metaDescription": "translated SEO meta description string (under 160 chars)",
  "imageAlt": "translated image alt text string",
  "blocks": [
    { "type": "BLOCK_TYPE", "value": "translated block value", "metadata": {} }
  ],
  "htmlContent": "translated HTML string if provided, else null"
}`;

    const userPrompt = JSON.stringify({
      targetLanguage: input.targetLanguage,
      title: input.title,
      description: input.description || '',
      metaTitle: input.metaTitle || input.title,
      metaDescription: input.metaDescription || input.description || '',
      imageAlt: input.imageAlt || '',
      blocks: input.blocks || [],
      htmlContent: input.htmlContent || null,
    });

    const rawJson = await this.callGemini(systemPrompt, userPrompt);
    try {
      const parsed = JSON.parse(rawJson);
      return {
        title: parsed.title || input.title,
        description: parsed.description || input.description || '',
        slugSuffix: '',
        metaTitle: parsed.metaTitle || parsed.title || input.title,
        metaDescription: parsed.metaDescription || parsed.description || '',
        imageAlt: parsed.imageAlt || input.imageAlt || '',
        blocks: Array.isArray(parsed.blocks) ? parsed.blocks : input.blocks || [],
        htmlContent: parsed.htmlContent || undefined,
      };
    } catch (err) {
      this.logger.error('Failed to parse Gemini translation JSON response', err);
      throw new BadRequestException('Failed to process translation output from AI.');
    }
  }

  /**
   * Analyze article for SEO Optimization, CTR metadata, and formatting/content diagnostics.
   */
  async optimizeSeo(input: SeoOptimizationInput): Promise<SeoOptimizationOutput> {
    const systemPrompt = `You are an elite Search Engine Optimization (SEO) and Technical Content Auditor specializing in competitive exams, education, and government recruitment portals in India.

Your goal is to inspect the article content and produce:
1. High-CTR SEO Title (metaTitle): Under 60 characters, includes high-intent search query keywords (Year 2026, Post Name, Eligibility, Dates).
2. Compelling Meta Description (metaDescription): Under 155-160 characters, with clear call-to-action (e.g., "Check eligibility, dates, and apply online").
3. SEO-Friendly Slug: clean, lowercase, hyphens only, no stop words.
4. Descriptive Image Alt Text: descriptive for search crawlers and screen readers.
5. High-Impact Excerpt: 1-2 concise summary sentences.
6. Target Keywords: 3-5 primary keywords, 5-8 secondary long-tail keywords.
7. Content & Format Quality Audit:
   - Identify formatting errors (e.g. missing H2/H3 subheadings, tables without headers, missing bullet points, huge walls of text > 300 words without breaks).
   - Identify critical missing information for Indian exam articles (e.g., missing Application Fee, missing Age Limit, missing Important Dates, missing Official Website / Apply Link, missing Vacancy Breakdown).
8. SEO Score: 0 to 100 based on keyword density, readability, structure, and intent completeness.

Output must be valid JSON matching this schema:
{
  "metaTitle": "SEO title string (< 60 chars)",
  "metaDescription": "SEO meta description (< 160 chars)",
  "slugSuggestion": "clean-article-slug",
  "imageAltSuggestion": "descriptive alt text",
  "excerptSuggestion": "concise summary paragraph",
  "keywords": {
    "primary": ["keyword1", "keyword2", "keyword3"],
    "secondary": ["long tail keyword 1", "long tail keyword 2"]
  },
  "seoScore": 85,
  "formattingIssues": [
    {
      "type": "warning" | "error" | "info",
      "message": "Specific issue found in article",
      "fix": "Actionable recommendation to fix it"
    }
  ],
  "suggestions": [
    "Quick tip to increase rankings and CTR"
  ]
}`;

    const userPrompt = JSON.stringify({
      title: input.title,
      description: input.description,
      language: input.language || 'HINGLISH',
      contentSample: input.content.slice(0, 15000), // Up to 15k characters of content
    });

    const rawJson = await this.callGemini(systemPrompt, userPrompt);
    try {
      const parsed = JSON.parse(rawJson);
      return {
        metaTitle: parsed.metaTitle || input.title,
        metaDescription: parsed.metaDescription || input.description || '',
        slugSuggestion: parsed.slugSuggestion || '',
        imageAltSuggestion: parsed.imageAltSuggestion || '',
        excerptSuggestion: parsed.excerptSuggestion || '',
        keywords: parsed.keywords || { primary: [], secondary: [] },
        seoScore: typeof parsed.seoScore === 'number' ? parsed.seoScore : 75,
        formattingIssues: Array.isArray(parsed.formattingIssues) ? parsed.formattingIssues : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      };
    } catch (err) {
      this.logger.error('Failed to parse Gemini SEO JSON response', err);
      throw new BadRequestException('Failed to process SEO suggestions from AI.');
    }
  }

  /**
   * Generate accessible, high-CTR image alt text and caption for blog articles.
   */
  async generateImageMeta(input: {
    articleTitle?: string;
    sectionHeading?: string;
    contextText?: string;
    language?: string;
  }): Promise<{ alt: string; caption: string }> {
    const systemPrompt = `You are an elite accessibility (WCAG 2.1 AAA) and SEO metadata specialist for educational and government exam publications.
Generate a concise, highly descriptive image alt text (for screen readers and Google Image search) and a clean, informative caption.
Rules:
1. "alt": 60-110 characters. Accurately convey the visual subject matter in context of the article (e.g. "BHEL Artisan Recruitment 2026 Official Notice Banner showing 660 Vacancies"). NEVER use "image of" or "pasted image".
2. "caption": 40-90 characters. A helpful reader-facing caption summarizing the image context.
Return ONLY valid JSON:
{
  "alt": "...",
  "caption": "..."
}`;
    const userPrompt = JSON.stringify(input);
    try {
      const rawJson = await this.callGemini(systemPrompt, userPrompt);
      const parsed = JSON.parse(rawJson);
      const cleanText = (str: string) => {
        let prev = '';
        let curr = String(str || '');
        for (let i = 0; i < 5 && curr !== prev; i++) {
          prev = curr;
          curr = curr
            .replaceAll('&amp;', '&')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&quot;', '"')
            .replaceAll('&#39;', "'")
            .replaceAll('&#x27;', "'")
            .replaceAll('&#x2F;', '/');
        }
        return curr.trim();
      };

      let alt = 'Official recruitment notice details';
      if (typeof parsed.alt === 'string' && parsed.alt.trim()) {
        alt = cleanText(parsed.alt);
      } else if (input.articleTitle) {
        alt = `${cleanText(input.articleTitle)} Official Notice`;
      }

      let caption = '';
      if (typeof parsed.caption === 'string' && parsed.caption.trim()) {
        caption = cleanText(parsed.caption);
      } else if (input.articleTitle) {
        caption = `${cleanText(input.articleTitle)} Details`;
      }

      return { alt, caption };
    } catch {
      const cleanFallback = (str: string) => String(str || '').replaceAll('&amp;', '&').trim();
      const fallbackAlt = input.articleTitle
        ? `${cleanFallback(input.articleTitle)} Official Notice`
        : 'Official recruitment notice details';
      const fallbackCaption = input.articleTitle
        ? `${cleanFallback(input.articleTitle)} Details`
        : '';
      return {
        alt: fallbackAlt,
        caption: fallbackCaption,
      };
    }
  }

  /**
   * Generate complete bilingual blog (Hinglish + English) + SEO from a reference article.
   * Input can be raw text, Markdown, or HTML — Gemini normalises and rewrites fresh content.
   */
  async generateBilingualFromReference(
    input: {
      referenceContent: string;
      category?: string;
      additionalInstructions?: string;
      images?: Array<{ url: string; base64?: string; mimeType?: string; altText?: string }>;
      model?: string;
      availableCategories?: Array<{ id: string; name: string; slug: string }>;
    },
    onStage?: (stage: string, message: string) => void,
  ): Promise<{
    hinglish: {
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      metaTitle: string;
      metaDescription: string;
      keywords: string[];
    };
    english: {
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      metaTitle: string;
      metaDescription: string;
      keywords: string[];
    };
    detectedCategory?: string;
    modelUsed: string;
  }> {
    onStage?.('INGEST', 'Validating reference content, categories and attached media...');

    const validImages = (input.images || []).filter((img) => img && (img.url || img.base64));

    let imageInstructions = '';
    if (validImages.length > 0) {
      const hasPdf = validImages.some((img) => img.mimeType === 'application/pdf');
      onStage?.(
        'VISION',
        hasPdf
          ? `Analyzing attached notification document & images with Gemini Multimodal Pipeline...`
          : `Analyzing ${validImages.length} attached image(s) with Gemini Vision...`,
      );

      const imageDescriptions = validImages
        .map((img, i) => {
          if (img.mimeType === 'application/pdf') {
            return `Attachment ${i + 1} [OFFICIAL PDF NOTIFICATION]: Read and synthesize all pages of this government notification document thoroughly.`;
          }
          const hint = img.altText ? `(Author Alt/Keyword Hint: "${img.altText}")` : '';
          const urlOrRef = img.url || 'Reference Image';
          return `Image ${i + 1}: ${urlOrRef} ${hint}`.trim();
        })
        .join('\n');

      imageInstructions = `
══════════════════════════════════════════════════════════════════════════════
3. MULTIMODAL ATTACHMENTS (DOCUMENTS & CONTEXTUAL IMAGE PLACEMENTS)
══════════════════════════════════════════════════════════════════════════════
The author provided ${validImages.length} attachment(s) for this article:
${imageDescriptions}

INSTRUCTIONS FOR ATTACHMENTS:
1. If any attachment is an Official PDF Notification, extract all exact figures, tables, dates, vacancies, fees, eligibility, and pay scales directly from it.
2. For image files: inspect what each image represents (e.g. Exam Pattern, Syllabus Breakdown, Important Dates Table, Salary Structure). Place each image into BOTH the Hinglish and English versions at the point of maximum clarity.
3. Render placed images using this exact responsive structure:
<figure class="article-figure" data-align="center" data-layout="full"><img src="{EXACT_IMAGE_URL}" alt="{DESCRIPTIVE_ALT_WITH_FOCUS_KEYWORDS}" width="700" height="400" data-align="center" data-layout="full" class="article-media" /><figcaption class="text-xs text-center text-slate-500 mt-2">{Helpful Caption}</figcaption></figure>
`;
    }

    const categoryList = (input.availableCategories || [])
      .map((c) => `- "${c.name}" (slug: ${c.slug})`)
      .join('\n');
    const categorySection = categoryList
      ? `
══════════════════════════════════════════════════════════════════════════════
STRICT CATEGORY LABELING (EXISTING SYSTEM CATEGORIES ONLY)
══════════════════════════════════════════════════════════════════════════════
You MUST classify and label this article under EXACTLY ONE of the existing system categories listed below:
${categoryList}

CRITICAL CATEGORY RULES:
- Select the single best matching category from this list.
- NEVER invent, create, or output any new category name not present in the list.
- Return the exact category name in "detectedCategory".
`
      : '';

    const systemPrompt = `You are an elite bilingual content writer, subject matter authority, and Answer Engine Optimization (AEO/GEO/SEO) specialist for an Indian educational portal. You strictly adhere to the high editorial standards of premier Indian educational platforms (like BiharHelp.in, SarkariResult, Testbook, and JagranJosh).

Your task: Read the REFERENCE content (official notification, syllabus, GK topic, current affairs article, or study guide) and REWRITE it as TWO complete, publication-ready, search-engine-dominating bilingual blog articles (Hindi/Hinglish in Devanagari with technical terms + Authoritative English).
${imageInstructions}
${categorySection}
══════════════════════════════════════════════════════════════════════════════
INTELLIGENT TOPIC CLASSIFICATION & ADAPTIVE STRUCTURE (MANDATORY)
══════════════════════════════════════════════════════════════════════════════
First, detect the true nature of the reference content from these 5 archetypes and adapt your structure accordingly:

TYPE 1: GOVT JOB & VACANCY RECRUITMENT NOTIFICATION
- Focus: Post names, vacancy counts, 7th CPC pay levels, eligibility, age limits, selection stages, how to apply.
- Tables: Overview Table, Important Dates Table, Post-wise Vacancy Breakdown Table, Application Fee Table, Direct Links Table.

TYPE 2: EXAM SCHEDULE, ADMIT CARD, ANSWER KEY, RESULTS & CUT-OFF
- Focus: Exam dates, shift timings, hall ticket download steps, answer key objection window, minimum qualifying/cut-off marks, scorecard download.
- Tables: Exam Overview Table, Important Dates & Shift Schedule, Category-wise Cut-off Marks / Minimum Qualifying Marks Table, Direct Links Table (Admit Card / Result / Answer Key).

TYPE 3: GENERAL KNOWLEDGE (STATIC GK, POLITY, HISTORY, GEOGRAPHY, SCIENCE, ECONOMY)
- Focus: Clear conceptual master-guide, historical origins, constitutional provisions/articles, scientific principles, geographical features.
- DO NOT invent fake vacancies, fake salaries, or application fees!
- Tables: Key Facts / Quick Summary Table, Chronology / Timeline Table, Comparison / Classification Table, Important Constitutional Articles / Scientific Formulas.
- Special Section: Key Takeaways for Competitive Exams & Practice MCQs / Q&A.

TYPE 4: CURRENT AFFAIRS & CONTEMPORARY UPDATES (NATIONAL/GLOBAL, SCHEMES, AWARDS, DEFENSE)
- Focus: What happened, who is involved, date/venue, background context, national/global significance, scheme objectives, beneficiaries, budget allocations.
- DO NOT invent fake job vacancies or salary tables!
- Tables: Event / Scheme Overview Table, Important Dates & Milestones, Key Highlights / Beneficiaries / Awardees Matrix, Official Sources.

TYPE 5: SUBJECT NOTES & STUDY MATERIAL (MATHEMATICS, REASONING, ENGLISH, GENERAL SCIENCE)
- Focus: Theory, core definitions, rules, shortcut formulas, solved examples, classification, weightage in competitive exams.
- Tables: Topic Syllabus Breakdown Table, Important Formulas / Rules Table, Exam-wise Weightage Table.

══════════════════════════════════════════════════════════════════════════════
CORE EDITORIAL, SEO, AEO & GEO PRINCIPLES (APPLIES TO ALL TOPIC TYPES)
══════════════════════════════════════════════════════════════════════════════
1. BLUF STRUCTURE (Bottom Line Up Front):
   Under EVERY major '##' heading, the VERY FIRST SENTENCE must be a direct, self-contained, definitive answer before any tables, bullets, or paragraphs.
   (e.g., Under Fundamental Rights: "Fundamental Rights are enshrined in Part III (Articles 12 to 35) of the Constitution of India and are justiciable in nature, guaranteeing six basic freedoms to every citizen.")
   This ensures AI Answer Engines (Perplexity, Google AI Overviews, SearchGPT, Claude) extract your exact sentence for direct citation snippets.

2. SYNTHETIC QUERY FAN-OUT COVERAGE (AEO):
   Explicitly answer the most commonly asked student questions related to the topic (e.g., eligibility/relaxations for exams, amendments/exceptions for GK, objectives/eligibility for schemes, formulas/shortcuts for study notes).

3. ENTITY GROUNDING (GEO):
   Ground all facts in authoritative entities: Official Government Ministries, Commissions (UPSC, SSC, RRB, NTA), Gazette / Act numbers, Constitutional Articles, Verified Domains, and exact official statistics.

4. MANDATORY GFM MARKDOWN TABLES:
   Every article MUST include at least 3-5 rich Markdown tables tailored to the detected topic type (Overview, Dates/Timeline, Breakdown/Comparison, Links/Formulas).

5. PAA FAQS (PEOPLE ALSO ASK):
   Include 4-5 high-intent FAQs with explicit "### Q: ..." heading and direct, authoritative 2-3 sentence answers ("**Ans:** ...").

══════════════════════════════════════════════════════════════════════════════
1. HINDI / HINGLISH VERSION (DEVANAGARI + ENGLISH KEYWORDS — BiharHelp & SarkariResult Style)
══════════════════════════════════════════════════════════════════════════════
- SCRIPT: Write the text in natural, engaging DEVANAGARI HINDI (देवनागरी लिपि).
  NEVER write purely Romanized Hindi (do NOT write "Railway me sarkari naukri...").
  Keep all official names, organizations, stages, legal terms, and technical keywords in clean ENGLISH Latin letters:
  "Railway Recruitment Boards (RRBs)", "Constitution of India", "Fundamental Rights", "Current Affairs 2026", "Online Application", "Eligibility Criteria", "Syllabus", "Direct Link", "Official Website".
- TITLE & HEADLINE REQUIREMENT (CRITICAL):
  The "title" in "hinglish" MUST be an engaging bilingual headline pairing English technical keywords with a Devanagari Hindi hook (BiharHelp / SarkariResult style).
  DO NOT make the Hinglish title identical to the English title!
  Good Hinglish Title Examples:
  • "Upcoming Central Government Exams 2026–2027: प्रमुख भर्ती कैलेंडर, पात्रता, तिथियां और संपूर्ण विवरण"
  • "RRB NTPC 2026 Notification: ऑनलाइन आवेदन, परीक्षा तिथि, पात्रता व संपूर्ण चयन प्रक्रिया"
  • "SSC CGL 2026 Exam Date: परीक्षा शेड्यूल, नए दिशानिर्देश और एडमिट कार्ड डाउनलोड लिंक"

══════════════════════════════════════════════════════════════════════════════
2. ENGLISH VERSION (Authoritative, Comprehensive, High-Intent SEO)
══════════════════════════════════════════════════════════════════════════════
- SCRIPT: Written 100% in clear, comprehensive, professional English with complete markdown formatting, tables, and FAQs.
- TITLE & HEADLINE REQUIREMENT (CRITICAL):
  The "title" in "english" MUST be a formal, authoritative English SEO title targeting high-intent national search queries.
  Good English Title Examples:
  • "Upcoming Central Government Exams 2026–2027: Exam Calendar, Eligibility, Notification Dates & Schedule"
  • "RRB NTPC 2026 Notification: Exam Dates, Vacancies, Eligibility & Selection Process"
  • "SSC CGL 2026 Exam Date Out: Tier 1 Schedule, Shift Timings & Admit Card Guidelines"

══════════════════════════════════════════════════════════════════════════════
SEO METADATA FOR BOTH:
══════════════════════════════════════════════════════════════════════════════
- metaTitle: Under 60 chars, starts with high-intent primary keyword + year/topic + CTR trigger
- metaDescription: Under 155 chars, summary of core topic with clear call-to-action
- slug: clean, lowercase, hyphens only — use the SAME canonical slug for both versions
- keywords: 6-10 target keywords and AEO entity phrases
- excerpt: 1-2 compelling summary sentences

══════════════════════════════════════════════════════════════════════════════
WORD COUNT & DEPTH MANDATE: MINIMUM 1,500 WORDS TO MAXIMUM 3,500 WORDS:
══════════════════════════════════════════════════════════════════════════════
- Length Target: Each article (both "hinglish" and "english") MUST be between 1,500 words (minimum) and 3,500 words (maximum), scaling adaptively depending on topic complexity, completeness of details, and language nuance.
- For focused notices (e.g. admit cards, answer keys, results, short updates): aim for ~1,500–2,000 words covering all instructions, steps, portal links, and troubleshooting FAQs.
- For major recruitment notices, calendars, study material, and comprehensive guides: write deeply (~2,000–3,500 words) with complete post/category breakdown tables, full eligibility clauses, syllabus topics, and 6–10 detailed FAQs.
- CRITICAL: BOTH "hinglish" AND "english" versions must be 100% complete, fully articulated, and standalone publication-ready articles. NEVER truncate, summarize, or leave either edition incomplete.

Output ONLY valid JSON (no markdown fences, no extra text):
{
  "hinglish": {
    "title": "Upcoming Central Government Exams 2026–2027: प्रमुख भर्ती कैलेंडर, पात्रता, तिथियां और संपूर्ण विवरण",
    "slug": "slug-name",
    "excerpt": "Short excerpt in Hindi with English keywords",
    "content": "Full GFM markdown string with Devanagari text, English terms, and markdown tables",
    "metaTitle": "SEO title under 60 chars in Hindi + English",
    "metaDescription": "SEO description under 155 chars in Hindi",
    "keywords": ["keyword 1", "keyword 2"]
  },
  "english": {
    "title": "Upcoming Central Government Exams 2026–2027: Exam Calendar, Eligibility, Notification Dates & Schedule",
    "slug": "slug-name",
    "excerpt": "Short excerpt in English",
    "content": "Full GFM markdown string in English with tables",
    "metaTitle": "SEO title under 60 chars in English",
    "metaDescription": "SEO description under 155 chars in English",
    "keywords": ["keyword 1", "keyword 2"]
  },
  "detectedCategory": "Exact Name From Existing System Categories"
}`;

    const userPrompt = JSON.stringify({
      referenceContent: input.referenceContent.slice(0, 20000),
      category: input.category || 'auto-detect',
      additionalInstructions: input.additionalInstructions || '',
      attachedImages: validImages.map((img, i) => ({
        index: i + 1,
        url: img.url,
      })),
    });

    onStage?.('DRAFTING', 'Generating bilingual articles, metadata & category classification in unified pass...');

    const imageParts = validImages.map((img) => ({
      mimeType: img.mimeType || 'image/jpeg',
      data: img.base64 || '',
      url: img.url,
    }));

    const requestedModel = input.model || 'deepseek-chat';
    const result = await this.callAiModel(
      systemPrompt,
      userPrompt,
      imageParts,
      (switchingModel) => {
        onStage?.('MODEL_SWITCH', `Engaging model: ${switchingModel}...`);
      },
      requestedModel,
    );

    onStage?.('FINALIZING', 'Parsing structure, extracting keywords and validating metadata...');

    try {
      const parsed = parseRobustJson(result.text);

      let englishTitle = parsed.english?.title || '';
      let englishExcerpt = parsed.english?.excerpt || '';
      let englishContent = parsed.english?.content || '';
      let englishMetaTitle = parsed.english?.metaTitle || '';
      let englishMetaDescription = parsed.english?.metaDescription || '';
      let englishKeywords = Array.isArray(parsed.english?.keywords) ? parsed.english.keywords : [];

      // If the English version was truncated or incomplete (< 300 words while Hinglish is long):
      const hinglishWordCount = (parsed.hinglish?.content || '').trim().split(/\s+/).length;
      const englishWordCount = englishContent.trim().split(/\s+/).filter(Boolean).length;

      if (!englishContent || englishWordCount < 300 && hinglishWordCount >= 600) {
        this.logger.warn(`AI returned incomplete English edition (${englishWordCount} words vs ${hinglishWordCount} Hinglish words). Auto-completing full English edition...`);
        onStage?.('TRANSLATING', 'Auto-completing full 1.5k–3.5k word English edition from draft...');
        try {
          const completionPrompt = `Translate and adapt the following comprehensive Indian educational/job article from Hindi/Hinglish into high-authority, publication-ready English with complete GitHub Flavored Markdown (tables, headings, FAQs intact).
Target Length: Minimum 1,500 words to maximum 3,500 words matching the depth of the source draft.
Article Title: ${parsed.hinglish?.title || ''}
Article Content (Markdown):
${parsed.hinglish?.content || ''}

Output ONLY valid JSON matching this schema:
{
  "title": "Clear English Title",
  "excerpt": "Compelling English excerpt (1-2 sentences)",
  "content": "Complete 1,500 to 3,500 words English markdown with tables and FAQs",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description under 155 chars",
  "keywords": ["keyword 1", "keyword 2"]
}`;
          const fallbackRes = await this.callAiModel(
            'You are an expert bilingual editor for exam and educational portals. Output ONLY valid JSON.',
            completionPrompt,
            undefined,
            undefined,
            requestedModel,
          );
          const parsedEnglishFallback = parseRobustJson(fallbackRes.text);
          if (parsedEnglishFallback?.content) {
            englishTitle = parsedEnglishFallback.title || englishTitle;
            englishExcerpt = parsedEnglishFallback.excerpt || englishExcerpt;
            englishContent = parsedEnglishFallback.content;
            englishMetaTitle = parsedEnglishFallback.metaTitle || englishTitle;
            englishMetaDescription = parsedEnglishFallback.metaDescription || englishExcerpt;
            if (Array.isArray(parsedEnglishFallback.keywords) && parsedEnglishFallback.keywords.length > 0) {
              englishKeywords = parsedEnglishFallback.keywords;
            }
          }
        } catch (recoveryErr) {
          this.logger.error('Failed to auto-complete English article fallback', recoveryErr);
        }
      }

      const hinglishTitle = parsed.hinglish?.title || 'Untitled Hinglish Article';
      const canonicalSlug = parsed.hinglish?.slug || parsed.english?.slug || 'article';

      return {
        hinglish: {
          title: hinglishTitle,
          slug: canonicalSlug,
          excerpt: parsed.hinglish?.excerpt || '',
          content: parsed.hinglish?.content || '',
          metaTitle: parsed.hinglish?.metaTitle || hinglishTitle,
          metaDescription: parsed.hinglish?.metaDescription || parsed.hinglish?.excerpt || '',
          keywords: Array.isArray(parsed.hinglish?.keywords) ? parsed.hinglish.keywords : [],
        },
        english: {
          title: englishTitle || hinglishTitle,
          slug: canonicalSlug,
          excerpt: englishExcerpt || parsed.hinglish?.excerpt || '',
          content: englishContent || parsed.hinglish?.content || '',
          metaTitle: englishMetaTitle || englishTitle || hinglishTitle,
          metaDescription: englishMetaDescription || englishExcerpt || '',
          keywords: englishKeywords.length > 0 ? englishKeywords : (parsed.hinglish?.keywords || []),
        },
        detectedCategory: parsed.detectedCategory || input.category,
        modelUsed: result.modelUsed || this.lastUsedModel,
      };
    } catch (err: any) {
      this.logger.error(`Failed to parse AI blog generation response: ${err.message}. Text preview (first 500 chars): ${result.text.slice(0, 500)}`);
      throw new BadRequestException(`Failed to parse AI blog generation output: ${err.message}. Please try again.`);
    }
  }

  /**
   * AI-powered question generator for Question Bank.
   * Produces authentic exam-standard MCQs with bilingual English & Devanagari Hindi,
   * 4 plausible options, exact correct answer key, and in-depth step-by-step explanations.
   */
  async generateQuestions(input: {
    subject: string;
    topic?: string;
    examName?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
    language?: 'bilingual' | 'english' | 'hindi';
    additionalPrompt?: string;
  }): Promise<{
    questions: Array<{
      content: string;
      translations?: { hi?: string };
      type: 'single_choice';
      difficulty: 'easy' | 'medium' | 'hard';
      subject: string;
      topic?: string;
      marks: number;
      negativeMarks: number;
      explanation: string;
      explanationTranslations?: { hi?: string };
      tags: string[];
      options: Array<{
        content: string;
        translations?: { hi?: string };
        isCorrect: boolean;
      }>;
    }>;
  }> {
    const count = Math.min(Math.max(Number(input.count) || 5, 1), 20);
    const difficulty = input.difficulty || 'medium';
    const examContext = input.examName ? `Target Exam: ${input.examName}` : 'Target Exam: Indian Competitive Exams (UPSC, SSC CGL, RRB NTPC, State PSC)';
    const topicContext = input.topic ? `Topic / Chapter: ${input.topic}` : '';

    const systemPrompt = `You are a chief examination controller and academic psychometrician for Indian competitive government exams (UPSC CSE, SSC CGL, RRB NTPC, State PSCs, Banking).
Your job is to generate exactly ${count} original, high-quality, exam-standard Multiple Choice Questions (MCQs).

Guidelines:
1. Academic Rigor: Questions must be factually accurate, current with syllabus, unambiguous, and test conceptual clarity.
2. Structure:
   - Exactly 4 options per question (Option A, B, C, D).
   - EXACTLY 1 correct option (isCorrect: true) and 3 highly plausible distractors (isCorrect: false).
3. Bilingual Format:
   - "content": Standard, grammatically flawless English.
   - "translations": { "hi": "शुद्ध प्रामाणिक देवनागरी हिंदी में प्रश्न" }
   - "options": 4 options each with English "content" and Hindi "translations": { "hi": "हिंदी अनुवाद" }
   - "explanation": Comprehensive, pedagogical step-by-step solution in English explaining why the correct answer is true and why the other options are wrong.
   - "explanationTranslations": { "hi": "विस्तृत चरण-दर-चरण व्याख्या (देवनागरी लिपि में)" }
4. Difficulty Level: Strictly calibrate to "${difficulty}".
5. Subject: "${input.subject}". ${topicContext}. ${examContext}.
${input.additionalPrompt ? `Special instructions: ${input.additionalPrompt}` : ''}

Output Schema (Valid JSON ONLY, no extra text):
{
  "questions": [
    {
      "content": "English question text string",
      "translations": { "hi": "हिंदी प्रश्न टेक्स्ट" },
      "type": "single_choice",
      "difficulty": "${difficulty}",
      "subject": "${input.subject}",
      "topic": "${input.topic || 'General'}",
      "marks": 1,
      "negativeMarks": 0.25,
      "explanation": "Detailed English explanation...",
      "explanationTranslations": { "hi": "विस्तृत हिंदी व्याख्या..." },
      "tags": ["tag1", "tag2"],
      "options": [
        { "content": "Option 1 (English)", "translations": { "hi": "विकल्प 1" }, "isCorrect": true },
        { "content": "Option 2 (English)", "translations": { "hi": "विकल्प 2" }, "isCorrect": false },
        { "content": "Option 3 (English)", "translations": { "hi": "विकल्प 3" }, "isCorrect": false },
        { "content": "Option 4 (English)", "translations": { "hi": "विकल्प 4" }, "isCorrect": false }
      ]
    }
  ]
}`;

    const userPrompt = `Generate ${count} ${difficulty} level questions for Subject: "${input.subject}"${input.topic ? `, Topic: "${input.topic}"` : ''}${input.examName ? `, Exam: "${input.examName}"` : ''}. Return valid JSON only.`;

    const rawJson = await this.callGemini(systemPrompt, userPrompt);
    try {
      const cleaned = rawJson.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const list = Array.isArray(parsed.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

      const formatted = list.map((q: any) => ({
        content: String(q.content || '').trim(),
        translations: q.translations && typeof q.translations === 'object' ? q.translations : (q.contentHi ? { hi: q.contentHi } : undefined),
        type: 'single_choice' as const,
        difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : difficulty) as 'easy' | 'medium' | 'hard',
        subject: input.subject,
        topic: q.topic || input.topic || 'General',
        marks: Number(q.marks) || 1,
        negativeMarks: Number(q.negativeMarks) || 0.25,
        explanation: String(q.explanation || '').trim(),
        explanationTranslations: q.explanationTranslations && typeof q.explanationTranslations === 'object'
          ? q.explanationTranslations
          : (q.explanationHi ? { hi: q.explanationHi } : undefined),
        tags: Array.isArray(q.tags) ? q.tags.map(String) : [input.subject],
        options: Array.isArray(q.options)
          ? q.options.map((opt: any) => ({
              content: String(opt.content || '').trim(),
              translations: opt.translations && typeof opt.translations === 'object' ? opt.translations : (opt.contentHi ? { hi: opt.contentHi } : undefined),
              isCorrect: Boolean(opt.isCorrect),
            }))
          : [],
      }));

      return { questions: formatted };
    } catch (err) {
      this.logger.error('Failed to parse Gemini generated questions', err);
      throw new BadRequestException('Failed to process AI generated questions. Please retry.');
    }
  }

  /**
   * 1-Click Question Translation & Explanation Generator.
   * Translates an existing question & options to Devanagari Hindi and provides step-by-step solutions.
   */
  async translateAndExplainQuestion(input: {
    content: string;
    options: Array<{ content: string; isCorrect: boolean }>;
    explanation?: string;
    subject?: string;
    topic?: string;
  }): Promise<{
    contentHi: string;
    optionsHi: string[];
    explanation: string;
    explanationHi: string;
  }> {
    const systemPrompt = `You are an elite bilingual competitive exam tutor and translator.
Task:
1. Translate the English Question text into authentic, clear DEVANAGARI HINDI (देवनागरी लिपि).
2. Translate each of the provided options into Devanagari Hindi in the exact same index order.
3. If an explanation is already provided in English, polish it and translate it into Devanagari Hindi. If NO explanation is provided, author a comprehensive, educational step-by-step solution in English AND a matching Hindi explanation.

Return ONLY valid JSON matching this schema:
{
  "contentHi": "हिंदी में प्रश्न (देवनागरी)",
  "optionsHi": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],
  "explanation": "Clear step-by-step English solution explaining why the correct choice is right...",
  "explanationHi": "चरण-दर-चरण हिंदी व्याख्या..."
}`;

    const userPrompt = JSON.stringify({
      question: input.content,
      options: input.options,
      existingExplanation: input.explanation || '',
      subject: input.subject || 'General Studies',
      topic: input.topic || '',
    });

    const rawJson = await this.callGemini(systemPrompt, userPrompt);
    try {
      const cleaned = rawJson.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        contentHi: String(parsed.contentHi || '').trim(),
        optionsHi: Array.isArray(parsed.optionsHi) ? parsed.optionsHi.map(String) : [],
        explanation: String(parsed.explanation || input.explanation || '').trim(),
        explanationHi: String(parsed.explanationHi || '').trim(),
      };
    } catch (err) {
      this.logger.error('Failed to parse Gemini translate-explain response', err);
      throw new BadRequestException('Failed to generate question translation and explanation.');
    }
  }

  /**
   * AI Raw Exam Paper & Unstructured Text Parser.
   * Parses messy, copy-pasted exam papers, PYQ PDFs, or book snippets into structured questions.
   */
  async parseRawQuestions(input: {
    rawText: string;
    subject?: string;
    topic?: string;
    examName?: string;
  }): Promise<{
    questions: Array<{
      content: string;
      translations?: { hi?: string };
      type: 'single_choice';
      difficulty: 'easy' | 'medium' | 'hard';
      subject: string;
      topic?: string;
      marks: number;
      negativeMarks: number;
      explanation: string;
      explanationTranslations?: { hi?: string };
      tags: string[];
      options: Array<{
        content: string;
        translations?: { hi?: string };
        isCorrect: boolean;
      }>;
    }>;
  }> {
    const systemPrompt = `You are an AI document parser and exam data extraction specialist.
Extract all multiple-choice questions from the provided raw text (which may be copied from previous year exam papers, question banks, or study guides).

Requirements:
1. Detect each question statement, question number, and options (A, B, C, D / 1, 2, 3, 4).
2. Clean OCR noise, extraneous page numbers, headers, and footers.
3. Identify the correct answer key if mentioned in the text. If not explicitly stated, accurately deduce the correct answer.
4. If the text has only English or only Hindi, translate the missing counterpart so each question is bilingual (English content + Hindi in translations.hi, and English options with Hindi translations).
5. Extract or synthesize a helpful step-by-step explanation.

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "content": "English question text",
      "translations": { "hi": "हिंदी प्रश्न" },
      "type": "single_choice",
      "difficulty": "medium",
      "subject": "${input.subject || 'General Studies'}",
      "topic": "${input.topic || 'General'}",
      "marks": 1,
      "negativeMarks": 0.25,
      "explanation": "English explanation...",
      "explanationTranslations": { "hi": "हिंदी व्याख्या..." },
      "tags": ["exam", "pyq"],
      "options": [
        { "content": "Option text 1", "translations": { "hi": "विकल्प 1" }, "isCorrect": true },
        { "content": "Option text 2", "translations": { "hi": "विकल्प 2" }, "isCorrect": false },
        { "content": "Option text 3", "translations": { "hi": "विकल्प 3" }, "isCorrect": false },
        { "content": "Option text 4", "translations": { "hi": "विकल्प 4" }, "isCorrect": false }
      ]
    }
  ]
}`;

    const rawJson = await this.callGemini(systemPrompt, input.rawText.slice(0, 30000));
    try {
      const cleaned = rawJson.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const list = Array.isArray(parsed.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);

      const formatted = list.map((q: any) => ({
        content: String(q.content || '').trim(),
        translations: q.translations && typeof q.translations === 'object' ? q.translations : undefined,
        type: 'single_choice' as const,
        difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
        subject: input.subject || q.subject || 'General Studies',
        topic: q.topic || input.topic || 'General',
        marks: Number(q.marks) || 1,
        negativeMarks: Number(q.negativeMarks) || 0.25,
        explanation: String(q.explanation || '').trim(),
        explanationTranslations: q.explanationTranslations && typeof q.explanationTranslations === 'object'
          ? q.explanationTranslations
          : undefined,
        tags: Array.isArray(q.tags) && q.tags.length > 0 ? q.tags.map(String) : [input.subject || 'General Studies'],
        options: Array.isArray(q.options)
          ? q.options.map((opt: any) => ({
              content: String(opt.content || '').trim(),
              translations: opt.translations && typeof opt.translations === 'object' ? opt.translations : undefined,
              isCorrect: Boolean(opt.isCorrect),
            }))
          : [],
      }));

      return { questions: formatted };
    } catch (err) {
      this.logger.error('Failed to parse raw questions via Gemini', err);
      throw new BadRequestException('Failed to parse questions from raw text. Please check the input format.');
    }
  }

}


