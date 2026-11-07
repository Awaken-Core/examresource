# Remaining Performance & UX Optimization Report

**Date:** 2026-11-07  
**Method:** [Addy Osmani performance-optimization skill](../../.agents/skills/performance-optimization/SKILL.md) — measure → identify → fix → verify → guard  
**Scope:** `apps/client` (Astro SSR) + `apps/server` (NestJS / Cloudflare Workers)  
**Baseline docs:** [PERFORMANCE.md](../PERFORMANCE.md), [performance-optimization-report.md](./performance-optimization-report.md), [performance-audit-report.md](./performance-audit-report.md)

---

## Executive summary

Prior Stages 0–12 already fixed false article 404s, guest `/me` spam, DO pool starvation, test-series HTML bloat, dual language HTML in the page, session write thrash, and sync image SSR.

### Implemented 2026-11-07 (pass 1 + pass 2)

| Item | Status |
|---|---|
| `inlineStylesheets: 'auto'` | Done |
| Article API alt metadata-only (no dual `htmlContent`) | Done |
| FooterFeedback `client:idle`; test-series islands idle/visible | Done |
| TestAttempt lean answers + hydrate from exam on read | Done |
| Cache-Control on public/private pages | Done |
| Font preload trimmed; home video `preload=metadata` | Done |
| Notif throttle 60s | Done |
| web-vitals RUM → GA4/dataLayer | Done |
| Profile/results/rank/daily-quiz → `client:idle` | Done |
| Language toggle hover/idle prefetch | Done |
| Series tests SSR first page + Load more | Done |
| Test-series count aggregations → `$facet` | Done |
| Blogs/latest-updates pagination + load more | Done |
| Ctrl+K live blogs/test-series search | Done |
| Spotlight search module extracted | Done |
| Blog `getPublished` request coalescing | Done |
| LHCI config + CF cache rules checklist | Done |

Remaining: full Layout script modularization; Workers KV/Cache API for cross-isolate public API; apply CF dashboard rules in production.

---

## Already strong (do not re-work)

| Area | Status | Evidence |
|---|---|---|
| Article SSR resilience | Stale cache + 503, not false 404 | `[slug].astro`, `article-cache.ts`, `publicFetch.ts` |
| Request coalescing | In-flight dedupe + stale on 5xx | `publicFetch.ts` |
| Guest auth | `guest_verified` skips repeat `/me` | `Layout.astro` |
| Session writes | `lastUsedAt` throttled ~1h | `auth.service.ts` |
| DO pool | `maxPoolSize: 10` | `mongo-durable-object.ts` |
| Test-series HTML | SSR scoped to `testMode=full` | `test-series/[id].astro` |
| Lang HTML strip | `#article-lang-data` `htmlBody: ''` | `[slug].astro`, `article-lang-swap.ts` |
| Blog indexes | Compound listing indexes | `blog.schema.ts` |
| Fonts | Self-hosted woff2 (not Google Fonts) | `Layout.astro`, `public/fonts/` |

---

## Claimed fixed — still open / drifted

| Prior claim | Code today | Severity |
|---|---|---|
| Stage 11: `inlineStylesheets: 'auto'` | Still `'always'` in `apps/client/astro.config.mjs` | **P0** |
| Stage 5: dual language payload removed | Client OK; API still builds `alternateArticle.htmlContent` + extra `getBlocks` | **P0** |
| Stage 8: notif throttle 60s | `NOTIF_FETCH_MIN_INTERVAL = 20_000` in `notifications.ts` | **P1** |
| Stage 2: article timeout 8s | Still `AbortSignal.timeout(6000)` in `[slug].astro` | **P2** docs drift |
| PERFORMANCE.md dual-DOM bilingual + Google Fonts | Reality = on-demand fetch + self-hosted fonts | Docs stale |

---

## Open findings

### P0

#### 1. Restore external CSS (`inlineStylesheets: 'always'`)

- **Problem:** Every HTML response inlines full Tailwind (~150–244KB), defeating browser/CDN CSS cache.
- **Evidence:** `apps/client/astro.config.mjs` L45.
- **Impact:** Inflated HTML on all routes; hurts TTFB parse, FCP/LCP, mobile data.
- **Fix:** Set `inlineStylesheets: 'auto'`; verify `/_astro/*.css` has long-lived immutable caching.
- **Expected:** −150–200KB HTML; repeat navigations reuse CSS.
- **Measure:** HTML transfer size; Network waterfalls; Lighthouse “Eliminate render-blocking”.

#### 2. Stop shipping unused alternate article bodies from the API

