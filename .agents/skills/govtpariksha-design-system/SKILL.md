---
name: govtpariksha-design-system
description: Authoritative GovtPariksha design system skill. Teaches AI coding agents to inspect the codebase, follow established styling rules, reuse existing components, and maintain consistent UI/UX across all pages without inventing conflicting styles or using !important.
---

# GovtPariksha Design System Skill

## Objective
Build a consistent, accessible, responsive, production-quality UI for GovtPariksha (`govtpariksha.com`).
Do not treat every page as a new design project. Preserve the established visual identity and improve the existing interface systematically.

---

## 1. Mandatory Repository Inspection
Before modifying or creating any UI code:
1. **Read Root Instructions**: Read the repository's root `AGENTS.md`.
2. **Inspect Environment & Stack**: Check `package.json` to verify frameworks (Astro 5 SSR, React 19 islands, Tailwind CSS v4 via `@tailwindcss/vite`).
3. **Inspect Real Styles**: Review `apps/client/src/styles/global.css` for actual CSS variables (`--color-canvas`, `--color-surface`, `--color-editorial-border`, etc.) and theme rules.
4. **Inspect Existing Components**: Search `apps/client/src/components/` and `apps/client/src/layouts/` before creating new ones.
5. **Compare Existing Pages**: Review `index.astro`, `blogs.astro`, `latest-updates.astro`, or `[slug].astro` to understand established layout patterns.
6. **Consult Design System Docs**: Read `design-system/MASTER.md` and relevant page guides under `design-system/pages/`.
7. **Never Assume File Paths**: Always locate the real source files in the project.

---

## 2. Design-System Source of Truth & Priority
When styling components, follow this strict priority order:
1. Explicit requirements in the current user prompt.
2. Root repository instructions in `AGENTS.md`.
3. Authoritative design-system rules in `design-system/MASTER.md`.
4. Existing design tokens (`--color-*`, `--radius-*`) and established components.
5. Existing page implementations and their local styling conventions.
6. General UI/UX best practices (`.agents/skills/ui-ux-pro-max`, `.agents/skills/astra-frontend-design`).

**Conflict Resolution Rule**:
When sources conflict, resolve the conflict while strictly maintaining brand consistency. Never silently rewrite the global visual identity or introduce competing color palettes.

---

## 3. Brand Identity & Color Tokens

### Primary Palette (Warm Paper & Editorial Terracotta)
- **Canvas / Background**: Light `#FFF8F1` · Dark `#141312`
- **Surface**: Light `#FFFFFF` · Dark `#1C1A18`
- **Surface Raised**: Light `#FFF8F1` · Dark `#25221F`
- **Borders & Dividers**: Light `#EADFD3` · Dark `#332E29`
- **Headings & Body Text**: Light `#191613` · Dark `#F5EEE6` / `#E7E0D8`
- **Muted Text**: Light `#675F58` · Dark `#A89D92`
- **Editorial Accent**: Light `#FF4D00` (hover `#D94100`, soft `#FFEADA`) · Dark `#FF6A26`

### Logo & Legacy Institutional Accent Branding
- Primary Blue: `#0A58CA`
- Dark Blue: `#053888`
- Deep Blue: `#032054`
- Cyan Accent: `#38B6FF`
- Bright Blue: `#0077FF`

*Constraint*: Never scatter raw arbitrary hex codes throughout components. Always use semantic Tailwind classes (`text-heading`, `text-muted`, `bg-surface`, `border-editorial-border`, `bg-editorial-accent`, etc.).

---

## 4. Typography Scale & Font Pairing
- **Editorial Headings**: `font-serif` (`EB Garamond`, Georgia, serif). Used for page titles, section mastheads, and editorial callouts.
- **Body & UI Text**: `font-sans` (`Inter`, `Geist`, `Noto Sans Devanagari`, sans-serif). Used for cards, tables, buttons, navigation, and notices.
- **Hindi / Bilingual Content**: Self-contained `Noto Sans Devanagari` and `Nirmala UI` glyph fallback ensuring seamless bilingual rendering without layout shift.

---

## 5. Non-Negotiable Styling Rules

### Rule 1: Zero `!important`
`!important` is strictly prohibited in custom components and styles. It causes AI hallucinations, breaks theme inheritance, and prevents modular composition. Use proper CSS specificity, scoped `<style>` tags, or Tailwind utility order.

### Rule 2: Grid and Column Alignment
- When creating multi-row grids (e.g. 3-column layout on desktop), **never use `divide-x`** on multi-row containers. `divide-x` applies `border-left` to all items after index 0, corrupting the alignment of row 2 and beyond.
- Use explicit column/row dividers via CSS `:nth-child` rules or clean grid gaps (`gap-x-8 gap-y-12`) so every column aligns flush with its column header.

### Rule 3: Component Reuse
- Reuse existing components: `Header.astro`, `LeftSidebar.astro`, `ProfileDropdown.astro`, `NotificationPopup.astro`, `TableOfContents.astro`.
- Do not duplicate components with minor variations. Pass props or use slots.

### Rule 4: Performance & Zero CLS
- Always specify explicit `width` and `height` (or aspect ratios) on images and icons.
- Avoid render-blocking fonts and third-party scripts.

---

## 6. Required Workflow for UI Changes
1. **Inspect**: Read the page and components being modified.
2. **Understand**: Identify applicable design tokens and check for cross-page effects.
3. **Plan**: Propose the minimal coherent changes.
4. **Implement**: Reuse tokens, components, and responsive conventions.
5. **Verify**:
   - `bun run typecheck`
   - `bun run test`
   - `bun run build`
6. **Document**: Update `design-system/` documentation if a user approves an updated pattern.

