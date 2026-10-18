import { describe, it, expect } from 'vitest';
import { htmlToBlocks, blocksToHtml } from './blog-content.adapter.js';

describe('blog-content.adapter', () => {
  it('should parse headings, paragraphs, lists, and images into structured blocks', () => {
    const sampleHtml = `
      <h2>Introduction to Algorithms</h2>
      <p>Algorithms are fundamental <strong>steps</strong> for problem solving.</p>
      <ul>
        <li>Sorting</li>
        <li>Searching</li>
      </ul>
      <figure><img src="/images/chart.webp" alt="Complexity chart" /><figcaption>Chart 1</figcaption></figure>
      <pre class="language-typescript"><code>const x: number = 42;</code></pre>
    `;

    const blocks = htmlToBlocks(sampleHtml);
    expect(blocks.length).toBeGreaterThanOrEqual(5);

    const h2Block = blocks.find((b) => b.type === 'HEADING_2');
    expect(h2Block?.value).toBe('Introduction to Algorithms');

    const pBlock = blocks.find((b) => b.type === 'PARAGRAPH');
    expect(pBlock?.value).toContain('Algorithms are fundamental');

    const codeBlock = blocks.find((b) => b.type === 'CODE');
    expect(codeBlock?.metadata?.language).toBe('typescript');
    expect(codeBlock?.value).toContain('const x: number = 42;');

    const imgBlock = blocks.find((b) => b.type === 'IMAGE');
    expect(imgBlock?.value).toBe('/images/chart.webp');
    expect(imgBlock?.metadata?.alt).toBe('Complexity chart');
  });

  it('should convert structured blocks back to semantic HTML', () => {
    const blocks = [
      { type: 'HEADING_2' as const, value: 'Key Takeaways' },
      { type: 'PARAGRAPH' as const, value: 'Here is what you need to remember.' },
      {
        type: 'CODE' as const,
        value: 'SELECT * FROM users;',
        metadata: { language: 'sql' },
      },
    ];

    const html = blocksToHtml(blocks);
    expect(html).toContain('<h2 id="key-takeaways">Key Takeaways</h2>');
    expect(html).toContain('<p>Here is what you need to remember.</p>');
    expect(html).toContain('<pre class="language-sql"><code class="language-sql">SELECT * FROM users;</code></pre>');
  });

  it('should sanitize XSS vectors from input blocks', () => {
    const maliciousBlocks = [
      {
        type: 'PARAGRAPH' as const,
        value: 'Hello <script>alert("hacked")</script><img src="x" onerror="alert(1)" />',
      },
    ];

    const rendered = blocksToHtml(maliciousBlocks);
    expect(rendered).not.toContain('<script>');
    expect(rendered).not.toContain('onerror=');
  });

  it('should parse hr into DIVIDER blocks with empty value and render back to semantic HTML', () => {
    const htmlWithDivider = '<p>First section</p><hr /><p>Second section</p>';
    const blocks = htmlToBlocks(htmlWithDivider);
    expect(blocks).toHaveLength(3);
    expect(blocks[1].type).toBe('DIVIDER');
    expect(blocks[1].value).toBe('');

    const rendered = blocksToHtml(blocks);
    expect(rendered).toContain('<hr class="my-6 border-border" />');
  });
});