- **Problem:** `getPublished` always builds `alternateArticle.htmlContent` and awaits sequential `getBlocks(altId)` after the main `Promise.all`. Client first paint only needs alt metadata.
- **Evidence:** `apps/server/src/modules/blog/blog.service.ts` L606–638; `[slug].astro` only checks alt metadata / presence.
- **Impact:** +200–300KB JSON on cold article TTFB; extra DO round-trip.
- **Fix:** Return alt metadata only (`slug`, `language`, `title`, …). Opt-in `?includeAlternateBody=1` for language swap fetch. Optionally fold remaining alt work into the same `Promise.all`.
- **Expected:** Origin article TTFB −30–50%; smaller MemoryCache entries.
- **Measure:** `/api/v1/blogs/:slug` Content-Length; SSR timing; DO query count.

### P1

| # | Finding | Evidence | Fix | Expected |
|---|---|---|---|---|
| 3 | `FooterFeedback client:load` on most pages | `Footer.astro:69` | `client:idle` or click-lazy `import()` | −1 React island on majority of views |
| 4 | Test-series islands `client:load` | `test-series/index.astro`, `[id].astro` | Carousel `client:visible`; explorer/detail `client:idle` | Lower TBT on `/test-series*` |
| 5 | TestAttempt duplicates full `questionSnapshot` | `exam.service.ts` startAttempt | Store ids/status only; resolve from exam snapshot | Attempt docs ~99% smaller |
| 6 | Cache-Control holes | Only ~12 Astro pages set headers | Public: `s-maxage`+SWR; private: `no-store` | More &lt;50ms edge TTFB |
| 7 | 3 fonts preloaded every page (~147KB) | `Layout.astro:194–197` | Route-scoped preload | Faster LCP on content pages |
| 8 | No field CWV / synthetic budgets | No `web-vitals` / LHCI in client | RUM + CI budgets | Catch silent regressions |

### P2

9. Notification throttle 20s (restore 60s / visibility-aware).  
10. `Layout.astro` ~2k lines inline client logic — split hashed modules, defer idle.  
11. Listing pagination gaps (`blogs` 60, `latest-updates` 100, large series full tab).  
12. MemoryCache is per-isolate only (blog + test-series) — consider Cache API / KV.  
13. Homepage hero video `preload="auto"` if configured — use `metadata`.  
14. Remote cover `<Image>` may still cost SSR on Workers — prefer plain `<img>` + R2 srcset if needed.

### P3

15. Docs drift in `PERFORMANCE.md` / prior report (timeouts, TTLs, fonts, bilingual).  
16. Node `database.module.ts` `maxPoolSize: 2` — raise only if Node/Bun serves prod.  
17. `prefetchAll: true` may contend on slow mobile.  
18. Language-swap first toggle is network-bound by design — idle-prefetch on language control hover.

---

## Quick wins (&lt; 1 day)

1. Flip `inlineStylesheets` → `'auto'` and verify build/headers.  
2. Strip alt `htmlContent`/`blocks` from default article API.  
3. `FooterFeedback` → click-lazy / `client:idle`.  
4. Notif interval → 60s; route-scoped font preloads.  
5. Add Cache-Control to daily-quiz, policies, pricing.  
6. Soften carousel/explorer to `client:visible` / `idle`.  
7. Hero video `preload="metadata"`.

## Structural

1. TestAttempt snapshot denormalization migration.  
2. Shared edge/KV cache for public API beyond isolate MemoryCache.  
3. Split Layout scripts; route-level code splitting for CBT/profile.  
4. Paginated test lists + virtualized long lists.  
5. RUM + LHCI budgets in CI.  
6. Reconcile Cloudflare cache rules with origin headers.

---

## Suggested budgets & guards

| Budget | Target |
|---|---|
| Public HTML (gzip) | &lt; 100KB article/category; &lt; 80KB home |
| Initial JS (editorial) | &lt; 90KB gzipped; zero React unless intentional |
| Test-series island | &lt; 200KB gzipped |
| CSS (external) | &lt; 80KB gzipped; immutable `/_astro/*` |
| Fonts preloaded / page | ≤ 1 family above-fold; &lt; 100KB |
| Article API JSON | &lt; 150KB without unused alt body |
| API p95 (cached public) | &lt; 100ms warm; &lt; 400ms cold |
| LCP / INP / CLS | ≤ 2.0s / ≤ 100ms / ≤ 0.05 |
| Edge TTFB (cache HIT) | &lt; 50ms |

**Guards:** `web-vitals` RUM (or CF Web Analytics / Speed Insights); LHCI on `/`, `/blogs`, sample article, `/test-series`; fail PR on public JS +15% or HTML +20KB; alert on article 5xx/503 and DO wait-queue timeouts.

**Verify loop:** one change → same measurement as baseline → keep only if delta &gt; noise → guard the metric users feel.

---

## Recommended first move

1. Flip `inlineStylesheets` to `'auto'`, measure HTML transfer on `/`, `/blogs`, and one article.  
2. Strip `alternateArticle.htmlContent` from default `getPublished`.  
3. Add lightweight RUM so the next regression cannot silent-ship.

Say the word and we implement P0 first, then hydrate hygiene (P1 #3–4).
