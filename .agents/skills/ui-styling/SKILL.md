---
name: ui-styling
description: Practical utility styling guidelines for Tailwind CSS v4, theme tokens, responsive layouts, component states, and preventing anti-patterns like !important.
---

# UI Styling Skill

## Objective
Enforce clean, direct, maintainable styling using Tailwind CSS v4 and semantic design tokens without anti-patterns.

---

## 1. Before You Style
1. **Identify the Styling System**: Inspect `package.json` and `apps/client/src/styles/global.css`. GovtPariksha uses Tailwind CSS v4 via `@tailwindcss/vite` and CSS `@theme` variables.
2. **Find the Tokens**: Use semantic tokens defined in `global.css` (`text-heading`, `text-muted`, `bg-canvas`, `bg-surface`, `border-editorial-border`, `bg-editorial-accent`, etc.).
3. **Check Component Scope**: Before writing custom CSS, check if existing Tailwind utility classes solve the layout cleanly.

---

## 2. Utility-Class & CSS Rules

### 1. Prohibition on `!important`
- **Never use `!important`** in component styles, inline styles, or page CSS.
- If a style is being overridden, fix the selector specificity or use the proper parent theme scope (`.theme-dark`, `html:not(.theme-dark)`).

### 2. Semantic Color Rules
- Do NOT scatter raw hex codes like `#ffffff`, `#191613`, or `#ff4d00` inside class strings or inline styles.
- Use established semantic tokens:
  - Backgrounds: `bg-canvas`, `bg-surface`, `bg-surface-raised`, `bg-editorial-surface`
  - Text: `text-heading`, `text-muted`, `text-editorial-text`, `text-editorial-subheading`
  - Borders: `border-border`, `border-editorial-border`
  - Accents: `bg-editorial-accent`, `hover:bg-editorial-accent-hover`, `text-editorial-accent`

### 3. Multi-Row Grid Safety
- **Never use `divide-x` on multi-row grids**:
  Tailwind's `divide-x` targets `> * + *`, which applies `border-left` across row boundaries and indents Row 2 Column 1.
- For multi-column newspaper layouts with dividers, use CSS `:nth-child(3n)` / `:nth-child(3n+1)` or standard grid gaps (`gap-x-8 gap-y-12`).

### 4. Responsive Rules
- Always design mobile-first:
  - Base classes for mobile (`flex-col`, `gap-4`, `p-4`)
  - `sm:` for tablet portrait (`sm:flex-row`, `sm:p-5`)
  - `md:` for tablet landscape (`md:grid-cols-2`)
  - `lg:` for desktop (`lg:grid-cols-3`, `lg:gap-8`)
- Verify touch target sizes (minimum 44x44px for primary interactive elements).

### 5. Transition & Animation Polish
- Use consistent transition curves: `transition-all duration-150` or `transition-transform duration-200 ease-out`.
- Avoid heavy animations that cause reflow or layout shift (CLS = 0).

