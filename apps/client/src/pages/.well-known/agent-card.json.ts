import type { APIRoute } from 'astro';
import { siteDomain, siteName, siteUrl } from '../../data/site';

export const prerender = false;

export const GET: APIRoute = () => {
  const agentCard = {
    specVersion: '1.0',
    identifier: `urn:air:${siteDomain}:agent:exam-guide`,
    displayName: `${siteName} Government Exam Discovery Agent`,
    description: `Verified government examination notices, syllabus, admit cards, answer keys, and counselling results discovery service for ${siteName}.`,
    type: 'application/agent-card+json',
    url: siteUrl,
    provider: {
      identifier: `urn:air:${siteDomain}`,
      displayName: siteName,
      url: siteUrl,
    },
    capabilities: [
      {
        id: 'exam-notifications',
        name: 'Government Exam Notifications',
        description: 'Discover active central and state recruitment notices, eligibility rules, and application windows.',
      },
      {
        id: 'admit-card-discovery',
        name: 'Admit Card & Hall Ticket Retrieval',
        description: 'Direct verified links to official commission admit card releases.',
      },
      {
        id: 'results-and-keys',
        name: 'Exam Results and Official Answer Keys',
        description: 'Instant access to verified commission answer keys, merit lists, and cut-off scores.',
      },
    ],
    documentationUrl: `${siteUrl}/llms.txt`,
    tags: [
      'government-exams',
      'sarkari-naukri',
      'recruitment',
      'admit-cards',
      'results',
      'upsc',
      'ssc',
      'railways',
      'banking',
    ],
  };

  return new Response(JSON.stringify(agentCard, null, 2), {
    headers: {
      'Content-Type': 'application/agent-card+json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
};
