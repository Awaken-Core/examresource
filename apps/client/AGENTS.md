## ⚠️ MANDATORY: Read Before ANY Frontend Task

**Before performing any frontend work, you MUST read these files:**
1. **[design.md](./design.md)** — Design system tokens, color palette, typography, component specs, and Do's/Don'ts
2. **[public/blog_formatting_seo_guidelines.md](./public/blog_formatting_seo_guidelines.md)** — Blog content formatting, SEO, and publishing standards

Do NOT skip these files. They define the project's visual identity and content standards.

---

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Design System

This project uses a **takeUforward-inspired dark theme** with Tailwind CSS v4. All design tokens are defined in `src/styles/global.css` using Tailwind v4's `@theme` directive.

### Key Design Principles
- Dark canvas (`#131316`) with white text for maximum contrast
- Brand accent (`#292418`) for secondary actions; blue CTA (`#327CF6`) for primary actions only
- DM Sans as primary font, Geist for labels/display, ui-monospace for code
- Pill-shaped primary buttons (`rounded-full`), rounded cards (`rounded-r-20`)
- Micro-shadow elevation, never bold depth
- Mobile-first responsive design
- Generous whitespace and line-heights

### Blog Content Rules
- Store as structured Markdown/MDX, render semantic HTML at build time
- One H1, logical H2/H3 hierarchy
- Article/BlogPosting structured data
- Self-referencing canonical URLs
- Responsive images with alt text
- Full guidelines in `public/blog_formatting_seo_guidelines.md`

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
