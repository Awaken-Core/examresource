# GovtPariksha Master Design System

> **Source of Truth**: This document reflects the actual, inspected tokens, styles, and architecture in `apps/client` as of Astro 5 + Tailwind CSS v4.

---

## 1. Design Philosophy
GovtPariksha blends high-credibility editorial journalism (reminiscent of the *Financial Times* and *The Economist*) with high-performance digital speed (zero CLS, instant bilingual language swapping, and sub-100ms transitions).

### Core Principles
1. **Calm, High-Contrast Readability**: Off-white warm paper (`#FFF8F1`) in light mode and deep charcoal (`#141312`) in dark mode prevent eye strain during long study sessions.
2. **Editorial Masthead + Modern Sans Body**: `EB Garamond` for authoritative section titles and article headlines; `Inter` and `Geist` for rapid information scanning.
3. **Zero `!important` Policy**: All styling is driven by cascading semantic tokens and scoped component styles.
4. **Resilient Grid & Layout Alignment**: Multi-row grids maintain strict column baselines across all viewports.

---

## 2. Token Architecture Overview

| Token Name | Light Value | Dark Value | Tailwind Class | Usage |
|---|---|---|---|---|
| `--color-canvas` | `#FFF8F1` | `#141312` | `bg-canvas` | Page background |
| `--color-surface` | `#FFFFFF` | `#1C1A18` | `bg-surface` | Primary cards & search bars |
| `--color-surface-raised` | `#FFF8F1` | `#25221F` | `bg-surface-raised` | Hover states, pill badges |
| `--color-border` | `#EADFD3` | `#332E29` | `border-border` | Standard card & table borders |
| `--color-heading` | `#191613` | `#F5EEE6` | `text-heading` | Main titles, table headers |
| `--color-text-body` | `#191613` | `#E7E0D8` | `text-body` | Article body paragraphs |
| `--color-muted` | `#675F58` | `#A89D92` | `text-muted` | Dates, secondary metadata, icons |
| `--color-accent` | `#FF4D00` | `#FF6A26` | `bg-accent`, `text-accent` | Primary CTA, active filters, indicators |
| `--color-accent-hover` | `#D94100` | `#FF8147` | `hover:bg-accent-hover` | Interactive hover states |
| `--color-accent-soft` | `#FFEADA` | `rgba(255,106,38,0.15)` | `bg-accent-soft` | Active button backgrounds, row hovers |
| `--color-accent-badge` | `#FFF0E6` | `rgba(255,106,38,0.12)` | `bg-accent-badge` | NEW badges, count pills |

---

## 3. Editorial Aliases
For editorial layouts (`/blogs`, `/category/*`, `/latest-updates`, `/[slug]`), the following tokens are mapped 1:1 to the primary palette:
- `bg-editorial-bg` → `var(--color-canvas)`
- `bg-editorial-surface` → `var(--color-surface)`
- `bg-editorial-surface-raised` → `var(--color-surface-raised)`
- `border-editorial-border` → `var(--color-border)`
- `text-editorial-heading` → `var(--color-heading)`
- `text-editorial-subheading` → `#514A44` (Light) / `#B8ADA1` (Dark)
- `text-editorial-muted` → `var(--color-muted)`
- `bg-editorial-accent` → `var(--color-accent)`

---

## 4. Typography Hierarchy

| Style | Font Family | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| Masthead / Hero | `EB Garamond` | 32px – 44px | 500 (Medium) | 1.15 | Page titles (`/blogs`, `/[slug]`) |
| Section Heading | `EB Garamond` | 24px – 28px | 500 (Medium) | 1.25 | Category stream headers |
| Card Title | `Inter` / `Geist` | 15px – 17px | 600 (Semibold) | 1.4 | Article card headings |
| Body Text | `Inter` / `Geist` | 14px – 16px | 400 (Regular) | 1.6 – 1.7 | Article copy, descriptions |
| Metadata & Chips | `Inter` / `Geist` | 11px – 12px | 500 (Medium) | 1.3 | Badges, tags, timestamps |

---

## 5. Layout & Breakpoints
- **Mobile (`< 768px`)**: Single column stacked layout, sticky search / filter header, full-width cards.
- **Tablet (`768px – 1023px`)**: 2-column grid (`md:grid-cols-2`), compact navigation rail.
- **Desktop (`≥ 1024px`)**: 3-column grid (`lg:grid-cols-3`), persistent left navigation rail (`w-60` or collapsed `w-18`).
- **Max Content Width**: `max-w-7xl` (1280px) for general pages; `max-w-4xl` (896px) for article reading view.

---

## 6. Prohibited Anti-Patterns
1. **Never use `!important`** in component or layout code.
2. **Never use `divide-x`** on multi-row grids.
3. **Never hardcode hex values** like `#000` or `#fff` into component classes.
4. **Never introduce layout shifts (CLS)**: Always provide explicit aspect ratios or dimensions on images, icons, and dynamic widgets.

