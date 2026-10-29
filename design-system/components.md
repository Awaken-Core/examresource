# GovtPariksha Reusable Component Catalog

## 1. Shell Components

### `Header.astro`
- Fixed top navigation bar.
- Contains the brand logo, navigation links (`Blogs`, `Test Series`, `Quizzes`), live search trigger, notifications trigger, language toggle (`HI` / `EN`), and user profile dropdown trigger.
- **Rules**: Chevrons must use `.profile-chevron-arrow` for smooth 180° rotation on dropdown toggle.

### `LeftSidebar.astro`
- Collapsible navigation rail (`w-60` expanded, `w-18` collapsed).
- Collapsed rail mode preserves centered icons with smooth width transition.
- Contains primary links, social links, theme toggle, and user profile button.

### `ProfileDropdown.astro`
- Dropdown menu positioned at top, bottom, or mobile drawer.
- Contains user initials, display name, profile links, theme switcher, language toggle, and logout button.

---

## 2. Content & Stream Components

### Editorial 3-Column Grid (`.editorial-stream-grid`)
- Used on `/blogs` for Exam Streams.
- Uses clean `:nth-child(3n)` and `:nth-child(n+4)` rules to establish perfect desktop column baselines, vertical dividers, and horizontal row separators.
- **Rule**: Never use `divide-x` on multi-row containers.

### Notice Row Card (`.update-row-card`)
- Used on `/latest-updates`.
- Clean horizontal text row displaying: Category badge, relative timestamp, date, NEW badge, title, excerpt summary, and "Read Notice" CTA pill.
- **Rule**: Cover images are omitted on `/latest-updates` for maximum scannability and speed.

### Table of Contents (`TableOfContents.astro`)
- Sticky right-side or top summary for long article pages.
- Highlights active reading section using IntersectionObserver without layout shift.

