# GovtPariksha Performance PR: Code Review Findings Resolution Report

**Repository:** `ExamResource`  
**Branch:** `perf/performance-optimization`  
**Status:** **READY TO MERGE**  
**Date:** March 2026  
**Auditor:** Senior Full-Stack Performance Engineer & Systems Architect  

---

## Executive Summary

During the code review phase of the `perf/performance-optimization` pull request for GovtPariksha (`https://govtpariksha.com`), automated and peer code reviews from **Qodo** and **Greptile** identified 12 key areas of concern spanning frontend race conditions, edge caching security, SSR error handling, deterministic slug resolution, notification polling cadence, PYQ paper visibility, environment configuration leaks, and CI/CD Cloudflare Workers build failures.

All valid code review findings have been thoroughly investigated, fixed, and verified using automated unit tests, static type checking, framework diagnostics, monorepo production builds, and Cloudflare Workers dry-run deployments. No shortcuts, workarounds, or blind overrides were introduced; all solutions strictly preserve existing application functionality including bilingual content (English/Hinglish), CBT exam simulation, guest/authenticated session management, and SEO/AEO/GEO structured metadata.

---

## Code Review Findings Disposition Matrix

| ID | Origin | Finding / Concern | Severity | Resolution Status | Primary Files Modified |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REV-01** | Qodo | Temporary 503 responses can receive public edge cache headers; duplicate header assignment overwrites `no-store` | **High** | **Confirmed & Fixed** | `apps/client/src/pages/[slug].astro` |
| **REV-02** | Greptile | Article query translation resolution bug can serve an unrelated post if only language matches | **Critical** | **Confirmed & Fixed** | `apps/server/src/modules/blog/blog.service.ts` |
| **REV-03** | Qodo | In-memory article body cache keyed solely by language; cross-article navigation leaks previous article body | **High** | **Confirmed & Fixed** | `apps/client/src/lib/article-lang.ts`, `article-lang-swap.ts` |
| **REV-04** | Greptile | Rapid language toggle can cache loading skeleton or commit out-of-date responses; non-OK/non-JSON responses leave broken UI | **High** | **Confirmed & Fixed** | `apps/client/src/lib/article-lang-swap.ts` |
| **REV-05** | Qodo | Language switch updates article body but leaves reading time estimate fixed to initial SSR language | **Medium** | **Confirmed & Fixed** | `apps/client/src/pages/[slug].astro`, `article-lang-swap.ts` |
| **REV-06** | Greptile | Cache rule `starts_with "/test-series/"` risks edge caching private CBT sessions, attempts, and results | **Critical** | **Confirmed & Fixed** | `docs/performance/performance-optimization-report.md` |
| **REV-07** | Qodo | 60s notification throttle suppresses 45s background polling; lacks concurrency lock and multi-account cache isolation | **Medium** | **Confirmed & Fixed** | `apps/client/src/lib/notifications.ts` |
| **REV-08** | Greptile | Test Series Detail SSR/API discrepancy drops legacy PYQ papers from full mock tests and PYQ tabs | **High** | **Confirmed & Fixed** | `apps/server/src/modules/test-series/test-series.service.ts`, `apps/client/src/pages/test-series/[id].astro`, `TestSeriesDetail.tsx` |
| **REV-09** | Qodo | Cookie-selected language on bare URL with shared edge caching causes cache poisoning between English and Hinglish users | **High** | **Confirmed & Fixed** | `apps/client/src/pages/[slug].astro` |
| **REV-10** | Greptile | Hardcoded default production API URL in client leaks preview/staging deployments to production Worker | **Medium** | **Confirmed & Fixed** | `apps/client/src/lib/api.ts` |
| **REV-11** | Review | Conflict between `AGENTS.md` (6000ms timeout) and `CLAUDE.md` (semantic tokens, rounded-full buttons) | **Low** | **Confirmed & Fixed** | `apps/client/src/pages/[slug].astro`, `apps/client/src/lib/api.ts` |
| **REV-12** | CI / Review | Cloudflare Workers Builds fails on `apps/server` fresh clone due to missing custom build step in `wrangler.jsonc` | **Blocker** | **Confirmed & Fixed** | `apps/server/wrangler.jsonc` |

