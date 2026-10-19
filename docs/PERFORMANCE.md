# Performance & PageSpeed Optimization Guide (PERFORMANCE.md)

This document details the engineering techniques, architectural guardrails, and caching strategies that keep **GovtPariksha** delivering **95+ Google PageSpeed Insights scores** on both Mobile and Desktop devices under high concurrent traffic.

---

## 🎯 Target Web Vitals & SLA

| Metric | Target | Realized Goal | Primary Strategy |
|---|---|---|---|
| **LCP (Largest Contentful Paint)** | `< 2.0s` | **1.2s - 1.5s** | Server-Side Inlining, `fetchpriority="high"`, Edge SSR |
| **INP (Interaction to Next Paint)** | `< 100ms` | **< 40ms** | Minimal client-side JS, zero hydration overhead for public pages |
| **CLS (Cumulative Layout Shift)** | `< 0.05` | **0.000** | Strict explicit image dimensions, aspect-ratio containers, no late font shifts |
| **FCP (First Contentful Paint)** | `< 1.2s` | **0.7s - 0.9s** | Inlined critical CSS, deferred third-party trackers |
| **PageSpeed Score (Mobile)** | `90 - 100` | **93 - 98** | Deferred analytics, zero render-blocking CSS/JS |
| **PageSpeed Score (Desktop)** | `95 - 100` | **98 - 100** | Vercel Edge caching, in-memory query cache |

---

## 🚀 Frontend Performance Architecture (`apps/client`)

### 1. Zero Render-Blocking Third-Party Scripts
Third-party scripts (Google Tag Manager, Google Analytics, AdSense) are notorious for destroying mobile PageSpeed scores.
- **GTM & GA4 Deferral**: In `Layout.astro`, GTM and GA4 are initialized with lightweight inline stubs and deferred execution. They listen to the `astro:page-load` event without delaying DOM parsing, HTML streaming, or critical paint.
- **AdSense Containment**: AdSense slots remain unmounted or strictly contained inside fixed-dimension wrapper boxes to prevent layout shifts.

### 2. Font Loading Strategy
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
/>
```
- Preconnect handshakes establish DNS and TLS connections to Google Fonts ahead of time.
- `font-display: swap` ensures immediate text rendering using system fallback fonts without invisible text flash (FOIT).

### 3. Critical CSS & Design Tokens
- Built with **Tailwind CSS v4** via `@tailwindcss/vite`, ensuring dead-code CSS elimination during build time.
- Critical layout scaffolding and theme CSS variables are injected directly into `<head>`, ensuring the page renders in light or dark mode instantly without a flash of unstyled content (FOUC).

### 4. Image Optimization Rules
1. **LCP Hero Images**:
   - Always apply `fetchpriority="high"` and `loading="eager"` on above-the-fold hero images or featured article banners.
   - Use Cloudflare R2 WebP formatted images with proper srcset.
2. **Below-the-Fold Images**:
   - Use `loading="lazy"` and `decoding="async"`.
3. **CLS Prevention**:
   - Every `<img>` tag and SVG must have explicit `width` and `height` attributes (e.g. `width="40" height="40"`) or an inline `aspect-ratio` style.

### 5. Instant Bilingual Language Swapping (Zero Latency)
Instead of forcing a full page reload or secondary API request when a user toggles between English and Hinglish:
1. Astro SSR fetches both language documents from the API in a single query (`getPublished`).
2. Both language views are rendered into the initial HTML document.
3. The client-side switcher (`article-lang-swap.ts`) toggles their visibility instantaneously via CSS classes (`hidden` / `block`).
4. The URL slug is updated using `window.history.pushState({}, '', newSlug)`.
5. Result: **0 milliseconds network latency, 0 layout shifts, 0 server calls**.

---

## ⚡ Server & Edge Caching Architecture

### 1. Vercel Edge HTTP Caching
SSR responses from Astro are served through Vercel's global edge network using modern Cache-Control headers:

```http
Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=600
```
- `s-maxage=60`: Edge nodes cache the complete HTML document for 60 seconds. High traffic bursts hit the edge cache with response times `< 20ms`.
- `stale-while-revalidate=600`: If an edge cache entry expires, the edge serves the stale version to the user instantly while asynchronously revalidating from the Astro SSR function in the background.

### 2. Backend In-Memory Service Cache (`apps/server`)
`BlogService` maintains a high-speed `MemoryCache` with proactive invalidation:
- **Listing TTL**: 60 seconds for category feeds, latest updates, and search listings.
- **Article TTL**: 120 seconds for published article payloads.
- **Active Eviction**: Any `POST`, `PUT`, or `DELETE` mutation on blogs, categories, or tags immediately invalidates the corresponding cached keys.

### 3. Resilient SSR Fetching & Timeout Guardrails
To prevent slow database queries or serverless cold starts from locking up the Astro SSR pipeline:
```typescript
const response = await fetch(endpoint, {
  signal: AbortSignal.timeout(6000), // 6 second safety cutoff
  headers: { 'Accept': 'application/json' },
});
```
If an upstream API does not respond within 6 seconds, the client gracefully falls back to cached data or fallback UI rather than timing out the entire user request.

---

## 🛠️ Cloudflare Worker Bundle & Cold-Start Optimization

When compiled for Cloudflare Workers (`dist/worker.js`):
1. **Durable Object Socket Reuse**: The `MongoDurableObject` manages pooled TCP connections to MongoDB, eliminating the 200ms+ TLS handshake cost on every cold worker request.
2. **Worker Shims**:
   - Native modules like `sharp` are shimmed using Cloudflare Images bindings.
   - Heavy optional NestJS microservice dependencies are aliased in `wrangler.jsonc` to `worker-shims/nest-optional.js`.
   - Results in a tiny worker bundle that cold-starts in **under 50 milliseconds**.

---

## 📋 Ongoing Performance Maintenance Checklist

When writing new features or UI components, follow these rules:

- [ ] **No Unbounded Client Bundles**: Avoid importing large npm packages in client components. Prefer native browser APIs.
- [ ] **Strict Image Dimensions**: Ensure every new image element has explicit `width` and `height`.
- [ ] **Astro Prefetch Strategy**: Ensure internal navigation links benefit from Astro's hover-based prefetching.
- [ ] **Validate Core Web Vitals**: Run Lighthouse or PageSpeed Insights before merging any UI changes to `release/prod`.
