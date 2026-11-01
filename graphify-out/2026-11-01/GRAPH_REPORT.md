# Graph Report - examresource  (2026-11-01)

## Corpus Check
- 345 files · ~443,715 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 9, .woff2 3, .example 2)

## Summary
- 3094 nodes · 6684 edges · 184 communities (131 shown, 53 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 382 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc5473e9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- editor.astro
- BlogService
- AuthService
- ExamService
- auth.service.ts
- CommentsService
- .requireUser
- CurrentUser
- QuestionController
- durable-model.ts
- Layout.astro
- mongoose
- DailyQuizService
- pricing.astro
- article-reading.ts
- server/package.json
- exam.schema.ts
- latest-updates.astro
- site.ts
- MediaService
- [slug].astro
- package.json
- syncFindHighlights
- Post
- BookService
- admin/api.ts
- index.ts
- astro
- ArticlesManager.tsx
- app.module.ts
- insertBlock
- notifications.ts
- dependencies
- LearnerAnalyticsService
- test-series.dto.ts
- AdminApp.tsx
- editor
- notification.store.ts
- comments.service.ts
- dependencies
- adminSession.ts
- ink-orbit-features.tsx
- compilerOptions
- cbt.ts
- lib/api.ts
- scripts
- contact.ts
- StateFilterWidget.astro
- rank-predictor.astro
- postgres
- [id].astro
- TestSeriesDetail.tsx
- bookmarks.ts
- parse-md.ts
- client/package.json
- blogData.ts
- seed-dsssb-tgt-cs.ts
- ProfileHub.tsx
- article-lang.ts
- @nestjs/mongoose
- sharp.ts
- DailyQuizService
- sitemap.astro
- PaymentService
- question.service.ts
- handleEditorImagePaste
- editor-nodes.ts
- blog.service.ts
- 4. Individual tests
- blog-content.adapter.ts
- TestInstructions.tsx
- seed-test-series.mjs
- TestAttemptsManager.tsx
- useAdminToast
- site.ts
- devDependencies
- QuestionService
- executeImageInsertion
- .listPublishedTests
- AuthPage.astro
- openSlashMenu
- astro.config.mjs
- @tiptap/extension-table-header@^3.32.0
- GeminiService
- GovtPariksha Platform (ExamResource Monorepo)
- daily-quiz/index.astro
- seed-dsssb-tgt-cs.ts
- oxlint.json
- migrate-pg-to-mongo.mjs
- tsconfig.build.json
- scripts
- nest-cli.json
- test-series.service.spec.ts
- test-series.ts
- client/tsconfig.json
- NotificationService
- AdSlot.astro
- AdminLayout.astro
- .invalidateCache
- cloudflare-workers.d.ts
- zustand
- blog/TableOfContents.astro
- examArticle.ts
- middleware.ts
- cloudflare-node.d.ts
- tsconfig.json
- Get
- blog.dto.ts
- rank-predictor.spec.ts
- POST
- CBTTestRunner.tsx
- article-lang-swap.ts
- react-dom@^19.3.1
- @tiptap/extension-character-count
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
- @tiptap/extension-youtube
- 1. Font Families
- scanAndExtractImagesFromText
- Blog & Article View (`/blogs`, `/[slug]`) Design Rules
- Blog Formatting & SEO Guidelines
- Dashboard & Admin Pages Design Rules
- @types/dompurify@^3.2.0
- vercel.json
- book.service.ts
- 🚀 Frontend Performance Architecture (`apps/client`)
- react
- Homepage (`/`) Design Rules
- MongoDurableObject
- Test Series & CBT Interface Design Rules
- CBTQuestionPanel.tsx
- AppService
- CBTCalculator.tsx
- CBTPalette.tsx
- setupCommandSearch
- Design System — takeUforward-Inspired Dark Theme
- blog.cache.spec.ts
- gemini.service.ts
- server/README.md
- GovtPariksha Test Series Seed Pack
- 2. Complete Question Bank
- client/AGENTS.md
- AI Development Guidelines & System Architecture (AGENTS.md)
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
- @tiptap/pm
- prompt-to-seed-test-series-pack.md

## God Nodes (most connected - your core abstractions)
1. `CurrentUser` - 113 edges
2. `TestSeriesService` - 62 edges
3. `AuthService` - 57 edges
4. `Post` - 54 edges
5. `BlogService` - 54 edges
6. `mongoose` - 51 edges
7. `@nestjs/common` - 50 edges
8. `TestSeriesController` - 49 edges
9. `react` - 44 edges
10. `@nestjs/mongoose` - 40 edges

## Surprising Connections (you probably didn't know these)
- `Security Guardrails:` --references--> `POST()`  [INFERRED]
  docs/ARCHITECTURE.md → apps/client/src/pages/api/contact.ts
- `Key Technical Characteristics` --references--> `MongoDurableObject`  [INFERRED]
  AGENTS.md → apps/server/src/core/database/mongo-durable-object.ts
- `🚀 Key Architectural & Performance Patterns` --references--> `MongoDurableObject`  [INFERRED]
  README.md → apps/server/src/core/database/mongo-durable-object.ts
- `📚 Version 2 Architecture & Branching (`feat/textbook-v2`)` --references--> `main()`  [INFERRED]
  AGENTS.md → seed/dsssb-tgt-cs/seed-dsssb-tgt-cs.ts
- `Option B: Git Revert on `main`` --references--> `main()`  [INFERRED]
  docs/DEPLOYMENT.md → seed/dsssb-tgt-cs/seed-dsssb-tgt-cs.ts

## Import Cycles
- None detected.

## Communities (184 total, 53 thin omitted)

### Community 0 - "editor.astro"
Cohesion: 0.01
Nodes (231): acceptedImageTypes, activeFocusKeywords, addFaqRowBtn, addKeywordBtn, addKeywordInput, aiRefApplyCompareBtn, aiRefBottomCountBadge, aiRefBtnLabel (+223 more)

### Community 1 - "BlogService"
Cohesion: 0.15
Nodes (5): blocksToHtml(), htmlToBlocks(), syncImageBlocks(), BlogService, CreateBlogInput

### Community 2 - "AuthService"
Cohesion: 0.05
Nodes (20): RateLimitRecord, SlidingWindowRateLimiter, AuthController, SessionRequest, makeService(), AuthService, email, forgotPasswordSchema (+12 more)

### Community 3 - "ExamService"
Cohesion: 0.07
Nodes (12): CreateExamInput, createExamSchema, SaveAnswerInput, saveAnswerSchema, testQuestionSchema, UpdateExamInput, updateExamSchema, UpdateSectionProgressInput (+4 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.10
Nodes (21): EmailVerificationToken, EmailVerificationTokenDocument, EmailVerificationTokenSchema, OauthState, OauthStateDocument, OauthStateSchema, PasswordResetToken, PasswordResetTokenDocument (+13 more)

### Community 5 - "CommentsService"
Cohesion: 0.08
Nodes (14): addText(), createComment(), formatDate(), initialize(), handleDelete(), handleEdit(), load(), onLanguageChange() (+6 more)

### Community 9 - "durable-model.ts"
Cohesion: 0.10
Nodes (18): createDurableConnection(), createDurableModelProxy(), DurableQuery, enableWorkerDatabaseProxy(), executeDatabaseOperation(), getMongoDOStub(), isWorkerDatabaseProxyEnabled(), mongoDONamespaceContext (+10 more)

### Community 10 - "Layout.astro"
Cohesion: 0.09
Nodes (38): API_URL, applyOptimisticAuth(), closeAllDropdowns(), closeDropdown(), closeMobileDrawer(), closeSearchModal(), domainDotIndex, getDisplayedArticleLang() (+30 more)

### Community 11 - "mongoose"
Cohesion: 0.10
Nodes (11): createApplication(), env, EnvSchema, DatabaseModule, bootstrap(), student, student, mongoose (+3 more)

### Community 12 - "DailyQuizService"
Cohesion: 0.12
Nodes (20): DailyQuiz, DailyQuizAttempt, DailyQuizAttemptDocument, DailyQuizAttemptSchema, DailyQuizBilingualText, DailyQuizBilingualTextSchema, DailyQuizDocument, DailyQuizOption (+12 more)

### Community 13 - "pricing.astro"
Cohesion: 0.17
Nodes (12): fallbackOffer, formatRupees(), loadPassOffer(), PassOffer, jsonLd, listPrice, price, save (+4 more)

### Community 14 - "article-reading.ts"
Cohesion: 0.14
Nodes (25): Props, rawLines, Props, articleElement(), bindArticleReading(), bindCodeCopy(), bindFaqAccordion(), bindLightbox() (+17 more)

### Community 15 - "server/package.json"
Cohesion: 0.06
Nodes (45): author, @aws-sdk/client-s3@3.1159.0, @nestjs/platform-express@12.3.2, description, devDependencies, @nestjs/cli@12.0.11, @nestjs/mau@0.2.9, @nestjs/schematics@12.0.12 (+37 more)

### Community 16 - "exam.schema.ts"
Cohesion: 0.21
Nodes (13): AttemptAnswer, AttemptAnswerSchema, AttemptSectionProgress, AttemptSectionProgressSchema, ExamQuestionItem, ExamQuestionItemSchema, ExamSection, ExamSectionSchema (+5 more)

### Community 17 - "latest-updates.astro"
Cohesion: 0.07
Nodes (33): refreshListingCardsInPlace(), syncListingCardLinks(), AppLang, appLangToBlogLanguage(), articleHref(), BlogLanguage, normalizeAppLang(), preferredLangFromCookieHeader() (+25 more)

### Community 18 - "site.ts"
Cohesion: 0.11
Nodes (13): Props, [brandPrefix, ...brandRest], Props, [brandPrefix, ...brandRest], isDailyQuiz, isRankPredictor, isTestSeries, preferredAppLang (+5 more)

### Community 20 - "[slug].astro"
Cohesion: 0.07
Nodes (26): Props, Props, blogLanguageToAppLang(), filterAndSlice(), getCachedRecentPostsSync(), getRecentPosts(), ListingPost, memoryCache (+18 more)

### Community 21 - "package.json"
Cohesion: 0.07
Nodes (37): dependencies, jsonrepair@^3.15.0, devDependencies, concurrently@10.0.6, @dietrichgebert/ponytail@5.3.3, eslint@10.14.0, eslint-plugin-sonarjs@^4.2.2, prettier@^3.9.10 (+29 more)

### Community 22 - "syncFindHighlights"
Cohesion: 0.10
Nodes (30): collectDocMatches(), FindMatch, FindReplace, findReplaceKey, findStringMatches(), isWordChar(), mapTextOffset(), applyImageLayout() (+22 more)

### Community 25 - "admin/api.ts"
Cohesion: 0.12
Nodes (23): adminApi, AdminAttemptDetailAnswer, AdminAttemptDetailAnswerOption, AdminAttemptDetailQuestion, AdminAttemptSectionProgress, AdminChapter, AdminIndividualTest, AdminQuestion (+15 more)

### Community 26 - "index.ts"
Cohesion: 0.11
Nodes (32): Exam, ExamDocument, ExamSchema, TestAttempt, TestAttemptDocument, TestAttemptSchema, Question, QuestionDocument (+24 more)

### Community 28 - "ArticlesManager.tsx"
Cohesion: 0.14
Nodes (19): Category, ArticlesManager(), ArticlesManagerProps, AssignCategoriesModal(), AssignCategoriesModalProps, CategoriesManager(), CategoriesManagerProps, CategoryModal() (+11 more)

### Community 29 - "app.module.ts"
Cohesion: 0.11
Nodes (9): AuthModule, BlogModule, CommentsModule, ExamModule, LearnerAnalyticsModule, MediaModule, PaymentsModule, QuestionModule (+1 more)

### Community 30 - "insertBlock"
Cohesion: 0.10
Nodes (26): apiFetch(), escapeHtmlSnippet(), generateBilingualFromReference(), insertBlock(), insertExamPattern(), insertMarkdownSnippet(), insertTableOfContentsBlock(), loadMediaLibrary() (+18 more)

### Community 31 - "notifications.ts"
Cohesion: 0.17
Nodes (25): allCachedNotifications, AppNotification, buildCard(), currentItems, deduplicateClientNotifications(), fireUnreadToSystem(), getCurrentSelectedLang(), getFiredIds() (+17 more)

### Community 32 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @aws-sdk/s3-request-presigner@3.1159.0, cookie-parser@^1.4.7, dotenv@18.0.9, google-auth-library@11.3.2, jsonrepair@^3.15.0, mongoose@9.11.4, @nestjs/common@12.3.2 (+16 more)

### Community 33 - "LearnerAnalyticsService"
Cohesion: 0.14
Nodes (5): LearnerAnalyticsController, LearnerAnalyticsService, makeService(), studentA, studentB

### Community 34 - "test-series.dto.ts"
Cohesion: 0.09
Nodes (36): AssignSubjectInput, assignSubjectSchema, CreateChapterInput, createChapterSchema, CreateIndividualTestInput, createIndividualTestSchema, CreateQuestionMappingInput, createQuestionMappingSchema (+28 more)

### Community 35 - "AdminApp.tsx"
Cohesion: 0.14
Nodes (17): AdminApp(), AdminAppContent(), checkAuth(), AdminAppProps, AdminTab, brandParts(), IconName, NavButton() (+9 more)

### Community 36 - "editor"
Cohesion: 0.15
Nodes (23): addSeoKeyword(), applyImportedMarkdown(), applyKeywordsAndTags(), deleteOutlineBlock(), duplicateOutlineBlock(), editor, fillAuthorSelect(), fillTags() (+15 more)

### Community 37 - "notification.store.ts"
Cohesion: 0.11
Nodes (22): Notification, NotificationDocument, NotificationRead, NotificationReadDocument, NotificationReadSchema, NotificationSchema, User, UserDocument (+14 more)

### Community 38 - "comments.service.ts"
Cohesion: 0.14
Nodes (12): Comment, CommentDocument, CommentSchema, CommentStatus, commentStatuses, escapeRegex(), CreateCommentInput, createCommentSchema (+4 more)

### Community 39 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @dicebear/core@^10.7.0, @dicebear/styles@^10.6.0, dompurify@^3.4.17, react@^19.3.1, @tiptap/core@3.32.1, @tiptap/extension-placeholder@3.32.1, @tiptap/extension-table-row@3.32.1 (+16 more)

### Community 40 - "adminSession.ts"
Cohesion: 0.20
Nodes (18): formatWhen(), initials(), SessionPanel(), endSession(), signOutEverywhere(), signOutHere(), SessionPanelProps, DESK_PATH (+10 more)

### Community 41 - "ink-orbit-features.tsx"
Cohesion: 0.19
Nodes (20): Brackets(), chartPaths(), clamp(), CopyBlock(), D_FEATURES, FlowCard(), InkFeatureCopy, InkFeatures (+12 more)

### Community 42 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 43 - "cbt.ts"
Cohesion: 0.13
Nodes (19): Props, Props, Props, Props, Props, Props, Props, leaveExamFullscreen() (+11 more)

### Community 44 - "lib/api.ts"
Cohesion: 0.16
Nodes (9): AnalysisData, ChapterStrength, FilterButton(), FilterKey, OptionReview, QuestionReviewItem, SectionStat, TestResultAnalysis() (+1 more)

### Community 45 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, deploy, format, lint, migrate:pg-to-mongo, seed:test-series, start (+12 more)

### Community 46 - "contact.ts"
Cohesion: 0.18
Nodes (10): 1. Astro 5 Server-Side Rendering (SSR), 2. Instant Bilingual Language Swapping Pattern, 🛡️ Authentication & Security Model, 🎨 Frontend Architecture (`apps/client`), 🏛️ High-Level System Architecture, 📁 Monorepo Workspace Structure, Security Guardrails:, System Architecture (ARCHITECTURE.md) (+2 more)

### Community 47 - "StateFilterWidget.astro"
Cohesion: 0.11
Nodes (16): activeCatBadge, activeStateBadge, cards, categoriesList, categorySelect, filteredCount, livePosts, noResultsMsg (+8 more)

### Community 48 - "rank-predictor.astro"
Cohesion: 0.33
Nodes (5): CATEGORIES, EXAM_PRESETS, ExamConfig, RankPredictorIsland(), jsonLd

### Community 49 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, name (+10 more)

### Community 50 - "[id].astro"
Cohesion: 0.14
Nodes (14): TestSeriesExplorer(), CacheEntry, fetchPublicJson(), inFlightRequests, isUsableStale(), memoryCache, initialFullTests, SeriesSeo (+6 more)

### Community 51 - "TestSeriesDetail.tsx"
Cohesion: 0.12
Nodes (15): AssignedSubject, Chapter, LatestAttemptMeta, LearnerSeriesPrep, Props, PublishedTestItem, RealTestCard(), SectionSummary (+7 more)

### Community 52 - "bookmarks.ts"
Cohesion: 0.18
Nodes (16): Props, BookmarkedArticle, clearAllFavorites(), FavoriteArticle, getBookmarks, getFavorites(), isBookmarked, isFavorite() (+8 more)

### Community 53 - "parse-md.ts"
Cohesion: 0.12
Nodes (12): buckets, buf, CHAPTER_SLUG_MAP, __dirname, flushQuestion(), letterToIndex(), lines, MD_PATH (+4 more)

### Community 54 - "client/package.json"
Cohesion: 0.10
Nodes (19): @astrojs/node@11.1.9, dotenv@18.0.9, lenis@^1.3.27, marked@18.1.2, @tiptap/extension-link@3.32.1, @tiptap/extension-table@3.32.1, @tiptap/extension-table-cell@3.32.1, engines (+11 more)

### Community 55 - "blogData.ts"
Cohesion: 0.15
Nodes (12): difficultyColors, Props, Props, difficultyBadge, Props, ArticleSection, CodeSnippet, SubjectData (+4 more)

### Community 56 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.12
Nodes (15): 1. Frontend (`apps/client`), 2. Backend (`apps/server`), Option A: Instant Vercel Rollback (Frontend), Option B: Git Revert on `main`, Option C: Cloudflare Workers Rollback (Backend), 🔍 Post-Deployment Verification, 📋 Pre-Flight Checklist, Production Deployment Guide (DEPLOYMENT.md) (+7 more)

### Community 57 - "ProfileHub.tsx"
Cohesion: 0.14
Nodes (12): Attempt, AttemptAnswer, AttemptCard(), FilterPill(), LoadState, MetricBlock(), PassInfo, ProfileHub() (+4 more)

### Community 58 - "article-lang.ts"
Cohesion: 0.15
Nodes (28): applyImageStyle(), buildLangVersion(), cleanPlainText(), closeOpenLists(), computeImageDimensions(), extractDetailsItems(), extractHeadingItems(), extractParagraphItems() (+20 more)

### Community 59 - "@nestjs/mongoose"
Cohesion: 0.14
Nodes (13): PaymentOrder, PaymentOrderDocument, PaymentOrderSchema, TestSeriesPass, TestSeriesPassDocument, TestSeriesPassSchema, RazorpayOrder, QUIZ_TYPES (+5 more)

### Community 60 - "sharp.ts"
Cohesion: 0.17
Nodes (6): fitName(), formatName(), ResizeOptions, SharpMetadata, WebpOptions, WorkerSharpPipeline

### Community 61 - "DailyQuizService"
Cohesion: 0.16
Nodes (3): DailyQuizController, sanitizeCategory(), DailyQuizService

### Community 62 - "sitemap.astro"
Cohesion: 0.17
Nodes (11): corePages, fallbackArticles, jsonLd, links, liveCategories, LivePost, livePosts, noResults (+3 more)

### Community 63 - "PaymentService"
Cohesion: 0.11
Nodes (6): PaymentController, PaymentService, addCalendarMonths(), paymentSignature(), signaturesMatch(), webhookSignature()

### Community 64 - "question.service.ts"
Cohesion: 0.17
Nodes (14): baseQuestionSchema, CreateQuestionsInput, createQuestionsSchema, GenerateQuestionsAiInput, generateQuestionsAiSchema, optionSchema, ParseRawQuestionsAiInput, parseRawQuestionsAiSchema (+6 more)

### Community 65 - "handleEditorImagePaste"
Cohesion: 0.21
Nodes (14): fileFromDataUrl(), fileFromImageSource(), getImageFileDimensions(), handleEditorImageDrop(), handleEditorImagePaste(), imageFilesFromTransfer(), localImageSources(), normalizeImageFile() (+6 more)

### Community 66 - "editor-nodes.ts"
Cohesion: 0.15
Nodes (12): @tiptap/extension-image@3.32.1, @tiptap/extension-list@3.32.1, ArticleBulletList, ArticleImage, BulletStyle, bulletStyles, ImageAlignment, imageAlignments (+4 more)

### Community 67 - "blog.service.ts"
Cohesion: 0.11
Nodes (27): SCHEMA_MAP, Blog, BlogBlock, BlogBlockDocument, BlogBlockSchema, BlogDocument, BlogRevision, BlogRevisionDocument (+19 more)

### Community 68 - "4. Individual tests"
Cohesion: 0.06
Nodes (31): 4. Individual tests, Arithmetic & Percentages Chapter Test 01, Bihar BPSC Prelims Full Mock Test 01, Bihar BPSC Prelims Full Mock Test 02, Bihar General Knowledge Practice Test 02, Bihar History & Culture Chapter Test 02, Constitution & Governance Chapter Test 01, General Intelligence & Reasoning Practice Test 02 (+23 more)

### Community 69 - "blog-content.adapter.ts"
Cohesion: 0.13
Nodes (26): cleanAttributes(), DANGEROUS_ELEMENTS, decodeEntities(), isSafeUrl(), SAFE_ATTRIBUTES, SAFE_BLOCK_TAGS, SAFE_INLINE_TAGS, SAFE_LIST_TAGS (+18 more)

### Community 70 - "TestInstructions.tsx"
Cohesion: 0.10
Nodes (23): CheckoutResult, loadCheckoutScript(), openTestSeriesCheckout(), RazorpayCheckout, RazorpaySuccess, readError(), Window, Props (+15 more)

### Community 71 - "seed-test-series.mjs"
Cohesion: 0.10
Nodes (14): targetSlugs, __dirname, __filename, nodeEnv, runSeed(), seedPack, seedPackPath, toDeterministicObjectId() (+6 more)

### Community 72 - "TestAttemptsManager.tsx"
Cohesion: 0.20
Nodes (7): AdminAttemptDetail, AdminAttemptListItem, ErrorBoundaryProps, ErrorBoundaryState, TestAttemptsErrorBoundary, TestAttemptsManager(), TestAttemptsManagerContent()

### Community 73 - "useAdminToast"
Cohesion: 0.14
Nodes (13): Toast, ToastContext, ToastContextType, ToastType, useAdminToast(), CurrentUser, User, QuestionBankManager() (+5 more)

### Community 74 - "site.ts"
Cohesion: 0.06
Nodes (35): Props, uniqueId, [brandPrefix, ...brandRest], liveUpdates, Props, contactEmail, examPortals, govPortals (+27 more)

### Community 75 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @astrojs/check@0.9.12, tailwindcss@^4.3.3, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/turndown@^5.0.6, typescript@7.0.2, typescript (+5 more)

### Community 76 - "QuestionService"
Cohesion: 0.16
Nodes (4): TranslateExplainAiInput, QuestionService, editor, makeService()

### Community 77 - "executeImageInsertion"
Cohesion: 0.22
Nodes (11): closeArticleImageModal(), evaluateAltKeywordHealth(), executeImageInsertion(), getArticleFocusKeywords(), refreshSidebarArticleImages(), selectedImageAlign(), selectedImageLayout(), selectedImageWidth() (+3 more)

### Community 79 - "AuthPage.astro"
Cohesion: 0.22
Nodes (8): [brandPrefix, ...brandRest], Props, safeReturn, setupGoogleAuth(), safeDeskReturn(), AuthMode, AuthState, authStore

### Community 80 - "openSlashMenu"
Cohesion: 0.28
Nodes (9): checkSlashCommand(), closeSlashMenu(), executeSlashItem(), openSlashMenu(), placeFloating(), positionInlineBlockMenu(), positionSlashMenu(), renderSlashHighlight() (+1 more)

### Community 81 - "astro.config.mjs"
Cohesion: 0.25
Nodes (7): isBuild, @astrojs/react@7.1.2, @astrojs/vercel@11.0.17, @tailwindcss/vite@^4.3.3, @astrojs/react, @astrojs/vercel, @tailwindcss/vite

### Community 84 - "GovtPariksha Platform (ExamResource Monorepo)"
Cohesion: 0.15
Nodes (12): 1. Installation, 2. Environment Configuration, 3. Run Development Servers, 📜 Available Scripts, GovtPariksha Platform (ExamResource Monorepo), 🚀 Key Architectural & Performance Patterns, 🛠️ Local Development, Prerequisites (+4 more)

### Community 85 - "daily-quiz/index.astro"
Cohesion: 0.16
Nodes (12): DailyQuizQuestion, DailyQuizRunner(), EvaluatedQuestion, Props, QuizDataPayload, QuizEvaluationResult, availableQuizzes, jsonLd (+4 more)

### Community 86 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.13
Nodes (18): 🚢 Production Deployment Protocol, The Standard Deployment Sequence, 🚢 Production Deployment, The Deployment Commands:, ChapterSchema, __dirname, getModels(), main() (+10 more)

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

### Community 92 - "test-series.service.spec.ts"
Cohesion: 0.40
Nodes (4): admin, editor, makeService(), student

### Community 93 - "test-series.ts"
Cohesion: 0.40
Nodes (4): featureShortcuts, heroStats, MockExamCard, mockTestSeriesData

### Community 94 - "client/tsconfig.json"
Cohesion: 0.40
Nodes (4): exclude, extends, include, astro/tsconfigs/strict

### Community 95 - "NotificationService"
Cohesion: 0.17
Nodes (3): NotificationController, NotificationService, listRecentNotifications()

### Community 97 - "AdminLayout.astro"
Cohesion: 0.15
Nodes (5): backdrop, closeBtn, mobileBtn, Props, sidebar

### Community 98 - ".invalidateCache"
Cohesion: 0.29
Nodes (3): CreateCategoryInput, CreateTagInput, UpdateCategoryInput

### Community 107 - "blog.dto.ts"
Cohesion: 0.19
Nodes (14): blockTypes, blogLanguages, blogStatuses, CreateBlockInput, createBlockSchema, createBlogSchema, createCategorySchema, createTagSchema (+6 more)

### Community 109 - "POST"
Cohesion: 0.20
Nodes (9): ContactPayload, escapeHtml(), POST(), prerender, 📡 API Endpoints, 🔐 Architecture Overview, Authentication & Session Security (AUTH.md), 🍪 Cookie Configuration (+1 more)

### Community 110 - "CBTTestRunner.tsx"
Cohesion: 0.20
Nodes (13): CBTCodeOfConductModal(), Props, CBTKeyboardShortcutsModal(), Props, CBTOutline, CBTQuestionPaperModal(), CBTStatusShape(), CBTSubmitModal() (+5 more)

### Community 111 - "article-lang-swap.ts"
Cohesion: 0.24
Nodes (13): onArticleLangSwap(), persistLang(), Props, setupLangSwitchers(), softNavigate(), ArticleLangBundle, ArticleLangVersion, canSwapArticleLanguage() (+5 more)

### Community 114 - "1. Shell Components"
Cohesion: 0.20
Nodes (9): 1. Shell Components, 2. Content & Stream Components, Editorial 3-Column Grid (`.editorial-stream-grid`), GovtPariksha Reusable Component Catalog, `Header.astro`, `LeftSidebar.astro`, Notice Row Card (`.update-row-card`), `ProfileDropdown.astro` (+1 more)

### Community 115 - "2. Token Definitions"
Cohesion: 0.22
Nodes (8): 1. Palette Architecture, 2. Token Definitions, 3. Best Practices, A. Surface & Canvas, B. Typography Colors, C. Accent & Interactive, D. Institutional Blue & Cyan (Logo / Badges), GovtPariksha Colors & Palettes

### Community 140 - "GovtPariksha Master Design System"
Cohesion: 0.22
Nodes (8): 1. Design Philosophy, 2. Token Architecture Overview, 3. Editorial Aliases, 4. Typography Hierarchy, 5. Layout & Breakpoints, 6. Prohibited Anti-Patterns, Core Principles, GovtPariksha Master Design System

### Community 142 - "1. Font Families"
Cohesion: 0.29
Nodes (6): 1. Font Families, 1. `font-serif`: `EB Garamond`, 2. `font-sans`: `Inter` & `Geist`, 2. Typography Scale, 3. `font-hindi`: `Noto Sans Devanagari` & `Nirmala UI`, GovtPariksha Typography Guide

### Community 143 - "scanAndExtractImagesFromText"
Cohesion: 0.50
Nodes (4): normalizeNotionImageUrl(), openAiReferenceModal(), scanAndExtractImagesFromText(), updateAiRefCounters()

### Community 144 - "Blog & Article View (`/blogs`, `/[slug]`) Design Rules"
Cohesion: 0.50
Nodes (3): 1. Directory Page (`/blogs`), 2. Article Detail Page (`/[slug]`), Blog & Article View (`/blogs`, `/[slug]`) Design Rules

### Community 145 - "Blog Formatting & SEO Guidelines"
Cohesion: 0.14
Nodes (14): 10. Security and rendering rules for developers, 11. Example article template, 12. Pre-publish checklist, 13. Official documentation to consult, 1. Purpose and scope, 2. Recommended rendering strategy, 3. Standard article structure, 4. Formatting rules (+6 more)

### Community 146 - "Dashboard & Admin Pages Design Rules"
Cohesion: 0.50
Nodes (3): Dashboard & Admin Pages Design Rules, Guidelines, Scope

### Community 149 - "book.service.ts"
Cohesion: 0.20
Nodes (8): Book, BookDocument, BookSchema, BookModule, CreateBookInput, createBookSchema, UpdateBookInput, updateBookSchema

### Community 150 - "🚀 Frontend Performance Architecture (`apps/client`)"
Cohesion: 0.14
Nodes (13): 1. Vercel Edge HTTP Caching, 1. Zero Render-Blocking Third-Party Scripts, 2. Backend In-Memory Service Cache (`apps/server`), 2. Font Loading Strategy, 3. Critical CSS & Design Tokens, 3. Resilient SSR Fetching & Timeout Guardrails, 4. Image Optimization Rules, 5. Instant Bilingual Language Swapping (Zero Latency) (+5 more)

### Community 151 - "react"
Cohesion: 0.35
Nodes (7): BrandMark(), CBTGovtExamView(), formatClockParts(), CBTHeader(), formatTime(), Props, react

### Community 152 - "Homepage (`/`) Design Rules"
Cohesion: 0.50
Nodes (3): Constraints, Homepage (`/`) Design Rules, Structure

### Community 153 - "MongoDurableObject"
Cohesion: 0.23
Nodes (8): MongoDurableObject, sharp(), 1. Dual-Runtime Execution (Node.js & Cloudflare Workers), 2. Cloudflare Durable Object Database Proxy (`MONGO_DO`), 3. Media Pipeline: Direct-to-R2 Signed Uploads, ⚙️ Backend Architecture (`apps/server`), 🛠️ Cloudflare Worker Specifics, 🛠️ Cloudflare Worker Bundle & Cold-Start Optimization

### Community 155 - "CBTQuestionPanel.tsx"
Cohesion: 0.27
Nodes (8): CBTQuestionPanel, Props, questionText(), typeLabel(), CBTQuestionReportModal(), ISSUE_REASONS, Props, QuestionDetail

### Community 157 - "CBTCalculator.tsx"
Cohesion: 0.27
Nodes (9): CBTCalculator(), evaluateExpression(), Fn, formatResult(), FUNCTIONS, Op, Props, Tok (+1 more)

### Community 158 - "CBTPalette.tsx"
Cohesion: 0.42
Nodes (6): CBTFlagIcon(), CBTLegend, CBTPalette, Chevron(), chipClass(), isFlaggedStatus()

### Community 159 - "setupCommandSearch"
Cohesion: 0.67
Nodes (3): setupCommandSearch(), executeFilter(), resetAll()

### Community 160 - "Design System — takeUforward-Inspired Dark Theme"
Cohesion: 0.17
Nodes (12): 10. Do's and Don'ts, 11. Blog Content Guidelines, 12. Responsive Breakpoints, 1. Tailwind CSS v4 Architecture, 4. Spacing — Tailwind Classes, 5. Border Radius — Tailwind Classes, 6. Shadows — Tailwind Classes, 7. Z-Index — Tailwind Classes (+4 more)

### Community 161 - "blog.cache.spec.ts"
Cohesion: 0.29
Nodes (5): @nestjs/testing@12.3.2, supertest@7.3.1, AppModule, @nestjs/testing, supertest

### Community 162 - "gemini.service.ts"
Cohesion: 0.29
Nodes (6): extractCandidateText(), isRecord(), SeoOptimizationInput, SeoOptimizationOutput, TranslateArticleInput, TranslatedArticleOutput

### Community 167 - "server/README.md"
Cohesion: 0.18
Nodes (10): Authentication backend, Compile and run the project, Deployment, License, Observability, Project setup, Resources, Run tests (+2 more)

### Community 170 - "GovtPariksha Test Series Seed Pack"
Cohesion: 0.18
Nodes (10): 1. Test Series and subject hierarchy, 3. Question mappings, 5. Important ingestion rules, Bihar BPSC Prelims (`bihar-bpsc-prelims`), GovtPariksha Test Series Seed Pack, IBPS PO Complete Series (`ibps-po-complete`), RRB NTPC Graduate Level (`rrb-ntpc-graduate`), Seed summary (+2 more)

### Community 171 - "2. Complete Question Bank"
Cohesion: 0.18
Nodes (11): 2. Complete Question Bank, bg-001, bg-002, bg-003, bg-004, Bihar General Knowledge (`bihar-general-knowledge`), hi-001, hi-002 (+3 more)

### Community 175 - "client/AGENTS.md"
Cohesion: 0.22
Nodes (6): Development, Documentation, ⚠️ MANDATORY: Read Before ANY Frontend Task, Development, Documentation, ⚠️ MANDATORY: Read Before ANY Frontend Task

### Community 177 - "AI Development Guidelines & System Architecture (AGENTS.md)"
Cohesion: 0.20
Nodes (9): AI Development Guidelines & System Architecture (AGENTS.md), Critical Performance Guardrails:, graphify, Key Technical Characteristics, 🚨 Non-Negotiable Core Rules, ⚡ Performance & PageSpeed (95+ Requirement), 🏛️ System Architecture Summary, 🧪 Verification Commands (+1 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1174 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `@nestjs/mongoose` to `editor.astro`, `sitemap.astro`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **What connects `astro/tsconfigs/strict`, `./tsconfig.json` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `editor.astro` be split into smaller, more focused modules?**
  _Cohesion score 0.007662835249042145 - nodes in this community are weakly interconnected._
- **Why does `Post` connect `Post` to `AuthService`, `ExamService`, `CommentsService`, `.requireUser`, `QuestionController`, `PaymentService`, `MediaService`, `BookService`, `admin/api.ts`, `ArticlesManager.tsx`, `DailyQuizService`, `NotificationService`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Should `BlogService` be split into smaller, more focused modules?**
  _Cohesion score 0.14793741109530584 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `mongoose` to `dependencies`, `LearnerAnalyticsService`, `test-series.dto.ts`, `blog.service.ts`, `auth.service.ts`, `notification.store.ts`, `comments.service.ts`, `seed-test-series.mjs`, `durable-model.ts`, `DailyQuizService`, `server/package.json`, `exam.schema.ts`, `book.service.ts`, `seed-dsssb-tgt-cs.ts`, `migrate-pg-to-mongo.mjs`, `index.ts`, `@nestjs/mongoose`, `test-series.service.spec.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `AuthService` be split into smaller, more focused modules?**
  _Cohesion score 0.053763440860215055 - nodes in this community are weakly interconnected._