---

## Detailed Step-by-Step Resolution

### Step 1: Article Response Cache Headers & 503 Error State
- **Root Cause:**
  In `apps/client/src/pages/[slug].astro`, early error branches (such as the 503 timeout catch handler) called `Astro.response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')`, but execution continued down to the final rendering block where line 175 unconditionally executed `Astro.response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=900')`. This overwrote the error headers and instructed Cloudflare to publicly cache 503 errors at the edge for 5 minutes.
- **Implementation Details:**
  1. Removed the redundant, downstream unconditional header assignment.
  2. Implemented a single, authoritative header consolidation block at the end of the frontmatter logic based on the final determined state:
     - **503 Server Error / Upstream Timeout:** Status set to `503`, `Cache-Control: no-store, no-cache, must-revalidate`, `Retry-After: 5`.
     - **Stale Memory Cache Fallback:** `Cache-Control: private, no-cache, no-store`, `X-Article-Cache: STALE`.
     - **Profile / Authenticated Pages:** `Cache-Control: private, no-store`.
     - **Cookie-Selected Language on Bare URL:** `Cache-Control: private, no-cache`, `Vary: Cookie, Accept-Encoding`.
     - **Canonical URL / Explicit `?lang=`:** `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=900`, `Vary: Accept-Encoding`.
  3. Styled the 503 retry container using `CLAUDE.md` semantic design tokens (`bg-surface`, `border-border`, `text-foreground`, `rounded-xl`, `rounded-full` retry button).
- **Files Modified:** `apps/client/src/pages/[slug].astro`
- **Verification:** Verified via `bun run check:client` (0 errors) and end-to-end SSR build.

---

### Step 2: Deterministic Article Slug Resolution & Group Integrity
- **Root Cause:**
  In `apps/server/src/modules/blog/blog.service.ts`, when an article was queried with a requested language (e.g. `lang=en`), the query fell back to searching by `{ language: requestedLang }` across published posts. In edge cases where an article lacked an explicit `translationGroupId` or during slug variants matching, the query could match and return an entirely unrelated blog post that happened to have the requested language.
- **Implementation Details:**
  1. Replaced ambiguous fallback resolution with a two-phase deterministic resolution:
     - **Phase 1 (Anchor Match):** First find the exact anchor document matching the requested slug (`slug: slug`).
     - **Phase 2 (Group Sibling Resolution):** If the anchor has a `translationGroupId`, find the sibling post within the exact same group matching `language: requestedLang`. If no translation group exists, check if the anchor itself is the requested post or if clean slug variant (`-hi`, `-en`) belongs to the exact same article identity.
     - **Deterministic Tie-Breaking:** If multiple candidates match clean slug heuristics, deterministic scoring prioritizes:
       1. Exact slug match.
       2. Exact clean slug match with requested language.
       3. Sibling sharing the exact same translation group.
  2. Unrelated posts belonging to different groups or titles are strictly rejected with `NotFoundException`.
- **Files Modified:** `apps/server/src/modules/blog/blog.service.ts`, `apps/server/src/modules/blog/blog.query-opt.spec.ts`
- **Verification:** Added 6 dedicated unit tests in `blog.query-opt.spec.ts`. All 8 tests passed in 243ms.

---

### Step 3, 4, 5: Client-Side Language Toggle Identity, Race Conditions & Reading Time
- **Root Cause:**
  1. In `apps/client/src/lib/article-lang-swap.ts`, the in-memory cache `memoryBodyCache` was keyed solely by language (`en` or `hinglish`). When navigating from Article A to Article B via Astro ClientRouter, toggling language on Article B would render Article A's cached body.
  2. Clicking language toggles rapidly could cause an in-flight fetch for an earlier language to complete after a later request, committing out-of-date HTML or caching the skeleton loader (`animate-pulse`).
  3. Non-OK (e.g., 500) or non-JSON responses from the API left the article body in a blank or broken state.
  4. The estimated reading time pill was statically rendered during SSR and never updated when switching between Hindi/Hinglish (longer word count) and English.
