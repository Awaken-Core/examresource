# Graph Report - examresource  (2026-10-28)

## Corpus Check
- 314 files · ~417,041 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: (none) 9, .example 2, .ttf 2)

## Summary
- 2626 nodes · 5973 edges · 140 communities (90 shown, 50 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 338 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b47b93b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- editor.astro
- BlogService
- AuthService
- ExamService
- blog.service.ts
- CommentsService
- .requireUser
- CurrentUser
- @nestjs/common
- durable-model.ts
- Layout.astro
- index.ts
- test-series.service.ts
- site.ts
- auth.service.ts
- server/package.json
- exam.module.ts
- blogs.astro
- contact-us.astro
- question.service.ts
- [slug].astro
- package.json
- syncFindHighlights
- comments.service.ts
- BookService
- admin/api.ts
- article-reading.ts
- astro
- ArticlesManager.tsx
- article-lang.ts
- insertBlock
- notifications.ts
- dependencies
- LearnerAnalyticsService
- QuestionController
- AdminApp.tsx
- editor
- notification.store.ts
- QuestionService
- dependencies
- adminSession.ts
- ink-orbit-features.tsx
- compilerOptions
- react
- TestInstructions.tsx
- scripts
- GeminiService
- StateFilterWidget.astro
- MediaService
- postgres
- useAdminToast
- TestSeriesDetail.tsx
- bookmarks.ts
- parse-md.ts
- client/package.json
- blogData.ts
- article-lang-swap.ts
- ProfileHub.tsx
- NotificationService
- question.dto.ts
- sharp.ts
- seed-dsssb-tgt-cs.ts
- pricing.astro
- PaymentController
- siteDomain
- handleEditorImagePaste
- editor-nodes.ts
- CBTQuestionPanel.tsx
- cbt.ts
- lib/api.ts
- AdminLayout.astro
- seed-test-series.mjs
- TestAttemptsManager.tsx
- sitemap.astro
- scripts
- devDependencies
- TestResultAnalysis.tsx
- executeImageInsertion
- AppService
- CBTCalculator.tsx
- openSlashMenu
- astro.config.mjs
- sync-exam-questions.mjs
- gemini.service.ts
- .listPublishedTests
- CBTHeader.tsx
- CBTPalette.tsx
- oxlint.json
- migrate-pg-to-mongo.mjs
- tsconfig.build.json
- scripts
- nest-cli.json
- blog.cache.spec.ts
- test-series.ts
- client/tsconfig.json
- test-series.service.spec.ts
- AdSlot.astro
- setupCommandSearch
- scanAndExtractImagesFromText
- cloudflare-workers.d.ts
- dotenv
- blog/TableOfContents.astro
- examArticle.ts
- middleware.ts
- cloudflare-node.d.ts
- tsconfig.json
- marked
- @tiptap/extension-character-count
- @tiptap/extension-link@^3.32.0
- @tiptap/extension-placeholder@^3.32.0
- @tiptap/extension-table-cell@^3.32.0
- @tiptap/extension-underline@^3.32.0
- turndown
- @types/dompurify@^3.2.0
- @vercel/speed-insights
- zustand
- AdPlaceholder.astro
- Breadcrumb.astro
- FAQSection.astro
- RelatedArticles.astro
- components/TableOfContents.astro
- [subject].astro
- [topic].astro
- hideArticlePreview

## God Nodes (most connected - your core abstractions)
1. `CurrentUser` - 111 edges
2. `TestSeriesService` - 62 edges
3. `AuthService` - 55 edges
4. `BlogService` - 53 edges
5. `Post` - 52 edges
6. `TestSeriesController` - 49 edges
7. `mongoose` - 48 edges
8. `@nestjs/common` - 45 edges
9. `ExamService` - 38 edges
10. `react` - 38 edges

## Surprising Connections (you probably didn't know these)
- `typescript@^6.0.3` --declares--> `typescript`  [EXTRACTED]
  apps/client/package.json → package.json
- `typescript@^6.0.3` --declares--> `typescript`  [EXTRACTED]
  apps/server/package.json → package.json
- `makeService()` --calls--> `TestSeriesService`  [EXTRACTED]
  apps/server/src/modules/test-series/test-series.service.spec.ts → apps/server/src/modules/test-series/test-series.service.ts
- `TestSeriesManagerProps` --references--> `AdminTestSeries`  [EXTRACTED]
  apps/client/src/components/admin/TestSeriesManager.tsx → apps/client/src/components/admin/api.ts
- `jsonrepair@^3.15.0` --declares--> `jsonrepair`  [EXTRACTED]
  apps/server/package.json → package.json

## Import Cycles
- None detected.

## Communities (140 total, 50 thin omitted)

### Community 0 - "editor.astro"
Cohesion: 0.01
Nodes (231): acceptedImageTypes, activeFocusKeywords, addFaqRowBtn, addKeywordBtn, addKeywordInput, aiRefApplyCompareBtn, aiRefBottomCountBadge, aiRefBtnLabel (+223 more)

### Community 1 - "BlogService"
Cohesion: 0.05
Nodes (24): Post, BlockRecord, blocksToHtml(), cleanHtmlEntities(), escapeHtml(), findTargetInsertionIndex(), guessCodeLanguage(), htmlToBlocks() (+16 more)

### Community 2 - "AuthService"
Cohesion: 0.06
Nodes (18): AuthController, SessionRequest, makeService(), AuthService, email, forgotPasswordSchema, loginSchema, password (+10 more)

### Community 3 - "ExamService"
Cohesion: 0.07
Nodes (12): CreateExamInput, createExamSchema, SaveAnswerInput, saveAnswerSchema, testQuestionSchema, UpdateExamInput, updateExamSchema, UpdateSectionProgressInput (+4 more)

### Community 4 - "blog.service.ts"
Cohesion: 0.06
Nodes (48): SCHEMA_MAP, Blog, BlogBlock, BlogBlockDocument, BlogBlockSchema, BlogRevision, BlogRevisionDocument, BlogRevisionSchema (+40 more)

### Community 5 - "CommentsService"
Cohesion: 0.07
Nodes (15): addText(), createComment(), formatDate(), initialize(), handleDelete(), handleEdit(), load(), onLanguageChange() (+7 more)

### Community 7 - "CurrentUser"
Cohesion: 0.14
Nodes (3): CurrentUser, UpdateIndividualTestInput, TestSeriesService

### Community 8 - "@nestjs/common"
Cohesion: 0.07
Nodes (23): Book, BookDocument, BookSchema, AuthModule, BookModule, CreateBookInput, createBookSchema, UpdateBookInput (+15 more)

### Community 9 - "durable-model.ts"
Cohesion: 0.08
Nodes (20): DatabaseModule, createDurableConnection(), createDurableModelProxy(), DurableQuery, enableWorkerDatabaseProxy(), executeDatabaseOperation(), getMongoDOStub(), isWorkerDatabaseProxyEnabled() (+12 more)

### Community 10 - "Layout.astro"
Cohesion: 0.09
Nodes (38): API_URL, applyOptimisticAuth(), closeAllDropdowns(), closeDropdown(), closeMobileDrawer(), closeSearchModal(), domainDotIndex, getDisplayedArticleLang() (+30 more)

### Community 11 - "index.ts"
Cohesion: 0.10
Nodes (16): PaymentOrder, PaymentOrderDocument, PaymentOrderSchema, TestSeriesPass, TestSeriesPassDocument, TestSeriesPassSchema, PaymentService, RazorpayOrder (+8 more)

### Community 12 - "test-series.service.ts"
Cohesion: 0.09
Nodes (36): TestSeriesSubjectDocument, AssignSubjectInput, assignSubjectSchema, CreateChapterInput, createChapterSchema, CreateIndividualTestInput, createIndividualTestSchema, CreateQuestionMappingInput (+28 more)

### Community 13 - "site.ts"
Cohesion: 0.08
Nodes (25): contactEmail, examPortals, govPortals, searchItems, siteFaqs, siteName, siteSlogan, siteUrl (+17 more)

### Community 14 - "auth.service.ts"
Cohesion: 0.09
Nodes (22): EmailVerificationToken, EmailVerificationTokenDocument, EmailVerificationTokenSchema, OauthState, OauthStateDocument, OauthStateSchema, PasswordResetToken, PasswordResetTokenDocument (+14 more)

### Community 15 - "server/package.json"
Cohesion: 0.07
Nodes (37): author, description, devDependencies, @nestjs/cli@12.0.11, @nestjs/mau@0.2.9, @nestjs/schematics@12.0.11, oxlint@1.90.0, prettier@3.9.10 (+29 more)

### Community 16 - "exam.module.ts"
Cohesion: 0.15
Nodes (28): AttemptAnswer, AttemptAnswerSchema, AttemptSectionProgress, AttemptSectionProgressSchema, Exam, ExamQuestionItem, ExamQuestionItemSchema, ExamSchema (+20 more)

### Community 17 - "blogs.astro"
Cohesion: 0.08
Nodes (29): refreshListingCardsInPlace(), syncListingCardLinks(), AppLang, appLangToBlogLanguage(), articleHref(), BlogLanguage, blogLanguageToAppLang(), normalizeAppLang() (+21 more)

### Community 18 - "contact-us.astro"
Cohesion: 0.07
Nodes (24): Props, uniqueId, Props, [brandPrefix, ...brandRest], [brandPrefix, ...brandRest], Props, [brandPrefix, ...brandRest], isTestSeries (+16 more)

### Community 19 - "question.service.ts"
Cohesion: 0.13
Nodes (15): ExamDocument, TestAttemptDocument, Question, QuestionDocument, QuestionOption, QuestionOptionSchema, ReportedQuestion, ReportedQuestionDocument (+7 more)

### Community 20 - "[slug].astro"
Cohesion: 0.07
Nodes (25): Props, Props, filterAndSlice(), getCachedRecentPostsSync(), getRecentPosts(), ListingPost, memoryCache, alternateLanguage (+17 more)

### Community 21 - "package.json"
Cohesion: 0.09
Nodes (29): typescript@^6.0.3, jsonrepair@^3.15.0, @types/node@26.6.5, typescript@^6.0.3, dependencies, jsonrepair@^3.15.0, devDependencies, concurrently@10.0.6 (+21 more)

### Community 22 - "syncFindHighlights"
Cohesion: 0.10
Nodes (30): collectDocMatches(), FindMatch, FindReplace, findReplaceKey, findStringMatches(), isWordChar(), mapTextOffset(), applyImageLayout() (+22 more)

### Community 23 - "comments.service.ts"
Cohesion: 0.10
Nodes (16): AppModule, createApplication(), Env, EnvSchema, BlogDocument, Comment, CommentDocument, CommentSchema (+8 more)

### Community 25 - "admin/api.ts"
Cohesion: 0.12
Nodes (23): adminApi, AdminAttemptDetailAnswer, AdminAttemptDetailAnswerOption, AdminAttemptDetailQuestion, AdminAttemptSectionProgress, AdminChapter, AdminIndividualTest, AdminQuestion (+15 more)

### Community 26 - "article-reading.ts"
Cohesion: 0.13
Nodes (26): Props, rawLines, Props, articleElement(), bindArticleReading(), bindCodeCopy(), bindFaqAccordion(), bindLightbox() (+18 more)

### Community 27 - "astro"
Cohesion: 0.07
Nodes (8): ContactPayload, escapeHtml(), POST(), prerender, prerender, prerender, prerender, astro

### Community 28 - "ArticlesManager.tsx"
Cohesion: 0.14
Nodes (19): Category, ArticlesManager(), ArticlesManagerProps, AssignCategoriesModal(), AssignCategoriesModalProps, CategoriesManager(), CategoriesManagerProps, CategoryModal() (+11 more)

### Community 29 - "article-lang.ts"
Cohesion: 0.15
Nodes (27): applyImageStyle(), buildLangVersion(), cleanPlainText(), closeOpenLists(), computeImageDimensions(), extractDetailsItems(), extractHeadingItems(), extractParagraphItems() (+19 more)

### Community 30 - "insertBlock"
Cohesion: 0.10
Nodes (26): apiFetch(), escapeHtmlSnippet(), generateBilingualFromReference(), insertBlock(), insertExamPattern(), insertMarkdownSnippet(), insertTableOfContentsBlock(), loadMediaLibrary() (+18 more)

### Community 31 - "notifications.ts"
Cohesion: 0.16
Nodes (20): Props, AppNotification, buildCard(), currentItems, fireUnreadToSystem(), getFiredIds(), getNotifications(), goToNotificationHref() (+12 more)

### Community 32 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @aws-sdk/client-s3@3.1157.0, @aws-sdk/s3-request-presigner@3.1157.0, cookie-parser@^1.4.7, google-auth-library@^11.3.1, mongoose@9.11.4, @nestjs/common@12.3.2, @nestjs/core@12.3.2 (+16 more)

### Community 33 - "LearnerAnalyticsService"
Cohesion: 0.14
Nodes (5): LearnerAnalyticsController, LearnerAnalyticsService, makeService(), studentA, studentB

### Community 35 - "AdminApp.tsx"
Cohesion: 0.14
Nodes (17): AdminApp(), AdminAppContent(), checkAuth(), AdminAppProps, AdminTab, brandParts(), IconName, NavButton() (+9 more)

### Community 36 - "editor"
Cohesion: 0.15
Nodes (23): addSeoKeyword(), applyImportedMarkdown(), applyKeywordsAndTags(), deleteOutlineBlock(), duplicateOutlineBlock(), editor, fillAuthorSelect(), fillTags() (+15 more)

### Community 37 - "notification.store.ts"
Cohesion: 0.15
Nodes (15): Notification, NotificationDocument, NotificationRead, NotificationReadDocument, NotificationReadSchema, NotificationSchema, createBlogPublishedNotification(), createBroadcastNotification() (+7 more)

### Community 38 - "QuestionService"
Cohesion: 0.16
Nodes (4): TranslateExplainAiInput, QuestionService, editor, makeService()

### Community 39 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, astro@7.4.2, @astrojs/node@11.1.9, @dicebear/core@^10.7.0, @dicebear/styles@^10.6.0, lenis@^1.3.27, react@^19.3.1, @tiptap/core@^3.32.0 (+13 more)

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
Cohesion: 0.19
Nodes (14): CBTCodeOfConductModal(), Props, CBTKeyboardShortcutsModal(), Props, CBTOutline, Props, CBTSubmitModal(), CBTTestRunner() (+6 more)

### Community 44 - "TestInstructions.tsx"
Cohesion: 0.14
Nodes (14): CheckoutResult, loadCheckoutScript(), openTestSeriesCheckout(), RazorpayCheckout, RazorpaySuccess, readError(), Window, Props (+6 more)

### Community 45 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, deploy, format, lint, migrate:pg-to-mongo, seed:test-series, start (+12 more)

### Community 47 - "StateFilterWidget.astro"
Cohesion: 0.11
Nodes (16): activeCatBadge, activeStateBadge, cards, categoriesList, categorySelect, filteredCount, livePosts, noResultsMsg (+8 more)

### Community 49 - "postgres"
Cohesion: 0.11
Nodes (18): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, interval, retries, test, timeout, name (+10 more)

### Community 50 - "useAdminToast"
Cohesion: 0.14
Nodes (13): Toast, ToastContext, ToastContextType, ToastType, useAdminToast(), CurrentUser, User, QuestionBankManager() (+5 more)

### Community 51 - "TestSeriesDetail.tsx"
Cohesion: 0.12
Nodes (12): AssignedSubject, Chapter, LatestAttemptMeta, LearnerSeriesPrep, Props, PublishedTestItem, SectionSummary, TabType (+4 more)

### Community 52 - "bookmarks.ts"
Cohesion: 0.23
Nodes (15): BookmarkedArticle, clearAllFavorites(), FavoriteArticle, getBookmarks, getFavorites(), isBookmarked, isFavorite(), removeFavorite() (+7 more)

### Community 53 - "parse-md.ts"
Cohesion: 0.12
Nodes (12): buckets, buf, CHAPTER_SLUG_MAP, __dirname, flushQuestion(), letterToIndex(), lines, MD_PATH (+4 more)

### Community 54 - "client/package.json"
Cohesion: 0.12
Nodes (15): dompurify@^3.4.17, react-dom@^19.3.1, @tiptap/extension-table@^3.32.0, @tiptap/extension-table-row@^3.32.0, @tiptap/extension-youtube@^3.32.0, engines, node, name (+7 more)

### Community 55 - "blogData.ts"
Cohesion: 0.15
Nodes (12): difficultyColors, Props, Props, difficultyBadge, Props, ArticleSection, CodeSnippet, SubjectData (+4 more)

### Community 56 - "article-lang-swap.ts"
Cohesion: 0.24
Nodes (13): onArticleLangSwap(), persistLang(), Props, setupLangSwitchers(), softNavigate(), ArticleLangBundle, ArticleLangVersion, canSwapArticleLanguage() (+5 more)

### Community 57 - "ProfileHub.tsx"
Cohesion: 0.16
Nodes (11): Attempt, AttemptAnswer, AttemptCard(), FilterPill(), LoadState, MetricBlock(), ProfileHub(), TabButton() (+3 more)

### Community 59 - "question.dto.ts"
Cohesion: 0.17
Nodes (14): baseQuestionSchema, CreateQuestionsInput, createQuestionsSchema, GenerateQuestionsAiInput, generateQuestionsAiSchema, optionSchema, ParseRawQuestionsAiInput, parseRawQuestionsAiSchema (+6 more)

### Community 60 - "sharp.ts"
Cohesion: 0.17
Nodes (7): fitName(), formatName(), ResizeOptions, sharp(), SharpMetadata, WebpOptions, WorkerSharpPipeline

### Community 61 - "seed-dsssb-tgt-cs.ts"
Cohesion: 0.16
Nodes (14): ChapterSchema, __dirname, getModels(), main(), QuestionMappingSchema, QuestionOptionSchema, QuestionSchema, SubjectSchema (+6 more)

### Community 62 - "pricing.astro"
Cohesion: 0.17
Nodes (12): fallbackOffer, formatRupees(), loadPassOffer(), PassOffer, jsonLd, listPrice, price, save (+4 more)

### Community 64 - "siteDomain"
Cohesion: 0.19
Nodes (9): [brandPrefix, ...brandRest], Props, safeReturn, setupGoogleAuth(), siteDomain, safeDeskReturn(), AuthMode, AuthState (+1 more)

### Community 65 - "handleEditorImagePaste"
Cohesion: 0.21
Nodes (14): fileFromDataUrl(), fileFromImageSource(), getImageFileDimensions(), handleEditorImageDrop(), handleEditorImagePaste(), imageFilesFromTransfer(), localImageSources(), normalizeImageFile() (+6 more)

### Community 66 - "editor-nodes.ts"
Cohesion: 0.15
Nodes (12): @tiptap/extension-image@^3.32.0, @tiptap/extension-list@3.32.0, ArticleBulletList, ArticleImage, BulletStyle, bulletStyles, ImageAlignment, imageAlignments (+4 more)

### Community 67 - "CBTQuestionPanel.tsx"
Cohesion: 0.26
Nodes (10): CBTFlagIcon(), CBTLegend, Props, CBTQuestionPanel, Props, questionText(), typeLabel(), Props (+2 more)

### Community 68 - "cbt.ts"
Cohesion: 0.22
Nodes (10): leaveExamFullscreen(), navigateToResults(), useCBTAttempt(), UseCBTAttemptProps, loadAnalysis(), AttemptDetail, PublishedTestMetadata, QuestionOption (+2 more)

### Community 69 - "lib/api.ts"
Cohesion: 0.22
Nodes (8): CATEGORIES, StudentTestSeries, TestSeriesExplorer(), TestSeriesExplorerProps, API_URL, escapeXml(), GET(), safeCdata()

### Community 70 - "AdminLayout.astro"
Cohesion: 0.15
Nodes (5): backdrop, closeBtn, mobileBtn, Props, sidebar

### Community 71 - "seed-test-series.mjs"
Cohesion: 0.17
Nodes (8): targetSlugs, __dirname, __filename, nodeEnv, runSeed(), seedPack, seedPackPath, toDeterministicObjectId()

### Community 72 - "TestAttemptsManager.tsx"
Cohesion: 0.20
Nodes (7): AdminAttemptDetail, AdminAttemptListItem, ErrorBoundaryProps, ErrorBoundaryState, TestAttemptsErrorBoundary, TestAttemptsManager(), TestAttemptsManagerContent()

### Community 73 - "sitemap.astro"
Cohesion: 0.17
Nodes (11): corePages, fallbackArticles, jsonLd, links, liveCategories, LivePost, livePosts, noResults (+3 more)

### Community 74 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, check, check:client, dev, format, format:check, lint (+4 more)

### Community 75 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, @astrojs/check@0.9.12, tailwindcss@^4.3.3, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/turndown@^5.0.6, @astrojs/check, tailwindcss (+3 more)

### Community 76 - "TestResultAnalysis.tsx"
Cohesion: 0.20
Nodes (8): AnalysisData, ChapterStrength, FilterButton(), FilterKey, OptionReview, QuestionReviewItem, SectionStat, TestResultAnalysis()

### Community 77 - "executeImageInsertion"
Cohesion: 0.22
Nodes (11): closeArticleImageModal(), evaluateAltKeywordHealth(), executeImageInsertion(), getArticleFocusKeywords(), refreshSidebarArticleImages(), selectedImageAlign(), selectedImageLayout(), selectedImageWidth() (+3 more)

### Community 79 - "CBTCalculator.tsx"
Cohesion: 0.27
Nodes (9): CBTCalculator(), evaluateExpression(), Fn, formatResult(), FUNCTIONS, Op, Props, Tok (+1 more)

### Community 80 - "openSlashMenu"
Cohesion: 0.28
Nodes (9): checkSlashCommand(), closeSlashMenu(), executeSlashItem(), openSlashMenu(), placeFloating(), positionInlineBlockMenu(), positionSlashMenu(), renderSlashHighlight() (+1 more)

### Community 81 - "astro.config.mjs"
Cohesion: 0.25
Nodes (7): isBuild, @astrojs/react@7.1.1, @astrojs/vercel@11.0.16, @tailwindcss/vite@^4.3.3, @astrojs/react, @astrojs/vercel, @tailwindcss/vite

### Community 82 - "sync-exam-questions.mjs"
Cohesion: 0.29
Nodes (4): createSnapshot(), __dirname, __filename, run()

### Community 83 - "gemini.service.ts"
Cohesion: 0.29
Nodes (6): extractCandidateText(), isRecord(), SeoOptimizationInput, SeoOptimizationOutput, TranslateArticleInput, TranslatedArticleOutput

### Community 85 - "CBTHeader.tsx"
Cohesion: 0.48
Nodes (4): BrandMark(), CBTHeader(), formatTime(), Props

### Community 86 - "CBTPalette.tsx"
Cohesion: 0.48
Nodes (6): CBTPalette, Chevron(), chipClass(), isFlaggedStatus(), Props, AttemptAnswer

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

### Community 92 - "blog.cache.spec.ts"
Cohesion: 0.40
Nodes (4): @nestjs/testing@12.3.2, supertest@7.3.1, @nestjs/testing, supertest

### Community 93 - "test-series.ts"
Cohesion: 0.40
Nodes (4): featureShortcuts, heroStats, MockExamCard, mockTestSeriesData

### Community 94 - "client/tsconfig.json"
Cohesion: 0.40
Nodes (4): exclude, extends, include, astro/tsconfigs/strict

### Community 95 - "test-series.service.spec.ts"
Cohesion: 0.40
Nodes (4): admin, editor, makeService(), student

### Community 97 - "setupCommandSearch"
Cohesion: 0.67
Nodes (3): setupCommandSearch(), executeFilter(), resetAll()

### Community 98 - "scanAndExtractImagesFromText"
Cohesion: 0.50
Nodes (4): normalizeNotionImageUrl(), openAiReferenceModal(), scanAndExtractImagesFromText(), updateAiRefCounters()

### Community 100 - "dotenv"
Cohesion: 0.67
Nodes (3): dotenv@18.0.9, dotenv, dotenv@18.0.9

## Knowledge Gaps
- **2 isolated node(s):** `./tsconfig.json`, `astro/tsconfigs/strict`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 898 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `auth.service.ts` to `editor.astro`, `sitemap.astro`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `astro/tsconfigs/strict` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `editor.astro` be split into smaller, more focused modules?**
  _Cohesion score 0.007662835249042145 - nodes in this community are weakly interconnected._
- **Why does `Post` connect `BlogService` to `AuthService`, `ExamService`, `QuestionController`, `CommentsService`, `.requireUser`, `MediaService`, `BookService`, `admin/api.ts`, `NotificationService`, `ArticlesManager.tsx`, `PaymentController`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Should `BlogService` be split into smaller, more focused modules?**
  _Cohesion score 0.05378720895962275 - nodes in this community are weakly interconnected._
- **Why does `mongoose` connect `auth.service.ts` to `dependencies`, `LearnerAnalyticsService`, `blog.service.ts`, `notification.store.ts`, `seed-test-series.mjs`, `@nestjs/common`, `durable-model.ts`, `index.ts`, `test-series.service.ts`, `server/package.json`, `exam.module.ts`, `sync-exam-questions.mjs`, `question.service.ts`, `comments.service.ts`, `migrate-pg-to-mongo.mjs`, `seed-dsssb-tgt-cs.ts`, `test-series.service.spec.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Should `AuthService` be split into smaller, more focused modules?**
  _Cohesion score 0.056948798328108674 - nodes in this community are weakly interconnected._