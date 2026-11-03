# Graph Report - examresource  (2026-11-03)

## Corpus Check
- 433 files · ~528,046 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: (none) 10, .ttf 5, .woff2 3)

## Summary
- 3703 nodes · 7704 edges · 200 communities (154 shown, 46 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 411 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3954bb98`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- editor.astro
- BlogService
- AuthService
- ExamService
- app.module.ts
- CommentsService
- .requireUser
- CurrentUser
- blog.module.ts
- durable-model.ts
- Layout.astro
- pymupdf
- zod
- mongoose
- article-reading.ts
- devDependencies
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
- article-lang.ts
- astro
- react
- site.ts
- insertBlock
- notifications.ts
- dependencies
- LearnerAnalyticsService
- seed_aptitude_questions.ts
- AdminApp.tsx
- editor
- mongo-durable-object.ts
- Detailed Stage-by-Stage Implementation Log
- client/package.json
- adminSession.ts
- ink-orbit-features.tsx
- compilerOptions
- extract_bilingual.py
- app.module.ts
- scripts
- article-lang-swap.ts
- StateFilterWidget.astro
- generate_500_tests.ts
- postgres
- [id].astro
- lib/api.ts
- bookmarks.ts
- seed-dsssb-tgt-cs.ts
- openTestSeriesCheckout.ts
- blogData.ts
- seed-dsssb-tgt-cs.ts
- ProfileHub.tsx
- pathlib
- mongoose
- sharp.ts
- @nestjs/common
- test-series.service.ts
- seed_reasoning_questions.ts
- QuestionReportsManager.tsx
- handleEditorImagePaste
- editor-nodes.ts
- AppService
- 4. Individual tests
- blog-content.adapter.ts
- MediaService
- ArticlesManager.tsx
- TestAttemptsManager.tsx
- re
- site.ts
- client/package.json
- seed_questions.ts
- GovtPariksha Performance Optimization: Final Verification & Regression Audit Report
- exam.module.ts
- handleEditorImagePaste
- openSlashMenu
- astro.config.mjs
- .createIndividualTest
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
- useAdminToast
- upload_to_r2.ts
- cloudflare-workers.d.ts
- DurableQuery
- blog/TableOfContents.astro
- examArticle.ts
- middleware.ts
- cloudflare-node.d.ts
- tsconfig.json
- Get
- QuestionService
- build_mock_tests.ts
- blog.cache.spec.ts
- CBTPalette.tsx
- test-series-access.service.ts
- lib/api.ts
- DailyQuizService
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
- GovtPariksha Platform: Complete Performance & Systems Audit Report
- Detailed Step-by-Step Resolution
- 🚀 Frontend Performance Architecture (`apps/client`)
- legacy_hindi.py
- Homepage (`/`) Design Rules
- re
- Test Series & CBT Interface Design Rules
- sharp
- 14. Prioritized Optimization Roadmap
- pymupdf
- 13. Exact File-Level Findings
- Complete Verification & Test Evidence
- Design System — takeUforward-Inspired Dark Theme
- serializer.ts
- CBTCalculator.tsx
- contact.ts
- auth.service.ts
- TestInstructions.tsx
- repair_question_bank.py
- server/README.md
- 🚀 Frontend Performance Architecture (`apps/client`)
- mongo-durable-object.ts
- GovtPariksha Test Series Seed Pack
- 2. Complete Question Bank
- rank-predictor.spec.ts
- sitemap.astro
- client/AGENTS.md
- System Architecture (ARCHITECTURE.md)
- AI Development Guidelines & System Architecture (AGENTS.md)
- MongoDurableObject
- cbt.ts
- test-series.service.spec.ts
- blog.cache.spec.ts
- blog.query-opt.spec.ts
- Collections & Query Patterns
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
1. `CurrentUser` - 116 edges
2. `mongoose` - 66 edges
3. `TestSeriesService` - 62 edges
4. `AuthService` - 57 edges
5. `BlogService` - 55 edges
6. `Post` - 54 edges
7. `@nestjs/common` - 50 edges
8. `TestSeriesController` - 49 edges
9. `react` - 46 edges
10. `@nestjs/mongoose` - 40 edges

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

## Communities (200 total, 46 thin omitted)

### Community 0 - "editor.astro"
Cohesion: 0.01
Nodes (230): acceptedImageTypes, activeFocusKeywords, addFaqRowBtn, addKeywordBtn, addKeywordInput, aiRefApplyCompareBtn, aiRefBottomCountBadge, aiRefBtnLabel (+222 more)

### Community 1 - "BlogService"
Cohesion: 0.15
Nodes (5): blocksToHtml(), htmlToBlocks(), syncImageBlocks(), BlogService, CreateBlockInput

### Community 2 - "AuthService"
Cohesion: 0.05
Nodes (19): RateLimitRecord, SlidingWindowRateLimiter, AuthController, SessionRequest, AuthService, email, forgotPasswordSchema, loginSchema (+11 more)

### Community 3 - "ExamService"
Cohesion: 0.07
Nodes (12): CreateExamInput, createExamSchema, SaveAnswerInput, saveAnswerSchema, testQuestionSchema, UpdateExamInput, updateExamSchema, UpdateSectionProgressInput (+4 more)

### Community 5 - "CommentsService"
Cohesion: 0.07
Nodes (16): addText(), createComment(), formatDate(), initialize(), handleDelete(), handleEdit(), load(), onLanguageChange() (+8 more)

### Community 8 - "blog.module.ts"
Cohesion: 0.11
Nodes (21): BlogBlockDocument, BlogDocument, BlogRevisionDocument, BlogCategory, BlogCategoryDocument, BlogCategorySchema, BlogTag, BlogTagDocument (+13 more)

### Community 9 - "durable-model.ts"
Cohesion: 0.21
Nodes (11): createDurableConnection(), createDurableModelProxy(), enableWorkerDatabaseProxy(), getMongoDOStub(), isWorkerDatabaseProxyEnabled(), mongoDONamespaceContext, runWithMongoDONamespace(), setMongoDOStub() (+3 more)

### Community 10 - "Layout.astro"
Cohesion: 0.09
Nodes (40): loadAnalysis(), applyOptimisticAuth(), closeAllDropdowns(), closeDropdown(), closeMobileDrawer(), closeSearchModal(), domainDotIndex, getDisplayedArticleLang() (+32 more)

### Community 11 - "pymupdf"
Cohesion: 0.18
Nodes (4): detect_chapter(), extract_all_images(), main(), parse_all_questions()

### Community 12 - "zod"
Cohesion: 0.12
Nodes (20): DailyQuiz, DailyQuizAttempt, DailyQuizAttemptDocument, DailyQuizAttemptSchema, DailyQuizBilingualText, DailyQuizBilingualTextSchema, DailyQuizDocument, DailyQuizOption (+12 more)

### Community 13 - "mongoose"
Cohesion: 0.15
Nodes (10): Comment, CommentDocument, CommentSchema, CommentStatus, commentStatuses, escapeRegex(), createCommentSchema, moderateCommentSchema (+2 more)

### Community 14 - "article-reading.ts"
Cohesion: 0.13
Nodes (26): Props, rawLines, Props, articleElement(), bindArticleReading(), bindCodeCopy(), bindFaqAccordion(), bindLightbox() (+18 more)

### Community 15 - "devDependencies"
Cohesion: 0.07
Nodes (41): author, description, devDependencies, @nestjs/cli@12.0.11, @nestjs/mau@0.2.9, @nestjs/schematics@12.0.12, oxlint@1.90.0, prettier@3.9.10 (+33 more)

### Community 16 - "blog.service.ts"
Cohesion: 0.11
Nodes (17): blockTypes, blogLanguages, blogStatuses, createBlockSchema, CreateBlogInput, createBlogSchema, CreateCategoryInput, createCategorySchema (+9 more)

### Community 17 - "latest-updates.astro"
Cohesion: 0.09
Nodes (29): refreshListingCardsInPlace(), syncListingCardLinks(), AppLang, appLangToBlogLanguage(), articleHref(), BlogLanguage, blogLanguageToAppLang(), normalizeAppLang() (+21 more)

### Community 18 - "seed-test-series.mjs"
Cohesion: 0.15
Nodes (11): __dirname, __filename, nodeEnv, runSeed(), seedPack, seedPackPath, toDeterministicObjectId(), createSnapshot() (+3 more)

### Community 19 - "test-series.dto.ts"
Cohesion: 0.09
Nodes (32): AssignSubjectInput, assignSubjectSchema, CreateChapterInput, createChapterSchema, createIndividualTestSchema, CreateQuestionMappingInput, createQuestionMappingSchema, CreateSubjectInput (+24 more)

### Community 20 - "[slug].astro"
Cohesion: 0.06
Nodes (32): Props, Props, articleMemoryCache, CachedArticle, getStaleArticleFromCache(), saveArticleToCache(), filterAndSlice(), getCachedRecentPostsSync() (+24 more)

### Community 21 - "package.json"
Cohesion: 0.07
Nodes (37): dependencies, jsonrepair@^3.15.0, devDependencies, concurrently@10.0.6, @dietrichgebert/ponytail@5.3.3, eslint@10.14.0, eslint-plugin-sonarjs@^4.2.2, prettier@^3.9.10 (+29 more)

### Community 22 - "syncFindHighlights"
Cohesion: 0.10
Nodes (30): collectDocMatches(), FindMatch, FindReplace, findReplaceKey, findStringMatches(), isWordChar(), mapTextOffset(), applyImageLayout() (+22 more)

### Community 25 - "admin/api.ts"
Cohesion: 0.11
Nodes (26): adminApi, AdminAttemptDetailAnswer, AdminAttemptDetailAnswerOption, AdminAttemptDetailQuestion, AdminAttemptSectionProgress, AdminChapter, AdminIndividualTest, AdminQuestion (+18 more)

### Community 26 - "article-lang.ts"
Cohesion: 0.15
Nodes (27): applyImageStyle(), buildLangVersion(), cleanPlainText(), closeOpenLists(), computeImageDimensions(), extractDetailsItems(), extractHeadingItems(), extractParagraphItems() (+19 more)

### Community 28 - "react"
Cohesion: 0.21
Nodes (11): Category, ArticlesManagerProps, AssignCategoriesModalProps, CategoriesManager(), CategoriesManagerProps, CategoryModal(), CategoryModalProps, slugify() (+3 more)

### Community 29 - "site.ts"
Cohesion: 0.06
Nodes (37): [brandPrefix, ...brandRest], Props, safeReturn, setupGoogleAuth(), Props, uniqueId, Props, [brandPrefix, ...brandRest] (+29 more)

### Community 30 - "insertBlock"
Cohesion: 0.10
Nodes (23): escapeHtmlSnippet(), evaluateAltKeywordHealth(), getArticleFocusKeywords(), insertBlock(), insertExamPattern(), insertMarkdownSnippet(), insertTableOfContentsBlock(), loadMediaLibrary() (+15 more)

### Community 31 - "notifications.ts"
Cohesion: 0.16
Nodes (25): allCachedNotifications, AppNotification, buildCard(), currentItems, deduplicateClientNotifications(), fireUnreadToSystem(), getCurrentSelectedLang(), getFiredIds() (+17 more)

### Community 32 - "dependencies"
Cohesion: 0.07
Nodes (27): dependencies, @aws-sdk/client-s3@3.1161.0, @aws-sdk/s3-request-presigner@3.1161.0, cookie-parser@^1.4.7, dotenv@18.0.9, google-auth-library@11.3.2, jsonrepair@^3.15.0, mongoose@9.11.4 (+19 more)

### Community 33 - "LearnerAnalyticsService"
Cohesion: 0.17
Nodes (3): LearnerAnalyticsController, LearnerAnalyticsService, makeService()

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
Cohesion: 0.24
Nodes (11): clsx@^2.1.1, tailwind-merge@^3.7.0, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (+3 more)

### Community 38 - "Detailed Stage-by-Stage Implementation Log"
Cohesion: 0.04
Nodes (44): Architectural Analysis, Cloudflare CDN Cache Rulebook & Operational Guide, Detailed Stage-by-Stage Implementation Log, Executive Summary, Fixes Implemented, Fixes Implemented, Fixes Implemented, Fixes Implemented (+36 more)

### Community 39 - "client/package.json"
Cohesion: 0.06
Nodes (44): dependencies, astro@7.4.5, dompurify@^3.4.17, lenis@^1.3.27, lucide-react@^1.66.0, marked@18.1.2, react@^19.3.1, react-dom@^19.3.1 (+36 more)

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

### Community 44 - "app.module.ts"
Cohesion: 0.10
Nodes (9): AppModule, BlogModule, BookModule, CommentsModule, ExamModule, LearnerAnalyticsModule, NotificationModule, QuestionModule (+1 more)

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

### Community 50 - "[id].astro"
Cohesion: 0.38
Nodes (6): initialFullTests, initialPyqTests, isPyqPaper(), SeriesSeo, seriesTitle, subjectNames

### Community 51 - "lib/api.ts"
Cohesion: 0.09
Nodes (24): AssignedSubject, Chapter, handleTestNavigate(), isPyqTest(), LatestAttemptMeta, LearnerSeriesPrep, Props, PublishedTestItem (+16 more)

### Community 52 - "bookmarks.ts"
Cohesion: 0.18
Nodes (16): Props, BookmarkedArticle, clearAllFavorites(), FavoriteArticle, getBookmarks, getFavorites(), isBookmarked, isFavorite() (+8 more)

### Community 53 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.07
Nodes (26): buckets, buf, CHAPTER_SLUG_MAP, __dirname, flushQuestion(), letterToIndex(), lines, MD_PATH (+18 more)

### Community 54 - "openTestSeriesCheckout.ts"
Cohesion: 0.21
Nodes (11): CheckoutOptions, CheckoutResult, loadCheckoutScript(), openTestSeriesCheckout(), RazorpayCheckout, RazorpaySuccess, readError(), Window (+3 more)

### Community 55 - "blogData.ts"
Cohesion: 0.15
Nodes (12): difficultyColors, Props, Props, difficultyBadge, Props, ArticleSection, CodeSnippet, SubjectData (+4 more)

### Community 56 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.12
Nodes (15): 1. Frontend (`apps/client`), 2. Backend (`apps/server`), Option A: Instant Vercel Rollback (Frontend), Option B: Git Revert on `main`, Option C: Cloudflare Workers Rollback (Backend), 🔍 Post-Deployment Verification, 📋 Pre-Flight Checklist, Production Deployment Guide (DEPLOYMENT.md) (+7 more)

### Community 57 - "ProfileHub.tsx"
Cohesion: 0.14
Nodes (12): Attempt, AttemptAnswer, AttemptCard(), FilterPill(), LoadState, MetricBlock(), PassInfo, ProfileHub() (+4 more)

### Community 59 - "mongoose"
Cohesion: 0.07
Nodes (26): createApplication(), env, EnvSchema, DatabaseModule, PaymentOrder, PaymentOrderDocument, TestSeriesPass, TestSeriesPassDocument (+18 more)

### Community 60 - "sharp.ts"
Cohesion: 0.17
Nodes (6): fitName(), formatName(), ResizeOptions, SharpMetadata, WebpOptions, WorkerSharpPipeline

### Community 61 - "@nestjs/common"
Cohesion: 0.08
Nodes (20): ChapterCol, ChapterDef, envFile, ExamCol, examsToInsert, FULL_MOCK_SPECS, LR_CHAPTER_DEFS, lrChapterIdMap (+12 more)

### Community 62 - "test-series.service.ts"
Cohesion: 0.12
Nodes (33): Exam, ExamDocument, ExamSchema, TestAttempt, TestAttemptDocument, TestAttemptSchema, Question, QuestionDocument (+25 more)

### Community 63 - "seed_reasoning_questions.ts"
Cohesion: 0.17
Nodes (12): chapCounts, chapterIds, CHAPTERS, envFile, makeOptions(), q(), QCol, RAW_QUESTIONS (+4 more)

### Community 64 - "QuestionReportsManager.tsx"
Cohesion: 0.17
Nodes (10): AdminQuestionReport, ErrorBoundaryProps, ErrorBoundaryState, formatFullDate(), formatRelativeTime(), QuestionReportsErrorBoundary, QuestionReportsManager(), QuestionReportsManagerContent() (+2 more)

### Community 65 - "handleEditorImagePaste"
Cohesion: 0.11
Nodes (23): apiFetch(), closeArticleImageModal(), executeImageInsertion(), generateBilingualFromReference(), getImageFileDimensions(), normalizeNotionImageUrl(), openAiReferenceModal(), placeUploadedImages() (+15 more)

### Community 66 - "editor-nodes.ts"
Cohesion: 0.15
Nodes (12): @tiptap/extension-image@3.32.2, @tiptap/extension-list@3.32.2, ArticleBulletList, ArticleImage, BulletStyle, bulletStyles, ImageAlignment, imageAlignments (+4 more)

### Community 67 - "AppService"
Cohesion: 0.15
Nodes (18): CBTCodeOfConductModal(), Props, Props, CBTKeyboardShortcutsModal(), Props, CBTOutline, Props, CBTQuestionPaperModal() (+10 more)

### Community 68 - "4. Individual tests"
Cohesion: 0.06
Nodes (31): 4. Individual tests, Arithmetic & Percentages Chapter Test 01, Bihar BPSC Prelims Full Mock Test 01, Bihar BPSC Prelims Full Mock Test 02, Bihar General Knowledge Practice Test 02, Bihar History & Culture Chapter Test 02, Constitution & Governance Chapter Test 01, General Intelligence & Reasoning Practice Test 02 (+23 more)

### Community 69 - "blog-content.adapter.ts"
Cohesion: 0.13
Nodes (26): cleanAttributes(), DANGEROUS_ELEMENTS, decodeEntities(), isSafeUrl(), SAFE_ATTRIBUTES, SAFE_BLOCK_TAGS, SAFE_INLINE_TAGS, SAFE_LIST_TAGS (+18 more)

### Community 70 - "MediaService"
Cohesion: 0.13
Nodes (4): assertSafeRemoteUrl(), isPrivateOrReservedIp(), MediaController, MediaService

### Community 71 - "ArticlesManager.tsx"
Cohesion: 0.33
Nodes (9): ArticlesManager(), AssignCategoriesModal(), articleCacheKey(), read(), readArticleCache(), readCategoryCache(), write(), writeArticleCache() (+1 more)

### Community 72 - "TestAttemptsManager.tsx"
Cohesion: 0.20
Nodes (7): AdminAttemptDetail, AdminAttemptListItem, ErrorBoundaryProps, ErrorBoundaryState, TestAttemptsErrorBoundary, TestAttemptsManager(), TestAttemptsManagerContent()

### Community 73 - "re"
Cohesion: 0.16
Nodes (8): PageLegacyFonts, build_blocks_for_question(), clean_english_stem(), extract_legacy_lines(), format_banker_table(), load_db_url(), main(), get_page_fonts()

### Community 74 - "site.ts"
Cohesion: 0.05
Nodes (36): CATEGORIES, EXAM_PRESETS, ExamConfig, RankPredictorIsland(), contactEmail, siteName, siteUrl, fallbackOffer (+28 more)

### Community 75 - "client/package.json"
Cohesion: 0.13
Nodes (15): devDependencies, @astrojs/check@0.9.12, tailwindcss@^4.3.3, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/turndown@^5.0.6, typescript@6, wrangler@^4.156.2 (+7 more)

### Community 76 - "seed_questions.ts"
Cohesion: 0.18
Nodes (9): CHAPTER_CONFIG, ChapterSchema, envFile, QuestionMappingSchema, QuestionOptionSchema, QuestionSchema, SubjectSchema, TestSeriesSchema (+1 more)

### Community 77 - "GovtPariksha Performance Optimization: Final Verification & Regression Audit Report"
Cohesion: 0.07
Nodes (28): 10. Test Series & Test Attempt Compatibility, 12. Cloudflare Edge Caching Verification, 13. Complete Seven-Journey Benchmark, 14. Before vs After Performance Comparison, 15. Tests Executed & Exact Outcomes, 16. Remaining Issues & Risks, 17. Production Deployment Blockers, 18. Final Readiness Classification (+20 more)

### Community 78 - "exam.module.ts"
Cohesion: 0.21
Nodes (13): AttemptAnswer, AttemptAnswerSchema, AttemptSectionProgress, AttemptSectionProgressSchema, ExamQuestionItem, ExamQuestionItemSchema, ExamSection, ExamSectionSchema (+5 more)

### Community 79 - "handleEditorImagePaste"
Cohesion: 0.33
Nodes (9): fileFromDataUrl(), fileFromImageSource(), handleEditorImageDrop(), handleEditorImagePaste(), imageFilesFromTransfer(), localImageSources(), normalizeImageFile(), queueUploadedImages() (+1 more)

### Community 80 - "openSlashMenu"
Cohesion: 0.28
Nodes (9): checkSlashCommand(), closeSlashMenu(), executeSlashItem(), openSlashMenu(), placeFloating(), positionInlineBlockMenu(), positionSlashMenu(), renderSlashHighlight() (+1 more)

### Community 81 - "astro.config.mjs"
Cohesion: 0.25
Nodes (7): isBuild, @astrojs/cloudflare@^14.4.4, @astrojs/react@7.1.2, @tailwindcss/vite@^4.3.3, @astrojs/cloudflare, @astrojs/react, @tailwindcss/vite

### Community 82 - ".createIndividualTest"
Cohesion: 0.16
Nodes (5): CreateIndividualTestInput, ListIndividualTestsQueryInput, TestQuestionItemInput, UpdateIndividualTestInput, MemoryCache

### Community 84 - "GovtPariksha Platform (ExamResource Monorepo)"
Cohesion: 0.13
Nodes (14): 1. Installation, 2. Environment Configuration, 3. Run Development Servers, 📜 Available Scripts, GovtPariksha Platform (ExamResource Monorepo), 🚀 Key Architectural & Performance Patterns, 🛠️ Local Development, Prerequisites (+6 more)

### Community 85 - "daily-quiz/index.astro"
Cohesion: 0.16
Nodes (12): DailyQuizQuestion, DailyQuizRunner(), EvaluatedQuestion, Props, QuizDataPayload, QuizEvaluationResult, availableQuizzes, jsonLd (+4 more)

### Community 86 - "ref_dotenv"
Cohesion: 0.14
Nodes (12): targetSlugs, envFile, examCounts, topSources, aptitudeSubjects, envFile, reasoningSubjects, envFile (+4 more)

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

### Community 95 - "notification.store.ts"
Cohesion: 0.10
Nodes (18): NotificationDocument, NotificationReadDocument, UserDocument, NotificationController, NotificationService, createBlogPublishedNotification(), createBroadcastNotification(), deduplicateNotificationsByLanguage() (+10 more)

### Community 97 - "useAdminToast"
Cohesion: 0.17
Nodes (10): Toast, ToastContext, ToastContextType, ToastType, useAdminToast(), NotificationItem, NotificationsManager(), QuestionBankManager() (+2 more)

### Community 98 - "upload_to_r2.ts"
Cohesion: 0.17
Nodes (11): client, env, envFile, finalFile, mapPath, publicBase, questions, questionsFile (+3 more)

### Community 100 - "DurableQuery"
Cohesion: 0.24
Nodes (3): DurableQuery, executeDatabaseOperation(), MongoDOQuery

### Community 106 - "Get"
Cohesion: 0.16
Nodes (3): escapeRegex(), MemoryCache, API Latency Classification

### Community 107 - "QuestionService"
Cohesion: 0.06
Nodes (26): baseQuestionSchema, CreateQuestionsInput, createQuestionsSchema, GenerateQuestionsAiInput, generateQuestionsAiSchema, optionSchema, ParseRawQuestionsAiInput, parseRawQuestionsAiSchema (+18 more)

### Community 108 - "build_mock_tests.ts"
Cohesion: 0.25
Nodes (8): envPath, ExamQuestionItemSchema, ExamSchema, main(), MOCK_TESTS, QuestionOptionSnapshotSchema, QuestionSnapshotSchema, shuffle()

### Community 109 - "blog.cache.spec.ts"
Cohesion: 0.20
Nodes (13): CBTGovtExamView(), formatClockParts(), CBTQuestionPanel, Props, typeLabel(), CBTQuestionReportModal(), ISSUE_REASONS, Props (+5 more)

### Community 110 - "CBTPalette.tsx"
Cohesion: 0.36
Nodes (7): CBTFlagIcon(), CBTLegend, Props, CBTPalette, Chevron(), chipClass(), isFlaggedStatus()

### Community 112 - "lib/api.ts"
Cohesion: 0.08
Nodes (25): CATEGORIES, StudentTestSeries, TestSeriesExplorer(), TestSeriesExplorerProps, API_URL, CacheEntry, fetchPublicJson(), inFlightRequests (+17 more)

### Community 113 - "DailyQuizService"
Cohesion: 0.15
Nodes (3): DailyQuizController, sanitizeCategory(), DailyQuizService

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
Cohesion: 0.18
Nodes (8): AnalysisData, ChapterStrength, FilterButton(), FilterKey, OptionReview, QuestionReviewItem, SectionStat, TestResultAnalysis()

### Community 148 - "GovtPariksha Platform: Complete Performance & Systems Audit Report"
Cohesion: 0.10
Nodes (19): 10. Complete User-Journey Call Flows, 15. Risks and Dependencies, 16. Missing Metrics or Unavailable Evidence, 17. Recommended First Optimization Step, 1. Executive Summary, 2. Verified Project Architecture, 3. Frontend Performance Findings, 4. API Request Inventory & Network Waterfall (+11 more)

### Community 149 - "Detailed Step-by-Step Resolution"
Cohesion: 0.20
Nodes (10): Detailed Step-by-Step Resolution, Step 10: Preview / Staging API Environment Leak, Step 11: Repository Instruction Conflict Resolution, Step 12: Cloudflare Workers Builds Failure Fix, Step 1: Article Response Cache Headers & 503 Error State, Step 2: Deterministic Article Slug Resolution & Group Integrity, Step 6: Edge Cache Security for Private CBT Tests & Results, Step 7: Notification Polling, Throttling & Account Isolation (+2 more)

### Community 150 - "🚀 Frontend Performance Architecture (`apps/client`)"
Cohesion: 0.25
Nodes (7): 1. Vercel Edge HTTP Caching, 2. Backend In-Memory Service Cache (`apps/server`), 3. Resilient SSR Fetching & Timeout Guardrails, 📋 Ongoing Performance Maintenance Checklist, Performance & PageSpeed Optimization Guide (PERFORMANCE.md), ⚡ Server & Edge Caching Architecture, 🎯 Target Web Vitals & SLA

### Community 151 - "legacy_hindi.py"
Cohesion: 0.15
Nodes (6): ensure_hin_traineddata(), find_tesseract(), font_buffer_with_unicode_cmap(), ocr_legacy_strings(), _ocr_plain(), _render_strings()

### Community 152 - "Homepage (`/`) Design Rules"
Cohesion: 0.50
Nodes (3): Constraints, Homepage (`/`) Design Rules, Structure

### Community 153 - "re"
Cohesion: 0.10
Nodes (9): assign_images(), build_continuous_stream(), deduplicate_questions(), detect_chapter(), extract_questions_v2(), main(), merge_with_v1_data(), parse_options() (+1 more)

### Community 155 - "sharp"
Cohesion: 0.29
Nodes (7): sharp(), 1. Dual-Runtime Execution (Node.js & Cloudflare Workers), 2. Cloudflare Durable Object Database Proxy (`MONGO_DO`), 3. Media Pipeline: Direct-to-R2 Signed Uploads, ⚙️ Backend Architecture (`apps/server`), 🛠️ Cloudflare Worker Specifics, 🛠️ Cloudflare Worker Bundle & Cold-Start Optimization

### Community 156 - "14. Prioritized Optimization Roadmap"
Cohesion: 0.13
Nodes (15): 10. Optimize `global.css` and External Scripts, 14. Prioritized Optimization Roadmap, 1. Fix `PUBLIC_API_URL` & Cloudflare API Route Mapping, 2. Increase Fetch Timeout & Add Stale Fallback in `[slug].astro`, 3. Enable Cloudflare Edge Caching for HTML, 4. Increase Mongo Durable Object Pool Size, 5. Stop Serializing 150 Tests into Test Series Detail HTML, 6. Eliminate Triple HTML Duplication in Articles (+7 more)

### Community 157 - "pymupdf"
Cohesion: 0.07
Nodes (6): clean_text(), recover_pdf_4_options(), clean_opt_text(), recover_pdf_options(), extract_match_options(), get_surrounding_text()

### Community 158 - "13. Exact File-Level Findings"
Cohesion: 0.12
Nodes (17): optimizeBlogHtmlImages(), 11. Ten Biggest Bottlenecks (Ranked by Impact), 13. Exact File-Level Findings, 1. `apps/client/src/lib/api.ts`, 1. Cloudflare CDN HTML Bypass, 2. `apps/client/src/pages/[slug].astro`, 2. Dual Language Duplication in SSR Payloads, 3. `apps/client/src/pages/test-series/[id].astro` (+9 more)

### Community 159 - "Complete Verification & Test Evidence"
Cohesion: 0.18
Nodes (10): 1. TypeScript & Client Framework Check (`bun run check`), 2. Server Vitest Test Suite (`bun run test`), 3. Client Unit Tests (`bun test apps/client`), 4. Production Monorepo Build (`bun run build`), 5. Cloudflare Workers Deployment Verification (`wrangler deploy --dry-run`), Code Review Findings Disposition Matrix, Complete Verification & Test Evidence, Conclusion & Merge Readiness (+2 more)

### Community 160 - "Design System — takeUforward-Inspired Dark Theme"
Cohesion: 0.17
Nodes (12): 10. Do's and Don'ts, 11. Blog Content Guidelines, 12. Responsive Breakpoints, 1. Tailwind CSS v4 Architecture, 4. Spacing — Tailwind Classes, 5. Border Radius — Tailwind Classes, 6. Shadows — Tailwind Classes, 7. Z-Index — Tailwind Classes (+4 more)

### Community 161 - "serializer.ts"
Cohesion: 0.60
Nodes (4): deserializeInDO(), deserializeResultInWorker(), serializeForDO(), serializeResultFromDO()

### Community 162 - "CBTCalculator.tsx"
Cohesion: 0.27
Nodes (9): CBTCalculator(), evaluateExpression(), Fn, formatResult(), FUNCTIONS, Op, Props, Tok (+1 more)

### Community 163 - "contact.ts"
Cohesion: 0.20
Nodes (9): escapeHtml(), POST(), 🛡️ Authentication & Security Model, Security Guardrails:, 📡 API Endpoints, 🔐 Architecture Overview, Authentication & Session Security (AUTH.md), 🍪 Cookie Configuration (+1 more)

### Community 164 - "auth.service.ts"
Cohesion: 0.07
Nodes (21): Book, makeService(), CreateBookInput, createBookSchema, UpdateBookInput, updateBookSchema, student, ListPreparationAttemptsQuery (+13 more)

### Community 165 - "TestInstructions.tsx"
Cohesion: 0.22
Nodes (9): BrandMark(), CBTHeader(), formatTime(), Props, Props, SectionRule, TestInstructions(), TestInstructionsData (+1 more)

### Community 166 - "repair_question_bank.py"
Cohesion: 0.52
Nodes (5): fingerprint(), load_db_url(), main(), norm(), option_payload()

### Community 167 - "server/README.md"
Cohesion: 0.18
Nodes (10): Authentication backend, Compile and run the project, Deployment, License, Observability, Project setup, Resources, Run tests (+2 more)

### Community 168 - "🚀 Frontend Performance Architecture (`apps/client`)"
Cohesion: 0.33
Nodes (6): 1. Zero Render-Blocking Third-Party Scripts, 2. Font Loading Strategy, 3. Critical CSS & Design Tokens, 4. Image Optimization Rules, 5. Instant Bilingual Language Swapping (Zero Latency), 🚀 Frontend Performance Architecture (`apps/client`)

### Community 169 - "mongo-durable-object.ts"
Cohesion: 0.07
Nodes (37): SCHEMA_MAP, EmailVerificationToken, EmailVerificationTokenDocument, EmailVerificationTokenSchema, OauthState, OauthStateDocument, OauthStateSchema, PasswordResetToken (+29 more)

### Community 170 - "GovtPariksha Test Series Seed Pack"
Cohesion: 0.18
Nodes (10): 1. Test Series and subject hierarchy, 3. Question mappings, 5. Important ingestion rules, Bihar BPSC Prelims (`bihar-bpsc-prelims`), GovtPariksha Test Series Seed Pack, IBPS PO Complete Series (`ibps-po-complete`), RRB NTPC Graduate Level (`rrb-ntpc-graduate`), Seed summary (+2 more)

### Community 171 - "2. Complete Question Bank"
Cohesion: 0.18
Nodes (11): 2. Complete Question Bank, bg-001, bg-002, bg-003, bg-004, Bihar General Knowledge (`bihar-general-knowledge`), hi-001, hi-002 (+3 more)

### Community 173 - "sitemap.astro"
Cohesion: 0.12
Nodes (11): corePages, fallbackArticles, jsonLd, links, liveCategories, LivePost, livePosts, noResults (+3 more)

### Community 175 - "client/AGENTS.md"
Cohesion: 0.22
Nodes (6): Development, Documentation, ⚠️ MANDATORY: Read Before ANY Frontend Task, Development, Documentation, ⚠️ MANDATORY: Read Before ANY Frontend Task

### Community 176 - "System Architecture (ARCHITECTURE.md)"
Cohesion: 0.22
Nodes (8): 1. Astro 5 Server-Side Rendering (SSR), 2. Instant Bilingual Language Swapping Pattern, 🎨 Frontend Architecture (`apps/client`), 🏛️ High-Level System Architecture, 📁 Monorepo Workspace Structure, System Architecture (ARCHITECTURE.md), 🔮 Version 2 Architecture & Roadmap (`feat/textbook-v2`), Version 2 Core Initiatives:

### Community 177 - "AI Development Guidelines & System Architecture (AGENTS.md)"
Cohesion: 0.17
Nodes (11): AI Development Guidelines & System Architecture (AGENTS.md), Critical Performance Guardrails:, graphify, Key Technical Characteristics, 🚨 Non-Negotiable Core Rules, ⚡ Performance & PageSpeed (95+ Requirement), 🚢 Production Deployment Protocol, 🏛️ System Architecture Summary (+3 more)

### Community 179 - "MongoDurableObject"
Cohesion: 0.18
Nodes (10): MongoDurableObject, 12. Confirmed Root Causes vs. Suspected Issues, 5. Backend API Latency & Lifecycle Audit, 8. Local vs Production Comparison, Confirmed Root Causes (Verified with Empirical Data & Code Evidence), Issues That Could Not Be Verified, Measured 5-Run Benchmark (Production vs Local), Request Lifecycle Trace: `GET /api/v1/blogs/:slug` (+2 more)

### Community 180 - "cbt.ts"
Cohesion: 0.19
Nodes (13): Props, Props, Props, leaveExamFullscreen(), navigateToResults(), useCBTAttempt(), UseCBTAttemptProps, AttemptAnswer (+5 more)

### Community 181 - "test-series.service.spec.ts"
Cohesion: 0.40
Nodes (4): admin, editor, makeService(), student

### Community 182 - "blog.cache.spec.ts"
Cohesion: 0.40
Nodes (4): @nestjs/testing@12.3.2, supertest@7.3.1, @nestjs/testing, supertest

### Community 185 - "Collections & Query Patterns"
Cohesion: 0.33
Nodes (6): 1. Collection: `blogs`, 2. Collection: `notifications`, 3. Collection: `test_attempts`, 4. Durable Object Socket Pool Limitation, 6. Database Query and Index Analysis, Collections & Query Patterns

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1524 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `mongoose` to `editor.astro`, `sitemap.astro`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **What connects `astro/tsconfigs/strict`, `./tsconfig.json` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `editor.astro` be split into smaller, more focused modules?**
  _Cohesion score 0.007692307692307693 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `mongoose` to `blog.module.ts`, `durable-model.ts`, `zod`, `mongoose`, `migrate_pdf_apti_reasoning.ts`, `devDependencies`, `restructure_test_series.ts`, `seed-test-series.mjs`, `dependencies`, `serializer.ts`, `seed_aptitude_questions.ts`, `auth.service.ts`, `mongo-durable-object.ts`, `generate_500_tests.ts`, `test-series.service.spec.ts`, `seed-dsssb-tgt-cs.ts`, `blog.query-opt.spec.ts`, `@nestjs/common`, `test-series.service.ts`, `seed_reasoning_questions.ts`, `seed_questions.ts`, `exam.module.ts`, `ref_dotenv`, `migrate-pg-to-mongo.mjs`, `generate_aptitude_reasoning_tests.ts`, `notification.store.ts`, `build_mock_tests.ts`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Should `AuthService` be split into smaller, more focused modules?**
  _Cohesion score 0.053534660260809885 - nodes in this community are weakly interconnected._
- **Why does `Post` connect `Post` to `AuthService`, `ExamService`, `CommentsService`, `MediaService`, `ArticlesManager.tsx`, `.requireUser`, `QuestionService`, `test-series-access.service.ts`, `DailyQuizService`, `BookService`, `admin/api.ts`, `react`, `notification.store.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `ExamService` be split into smaller, more focused modules?**
  _Cohesion score 0.06846635367762129 - nodes in this community are weakly interconnected._