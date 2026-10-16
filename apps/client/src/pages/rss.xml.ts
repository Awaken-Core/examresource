import type { APIRoute } from 'astro';
import { API_URL } from '../lib/api';

export const GET: APIRoute = async () => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || 'https://govtpariksha.com').replace(/\/$/, '');

  let livePosts: any[] = [];
  try {
    const res = await fetch(`${API_URL}/blogs?limit=50`);
    if (res.ok) {
      livePosts = await res.json();
    }
  } catch (e) {
    livePosts = [];
  }

  const buildDate = new Date().toUTCString();

  const itemsXml = (livePosts || []).map((post) => {
    const cleanSlug = String(post.slug || '').replace(/^\//, '');
    const postUrl = `${siteUrl}/${cleanSlug}`;
    const pubDate = new Date(post.publishedAt || post.updatedAt || Date.now()).toUTCString();
    const category = post.category?.name || post.categories?.[0]?.name || 'Government Exam';
    const description = post.description || post.metaDescription || `Official government examination notice and details for ${post.title}.`;
    const coverImage = post.coverImage || post.firstImage || null;

    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <category><![CDATA[${category}]]></category>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[GovtPariksha Editorial Team]]></dc:creator>${
        coverImage
          ? `\n      <enclosure url="${coverImage.startsWith('http') ? coverImage : `${siteUrl}${coverImage.startsWith('/') ? '' : '/'}${coverImage}`}" type="image/jpeg" />`
          : ''
      }
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GovtPariksha — Verified Government Exam Updates &amp; Sarkari Naukri Alerts</title>
    <link>${siteUrl}/</link>
    <description>Latest verified government exam notifications, Sarkari job alerts, admit cards, answer keys, and results from GovtPariksha (govtpariksha.com).</description>
    <language>en-IN</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>GovtPariksha</title>
      <link>${siteUrl}/</link>
      <width>144</width>
      <height>144</height>
    </image>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
    },
  });
};
