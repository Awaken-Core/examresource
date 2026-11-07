import { describe, expect, it } from 'vitest';
import { filterStaticSpotlightItems, renderSpotlightResultHtml } from '../src/lib/spotlight-search';

describe('spotlight-search', () => {
  it('filters static items by query and category', () => {
    const items = [
      { title: 'UPSC Portal', tag: 'Official', href: 'https://upsc.gov.in', category: 'portal', icon: '🏛️' },
      { title: 'SSC Guide', tag: 'Guide', href: '/ssc', category: 'article', icon: '📰' },
    ];
    const filtered = filterStaticSpotlightItems(items, 'upsc', 'all');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('UPSC Portal');
  });

  it('renders empty-state HTML when no items match', () => {
    const html = renderSpotlightResultHtml([], 'zzz');
    expect(html).toContain('No results found');
    expect(html).toContain('zzz');
  });
});
