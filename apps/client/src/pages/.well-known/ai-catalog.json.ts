import type { APIRoute } from 'astro';
import { siteDomain, siteName, siteUrl } from '../../data/site';

export const prerender = false;

export const GET: APIRoute = () => {
  const catalog = {
    specVersion: '1.0',
    host: {
      identifier: `urn:air:${siteDomain}:host`,
      displayName: siteName,
    },
    entries: [
      {
        identifier: `urn:air:${siteDomain}:agent:exam-guide`,
        displayName: `${siteName} Government Exam Discovery Agent`,
        type: 'application/agent-card+json',
        url: `${siteUrl}/.well-known/agent-card.json`,
        description: `Autonomous agent providing verified official government exam notices, admit cards, syllabus guides, and recruitment results across India.`,
        representativeQueries: [
          'latest government exam notifications 2026',
          'sarkari job admit card download and dates',
          'civil services and state PSC recruitment details',
          'railways and staff selection commission exam syllabus',
        ],
      },
      {
        identifier: `urn:air:${siteDomain}:skill:llms-manifest`,
        displayName: `${siteName} LLM Knowledge Manifest`,
        type: 'text/markdown; profile="urn:air:agent-skills"',
        url: `${siteUrl}/llms.txt`,
        description: `Concise LLM knowledge manifest for ${siteName} government examination notifications, admit cards, and results.`,
        representativeQueries: [
          'government examination notices summary',
          'sarkari exam syllabus and eligibility guide',
          'official recruitment portal commission directory',
        ],
      },
      {
        identifier: `urn:air:${siteDomain}:skill:llms-full`,
        displayName: `${siteName} Comprehensive Examination Directory`,
        type: 'text/markdown; profile="urn:air:agent-skills"',
        url: `${siteUrl}/llms-full.txt`,
        description: `Comprehensive LLM knowledge document with recruitment portal references and official commission details for ${siteName}.`,
        representativeQueries: [
          'complete government exam directory India',
          'state public service commission official links',
          'staff selection commission notification archives',
        ],
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
};
