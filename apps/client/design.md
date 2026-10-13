---
version: alpha
name: Takeuforward
description: |
  takeUforward's design system projects a dark, tech-forward aesthetic optimized
  for deep focus and extended learning sessions. All tokens are configured via
  Tailwind CSS v4's @theme directive in src/styles/global.css — NO raw CSS is
  used for component styling. Every value auto-generates Tailwind utility classes.
source:
  url: "https://takeuforward.org/blogs"
  pagesAnalyzed: 6
  extractedAt: 2026-10-13
---

# Design System — takeUforward-Inspired Dark Theme

> **⚠️ MANDATORY: All AI agents (Claude, Antigravity, Cursor, Kiro) MUST read this file AND `public/blog_formatting_seo_guidelines.md` BEFORE performing ANY frontend task.**

> **🚫 NO RAW CSS: All styling MUST use Tailwind utility classes. Component styles use `@apply` in `@layer components`. Never write raw CSS properties for component styling.**

---

## 1. Tailwind CSS v4 Architecture

All design tokens are defined in `src/styles/global.css` inside the `@theme {}` block. Tailwind v4 automatically generates utility classes from these CSS custom properties:

```
@theme variable          →  Generated Tailwind class
──────────────────────────────────────────────────
--color-canvas           →  bg-canvas, text-canvas, border-canvas
--color-accent           →  bg-accent, text-accent, border-accent
--font-sans              →  font-sans
--text-heading-md        →  text-heading-md (sets font-size + line-height)
--radius-card            →  rounded-card
--shadow-elevated        →  shadow-elevated
--spacing-section        →  p-section, m-section, gap-section
--z-modal                →  z-modal
```

---

## 2. Color Palette — Tailwind Classes

### Core Colors
| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--color-canvas` | `#131316` | `bg-canvas` | Page background |
| `--color-primary` | `#292418` | `bg-primary`, `text-primary` | Secondary buttons, brand |
| `--color-accent` | `#327CF6` | `bg-accent`, `text-accent` | Primary CTAs ONLY |
| `--color-white` | `#FFFFFF` | `text-white` | All body & heading text |
| `--color-black` | `#000000` | `text-black` | Decorative/utility |

### Semantic Colors
| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--color-error` | `#4C5973` | `bg-error`, `text-error` | Error states |
| `--color-success` | `#9CB2DD` | `bg-success`, `text-success` | Success states |

### Surface Colors (Dark Theme)
| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--color-surface` | `#1C1B1F` | `bg-surface` | Cards, containers |
| `--color-surface-raised` | `#252528` | `bg-surface-raised` | Elevated surfaces, hover |
| `--color-border` | `#2A2925` | `border-border` | All borders |
| `--color-muted` | `#A0A0A3` | `text-muted` | Secondary text, metadata |
| `--color-subtle` | `#1D1A12` | `bg-subtle` | Ghost button background |

### Light Theme Override
Applied via `class="theme-light"` on container. Overrides CSS variables:
| Role | Light Value |
|---|---|
| Canvas | `#FBFBFB` |
| Surface | `#F1F1F1` |
| Raised | `#E9E9E9` |
| Text | `#121211` |
| Muted | `#747473` |
| Border | `#D8D8D8` |

---

## 3. Typography — Tailwind Classes

### Font Families
| Tailwind Class | Font | Usage |
|---|---|---|
| `font-sans` | DM Sans | Body, headings, buttons — primary font |
| `font-display` | Geist | Labels, display accents |
| `font-mono` | ui-monospace | Code blocks, technical content |

