# GovtPariksha Colors & Palettes

## 1. Palette Architecture

GovtPariksha uses a dual-palette architecture:
1. **Editorial Palette (Primary Web Experience)**: Warm newsprint paper tone paired with terracotta orange accent.
2. **Institutional Palette (Brand Assets & Logo)**: Classical academic blue and cyan.

---

## 2. Token Definitions

### A. Surface & Canvas
```css
/* Light Theme */
--color-canvas: #FFF8F1;          /* Warm cream newsprint */
--color-surface: #FFFFFF;         /* Crisp card background */
--color-surface-raised: #FFF8F1;  /* Subtle elevated component */
--color-border: #EADFD3;          /* Soft hairline divider */

/* Dark Theme */
--color-canvas: #141312;          /* Deep warm charcoal */
--color-surface: #1C1A18;         /* Elevated card surface */
--color-surface-raised: #25221F;  /* Floating modal / tooltip surface */
--color-border: #332E29;          /* Hairline charcoal divider */
```

### B. Typography Colors
```css
/* Light Theme */
--color-heading: #191613;         /* Deep ink for titles & headings */
--color-text-body: #191613;       /* High-contrast readable body */
--color-muted: #675F58;           /* Secondary metadata & timestamps */

/* Dark Theme */
--color-heading: #F5EEE6;         /* Soft warm white for headings */
--color-text-body: #E7E0D8;       /* Readable light gray for body */
--color-muted: #A89D92;           /* Secondary metadata in dark mode */
```

### C. Accent & Interactive
```css
/* Light Theme */
--color-accent: #FF4D00;          /* GovtPariksha Terracotta */
--color-accent-hover: #D94100;    /* Darkened hover state */
--color-accent-soft: #FFEADA;     /* Light tint for selected filters */
--color-accent-badge: #FFF0E6;    /* Soft badge background */

/* Dark Theme */
--color-accent: #FF6A26;          /* Vivid warm orange for dark backgrounds */
--color-accent-hover: #FF8147;    /* Lighter hover for dark backgrounds */
--color-accent-soft: rgba(255, 106, 38, 0.15);
--color-accent-badge: rgba(255, 106, 38, 0.12);
```

### D. Institutional Blue & Cyan (Logo / Badges)
- Primary Blue: `#0A58CA`
- Dark Blue: `#053888`
- Deep Blue: `#032054`
- Cyan Accent: `#38B6FF`
- Bright Blue: `#0077FF`

---

## 3. Best Practices
- **Do not mix cold slate grays (`#64748B`) with warm paper tones (`#675F58`)**.
- Always use `border-editorial-border` or `border-border` rather than generic gray borders.
- Check WCAG AAA contrast for all text against its surface background.

