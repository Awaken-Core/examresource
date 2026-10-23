import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const siteUrl = import.meta.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  const siteName = import.meta.env.PUBLIC_SITE_NAME;
  const siteDomain = import.meta.env.PUBLIC_SITE_DOMAIN;

  const content = `# ${siteName} (${siteDomain}) — Full AI Agent Knowledge Base

## Organization Overview
- **Name**: ${siteName}
- **Domain**: ${siteUrl}/
- **Description**: India's verified informational education portal delivering real-time, noise-free updates on government recruitment notifications, admit cards, answer keys, results, and exam syllabi.
- **Languages**: English and Hinglish (Hindi written in Latin script)
- **Primary Audience**: Aspirants preparing for central and state government competitive exams across India.

## Official Commission Portals Directory
${siteName} links directly to primary sources for all candidate submissions:
1. **Union Public Service Commission (UPSC)**: https://www.upsc.gov.in/ — Civil Services (IAS/IPS), NDA, CDS, CMS, IES
2. **Staff Selection Commission (SSC)**: https://ssc.gov.in/ — SSC CGL, SSC CHSL, SSC GD Constable, SSC MTS, SSC CPO
3. **Railway Recruitment Boards (RRB)**: https://rrb.indianrailways.gov.in/ — RRB NTPC, RRB ALP, RRB Group D, RRB JE, RPF
4. **Institute of Banking Personnel Selection (IBPS)**: https://www.ibps.in/ — IBPS PO, IBPS Clerk, IBPS SO, IBPS RRB
5. **State Bank of India Careers**: https://sbi.co.in/web/careers — SBI PO, SBI Clerk (Junior Associate), SBI SO
6. **National Testing Agency (NTA)**: https://nta.ac.in/ — JEE, NEET, UGC NET, CUET, CSIR NET
7. **Central Teacher Eligibility Test (CTET)**: https://ctet.nic.in/ — National teacher eligibility certification
8. **National Portal of India**: https://www.india.gov.in/ — Central government citizen services
9. **DigiLocker**: https://www.digilocker.gov.in/ — Official document verification

## Category Taxonomy & URL Structure
- \`${siteUrl}/\`: Main live feed with latest notices and trending recruitment drives.
- \`${siteUrl}/category/central-government\`: Central Govt & UPSC: Central ministries, UPSC Civil Services, and national agencies.
- \`${siteUrl}/category/ssc\`: SSC Exams: Staff Selection Commission (CGL, CHSL, MTS, CPO, GD, Steno).
- \`${siteUrl}/category/railways\`: Railway Exams (RRB): Railway Recruitment Boards (RRB NTPC, ALP, Group D, Technician, RPF).
- \`${siteUrl}/category/banking\`: Banking & Insurance: Commercial banks, RBI, SBI, IBPS, and insurance (LIC, NIACL).
- \`${siteUrl}/category/state-exams\`: Latest Govt Jobs: State PSCs (UPPSC, BPSC, MPSC, RPSC, MPPSC) and state boards.
- \`${siteUrl}/category/defence\`: Defence & Paramilitary: Armed forces (Army, Navy, Air Force), NDA, CDS, AFCAT, Coast Guard.
- \`${siteUrl}/category/police\`: Police Recruitment Exams: State Police SI, Constable, and ASI recruitment drives.
- \`${siteUrl}/category/teaching\`: Teaching & Education Exams: CTET, State TETs, KVS, NVS, DSSSB, and Assistant Professor posts.
- \`${siteUrl}/category/psu-engineering\`: PSU & Engineering Exams: Central PSUs (BHEL, ISRO, DRDO, GATE), State Engineering, and technical exams.

## Article Structure & Content Standards
Every published article on ${siteName} follows a strict, candidate-first structure:
1. **Key Highlights Table**: Organization, Vacancies, Advertisement Number, Start Date, Last Date, Fee Payment Deadline, Age Limit, Selection Process, and Official Portal URL.
2. **Eligibility Criteria**: Age limit, relaxation norms, educational qualification, and experience prerequisites.
3. **Application Fee Details**: Category-wise fee breakdown (UR, OBC, EWS, SC, ST, PwBD, Female) and allowed payment modes.
4. **Selection Stages**: Detailed breakdown of CBT / Written test phases, skill/typing tests, physical efficiency tests (PET/PST), document verification, and medical review.
5. **Direct Official Links**: Verified links to the official notification PDF and direct application portal.
6. **Frequently Asked Questions (FAQ)**: Specific, unambiguous answers to common applicant doubts.

## Crawler & Agent Discovery Endpoints
- **XML Sitemap**: ${siteUrl}/sitemap.xml
- **RSS 2.0 Feed**: ${siteUrl}/rss.xml
- **Robots Directives**: ${siteUrl}/robots.txt
- **LLM Summary**: ${siteUrl}/llms.txt
- **LLM Full Reference**: ${siteUrl}/llms-full.txt
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