### Font Sizes (auto-includes line-height)
| Tailwind Class | Size | Line Height | Usage |
|---|---|---|---|
| `text-display-xxl` | 226px | 1.5 | Hero headline (rare) |
| `text-display-xl` | 98px | 1.2 | Super-large display |
| `text-display-lg` | 56px | 1.1 | Large hero headline |
| `text-display-md` | 48px | 1.2 | Section headline |
| `text-heading-xxl` | 39.7px | 1.2 | Extra-large section |
| `text-heading-xl` | 32px | 1.2 | Large section title |
| `text-heading-lg` | 28px | 1.5 | Medium section title |
| `text-heading-md` | 24px | 1.5 | Standard heading, cards |
| `text-heading-sm` | 16px | 1.25 | Subsection title |
| `text-heading-xs` | 13px | 1.5 | Micro heading |
| `text-body-lg` | 16px | 2 | Large body paragraph |
| `text-body-md` | 14px | 1.5 | Default body text |
| `text-body-sm` | 13px | 1 | Compact emphasized |
| `text-body-xs` | 12px | 1.5 | Small secondary text |
| `text-button-md` | 14px | 1.5 | Standard button label |
| `text-button-sm` | 13px | 1.54 | Small button label |
| `text-button-xs` | 10px | 1.5 | Minimal button |
| `text-caption-sm` | 12px | 1 | Default caption |
| `text-caption-xs` | 11px | 1.45 | Timestamps |
| `text-nav` | 16px | 1.5 | Navigation links |
| `text-label` | 14px | 1.43 | Form labels |
| `text-code` | 14px | 1.36 | Code blocks |

### Font Weights (use Tailwind defaults)
| Class | Weight | Usage |
|---|---|---|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Buttons, nav, body-lg-strong |
| `font-semibold` | 600 | Headings (sm–xxl), captions |
| `font-bold` | 700 | heading-md, display-strong |
| `font-extrabold` | 800 | display-xl (Geist) |

### Letter Spacing
| Class | Value | Usage |
|---|---|---|
| `tracking-tighter` | -1.12px | Display-lg-strong |
| `tracking-tight` | -0.32px | Body-lg-strong |
| `tracking-normal` | 0px | Default |
| `tracking-wide` | 0.24px | Caption-sm-2 |
| `tracking-wider` | 0.32px | Body-lg |

---

## 4. Spacing — Tailwind Classes

Tailwind v4's default spacing scale (multiples of 4px via `--spacing`) covers most needs. Two custom additions:

| Class | Value | Usage |
|---|---|---|
| `p-section` / `gap-section` | 44px | Between major content sections |
| `p-band` / `gap-band` | 48px | Hero band spacing |

Standard Tailwind spacing (built-in, no config needed):
- `1` = 4px, `2` = 8px, `3` = 12px, `4` = 16px, `5` = 20px, `6` = 24px, `7` = 28px, `8` = 32px

---

## 5. Border Radius — Tailwind Classes

| Tailwind Class | Value | Usage |
|---|---|---|
| `rounded-xs` | 6px | Small tertiary buttons, badges |
| `rounded-sm` | 8px | Outline buttons |
| `rounded-md` | 9px | Badge primary |
| `rounded-lg` | 10px | Badge text variants |
| `rounded-xl` | 12px | Code blocks, footer corners |
| `rounded-2xl` | 14px | Input containers |
| `rounded-card` | 20px | **Card default** |
| `rounded-card-lg` | 24px | Large cards |
| `rounded-hero` | 44px | Hero sections |
| `rounded-pill` | 9999px | **Primary buttons**, icon buttons |

---

## 6. Shadows — Tailwind Classes

| Tailwind Class | Effect | Usage |
|---|---|---|
| `shadow-sm` | Subtle drop shadow | Modal backgrounds |
| `shadow-inset` | Embossed inset glow | Internal component depth |
| `shadow-elevated` | Deep shadow + inner highlight | **Cards**, featured content |

---

## 7. Z-Index — Tailwind Classes

| Tailwind Class | Value | Usage |
|---|---|---|
| `z-base` | 1 | Default content |
| `z-raised` | 2 | Slightly elevated |
| `z-sticky` | 3 | Fixed headers |
| `z-dropdown` | 10 | Dropdown menus |
| `z-dropdown-high` | 20 | Priority dropdowns |
| `z-modal` | 50 | Modals, dialogs, toasts |

---

## 8. Pre-built Component Classes

These are defined in `@layer components` in global.css using `@apply`:

### Buttons
```html
<button class="btn-primary">Get Started</button>
<button class="btn-secondary">Learn More</button>
<button class="btn-outline">Cancel</button>
<button class="btn-ghost">Settings</button>
<button class="btn-icon"><svg>...</svg></button>
```

