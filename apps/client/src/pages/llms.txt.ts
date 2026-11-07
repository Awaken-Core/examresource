import type { APIRoute } from 'astro';
import { siteUrl, siteName, siteDomain } from '../data/site';

export const GET: APIRoute = () => {
  const content = `# ${siteName} (${siteDomain})

> ${siteName} is India's leading verified government exam portal for Sarkari Naukri notifications, admit cards, answer keys, results, syllabus breakdowns, and direct official commission links.

## Quick Links
- [Home Page](${siteUrl}/): Real-time live feed of active notifications and official links
- [Blogs & Exam Guides](${siteUrl}/blogs): Comprehensive index of recruitment guides and examination articles
- [Latest Updates Feed](${siteUrl}/latest-updates): Chronological feed of active notifications, admit cards, and results
- [Test Series & CBT Mocks](${siteUrl}/test-series): Free and premium All-India computer-based test series
- [Daily Quiz & Current Affairs](${siteUrl}/daily-quiz): Daily exam preparation quiz runner
- [Rank Predictor & Cut-Off Calculator](${siteUrl}/rank-predictor): Statistical percentile and AIR predictor
- [Test Series Pass Pricing](${siteUrl}/pricing): Pricing and subscription plans for mock test series

## Exam Categories
- [Central Government Exams](${siteUrl}/category/central-government): UPSC Civil Services, Central Ministries, and national recruitment agencies
- [Staff Selection Commission (SSC)](${siteUrl}/category/ssc): SSC CGL, CHSL, MTS, CPO, GD Constable, Stenographer
- [Railway Recruitment Boards (RRB)](${siteUrl}/category/railways): RRB NTPC, ALP, Technician, Group D, RPF
- [Banking & Insurance](${siteUrl}/category/banking): IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B, LIC
- [State Government Jobs](${siteUrl}/category/latest-jobs): State PSCs (UPPSC, BPSC, MPPSC, MPSC, RPSC) and State Boards
- [Defence & Paramilitary](${siteUrl}/category/defence): NDA, CDS, AFCAT, CAPF AC, Indian Coast Guard, Agniveer
- [Teaching & Education](${siteUrl}/category/teaching): CTET, State TETs, KVS, NVS, DSSSB
- [Police Recruitment](${siteUrl}/category/police): State police constable and sub-inspector exams
- [Engineering & PSU](${siteUrl}/category/psu-engineering): GATE PSU recruitment, ISRO, DRDO, BEL, BHEL, IOCL

## Legal & Compliance
- [Privacy Policy](${siteUrl}/privacy-policy): DPDP Act 2023 compliance and privacy policy
- [Terms of Service](${siteUrl}/terms-of-service): Terms governing informational content and tools
- [Refund Policy](${siteUrl}/refund-policy): Cancellation and refund guidelines
- [Contact Desk](${siteUrl}/contact-us): Support desk, feedback, and editorial contact

## Machine Discovery Protocols
- [Agent Discovery Card](${siteUrl}/.well-known/agent-card.json): Machine-readable capabilities, tools, and endpoints for AI agents
- [AI Resource Catalog](${siteUrl}/.well-known/ai-catalog.json): Structured JSON listing available exams, topics, and practice resources
- [XML Sitemap](${siteUrl}/sitemap.xml): Complete URL index of published recruitment articles
- [RSS Feed](${siteUrl}/rss.xml): Real-time syndication feed
- [Robots Directives](${siteUrl}/robots.txt): Machine crawler instructions
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
