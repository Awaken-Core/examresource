# GovtPariksha Typography Guide

## 1. Font Families

### 1. `font-serif`: `EB Garamond`
- **Source**: Self-hosted local variable `.ttf` files in `/fonts/`.
- **Characteristics**: Classic French Renaissance serif, elegant serifs, high readability in large sizes.
- **Where to Use**:
  - Main hero mastheads (`Find your next opportunity. All in one place.`)
  - Page titles (`[slug].astro`)
  - Section title headers (`Exam Streams`, `Official Commission Portals`)
  - Blockquotes and editorial excerpts

### 2. `font-sans`: `Inter` & `Geist`
- **Source**: Self-hosted variable `.woff2` files in `/fonts/` with Latin & Devanagari unicode ranges.
- **Characteristics**: Geometric/neo-grotesque sans-serif with tall x-height and clear numerals.
- **Where to Use**:
  - Navigation bar, buttons, and dropdowns
  - Notice cards, tables, and stream lists
  - Body paragraphs in study guides
  - Form inputs, search fields, and tags

### 3. `font-hindi`: `Noto Sans Devanagari` & `Nirmala UI`
- **Where to Use**:
  - Automatically invoked for Hindi text and bilingual translations (`HINGLISH` / `HINDI`)
  - Ensures correct conjuncts and zero layout shift when switching languages.

---

## 2. Typography Scale

```css
/* Masthead / Hero */
text-3xl sm:text-4xl lg:text-5xl font-['EB_Garamond'] font-normal leading-[1.15]

/* Stream Section Header */
text-2xl sm:text-[26px] font-['EB_Garamond'] font-normal tracking-tight

/* Article Card Title */
text-[15px] sm:text-[16px] font-semibold text-editorial-heading leading-snug

/* Body Text */
text-[15px] sm:text-[16px] text-editorial-text leading-[1.7]

/* Metadata & Small Tags */
text-[11px] sm:text-[12px] font-medium text-editorial-muted tabular-nums
```

