# Graph Report - examresource  (2026-10-28)

## Corpus Check
- 326 files · ~429,191 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: (none) 9, .example 2, .ttf 2)

## Summary
- 2981 nodes · 6459 edges · 170 communities (114 shown, 56 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 374 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b5645f18`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- editor.astro
- BlogService
- AuthService
- ExamService
- mongo-durable-object.ts
- CommentsService
- .requireUser
- CurrentUser
- QuestionController
- durable-model.ts
- Layout.astro
- payment.service.ts
- Post
- site.ts
- auth.service.ts
- server/package.json
- exam.schema.ts
- blogs.astro
- site.ts
- test-series.service.ts
- [slug].astro
- package.json
- syncFindHighlights
- comments.service.ts
- BookService
- admin/api.ts
- article-lang.ts
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
- NotificationService
- zod
- dependencies
- adminSession.ts
- ink-orbit-features.tsx
- compilerOptions
- CBTTestRunner.tsx
- TestInstructions.tsx
- scripts
- contact.ts
- StateFilterWidget.astro
- site.ts
- postgres
- GeminiService
- TestSeriesDetail.tsx
- bookmarks.ts
- parse-md.ts
- client/package.json
- blogData.ts
- seed-dsssb-tgt-cs.ts
- ProfileHub.tsx
- mongo-durable-object.ts
- article-reading.ts
- sharp.ts
- Production Deployment Guide (DEPLOYMENT.md)
- pricing.astro
- PaymentService
- MediaService
- handleEditorImagePaste
- editor-nodes.ts
- QuestionService
- 4. Individual tests
- Get
- mongoose
- seed-test-series.mjs
- TestAttemptsManager.tsx
- sitemap.astro
- blog.dto.ts
- devDependencies
- TestResultAnalysis.tsx
- executeImageInsertion
- .listPublishedTests
- test-series.service.spec.ts
- openSlashMenu
- astro.config.mjs
- lib/api.ts
- question.dto.ts
- GovtPariksha Platform (ExamResource Monorepo)
- daily-quiz/index.astro
- blog-content.adapter.ts
- oxlint.json
- migrate-pg-to-mongo.mjs
- tsconfig.build.json
- scripts
- nest-cli.json
- article-lang-swap.ts
- test-series.ts
- client/tsconfig.json
- AppService
- AdSlot.astro
- AdminLayout.astro
- scanAndExtractImagesFromText
- cloudflare-workers.d.ts
- gemini.service.ts
- blog/TableOfContents.astro
- examArticle.ts
- middleware.ts
- cloudflare-node.d.ts
- tsconfig.json
- rank-predictor.astro
- blog.cache.spec.ts
- CBTHeader.tsx
- @tiptap/core
- @tiptap/extension-table
- daily-quiz-seed.ts
- dompurify
- lenis
- marked
- AdPlaceholder.astro
- Breadcrumb.astro
- FAQSection.astro
- RelatedArticles.astro
- components/TableOfContents.astro
- [subject].astro
- [topic].astro
- hideArticlePreview
- @tiptap/extension-placeholder@^3.32.0
- @tiptap/extension-table-header@^3.32.0
- @tiptap/extension-underline@^3.32.0
- turndown
- zustand
- Blog Formatting & SEO Guidelines
- 🚀 Frontend Performance Architecture (`apps/client`)
- MongoDurableObject
- Design System — takeUforward-Inspired Dark Theme
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
7. `TestSeriesController` - 49 edges
8. `@nestjs/common` - 48 edges
9. `react` - 41 edges
10. `@nestjs/mongoose` - 40 edges

## Surprising Connections (you probably didn't know these)
- `Key Technical Characteristics` --references--> `MongoDurableObject`  [INFERRED]
  AGENTS.md → apps/server/src/core/database/mongo-durable-object.ts
- `🚀 Key Architectural & Performance Patterns` --references--> `MongoDurableObject`  [INFERRED]
  README.md → apps/server/src/core/database/mongo-durable-object.ts
- `📚 Version 2 Architecture & Branching (`feat/textbook-v2`)` --references--> `main()`  [INFERRED]
  AGENTS.md → seed/dsssb-tgt-cs/seed-dsssb-tgt-cs.ts
- `Option B: Git Revert on `main`` --references--> `main()`  [INFERRED]
  docs/DEPLOYMENT.md → seed/dsssb-tgt-cs/seed-dsssb-tgt-cs.ts
- `🔍 Post-Deployment Verification` --references--> `main()`  [INFERRED]
  docs/DEPLOYMENT.md → seed/dsssb-tgt-cs/seed-dsssb-tgt-cs.ts

## Import Cycles
- None detected.

## Communities (170 total, 56 thin omitted)

### Community 0 - "editor.astro"
Cohesion: 0.01
Nodes (231): acceptedImageTypes, activeFocusKeywords, addFaqRowBtn, addKeywordBtn, addKeywordInput, aiRefApplyCompareBtn, aiRefBottomCountBadge, aiRefBtnLabel (+223 more)

### Community 1 - "BlogService"
Cohesion: 0.15
Nodes (5): blocksToHtml(), htmlToBlocks(), syncImageBlocks(), BlogService, CreateBlockInput

### Community 2 - "AuthService"
Cohesion: 0.06
Nodes (18): AuthController, SessionRequest, makeService(), AuthService, email, forgotPasswordSchema, loginSchema, password (+10 more)

### Community 3 - "ExamService"
Cohesion: 0.07
Nodes (12): CreateExamInput, createExamSchema, SaveAnswerInput, saveAnswerSchema, testQuestionSchema, UpdateExamInput, updateExamSchema, UpdateSectionProgressInput (+4 more)

### Community 4 - "mongo-durable-object.ts"
Cohesion: 0.11
Nodes (26): Blog, BlogBlock, BlogBlockDocument, BlogBlockSchema, BlogDocument, BlogRevision, BlogRevisionDocument, BlogRevisionSchema (+18 more)

### Community 5 - "CommentsService"
Cohesion: 0.07
Nodes (15): addText(), createComment(), formatDate(), initialize(), handleDelete(), handleEdit(), load(), onLanguageChange() (+7 more)

### Community 7 - "CurrentUser"
Cohesion: 0.13
Nodes (4): CurrentUser, CreateIndividualTestInput, ListIndividualTestsQueryInput, TestSeriesService

### Community 9 - "durable-model.ts"
Cohesion: 0.09
Nodes (19): DatabaseModule, createDurableConnection(), createDurableModelProxy(), DurableQuery, enableWorkerDatabaseProxy(), executeDatabaseOperation(), getMongoDOStub(), isWorkerDatabaseProxyEnabled() (+11 more)

### Community 10 - "Layout.astro"
Cohesion: 0.10
Nodes (35): API_URL, applyOptimisticAuth(), closeAllDropdowns(), closeDropdown(), closeMobileDrawer(), closeSearchModal(), domainDotIndex, handleGlobalClick() (+27 more)

### Community 11 - "payment.service.ts"
Cohesion: 0.16
Nodes (12): PaymentOrder, PaymentOrderDocument, PaymentOrderSchema, TestSeriesPass, TestSeriesPassDocument, TestSeriesPassSchema, RazorpayOrder, QUIZ_TYPES (+4 more)

### Community 13 - "site.ts"
Cohesion: 0.09
Nodes (18): siteName, siteUrl, fetchPublicJson(), popularCategories, jsonLd, sections, jsonLd, sections (+10 more)

### Community 14 - "auth.service.ts"
Cohesion: 0.08
Nodes (33): EmailVerificationToken, EmailVerificationTokenDocument, EmailVerificationTokenSchema, OauthState, OauthStateDocument, OauthStateSchema, PasswordResetToken, PasswordResetTokenDocument (+25 more)

### Community 15 - "server/package.json"
Cohesion: 0.06
Nodes (43): author, dotenv@18.0.9, description, devDependencies, @nestjs/cli@12.0.11, @nestjs/mau@0.2.9, @nestjs/schematics@12.0.11, oxlint@1.90.0 (+35 more)

### Community 16 - "exam.schema.ts"
Cohesion: 0.21
Nodes (14): AttemptAnswer, AttemptAnswerSchema, AttemptSectionProgress, AttemptSectionProgressSchema, ExamQuestionItem, ExamQuestionItemSchema, ExamSection, ExamSectionSchema (+6 more)

### Community 17 - "blogs.astro"
Cohesion: 0.07
Nodes (34): getDisplayedArticleLang(), refreshListingCardsInPlace(), setLanguage(), softNavigate(), syncListingCardLinks(), AppLang, appLangToBlogLanguage(), articleHref() (+26 more)

### Community 18 - "site.ts"
Cohesion: 0.07
Nodes (23): [brandPrefix, ...brandRest], Props, safeReturn, setupGoogleAuth(), Props, uniqueId, Props, [brandPrefix, ...brandRest] (+15 more)

### Community 19 - "test-series.service.ts"
Cohesion: 0.13
Nodes (18): ExamDocument, TestAttemptDocument, Question, QuestionDocument, QuestionOption, QuestionOptionSchema, ReportedQuestion, ReportedQuestionDocument (+10 more)

### Community 20 - "[slug].astro"
Cohesion: 0.07
Nodes (26): Props, Props, blogLanguageToAppLang(), filterAndSlice(), getCachedRecentPostsSync(), getRecentPosts(), ListingPost, memoryCache (+18 more)

### Community 21 - "package.json"
Cohesion: 0.07
Nodes (37): dependencies, jsonrepair@^3.15.0, devDependencies, concurrently@10.0.6, @dietrichgebert/ponytail@^5.3.2, eslint@^10.13.0, eslint-plugin-sonarjs@^4.2.2, prettier@^3.9.10 (+29 more)

### Community 22 - "syncFindHighlights"
Cohesion: 0.10
Nodes (30): collectDocMatches(), FindMatch, FindReplace, findReplaceKey, findStringMatches(), isWordChar(), mapTextOffset(), applyImageLayout() (+22 more)

### Community 23 - "comments.service.ts"
Cohesion: 0.08
Nodes (21): createApplication(), env, EnvSchema, Comment, CommentDocument, CommentSchema, CommentStatus, commentStatuses (+13 more)

### Community 25 - "admin/api.ts"
Cohesion: 0.09
Nodes (35): Toast, ToastContext, ToastContextType, ToastType, useAdminToast(), adminApi, AdminAttemptDetailAnswer, AdminAttemptDetailAnswerOption (+27 more)

### Community 26 - "article-lang.ts"
Cohesion: 0.14
Nodes (29): applyImageStyle(), ArticleLangBundle, ArticleLangVersion, buildLangVersion(), cleanPlainText(), closeOpenLists(), computeImageDimensions(), extractDetailsItems() (+21 more)

### Community 28 - "ArticlesManager.tsx"
Cohesion: 0.14
Nodes (20): Category, ArticlesManager(), ArticlesManagerProps, AssignCategoriesModal(), AssignCategoriesModalProps, CategoriesManager(), CategoriesManagerProps, CategoryModal() (+12 more)

### Community 29 - "app.module.ts"
Cohesion: 0.07
Nodes (19): AppModule, Book, BookDocument, BookSchema, AuthModule, BlogModule, BookModule, CreateBookInput (+11 more)

### Community 30 - "insertBlock"
Cohesion: 0.10
Nodes (26): apiFetch(), escapeHtmlSnippet(), generateBilingualFromReference(), insertBlock(), insertExamPattern(), insertMarkdownSnippet(), insertTableOfContentsBlock(), loadMediaLibrary() (+18 more)

### Community 31 - "notifications.ts"
Cohesion: 0.17
Nodes (23): AppNotification, buildCard(), currentItems, deduplicateClientNotifications(), fireUnreadToSystem(), getCurrentSelectedLang(), getFiredIds(), getGuestReadIds() (+15 more)

### Community 32 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @aws-sdk/client-s3@3.1157.0, @aws-sdk/s3-request-presigner@3.1157.0, cookie-parser@^1.4.7, google-auth-library@^11.3.1, jsonrepair@^3.15.0, mongoose@9.11.4, @nestjs/common@12.3.2 (+18 more)

### Community 34 - "test-series.dto.ts"
Cohesion: 0.08
Nodes (34): AssignSubjectInput, assignSubjectSchema, CreateChapterInput, createChapterSchema, createIndividualTestSchema, CreateQuestionMappingInput, createQuestionMappingSchema, CreateSubjectInput (+26 more)

### Community 35 - "AdminApp.tsx"
Cohesion: 0.12
Nodes (18): AdminApp(), AdminAppContent(), checkAuth(), AdminAppProps, AdminTab, brandParts(), IconName, NavButton() (+10 more)

### Community 36 - "editor"
Cohesion: 0.15
Nodes (23): addSeoKeyword(), applyImportedMarkdown(), applyKeywordsAndTags(), deleteOutlineBlock(), duplicateOutlineBlock(), editor, fillAuthorSelect(), fillTags() (+15 more)

### Community 37 - "NotificationService"
Cohesion: 0.17
Nodes (3): NotificationController, NotificationService, listRecentNotifications()

### Community 38 - "zod"
Cohesion: 0.07
Nodes (22): DailyQuiz, DailyQuizAttempt, DailyQuizAttemptDocument, DailyQuizAttemptSchema, DailyQuizBilingualText, DailyQuizBilingualTextSchema, DailyQuizDocument, DailyQuizOption (+14 more)

### Community 39 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, astro@7.4.2, @astrojs/node@11.1.9, @dicebear/core@^10.7.0, @dicebear/styles@^10.6.0, dotenv@18.0.9, react@^19.3.1, @tiptap/extension-table-cell@^3.32.0 (+13 more)

### Community 40 - "adminSession.ts"
Cohesion: 0.21
Nodes (18): formatWhen(), initials(), SessionPanel(), endSession(), signOutEverywhere(), signOutHere(), SessionPanelProps, DESK_PATH (+10 more)

### Community 41 - "ink-orbit-features.tsx"
Cohesion: 0.19
Nodes (20): Brackets(), chartPaths(), clamp(), CopyBlock(), D_FEATURES, FlowCard(), InkFeatureCopy, InkFeatures (+12 more)

### Community 42 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 43 - "CBTTestRunner.tsx"
Cohesion: 0.07
Nodes (48): CBTCalculator(), evaluateExpression(), Fn, formatResult(), FUNCTIONS, Op, Props, Tok (+40 more)

### Community 44 - "TestInstructions.tsx"
Cohesion: 0.14
Nodes (14): CheckoutResult, loadCheckoutScript(), openTestSeriesCheckout(), RazorpayCheckout, RazorpaySuccess, readError(), Window, Props (+6 more)

### Community 45 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, deploy, format, lint, migrate:pg-to-mongo, seed:test-series, start (+12 more)

### Community 46 - "contact.ts"
Cohesion: 0.11
Nodes (17): escapeHtml(), POST(), 1. Astro 5 Server-Side Rendering (SSR), 2. Instant Bilingual Language Swapping Pattern, 🛡️ Authentication & Security Model, 🎨 Frontend Architecture (`apps/client`), 🏛️ High-Level System Architecture, 📁 Monorepo Workspace Structure (+9 more)

### Community 47 - "StateFilterWidget.astro"
Cohesion: 0.11
Nodes (16): activeCatBadge, activeStateBadge, cards, categoriesList, categorySelect, filteredCount, livePosts, noResultsMsg (+8 more)

### Community 48 - "site.ts"
Cohesion: 0.08
Nodes (24): [brandPrefix, ...brandRest], liveUpdates, Props, contactEmail, examPortals, govPortals, searchItems, siteFaqs (+16 more)

### Community 49 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, name (+10 more)

### Community 51 - "TestSeriesDetail.tsx"
Cohesion: 0.12
Nodes (14): AssignedSubject, CardFilter, Chapter, LatestAttemptMeta, LearnerSeriesPrep, Props, PublishedTestItem, RealTestCard() (+6 more)

### Community 52 - "bookmarks.ts"
Cohesion: 0.18
Nodes (16): Props, BookmarkedArticle, clearAllFavorites(), FavoriteArticle, getBookmarks, getFavorites(), isBookmarked, isFavorite() (+8 more)

### Community 53 - "parse-md.ts"
Cohesion: 0.12
Nodes (12): buckets, buf, CHAPTER_SLUG_MAP, __dirname, flushQuestion(), letterToIndex(), lines, MD_PATH (+4 more)

### Community 54 - "client/package.json"
Cohesion: 0.12
Nodes (15): react-dom@^19.3.1, @tiptap/extension-character-count@^3.32.0, @tiptap/extension-link@^3.32.0, @tiptap/starter-kit@^3.32.0, @vercel/analytics@^2.0.1, engines, node, name (+7 more)

### Community 55 - "blogData.ts"
Cohesion: 0.15
Nodes (12): difficultyColors, Props, Props, difficultyBadge, Props, ArticleSection, CodeSnippet, SubjectData (+4 more)

### Community 56 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.13
Nodes (18): 🚢 Production Deployment Protocol, The Standard Deployment Sequence, 🚢 Production Deployment, The Deployment Commands:, ChapterSchema, __dirname, getModels(), main() (+10 more)

### Community 57 - "ProfileHub.tsx"
Cohesion: 0.15
Nodes (12): Attempt, AttemptAnswer, AttemptCard(), FilterPill(), LoadState, MetricBlock(), PassInfo, ProfileHub() (+4 more)

### Community 58 - "mongo-durable-object.ts"
Cohesion: 0.25
Nodes (18): SCHEMA_MAP, Exam, ExamSchema, TestAttemptSchema, QuestionSchema, ReportedQuestionSchema, SavedQuestionSchema, Chapter (+10 more)

### Community 59 - "article-reading.ts"
Cohesion: 0.15
Nodes (22): Props, rawLines, articleElement(), bindCodeCopy(), bindLightbox(), detectLanguage(), enhanceCodeBlocks(), ensureLightbox() (+14 more)

### Community 60 - "sharp.ts"
Cohesion: 0.17
Nodes (6): fitName(), formatName(), ResizeOptions, SharpMetadata, WebpOptions, WorkerSharpPipeline

### Community 61 - "Production Deployment Guide (DEPLOYMENT.md)"
Cohesion: 0.12
Nodes (15): 1. Frontend (`apps/client`), 2. Backend (`apps/server`), Option A: Instant Vercel Rollback (Frontend), Option B: Git Revert on `main`, Option C: Cloudflare Workers Rollback (Backend), 🔍 Post-Deployment Verification, 📋 Pre-Flight Checklist, Production Deployment Guide (DEPLOYMENT.md) (+7 more)

### Community 62 - "pricing.astro"
Cohesion: 0.17
Nodes (12): fallbackOffer, formatRupees(), loadPassOffer(), PassOffer, jsonLd, listPrice, price, save (+4 more)

### Community 63 - "PaymentService"
Cohesion: 0.10
Nodes (7): PaymentController, PaymentService, student, addCalendarMonths(), paymentSignature(), signaturesMatch(), webhookSignature()

### Community 65 - "handleEditorImagePaste"
Cohesion: 0.21
Nodes (14): fileFromDataUrl(), fileFromImageSource(), getImageFileDimensions(), handleEditorImageDrop(), handleEditorImagePaste(), imageFilesFromTransfer(), localImageSources(), normalizeImageFile() (+6 more)

### Community 66 - "editor-nodes.ts"
Cohesion: 0.15
Nodes (12): @tiptap/extension-image@^3.32.0, @tiptap/extension-list@3.32.0, ArticleBulletList, ArticleImage, BulletStyle, bulletStyles, ImageAlignment, imageAlignments (+4 more)

### Community 67 - "QuestionService"
Cohesion: 0.16
Nodes (4): TranslateExplainAiInput, QuestionService, editor, makeService()

### Community 68 - "4. Individual tests"
Cohesion: 0.06
Nodes (31): 4. Individual tests, Arithmetic & Percentages Chapter Test 01, Bihar BPSC Prelims Full Mock Test 01, Bihar BPSC Prelims Full Mock Test 02, Bihar General Knowledge Practice Test 02, Bihar History & Culture Chapter Test 02, Constitution & Governance Chapter Test 01, General Intelligence & Reasoning Practice Test 02 (+23 more)

### Community 70 - "mongoose"
Cohesion: 0.23
Nodes (6): student, makeService(), studentA, studentB, mongoose, vitest

### Community 71 - "seed-test-series.mjs"
Cohesion: 0.12
Nodes (12): targetSlugs, __dirname, __filename, nodeEnv, runSeed(), seedPack, seedPackPath, toDeterministicObjectId() (+4 more)

### Community 72 - "TestAttemptsManager.tsx"
Cohesion: 0.20
Nodes (7): AdminAttemptDetail, AdminAttemptListItem, ErrorBoundaryProps, ErrorBoundaryState, TestAttemptsErrorBoundary, TestAttemptsManager(), TestAttemptsManagerContent()

### Community 73 - "sitemap.astro"
Cohesion: 0.17
Nodes (11): corePages, fallbackArticles, jsonLd, links, liveCategories, LivePost, livePosts, noResults (+3 more)

### Community 74 - "blog.dto.ts"
Cohesion: 0.14
Nodes (17): blockTypes, blogLanguages, blogStatuses, createBlockSchema, CreateBlogInput, createBlogSchema, CreateCategoryInput, createCategorySchema (+9 more)

### Community 75 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @astrojs/check@0.9.12, tailwindcss@^4.3.3, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/turndown@^5.0.6, typescript@^6.0.3, typescript (+5 more)

### Community 76 - "TestResultAnalysis.tsx"
Cohesion: 0.17
Nodes (9): AnalysisData, ChapterStrength, FilterButton(), FilterKey, OptionReview, QuestionReviewItem, SectionStat, TestResultAnalysis() (+1 more)

### Community 77 - "executeImageInsertion"
Cohesion: 0.22
Nodes (11): closeArticleImageModal(), evaluateAltKeywordHealth(), executeImageInsertion(), getArticleFocusKeywords(), refreshSidebarArticleImages(), selectedImageAlign(), selectedImageLayout(), selectedImageWidth() (+3 more)

### Community 79 - "test-series.service.spec.ts"
Cohesion: 0.40
Nodes (4): admin, editor, makeService(), student

### Community 80 - "openSlashMenu"
Cohesion: 0.28
Nodes (9): checkSlashCommand(), closeSlashMenu(), executeSlashItem(), openSlashMenu(), placeFloating(), positionInlineBlockMenu(), positionSlashMenu(), renderSlashHighlight() (+1 more)

### Community 81 - "astro.config.mjs"
Cohesion: 0.25
Nodes (7): isBuild, @astrojs/react@7.1.1, @astrojs/vercel@11.0.16, @tailwindcss/vite@^4.3.3, @astrojs/react, @astrojs/vercel, @tailwindcss/vite

### Community 82 - "lib/api.ts"
Cohesion: 0.17
Nodes (10): ISSUE_REASONS, Props, CATEGORIES, StudentTestSeries, TestSeriesExplorer(), TestSeriesExplorerProps, API_URL, escapeXml() (+2 more)

### Community 83 - "question.dto.ts"
Cohesion: 0.17
Nodes (14): baseQuestionSchema, CreateQuestionsInput, createQuestionsSchema, GenerateQuestionsAiInput, generateQuestionsAiSchema, optionSchema, ParseRawQuestionsAiInput, parseRawQuestionsAiSchema (+6 more)

### Community 84 - "GovtPariksha Platform (ExamResource Monorepo)"
Cohesion: 0.15
Nodes (12): 1. Installation, 2. Environment Configuration, 3. Run Development Servers, 📜 Available Scripts, GovtPariksha Platform (ExamResource Monorepo), 🚀 Key Architectural & Performance Patterns, 🛠️ Local Development, Prerequisites (+4 more)

### Community 85 - "daily-quiz/index.astro"
Cohesion: 0.15
Nodes (10): DailyQuizQuestion, DailyQuizRunner(), EvaluatedQuestion, Props, QuizEvaluationResult, jsonLd, QuizData, QuizQuestion (+2 more)

### Community 86 - "blog-content.adapter.ts"
Cohesion: 0.26
Nodes (15): BlockRecord, cleanHtmlEntities(), escapeHtml(), findTargetInsertionIndex(), guessCodeLanguage(), isHeadingBlock(), parseBlockFromTag(), readImageTag() (+7 more)

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

### Community 92 - "article-lang-swap.ts"
Cohesion: 0.19
Nodes (15): onArticleLangSwap(), persistLang(), Props, setupLangSwitchers(), softNavigate(), Props, canSwapArticleLanguage(), escapeAttr() (+7 more)

### Community 93 - "test-series.ts"
Cohesion: 0.40
Nodes (4): featureShortcuts, heroStats, MockExamCard, mockTestSeriesData

### Community 94 - "client/tsconfig.json"
Cohesion: 0.40
Nodes (4): exclude, extends, include, astro/tsconfigs/strict

### Community 97 - "AdminLayout.astro"
Cohesion: 0.15
Nodes (5): backdrop, closeBtn, mobileBtn, Props, sidebar

### Community 98 - "scanAndExtractImagesFromText"
Cohesion: 0.50
Nodes (4): normalizeNotionImageUrl(), openAiReferenceModal(), scanAndExtractImagesFromText(), updateAiRefCounters()

### Community 100 - "gemini.service.ts"
Cohesion: 0.29
Nodes (6): extractCandidateText(), isRecord(), SeoOptimizationInput, SeoOptimizationOutput, TranslateArticleInput, TranslatedArticleOutput

### Community 106 - "rank-predictor.astro"
Cohesion: 0.33
Nodes (5): CATEGORIES, EXAM_PRESETS, ExamConfig, RankPredictorIsland(), jsonLd

### Community 107 - "blog.cache.spec.ts"
Cohesion: 0.40
Nodes (4): @nestjs/testing@12.3.2, supertest@7.3.1, @nestjs/testing, supertest

### Community 108 - "CBTHeader.tsx"
Cohesion: 0.48
Nodes (4): BrandMark(), CBTHeader(), formatTime(), Props

### Community 145 - "Blog Formatting & SEO Guidelines"
Cohesion: 0.14
Nodes (14): 10. Security and rendering rules for developers, 11. Example article template, 12. Pre-publish checklist, 13. Official documentation to consult, 1. Purpose and scope, 2. Recommended rendering strategy, 3. Standard article structure, 4. Formatting rules (+6 more)

### Community 150 - "🚀 Frontend Performance Architecture (`apps/client`)"
Cohesion: 0.14
Nodes (13): 1. Vercel Edge HTTP Caching, 1. Zero Render-Blocking Third-Party Scripts, 2. Backend In-Memory Service Cache (`apps/server`), 2. Font Loading Strategy, 3. Critical CSS & Design Tokens, 3. Resilient SSR Fetching & Timeout Guardrails, 4. Image Optimization Rules, 5. Instant Bilingual Language Swapping (Zero Latency) (+5 more)

### Community 153 - "MongoDurableObject"
Cohesion: 0.24
Nodes (8): MongoDurableObject, sharp(), 1. Dual-Runtime Execution (Node.js & Cloudflare Workers), 2. Cloudflare Durable Object Database Proxy (`MONGO_DO`), 3. Media Pipeline: Direct-to-R2 Signed Uploads, ⚙️ Backend Architecture (`apps/server`), 🛠️ Cloudflare Worker Specifics, 🛠️ Cloudflare Worker Bundle & Cold-Start Optimization

### Community 160 - "Design System — takeUforward-Inspired Dark Theme"
Cohesion: 0.17
Nodes (12): 10. Do's and Don'ts, 11. Blog Content Guidelines, 12. Responsive Breakpoints, 1. Tailwind CSS v4 Architecture, 4. Spacing — Tailwind Classes, 5. Border Radius — Tailwind Classes, 6. Shadows — Tailwind Classes, 7. Z-Index — Tailwind Classes (+4 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1114 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `payment.service.ts` to `editor.astro`, `sitemap.astro`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **What connects `astro/tsconfigs/strict`, `./tsconfig.json` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `editor.astro` be split into smaller, more focused modules?**
  _Cohesion score 0.007662835249042145 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `mongoose` to `dependencies`, `seed-dsssb-tgt-cs.ts`, `mongo-durable-object.ts`, `zod`, `seed-test-series.mjs`, `durable-model.ts`, `payment.service.ts`, `auth.service.ts`, `server/package.json`, `exam.schema.ts`, `test-series.service.spec.ts`, `daily-quiz-seed.ts`, `test-series.service.ts`, `comments.service.ts`, `migrate-pg-to-mongo.mjs`, `mongo-durable-object.ts`, `app.module.ts`, `PaymentService`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Should `BlogService` be split into smaller, more focused modules?**
  _Cohesion score 0.14935988620199148 - nodes in this community are weakly interconnected._
- **Why does `Post` connect `Post` to `MediaService`, `AuthService`, `ExamService`, `CommentsService`, `zod`, `NotificationService`, `QuestionController`, `.requireUser`, `BookService`, `admin/api.ts`, `ArticlesManager.tsx`, `PaymentService`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `AuthService` be split into smaller, more focused modules?**
  _Cohesion score 0.059097127222982215 - nodes in this community are weakly interconnected._