import type { APIRoute } from 'astro';
import { siteUrl, siteName, siteDomain } from '../data/site';

export const GET: APIRoute = () => {
  const content = `# ${siteName} (${siteDomain}) — Full AI Agent Knowledge Base

## Organization Overview
- **Name**: ${siteName}
- **Domain**: [${siteDomain}](${siteUrl}/)
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
- [Homepage](${siteUrl}/): Real-time live feed of active notifications and official links
- [Blogs & Exam Guides](${siteUrl}/blogs): Comprehensive index of recruitment guides and examination articles
- [Latest Updates](${siteUrl}/latest-updates): Chronological feed of active notifications, admit cards, and results
- [Test Series & CBT Mocks](${siteUrl}/test-series): Free and premium All-India computer-based test series
- [Daily Quiz](${siteUrl}/daily-quiz): Daily exam preparation quiz runner
- [Rank Predictor](${siteUrl}/rank-predictor): Statistical percentile and AIR predictor
- [Official Commission Directory](${siteUrl}/#important-links): Central & state recruitment portals directory

## Exam Categories
- [Central Government Exams](${siteUrl}/category/central-government): UPSC Civil Services, Central Ministries, and national recruitment agencies
- [Staff Selection Commission (SSC)](${siteUrl}/category/ssc): SSC CGL, CHSL, MTS, CPO, GD Constable, Stenographer
- [Railway Recruitment Board (RRB)](${siteUrl}/category/railways): RRB NTPC, ALP, Technician, Group D, RPF
- [Banking & Insurance](${siteUrl}/category/banking): IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B, LIC
- [Latest State Govt Jobs](${siteUrl}/category/latest-jobs): State PSCs (UPPSC, BPSC, MPPSC, MPSC, RPSC) and State Boards
- [Defence & Paramilitary](${siteUrl}/category/defence): NDA, CDS, AFCAT, CAPF AC, Indian Coast Guard, Agniveer
- [Teaching & Education](${siteUrl}/category/teaching): CTET, State TETs, KVS, NVS, DSSSB
- [Police Recruitment](${siteUrl}/category/police): State police constable and sub-inspector exams
- [PSU & Engineering](${siteUrl}/category/psu-engineering): GATE PSU recruitment, ISRO, DRDO, BEL, BHEL, IOCL

## Legal, Compliance & Support
- [Privacy Policy (DPDP Act 2023)](${siteUrl}/privacy-policy): Platform data practices, cookie policy, and candidate privacy standards
- [Terms of Service](${siteUrl}/terms-of-service): Terms governing the use of informational content and tools
- [Test Series Pass Pricing](${siteUrl}/pricing): Details on single series and 3-year all-access pass pricing
- [Refund & Cancellation Policy](${siteUrl}/refund-policy): Transparent refund rules and timeframes
- [Contact & Support Desk](${siteUrl}/contact-us): Support desk, feedback, and editorial contact

## Machine Discovery Protocols
- [XML Sitemap](${siteUrl}/sitemap.xml): Complete URL index of all published recruitment articles and categories
- [RSS Feed](${siteUrl}/rss.xml): Real-time syndication feed for RSS readers and news aggregators
- [Robots Directives](${siteUrl}/robots.txt): Machine crawler instructions
- [LLM Summary](${siteUrl}/llms.txt): Core summary and discovery links for AI agents
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
