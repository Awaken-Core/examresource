# Blog Formatting & SEO Guidelines

A practical publishing standard for exam resources, recruitment updates, study guides and mock-test content.

> **CORE RULE**
> Store content in a structured format (Markdown/MDX or editor JSON), then render complete, semantic HTML at build time or on the server. Use JavaScript only where interaction is needed.

## 1. Purpose and scope

This guide defines how writers, editors and developers should format, validate and publish articles on the platform. It covers content structure, HTML output, metadata, multilingual pages, technical SEO, accessibility and publishing QA.

**SEO note:** formatting supports crawling, usability and relevance; it does not guarantee rankings or traffic. Prioritize accuracy, usefulness, originality and satisfying the reader's search intent.

## 2. Recommended rendering strategy

| Page type | Preferred rendering | Notes |
|---|---|---|
| Blogs, guides, evergreen exam resources | Static generation (SSG) or SSR | Send full article HTML in the initial response; revalidate when content changes. |
| Breaking exam news / result updates | SSR or SSG with frequent revalidation | Show publication and update dates honestly; verify against official notices. |
| Mock tests, timers, dashboards | SSR shell + client-side interaction as needed | Validate answers, scoring and paid access on the server. |
| Personalized account pages | Authenticated server response + client UI | Do not expose private user data in public HTML or caches. |
| Search/filter interfaces | Client-side interaction where useful | Ensure important public content remains discoverable through crawlable links. |

Astro is a suitable option for a content-heavy site: use static generation for stable articles, and SSR/revalidation for frequently changing pages. Other frameworks can also work if they deliver crawlable HTML and reliable metadata.

## 3. Standard article structure

Use one clear H1 for the article title, followed by logical H2 sections and H3 subsections. Do not choose heading levels merely for their visual size.

- **Title (H1):** clear, specific, natural, and aligned with the reader's intent.
- **Introduction:** answer what the page covers and why it matters; put the key update or takeaway early.
- **Quick summary / key details:** useful for recruitment, exam dates, results and eligibility pages.
- **Main body:** use descriptive H2s and H3s; explain terms and provide original value.
- **Tables or lists:** use them when they make dates, eligibility, fees, stages or comparisons easier to scan.
- **Official source / references:** link to the original notification, official portal or primary document.
- **FAQ:** include only genuine questions answered clearly in the article; do not add filler just to target keywords.
- **Related resources:** link to relevant syllabus, previous-year papers, mock tests or preparation guides.
- **Author/editor and review information:** show when relevant, especially for high-impact exam and recruitment facts.

## 4. Formatting rules

| Element | Guideline | Avoid |
|---|---|---|
| Paragraphs | Keep focused and easy to scan; usually 2–4 sentences where natural. | Huge walls of text or one-sentence fragments throughout. |
| Headings | Describe the section's actual content; maintain H1 > H2 > H3 hierarchy. | Repeated headings, skipped levels for styling, keyword stuffing. |
| Bold text | Emphasize key facts or actions sparingly. | Bold every keyword or entire paragraphs. |
| Lists | Use ordered lists for sequences; bullets for non-sequential items. | Lists where prose would be clearer. |
| Tables | Use real HTML tables with header cells and a mobile-friendly layout. | Images of tables or tables used only for page layout. |
| Links | Use descriptive anchor text and link to authoritative, relevant pages. | "Click here" everywhere, broken links, misleading anchors. |
| Images | Use useful, compressed images; descriptive alt text when informative. | Decorative images with keyword-stuffed alt text or giant files. |
| Dates and numbers | Use unambiguous dates; state timezone when times matter. | Ambiguous dates, unsupported claims, inconsistent figures. |

## 5. Content data model

Prefer storing content as structured fields rather than a single unvalidated HTML string. A practical article record can include:

- `title`, `slug`, `language`, `locale`, `excerpt`
- `body` (Markdown/MDX or editor JSON), `content_version`
- `author_id`, `reviewer_id` (if applicable)
- `status` (draft / review / published / archived)
- `published_at`, `updated_at`
- `seo_title`, `meta_description`, `canonical_url`
- `featured_image`, `image_alt`
- `category_ids`, `tag_ids`, `related_content_ids`
- `source_links` / `official_notice_url` for factual recruitment updates
- `translation_group_id` or equivalent relation connecting language versions

Sanitize any HTML generated from user input or imported content. Do not render arbitrary raw HTML without a trusted sanitization policy. Validate URLs, metadata lengths, publication state and required fields before publishing.

## 6. SEO metadata and URL rules

- Use a stable, readable URL slug based on the topic; avoid changing a published URL without a good reason.
- Write a unique, descriptive HTML title for each indexable page. Keep it concise and natural; there is no guaranteed ideal character count.
- Write a useful meta description that accurately summarizes the page. Search engines may choose another snippet.
- Set a self-referencing canonical URL for the preferred version; do not canonicalize distinct language pages to one language.
- Include only canonical, indexable URLs in XML sitemaps; update sitemap last-modified values only when content meaningfully changes.
- Use internal links to connect topic clusters, such as exam overview → syllabus → previous papers → mock tests.
- Use Article or BlogPosting structured data where appropriate, with values that match visible page content.
- Add breadcrumb markup if the page has a real breadcrumb trail.
- Structured data can help search engines understand content but does not guarantee rich results.
- Do not create thin, near-duplicate pages just to target minor keyword variations.

