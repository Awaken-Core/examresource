# Graph Report - examresource  (2026-10-28)

## Corpus Check
- 314 files · ~419,363 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: (none) 9, .example 2, .ttf 2)

## Summary
- 2899 nodes · 6288 edges · 157 communities (110 shown, 47 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 367 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0365f112`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- editor.astro
- BlogService
- AuthService
- ExamService
- blog.module.ts
- CommentsService
- .requireUser
- CurrentUser
- Post
- durable-model.ts
- Layout.astro
- payment.service.ts
- initialize
- site.ts
- auth.module.ts
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
- @nestjs/common
- insertBlock
- notifications.ts
- dependencies
- LearnerAnalyticsService
- test-series.dto.ts
- AdminApp.tsx
- editor
- notification.store.ts
- media.service.ts
- dependencies
- adminSession.ts
- ink-orbit-features.tsx
- compilerOptions
- react
- TestInstructions.tsx
- scripts
- contact.ts
- StateFilterWidget.astro
- vitest
- postgres
- GeminiService
- TestSeriesDetail.tsx
- bookmarks.ts
- parse-md.ts
- client/package.json
- blogData.ts
- seed-dsssb-tgt-cs.ts
- ProfileHub.tsx
- zod
- blog.schema.ts
- sharp.ts
- Production Deployment Guide (DEPLOYMENT.md)
- pricing.astro
- PaymentService
- MediaService
- handleEditorImagePaste
- editor-nodes.ts
- useAdminToast
- 4. Individual tests
- .constructor
- gemini.service.ts
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
- setupCommandSearch
- UrlRedirect
- GovtPariksha Platform (ExamResource Monorepo)
- react-dom@^19.3.1
- @tiptap/extension-character-count
- oxlint.json
- migrate-pg-to-mongo.mjs
- tsconfig.build.json
- scripts
- nest-cli.json
- @tiptap/extension-youtube
- test-series.ts
- client/tsconfig.json
- @types/dompurify@^3.2.0
- AdSlot.astro
- scanAndExtractImagesFromText
- cloudflare-workers.d.ts
- blog/TableOfContents.astro
- examArticle.ts
- middleware.ts
- cloudflare-node.d.ts
- tsconfig.json
- System Architecture (ARCHITECTURE.md)
- lib/api.ts
- zustand
- AdPlaceholder.astro
- Breadcrumb.astro
- FAQSection.astro
- RelatedArticles.astro
- components/TableOfContents.astro
- [subject].astro
- [topic].astro
- hideArticlePreview
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
- @tiptap/extension-table-header@^3.32.0
- @tiptap/pm
- prompt-to-seed-test-series-pack.md

## God Nodes (most connected - your core abstractions)
1. `CurrentUser` - 111 edges
2. `TestSeriesService` - 62 edges
3. `AuthService` - 55 edges
4. `BlogService` - 54 edges
5. `Post` - 52 edges
6. `TestSeriesController` - 49 edges
7. `mongoose` - 48 edges
8. `@nestjs/common` - 45 edges
9. `react` - 38 edges
10. `ExamService` - 38 edges

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

## Communities (157 total, 47 thin omitted)

### Community 0 - "editor.astro"
Cohesion: 0.01
Nodes (231): acceptedImageTypes, activeFocusKeywords, addFaqRowBtn, addKeywordBtn, addKeywordInput, aiRefApplyCompareBtn, aiRefBottomCountBadge, aiRefBtnLabel (+223 more)

### Community 1 - "BlogService"
Cohesion: 0.05
Nodes (24): Post, BlockRecord, blocksToHtml(), cleanHtmlEntities(), escapeHtml(), findTargetInsertionIndex(), guessCodeLanguage(), htmlToBlocks() (+16 more)

### Community 2 - "AuthService"
Cohesion: 0.07
Nodes (9): AuthController, makeService(), AuthService, decodeBase64Url(), derive(), encodeBase64Url(), encoder, hashPassword() (+1 more)

### Community 3 - "ExamService"
Cohesion: 0.06
Nodes (13): CreateExamInput, createExamSchema, SaveAnswerInput, saveAnswerSchema, testQuestionSchema, UpdateExamInput, updateExamSchema, UpdateSectionProgressInput (+5 more)

### Community 4 - "blog.module.ts"
Cohesion: 0.20
Nodes (13): NotificationSchema, BlogCategory, BlogCategoryDocument, BlogCategorySchema, BlogTag, BlogTagSchema, Category, CategoryDocument (+5 more)

### Community 7 - "CurrentUser"
Cohesion: 0.14
Nodes (4): CurrentUser, CreateIndividualTestInput, UpdateIndividualTestInput, TestSeriesService

### Community 8 - "Post"
Cohesion: 0.07
Nodes (19): baseQuestionSchema, CreateQuestionsInput, createQuestionsSchema, GenerateQuestionsAiInput, generateQuestionsAiSchema, optionSchema, ParseRawQuestionsAiInput, parseRawQuestionsAiSchema (+11 more)

### Community 9 - "durable-model.ts"
Cohesion: 0.09
Nodes (19): DatabaseModule, createDurableConnection(), createDurableModelProxy(), DurableQuery, enableWorkerDatabaseProxy(), executeDatabaseOperation(), getMongoDOStub(), isWorkerDatabaseProxyEnabled() (+11 more)

### Community 10 - "Layout.astro"
Cohesion: 0.09
Nodes (38): API_URL, applyOptimisticAuth(), closeAllDropdowns(), closeDropdown(), closeMobileDrawer(), closeSearchModal(), domainDotIndex, getDisplayedArticleLang() (+30 more)

### Community 11 - "payment.service.ts"
Cohesion: 0.14
Nodes (13): PaymentOrder, PaymentOrderDocument, TestSeriesPass, TestSeriesPassDocument, verifySchema, PaymentsModule, RazorpayOrder, QUIZ_TYPES (+5 more)

### Community 12 - "initialize"
Cohesion: 0.23
Nodes (12): addText(), createComment(), formatDate(), initialize(), handleDelete(), handleEdit(), load(), onLanguageChange() (+4 more)

### Community 13 - "site.ts"
Cohesion: 0.05
Nodes (36): [brandPrefix, ...brandRest], Props, safeReturn, setupGoogleAuth(), Props, uniqueId, [brandPrefix, ...brandRest], examPortals (+28 more)

### Community 14 - "auth.module.ts"
Cohesion: 0.10
Nodes (21): SCHEMA_MAP, EmailVerificationToken, EmailVerificationTokenDocument, EmailVerificationTokenSchema, OauthState, OauthStateDocument, OauthStateSchema, PasswordResetToken (+13 more)

### Community 15 - "server/package.json"
Cohesion: 0.07
Nodes (40): author, description, devDependencies, @nestjs/cli@12.0.11, @nestjs/mau@0.2.9, @nestjs/schematics@12.0.11, @nestjs/testing@12.3.2, oxlint@1.90.0 (+32 more)

### Community 16 - "exam.schema.ts"
Cohesion: 0.21
Nodes (13): AttemptAnswer, AttemptAnswerSchema, AttemptSectionProgress, AttemptSectionProgressSchema, ExamQuestionItem, ExamQuestionItemSchema, ExamSection, ExamSectionSchema (+5 more)

### Community 17 - "blogs.astro"
Cohesion: 0.08
Nodes (29): refreshListingCardsInPlace(), syncListingCardLinks(), AppLang, appLangToBlogLanguage(), articleHref(), BlogLanguage, blogLanguageToAppLang(), normalizeAppLang() (+21 more)

### Community 18 - "site.ts"
Cohesion: 0.08
Nodes (21): Props, [brandPrefix, ...brandRest], Props, [brandPrefix, ...brandRest], isTestSeries, Props, Props, Props (+13 more)

### Community 19 - "test-series.service.ts"
Cohesion: 0.11
Nodes (33): Exam, ExamDocument, ExamSchema, TestAttempt, TestAttemptDocument, TestAttemptSchema, Question, QuestionDocument (+25 more)

### Community 20 - "[slug].astro"
Cohesion: 0.07
Nodes (25): Props, Props, filterAndSlice(), getCachedRecentPostsSync(), getRecentPosts(), ListingPost, memoryCache, alternateLanguage (+17 more)

### Community 21 - "package.json"
Cohesion: 0.07
Nodes (37): dependencies, jsonrepair@^3.15.0, devDependencies, concurrently@10.0.6, @dietrichgebert/ponytail@^5.3.2, eslint@^10.13.0, eslint-plugin-sonarjs@^4.2.2, prettier@^3.9.10 (+29 more)

### Community 22 - "syncFindHighlights"
Cohesion: 0.10
Nodes (30): collectDocMatches(), FindMatch, FindReplace, findReplaceKey, findStringMatches(), isWordChar(), mapTextOffset(), applyImageLayout() (+22 more)

### Community 23 - "comments.service.ts"
Cohesion: 0.09
Nodes (23): createApplication(), env, EnvSchema, Comment, CommentSchema, CommentStatus, commentStatuses, bootstrap() (+15 more)

### Community 25 - "admin/api.ts"
Cohesion: 0.10
Nodes (29): Toast, ToastContext, ToastContextType, ToastType, adminApi, AdminAttemptDetailAnswer, AdminAttemptDetailAnswerOption, AdminAttemptDetailQuestion (+21 more)

### Community 26 - "article-lang.ts"
Cohesion: 0.06
Nodes (66): Props, rawLines, onArticleLangSwap(), persistLang(), Props, setupLangSwitchers(), softNavigate(), Props (+58 more)

### Community 28 - "ArticlesManager.tsx"
Cohesion: 0.14
Nodes (19): Category, ArticlesManager(), ArticlesManagerProps, AssignCategoriesModal(), AssignCategoriesModalProps, CategoriesManager(), CategoriesManagerProps, CategoryModal() (+11 more)

### Community 29 - "@nestjs/common"
Cohesion: 0.09
Nodes (14): AppController, AppModule, AppService, AuthModule, CommentsModule, ExamModule, LearnerAnalyticsModule, MediaModule (+6 more)

### Community 30 - "insertBlock"
Cohesion: 0.10
Nodes (26): apiFetch(), escapeHtmlSnippet(), generateBilingualFromReference(), insertBlock(), insertExamPattern(), insertMarkdownSnippet(), insertTableOfContentsBlock(), loadMediaLibrary() (+18 more)

### Community 31 - "notifications.ts"
Cohesion: 0.15
Nodes (24): Props, AppNotification, buildCard(), currentItems, deduplicateClientNotifications(), fireUnreadToSystem(), getCurrentSelectedLang(), getFiredIds() (+16 more)

### Community 32 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, cookie-parser@^1.4.7, dotenv@18.0.9, google-auth-library@^11.3.1, jsonrepair@^3.15.0, mongoose@9.11.4, @nestjs/common@12.3.2, @nestjs/core@12.3.2 (+15 more)

### Community 34 - "test-series.dto.ts"
Cohesion: 0.08
Nodes (33): AssignSubjectInput, assignSubjectSchema, CreateChapterInput, createChapterSchema, createIndividualTestSchema, CreateQuestionMappingInput, createQuestionMappingSchema, CreateSubjectInput (+25 more)

### Community 35 - "AdminApp.tsx"
Cohesion: 0.10
Nodes (22): AdminApp(), AdminAppContent(), checkAuth(), AdminAppProps, AdminTab, brandParts(), IconName, NavButton() (+14 more)

### Community 36 - "editor"
Cohesion: 0.15
Nodes (23): addSeoKeyword(), applyImportedMarkdown(), applyKeywordsAndTags(), deleteOutlineBlock(), duplicateOutlineBlock(), editor, fillAuthorSelect(), fillTags() (+15 more)

### Community 37 - "notification.store.ts"
Cohesion: 0.09
Nodes (20): Notification, NotificationDocument, NotificationRead, NotificationReadDocument, NotificationReadSchema, UserDocument, NotificationController, NotificationService (+12 more)

### Community 38 - "media.service.ts"
Cohesion: 0.18
Nodes (9): @aws-sdk/client-s3@3.1157.0, @aws-sdk/s3-request-presigner@3.1157.0, sharp@^0.35.5, ANIMATED_PASSES, imageExtensions, STATIC_PASSES, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner (+1 more)

### Community 39 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @dicebear/core@^10.7.0, @dicebear/styles@^10.6.0, dompurify@^3.4.17, react@^19.3.1, @tiptap/core@^3.32.0, @tiptap/extension-placeholder@^3.32.0, @tiptap/extension-table-row@^3.32.0 (+16 more)

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
Cohesion: 0.06
Nodes (52): BrandMark(), CBTCalculator(), evaluateExpression(), Fn, formatResult(), FUNCTIONS, Op, Props (+44 more)

### Community 44 - "TestInstructions.tsx"
Cohesion: 0.14
Nodes (15): CheckoutResult, loadCheckoutScript(), openTestSeriesCheckout(), RazorpayCheckout, RazorpaySuccess, readError(), Window, Props (+7 more)

### Community 45 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, deploy, format, lint, migrate:pg-to-mongo, seed:test-series, start (+12 more)

### Community 46 - "contact.ts"
Cohesion: 0.20
Nodes (9): ContactPayload, escapeHtml(), POST(), prerender, 📡 API Endpoints, 🔐 Architecture Overview, Authentication & Session Security (AUTH.md), 🍪 Cookie Configuration (+1 more)

### Community 47 - "StateFilterWidget.astro"
Cohesion: 0.11
Nodes (16): activeCatBadge, activeStateBadge, cards, categoriesList, categorySelect, filteredCount, livePosts, noResultsMsg (+8 more)

### Community 48 - "vitest"
Cohesion: 0.20
Nodes (4): vite-tsconfig-paths@6.1.1, vitest@5.0.5, vite-tsconfig-paths, vitest

### Community 49 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, name (+10 more)

### Community 51 - "TestSeriesDetail.tsx"
Cohesion: 0.10
Nodes (20): AssignedSubject, Chapter, coverageLabel(), EmptyPapers(), LANGUAGE_LABELS, languageLabel(), LatestAttemptMeta, LearnerSeriesPrep (+12 more)

### Community 52 - "bookmarks.ts"
Cohesion: 0.23
Nodes (15): BookmarkedArticle, clearAllFavorites(), FavoriteArticle, getBookmarks, getFavorites(), isBookmarked, isFavorite(), removeFavorite() (+7 more)

### Community 53 - "parse-md.ts"
Cohesion: 0.12
Nodes (12): buckets, buf, CHAPTER_SLUG_MAP, __dirname, flushQuestion(), letterToIndex(), lines, MD_PATH (+4 more)

### Community 54 - "client/package.json"
Cohesion: 0.10
Nodes (19): @astrojs/node@11.1.9, dotenv@18.0.9, lenis@^1.3.27, marked@18.1.2, @tiptap/extension-link@^3.32.0, @tiptap/extension-table@^3.32.0, @tiptap/extension-table-cell@^3.32.0, engines (+11 more)

### Community 55 - "blogData.ts"
Cohesion: 0.15
Nodes (12): difficultyColors, Props, Props, difficultyBadge, Props, ArticleSection, CodeSnippet, SubjectData (+4 more)

### Community 56 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.13
Nodes (18): 🚢 Production Deployment Protocol, The Standard Deployment Sequence, 🚢 Production Deployment, The Deployment Commands:, ChapterSchema, __dirname, getModels(), main() (+10 more)

### Community 57 - "ProfileHub.tsx"
Cohesion: 0.15
Nodes (11): Attempt, AttemptAnswer, AttemptCard(), FilterPill(), LoadState, MetricBlock(), ProfileHub(), TabButton() (+3 more)

### Community 58 - "zod"
Cohesion: 0.11
Nodes (14): Book, BookDocument, BookSchema, CreateBookInput, createBookSchema, UpdateBookInput, updateBookSchema, ListPreparationAttemptsQuery (+6 more)

### Community 59 - "blog.schema.ts"
Cohesion: 0.29
Nodes (7): Blog, BlogBlock, BlogBlockDocument, BlogBlockSchema, BlogRevision, BlogRevisionDocument, BlogRevisionSchema

### Community 60 - "sharp.ts"
Cohesion: 0.17
Nodes (6): fitName(), formatName(), ResizeOptions, SharpMetadata, WebpOptions, WorkerSharpPipeline

### Community 61 - "Production Deployment Guide (DEPLOYMENT.md)"
Cohesion: 0.12
Nodes (15): 1. Frontend (`apps/client`), 2. Backend (`apps/server`), Option A: Instant Vercel Rollback (Frontend), Option B: Git Revert on `main`, Option C: Cloudflare Workers Rollback (Backend), 🔍 Post-Deployment Verification, 📋 Pre-Flight Checklist, Production Deployment Guide (DEPLOYMENT.md) (+7 more)

### Community 62 - "pricing.astro"
Cohesion: 0.13
Nodes (15): contactEmail, fallbackOffer, formatRupees(), loadPassOffer(), PassOffer, jsonLd, listPrice, price (+7 more)

### Community 63 - "PaymentService"
Cohesion: 0.11
Nodes (7): PaymentController, PaymentService, student, addCalendarMonths(), paymentSignature(), signaturesMatch(), webhookSignature()

### Community 64 - "MediaService"
Cohesion: 0.14
Nodes (3): MediaController, UploadedMediaFile, MediaService

### Community 65 - "handleEditorImagePaste"
Cohesion: 0.21
Nodes (14): fileFromDataUrl(), fileFromImageSource(), getImageFileDimensions(), handleEditorImageDrop(), handleEditorImagePaste(), imageFilesFromTransfer(), localImageSources(), normalizeImageFile() (+6 more)

### Community 66 - "editor-nodes.ts"
Cohesion: 0.15
Nodes (12): @tiptap/extension-image@^3.32.0, @tiptap/extension-list@3.32.0, ArticleBulletList, ArticleImage, BulletStyle, bulletStyles, ImageAlignment, imageAlignments (+4 more)

### Community 67 - "useAdminToast"
Cohesion: 0.18
Nodes (8): useAdminToast(), CurrentUser, User, QuestionBankManager(), TestBuilderManager(), TestSeriesManager(), UsersManager(), UsersManagerProps

### Community 68 - "4. Individual tests"
Cohesion: 0.06
Nodes (31): 4. Individual tests, Arithmetic & Percentages Chapter Test 01, Bihar BPSC Prelims Full Mock Test 01, Bihar BPSC Prelims Full Mock Test 02, Bihar General Knowledge Practice Test 02, Bihar History & Culture Chapter Test 02, Constitution & Governance Chapter Test 01, General Intelligence & Reasoning Practice Test 02 (+23 more)

### Community 69 - ".constructor"
Cohesion: 0.22
Nodes (4): BlogDocument, CommentDocument, BlogTagDocument, UrlRedirectDocument

### Community 70 - "gemini.service.ts"
Cohesion: 0.29
Nodes (6): extractCandidateText(), isRecord(), SeoOptimizationInput, SeoOptimizationOutput, TranslateArticleInput, TranslatedArticleOutput

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
Cohesion: 0.16
Nodes (19): CacheEntry, CurrentUser, blockTypes, blogLanguages, blogStatuses, createBlockSchema, CreateBlogInput, createBlogSchema (+11 more)

### Community 75 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @astrojs/check@0.9.12, tailwindcss@^4.3.3, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/turndown@^5.0.6, typescript@^6.0.3, typescript (+5 more)

### Community 76 - "TestResultAnalysis.tsx"
Cohesion: 0.15
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

### Community 82 - "setupCommandSearch"
Cohesion: 0.67
Nodes (3): setupCommandSearch(), executeFilter(), resetAll()

### Community 84 - "GovtPariksha Platform (ExamResource Monorepo)"
Cohesion: 0.15
Nodes (12): 1. Installation, 2. Environment Configuration, 3. Run Development Servers, 📜 Available Scripts, GovtPariksha Platform (ExamResource Monorepo), 🚀 Key Architectural & Performance Patterns, 🛠️ Local Development, Prerequisites (+4 more)

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

### Community 93 - "test-series.ts"
Cohesion: 0.40
Nodes (4): featureShortcuts, heroStats, MockExamCard, mockTestSeriesData

### Community 94 - "client/tsconfig.json"
Cohesion: 0.40
Nodes (4): exclude, extends, include, astro/tsconfigs/strict

### Community 98 - "scanAndExtractImagesFromText"
Cohesion: 0.50
Nodes (4): normalizeNotionImageUrl(), openAiReferenceModal(), scanAndExtractImagesFromText(), updateAiRefCounters()

### Community 107 - "System Architecture (ARCHITECTURE.md)"
Cohesion: 0.18
Nodes (10): 1. Astro 5 Server-Side Rendering (SSR), 2. Instant Bilingual Language Swapping Pattern, 🛡️ Authentication & Security Model, 🎨 Frontend Architecture (`apps/client`), 🏛️ High-Level System Architecture, 📁 Monorepo Workspace Structure, Security Guardrails:, System Architecture (ARCHITECTURE.md) (+2 more)

### Community 113 - "lib/api.ts"
Cohesion: 0.22
Nodes (8): CATEGORIES, StudentTestSeries, TestSeriesExplorer(), TestSeriesExplorerProps, API_URL, escapeXml(), GET(), safeCdata()

### Community 145 - "Blog Formatting & SEO Guidelines"
Cohesion: 0.14
Nodes (14): 10. Security and rendering rules for developers, 11. Example article template, 12. Pre-publish checklist, 13. Official documentation to consult, 1. Purpose and scope, 2. Recommended rendering strategy, 3. Standard article structure, 4. Formatting rules (+6 more)

### Community 150 - "🚀 Frontend Performance Architecture (`apps/client`)"
Cohesion: 0.14
Nodes (13): 1. Vercel Edge HTTP Caching, 1. Zero Render-Blocking Third-Party Scripts, 2. Backend In-Memory Service Cache (`apps/server`), 2. Font Loading Strategy, 3. Critical CSS & Design Tokens, 3. Resilient SSR Fetching & Timeout Guardrails, 4. Image Optimization Rules, 5. Instant Bilingual Language Swapping (Zero Latency) (+5 more)

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1079 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `payment.service.ts` to `editor.astro`, `sitemap.astro`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._
- **What connects `astro/tsconfigs/strict`, `./tsconfig.json` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `editor.astro` be split into smaller, more focused modules?**
  _Cohesion score 0.007662835249042145 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `payment.service.ts` to `AuthService`, `ExamService`, `blog.module.ts`, `durable-model.ts`, `auth.module.ts`, `server/package.json`, `exam.schema.ts`, `test-series.service.ts`, `comments.service.ts`, `dependencies`, `notification.store.ts`, `vitest`, `seed-dsssb-tgt-cs.ts`, `zod`, `blog.schema.ts`, `PaymentService`, `seed-test-series.mjs`, `blog.dto.ts`, `test-series.service.spec.ts`, `migrate-pg-to-mongo.mjs`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Should `BlogService` be split into smaller, more focused modules?**
  _Cohesion score 0.05378720895962275 - nodes in this community are weakly interconnected._
- **Why does `Post` connect `BlogService` to `MediaService`, `AuthService`, `ExamService`, `CommentsService`, `notification.store.ts`, `.requireUser`, `Post`, `BookService`, `admin/api.ts`, `ArticlesManager.tsx`, `PaymentService`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `AuthService` be split into smaller, more focused modules?**
  _Cohesion score 0.06982456140350878 - nodes in this community are weakly interconnected._