| Class | Appearance |
|---|---|
| `.btn-primary` | Blue accent bg, white text, pill shape |
| `.btn-secondary` | Primary brown bg, white text, pill shape |
| `.btn-outline` | Transparent bg, border, 8px radius |
| `.btn-ghost` | Subtle bg, 6px radius |
| `.btn-icon` | Circular, transparent bg, 32px |

### Cards
```html
<div class="card p-6">Card with shadow</div>
<div class="card-flat p-6">Card without shadow</div>
```

### Badges
```html
<span class="badge-accent">New</span>
<span class="badge-outline">Draft</span>
```

### Inputs
```html
<input class="input" placeholder="Search..." />
```

### Navigation
```html
<a class="nav-link" href="/">Home</a>
<a class="nav-link-muted" href="/about">About</a>
```

---

## 9. Usage Examples (Inline Tailwind)

For one-off styling, compose directly with Tailwind utilities:

```html
<!-- Page section -->
<section class="bg-canvas px-4 py-section">
  <div class="max-w-7xl mx-auto">
    <h1 class="text-display-md font-semibold text-white tracking-normal">
      Welcome
    </h1>
    <p class="text-body-lg text-muted tracking-wider mt-4">
      Start your preparation journey
    </p>
    <button class="btn-primary mt-8">Explore Courses</button>
  </div>
</section>

<!-- Card grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="card p-6">
    <h3 class="text-heading-md font-bold text-white">SSC CGL</h3>
    <p class="text-body-md text-muted mt-2">Complete guide</p>
    <span class="badge-accent mt-4">Popular</span>
  </div>
</div>

<!-- Blog article -->
<article class="prose-exam max-w-3xl mx-auto px-4 py-band">
  <h1 class="text-display-md font-bold text-white">
    UPSC Prelims 2026 — Complete Guide
  </h1>
  <!-- Content follows blog_formatting_seo_guidelines.md -->
</article>
```

---

## 10. Do's and Don'ts

### ✅ Do
- **Use Tailwind utility classes** for ALL styling — `bg-canvas`, `text-heading-md`, `rounded-pill`
- **Use pre-built component classes** — `.btn-primary`, `.card`, `.badge-accent`, `.input`
- **Use `font-sans`** (DM Sans) as default — it's set on `html`
- **Use `text-accent`** only for primary CTAs and links
- **Use `text-muted`** for secondary text — never leave secondary text white
- **Use `rounded-pill`** for primary buttons, `rounded-card` for cards
- **Use `shadow-elevated`** sparingly — only on featured cards
- **Use `text-*` classes** that include line-height — don't manually set line-height
- **Compose with Tailwind** — `font-semibold tracking-tight` for display-lg-strong effect

### ❌ Don't
- **Don't write raw CSS** for components — use `@apply` in `@layer components`
- **Don't use `style=""` attributes** — always use Tailwind classes
- **Don't hardcode hex colors** — use color tokens (`bg-surface`, not `bg-[#1C1B1F]`)
- **Don't hardcode px values for spacing** — use Tailwind scale (`p-4`, not `p-[16px]`)
- **Don't use `bg-primary` for body text backgrounds** — insufficient contrast
- **Don't mix border radii** — buttons are `rounded-pill`, cards are `rounded-card`
- **Don't apply `bg-accent` to everything** — reserve for primary CTAs only
- **Don't replace `font-sans`** (DM Sans) with other body fonts
- **Don't use uppercase** for nav or body — only badges in rare cases

---

## 11. Blog Content Guidelines

> **All blog/article content MUST follow `public/blog_formatting_seo_guidelines.md`**

Key points:
- Use `<article class="prose-exam">` wrapper for blog content
- One clear H1, logical H2/H3 hierarchy
- Article/BlogPosting structured data
- Responsive images with alt text
- Self-referencing canonical URLs

---

## 12. Responsive Breakpoints

Use Tailwind's built-in responsive prefixes:

| Prefix | Width | Usage |
|---|---|---|
| (default) | Mobile-first | Single column, stacked |
| `sm:` | 640px | — |
| `md:` | 768px | 2-column grid |
| `lg:` | 1024px | 3-column grid, sidebar |
| `xl:` | 1280px | Max content width |
| `2xl:` | 1536px | Lateral gutters |

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
```
