# Graph Report - examresource  (2026-11-07)

## Corpus Check
- 446 files · ~549,584 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: (none) 10, .ttf 5, .woff2 3)

## Summary
- 3873 nodes · 8128 edges · 206 communities (164 shown, 42 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 425 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0d7043f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- editor.astro
- BlogService
- AuthService
- ExamService
- feedback.service.ts
- CommentsService
- .requireUser
- CurrentUser
- blog.module.ts
- durable-model.ts
- Layout.astro
- pymupdf
- zod
- DurableQuery
- article-reading.ts
- devDependencies
- site.ts
- category/[category].astro
- seed-test-series.mjs
- test-series.dto.ts
- [slug].astro
- package.json
- syncFindHighlights
- Post
- BookService
- admin/api.ts
- article-lang.ts
- site.ts
- book.service.ts
- site.ts
- insertBlock
- notifications.ts
- dependencies
- LearnerAnalyticsService
- seed_aptitude_questions.ts
- AdminApp.tsx
- applyAiUpdateToEditor
- mongo-durable-object.ts
- Detailed Stage-by-Stage Implementation Log
- client/package.json
- adminSession.ts
- ink-orbit-features.tsx
- compilerOptions
- extract_bilingual.py
- mongoose
- scripts
- article-lang-swap.ts
- StateFilterWidget.astro
- generate_500_tests.ts
- postgres
- QuestionService
- lib/api.ts
- bookmarks.ts
- seed-dsssb-tgt-cs.ts
- notification.store.ts
- index.ts
- seed-dsssb-tgt-cs.ts
- ProfileHub.tsx
- pathlib
- ExamController
- sharp.ts
- @nestjs/common
- test-series.service.ts
- seed_reasoning_questions.ts
- QuestionReportsManager.tsx
- handleEditorImagePaste
- editor-nodes.ts
- DailyQuizService
- 4. Individual tests
- blog-content.adapter.ts
- MediaService
- react
- TestAttemptsManager.tsx
- re
- pricing.astro
- client/package.json
- seed_questions.ts
- GovtPariksha Performance Optimization: Final Verification & Regression Audit Report
- comments.service.ts
- blogData.ts
- openSlashMenu
- astro.config.mjs
- blog.query-opt.spec.ts
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
- contact.ts
- AdSlot.astro
- notification.store.ts
- upload_to_r2.ts
- cloudflare-workers.d.ts
- AppService
- blog/TableOfContents.astro
- examArticle.ts
- middleware.ts
- cloudflare-node.d.ts
- tsconfig.json
- Get
- 13. Exact File-Level Findings
- build_mock_tests.ts
- cbt.ts
- exam.service.ts
- test-series.service.spec.ts
- [id].astro
- GovtPariksha: Comprehensive Performance Optimization Report
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
- lib/api.ts
- GovtPariksha Platform: Complete Performance & Systems Audit Report
- vitest
- 🚀 Frontend Performance Architecture (`apps/client`)
- legacy_hindi.py
- Homepage (`/`) Design Rules
- re
- Test Series & CBT Interface Design Rules
- AdminLayout.astro
- 14. Prioritized Optimization Roadmap
- pymupdf
- media.service.ts
- Complete Verification & Test Evidence
- Design System — takeUforward-Inspired Dark Theme
- exam.schema.ts
- API_URL
- clean_dashes_db.ts
- PaymentService
- TestSeriesExplorer.tsx
- repair_question_bank.py
- server/README.md
- 13. Exact File-Level Findings
- Collections & Query Patterns
- GovtPariksha Test Series Seed Pack
- 2. Complete Question Bank
- sitemap.astro
- openTestSeriesCheckout.ts
- 10. Complete User-Journey Call Flows
- client/AGENTS.md
- System Architecture (ARCHITECTURE.md)
- AI Development Guidelines & System Architecture (AGENTS.md)
- worker.ts
- MongoDurableObject
- Stage 4: Fix Test Series Detail Page Payload Bloat (P0)
- Stage 7: Database Compound Indexes and Session Mutation Throttling (P1)
- rank-predictor.astro
- Stage 10: Test Attempt Document Optimization Strategy (P2)
- setupCommandSearch
- Stage 5: Remove Duplicate Article Language Content (P0)
- Stage 11: CSS Asset Extraction & CDN Caching (P1)
- @nestjs/mongoose
- @tiptap/extension-table
- @types/dompurify@^3.2.0
- 8. Pre-built Component Classes
- 2. Color Palette — Tailwind Classes
- 3. Typography — Tailwind Classes
- Design System
- Astro Starter Kit: Basics
- Cloudflare R2 image uploads
- AiSearchJob
- General Awareness (`general-awareness`)
- Geography (`geography`)
- Indian Polity (`indian-polity`)
- Quantitative Aptitude (`quantitative-aptitude`)
- Reasoning (`reasoning`)
- Design System
- Design System
- prompt-to-seed-test-series-pack.md

## God Nodes (most connected - your core abstractions)
1. `CurrentUser` - 119 edges
2. `mongoose` - 70 edges
3. `TestSeriesService` - 62 edges
4. `AuthService` - 59 edges
5. `Post` - 57 edges
6. `BlogService` - 56 edges
7. `@nestjs/common` - 53 edges
8. `react` - 50 edges
9. `TestSeriesController` - 49 edges
10. `@nestjs/mongoose` - 43 edges

## Surprising Connections (you probably didn't know these)
- `5. Stop Serializing 150 Tests into Test Series Detail HTML` --references--> `TestSeriesDetail()`  [INFERRED]
  docs/performance/performance-audit-report.md → apps/client/src/components/test-series/TestSeriesDetail.tsx
- `Fixes Implemented` --references--> `swapArticleLanguage()`  [INFERRED]
  docs/performance/performance-optimization-report.md → apps/client/src/lib/article-lang-swap.ts
- `Root Cause` --references--> `refreshNotifications()`  [INFERRED]
  docs/performance/performance-optimization-report.md → apps/client/src/lib/notifications.ts
- `Fixes Implemented` --references--> `fetchPublicJson()`  [INFERRED]
  docs/performance/performance-optimization-report.md → apps/client/src/lib/publicFetch.ts
- `Key Technical Characteristics` --references--> `MongoDurableObject`  [INFERRED]
  AGENTS.md → apps/server/src/core/database/mongo-durable-object.ts

## Import Cycles
- None detected.

## Communities (206 total, 42 thin omitted)

### Community 0 - "editor.astro"
Cohesion: 0.01
Nodes (278): acceptedImageTypes, activeFocusKeywords, addFaqRowBtn, addKeywordBtn, addKeywordInput, aiRefApplyCompareBtn, aiRefBottomCountBadge, aiRefBtnLabel (+270 more)

### Community 1 - "BlogService"
Cohesion: 0.15
Nodes (5): blocksToHtml(), htmlToBlocks(), syncImageBlocks(), BlogService, Request Lifecycle Trace: `GET /api/v1/blogs/:slug`

### Community 2 - "AuthService"
Cohesion: 0.05
Nodes (20): RateLimitRecord, SlidingWindowRateLimiter, AuthController, SessionRequest, makeService(), AuthService, email, forgotPasswordSchema (+12 more)

### Community 4 - "feedback.service.ts"
Cohesion: 0.08
Nodes (14): Feedback, FeedbackDocument, FeedbackSchema, FeedbackSource, feedbackSources, FeedbackStatus, feedbackStatuses, CreateFeedbackInput (+6 more)

### Community 5 - "CommentsService"
Cohesion: 0.08
Nodes (14): addText(), createComment(), formatDate(), initialize(), handleDelete(), handleEdit(), load(), onLanguageChange() (+6 more)

### Community 7 - "CurrentUser"
Cohesion: 0.11
Nodes (7): CurrentUser, CreateIndividualTestInput, CreateSubjectInput, ListIndividualTestsQueryInput, TestQuestionItemInput, MemoryCache, TestSeriesService

### Community 8 - "blog.module.ts"
Cohesion: 0.07
Nodes (44): Blog, BlogBlock, BlogBlockDocument, BlogBlockSchema, BlogRevision, BlogRevisionDocument, BlogRevisionSchema, BlogSchema (+36 more)

### Community 9 - "durable-model.ts"
Cohesion: 0.21
Nodes (10): createDurableConnection(), createDurableModelProxy(), getMongoDOStub(), isWorkerDatabaseProxyEnabled(), mongoDONamespaceContext, setMongoDOStub(), deserializeInDO(), deserializeResultInWorker() (+2 more)

### Community 10 - "Layout.astro"
Cohesion: 0.10
Nodes (39): applyOptimisticAuth(), closeAllDropdowns(), closeDropdown(), closeMobileDrawer(), closeSearchModal(), domainDotIndex, getDisplayedArticleLang(), handleGlobalClick() (+31 more)

### Community 11 - "pymupdf"
Cohesion: 0.18
Nodes (4): detect_chapter(), extract_all_images(), main(), parse_all_questions()

### Community 12 - "zod"
Cohesion: 0.09
Nodes (24): DailyQuiz, DailyQuizAttempt, DailyQuizAttemptDocument, DailyQuizAttemptSchema, DailyQuizBilingualText, DailyQuizBilingualTextSchema, DailyQuizDocument, DailyQuizOption (+16 more)

### Community 13 - "DurableQuery"
Cohesion: 0.24
Nodes (3): DurableQuery, executeDatabaseOperation(), MongoDOQuery

### Community 14 - "article-reading.ts"
Cohesion: 0.13
Nodes (26): Props, rawLines, Props, articleElement(), bindArticleReading(), bindCodeCopy(), bindFaqAccordion(), bindLightbox() (+18 more)

### Community 15 - "devDependencies"
Cohesion: 0.07
Nodes (40): author, description, devDependencies, @nestjs/cli@12.0.12, @nestjs/mau@0.2.9, @nestjs/schematics@12.0.13, oxlint@1.92.0, prettier@3.9.10 (+32 more)

### Community 16 - "site.ts"
Cohesion: 0.06
Nodes (37): [brandPrefix, ...brandRest], Props, safeReturn, setupGoogleAuth(), Props, uniqueId, [brandPrefix, ...brandRest], liveUpdates (+29 more)

### Community 17 - "category/[category].astro"
Cohesion: 0.07
Nodes (32): refreshListingCardsInPlace(), AppLang, appLangToBlogLanguage(), articleHref(), BlogLanguage, normalizeAppLang(), preferredLangFromCookieHeader(), resolveArticleLanguage() (+24 more)

### Community 18 - "seed-test-series.mjs"
Cohesion: 0.15
Nodes (11): __dirname, __filename, nodeEnv, runSeed(), seedPack, seedPackPath, toDeterministicObjectId(), createSnapshot() (+3 more)

### Community 19 - "test-series.dto.ts"
Cohesion: 0.09
Nodes (32): AssignSubjectInput, assignSubjectSchema, CreateChapterInput, createChapterSchema, createIndividualTestSchema, CreateQuestionMappingInput, createQuestionMappingSchema, createSubjectSchema (+24 more)

### Community 20 - "[slug].astro"
Cohesion: 0.06
Nodes (33): Props, Props, articleMemoryCache, CachedArticle, getStaleArticleFromCache(), saveArticleToCache(), blogLanguageToAppLang(), filterAndSlice() (+25 more)

### Community 21 - "package.json"
Cohesion: 0.07
Nodes (37): dependencies, jsonrepair@^3.15.0, devDependencies, concurrently@10.0.6, @dietrichgebert/ponytail@5.3.3, eslint@10.14.0, eslint-plugin-sonarjs@^4.2.2, prettier@^3.9.10 (+29 more)

### Community 22 - "syncFindHighlights"
Cohesion: 0.10
Nodes (30): collectDocMatches(), FindMatch, FindReplace, findReplaceKey, findStringMatches(), isWordChar(), mapTextOffset(), applyImageLayout() (+22 more)

### Community 24 - "BookService"
Cohesion: 0.14
Nodes (3): BookController, BookService, UpdateBookInput

### Community 25 - "admin/api.ts"
Cohesion: 0.09
Nodes (35): Toast, ToastContext, ToastContextType, ToastType, useAdminToast(), adminApi, AdminAttemptDetailAnswer, AdminAttemptDetailAnswerOption (+27 more)

### Community 26 - "article-lang.ts"
Cohesion: 0.15
Nodes (27): applyImageStyle(), buildLangVersion(), cleanPlainText(), closeOpenLists(), computeImageDimensions(), extractDetailsItems(), extractHeadingItems(), extractParagraphItems() (+19 more)

### Community 27 - "site.ts"
Cohesion: 0.09
Nodes (17): siteName, siteUrl, popularCategories, GET(), GET(), GET(), jsonLd, sections (+9 more)

### Community 28 - "book.service.ts"
Cohesion: 0.18
Nodes (8): Book, BookDocument, BookSchema, BookModule, CreateBookInput, createBookSchema, updateBookSchema, @nestjs/common

### Community 29 - "site.ts"
Cohesion: 0.11
Nodes (13): Props, [brandPrefix, ...brandRest], Props, [brandPrefix, ...brandRest], isDailyQuiz, isRankPredictor, isTestSeries, preferredAppLang (+5 more)

### Community 30 - "insertBlock"
Cohesion: 0.14
Nodes (17): escapeHtmlSnippet(), insertBlock(), insertExamPattern(), insertMarkdownSnippet(), insertTableOfContentsBlock(), loadMediaLibrary(), openArticleImageModal(), openCalloutModal() (+9 more)

### Community 31 - "notifications.ts"
Cohesion: 0.16
Nodes (25): allCachedNotifications, AppNotification, buildCard(), currentItems, deduplicateClientNotifications(), fireUnreadToSystem(), getCurrentSelectedLang(), getFiredIds() (+17 more)

### Community 32 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, cookie-parser@^1.4.7, google-auth-library@11.3.3, jsonrepair@^3.15.0, mongoose@9.12.0, @nestjs/common@12.4.0, @nestjs/core@12.4.0, @nestjs/mongoose@12.0.1 (+13 more)

### Community 33 - "LearnerAnalyticsService"
Cohesion: 0.14
Nodes (5): LearnerAnalyticsController, LearnerAnalyticsService, makeService(), studentA, studentB

### Community 34 - "seed_aptitude_questions.ts"
Cohesion: 0.15
Nodes (13): chapCounts, ChapterCol, chapterIds, CHAPTERS, envFile, makeOptions(), q(), QCol (+5 more)

### Community 35 - "AdminApp.tsx"
Cohesion: 0.10
Nodes (21): AdminApp(), AdminAppContent(), checkAuth(), AdminAppProps, AdminTab, brandParts(), IconName, NavButton() (+13 more)

### Community 36 - "applyAiUpdateToEditor"
Cohesion: 0.09
Nodes (45): addSeoKeyword(), apiFetch(), applyAiUpdateToEditor(), applyArticleContent(), applyImportedMarkdown(), applyKeywordsAndTags(), closeAiUpdaterModal(), deleteOutlineBlock() (+37 more)

### Community 37 - "mongo-durable-object.ts"
Cohesion: 0.24
Nodes (11): clsx@^2.1.1, tailwind-merge@^3.7.0, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (+3 more)

### Community 38 - "Detailed Stage-by-Stage Implementation Log"
Cohesion: 0.11
Nodes (19): Detailed Stage-by-Stage Implementation Log, Fixes Implemented, Fixes Implemented, Fixes Implemented, Fixes Implemented, Fixes Implemented, Fixes Implemented, Root Cause (+11 more)

### Community 39 - "client/package.json"
Cohesion: 0.06
Nodes (44): dependencies, astro@7.4.7, dompurify@^3.4.17, lenis@^1.3.27, lucide-react@1.70.0, marked@18.1.3, react@^19.3.1, react-dom@^19.3.1 (+36 more)

### Community 40 - "adminSession.ts"
Cohesion: 0.19
Nodes (19): formatWhen(), initials(), SessionPanel(), endSession(), signOutEverywhere(), signOutHere(), SessionPanelProps, DESK_PATH (+11 more)

### Community 41 - "ink-orbit-features.tsx"
Cohesion: 0.19
Nodes (20): Brackets(), chartPaths(), clamp(), CopyBlock(), D_FEATURES, FlowCard(), InkFeatureCopy, InkFeatures (+12 more)

### Community 42 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 43 - "extract_bilingual.py"
Cohesion: 0.15
Nodes (17): assess(), _blocks_from_stem(), _clean(), detect_chapter(), extract(), _is_code(), _join(), main() (+9 more)

### Community 44 - "mongoose"
Cohesion: 0.12
Nodes (12): EmailVerificationToken, EmailVerificationTokenDocument, OauthState, OauthStateDocument, PasswordResetToken, PasswordResetTokenDocument, Session, SessionDocument (+4 more)

### Community 45 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, deploy, format, lint, migrate:pg-to-mongo, seed:test-series, start (+12 more)

### Community 46 - "article-lang-swap.ts"
Cohesion: 0.15
Nodes (18): onArticleLangSwap(), persistLang(), Props, setupLangSwitchers(), softNavigate(), ArticleLangBundle, ArticleLangVersion, applyVersionMetadata() (+10 more)

### Community 47 - "StateFilterWidget.astro"
Cohesion: 0.11
Nodes (16): activeCatBadge, activeStateBadge, cards, categoriesList, categorySelect, filteredCount, livePosts, noResultsMsg (+8 more)

### Community 48 - "generate_500_tests.ts"
Cohesion: 0.13
Nodes (12): ChapterCol, chapterMap, envFile, ExamCol, PYQ_EXAMS, QCol, questionsByChapter, SeriesCol (+4 more)

### Community 49 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, name (+10 more)

### Community 50 - "QuestionService"
Cohesion: 0.06
Nodes (26): baseQuestionSchema, CreateQuestionsInput, createQuestionsSchema, GenerateQuestionsAiInput, generateQuestionsAiSchema, optionSchema, ParseRawQuestionsAiInput, parseRawQuestionsAiSchema (+18 more)

### Community 51 - "lib/api.ts"
Cohesion: 0.10
Nodes (25): loadAnalysis(), AssignedSubject, Chapter, cleanDisplayTitle(), extractTestNumber(), handleTestNavigate(), isPyqTest(), LatestAttemptMeta (+17 more)

### Community 52 - "bookmarks.ts"
Cohesion: 0.17
Nodes (17): Props, BookmarkedArticle, clearAllBookmarks, clearAllFavorites(), FavoriteArticle, getBookmarks, getFavorites(), isBookmarked (+9 more)

### Community 53 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.07
Nodes (26): buckets, buf, CHAPTER_SLUG_MAP, __dirname, flushQuestion(), letterToIndex(), lines, MD_PATH (+18 more)

### Community 54 - "notification.store.ts"
Cohesion: 0.14
Nodes (19): Notification, NotificationDocument, NotificationRead, NotificationReadDocument, NotificationReadSchema, NotificationSchema, NotificationModule, createBlogPublishedNotification() (+11 more)

### Community 55 - "index.ts"
Cohesion: 0.17
Nodes (23): SCHEMA_MAP, EmailVerificationTokenSchema, OauthStateSchema, PasswordResetTokenSchema, ExamSchema, TestAttemptSchema, QuestionSchema, ReportedQuestionSchema (+15 more)

### Community 56 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.12
Nodes (15): 1. Frontend (`apps/client`), 2. Backend (`apps/server`), Option A: Instant Vercel Rollback (Frontend), Option B: Git Revert on `main`, Option C: Cloudflare Workers Rollback (Backend), 🔍 Post-Deployment Verification, 📋 Pre-Flight Checklist, Production Deployment Guide (DEPLOYMENT.md) (+7 more)

### Community 57 - "ProfileHub.tsx"
Cohesion: 0.15
Nodes (12): Attempt, AttemptAnswer, AttemptCard(), FilterPill(), LoadState, MetricBlock(), PassInfo, ProfileHub() (+4 more)

### Community 60 - "sharp.ts"
Cohesion: 0.17
Nodes (6): fitName(), formatName(), ResizeOptions, SharpMetadata, WebpOptions, WorkerSharpPipeline

### Community 61 - "@nestjs/common"
Cohesion: 0.08
Nodes (20): ChapterCol, ChapterDef, envFile, ExamCol, examsToInsert, FULL_MOCK_SPECS, LR_CHAPTER_DEFS, lrChapterIdMap (+12 more)

### Community 62 - "test-series.service.ts"
Cohesion: 0.15
Nodes (16): ExamDocument, TestAttemptDocument, Question, QuestionDocument, QuestionOption, QuestionOptionSchema, ReportedQuestion, ReportedQuestionDocument (+8 more)

### Community 63 - "seed_reasoning_questions.ts"
Cohesion: 0.17
Nodes (12): chapCounts, chapterIds, CHAPTERS, envFile, makeOptions(), q(), QCol, RAW_QUESTIONS (+4 more)

### Community 64 - "QuestionReportsManager.tsx"
Cohesion: 0.17
Nodes (10): AdminQuestionReport, ErrorBoundaryProps, ErrorBoundaryState, formatFullDate(), formatRelativeTime(), QuestionReportsErrorBoundary, QuestionReportsManager(), QuestionReportsManagerContent() (+2 more)

### Community 65 - "handleEditorImagePaste"
Cohesion: 0.10
Nodes (27): closeArticleImageModal(), executeImageInsertion(), fileFromDataUrl(), fileFromImageSource(), getImageFileDimensions(), handleEditorImageDrop(), handleEditorImagePaste(), imageFilesFromTransfer() (+19 more)

### Community 66 - "editor-nodes.ts"
Cohesion: 0.15
Nodes (12): @tiptap/extension-image@3.33.0, @tiptap/extension-list@3.33.0, ArticleBulletList, ArticleImage, BulletStyle, bulletStyles, ImageAlignment, imageAlignments (+4 more)

### Community 67 - "DailyQuizService"
Cohesion: 0.15
Nodes (3): DailyQuizController, sanitizeCategory(), DailyQuizService

### Community 68 - "4. Individual tests"
Cohesion: 0.06
Nodes (31): 4. Individual tests, Arithmetic & Percentages Chapter Test 01, Bihar BPSC Prelims Full Mock Test 01, Bihar BPSC Prelims Full Mock Test 02, Bihar General Knowledge Practice Test 02, Bihar History & Culture Chapter Test 02, Constitution & Governance Chapter Test 01, General Intelligence & Reasoning Practice Test 02 (+23 more)

### Community 69 - "blog-content.adapter.ts"
Cohesion: 0.13
Nodes (26): cleanAttributes(), DANGEROUS_ELEMENTS, decodeEntities(), isSafeUrl(), SAFE_ATTRIBUTES, SAFE_BLOCK_TAGS, SAFE_INLINE_TAGS, SAFE_LIST_TAGS (+18 more)

### Community 70 - "MediaService"
Cohesion: 0.13
Nodes (4): MediaController, UploadedMediaFile, MediaModule, MediaService

### Community 71 - "react"
Cohesion: 0.14
Nodes (20): Category, ArticlesManager(), ArticlesManagerProps, AssignCategoriesModal(), AssignCategoriesModalProps, CategoriesManager(), CategoriesManagerProps, CategoryModal() (+12 more)

### Community 72 - "TestAttemptsManager.tsx"
Cohesion: 0.20
Nodes (7): AdminAttemptDetail, AdminAttemptListItem, ErrorBoundaryProps, ErrorBoundaryState, TestAttemptsErrorBoundary, TestAttemptsManager(), TestAttemptsManagerContent()

### Community 73 - "re"
Cohesion: 0.16
Nodes (8): PageLegacyFonts, build_blocks_for_question(), clean_english_stem(), extract_legacy_lines(), format_banker_table(), load_db_url(), main(), get_page_fonts()

### Community 74 - "pricing.astro"
Cohesion: 0.09
Nodes (30): SlideConfig, SLIDES, TestSeriesBannerCarousel(), passDiscount, passListPrice, passMonthlyApprox, passPrice, passValidity (+22 more)

### Community 75 - "client/package.json"
Cohesion: 0.13
Nodes (15): devDependencies, @astrojs/check@0.9.12, tailwindcss@4.3.5, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/turndown@^5.0.6, typescript@6, wrangler@4.158.0 (+7 more)

### Community 76 - "seed_questions.ts"
Cohesion: 0.18
Nodes (9): CHAPTER_CONFIG, ChapterSchema, envFile, QuestionMappingSchema, QuestionOptionSchema, QuestionSchema, SubjectSchema, TestSeriesSchema (+1 more)

### Community 77 - "GovtPariksha Performance Optimization: Final Verification & Regression Audit Report"
Cohesion: 0.07
Nodes (28): 10. Test Series & Test Attempt Compatibility, 12. Cloudflare Edge Caching Verification, 13. Complete Seven-Journey Benchmark, 14. Before vs After Performance Comparison, 15. Tests Executed & Exact Outcomes, 16. Remaining Issues & Risks, 17. Production Deployment Blockers, 18. Final Readiness Classification (+20 more)

### Community 78 - "comments.service.ts"
Cohesion: 0.06
Nodes (24): AppModule, createApplication(), env, EnvSchema, DatabaseModule, BlogDocument, Comment, CommentDocument (+16 more)

### Community 79 - "blogData.ts"
Cohesion: 0.15
Nodes (12): difficultyColors, Props, Props, difficultyBadge, Props, ArticleSection, CodeSnippet, SubjectData (+4 more)

### Community 80 - "openSlashMenu"
Cohesion: 0.28
Nodes (9): checkSlashCommand(), closeSlashMenu(), executeSlashItem(), openSlashMenu(), placeFloating(), positionInlineBlockMenu(), positionSlashMenu(), renderSlashHighlight() (+1 more)

### Community 81 - "astro.config.mjs"
Cohesion: 0.25
Nodes (7): isBuild, @astrojs/cloudflare@14.4.6, @astrojs/react@7.1.4, @tailwindcss/vite@4.3.5, @astrojs/cloudflare, @astrojs/react, @tailwindcss/vite

### Community 83 - "GeminiService"
Cohesion: 0.11
Nodes (11): AiUpdateArticleInput, AiUpdateArticleOutput, extractCandidateText(), extractReferenceExplicitMetadata(), GeminiService, isRecord(), parseRobustJson(), SeoOptimizationInput (+3 more)

### Community 84 - "GovtPariksha Platform (ExamResource Monorepo)"
Cohesion: 0.13
Nodes (14): 1. Installation, 2. Environment Configuration, 3. Run Development Servers, 📜 Available Scripts, GovtPariksha Platform (ExamResource Monorepo), 🚀 Key Architectural & Performance Patterns, 🛠️ Local Development, Prerequisites (+6 more)

### Community 85 - "daily-quiz/index.astro"
Cohesion: 0.16
Nodes (12): DailyQuizQuestion, DailyQuizRunner(), EvaluatedQuestion, Props, QuizDataPayload, QuizEvaluationResult, availableQuizzes, jsonLd (+4 more)

### Community 86 - "ref_dotenv"
Cohesion: 0.13
Nodes (13): dotenv@18.0.9, targetSlugs, envFile, examCounts, topSources, aptitudeSubjects, envFile, reasoningSubjects (+5 more)

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
Cohesion: 0.25
Nodes (8): scripts, astro, build, deploy, deploy:dry-run, dev, preview, start

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
Cohesion: 0.25
Nodes (7): compilerOptions, baseUrl, paths, exclude, extends, include, astro/tsconfigs/strict

### Community 95 - "contact.ts"
Cohesion: 0.17
Nodes (11): ContactPayload, escapeHtml(), POST(), prerender, 🛡️ Authentication & Security Model, Security Guardrails:, 📡 API Endpoints, 🔐 Architecture Overview (+3 more)

### Community 97 - "notification.store.ts"
Cohesion: 0.17
Nodes (3): NotificationController, NotificationService, listRecentNotifications()

### Community 98 - "upload_to_r2.ts"
Cohesion: 0.17
Nodes (11): client, env, envFile, finalFile, mapPath, publicBase, questions, questionsFile (+3 more)

### Community 100 - "AppService"
Cohesion: 0.23
Nodes (4): @nestjs/testing@12.4.0, AppController, AppService, @nestjs/testing

### Community 106 - "Get"
Cohesion: 0.15
Nodes (4): escapeRegex(), MemoryCache, 5. Backend API Latency & Lifecycle Audit, API Latency Classification

### Community 107 - "13. Exact File-Level Findings"
Cohesion: 0.20
Nodes (10): optimizeBlogHtmlImages(), 11. Ten Biggest Bottlenecks (Ranked by Impact), 1. Cloudflare CDN HTML Bypass, 2. `apps/client/src/pages/[slug].astro`, 2. Dual Language Duplication in SSR Payloads, 3. Astro `getImage()` Invocation during SSR, 7. Caching and CDN Audit, Fixes Implemented (+2 more)

### Community 108 - "build_mock_tests.ts"
Cohesion: 0.25
Nodes (8): envPath, ExamQuestionItemSchema, ExamSchema, main(), MOCK_TESTS, QuestionOptionSnapshotSchema, QuestionSnapshotSchema, shuffle()

### Community 109 - "cbt.ts"
Cohesion: 0.05
Nodes (63): CBTCalculator(), evaluateExpression(), Fn, formatResult(), FUNCTIONS, Op, Props, Tok (+55 more)

### Community 110 - "exam.service.ts"
Cohesion: 0.20
Nodes (11): escapeRegex(), CreateExamInput, createExamSchema, SaveAnswerInput, saveAnswerSchema, testQuestionSchema, UpdateExamInput, updateExamSchema (+3 more)

### Community 111 - "test-series.service.spec.ts"
Cohesion: 0.40
Nodes (4): admin, editor, makeService(), student

### Community 112 - "[id].astro"
Cohesion: 0.14
Nodes (15): CacheEntry, fetchPublicJson(), inFlightRequests, isUsableStale(), memoryCache, initialFullTests, initialPyqTests, isPyqPaper() (+7 more)

### Community 113 - "GovtPariksha: Comprehensive Performance Optimization Report"
Cohesion: 0.18
Nodes (10): Cloudflare CDN Cache Rulebook & Operational Guide, Executive Summary, Full Request Lifecycle & Architecture, GovtPariksha: Comprehensive Performance Optimization Report, Key Accomplishments & Results, Performance Comparison: Before vs After, Rule 1: Bypass Edge Cache for Dynamic & Authenticated Traffic (Priority 1), Rule 2: Cache Public Editorial HTML at the Edge (Priority 2) (+2 more)

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

### Community 147 - "lib/api.ts"
Cohesion: 0.13
Nodes (18): BrandMark(), FOOTER_CATEGORIES, FooterFeedback(), Props, SectionRule, TestInstructions(), TestInstructionsData, PassOffer (+10 more)

### Community 148 - "GovtPariksha Platform: Complete Performance & Systems Audit Report"
Cohesion: 0.11
Nodes (18): 15. Risks and Dependencies, 16. Missing Metrics or Unavailable Evidence, 17. Recommended First Optimization Step, 1. Executive Summary, 2. Verified Project Architecture, 3. Frontend Performance Findings, 4. API Request Inventory & Network Waterfall, 8. Local vs Production Comparison (+10 more)

### Community 149 - "vitest"
Cohesion: 0.24
Nodes (6): vite-tsconfig-paths@6.1.1, vitest@5.1.0, calculateRankPrediction(), normCdf(), vite-tsconfig-paths, vitest

### Community 150 - "🚀 Frontend Performance Architecture (`apps/client`)"
Cohesion: 0.14
Nodes (13): 1. Vercel Edge HTTP Caching, 1. Zero Render-Blocking Third-Party Scripts, 2. Backend In-Memory Service Cache (`apps/server`), 2. Font Loading Strategy, 3. Critical CSS & Design Tokens, 3. Resilient SSR Fetching & Timeout Guardrails, 4. Image Optimization Rules, 5. Instant Bilingual Language Swapping (Zero Latency) (+5 more)

### Community 151 - "legacy_hindi.py"
Cohesion: 0.15
Nodes (6): ensure_hin_traineddata(), find_tesseract(), font_buffer_with_unicode_cmap(), ocr_legacy_strings(), _ocr_plain(), _render_strings()

### Community 152 - "Homepage (`/`) Design Rules"
Cohesion: 0.50
Nodes (3): Constraints, Homepage (`/`) Design Rules, Structure

### Community 153 - "re"
Cohesion: 0.10
Nodes (9): assign_images(), build_continuous_stream(), deduplicate_questions(), detect_chapter(), extract_questions_v2(), main(), merge_with_v1_data(), parse_options() (+1 more)

### Community 155 - "AdminLayout.astro"
Cohesion: 0.15
Nodes (5): backdrop, closeBtn, mobileBtn, Props, sidebar

### Community 156 - "14. Prioritized Optimization Roadmap"
Cohesion: 0.13
Nodes (15): 10. Optimize `global.css` and External Scripts, 14. Prioritized Optimization Roadmap, 1. Fix `PUBLIC_API_URL` & Cloudflare API Route Mapping, 2. Increase Fetch Timeout & Add Stale Fallback in `[slug].astro`, 3. Enable Cloudflare Edge Caching for HTML, 4. Increase Mongo Durable Object Pool Size, 5. Stop Serializing 150 Tests into Test Series Detail HTML, 6. Eliminate Triple HTML Duplication in Articles (+7 more)

### Community 157 - "pymupdf"
Cohesion: 0.07
Nodes (6): clean_text(), recover_pdf_4_options(), clean_opt_text(), recover_pdf_options(), extract_match_options(), get_surrounding_text()

### Community 158 - "media.service.ts"
Cohesion: 0.17
Nodes (11): @aws-sdk/client-s3@3.1164.0, @aws-sdk/s3-request-presigner@3.1164.0, sharp@^0.35.5, assertSafeRemoteUrl(), isPrivateOrReservedIp(), ANIMATED_PASSES, imageExtensions, STATIC_PASSES (+3 more)

### Community 159 - "Complete Verification & Test Evidence"
Cohesion: 0.10
Nodes (20): 1. TypeScript & Client Framework Check (`bun run check`), 2. Server Vitest Test Suite (`bun run test`), 3. Client Unit Tests (`bun test apps/client`), 4. Production Monorepo Build (`bun run build`), 5. Cloudflare Workers Deployment Verification (`wrangler deploy --dry-run`), Code Review Findings Disposition Matrix, Complete Verification & Test Evidence, Conclusion & Merge Readiness (+12 more)

### Community 160 - "Design System — takeUforward-Inspired Dark Theme"
Cohesion: 0.17
Nodes (12): 10. Do's and Don'ts, 11. Blog Content Guidelines, 12. Responsive Breakpoints, 1. Tailwind CSS v4 Architecture, 4. Spacing — Tailwind Classes, 5. Border Radius — Tailwind Classes, 6. Shadows — Tailwind Classes, 7. Z-Index — Tailwind Classes (+4 more)

### Community 161 - "exam.schema.ts"
Cohesion: 0.20
Nodes (15): AttemptAnswer, AttemptAnswerSchema, AttemptSectionProgress, AttemptSectionProgressSchema, Exam, ExamQuestionItem, ExamQuestionItemSchema, ExamSection (+7 more)

### Community 162 - "API_URL"
Cohesion: 0.17
Nodes (11): QUICK_CATEGORIES, TestResultFeedback(), AnalysisData, ChapterStrength, FilterButton(), FilterKey, OptionReview, QuestionReviewItem (+3 more)

### Community 163 - "clean_dashes_db.ts"
Cohesion: 0.17
Nodes (9): blogColl, blogCursor, chapColl, chapCursor, envFile, examCursor, examsColl, tsColl (+1 more)

### Community 164 - "PaymentService"
Cohesion: 0.09
Nodes (8): PaymentController, PaymentService, student, addCalendarMonths(), paymentSignature(), signaturesMatch(), webhookSignature(), getExamSectionKey()

### Community 165 - "TestSeriesExplorer.tsx"
Cohesion: 0.33
Nodes (6): CATEGORIES, CURATED_COMING_SOON_SERIES, curateTestSeries(), StudentTestSeries, TestSeriesExplorer(), TestSeriesExplorerProps

### Community 166 - "repair_question_bank.py"
Cohesion: 0.52
Nodes (5): fingerprint(), load_db_url(), main(), norm(), option_payload()

### Community 167 - "server/README.md"
Cohesion: 0.18
Nodes (10): Authentication backend, Compile and run the project, Deployment, License, Observability, Project setup, Resources, Run tests (+2 more)

### Community 168 - "13. Exact File-Level Findings"
Cohesion: 0.29
Nodes (7): 13. Exact File-Level Findings, 1. `apps/client/src/lib/api.ts`, 3. `apps/client/src/pages/test-series/[id].astro`, 4. `apps/server/src/core/database/mongo-durable-object.ts`, 5. `apps/server/src/modules/blog/blog.service.ts`, 6. `apps/server/src/modules/auth/auth.service.ts`, 7. `apps/server/src/core/schema/blog.schema.ts`

### Community 169 - "Collections & Query Patterns"
Cohesion: 0.40
Nodes (5): 1. Collection: `blogs`, 2. Collection: `notifications`, 3. Collection: `test_attempts`, 6. Database Query and Index Analysis, Collections & Query Patterns

### Community 170 - "GovtPariksha Test Series Seed Pack"
Cohesion: 0.18
Nodes (10): 1. Test Series and subject hierarchy, 3. Question mappings, 5. Important ingestion rules, Bihar BPSC Prelims (`bihar-bpsc-prelims`), GovtPariksha Test Series Seed Pack, IBPS PO Complete Series (`ibps-po-complete`), RRB NTPC Graduate Level (`rrb-ntpc-graduate`), Seed summary (+2 more)

### Community 171 - "2. Complete Question Bank"
Cohesion: 0.18
Nodes (11): 2. Complete Question Bank, bg-001, bg-002, bg-003, bg-004, Bihar General Knowledge (`bihar-general-knowledge`), hi-001, hi-002 (+3 more)

### Community 172 - "sitemap.astro"
Cohesion: 0.17
Nodes (11): corePages, fallbackArticles, jsonLd, links, liveCategories, LivePost, livePosts, noResults (+3 more)

### Community 173 - "openTestSeriesCheckout.ts"
Cohesion: 0.22
Nodes (10): CheckoutOptions, CheckoutResult, loadCheckoutScript(), openTestSeriesCheckout(), RazorpayCheckout, RazorpaySuccess, readError(), Window (+2 more)

### Community 174 - "10. Complete User-Journey Call Flows"
Cohesion: 0.50
Nodes (4): 10. Complete User-Journey Call Flows, Flow 1: Open an Article, Flow 2: Switch Category or Section, Flow 3: Open Test Series Detail

### Community 175 - "client/AGENTS.md"
Cohesion: 0.22
Nodes (6): Development, Documentation, ⚠️ MANDATORY: Read Before ANY Frontend Task, Development, Documentation, ⚠️ MANDATORY: Read Before ANY Frontend Task

### Community 176 - "System Architecture (ARCHITECTURE.md)"
Cohesion: 0.22
Nodes (8): 1. Astro 5 Server-Side Rendering (SSR), 2. Instant Bilingual Language Swapping Pattern, 🎨 Frontend Architecture (`apps/client`), 🏛️ High-Level System Architecture, 📁 Monorepo Workspace Structure, System Architecture (ARCHITECTURE.md), 🔮 Version 2 Architecture & Roadmap (`feat/textbook-v2`), Version 2 Core Initiatives:

### Community 177 - "AI Development Guidelines & System Architecture (AGENTS.md)"
Cohesion: 0.17
Nodes (11): AI Development Guidelines & System Architecture (AGENTS.md), Critical Performance Guardrails:, graphify, Key Technical Characteristics, 🚨 Non-Negotiable Core Rules, ⚡ Performance & PageSpeed (95+ Requirement), 🚢 Production Deployment Protocol, 🏛️ System Architecture Summary (+3 more)

### Community 178 - "worker.ts"
Cohesion: 0.43
Nodes (5): enableWorkerDatabaseProxy(), runWithMongoDONamespace(), exposeRuntimeVariables(), fetch(), getHandler()

### Community 179 - "MongoDurableObject"
Cohesion: 0.16
Nodes (13): MongoDurableObject, sharp(), 1. Dual-Runtime Execution (Node.js & Cloudflare Workers), 2. Cloudflare Durable Object Database Proxy (`MONGO_DO`), 3. Media Pipeline: Direct-to-R2 Signed Uploads, ⚙️ Backend Architecture (`apps/server`), 🛠️ Cloudflare Worker Specifics, 🛠️ Cloudflare Worker Bundle & Cold-Start Optimization (+5 more)

### Community 180 - "Stage 4: Fix Test Series Detail Page Payload Bloat (P0)"
Cohesion: 0.67
Nodes (3): Fixes Implemented, Root Cause, Stage 4: Fix Test Series Detail Page Payload Bloat (P0)

### Community 181 - "Stage 7: Database Compound Indexes and Session Mutation Throttling (P1)"
Cohesion: 0.67
Nodes (3): Fixes Implemented, Root Causes, Stage 7: Database Compound Indexes and Session Mutation Throttling (P1)

### Community 183 - "rank-predictor.astro"
Cohesion: 0.33
Nodes (5): CATEGORIES, EXAM_PRESETS, ExamConfig, RankPredictorIsland(), jsonLd

### Community 184 - "Stage 10: Test Attempt Document Optimization Strategy (P2)"
Cohesion: 0.67
Nodes (3): Architectural Analysis, Recommended Migration Strategy (Non-Destructive), Stage 10: Test Attempt Document Optimization Strategy (P2)

### Community 185 - "setupCommandSearch"
Cohesion: 0.67
Nodes (3): setupCommandSearch(), executeFilter(), resetAll()

### Community 186 - "Stage 5: Remove Duplicate Article Language Content (P0)"
Cohesion: 0.67
Nodes (3): Fixes Implemented, Root Cause, Stage 5: Remove Duplicate Article Language Content (P0)

### Community 187 - "Stage 11: CSS Asset Extraction & CDN Caching (P1)"
Cohesion: 0.67
Nodes (3): Fixes Implemented, Root Cause, Stage 11: CSS Asset Extraction & CDN Caching (P1)

### Community 188 - "@nestjs/mongoose"
Cohesion: 0.14
Nodes (15): PaymentOrder, PaymentOrderDocument, PaymentOrderSchema, TestSeriesPass, TestSeriesPassDocument, TestSeriesPassSchema, PassPlan, RazorpayOrder (+7 more)

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

### Community 261 - "AiSearchJob"
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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1610 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `BlogService`, `AuthService`, `feedback.service.ts`, `blog.module.ts`, `durable-model.ts`, `devDependencies`, `site.ts`, `media.service.ts`, `notifications.ts`, `LearnerAnalyticsService`, `PaymentService`, `mongoose`, `article-lang-swap.ts`, `QuestionService`, `notification.store.ts`, `index.ts`, `@nestjs/mongoose`, `DailyQuizService`, `blog.query-opt.spec.ts`, `exam.service.ts`, `test-series.service.spec.ts`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **What connects `astro/tsconfigs/strict`, `./tsconfig.json` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `editor.astro` be split into smaller, more focused modules?**
  _Cohesion score 0.006493506493506494 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `mongoose` to `AuthService`, `feedback.service.ts`, `blog.module.ts`, `durable-model.ts`, `zod`, `migrate_pdf_apti_reasoning.ts`, `devDependencies`, `restructure_test_series.ts`, `seed-test-series.mjs`, `book.service.ts`, `dependencies`, `exam.schema.ts`, `LearnerAnalyticsService`, `clean_dashes_db.ts`, `PaymentService`, `seed_aptitude_questions.ts`, `generate_500_tests.ts`, `seed-dsssb-tgt-cs.ts`, `notification.store.ts`, `index.ts`, `@nestjs/mongoose`, `@nestjs/common`, `test-series.service.ts`, `seed_reasoning_questions.ts`, `seed_questions.ts`, `comments.service.ts`, `blog.query-opt.spec.ts`, `ref_dotenv`, `migrate-pg-to-mongo.mjs`, `generate_aptitude_reasoning_tests.ts`, `build_mock_tests.ts`, `exam.service.ts`, `test-series.service.spec.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `BlogService` be split into smaller, more focused modules?**
  _Cohesion score 0.145748987854251 - nodes in this community are weakly interconnected._
- **Why does `Post` connect `Post` to `notification.store.ts`, `AuthService`, `DailyQuizService`, `feedback.service.ts`, `CommentsService`, `MediaService`, `react`, `PaymentService`, `.requireUser`, `QuestionService`, `BookService`, `admin/api.ts`, `ExamController`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Should `AuthService` be split into smaller, more focused modules?**
  _Cohesion score 0.053763440860215055 - nodes in this community are weakly interconnected._