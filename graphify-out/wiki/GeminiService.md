# GeminiService

> 20 nodes · cohesion 0.18

## Key Concepts

- **GeminiService** (24 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.callGemini()** (13 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.callAiModel()** (5 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.generateBilingualFromReference()** (4 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.generateImageMeta()** (3 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.generateQuestions()** (3 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.optimizeSeo()** (3 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.parseRawQuestions()** (3 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.translateAndExplainQuestion()** (3 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.translateArticle()** (3 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.translateMarkdownContent()** (3 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.trySingleModelAttempt()** (3 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.buildGeminiPayload()** (2 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.callDeepSeek()** (2 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.callOpenRouter()** (2 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.getApiKeys()** (2 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.getCandidateModels()** (2 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **parseRobustJson()** (2 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **.getLastUsedModel()** (1 connections) — `apps/server/src/modules/blog/gemini.service.ts`
- **Injectable** (1 connections)

## Relationships

- [BlogService](BlogService.md) (5 shared connections)
- [blog.service.ts](blog.service.ts.md) (3 shared connections)
- [gemini.service.ts](gemini.service.ts.md) (3 shared connections)
- [QuestionService](QuestionService.md) (3 shared connections)
- [question.service.ts](question.service.ts.md) (2 shared connections)

## Source Files

- `apps/server/src/modules/blog/gemini.service.ts`

## Audit Trail

- EXTRACTED: 42 (84%)
- INFERRED: 8 (16%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*