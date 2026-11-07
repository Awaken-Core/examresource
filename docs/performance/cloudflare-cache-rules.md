# Cloudflare Caching (Ops Checklist)

Origin pages already emit `Cache-Control` with `s-maxage` + `stale-while-revalidate`. HTML for `govtpariksha.com` is served by the **`examresource-client` Worker**, so **zone Cache Rules do not cache Worker HTML**. Workers Cache (in front of the Worker) is required for `CF-Cache-Status: HIT` on SSR pages.

## 1. Workers Cache (required — code / wrangler)

In `apps/client/wrangler.jsonc`:

```jsonc
{
  "name": "examresource-client",
  "cache": { "enabled": true }
}
```

Middleware (`src/middleware.ts`) rewrites public responses:

- `Cache-Control: public, max-age=0` (browsers)
- `CDN-Cache-Control: public, max-age=<s-maxage>, stale-while-revalidate=<swr>` (Workers Cache edge)

Private routes keep `private, no-store` and stay uncached.

Deploy / verify:

```bash
cd apps/client
bun run build   # with production PUBLIC_* env
bunx wrangler deploy --keep-vars
```

```bash
curl -sI https://govtpariksha.com/
# Expect: CF-Cache-Status: MISS then HIT; CDN-Cache-Control with max-age
curl -sI https://govtpariksha.com/profile
# Expect: private / no-store (MISS or BYPASS is OK)
```

## 2. Zone Cache Rules (optional — static assets)

Zone rules still help **non-Worker** / asset paths (fonts, `/_astro/*`) when those bypass the SSR entrypoint:

1. **Bypass private HTML** — `/api`, `/admin`, `/administrator`, `/profile`, `/login`, `/signup`, `/favorites`, `/notifications`, `/test-series/cbt`, `/test-series/results`
2. **Cache public HTML respect origin** — GET + not private prefixes; Eligible for cache; Edge TTL = Respect origin
3. **Immutable static assets** — `/_astro/*`, `/fonts/*`, favicons; long Edge + Browser TTL

Do **not** cache authenticated HTML that embeds private data. Keep `/me` and user shells client-fetched.