## 7. Multilingual publishing rules

- Give each language version its own stable URL, for example `/en/...`, `/hi/...` and `/mr/...`. Choose a consistent URL strategy.
- Write and review each language naturally; avoid publishing machine-translated text without human quality review.
- Add reciprocal hreflang annotations for language/region variants where applicable, including a self-reference.
- Keep each page's canonical URL aligned to that same language version.
- Translate titles, descriptions, navigation labels, image alt text and key interface text—not only the article body.
- Do not automatically redirect every visitor based only on browser language; allow users and crawlers to access each version.
- Use the correct language attribute on the HTML element, such as `<html lang="hi">` for Hindi.

## 8. Exam-news accuracy and trust

- Prefer primary sources: official exam authority notices, recruitment PDFs, official result portals and government websites.
- For every time-sensitive claim, record the source URL and verify the notice date, application dates, fee, eligibility, vacancies and deadline.
- Clearly distinguish official facts from estimates, interpretation or unconfirmed reports.
- Display a publication date and meaningful update date where appropriate; do not change dates only to appear fresh.
- When a notice changes, summarize what changed and link to the latest official document.
- Do not fabricate vacancy counts, cut-offs, eligibility rules, result dates, quotes or official links.
- Add a correction process for material errors and a contact path for readers to report them.

## 9. Images, accessibility and performance

- Use responsive images and modern formats where supported; specify dimensions or aspect ratio to reduce layout shifts.
- Compress images and lazy-load below-the-fold images; avoid lazy-loading the main above-the-fold/LCP image.
- Use meaningful alt text for informative images. Use empty alt text for purely decorative images.
- Ensure links and controls have descriptive labels, keyboard access and visible focus states.
- Use sufficient color contrast and do not communicate status through color alone.
- Keep article text readable on mobile; avoid intrusive interstitials that block the main content.
- Limit third-party scripts and hydrate only interactive components that need JavaScript.
- Monitor Core Web Vitals in real-user data where available; passing scores support UX but do not guarantee rankings.

## 10. Security and rendering rules for developers

- Render public article content as semantic HTML on the server or at build time.
- Escape text output and sanitize allowed rich HTML; protect against stored XSS.
- Never trust client-side checks for authorization, subscriptions, exam scoring or answer access.
- Use cache keys that account for locale and content version; never cache private or personalized responses publicly.
- Return appropriate HTTP status codes: 200 for published pages, 404 for missing pages, and 301/308 redirects for permanent URL changes.
- Use canonical URLs consistently and prevent drafts, previews, admin pages and internal search pages from accidental indexing.
- Test output HTML without JavaScript to confirm that title, main article content, links and metadata are present.

## 11. Example article template

Use this as an editorial outline; omit sections that do not serve the reader.

| Block | Content guidance |
|---|---|
| **H1** | [Exam / Recruitment / Topic] — [Year or relevant qualifier] |
| **Intro** | Summarize the most important answer or update in 2–3 sentences. |
| **H2** | Key Highlights |
| **Table** | Important dates · Eligibility · Fee · Official link (only applicable fields) |
| **H2** | What You Need to Know |
| **H2** | Eligibility Criteria |
| **H2** | Important Dates / Process / Exam Pattern |
| **H2** | How to Apply / Prepare / Check Result |
| **H2** | Documents or Resources Required |
| **H2** | Frequently Asked Questions |
| **H2** | Official Sources |
| **Related links** | Syllabus • Previous-year papers • Mock tests • Related exam guide |

## 12. Pre-publish checklist

- ☐ The article directly satisfies a clear reader/search intent.
- ☐ Facts, dates and eligibility are verified against current official sources.
- ☐ Content is original, useful, complete enough and proofread.
- ☐ One clear H1; logical H2/H3 structure; paragraphs, lists and tables are readable.
- ☐ Title, meta description, slug, canonical URL and language are correct.
- ☐ Article structured data validates and matches visible content.
- ☐ Images are optimized and have appropriate alt text.
- ☐ Internal links and official source links work.
- ☐ Correct language URL and hreflang relationships are set for translations.
- ☐ The page returns the right status code and is not blocked accidentally by robots/noindex.
- ☐ Mobile layout, accessibility basics and page performance are checked.
- ☐ Publication/update dates are accurate; no fake freshness signals.
- ☐ The article appears in the sitemap after publication and can be reached through internal links.

## 13. Official documentation to consult

- [Google Search Central: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google Search Central: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google Search Central: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google Search Central: Localized versions / hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google Search Central: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [web.dev: Core Web Vitals](https://web.dev/articles/vitals)

---
