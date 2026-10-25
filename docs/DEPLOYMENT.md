# Production Deployment Guide (DEPLOYMENT.md)

This document provides the standard operating procedure for deploying the **GovtPariksha / ExamResource** platform to production, along with branching conventions, environment configurations, and rollback workflows.

---

## 🚀 The Production Deployment Workflow

Deployment to production is triggered automatically via Git branch tracking. The production branch is **`main`**.

### Standard Release Sequence

Execute the following commands from the project root:

```bash
# Step 1: Run pre-flight verification locally
bun run typecheck
bunx astro check
bun run lint
bun run test
bun run build

# Step 2: Ensure your local working tree is clean and push verified changes to main
git checkout main
git add .
git commit -m "feat/fix: descriptive summary of release changes"
git push origin main
```

---

## 📚 Version 2 Architecture & Development (`feat/textbook-v2`)

All development for **Version 2** of the platform (textbooks, subject/topic learning portals, mock test series, and question banks) is centralized on the **`feat/textbook-v2`** branch:

- **Branch URL**: [https://github.com/Awaken-Core/examresource/tree/feat/textbook-v2](https://github.com/Awaken-Core/examresource/tree/feat/textbook-v2)

### Version 2 Workflow:
1. **Branch off v2**:
   ```bash
   git fetch origin
   git checkout -b feat/v2-my-feature origin/feat/textbook-v2
   ```
2. **Develop & Test**: Verify with `bun run typecheck`, `bunx astro check`, `bun run lint`, and `bun run test`.
3. **Open PR against `feat/textbook-v2`**: Version 2 PRs should target `feat/textbook-v2`.
4. **Promotion to Production (`main`)**: Once v2 milestones are verified and stable, `feat/textbook-v2` is merged into `main` to trigger the production deployment.

---

## ⚙️ What Happens When You Push to `main`?

1. **Frontend (`apps/client`) on Vercel**:
   - Vercel is connected to the GitHub repository with the **Production Branch** configured to `main`.
   - Vercel triggers a production deployment using `@astrojs/vercel` running Astro SSR on the Vercel Edge/Serverless Network.
   - Build command: `astro build` (defined in `apps/client/package.json`).
   - Output directory: `.vercel/output`.

2. **Backend (`apps/server`) on Cloudflare Workers / Node.js**:
   - Cloudflare Workers / CI monitors `main`.
   - Builds the worker using `nest build` and `wrangler deploy` (or runs `bun run start:prod` on a production Node container).
   - Bundles `worker.ts` with Cloudflare `nodejs_compat` runtime and binds the `MONGO_DO` Durable Object for database proxying.

---

## 📋 Pre-Flight Checklist

Before pushing or merging into `main`, ALWAYS verify the following locally:

```bash
# 1. Typecheck the backend NestJS application
bun run typecheck

# 2. Typecheck and validate Astro frontend
bunx astro check

# 3. Run linter across backend
bun run lint

# 4. Execute unit and integration tests
bun run test

# 5. Run production build test for both client and server
bun run build
```

> [!CAUTION]
> Never skip the pre-flight checks. Pushing broken TypeScript code to `main` will cause production build failures and disrupt live traffic.

---

## 🔑 Production Environment Variables

### 1. Frontend (`apps/client`)
Configured in the **Vercel Project Dashboard** (under Project Settings -> Environment Variables) for the Production environment:

| Variable | Description | Example / Note |
|---|---|---|
| `PUBLIC_SITE_URL` | Canonical public site origin | `https://govtpariksha.com` |
| `PUBLIC_SITE_NAME` | Display site name | `GovtPariksha` |
| `PUBLIC_SITE_DOMAIN` | Site domain without protocol | `govtpariksha.com` |
| `PUBLIC_API_URL` | Production REST API base URL | `https://govtpariksha.com/api/v1` |
| `PUBLIC_GTM_ID` | Google Tag Manager Container ID | `GTM-PX3RG8RR` |
| `PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID | `G-7PL205BLQP` |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification meta | `verification_token` |
| `PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster verification token | `bing_token` |
| `PUBLIC_WHATSAPP_URL` | Optional social channel link | `https://whatsapp.com/channel/...` |
| `PUBLIC_TELEGRAM_URL` | Optional telegram channel link | `https://t.me/...` |
| `PUBLIC_ADSENSE_CLIENT` | Optional Google AdSense client ID | `ca-pub-XXXXXXXXXXXXXXXX` |
| `RESEND_API_KEY` | Resend API key for contact form emails | `re_...` |
| `RESEND_FROM_EMAIL` | Sender address for transactional emails | `GovtPariksha <noreply@govtpariksha.com>` |
| `CONTACT_RECEIVER_EMAIL` | Destination mailbox for contact submissions | `support@govtpariksha.com` |

### 2. Backend (`apps/server`)
Configured in **Cloudflare Worker Secrets** (via `wrangler secret put <KEY>`) or host environment:

| Variable | Description | Note |
|---|---|---|
| `DATABASE_URL` | MongoDB connection URI (`mongodb+srv://...`) | Must have connection pooling parameters |
| `NODE_ENV` | Runtime environment | Set to `production` |
| `PORT` | API server port (for Node runtime) | `5000` |
| `CLIENT_URL` | Frontend origin for CORS and session cookies | `https://govtpariksha.com` |
| `SESSION_TTL_DAYS` | User session lifetime in days | `30` |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Application Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Kept strictly confidential |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | `https://govtpariksha.com/api/v1/auth/google/callback` |
| `R2_ACCOUNT_ID` | Cloudflare Account ID | For S3 SDK presigner |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API Token Access Key ID | S3 compatible credential |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API Token Secret Key | S3 compatible credential |
| `R2_BUCKET` | Cloudflare R2 Bucket name | `examresource-media` |
| `R2_PUBLIC_BASE_URL` | Public CDN URL for images | `https://media.govtpariksha.com` |
| `GEMINI_API_KEY` | Google Gemini API Key | For AI content translation & SEO analysis |
| `GEMINI_MODEL` | Google Gemini model identifier | `gemini-3.8-flash` |

---

## 🛠️ Cloudflare Worker Specifics

When deploying the backend to Cloudflare Workers:
1. `wrangler.jsonc` specifies `main: "dist/worker.js"`.
2. The Worker uses the `MongoDurableObject` binding to proxy MongoDB socket connections.
3. Native Node packages (`sharp`, `class-validator`, etc.) are mapped to lightweight worker shims in `src/worker-shims/` via Wrangler aliases.
4. To test a dry-run deployment:
   ```bash
   bun run --cwd apps/server worker:check
   ```
5. To deploy directly from CLI if necessary:
   ```bash
   bun run --cwd apps/server worker:deploy
   ```

---

## 🚑 Rollback Procedures

If an unexpected defect occurs in production:

### Option A: Instant Vercel Rollback (Frontend)
1. Go to **Vercel Dashboard** -> **Deployments**.
2. Locate the previous stable deployment.
3. Click the three dots `...` and select **Rollback to this deployment**.
4. Traffic is routed to the healthy deployment instantly (< 10 seconds).

### Option B: Git Revert on `main`
```bash
# Ensure you are on main
git checkout main

# Revert the faulty commit or merge
git revert HEAD -m 1

# Push the reverted commit to trigger production redeployment
git push origin main
```

### Option C: Cloudflare Workers Rollback (Backend)
1. Go to **Cloudflare Dashboard** -> **Workers & Pages** -> **examresource** -> **Deployments**.
2. Select the prior deployment version and click **Rollback**.

---

## 🔍 Post-Deployment Verification

After pushing to `main`:
1. Check the Vercel and Cloudflare dashboard logs for successful build output.
2. Visit `https://govtpariksha.com` in Incognito:
   - Check that the homepage loads instantly without hydration errors.
   - Test language toggle (`Hinglish` <-> `English`) on any article page.
   - Test dark / light theme toggle.
   - Verify that Google Analytics script loaded deferred without blocking.
3. Verify API Health:
   - Request `https://govtpariksha.com/api/v1/health` (or root health check endpoint) returning 200 OK.
4. Run Google PageSpeed Insights on `https://govtpariksha.com` to confirm performance score remains in the 90-100 range.
