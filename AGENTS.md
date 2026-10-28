# AI Development Guidelines & System Architecture (AGENTS.md)

This file contains **mandatory instructions and context** for any AI agent or developer working in this repository. Read and adhere to every section before reading or modifying code.

---

## 🚨 Non-Negotiable Core Rules

1. **Package Manager: Bun Exclusively**
   - **ALWAYS** use `bun` (`bun install`, `bun run dev`, `bun run build`, `bun test`, etc.).
   - **NEVER** use `npm`, `yarn`, or `pnpm` unless interacting with a tool that explicitly mandates it.
   - The lockfile is `bun.lock`. Do not introduce `package-lock.json` or `yarn.lock`.

2. **Zero Hardcoded URLs & Environments**
   - **NEVER** hardcode URLs (e.g. `localhost:3000`, `localhost:5000`, `govtpariksha.com`, API endpoints) or environment configurations in code or templates.
   - In `apps/client`, retrieve all URLs and configuration from `import.meta.env` (e.g., `import.meta.env.PUBLIC_API_URL`, `import.meta.env.PUBLIC_SITE_URL`).
   - In `apps/server`, validate all variables in `src/core/config/env.ts` with Zod schemas and access them strictly via `env.*` or dependency-injected config.
   - Never commit sensitive secrets (`.env` files) to git.

3. **Consult Skills in `.agents`**
   - **Frontend & UI/UX**: Always check and adhere to:
     - `.agents/skills/astra-frontend-design/SKILL.md` (Design systems, layout hierarchy, visual polish).
     - `.agents/skills/ui-ux-pro-max/SKILL.md` (Design intelligence, color palettes, typography, spacing).
     - `.agents/skills/mobile-responsive/SKILL.md` (Mobile responsiveness, touch targets, mobile PageSpeed & LCP optimization).
   - **AEO & SEO Optimization**:
     - `.agents/skills/aeo-audit/SKILL.md` (Answer Engine Optimization for Google AI Overviews, ChatGPT, Perplexity, citation readiness, query fan-out, entity grounding, and non-commodity content).
     - `.agents/skills/seo-audit/SKILL.md` (Technical SEO checklist, Schema.org structured data, and Core Web Vitals).
   - **Backend NestJS**: Always follow:
     - `.agents/skills/nestjs-best-practices/SKILL.md` (Architecture, modular dependency injection, security, transaction safety, exception filters, DTO validation).

4. **Preserve Comments & Existing Conventions**
   - Retain existing docstrings, technical rationale comments, and test suites.
   - Do not remove or alter existing business logic or API contracts without explicit instruction.

---

## 🚢 Production Deployment Protocol

Production deployments are automated via Git. Pushing to **`main`** triggers the production build and deployment pipeline on **Vercel** (for `apps/client`) and **Cloudflare Workers** (for `apps/server`).

### The Standard Deployment Sequence
```bash
# 1. Run local pre-flight checks
bun run typecheck
bunx astro check
bun run lint
bun run test
bun run build

# 2. Commit and push your verified changes to main (production)
git checkout main
git add <files>
git commit -m "feat/fix: descriptive message"
git push origin main
```

> [!IMPORTANT]
> **`main` is the production branch.** Never push untested or breaking changes directly to `main`. Always test locally using `bun run typecheck`, `bunx astro check`, `bun run lint`, `bun run test`, and `bun run build` before pushing to `main`.

---

## 📚 Version 2 Architecture & Branching (`feat/textbook-v2`)

