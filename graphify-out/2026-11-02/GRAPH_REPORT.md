# Graph Report - examresource  (2026-11-02)

## Corpus Check
- 403 files · ~494,613 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: (none) 9, .ttf 5, .woff2 3)

## Summary
- 3444 nodes · 7321 edges · 206 communities (147 shown, 59 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 375 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d7a6c68c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- editor.astro
- BlogService
- AuthService
- ExamService
- mongoose
- CommentsService
- .requireUser
- CurrentUser
- QuestionController
- durable-model.ts
- Layout.astro
- pymupdf
- zod
- pricing.astro
- article-lang.ts
- server/package.json
- blog.service.ts
- latest-updates.astro
- seed-test-series.mjs
- test-series.dto.ts
- [slug].astro
- package.json
- syncFindHighlights
- Post
- BookService
- admin/api.ts
- QuestionService
- astro
- ArticlesManager.tsx
- media.service.ts
- insertBlock
- notifications.ts
- dependencies
- LearnerAnalyticsService
- seed_aptitude_questions.ts
- AdminApp.tsx
- editor
- mongo-durable-object.ts
- LeftSidebar.astro
- dependencies
- adminSession.ts
- ink-orbit-features.tsx
- compilerOptions
- extract_bilingual.py
- lib/api.ts
- scripts
- contact.ts
- StateFilterWidget.astro
- generate_500_tests.ts
- postgres
- [id].astro
- TestSeriesDetail.tsx
- bookmarks.ts
- seed-dsssb-tgt-cs.ts
- question.dto.ts
- blogData.ts
- seed-dsssb-tgt-cs.ts
- ProfileHub.tsx
- json
- payment.service.ts
- sharp.ts
- CBTTestRunner.tsx
- test-series.service.ts
- seed_reasoning_questions.ts
- QuestionReportsManager.tsx
- handleEditorImagePaste
- editor-nodes.ts
- comments.service.ts
- 4. Individual tests
- blog-content.adapter.ts
- MediaService
- ArticlesManager.tsx
- TestAttemptsManager.tsx
- re
- site.ts
- devDependencies
- seed_questions.ts
- executeImageInsertion
- exam.schema.ts
- MongoDurableObject
- openSlashMenu
- astro.config.mjs
- DurableQuery
- GeminiService
- GovtPariksha Platform (ExamResource Monorepo)
- daily-quiz/index.astro
- ref_dotenv
- oxlint.json
- migrate-pg-to-mongo.mjs
- tsconfig.build.json
- scripts
- nest-cli.json
- generate_aptitude_reasoning_tests.ts
- test-series.ts
- client/tsconfig.json
- notification.store.ts
- AdSlot.astro
- Authentication & Session Security (AUTH.md)
- upload_to_r2.ts
- cloudflare-workers.d.ts
- ExamController
- blog/TableOfContents.astro
- examArticle.ts
- middleware.ts
- cloudflare-node.d.ts
- tsconfig.json
- Get
- blog.dto.ts
- build_mock_tests.ts
- sitemap.astro
- client/package.json
- payment.service.ts
- lib/api.ts
- exam.service.ts
- 1. Shell Components
- 2. Token Definitions
- AdPlaceholder.astro
- Breadcrumb.astro
- FAQSection.astro
- RelatedArticles.astro
- components/TableOfContents.astro
- [subject].astro
- [topic].astro
- hideArticlePreview
- GovtPariksha Master Design System
- migrate_pdf_apti_reasoning.ts
- 1. Font Families
- restructure_test_series.ts
- Blog & Article View (`/blogs`, `/[slug]`) Design Rules
- Blog Formatting & SEO Guidelines
- Dashboard & Admin Pages Design Rules
- test-series.service.spec.ts
- vercel.json
- lib/api.ts
- 🚀 Frontend Performance Architecture (`apps/client`)
- legacy_hindi.py
- Homepage (`/`) Design Rules
- re
- Test Series & CBT Interface Design Rules
- vite-tsconfig-paths
- AppService
- scanAndExtractImagesFromText
- DailyQuizService
- Design System — takeUforward-Inspired Dark Theme
- useAdminToast
- AuthPage.astro
- rank-predictor.astro
- html-sanitizer.ts
- repair_question_bank.py
- server/README.md
- re
- auth.service.ts
- GovtPariksha Test Series Seed Pack
- 2. Complete Question Bank
- gemini.service.ts
- .createIndividualTest
- question-quality.ts
- client/AGENTS.md
- .listPublishedTests
- AI Development Guidelines & System Architecture (AGENTS.md)
- .updateChapter
- serializer.ts
- Comments.astro
- @tiptap/core
- ssrf.validator.ts
- @tiptap/extension-table
- @tiptap/pm
- setupCommandSearch
- react-dom@^19.3.1
- blog.cache.spec.ts
- @tiptap/extension-table-cell@3.32.2
- .parseRawQuestionsAi
- .translateAndExplainAi
- 8. Pre-built Component Classes
- 2. Color Palette — Tailwind Classes
- 3. Typography — Tailwind Classes
- Design System
- Astro Starter Kit: Basics
- Cloudflare R2 image uploads
- English Language (`english-language`)
- General Awareness (`general-awareness`)
- Geography (`geography`)
- Indian Polity (`indian-polity`)
- Quantitative Aptitude (`quantitative-aptitude`)
- Reasoning (`reasoning`)
- Design System
- Design System
- prompt-to-seed-test-series-pack.md

## God Nodes (most connected - your core abstractions)
1. `CurrentUser` - 116 edges
2. `mongoose` - 65 edges
3. `TestSeriesService` - 62 edges
4. `AuthService` - 57 edges
5. `Post` - 54 edges
6. `BlogService` - 54 edges
7. `@nestjs/common` - 50 edges
8. `TestSeriesController` - 49 edges
9. `react` - 45 edges
10. `@nestjs/mongoose` - 40 edges

## Surprising Connections (you probably didn't know these)
- `Key Technical Characteristics` --references--> `MongoDurableObject`  [INFERRED]
  AGENTS.md → apps/server/src/core/database/mongo-durable-object.ts
- `🚀 Key Architectural & Performance Patterns` --references--> `MongoDurableObject`  [INFERRED]
  README.md → apps/server/src/core/database/mongo-durable-object.ts
- `Security Guardrails:` --references--> `POST()`  [INFERRED]
  docs/ARCHITECTURE.md → apps/client/src/pages/api/contact.ts
- `📡 API Endpoints` --references--> `POST()`  [INFERRED]
  docs/AUTH.md → apps/client/src/pages/api/contact.ts
- `2. Backend In-Memory Service Cache (`apps/server`)` --references--> `POST()`  [INFERRED]
  docs/PERFORMANCE.md → apps/client/src/pages/api/contact.ts

## Import Cycles
- None detected.

## Communities (206 total, 59 thin omitted)

### Community 0 - "editor.astro"
Cohesion: 0.01
Nodes (231): acceptedImageTypes, activeFocusKeywords, addFaqRowBtn, addKeywordBtn, addKeywordInput, aiRefApplyCompareBtn, aiRefBottomCountBadge, aiRefBtnLabel (+223 more)

### Community 1 - "BlogService"
Cohesion: 0.15
Nodes (5): syncImageBlocks(), BlogService, CreateBlockInput, CreateBlogInput, UpdateBlogInput

### Community 2 - "AuthService"
Cohesion: 0.05
Nodes (20): RateLimitRecord, SlidingWindowRateLimiter, AuthController, SessionRequest, makeService(), AuthService, email, forgotPasswordSchema (+12 more)

### Community 3 - "ExamService"
Cohesion: 0.16
Nodes (3): CurrentUser, ExamService, makeService()

### Community 4 - "mongoose"
Cohesion: 0.09
Nodes (15): Book, BookDocument, BookSchema, CreateBookInput, createBookSchema, UpdateBookInput, updateBookSchema, student (+7 more)

### Community 5 - "CommentsService"
Cohesion: 0.08
Nodes (10): initialize(), handleDelete(), handleEdit(), load(), onLanguageChange(), renderComments(), startReply(), updateCount() (+2 more)

### Community 7 - "CurrentUser"
Cohesion: 0.14
Nodes (3): CreateSubjectInput, UpdateQuestionMappingInput, TestSeriesService

### Community 9 - "durable-model.ts"
Cohesion: 0.21
Nodes (11): createDurableConnection(), createDurableModelProxy(), enableWorkerDatabaseProxy(), getMongoDOStub(), isWorkerDatabaseProxyEnabled(), mongoDONamespaceContext, runWithMongoDONamespace(), setMongoDOStub() (+3 more)

### Community 10 - "Layout.astro"
Cohesion: 0.08
Nodes (39): loadAnalysis(), API_URL, applyOptimisticAuth(), closeAllDropdowns(), closeDropdown(), closeMobileDrawer(), closeSearchModal(), domainDotIndex (+31 more)

### Community 11 - "pymupdf"
Cohesion: 0.13
Nodes (4): detect_chapter(), extract_all_images(), main(), parse_all_questions()

### Community 12 - "zod"
Cohesion: 0.12
Nodes (20): DailyQuiz, DailyQuizAttempt, DailyQuizAttemptDocument, DailyQuizAttemptSchema, DailyQuizBilingualText, DailyQuizBilingualTextSchema, DailyQuizDocument, DailyQuizOption (+12 more)

### Community 13 - "pricing.astro"
Cohesion: 0.17
Nodes (12): fallbackOffer, formatRupees(), loadPassOffer(), PassOffer, jsonLd, listPrice, price, save (+4 more)

### Community 14 - "article-lang.ts"
Cohesion: 0.06
Nodes (66): Props, rawLines, onArticleLangSwap(), persistLang(), Props, setupLangSwitchers(), softNavigate(), Props (+58 more)

### Community 15 - "server/package.json"
Cohesion: 0.07
Nodes (39): author, description, devDependencies, @nestjs/cli@12.0.11, @nestjs/mau@0.2.9, @nestjs/schematics@12.0.12, oxlint@1.90.0, prettier@3.9.10 (+31 more)

### Community 16 - "blog.service.ts"
Cohesion: 0.11
Nodes (27): SCHEMA_MAP, Blog, BlogBlock, BlogBlockDocument, BlogBlockSchema, BlogDocument, BlogRevision, BlogRevisionDocument (+19 more)

### Community 17 - "latest-updates.astro"
Cohesion: 0.07
Nodes (34): refreshListingCardsInPlace(), syncListingCardLinks(), AppLang, appLangToBlogLanguage(), articleHref(), BlogLanguage, blogLanguageToAppLang(), normalizeAppLang() (+26 more)

### Community 18 - "seed-test-series.mjs"
Cohesion: 0.15
Nodes (11): __dirname, __filename, nodeEnv, runSeed(), seedPack, seedPackPath, toDeterministicObjectId(), createSnapshot() (+3 more)

### Community 19 - "test-series.dto.ts"
Cohesion: 0.09
Nodes (30): AssignSubjectInput, assignSubjectSchema, CreateChapterInput, createChapterSchema, createIndividualTestSchema, CreateQuestionMappingInput, createQuestionMappingSchema, createSubjectSchema (+22 more)

### Community 20 - "[slug].astro"
Cohesion: 0.07
Nodes (25): Props, Props, filterAndSlice(), getCachedRecentPostsSync(), getRecentPosts(), ListingPost, memoryCache, alternateLanguage (+17 more)

### Community 21 - "package.json"
Cohesion: 0.07
Nodes (37): dependencies, jsonrepair@^3.15.0, devDependencies, concurrently@10.0.6, @dietrichgebert/ponytail@5.3.3, eslint@10.14.0, eslint-plugin-sonarjs@^4.2.2, prettier@^3.9.10 (+29 more)

### Community 22 - "syncFindHighlights"
Cohesion: 0.10
Nodes (30): collectDocMatches(), FindMatch, FindReplace, findReplaceKey, findStringMatches(), isWordChar(), mapTextOffset(), applyImageLayout() (+22 more)

### Community 25 - "admin/api.ts"
Cohesion: 0.11
Nodes (26): adminApi, AdminAttemptDetailAnswer, AdminAttemptDetailAnswerOption, AdminAttemptDetailQuestion, AdminAttemptSectionProgress, AdminChapter, AdminIndividualTest, AdminQuestion (+18 more)

### Community 26 - "QuestionService"
Cohesion: 0.14
Nodes (5): CreateQuestionsInput, GenerateQuestionsAiInput, UpdateReportStatusInput, QuestionService, makeService()

### Community 27 - "astro"
Cohesion: 0.11
Nodes (3): astro@7.4.5, prerender, astro

### Community 28 - "ArticlesManager.tsx"
Cohesion: 0.21
Nodes (11): Category, ArticlesManagerProps, AssignCategoriesModalProps, CategoriesManager(), CategoriesManagerProps, CategoryModal(), CategoryModalProps, slugify() (+3 more)

### Community 29 - "media.service.ts"
Cohesion: 0.13
Nodes (12): @aws-sdk/client-s3@3.1161.0, @nestjs/platform-express@12.3.2, sharp@^0.35.5, UploadedMediaFile, MediaModule, ANIMATED_PASSES, imageExtensions, MediaService (+4 more)

### Community 30 - "insertBlock"
Cohesion: 0.10
Nodes (26): apiFetch(), escapeHtmlSnippet(), generateBilingualFromReference(), insertBlock(), insertExamPattern(), insertMarkdownSnippet(), insertTableOfContentsBlock(), loadMediaLibrary() (+18 more)

### Community 31 - "notifications.ts"
Cohesion: 0.14
Nodes (26): Props, allCachedNotifications, AppNotification, buildCard(), currentItems, deduplicateClientNotifications(), fireUnreadToSystem(), getCurrentSelectedLang() (+18 more)

### Community 32 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, @aws-sdk/s3-request-presigner@3.1161.0, cookie-parser@^1.4.7, dotenv@18.0.9, google-auth-library@11.3.2, jsonrepair@^3.15.0, mongoose@9.11.4, @nestjs/common@12.3.2 (+15 more)

### Community 34 - "seed_aptitude_questions.ts"
Cohesion: 0.15
Nodes (13): chapCounts, ChapterCol, chapterIds, CHAPTERS, envFile, makeOptions(), q(), QCol (+5 more)

### Community 35 - "AdminApp.tsx"
Cohesion: 0.09
Nodes (22): AdminApp(), AdminAppContent(), checkAuth(), AdminAppProps, AdminTab, brandParts(), IconName, NavButton() (+14 more)

### Community 36 - "editor"
Cohesion: 0.15
Nodes (23): addSeoKeyword(), applyImportedMarkdown(), applyKeywordsAndTags(), deleteOutlineBlock(), duplicateOutlineBlock(), editor, fillAuthorSelect(), fillTags() (+15 more)

### Community 37 - "mongo-durable-object.ts"
Cohesion: 0.14
Nodes (24): Exam, ExamSchema, TestAttempt, TestAttemptSchema, QuestionSchema, Chapter, ChapterSchema, QuestionMapping (+16 more)

### Community 38 - "LeftSidebar.astro"
Cohesion: 0.11
Nodes (13): Props, [brandPrefix, ...brandRest], Props, [brandPrefix, ...brandRest], isDailyQuiz, isRankPredictor, isTestSeries, preferredAppLang (+5 more)

### Community 39 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @astrojs/node@11.1.9, dotenv@18.0.9, lenis@^1.3.27, react@^19.3.1, @tiptap/extension-character-count@3.32.2, @tiptap/extension-placeholder@3.32.2, @tiptap/extension-underline@3.32.2 (+18 more)

### Community 40 - "adminSession.ts"
Cohesion: 0.20
Nodes (18): formatWhen(), initials(), SessionPanel(), endSession(), signOutEverywhere(), signOutHere(), SessionPanelProps, DESK_PATH (+10 more)

### Community 41 - "ink-orbit-features.tsx"
Cohesion: 0.19
Nodes (20): Brackets(), chartPaths(), clamp(), CopyBlock(), D_FEATURES, FlowCard(), InkFeatureCopy, InkFeatures (+12 more)

### Community 42 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 43 - "extract_bilingual.py"
Cohesion: 0.15
Nodes (17): assess(), _blocks_from_stem(), _clean(), detect_chapter(), extract(), _is_code(), _join(), main() (+9 more)

### Community 44 - "lib/api.ts"
Cohesion: 0.20
Nodes (8): AnalysisData, ChapterStrength, FilterButton(), FilterKey, OptionReview, QuestionReviewItem, SectionStat, TestResultAnalysis()

### Community 45 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, deploy, format, lint, migrate:pg-to-mongo, seed:test-series, start (+12 more)

### Community 46 - "contact.ts"
Cohesion: 0.22
Nodes (8): 1. Astro 5 Server-Side Rendering (SSR), 2. Instant Bilingual Language Swapping Pattern, 🎨 Frontend Architecture (`apps/client`), 🏛️ High-Level System Architecture, 📁 Monorepo Workspace Structure, System Architecture (ARCHITECTURE.md), 🔮 Version 2 Architecture & Roadmap (`feat/textbook-v2`), Version 2 Core Initiatives:

### Community 47 - "StateFilterWidget.astro"
Cohesion: 0.11
Nodes (16): activeCatBadge, activeStateBadge, cards, categoriesList, categorySelect, filteredCount, livePosts, noResultsMsg (+8 more)

### Community 48 - "generate_500_tests.ts"
Cohesion: 0.13
Nodes (12): ChapterCol, chapterMap, envFile, ExamCol, PYQ_EXAMS, QCol, questionsByChapter, SeriesCol (+4 more)

### Community 49 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, name (+10 more)

### Community 50 - "[id].astro"
Cohesion: 0.15
Nodes (14): CacheEntry, fetchPublicJson(), inFlightRequests, isUsableStale(), memoryCache, initialFullTests, initialPyqTests, isPyqPaper() (+6 more)

### Community 51 - "TestSeriesDetail.tsx"
Cohesion: 0.11
Nodes (16): AssignedSubject, Chapter, isPyqTest(), LatestAttemptMeta, LearnerSeriesPrep, Props, PublishedTestItem, RealTestCard() (+8 more)

### Community 52 - "bookmarks.ts"
Cohesion: 0.23
Nodes (15): BookmarkedArticle, clearAllFavorites(), FavoriteArticle, getBookmarks, getFavorites(), isBookmarked, isFavorite(), removeFavorite() (+7 more)

### Community 53 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.07
Nodes (26): buckets, buf, CHAPTER_SLUG_MAP, __dirname, flushQuestion(), letterToIndex(), lines, MD_PATH (+18 more)

### Community 54 - "question.dto.ts"
Cohesion: 0.22
Nodes (12): baseQuestionSchema, createQuestionsSchema, generateQuestionsAiSchema, optionSchema, parseRawQuestionsAiSchema, questionSchema, ReportQuestionInput, reportQuestionSchema (+4 more)

### Community 55 - "blogData.ts"
Cohesion: 0.15
Nodes (12): difficultyColors, Props, Props, difficultyBadge, Props, ArticleSection, CodeSnippet, SubjectData (+4 more)

### Community 56 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.12
Nodes (15): 1. Frontend (`apps/client`), 2. Backend (`apps/server`), Option A: Instant Vercel Rollback (Frontend), Option B: Git Revert on `main`, Option C: Cloudflare Workers Rollback (Backend), 🔍 Post-Deployment Verification, 📋 Pre-Flight Checklist, Production Deployment Guide (DEPLOYMENT.md) (+7 more)

### Community 57 - "ProfileHub.tsx"
Cohesion: 0.15
Nodes (12): Attempt, AttemptAnswer, AttemptCard(), FilterPill(), LoadState, MetricBlock(), PassInfo, ProfileHub() (+4 more)

### Community 59 - "payment.service.ts"
Cohesion: 0.10
Nodes (7): PaymentController, PaymentService, student, addCalendarMonths(), paymentSignature(), signaturesMatch(), webhookSignature()

### Community 60 - "sharp.ts"
Cohesion: 0.17
Nodes (6): fitName(), formatName(), ResizeOptions, SharpMetadata, WebpOptions, WorkerSharpPipeline

### Community 61 - "CBTTestRunner.tsx"
Cohesion: 0.05
Nodes (66): BrandMark(), CBTCalculator(), evaluateExpression(), Fn, formatResult(), FUNCTIONS, Op, Props (+58 more)

### Community 62 - "test-series.service.ts"
Cohesion: 0.10
Nodes (23): ExamDocument, TestAttemptDocument, Question, QuestionDocument, QuestionOption, QuestionOptionSchema, ReportedQuestion, ReportedQuestionDocument (+15 more)

### Community 63 - "seed_reasoning_questions.ts"
Cohesion: 0.17
Nodes (12): chapCounts, chapterIds, CHAPTERS, envFile, makeOptions(), q(), QCol, RAW_QUESTIONS (+4 more)

### Community 64 - "QuestionReportsManager.tsx"
Cohesion: 0.17
Nodes (10): AdminQuestionReport, ErrorBoundaryProps, ErrorBoundaryState, formatFullDate(), formatRelativeTime(), QuestionReportsErrorBoundary, QuestionReportsManager(), QuestionReportsManagerContent() (+2 more)

### Community 65 - "handleEditorImagePaste"
Cohesion: 0.21
Nodes (14): fileFromDataUrl(), fileFromImageSource(), getImageFileDimensions(), handleEditorImageDrop(), handleEditorImagePaste(), imageFilesFromTransfer(), localImageSources(), normalizeImageFile() (+6 more)

### Community 66 - "editor-nodes.ts"
Cohesion: 0.15
Nodes (12): @tiptap/extension-image@3.32.2, @tiptap/extension-list@3.32.2, ArticleBulletList, ArticleImage, BulletStyle, bulletStyles, ImageAlignment, imageAlignments (+4 more)

### Community 67 - "comments.service.ts"
Cohesion: 0.08
Nodes (21): AppModule, createApplication(), env, EnvSchema, DatabaseModule, Comment, CommentDocument, CommentSchema (+13 more)

### Community 68 - "4. Individual tests"
Cohesion: 0.06
Nodes (31): 4. Individual tests, Arithmetic & Percentages Chapter Test 01, Bihar BPSC Prelims Full Mock Test 01, Bihar BPSC Prelims Full Mock Test 02, Bihar General Knowledge Practice Test 02, Bihar History & Culture Chapter Test 02, Constitution & Governance Chapter Test 01, General Intelligence & Reasoning Practice Test 02 (+23 more)

### Community 69 - "blog-content.adapter.ts"
Cohesion: 0.21
Nodes (18): sanitizeHtml(), BlockRecord, blocksToHtml(), cleanHtmlEntities(), escapeHtml(), findTargetInsertionIndex(), guessCodeLanguage(), htmlToBlocks() (+10 more)

### Community 71 - "ArticlesManager.tsx"
Cohesion: 0.33
Nodes (9): ArticlesManager(), AssignCategoriesModal(), articleCacheKey(), read(), readArticleCache(), readCategoryCache(), write(), writeArticleCache() (+1 more)

### Community 72 - "TestAttemptsManager.tsx"
Cohesion: 0.20
Nodes (7): AdminAttemptDetail, AdminAttemptListItem, ErrorBoundaryProps, ErrorBoundaryState, TestAttemptsErrorBoundary, TestAttemptsManager(), TestAttemptsManagerContent()

### Community 73 - "re"
Cohesion: 0.20
Nodes (8): PageLegacyFonts, build_blocks_for_question(), clean_english_stem(), extract_legacy_lines(), format_banker_table(), load_db_url(), main(), get_page_fonts()

### Community 74 - "site.ts"
Cohesion: 0.06
Nodes (35): Props, uniqueId, [brandPrefix, ...brandRest], liveUpdates, Props, contactEmail, examPortals, govPortals (+27 more)

### Community 75 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @astrojs/check@0.9.12, tailwindcss@^4.3.3, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/turndown@^5.0.6, typescript@7.0.2, typescript (+5 more)

### Community 76 - "seed_questions.ts"
Cohesion: 0.18
Nodes (9): CHAPTER_CONFIG, ChapterSchema, envFile, QuestionMappingSchema, QuestionOptionSchema, QuestionSchema, SubjectSchema, TestSeriesSchema (+1 more)

### Community 77 - "executeImageInsertion"
Cohesion: 0.22
Nodes (11): closeArticleImageModal(), evaluateAltKeywordHealth(), executeImageInsertion(), getArticleFocusKeywords(), refreshSidebarArticleImages(), selectedImageAlign(), selectedImageLayout(), selectedImageWidth() (+3 more)

### Community 78 - "exam.schema.ts"
Cohesion: 0.21
Nodes (13): AttemptAnswer, AttemptAnswerSchema, AttemptSectionProgress, AttemptSectionProgressSchema, ExamQuestionItem, ExamQuestionItemSchema, ExamSection, ExamSectionSchema (+5 more)

### Community 79 - "MongoDurableObject"
Cohesion: 0.24
Nodes (8): MongoDurableObject, sharp(), 1. Dual-Runtime Execution (Node.js & Cloudflare Workers), 2. Cloudflare Durable Object Database Proxy (`MONGO_DO`), 3. Media Pipeline: Direct-to-R2 Signed Uploads, ⚙️ Backend Architecture (`apps/server`), 🛠️ Cloudflare Worker Specifics, 🛠️ Cloudflare Worker Bundle & Cold-Start Optimization

### Community 80 - "openSlashMenu"
Cohesion: 0.28
Nodes (9): checkSlashCommand(), closeSlashMenu(), executeSlashItem(), openSlashMenu(), placeFloating(), positionInlineBlockMenu(), positionSlashMenu(), renderSlashHighlight() (+1 more)

### Community 81 - "astro.config.mjs"
Cohesion: 0.25
Nodes (7): isBuild, @astrojs/react@7.1.2, @astrojs/vercel@11.0.18, @tailwindcss/vite@^4.3.3, @astrojs/react, @astrojs/vercel, @tailwindcss/vite

### Community 82 - "DurableQuery"
Cohesion: 0.24
Nodes (3): DurableQuery, executeDatabaseOperation(), MongoDOQuery

### Community 84 - "GovtPariksha Platform (ExamResource Monorepo)"
Cohesion: 0.13
Nodes (14): 1. Installation, 2. Environment Configuration, 3. Run Development Servers, 📜 Available Scripts, GovtPariksha Platform (ExamResource Monorepo), 🚀 Key Architectural & Performance Patterns, 🛠️ Local Development, Prerequisites (+6 more)

### Community 85 - "daily-quiz/index.astro"
Cohesion: 0.16
Nodes (12): DailyQuizQuestion, DailyQuizRunner(), EvaluatedQuestion, Props, QuizDataPayload, QuizEvaluationResult, availableQuizzes, jsonLd (+4 more)

### Community 86 - "ref_dotenv"
Cohesion: 0.14
Nodes (11): targetSlugs, envFile, examCounts, topSources, aptitudeSubjects, envFile, reasoningSubjects, envFile (+3 more)

### Community 87 - "oxlint.json"
Cohesion: 0.29
Nodes (6): env, node, rules, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, $schema

### Community 88 - "migrate-pg-to-mongo.mjs"
Cohesion: 0.43
Nodes (6): pg@^8.23.1, date(), migrate(), now(), upsert(), pg

### Community 89 - "tsconfig.build.json"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 90 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, astro, build, dev, preview, start

### Community 91 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 92 - "generate_aptitude_reasoning_tests.ts"
Cohesion: 0.21
Nodes (11): buildSnapshots(), ChapterCol, envFile, ExamCol, generateTestsForSeries(), INSTRUCTIONS, QCol, seededShuffle() (+3 more)

### Community 93 - "test-series.ts"
Cohesion: 0.40
Nodes (4): featureShortcuts, heroStats, MockExamCard, mockTestSeriesData

### Community 94 - "client/tsconfig.json"
Cohesion: 0.40
Nodes (4): exclude, extends, include, astro/tsconfigs/strict

### Community 95 - "notification.store.ts"
Cohesion: 0.08
Nodes (25): Notification, NotificationDocument, NotificationRead, NotificationReadDocument, NotificationReadSchema, NotificationSchema, User, UserDocument (+17 more)

### Community 97 - "Authentication & Session Security (AUTH.md)"
Cohesion: 0.17
Nodes (11): ContactPayload, escapeHtml(), POST(), prerender, 🛡️ Authentication & Security Model, Security Guardrails:, 📡 API Endpoints, 🔐 Architecture Overview (+3 more)

### Community 98 - "upload_to_r2.ts"
Cohesion: 0.17
Nodes (11): client, env, envFile, finalFile, mapPath, publicBase, questions, questionsFile (+3 more)

### Community 107 - "blog.dto.ts"
Cohesion: 0.13
Nodes (15): blockTypes, blogLanguages, blogStatuses, createBlockSchema, createBlogSchema, CreateCategoryInput, createCategorySchema, CreateTagInput (+7 more)

### Community 108 - "build_mock_tests.ts"
Cohesion: 0.25
Nodes (8): envPath, ExamQuestionItemSchema, ExamSchema, main(), MOCK_TESTS, QuestionOptionSnapshotSchema, QuestionSnapshotSchema, shuffle()

### Community 109 - "sitemap.astro"
Cohesion: 0.17
Nodes (11): corePages, fallbackArticles, jsonLd, links, liveCategories, LivePost, livePosts, noResults (+3 more)

### Community 110 - "client/package.json"
Cohesion: 0.09
Nodes (21): @dicebear/core@^10.7.0, @dicebear/styles@^10.6.0, dompurify@^3.4.17, marked@18.1.2, @tiptap/extension-link@3.32.2, @tiptap/extension-table-header@3.32.2, @tiptap/extension-table-row@3.32.2, @tiptap/extension-youtube@3.32.2 (+13 more)

### Community 111 - "payment.service.ts"
Cohesion: 0.14
Nodes (12): PaymentOrder, PaymentOrderDocument, PaymentOrderSchema, TestSeriesPass, TestSeriesPassDocument, TestSeriesPassSchema, RazorpayOrder, QUIZ_TYPES (+4 more)

### Community 112 - "lib/api.ts"
Cohesion: 0.22
Nodes (12): CheckoutResult, loadCheckoutScript(), openTestSeriesCheckout(), RazorpayCheckout, RazorpaySuccess, readError(), Window, PassOffer (+4 more)

### Community 113 - "exam.service.ts"
Cohesion: 0.24
Nodes (10): escapeRegex(), CreateExamInput, createExamSchema, SaveAnswerInput, saveAnswerSchema, testQuestionSchema, UpdateExamInput, updateExamSchema (+2 more)

### Community 114 - "1. Shell Components"
Cohesion: 0.20
Nodes (9): 1. Shell Components, 2. Content & Stream Components, Editorial 3-Column Grid (`.editorial-stream-grid`), GovtPariksha Reusable Component Catalog, `Header.astro`, `LeftSidebar.astro`, Notice Row Card (`.update-row-card`), `ProfileDropdown.astro` (+1 more)

### Community 115 - "2. Token Definitions"
Cohesion: 0.22
Nodes (8): 1. Palette Architecture, 2. Token Definitions, 3. Best Practices, A. Surface & Canvas, B. Typography Colors, C. Accent & Interactive, D. Institutional Blue & Cyan (Logo / Badges), GovtPariksha Colors & Palettes

### Community 140 - "GovtPariksha Master Design System"
Cohesion: 0.22
Nodes (8): 1. Design Philosophy, 2. Token Architecture Overview, 3. Editorial Aliases, 4. Typography Hierarchy, 5. Layout & Breakpoints, 6. Prohibited Anti-Patterns, Core Principles, GovtPariksha Master Design System

### Community 141 - "migrate_pdf_apti_reasoning.ts"
Cohesion: 0.25
Nodes (7): aptChMap, aptSources, aptTopicToChapter, envFile, reasonChMap, reasonSources, reasonTopicToChapter

### Community 142 - "1. Font Families"
Cohesion: 0.29
Nodes (6): 1. Font Families, 1. `font-serif`: `EB Garamond`, 2. `font-sans`: `Inter` & `Geist`, 2. Typography Scale, 3. `font-hindi`: `Noto Sans Devanagari` & `Nirmala UI`, GovtPariksha Typography Guide

### Community 143 - "restructure_test_series.ts"
Cohesion: 0.09
Nodes (20): ChapterCol, chapterMap, chapterQuestionPools, ChapterSpec, DSSSB_SUBJECTS, envFile, ExamCol, examsToInsert (+12 more)

### Community 144 - "Blog & Article View (`/blogs`, `/[slug]`) Design Rules"
Cohesion: 0.50
Nodes (3): 1. Directory Page (`/blogs`), 2. Article Detail Page (`/[slug]`), Blog & Article View (`/blogs`, `/[slug]`) Design Rules

### Community 145 - "Blog Formatting & SEO Guidelines"
Cohesion: 0.14
Nodes (14): 10. Security and rendering rules for developers, 11. Example article template, 12. Pre-publish checklist, 13. Official documentation to consult, 1. Purpose and scope, 2. Recommended rendering strategy, 3. Standard article structure, 4. Formatting rules (+6 more)

### Community 146 - "Dashboard & Admin Pages Design Rules"
Cohesion: 0.50
Nodes (3): Dashboard & Admin Pages Design Rules, Guidelines, Scope

### Community 147 - "test-series.service.spec.ts"
Cohesion: 0.40
Nodes (4): admin, editor, makeService(), student

### Community 149 - "lib/api.ts"
Cohesion: 0.17
Nodes (10): ISSUE_REASONS, Props, CATEGORIES, StudentTestSeries, TestSeriesExplorer(), TestSeriesExplorerProps, API_URL, escapeXml() (+2 more)

### Community 150 - "🚀 Frontend Performance Architecture (`apps/client`)"
Cohesion: 0.14
Nodes (13): 1. Vercel Edge HTTP Caching, 1. Zero Render-Blocking Third-Party Scripts, 2. Backend In-Memory Service Cache (`apps/server`), 2. Font Loading Strategy, 3. Critical CSS & Design Tokens, 3. Resilient SSR Fetching & Timeout Guardrails, 4. Image Optimization Rules, 5. Instant Bilingual Language Swapping (Zero Latency) (+5 more)

### Community 151 - "legacy_hindi.py"
Cohesion: 0.12
Nodes (6): ensure_hin_traineddata(), find_tesseract(), font_buffer_with_unicode_cmap(), ocr_legacy_strings(), _ocr_plain(), _render_strings()

### Community 152 - "Homepage (`/`) Design Rules"
Cohesion: 0.50
Nodes (3): Constraints, Homepage (`/`) Design Rules, Structure

### Community 153 - "re"
Cohesion: 0.15
Nodes (9): assign_images(), build_continuous_stream(), deduplicate_questions(), detect_chapter(), extract_questions_v2(), main(), merge_with_v1_data(), parse_options() (+1 more)

### Community 158 - "scanAndExtractImagesFromText"
Cohesion: 0.50
Nodes (4): normalizeNotionImageUrl(), openAiReferenceModal(), scanAndExtractImagesFromText(), updateAiRefCounters()

### Community 159 - "DailyQuizService"
Cohesion: 0.16
Nodes (3): DailyQuizController, sanitizeCategory(), DailyQuizService

### Community 160 - "Design System — takeUforward-Inspired Dark Theme"
Cohesion: 0.17
Nodes (12): 10. Do's and Don'ts, 11. Blog Content Guidelines, 12. Responsive Breakpoints, 1. Tailwind CSS v4 Architecture, 4. Spacing — Tailwind Classes, 5. Border Radius — Tailwind Classes, 6. Shadows — Tailwind Classes, 7. Z-Index — Tailwind Classes (+4 more)

### Community 161 - "useAdminToast"
Cohesion: 0.17
Nodes (10): Toast, ToastContext, ToastContextType, ToastType, useAdminToast(), NotificationItem, NotificationsManager(), QuestionBankManager() (+2 more)

### Community 162 - "AuthPage.astro"
Cohesion: 0.22
Nodes (8): [brandPrefix, ...brandRest], Props, safeReturn, setupGoogleAuth(), safeDeskReturn(), AuthMode, AuthState, authStore

### Community 163 - "rank-predictor.astro"
Cohesion: 0.33
Nodes (5): CATEGORIES, EXAM_PRESETS, ExamConfig, RankPredictorIsland(), jsonLd

### Community 164 - "html-sanitizer.ts"
Cohesion: 0.24
Nodes (10): cleanAttributes(), DANGEROUS_ELEMENTS, decodeEntities(), isSafeUrl(), SAFE_ATTRIBUTES, SAFE_BLOCK_TAGS, SAFE_INLINE_TAGS, SAFE_LIST_TAGS (+2 more)

### Community 166 - "repair_question_bank.py"
Cohesion: 0.52
Nodes (5): fingerprint(), load_db_url(), main(), norm(), option_payload()

### Community 167 - "server/README.md"
Cohesion: 0.18
Nodes (10): Authentication backend, Compile and run the project, Deployment, License, Observability, Project setup, Resources, Run tests (+2 more)

### Community 168 - "re"
Cohesion: 0.17
Nodes (6): clean_text(), recover_pdf_4_options(), clean_opt_text(), recover_pdf_options(), extract_match_options(), get_surrounding_text()

### Community 169 - "auth.service.ts"
Cohesion: 0.13
Nodes (12): EmailVerificationToken, EmailVerificationTokenDocument, EmailVerificationTokenSchema, OauthState, OauthStateDocument, OauthStateSchema, PasswordResetToken, PasswordResetTokenDocument (+4 more)

### Community 170 - "GovtPariksha Test Series Seed Pack"
Cohesion: 0.18
Nodes (10): 1. Test Series and subject hierarchy, 3. Question mappings, 5. Important ingestion rules, Bihar BPSC Prelims (`bihar-bpsc-prelims`), GovtPariksha Test Series Seed Pack, IBPS PO Complete Series (`ibps-po-complete`), RRB NTPC Graduate Level (`rrb-ntpc-graduate`), Seed summary (+2 more)

### Community 171 - "2. Complete Question Bank"
Cohesion: 0.18
Nodes (11): 2. Complete Question Bank, bg-001, bg-002, bg-003, bg-004, Bihar General Knowledge (`bihar-general-knowledge`), hi-001, hi-002 (+3 more)

### Community 172 - "gemini.service.ts"
Cohesion: 0.29
Nodes (6): extractCandidateText(), isRecord(), SeoOptimizationInput, SeoOptimizationOutput, TranslateArticleInput, TranslatedArticleOutput

### Community 174 - "question-quality.ts"
Cohesion: 0.38
Nodes (5): assessQuestionQuality(), QualityInput, QualityResult, QualityStatus, textOf()

### Community 175 - "client/AGENTS.md"
Cohesion: 0.22
Nodes (6): Development, Documentation, ⚠️ MANDATORY: Read Before ANY Frontend Task, Development, Documentation, ⚠️ MANDATORY: Read Before ANY Frontend Task

### Community 177 - "AI Development Guidelines & System Architecture (AGENTS.md)"
Cohesion: 0.17
Nodes (11): AI Development Guidelines & System Architecture (AGENTS.md), Critical Performance Guardrails:, graphify, Key Technical Characteristics, 🚨 Non-Negotiable Core Rules, ⚡ Performance & PageSpeed (95+ Requirement), 🚢 Production Deployment Protocol, 🏛️ System Architecture Summary (+3 more)

### Community 179 - "serializer.ts"
Cohesion: 0.52
Nodes (4): deserializeInDO(), deserializeResultInWorker(), serializeForDO(), serializeResultFromDO()

### Community 180 - "Comments.astro"
Cohesion: 0.60
Nodes (4): addText(), createComment(), formatDate(), Props

### Community 185 - "setupCommandSearch"
Cohesion: 0.67
Nodes (3): setupCommandSearch(), executeFilter(), resetAll()

### Community 187 - "blog.cache.spec.ts"
Cohesion: 0.40
Nodes (4): @nestjs/testing@12.3.2, supertest@7.3.1, @nestjs/testing, supertest

### Community 217 - "8. Pre-built Component Classes"
Cohesion: 0.33
Nodes (6): 8. Pre-built Component Classes, Badges, Buttons, Cards, Inputs, Navigation

### Community 237 - "2. Color Palette — Tailwind Classes"
Cohesion: 0.40
Nodes (5): 2. Color Palette — Tailwind Classes, Core Colors, Light Theme Override, Semantic Colors, Surface Colors (Dark Theme)

### Community 238 - "3. Typography — Tailwind Classes"
Cohesion: 0.40
Nodes (5): 3. Typography — Tailwind Classes, Font Families, Font Sizes (auto-includes line-height), Font Weights (use Tailwind defaults), Letter Spacing

### Community 239 - "Design System"
Cohesion: 0.40
Nodes (4): Blog Content, Design System, Key Tokens, ⚠️ MANDATORY: Read Before ANY Frontend Task

### Community 240 - "Astro Starter Kit: Basics"
Cohesion: 0.40
Nodes (4): Astro Starter Kit: Basics, 🧞 Commands, 🚀 Project Structure, 👀 Want to learn more?

### Community 260 - "Cloudflare R2 image uploads"
Cohesion: 0.40
Nodes (4): 1. Create an R2 bucket and API token, 2. Configure R2 CORS, Cloudflare R2 image uploads, Security behavior

### Community 261 - "English Language (`english-language`)"
Cohesion: 0.40
Nodes (5): en-001, en-002, en-003, en-004, English Language (`english-language`)

### Community 262 - "General Awareness (`general-awareness`)"
Cohesion: 0.40
Nodes (5): ga-001, ga-002, ga-003, ga-004, General Awareness (`general-awareness`)

### Community 263 - "Geography (`geography`)"
Cohesion: 0.40
Nodes (5): geo-001, geo-002, geo-003, geo-004, Geography (`geography`)

### Community 264 - "Indian Polity (`indian-polity`)"
Cohesion: 0.40
Nodes (5): Indian Polity (`indian-polity`), ip-001, ip-002, ip-003, ip-004

### Community 265 - "Quantitative Aptitude (`quantitative-aptitude`)"
Cohesion: 0.40
Nodes (5): qa-001, qa-002, qa-003, qa-004, Quantitative Aptitude (`quantitative-aptitude`)

### Community 266 - "Reasoning (`reasoning`)"
Cohesion: 0.40
Nodes (5): Reasoning (`reasoning`), rs-001, rs-002, rs-003, rs-004

### Community 296 - "Design System"
Cohesion: 0.67
Nodes (3): Blog Content Rules, Design System, Key Design Principles

### Community 297 - "Design System"
Cohesion: 0.67
Nodes (3): Blog Content Rules, Design System, Key Design Principles

## Knowledge Gaps
- **2 isolated node(s):** `astro/tsconfigs/strict`, `./tsconfig.json`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1372 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `payment.service.ts` to `editor.astro`, `sitemap.astro`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `astro/tsconfigs/strict`, `./tsconfig.json` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `editor.astro` be split into smaller, more focused modules?**
  _Cohesion score 0.007662835249042145 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `mongoose` to `durable-model.ts`, `zod`, `migrate_pdf_apti_reasoning.ts`, `server/package.json`, `blog.service.ts`, `restructure_test_series.ts`, `seed-test-series.mjs`, `test-series.service.spec.ts`, `dependencies`, `seed_aptitude_questions.ts`, `mongo-durable-object.ts`, `auth.service.ts`, `generate_500_tests.ts`, `serializer.ts`, `seed-dsssb-tgt-cs.ts`, `payment.service.ts`, `test-series.service.ts`, `seed_reasoning_questions.ts`, `comments.service.ts`, `seed_questions.ts`, `exam.schema.ts`, `ref_dotenv`, `migrate-pg-to-mongo.mjs`, `generate_aptitude_reasoning_tests.ts`, `notification.store.ts`, `build_mock_tests.ts`, `payment.service.ts`, `exam.service.ts`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Should `AuthService` be split into smaller, more focused modules?**
  _Cohesion score 0.05111683848797251 - nodes in this community are weakly interconnected._
- **Why does `Post` connect `QuestionController` to `AuthService`, `ExamController`, `CommentsService`, `MediaService`, `ArticlesManager.tsx`, `.requireUser`, `Post`, `admin/api.ts`, `payment.service.ts`, `ArticlesManager.tsx`, `notification.store.ts`, `DailyQuizService`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `mongoose` be split into smaller, more focused modules?**
  _Cohesion score 0.08669354838709678 - nodes in this community are weakly interconnected._