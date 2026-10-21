import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ChatCompletionService } from './chat-completion.service.js';
import { GeminiService } from './gemini.service.js';

@Injectable()
export class ArticleGenerationService {
  private readonly logger = new Logger(ArticleGenerationService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly chatCompletion: ChatCompletionService,
  ) {}

  /**
   * Generate complete bilingual blog (Hinglish + English) + SEO from a reference article.
   * Input can be raw text, Markdown, or HTML — Gemini normalises and rewrites fresh content.
   */
  async generateBilingualFromReference(
    input: {
      referenceContent: string;
      category?: string;
      additionalInstructions?: string;
      images?: Array<{
        url: string;
        base64?: string;
        mimeType?: string;
        altText?: string;
      }>;
      model?: string;
      provider?: string;
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
    seoScore: number;
    detectedCategory?: string;
    modelUsed: string;
  }> {
    const provider = input.provider ?? 'gemini';
    if (!['gemini', 'openrouter', 'groq'].includes(provider)) {
      throw new BadRequestException('Unsupported AI provider.');
    }
    onStage?.('INGEST', 'Validating reference content and uploaded images...');

    const validImages = (input.images || []).filter(
      (img) => img && (img.url || img.base64),
    );

    let imageInstructions = '';
    if (validImages.length > 0) {
      onStage?.(
        'VISION',
        `Analyzing ${validImages.length} attached image(s) with ${provider} vision...`,
      );
      const imageDescriptions = validImages
        .map((img, i) => {
          const hint = img.altText
            ? `(Author Alt/Keyword Hint: "${img.altText}")`
            : '';
          const urlOrRef = img.url || 'Reference Image';
          return `Image ${i + 1}: ${urlOrRef} ${hint}`.trim();
        })
        .join('\n');

      imageInstructions = `
══════════════════════════════════════════════════════════════════════════════
3. MULTIMODAL CONTEXTUAL IMAGE PLACEMENT & KEYWORD-RICH ALT TAGS (MANDATORY)
══════════════════════════════════════════════════════════════════════════════
The author provided ${validImages.length} image(s) for this article:
${imageDescriptions}

INSTRUCTIONS FOR IMAGES:
1. Inspect what each image represents (e.g. Exam Pattern, Syllabus Breakdown, Important Dates Table, Salary Structure, Official Notification snippet).
2. Intelligently place each image into BOTH the Hinglish and English versions at the exact point in the article flow where it provides the maximum clarity and visual engagement.
3. CRITICAL SEO REQUIREMENT: Create a rich, keyword-optimized alt tag that incorporates the author's hint and primary focus keyword/exam name (e.g. alt="SSC CGL 2026 Tier 1 Exam Pattern and Marking Scheme Chart"). Do NOT use generic alt tags like "image" or "chart".
4. Render each image inside the markdown/HTML content using this exact responsive structure:
<figure class="article-figure" data-align="center" data-layout="full"><img src="{EXACT_IMAGE_URL}" alt="{DESCRIPTIVE_ALT_WITH_FOCUS_KEYWORDS}" width="700" height="400" data-align="center" data-layout="full" class="article-media" /><figcaption class="text-xs text-center text-slate-500 mt-2">{Helpful Caption}</figcaption></figure>
5. Every provided image URL MUST be placed.
`;
    }

    const systemPrompt = `You are an elite bilingual content writer and SEO specialist for an Indian government exam portal, strictly following the editorial format of top Indian education websites like BiharHelp.in and SarkariResult.com.

Your task: Read the REFERENCE article (notification PDF, syllabus, or competitor post) and REWRITE it as TWO complete, publication-ready, search-engine-dominating blog articles.
${imageInstructions}
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
  3. ## जाने इस पोस्ट में क्या क्या है: (Table of contents / quick overview list)
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
- slug: clean, lowercase, hyphens only — use the SAME slug for both hinglish and english (they share one URL)
- keywords: 5-8 target keywords array
- excerpt: 1-2 compelling summary sentences

Output ONLY valid JSON (no markdown fences, no extra text):
{
  "hinglish": {
    "title": "Bilingual Title in English & Hindi",
    "slug": "slug-name",
    "excerpt": "Short excerpt in Hindi with English keywords",
    "content": "Full GFM markdown string with Devanagari text, English terms, and markdown tables",
    "metaTitle": "SEO title under 60 chars",
    "metaDescription": "SEO description under 155 chars",
    "keywords": ["keyword 1", "keyword 2"]
  },
  "english": {
    "title": "English Title",
    "slug": "slug-name",
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
      attachedImages: validImages.map((img, i) => ({
        index: i + 1,
        url: img.url,
      })),
    });

    onStage?.(
      'DRAFTING',
      'Generating bilingual articles & intelligent image placements...',
    );

    const imageParts = validImages.map((img) => ({
      mimeType: img.mimeType || 'image/jpeg',
      data: img.base64 || '',
      url: img.url,
    }));

    const requestedModel =
      input.model || (provider === 'gemini' ? 'gemini-3.8-flash' : undefined);
    const { text: rawJson, model: modelUsed } = await (
      provider === 'gemini'
        ? this.gemini.generateContent.bind(this.gemini)
        : this.chatCompletion.generateContent.bind(
            this.chatCompletion,
            provider as 'openrouter' | 'groq',
          )
    )(
      systemPrompt,
      userPrompt,
      imageParts,
      (switchingModel) => {
        onStage?.('MODEL_SWITCH', `Engaging model: ${switchingModel}...`);
      },
      requestedModel,
    );

    onStage?.(
      'FINALIZING',
      'Parsing structure and validating keyword density...',
    );

    try {
      const cleaned = rawJson
        .replace(/^```(?:json)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      return {
        hinglish: {
          title: parsed.hinglish?.title || 'Untitled Hinglish Article',
          slug: parsed.hinglish?.slug || parsed.english?.slug || 'article',
          excerpt: parsed.hinglish?.excerpt || '',
          content: parsed.hinglish?.content || '',
          metaTitle: parsed.hinglish?.metaTitle || parsed.hinglish?.title || '',
          metaDescription:
            parsed.hinglish?.metaDescription || parsed.hinglish?.excerpt || '',
          keywords: Array.isArray(parsed.hinglish?.keywords)
            ? parsed.hinglish.keywords
            : [],
        },
        english: {
          title: parsed.english?.title || 'Untitled English Article',
          slug: parsed.english?.slug || parsed.hinglish?.slug || 'article',
          excerpt: parsed.english?.excerpt || '',
          content: parsed.english?.content || '',
          metaTitle: parsed.english?.metaTitle || parsed.english?.title || '',
          metaDescription:
            parsed.english?.metaDescription || parsed.english?.excerpt || '',
          keywords: Array.isArray(parsed.english?.keywords)
            ? parsed.english.keywords
            : [],
        },
        seoScore: typeof parsed.seoScore === 'number' ? parsed.seoScore : 75,
        detectedCategory: parsed.detectedCategory || input.category,
        modelUsed,
      };
    } catch (err) {
      this.logger.error(
        'Failed to parse AI generate-from-reference response',
        err,
      );
      throw new BadRequestException(
        'Failed to parse AI blog generation output. Please try again.',
      );
    }
  }
}
