# Cloudflare Cache Rules (Ops Checklist)

Origin pages already emit `Cache-Control` with `s-maxage` + `stale-while-revalidate`. Without matching Cloudflare Cache Rules, anonymous HTML often stays `DYNAMIC` / `MISS` and TTFB stays origin-bound.

## Required dashboard rules

1. **Cache public HTML**
   - Match: hostname = production site; path does **not** start with `/api`, `/admin`, `/administrator`, `/profile`, `/login`, `/signup`, `/favorites`, `/notifications`, `/test-series/cbt`, `/test-series/results`
   - Cache eligibility: **Eligible for cache**
   - Edge TTL: **Respect origin Cache-Control headers**
   - Browser TTL: Respect origin / bypass if `max-age=0`

2. **Bypass private / auth surfaces**
   - Match: paths above + any request with `Cookie` containing session indicators if needed
   - Cache eligibility: **Bypass cache**

3. **Immutable assets**
   - Match: `/_astro/*`, `/fonts/*`, hashed static assets
   - Edge TTL: long (months); browser TTL: 1 year when `immutable` is present

## Verification

```bash
curl -sI https://<PUBLIC_SITE_URL>/
# Expect: CF-Cache-Status: HIT (on second request) and Cache-Control containing s-maxage

curl -sI https://<PUBLIC_SITE_URL>/profile
# Expect: private / no-store behavior (MISS or DYNAMIC is OK)
```

Do **not** cache authenticated HTML that embeds private data. Keep `/me` and user shells client-fetched.