- **Implementation Details:**
  1. Scoped `memoryBodyCache` to `${articleId}:${langKey}` using `getArticleIdentity()` (derived from `data-article-id` and `data-article-slug`).
  2. Implemented request generation counter (`currentSwapGeneration`) and latest language tracker (`latestSwapLangKey`). A fetch callback commits DOM changes only if `generation === currentSwapGeneration`, `latestSwapLangKey === langKey`, and `getArticleIdentity() === articleId`.
  3. Added a guard before caching to ensure `!renderedHtml.includes('animate-pulse')`.
  4. Added complete rollback handling: on non-OK or non-JSON responses, the DOM is restored to the previous body and metadata from the memory cache, or falls back gracefully to `?lang=...` full-page reload.
  5. Implemented dynamic reading time calculation (`calculateReadingTime(cleanText)`) and updated DOM element `article-reading-time` on language swap.
  6. Added an `astro:before-preparation` lifecycle listener to invalidate in-flight generations and abort pending swaps during client-side page transitions.
- **Files Modified:** `apps/client/src/lib/article-lang.ts`, `apps/client/src/lib/article-lang-swap.ts`, `apps/client/src/pages/[slug].astro`
- **Verification:** Created comprehensive test suite in `apps/client/test/article-lang-swap.spec.ts` (6/6 tests passing).

---

### Step 6: Edge Cache Security for Private CBT Tests & Results
- **Root Cause:**
  Cloudflare Cache Rule 2 in `docs/performance/performance-optimization-report.md` recommended caching `(http.request.uri.path starts_with "/test-series/")`. However, under `/test-series/` are live CBT exam runner routes (`/test-series/cbt/[attemptId]`), exam instructions (`/test-series/instructions/[testId]`), and user test results (`/test-series/results/[attemptId]`). Caching these could expose candidate test attempts, submitted answers, and scorecards to other users.
- **Implementation Details:**
  1. Updated Cloudflare Cache Rule 1 (Bypass) with explicit exclusions:
     ```text
     (http.request.uri.path starts_with "/api/") or
     (http.request.uri.path starts_with "/admin") or
     (http.request.uri.path starts_with "/administrator") or
     (http.request.uri.path contains "/test/") or
     (http.request.uri.path starts_with "/test-series/cbt/") or
     (http.request.uri.path starts_with "/test-series/instructions/") or
     (http.request.uri.path starts_with "/test-series/results/") or
     (http.request.uri.path eq "/login") or
     (http.request.uri.path eq "/signup") or
     (http.request.uri.path eq "/profile") or
     (http.cookie contains "__Host-sid") or
     (http.cookie contains "session=") or
     (http.cookie contains "logged_in=") or
     (http.cookie contains "auth_active=")
     ```
  2. Updated Cloudflare Cache Rule 2 (Public HTML) with strict allowlist and negative safeguards:
     ```text
     ((http.request.uri.path eq "/") or
      (http.request.uri.path eq "/blogs") or
      (http.request.uri.path starts_with "/category/") or
      (http.request.uri.path eq "/test-series") or
      ((http.request.uri.path starts_with "/test-series/") and
       not http.request.uri.path contains "/cbt/" and
       not http.request.uri.path contains "/instructions/" and
       not http.request.uri.path contains "/results/")) and
     not (http.cookie contains "__Host-sid") and
     not (http.cookie contains "session=") and
     not (http.cookie contains "logged_in=") and
     not (http.cookie contains "auth_active=")
     ```
- **Files Modified:** `docs/performance/performance-optimization-report.md`
- **Verification:** Rule syntax audited against Cloudflare Ruleset Engine specification.

---