All Version 2 features (textbooks, mock tests, subject/topic exam modules, question banks) are actively developed on the **`feat/textbook-v2`** branch:
- **Repository Branch URL**: [https://github.com/Awaken-Core/examresource/tree/feat/textbook-v2](https://github.com/Awaken-Core/examresource/tree/feat/textbook-v2)
- Feature development for v2 should branch off and merge into `feat/textbook-v2`.
- When stabilizing v2 features for production release, changes are merged into `main`.

See detailed procedures in [docs/DEPLOYMENT.md](file:///c:/Users/Devil/Desktop/examresource/docs/DEPLOYMENT.md).

---

## 🏛️ System Architecture Summary

The repository is a high-performance **monorepo** configured with Bun workspaces (`apps/*`):

```
examresource/
├── apps/
│   ├── client/                  # Astro 5 SSR Web Application (Vercel Edge)
│   │   ├── src/
│   │   │   ├── components/      # UI components & React islands
│   │   │   ├── layouts/         # Layout.astro (SEO, fonts, critical CSS) & AdminLayout.astro
│   │   │   ├── lib/             # API client, instant language swap, bookmark storage
│   │   │   ├── pages/           # SSR routes (Home, Categories, [slug], Admin)
│   │   │   └── styles/          # Tailwind CSS v4 & custom design tokens
│   │   └── astro.config.mjs     # Vercel adapter, prefetch, Vite config
│   │
│   └── server/                  # NestJS 12 REST API (Node.js & Cloudflare Worker)
│       ├── src/
│       │   ├── core/            # Config (Zod), MongoDB Durable Object proxy, Mongoose schemas
│       │   ├── modules/         # Auth, Blog, Book, Exam, Media, Question, Notifications
│       │   ├── worker-shims/    # Cloudflare Worker shims (Sharp, optional Nest modules)
│       │   ├── bootstrap.ts     # Express application factory & security middleware
│       │   ├── main.ts          # Node.js entrypoint (bun run start:prod)
│       │   └── worker.ts        # Cloudflare Workers entrypoint (nodejs_compat + Durable Object)
│       └── wrangler.jsonc       # Cloudflare Workers configuration
├── docs/                        # Comprehensive documentation (Architecture, Performance, Deployment)
├── .agents/skills/              # UI/UX and NestJS best practices guidelines
├── package.json                 # Unified monorepo scripts
└── bun.lock                     # Bun lockfile
```

### Key Technical Characteristics
1. **Frontend (`apps/client`)**:
   - **Astro 5 SSR** using `@astrojs/vercel`.
   - **React 19** utilized only where necessary for rich interactive islands (TipTap WYSIWYG editor in `/admin`, live search modal).
   - **Tailwind CSS v4** via `@tailwindcss/vite`.
   - **Astro ClientRouter** (`astro:transitions`) enabling seamless page navigations without full document reloads.

2. **Backend (`apps/server`)**:
   - **NestJS 12** with Express adapter.
   - **Dual-Runtime Compatibility**: Runs natively on standard Node.js/Bun servers (`main.ts`) AND compiles to **Cloudflare Workers** (`worker.ts`) using Cloudflare's `nodejs_compat` runtime via `httpServerHandler`.
   - **Durable Object Database Proxy**: In Cloudflare Workers, outbound MongoDB TCP connections are proxied via `MongoDurableObject` (`MONGO_DO` binding) to maintain persistent connection pooling without socket churn.
   - **Authentication**: Opaque, MongoDB-backed session tokens with `__Host-sid` HTTP-only, `Secure`, `SameSite=Lax` cookies, Argon2id password hashing, and verified Google OAuth 2.0 flow. (Clerk was removed).
   - **Media Storage**: Cloudflare R2 via presigned URLs (`@aws-sdk/s3-request-presigner`). Browsers upload media directly to R2; credentials never touch client code.

---

## ⚡ Performance & PageSpeed (95+ Requirement)

Maintaining high Google PageSpeed scores (95+ on Desktop, 90+ on Mobile) is an absolute priority for this project.

### Critical Performance Guardrails:
1. **Zero Render-Blocking Resources**:
   - Do not load heavy third-party CSS or JS in `<head>`.
   - Google Analytics (GA4) and Google Tag Manager (GTM) must remain deferred to avoid blocking First Contentful Paint (FCP) and Largest Contentful Paint (LCP).
   - Font loading uses `font-display: swap` and preconnect links.
2. **Instant Language Swapping (Bilingual Architecture)**:
   - Articles are stored in both `HINGLISH` and `ENGLISH` linked by `translationGroupId`.
   - The SSR payload bundles both versions. Switching language toggles DOM elements and updates browser history via `history.pushState` with **zero network requests or reloads**.
3. **Edge Caching & S-MaxAge**:
   - SSR pages leverage HTTP caching: `Cache-Control: public, max-age=0, s-maxage=60-300, stale-while-revalidate=600`.
   - Internal service-level memory cache caches frequently read endpoints with automatic eviction upon updates or deletions.
4. **Resilient SSR Data Fetching**:
   - Always wrap server-side fetches with `AbortSignal.timeout(6000)` to prevent serverless function hangs on transient network hiccups.
5. **No Layout Shift (CLS = 0)**:
   - Always specify explicit `width` and `height` (or aspect ratios) on images and SVG icons.
   - Never inject asynchronous content that pushes existing visible elements down after load.

---

## 🧪 Verification Commands

Before concluding any task or pushing to git:

```bash
# Typecheck backend
bun run typecheck

# Check Astro client types & components
bunx astro check

# Lint backend
bun run lint

# Run backend unit & integration tests
bun run test

# Test building client and server
bun run build
```

Read [docs/ARCHITECTURE.md](file:///c:/Users/Devil/Desktop/examresource/docs/ARCHITECTURE.md), [docs/PERFORMANCE.md](file:///c:/Users/Devil/Desktop/examresource/docs/PERFORMANCE.md), and [docs/DEPLOYMENT.md](file:///c:/Users/Devil/Desktop/examresource/docs/DEPLOYMENT.md) for full technical documentation.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
