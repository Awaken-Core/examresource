# Graph Report - examresource  (2026-10-29)

## Corpus Check
- 328 files · ~432,458 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: (none) 9, .example 2, .ttf 2)

## Summary
- 3001 nodes · 6512 edges · 176 communities (124 shown, 52 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 375 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0be21829`
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
- QuestionService
- durable-model.ts
- Layout.astro
- payment.service.ts
- DailyQuizService
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
- @nestjs/common
- BookService
- admin/api.ts
- article-reading.ts
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
- Post
- zod
- dependencies
- adminSession.ts
- ink-orbit-features.tsx
- compilerOptions
- react
- TestInstructions.tsx
- scripts
- contact.ts
- StateFilterWidget.astro
- AuthPage.astro
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
- article-lang.ts
- sharp.ts
- Production Deployment Guide (DEPLOYMENT.md)
- pricing.astro
- PaymentService
- MediaService
- apiFetch
- editor-nodes.ts
- blog.module.ts
- 4. Individual tests
- Get
- contact-us.astro
- seed-test-series.mjs
- TestAttemptsManager.tsx
- sitemap.astro
- blog.dto.ts
- devDependencies
- TestResultAnalysis.tsx
- evaluateAltKeywordHealth
- .listPublishedTests
- test-series.service.spec.ts
- openSlashMenu
- astro.config.mjs
- sitemap.xml.ts
- mongoose
- GovtPariksha Platform (ExamResource Monorepo)
- daily-quiz/index.astro
- setupCommandSearch
- oxlint.json
- migrate-pg-to-mongo.mjs
- tsconfig.build.json
- scripts
- nest-cli.json
- blog-content.adapter.ts
- test-series.ts
- client/tsconfig.json
- useAdminToast
- AdSlot.astro
- AdminLayout.astro
- article-lang-swap.ts
- cloudflare-workers.d.ts
- cbt.ts
- blog/TableOfContents.astro
- examArticle.ts
- middleware.ts
- cloudflare-node.d.ts
- tsconfig.json
- rank-predictor.astro
- DurableQuery
- CBTHeader.tsx
- POST
- @tiptap/core
- @tiptap/extension-table
- CBTQuestionPanel.tsx
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
- AppService
- CBTCalculator.tsx
- blog.cache.spec.ts
- serializer.ts
- 🚀 Frontend Performance Architecture (`apps/client`)
- 🔑 Production Environment Variables
- bindFaqAccordion
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
- `Security Guardrails:` --references--> `POST()`  [INFERRED]
  docs/ARCHITECTURE.md → apps/client/src/pages/api/contact.ts
- `Key Technical Characteristics` --references--> `MongoDurableObject`  [INFERRED]
  AGENTS.md → apps/server/src/core/database/mongo-durable-object.ts
- `🚀 Key Architectural & Performance Patterns` --references--> `MongoDurableObject`  [INFERRED]
  README.md → apps/server/src/core/database/mongo-durable-object.ts
- `📚 Version 2 Architecture & Branching (`feat/textbook-v2`)` --references--> `main()`  [INFERRED]
  AGENTS.md → seed/dsssb-tgt-cs/seed-dsssb-tgt-cs.ts
- `📋 Ongoing Performance Maintenance Checklist` --references--> `main()`  [INFERRED]
  docs/PERFORMANCE.md → seed/dsssb-tgt-cs/seed-dsssb-tgt-cs.ts

## Import Cycles
- None detected.

## Communities (176 total, 52 thin omitted)

### Community 0 - "editor.astro"
Cohesion: 0.01
Nodes (231): acceptedImageTypes, activeFocusKeywords, addFaqRowBtn, addKeywordBtn, addKeywordInput, aiRefApplyCompareBtn, aiRefBottomCountBadge, aiRefBtnLabel (+223 more)

### Community 1 - "BlogService"
Cohesion: 0.13
Nodes (3): syncImageBlocks(), BlogService, CreateBlockInput

### Community 2 - "AuthService"
Cohesion: 0.06
Nodes (18): AuthController, SessionRequest, makeService(), AuthService, email, forgotPasswordSchema, loginSchema, password (+10 more)

### Community 3 - "ExamService"
Cohesion: 0.07
Nodes (12): CreateExamInput, createExamSchema, SaveAnswerInput, saveAnswerSchema, testQuestionSchema, UpdateExamInput, updateExamSchema, UpdateSectionProgressInput (+4 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.11
Nodes (22): EmailVerificationToken, EmailVerificationTokenDocument, EmailVerificationTokenSchema, OauthState, OauthStateDocument, OauthStateSchema, PasswordResetToken, PasswordResetTokenDocument (+14 more)

### Community 5 - "CommentsService"
Cohesion: 0.07
Nodes (14): addText(), createComment(), formatDate(), initialize(), handleDelete(), handleEdit(), load(), onLanguageChange() (+6 more)

### Community 7 - "CurrentUser"
Cohesion: 0.14
Nodes (3): CurrentUser, UpdateIndividualTestInput, TestSeriesService

### Community 8 - "QuestionService"
Cohesion: 0.07
Nodes (19): baseQuestionSchema, CreateQuestionsInput, createQuestionsSchema, GenerateQuestionsAiInput, generateQuestionsAiSchema, optionSchema, ParseRawQuestionsAiInput, parseRawQuestionsAiSchema (+11 more)

### Community 9 - "durable-model.ts"
Cohesion: 0.21
Nodes (11): createDurableConnection(), createDurableModelProxy(), enableWorkerDatabaseProxy(), getMongoDOStub(), isWorkerDatabaseProxyEnabled(), mongoDONamespaceContext, runWithMongoDONamespace(), setMongoDOStub() (+3 more)

### Community 10 - "Layout.astro"
Cohesion: 0.09
Nodes (38): API_URL, applyOptimisticAuth(), closeAllDropdowns(), closeDropdown(), closeMobileDrawer(), closeSearchModal(), domainDotIndex, getDisplayedArticleLang() (+30 more)

### Community 11 - "payment.service.ts"
Cohesion: 0.14
Nodes (12): PaymentOrder, PaymentOrderDocument, PaymentOrderSchema, TestSeriesPass, TestSeriesPassDocument, TestSeriesPassSchema, RazorpayOrder, QUIZ_TYPES (+4 more)

### Community 12 - "DailyQuizService"
Cohesion: 0.08
Nodes (15): DailyQuiz, DailyQuizAttempt, DailyQuizAttemptDocument, DailyQuizAttemptSchema, DailyQuizBilingualText, DailyQuizBilingualTextSchema, DailyQuizDocument, DailyQuizOption (+7 more)

### Community 13 - "site.ts"
Cohesion: 0.07
Nodes (30): contactEmail, examPortals, govPortals, searchItems, siteDomain, siteFaqs, siteName, siteSlogan (+22 more)

### Community 14 - "auth.service.ts"
Cohesion: 0.11
Nodes (15): NotificationController, NotificationService, createBlogPublishedNotification(), createBroadcastNotification(), deduplicateNotificationsByLanguage(), ensureWelcomeNotification(), listNotificationsForUser(), listPublicNotifications() (+7 more)

### Community 15 - "server/package.json"
Cohesion: 0.06
Nodes (43): author, dotenv@18.0.9, description, devDependencies, @nestjs/cli@12.0.11, @nestjs/mau@0.2.9, @nestjs/schematics@12.0.11, oxlint@1.90.0 (+35 more)

### Community 16 - "exam.schema.ts"
Cohesion: 0.21
Nodes (13): AttemptAnswer, AttemptAnswerSchema, AttemptSectionProgress, AttemptSectionProgressSchema, ExamQuestionItem, ExamQuestionItemSchema, ExamSection, ExamSectionSchema (+5 more)

### Community 17 - "blogs.astro"
Cohesion: 0.06
Nodes (39): refreshListingCardsInPlace(), syncListingCardLinks(), AppLang, appLangToBlogLanguage(), articleHref(), BlogLanguage, normalizeAppLang(), preferredLangFromCookieHeader() (+31 more)

### Community 18 - "site.ts"
Cohesion: 0.10
Nodes (15): Props, uniqueId, Props, [brandPrefix, ...brandRest], Props, [brandPrefix, ...brandRest], isDailyQuiz, isRankPredictor (+7 more)

### Community 19 - "test-series.service.ts"
Cohesion: 0.14
Nodes (16): Exam, ExamDocument, TestAttemptDocument, Question, QuestionDocument, QuestionOption, QuestionOptionSchema, ReportedQuestion (+8 more)

### Community 20 - "[slug].astro"
Cohesion: 0.07
Nodes (26): Props, Props, blogLanguageToAppLang(), filterAndSlice(), getCachedRecentPostsSync(), getRecentPosts(), ListingPost, memoryCache (+18 more)

### Community 21 - "package.json"
Cohesion: 0.07
Nodes (37): dependencies, jsonrepair@^3.15.0, devDependencies, concurrently@10.0.6, @dietrichgebert/ponytail@^5.3.2, eslint@^10.13.0, eslint-plugin-sonarjs@^4.2.2, prettier@^3.9.10 (+29 more)

### Community 22 - "syncFindHighlights"
Cohesion: 0.10
Nodes (30): collectDocMatches(), FindMatch, FindReplace, findReplaceKey, findStringMatches(), isWordChar(), mapTextOffset(), applyImageLayout() (+22 more)

### Community 23 - "@nestjs/common"
Cohesion: 0.07
Nodes (25): AppModule, createApplication(), env, EnvSchema, DatabaseModule, Comment, CommentDocument, CommentSchema (+17 more)

### Community 25 - "admin/api.ts"
Cohesion: 0.12
Nodes (23): adminApi, AdminAttemptDetailAnswer, AdminAttemptDetailAnswerOption, AdminAttemptDetailQuestion, AdminAttemptSectionProgress, AdminChapter, AdminIndividualTest, AdminQuestion (+15 more)

### Community 26 - "article-reading.ts"
Cohesion: 0.14
Nodes (24): Props, rawLines, Props, articleElement(), bindArticleReading(), bindCodeCopy(), bindLightbox(), detectLanguage() (+16 more)

### Community 27 - "astro"
Cohesion: 0.11
Nodes (3): ContactPayload, prerender, astro

### Community 28 - "ArticlesManager.tsx"
Cohesion: 0.14
Nodes (19): Category, ArticlesManager(), ArticlesManagerProps, AssignCategoriesModal(), AssignCategoriesModalProps, CategoriesManager(), CategoriesManagerProps, CategoryModal() (+11 more)

### Community 29 - "app.module.ts"
Cohesion: 0.07
Nodes (18): Book, BookDocument, BookSchema, AuthModule, BlogModule, BookModule, CreateBookInput, createBookSchema (+10 more)

### Community 30 - "insertBlock"
Cohesion: 0.14
Nodes (17): escapeHtmlSnippet(), insertBlock(), insertExamPattern(), insertMarkdownSnippet(), insertTableOfContentsBlock(), loadMediaLibrary(), openArticleImageModal(), openCalloutModal() (+9 more)

### Community 31 - "notifications.ts"
Cohesion: 0.17
Nodes (25): allCachedNotifications, AppNotification, buildCard(), currentItems, deduplicateClientNotifications(), fireUnreadToSystem(), getCurrentSelectedLang(), getFiredIds() (+17 more)

### Community 32 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, @aws-sdk/client-s3@3.1157.0, @aws-sdk/s3-request-presigner@3.1157.0, cookie-parser@^1.4.7, google-auth-library@^11.3.1, jsonrepair@^3.15.0, mongoose@9.11.4, @nestjs/common@12.3.2 (+18 more)

### Community 34 - "test-series.dto.ts"
Cohesion: 0.09
Nodes (35): AssignSubjectInput, assignSubjectSchema, CreateChapterInput, createChapterSchema, CreateIndividualTestInput, createIndividualTestSchema, CreateQuestionMappingInput, createQuestionMappingSchema (+27 more)

### Community 35 - "AdminApp.tsx"
Cohesion: 0.14
Nodes (17): AdminApp(), AdminAppContent(), checkAuth(), AdminAppProps, AdminTab, brandParts(), IconName, NavButton() (+9 more)

### Community 36 - "editor"
Cohesion: 0.12
Nodes (29): addSeoKeyword(), applyImportedMarkdown(), applyKeywordsAndTags(), closeArticleImageModal(), deleteOutlineBlock(), duplicateOutlineBlock(), editor, executeImageInsertion() (+21 more)

### Community 38 - "zod"
Cohesion: 0.20
Nodes (10): VALID_CATEGORIES, DailyQuizModule, DailyQuizCategory, createDailyQuizDtoSchema, dailyQuizOptionDtoSchema, dailyQuizQuestionDtoSchema, submitDailyQuizDtoSchema, ListPreparationAttemptsQuery (+2 more)

### Community 39 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, astro@7.4.2, @astrojs/node@11.1.9, @dicebear/core@^10.7.0, @dicebear/styles@^10.6.0, dotenv@18.0.9, react@^19.3.1, @tiptap/extension-table-cell@^3.32.0 (+13 more)

### Community 40 - "adminSession.ts"
Cohesion: 0.20
Nodes (18): formatWhen(), initials(), SessionPanel(), endSession(), signOutEverywhere(), signOutHere(), SessionPanelProps, DESK_PATH (+10 more)

### Community 41 - "ink-orbit-features.tsx"
Cohesion: 0.19
Nodes (20): Brackets(), chartPaths(), clamp(), CopyBlock(), D_FEATURES, FlowCard(), InkFeatureCopy, InkFeatures (+12 more)

### Community 42 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 43 - "react"
Cohesion: 0.14
Nodes (23): CBTCodeOfConductModal(), Props, CBTFlagIcon(), CBTKeyboardShortcutsModal(), Props, CBTLegend, Props, CBTOutline (+15 more)

### Community 44 - "TestInstructions.tsx"
Cohesion: 0.10
Nodes (19): CheckoutResult, loadCheckoutScript(), openTestSeriesCheckout(), RazorpayCheckout, RazorpaySuccess, readError(), Window, Props (+11 more)

### Community 45 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, deploy, format, lint, migrate:pg-to-mongo, seed:test-series, start (+12 more)

### Community 46 - "contact.ts"
Cohesion: 0.18
Nodes (10): 1. Astro 5 Server-Side Rendering (SSR), 2. Instant Bilingual Language Swapping Pattern, 🛡️ Authentication & Security Model, 🎨 Frontend Architecture (`apps/client`), 🏛️ High-Level System Architecture, 📁 Monorepo Workspace Structure, Security Guardrails:, System Architecture (ARCHITECTURE.md) (+2 more)

### Community 47 - "StateFilterWidget.astro"
Cohesion: 0.11
Nodes (16): activeCatBadge, activeStateBadge, cards, categoriesList, categorySelect, filteredCount, livePosts, noResultsMsg (+8 more)

### Community 48 - "AuthPage.astro"
Cohesion: 0.20
Nodes (8): [brandPrefix, ...brandRest], Props, safeReturn, setupGoogleAuth(), safeDeskReturn(), AuthMode, AuthState, authStore

### Community 49 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, name (+10 more)

### Community 50 - "GeminiService"
Cohesion: 0.12
Nodes (8): extractCandidateText(), GeminiService, isRecord(), parseRobustJson(), SeoOptimizationInput, SeoOptimizationOutput, TranslateArticleInput, TranslatedArticleOutput

### Community 51 - "TestSeriesDetail.tsx"
Cohesion: 0.12
Nodes (14): AssignedSubject, CardFilter, Chapter, LatestAttemptMeta, LearnerSeriesPrep, Props, PublishedTestItem, RealTestCard() (+6 more)

### Community 52 - "bookmarks.ts"
Cohesion: 0.18
Nodes (16): Props, BookmarkedArticle, clearAllFavorites(), FavoriteArticle, getBookmarks, getFavorites(), isBookmarked, isFavorite() (+8 more)

### Community 53 - "parse-md.ts"
Cohesion: 0.13
Nodes (12): buckets, buf, CHAPTER_SLUG_MAP, __dirname, flushQuestion(), letterToIndex(), lines, MD_PATH (+4 more)

### Community 54 - "client/package.json"
Cohesion: 0.12
Nodes (15): react-dom@^19.3.1, @tiptap/extension-character-count@^3.32.0, @tiptap/extension-link@^3.32.0, @tiptap/starter-kit@^3.32.0, @vercel/analytics@^2.0.1, engines, node, name (+7 more)

### Community 55 - "blogData.ts"
Cohesion: 0.15
Nodes (12): difficultyColors, Props, Props, difficultyBadge, Props, ArticleSection, CodeSnippet, SubjectData (+4 more)

### Community 56 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.17
Nodes (9): ChapterSchema, __dirname, QuestionMappingSchema, QuestionOptionSchema, QuestionSchema, SubjectSchema, TestSeriesSchema, TestSeriesSubjectSchema (+1 more)

### Community 57 - "ProfileHub.tsx"
Cohesion: 0.15
Nodes (12): Attempt, AttemptAnswer, AttemptCard(), FilterPill(), LoadState, MetricBlock(), PassInfo, ProfileHub() (+4 more)

### Community 58 - "mongo-durable-object.ts"
Cohesion: 0.26
Nodes (17): SCHEMA_MAP, ExamSchema, TestAttempt, TestAttemptSchema, QuestionSchema, ReportedQuestionSchema, SavedQuestionSchema, Chapter (+9 more)

### Community 59 - "article-lang.ts"
Cohesion: 0.15
Nodes (27): applyImageStyle(), buildLangVersion(), cleanPlainText(), closeOpenLists(), computeImageDimensions(), extractDetailsItems(), extractHeadingItems(), extractParagraphItems() (+19 more)

### Community 60 - "sharp.ts"
Cohesion: 0.17
Nodes (6): fitName(), formatName(), ResizeOptions, SharpMetadata, WebpOptions, WorkerSharpPipeline

### Community 61 - "Production Deployment Guide (DEPLOYMENT.md)"
Cohesion: 0.12
Nodes (21): 🚢 Production Deployment Protocol, The Standard Deployment Sequence, Option A: Instant Vercel Rollback (Frontend), Option B: Git Revert on `main`, Option C: Cloudflare Workers Rollback (Backend), 🔍 Post-Deployment Verification, 📋 Pre-Flight Checklist, Production Deployment Guide (DEPLOYMENT.md) (+13 more)

### Community 62 - "pricing.astro"
Cohesion: 0.17
Nodes (12): fallbackOffer, formatRupees(), loadPassOffer(), PassOffer, jsonLd, listPrice, price, save (+4 more)

### Community 63 - "PaymentService"
Cohesion: 0.11
Nodes (6): PaymentController, PaymentService, addCalendarMonths(), paymentSignature(), signaturesMatch(), webhookSignature()

### Community 65 - "apiFetch"
Cohesion: 0.10
Nodes (27): apiFetch(), fileFromDataUrl(), fileFromImageSource(), generateBilingualFromReference(), getImageFileDimensions(), handleEditorImageDrop(), handleEditorImagePaste(), imageFilesFromTransfer() (+19 more)

### Community 66 - "editor-nodes.ts"
Cohesion: 0.15
Nodes (12): @tiptap/extension-image@^3.32.0, @tiptap/extension-list@3.32.0, ArticleBulletList, ArticleImage, BulletStyle, bulletStyles, ImageAlignment, imageAlignments (+4 more)

### Community 67 - "blog.module.ts"
Cohesion: 0.15
Nodes (16): Blog, BlogBlock, BlogBlockSchema, BlogRevision, BlogRevisionSchema, BlogSchema, BlogCategory, BlogCategorySchema (+8 more)

### Community 68 - "4. Individual tests"
Cohesion: 0.06
Nodes (31): 4. Individual tests, Arithmetic & Percentages Chapter Test 01, Bihar BPSC Prelims Full Mock Test 01, Bihar BPSC Prelims Full Mock Test 02, Bihar General Knowledge Practice Test 02, Bihar History & Culture Chapter Test 02, Constitution & Governance Chapter Test 01, General Intelligence & Reasoning Practice Test 02 (+23 more)

### Community 70 - "contact-us.astro"
Cohesion: 0.15
Nodes (12): [brandPrefix, ...brandRest], liveUpdates, Props, telegramChannel, whatsappChannel, errorBanner, errorText, form (+4 more)

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
Cohesion: 0.10
Nodes (27): BlogBlockDocument, BlogDocument, BlogRevisionDocument, BlogCategoryDocument, BlogTagDocument, CategoryDocument, TagDocument, UrlRedirectDocument (+19 more)

### Community 75 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @astrojs/check@0.9.12, tailwindcss@^4.3.3, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/turndown@^5.0.6, typescript@^6.0.3, typescript (+5 more)

### Community 76 - "TestResultAnalysis.tsx"
Cohesion: 0.18
Nodes (9): AnalysisData, ChapterStrength, FilterButton(), FilterKey, OptionReview, QuestionReviewItem, SectionStat, TestResultAnalysis() (+1 more)

### Community 77 - "evaluateAltKeywordHealth"
Cohesion: 0.50
Nodes (5): evaluateAltKeywordHealth(), getArticleFocusKeywords(), refreshSidebarArticleImages(), showImageClickPopover(), updatePopoverKeywordBadge()

### Community 79 - "test-series.service.spec.ts"
Cohesion: 0.40
Nodes (4): admin, editor, makeService(), student

### Community 80 - "openSlashMenu"
Cohesion: 0.28
Nodes (9): checkSlashCommand(), closeSlashMenu(), executeSlashItem(), openSlashMenu(), placeFloating(), positionInlineBlockMenu(), positionSlashMenu(), renderSlashHighlight() (+1 more)

### Community 81 - "astro.config.mjs"
Cohesion: 0.25
Nodes (7): isBuild, @astrojs/react@7.1.1, @astrojs/vercel@11.0.16, @tailwindcss/vite@^4.3.3, @astrojs/react, @astrojs/vercel, @tailwindcss/vite

### Community 82 - "sitemap.xml.ts"
Cohesion: 0.83
Nodes (3): escapeXml(), GET(), safeCdata()

### Community 83 - "mongoose"
Cohesion: 0.13
Nodes (10): student, makeService(), studentA, studentB, calculateRankPrediction(), normCdf(), mongoose, vitest (+2 more)

### Community 84 - "GovtPariksha Platform (ExamResource Monorepo)"
Cohesion: 0.15
Nodes (12): 1. Installation, 2. Environment Configuration, 3. Run Development Servers, 📜 Available Scripts, GovtPariksha Platform (ExamResource Monorepo), 🚀 Key Architectural & Performance Patterns, 🛠️ Local Development, Prerequisites (+4 more)

### Community 85 - "daily-quiz/index.astro"
Cohesion: 0.16
Nodes (12): DailyQuizQuestion, DailyQuizRunner(), EvaluatedQuestion, Props, QuizDataPayload, QuizEvaluationResult, availableQuizzes, jsonLd (+4 more)

### Community 86 - "setupCommandSearch"
Cohesion: 0.67
Nodes (3): setupCommandSearch(), executeFilter(), resetAll()

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

### Community 92 - "blog-content.adapter.ts"
Cohesion: 0.22
Nodes (17): BlockRecord, blocksToHtml(), cleanHtmlEntities(), escapeHtml(), findTargetInsertionIndex(), guessCodeLanguage(), htmlToBlocks(), isHeadingBlock() (+9 more)

### Community 93 - "test-series.ts"
Cohesion: 0.40
Nodes (4): featureShortcuts, heroStats, MockExamCard, mockTestSeriesData

### Community 94 - "client/tsconfig.json"
Cohesion: 0.40
Nodes (4): exclude, extends, include, astro/tsconfigs/strict

### Community 95 - "useAdminToast"
Cohesion: 0.14
Nodes (13): Toast, ToastContext, ToastContextType, ToastType, useAdminToast(), CurrentUser, User, QuestionBankManager() (+5 more)

### Community 97 - "AdminLayout.astro"
Cohesion: 0.15
Nodes (5): backdrop, closeBtn, mobileBtn, Props, sidebar

### Community 98 - "article-lang-swap.ts"
Cohesion: 0.24
Nodes (13): onArticleLangSwap(), persistLang(), Props, setupLangSwitchers(), softNavigate(), ArticleLangBundle, ArticleLangVersion, canSwapArticleLanguage() (+5 more)

### Community 100 - "cbt.ts"
Cohesion: 0.22
Nodes (11): Props, leaveExamFullscreen(), navigateToResults(), useCBTAttempt(), UseCBTAttemptProps, AttemptDetail, PublishedTestMetadata, QuestionOption (+3 more)

### Community 106 - "rank-predictor.astro"
Cohesion: 0.33
Nodes (5): CATEGORIES, EXAM_PRESETS, ExamConfig, RankPredictorIsland(), jsonLd

### Community 107 - "DurableQuery"
Cohesion: 0.24
Nodes (3): DurableQuery, executeDatabaseOperation(), MongoDOQuery

### Community 108 - "CBTHeader.tsx"
Cohesion: 0.48
Nodes (4): BrandMark(), CBTHeader(), formatTime(), Props

### Community 109 - "POST"
Cohesion: 0.17
Nodes (11): escapeHtml(), POST(), 📡 API Endpoints, 🔐 Architecture Overview, Authentication & Session Security (AUTH.md), 🍪 Cookie Configuration, 🌐 Google OAuth 2.0 Integration, 1. Vercel Edge HTTP Caching (+3 more)

### Community 112 - "CBTQuestionPanel.tsx"
Cohesion: 0.27
Nodes (8): CBTQuestionPanel, Props, questionText(), typeLabel(), CBTQuestionReportModal(), ISSUE_REASONS, Props, QuestionDetail

### Community 145 - "Blog Formatting & SEO Guidelines"
Cohesion: 0.14
Nodes (14): 10. Security and rendering rules for developers, 11. Example article template, 12. Pre-publish checklist, 13. Official documentation to consult, 1. Purpose and scope, 2. Recommended rendering strategy, 3. Standard article structure, 4. Formatting rules (+6 more)

### Community 147 - "CBTCalculator.tsx"
Cohesion: 0.27
Nodes (9): CBTCalculator(), evaluateExpression(), Fn, formatResult(), FUNCTIONS, Op, Props, Tok (+1 more)

### Community 148 - "blog.cache.spec.ts"
Cohesion: 0.40
Nodes (4): @nestjs/testing@12.3.2, supertest@7.3.1, @nestjs/testing, supertest

### Community 149 - "serializer.ts"
Cohesion: 0.60
Nodes (4): deserializeInDO(), deserializeResultInWorker(), serializeForDO(), serializeResultFromDO()

### Community 150 - "🚀 Frontend Performance Architecture (`apps/client`)"
Cohesion: 0.20
Nodes (9): 1. Zero Render-Blocking Third-Party Scripts, 2. Font Loading Strategy, 3. Critical CSS & Design Tokens, 4. Image Optimization Rules, 5. Instant Bilingual Language Swapping (Zero Latency), 🚀 Frontend Performance Architecture (`apps/client`), 📋 Ongoing Performance Maintenance Checklist, Performance & PageSpeed Optimization Guide (PERFORMANCE.md) (+1 more)

### Community 151 - "🔑 Production Environment Variables"
Cohesion: 0.67
Nodes (3): 1. Frontend (`apps/client`), 2. Backend (`apps/server`), 🔑 Production Environment Variables

### Community 153 - "MongoDurableObject"
Cohesion: 0.23
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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1125 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `payment.service.ts` to `editor.astro`, `sitemap.astro`?**
  _High betweenness centrality (0.238) - this node is a cross-community bridge._
- **What connects `astro/tsconfigs/strict`, `./tsconfig.json` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `editor.astro` be split into smaller, more focused modules?**
  _Cohesion score 0.007662835249042145 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `mongoose` to `auth.service.ts`, `durable-model.ts`, `payment.service.ts`, `DailyQuizService`, `auth.service.ts`, `server/package.json`, `exam.schema.ts`, `test-series.service.ts`, `serializer.ts`, `@nestjs/common`, `app.module.ts`, `dependencies`, `test-series.dto.ts`, `zod`, `seed-dsssb-tgt-cs.ts`, `mongo-durable-object.ts`, `blog.module.ts`, `seed-test-series.mjs`, `blog.dto.ts`, `test-series.service.spec.ts`, `migrate-pg-to-mongo.mjs`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Should `BlogService` be split into smaller, more focused modules?**
  _Cohesion score 0.13240418118466898 - nodes in this community are weakly interconnected._
- **Why does `Post` connect `Post` to `MediaService`, `AuthService`, `ExamService`, `CommentsService`, `.requireUser`, `QuestionService`, `DailyQuizService`, `auth.service.ts`, `BookService`, `admin/api.ts`, `ArticlesManager.tsx`, `PaymentService`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `AuthService` be split into smaller, more focused modules?**
  _Cohesion score 0.059097127222982215 - nodes in this community are weakly interconnected._