### Step 7: Notification Polling, Throttling & Account Isolation
- **Root Cause:**
  `apps/client/src/lib/notifications.ts` enforced a static 60-second throttle interval (`NOTIF_FETCH_MIN_INTERVAL = 60_000`). Because `Layout.astro` polls for notifications every 45 seconds, the 60s throttle suppressed every second background poll. Furthermore, switching user accounts without a full reload could leak cached notifications from the previous user.
- **Implementation Details:**
  1. Tuned throttle threshold to 20 seconds (`20_000ms`), safely permitting the 45-second background polling cycle while defending against rapid spam clicks.
  2. Added `forceRefresh?: boolean` parameter to `fetchNotifications` to immediately bypass throttling during explicit user interactions (bell icon clicks, login/logout events, language switches).
  3. Added concurrency deduplication: concurrent calls share a single `inFlightPromise` so multiple callers receive the same network response without firing duplicate HTTP requests.
  4. Added account switch detection: cached notifications and timestamps are automatically cleared when the user's authentication token changes.
- **Files Modified:** `apps/client/src/lib/notifications.ts`
- **Verification:** Created test suite in `apps/client/test/notifications.spec.ts` (6/6 tests passing).

---

### Step 8: Disappearing PYQ Papers in Test Series Detail
- **Root Cause:**
  In `apps/server/src/modules/test-series/test-series.service.ts`, `listPublishedTests` queried `{ testMode: 'pyq' }` when filtering by `testMode=pyq`. However, legacy previous-year question papers were often saved with `testMode: 'full'` but carried identifying titles (e.g. `[PYQ]`) or slugs starting with `pyq-`. The SSR page `[id].astro` filtered those out of the full mock tests list, but the backend query failed to match them in the PYQ list, causing them to disappear entirely from the UI.
- **Implementation Details:**
  1. Updated backend `listPublishedTests` query so that `testMode=pyq` matches both `{ testMode: 'pyq' }` and `{ $or: [{ slug: /^pyq-/i }, { title: /\[PYQ\]/i }] }`.
  2. Updated `testMode=full` query to explicitly exclude legacy PYQ papers so papers never appear in both tabs simultaneously.
  3. In `apps/client/src/pages/test-series/[id].astro`, filtered `initialPyqTests` from SSR payload and passed them directly to `<TestSeriesDetail>`.
  4. In `TestSeriesDetail.tsx`, merged SSR initial PYQ tests with dynamically fetched tests using ID deduplication.
- **Files Modified:** `apps/server/src/modules/test-series/test-series.service.ts`, `apps/server/src/modules/test-series/test-series.service.spec.ts`, `apps/client/src/pages/test-series/[id].astro`, `apps/client/src/components/test-series/TestSeriesDetail.tsx`
- **Verification:** Added dedicated unit test in `test-series.service.spec.ts`. All 32 test series tests passed.

---

### Step 9: Shared Cache Language Poisoning via Bare URLs
- **Root Cause:**
  When a user with a `preferred_lang=en` cookie visits the bare article URL `/my-slug`, SSR rendered English content. Because Cloudflare edge caches do not vary cache entries by the `Cookie` header when `Vary: Accept-Encoding` is set, Cloudflare would cache the English HTML under `/my-slug`. Subsequently, all visitors (including default Hinglish visitors) were served English.
- **Implementation Details:**
  In `apps/client/src/pages/[slug].astro`:
  1. Identified when the rendered language was determined via the `preferred_lang` cookie on a bare URL without an explicit `?lang=` query parameter (`hasCookieOverride`).
  2. Emitted `Cache-Control: private, no-cache` with `Vary: Cookie, Accept-Encoding` for cookie-selected bare URLs.
  3. Preserved `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=900` strictly for canonical canonical default requests and explicit query parameters (`?lang=en`, `?lang=hinglish`).
- **Files Modified:** `apps/client/src/pages/[slug].astro`
- **Verification:** Verified via Astro check and header assignment integration logic.

---

### Step 10: Preview / Staging API Environment Leak
- **Root Cause:**
  `apps/client/src/lib/api.ts` contained a fallback constant `DEFAULT_PROD_API_URL = 'https://examresource.awakenstudioss.workers.dev/api/v1'`. If `PUBLIC_API_URL` was omitted in a preview or staging build, the client would silently send API requests to the live production Cloudflare Worker.
