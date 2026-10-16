import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly candidateModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.8-flash',
  ].filter(Boolean) as string[];

  private getApiKey(): string {
    const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new BadRequestException(
        'GEMINI_API_KEY is not configured in server environment. Please set GEMINI_API_KEY in apps/server/.env',
      );
    }
    return key;
  }

  private async callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    let lastError = '';

    for (const model of this.candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const body = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) return candidateText;
        }

        const errorText = await response.text();
        lastError = `Model ${model} returned (${response.status}): ${errorText.slice(0, 300)}`;
        this.logger.warn(`Gemini try failed with ${model}: ${lastError}. Trying next candidate if available...`);
      } catch (err: any) {
        lastError = `Network/fetch failed with ${model}: ${err.message}`;
      }
    }

    throw new BadRequestException(`Gemini API request failed: ${lastError}`);
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
- Generate a clean slugSuffix: "-hinglish" if translating to Hinglish, or "-english" if translating to English.

Output must be valid JSON matching this schema:
{
  "title": "translated title string",
  "description": "translated short excerpt string",
  "slugSuffix": "-hinglish" or "-english",
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
        slugSuffix: parsed.slugSuffix || (isTargetHinglish ? '-hinglish' : '-english'),
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
   * Generate complete bilingual blog (Hinglish + English) + SEO from a reference article.
   * Input can be raw text, Markdown, or HTML — Gemini normalises and rewrites fresh content.
   */
  async generateBilingualFromReference(input: {
    referenceContent: string;
    category?: string;
    additionalInstructions?: string;
  }): Promise<{
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
    seoScore: number;
    detectedCategory?: string;
  }> {
    const systemPrompt = `You are an elite bilingual content writer and SEO specialist for an Indian government exam portal (ExamPortal / GovtPariksha), strictly following the editorial format of top Indian education websites like BiharHelp.in and SarkariResult.com.

Your task: Read the REFERENCE article (notification PDF, syllabus, or competitor post) and REWRITE it as TWO complete, publication-ready, search-engine-dominating blog articles.

══════════════════════════════════════════════════════════════════════════════
1. HINDI / HINGLISH VERSION (DEVANAGARI + ENGLISH KEYWORDS — BiharHelp & SarkariResult Style)
══════════════════════════════════════════════════════════════════════════════
- SCRIPT: Write the text in natural, engaging DEVANAGARI HINDI (देवनागरी लिपि).
  NEVER write purely Romanized Hindi (do NOT write "Railway me sarkari naukri...").
  DO write like BiharHelp:
  "अगर आप भी रेलवे में सरकारी नौकरी की तैयारी कर रहे हैं और NTPC के नए पदों के लिए आवेदन करना चाहते हैं, तो आपके लिए एक बहुत अच्छी खबर है। Railway Recruitment Boards (RRBs) ने CEN No. 05/2026 के तहत Full Notification जारी कर दी है। इस भर्ती के तहत Graduate और Under-Graduate लेवल के कुल 11,558 पदों पर बहाली की जाएगी..."

- English Terms inside Hindi Text:
  Keep exam names, post names, organizations, stages, and official terms in ENGLISH letters:
  "Railway Recruitment Boards (RRBs)", "CEN No. 05/2026", "NTPC Graduate Level", "Under-Graduate Level", "Online Application", "Eligibility Criteria", "Age Limit", "Selection Process", "Admit Card", "Syllabus", "Answer Key", "Cut-off", "Direct Link", "Official Website", "Computer Based Test (CBT-1)".

- Mandatory Sections & GFM Markdown Tables for Hindi version:
  1. Title: Catchy bilingual title (e.g. "RRB NTPC New Vacancy 2026: 11,558 पदों पर नोटिफिकेशन जारी, जानें योग्यता, उम्र सीमा और आवेदन प्रक्रिया")
  2. Friendly intro paragraph in Hindi
  3. "जाने इस पोस्ट में क्या क्या है:" (Quick overview list)
  4. ## [Exam Name] : Overview (Must include Markdown Table)
     | Organization | Railway Recruitment Board (RRB) |
     | Post Name | Non-Technical Popular Categories (NTPC) |
     | Total Vacancies | 11,558 Posts |
     | Pay Level | Level 2, 3, 5 & 6 (7th CPC) |
     | Application Mode | Online |
     | Official Website | rrbapply.gov.in |
  5. ## [Exam Name] : Notification Details (विस्तृत जानकारी)
  6. ## Important Dates of [Exam Name] (Markdown Table: Event | Date)
  7. ## Post-Wise Vacancy Details (पदों का विवरण) (Markdown Table: Post Name | Pay Level | Total Vacancy)
  8. ## Application Fee (आवेदन शुल्क) (Markdown Table: Category | Fee)
  9. ## Eligibility Criteria (पात्रता एवं शैक्षणिक योग्यता) (Educational Qualification & Age Limit)
  10. ## Selection Process (चयन प्रक्रिया) (Numbered steps: CBT-1, CBT-2, Skill Test, DV, Medical)
  11. ## How to Apply Online? (ऑनलाइन आवेदन कैसे करें - Step-by-step Hindi guide)
  12. ## महत्वपूर्ण लिंक्स / Quick Links (Markdown Table with Direct Apply Link, Notification PDF, Official Website)
  13. ## FAQs – अक्सर पूछे जाने वाले सवाल (3-4 common student queries with answers)

══════════════════════════════════════════════════════════════════════════════
2. ENGLISH VERSION (Authoritative, Comprehensive, High-Intent SEO)
══════════════════════════════════════════════════════════════════════════════
- Written in clear, comprehensive, professional English.
- Complete GFM Markdown with:
  - Overview Table
  - Notification Summary
  - Important Dates Table
  - Vacancy Breakdown Table
  - Eligibility & Age Limit
  - Application Fee Table
  - Selection Process Stages
  - Step-by-step How to Apply Guide
  - Quick Links Table (Direct Link to Apply, Official Notification PDF, Official Website)
  - FAQs Section

══════════════════════════════════════════════════════════════════════════════
SEO METADATA FOR BOTH:
══════════════════════════════════════════════════════════════════════════════
- metaTitle: Under 60 chars, high-intent keywords (Year, Exam Name, Vacancy Count)
- metaDescription: Under 155 chars, clear call-to-action
- slug: clean, lowercase, hyphens only
- keywords: 5-8 target keywords array
- excerpt: 1-2 compelling summary sentences

Output ONLY valid JSON (no markdown fences, no extra text):
{
  "hinglish": {
    "title": "Bilingual Title in English & Hindi",
    "slug": "slug-name-hinglish",
    "excerpt": "Short excerpt in Hindi with English keywords",
    "content": "Full GFM markdown string with Devanagari text, English terms, and markdown tables",
    "metaTitle": "SEO title under 60 chars",
    "metaDescription": "SEO description under 155 chars",
    "keywords": ["keyword 1", "keyword 2"]
  },
  "english": {
    "title": "English Title",
    "slug": "slug-name-english",
    "excerpt": "Short excerpt in English",
    "content": "Full GFM markdown string in English with tables",
    "metaTitle": "SEO title under 60 chars",
    "metaDescription": "SEO description under 155 chars",
    "keywords": ["keyword 1", "keyword 2"]
  },
  "seoScore": 92,
  "detectedCategory": "notification"
}`;

    const userPrompt = JSON.stringify({
      referenceContent: input.referenceContent.slice(0, 20000),
      category: input.category || 'auto-detect',
      additionalInstructions: input.additionalInstructions || '',
    });

    const rawJson = await this.callGemini(systemPrompt, userPrompt);
    try {
      const cleaned = rawJson.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        hinglish: {
          title: parsed.hinglish?.title || 'Untitled Hinglish Article',
          slug: parsed.hinglish?.slug || 'hinglish-article',
          excerpt: parsed.hinglish?.excerpt || '',
          content: parsed.hinglish?.content || '',
          metaTitle: parsed.hinglish?.metaTitle || parsed.hinglish?.title || '',
          metaDescription: parsed.hinglish?.metaDescription || parsed.hinglish?.excerpt || '',
          keywords: Array.isArray(parsed.hinglish?.keywords) ? parsed.hinglish.keywords : [],
        },
        english: {
          title: parsed.english?.title || 'Untitled English Article',
          slug: parsed.english?.slug || 'english-article',
          excerpt: parsed.english?.excerpt || '',
          content: parsed.english?.content || '',
          metaTitle: parsed.english?.metaTitle || parsed.english?.title || '',
          metaDescription: parsed.english?.metaDescription || parsed.english?.excerpt || '',
          keywords: Array.isArray(parsed.english?.keywords) ? parsed.english.keywords : [],
        },
        seoScore: typeof parsed.seoScore === 'number' ? parsed.seoScore : 75,
        detectedCategory: parsed.detectedCategory || input.category,
      };
    } catch (err) {
      this.logger.error('Failed to parse Gemini generate-from-reference response', err);
      throw new BadRequestException('Failed to parse AI blog generation output. Please try again.');
    }
  }
}
