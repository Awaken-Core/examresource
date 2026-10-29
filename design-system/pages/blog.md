# Blog & Article View (`/blogs`, `/[slug]`) Design Rules

## 1. Directory Page (`/blogs`)
- **Exam Notice Desk Masthead**: Centered editorial title (`Find your next opportunity. All in one place.`).
- **Stream Search Bar**: Floating pill search with stream filter dropdown and immediate client-side filtering.
- **3-Column Exam Streams Grid**:
  - Uses `.editorial-stream-grid` and `.editorial-stream-card`.
  - Column 1, 2, and 3 are separated by vertical dividers.
  - Rows are separated by horizontal rules.
  - Zero `!important` used.

## 2. Article Detail Page (`/[slug]`)
- **Instant Language Swapping**:
  - Articles are rendered bilingually (English & Hinglish).
  - Toggling language updates DOM in-place and calls `history.pushState` with 0ms delay and zero network requests.
- **Typography**:
  - Main title in `font-serif` (`EB Garamond`).
  - Body paragraphs in `font-sans` with `leading-[1.7]` and `max-w-4xl` for optimal line length.
- **Images**:
  - Blog article content images must use Astro's `<Image />` component with explicit width, height, and WebP format for optimal PageSpeed.