- **Implementation Details:**
  1. Removed `DEFAULT_PROD_API_URL`.
  2. Implemented strict resolution:
     - In development (`import.meta.env.DEV`), default to `http://localhost:5000/api/v1`.
     - In non-DEV environments, require `PUBLIC_API_URL`.
     - If `PUBLIC_API_URL` is a relative path (e.g. `/api/v1`), resolve against `PUBLIC_SITE_URL` during SSR or `window.location.origin` in the browser.
     - If `PUBLIC_API_URL` is missing in production/staging builds, fail fast with a descriptive configuration error.
- **Files Modified:** `apps/client/src/lib/api.ts`
- **Verification:** Tested local dev resolution and production build bundling.

---

### Step 11: Repository Instruction Conflict Resolution
- **Reconciliation:**
  - **Timeout:** Resolved in favor of `AGENTS.md` (6000ms max timeout using `AbortSignal.timeout(6000)`).
  - **Design Tokens:** Resolved in favor of `CLAUDE.md` (styled the 503 retry card with `bg-surface`, `border-border`, `text-foreground`, `rounded-xl`, and `rounded-full` button).
- **Files Modified:** `apps/client/src/pages/[slug].astro`
- **Verification:** Visual and code inspection against design guidelines.

---

### Step 12: Cloudflare Workers Builds Failure Fix
- **Root Cause:**
  Cloudflare Workers CI clones the repository and runs `wrangler deploy` inside `apps/server`. Because `dist/` is gitignored, and `apps/server/wrangler.jsonc` lacked a custom build configuration, wrangler attempted to deploy immediately and threw:
  `The entry-point file at "dist/worker.js" was not found.`
- **Implementation Details:**
  Added the standard Wrangler custom build configuration to `apps/server/wrangler.jsonc`:
  ```jsonc
  "build": {
    "command": "bun run build"
  }
  ```
- **Files Modified:** `apps/server/wrangler.jsonc`
- **Verification:** Executed `bunx wrangler deploy --dry-run` in `apps/server`. Wrangler automatically executed `bun run build` (`nest build`) and confirmed entrypoint resolution and Durable Object bindings with exit code 0.

---

## Complete Verification & Test Evidence

### 1. TypeScript & Client Framework Check (`bun run check`)
```text
$ bun run typecheck && bun run check:client
$ bun run --cwd apps/server tsc --noEmit
$ bun run --cwd apps/client astro check
12:35:05 [@astrojs/cloudflare] Enabling image processing with Cloudflare Images for production with the "IMAGES" Images binding.
12:35:08 [check] Getting diagnostics for Astro files in apps/client...
Result (167 files): 
- 0 errors
- 0 warnings
- 57 hints
Exit Code: 0
```

