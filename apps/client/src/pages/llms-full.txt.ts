import type { APIRoute } from 'astro';
import { siteUrl, siteName, siteDomain } from '../data/site';

export const GET: APIRoute = () => {
  const content = `# ${siteName} (${siteDomain}) — Full AI Agent Knowledge Base

## Organization Overview
- **Name**: ${siteName}
- **Domain**: ${siteUrl}/
- **Description**: India's verified informational education portal delivering real-time, noise-free updates on government recruitment notifications, admit cards, answer keys, results, and exam syllabi.
- **Languages**: English and Hinglish (Hindi written in Latin script)
- **Primary Audience**: Aspirants preparing for central and state government competitive exams across India.
- **Entity Type**: Independent informational publishing portal (Non-governmental).

## Editorial & Fact-Checking Policy
Every recruitment summary published on ${siteName} is verified against official government gazettes, employment news publications, or official commission websites prior to publication.
- We do not host fraudulent third-party application forms.
- All application and fee-payment links route directly to official commission hostnames (*.gov.in, *.nic.in, or designated testing agencies).
- We maintain bilingual parity across major exam notices.

## Core Content Directory & URL Taxonomy
1. **Homepage**: ${siteUrl}/
2. **Blogs & Exam Guides**: ${siteUrl}/blogs
3. **Latest Updates**: ${siteUrl}/latest-updates
4. **Test Series & CBT Mocks**: ${siteUrl}/test-series
5. **Daily Quiz**: ${siteUrl}/daily-quiz
6. **Rank Predictor**: ${siteUrl}/rank-predictor
7. **Official Commission Portal Directory**: ${siteUrl}/#important-links
8. **Exam Categories**:
   - Central Government: ${siteUrl}/category/central-government
   - Staff Selection Commission: ${siteUrl}/category/ssc
   - Railway Recruitment Board: ${siteUrl}/category/railways
   - Banking & Financial: ${siteUrl}/category/banking
   - Latest State Jobs: ${siteUrl}/category/latest-jobs
   - Defence Services: ${siteUrl}/category/defence
   - Teaching & Education: ${siteUrl}/category/teaching
   - Police Recruitment: ${siteUrl}/category/police
   - PSU & Engineering: ${siteUrl}/category/psu-engineering
9. **Legal, Compliance & Support**:
   - Privacy Policy (DPDP Act 2023): ${siteUrl}/privacy-policy
   - Terms of Service: ${siteUrl}/terms-of-service
   - Test Series Pass Pricing: ${siteUrl}/pricing
   - Refund & Cancellation Policy: ${siteUrl}/refund-policy
   - Contact Desk: ${siteUrl}/contact-us

## Machine Discovery Protocols
- **XML Sitemap**: ${siteUrl}/sitemap.xml
- **XML Sitemap Index**: ${siteUrl}/sitemap_index.xml
- **RSS Syndication**: ${siteUrl}/rss.xml
- **Robots Directives**: ${siteUrl}/robots.txt
- **LLM Summary**: ${siteUrl}/llms.txt
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