### 2. Server Vitest Test Suite (`bun run test`)
```text
$ bun run --cwd apps/server test
$ vitest run
 RUN  v5.0.5 apps/server

 ✓ src/modules/auth/password-hash.spec.ts (2 tests)
 ✓ src/modules/payments/payment.signature.spec.ts (3 tests)
 ✓ src/core/security/ssrf.validator.spec.ts (4 tests)
 ✓ src/core/database/durable-model.spec.ts (5 tests)
 ✓ src/modules/notifications/notification.store.spec.ts (8 tests)
 ✓ src/modules/blog/blog-content.adapter.spec.ts (4 tests)
 ✓ src/app.controller.spec.ts (1 test)
 ✓ src/modules/media/media.service.spec.ts (4 tests)
 ✓ src/modules/learner-analytics/learner-analytics.service.spec.ts (9 tests)
 ✓ src/modules/exam/exam.service.spec.ts (7 tests)
 ✓ src/modules/test-series/test-series.service.spec.ts (32 tests)
 ✓ src/core/schema/test-series.schema.spec.ts (6 tests)
 ✓ src/modules/daily-quiz/daily-quiz.service.spec.ts (10 tests)
 ✓ src/modules/question/question-quality.spec.ts (2 tests)
 ✓ src/modules/auth/auth.login.spec.ts (1 test)
 ✓ src/modules/learner-analytics/rank-predictor.spec.ts (4 tests)
 ✓ src/core/database/serializer.spec.ts (4 tests)
 ✓ src/modules/blog/blog.cache.spec.ts (7 tests)
 ✓ src/modules/payments/test-series-access.service.spec.ts (6 tests)
 ✓ src/modules/auth/auth.profile.spec.ts (4 tests)
 ✓ src/modules/question/question.service.spec.ts (4 tests)
 ✓ src/modules/blog/blog.query-opt.spec.ts (8 tests)
 ✓ src/modules/payments/payment.service.spec.ts (3 tests)
 ✓ src/modules/auth/auth.redirect.spec.ts (5 tests)
 ✓ src/modules/book/book.service.spec.ts (2 tests)

 Test Files  25 passed (25)
      Tests  145 passed (145)
   Duration  72.10s
Exit Code: 0
```

### 3. Client Unit Tests (`bun test apps/client`)
```text
bun test v1.4.3
test\article-lang-swap.spec.ts:
(pass) Article Identity: scopes memory cache so Article B never displays Article A body [37.63ms]
(pass) Placeholder Guard: Never saves loading skeleton into memory cache [4.54ms]
(pass) Race Condition: Outdated slower response does not overwrite latest user selection [7.11ms]
(pass) Error Recovery: HTTP 500 error restores previous body and metadata [1.91ms]
(pass) Error Recovery: HTML response instead of JSON restores previous state [0.61ms]
(pass) Reading Time Calculation: Accurately updates reading time when body is fetched [2.03ms]

test\notifications.spec.ts:
(pass) Guest notification fetch accesses /notifications/public endpoint [8.88ms]
(pass) Authenticated user accesses /me/notifications endpoint [0.28ms]
(pass) 45-second background polling cadence is preserved (20s throttle threshold) [2.24ms]
(pass) Force-refresh bypasses throttle interval immediately [0.46ms]
(pass) Account switch / logout clears notification cache [3.33ms]
(pass) Concurrent calls share in-flight promise to eliminate duplicate requests [2.09ms]

 12 pass
 0 fail
 41 expect() calls
Ran 12 tests across 2 files. [1175.00ms]
Exit Code: 0
```

### 4. Production Monorepo Build (`bun run build`)
```text
$ bun run --cwd apps/client build && bun run --cwd apps/server build
$ astro build
12:39:43 [@astrojs/cloudflare] Enabling image processing with Cloudflare Images for production with the "IMAGES" Images binding.
12:39:45 [build] output: "server"
12:39:45 [build] adapter: @astrojs/cloudflare
12:40:10 [@astrojs/cloudflare] Injected immutable Cache-Control for /_astro/* into _headers.
12:40:10 [build] Complete!
$ nest build
Exit Code: 0
```

### 5. Cloudflare Workers Deployment Verification (`wrangler deploy --dry-run`)
```text
 ⛅️ wrangler 4.156.1
───────────────────────────────────────────────
[custom build] Running: bun run build
[custom build] $ nest build

Total Upload: 8972.38 KiB / gzip: 1662.56 KiB
Your Worker has access to the following bindings:
Binding                                Resource                  
env.MONGO_DO (MongoDurableObject)      Durable Object            
env.IMAGES                             Images                    
env.NODE_ENV ("production")            Environment Variable      

--dry-run: exiting now.
Exit Code: 0
```

---

## Conclusion & Merge Readiness

All Qodo and Greptile review findings have been resolved with production-grade engineering practices. The code compiles without warnings or errors, passes all 157 unit and integration tests across both client and server, builds cleanly for Cloudflare Workers edge deployment, and maintains complete backwards compatibility.

**The PR `perf/performance-optimization` is verified, stable, and ready to merge into `main`.**

