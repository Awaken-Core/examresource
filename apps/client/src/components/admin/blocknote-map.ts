/**
 * Convert between BlockNote's document model and the backend's typed block
 * rows. The original BlockNote block JSON is stored losslessly in each row's
 * `metadata.bn`, so reloading an article into the editor is exact, while the
 * `value` field holds clean HTML/text used for public, SEO-friendly rendering.
 */
import type { ApiBlock, BackendBlockType } from '../../lib/blog-render';

// BlockNote blocks carry framework-specific generics; we treat them loosely
// here to keep the mapping readable.
type AnyBlock = any;
type AnyEditor = {
  document: AnyBlock[];
  blocksToHTMLLossy: (blocks: AnyBlock[]) => Promise<string>;
};

export const EMPTY_DOCUMENT: AnyBlock[] = [{ type: 'paragraph', content: [] }];

function inlineToPlainText(content: unknown): string {
  if (!Array.isArray(content)) return '';
  return content
    .map((node: any) => {
      if (!node || typeof node !== 'object') return '';
      if (node.type === 'text') return node.text ?? '';
      if (node.type === 'link') return inlineToPlainText(node.content);
      return '';
    })
    .join('');
}

function clampHeadingLevel(level: unknown): number {
  const n = typeof level === 'number' ? level : 2;
  return Math.min(6, Math.max(1, n));
}

/** Map one BlockNote block + its exported HTML into a backend block row. */
function mapBlock(block: AnyBlock, html: string, position: number): ApiBlock {
  const props = block.props ?? {};
  const base = { position, metadata: { bn: block } as Record<string, unknown> };

  switch (block.type) {
    case 'heading': {
      const level = clampHeadingLevel(props.level);
      return {
        ...base,
        type: `HEADING_${level}` as BackendBlockType,
        value: html,
        metadata: { ...base.metadata, level },
      };
    }
    case 'bulletListItem':
      return { ...base, type: 'BULLET_LIST', value: html };
    case 'checkListItem':
      return {
        ...base,
        type: 'BULLET_LIST',
        value: html,
        metadata: { ...base.metadata, checked: !!props.checked },
      };
    case 'numberedListItem':
      return { ...base, type: 'NUMBERED_LIST', value: html };
    case 'codeBlock':
      return {
        ...base,
        type: 'CODE',
        value: inlineToPlainText(block.content),
        metadata: { ...base.metadata, language: props.language ?? '' },
      };
    case 'image':
      return {
        ...base,
        type: 'IMAGE',
        value: String(props.url ?? ''),
        metadata: {
          ...base.metadata,
          alt: props.caption ?? '',
          caption: props.caption ?? '',
          previewWidth: props.previewWidth ?? null,
        },
      };
    case 'video':
      return {
        ...base,
        type: 'VIDEO',
        value: String(props.url ?? ''),
        metadata: { ...base.metadata, caption: props.caption ?? '' },
      };
    case 'table':
      // No TABLE type in the DB enum — store as a PARAGRAPH carrier flagged in
      // metadata, with the full <table> HTML in value for public rendering.
      return {
        ...base,
        type: 'PARAGRAPH',
        value: html,
        metadata: { ...base.metadata, kind: 'table' },
      };
    case 'quote':
      return { ...base, type: 'QUOTE', value: html };
    case 'paragraph':
    default:
      return { ...base, type: 'PARAGRAPH', value: html };
  }
}

/** Serialize the current editor document into backend block rows. */
export async function blocksToBackend(editor: AnyEditor): Promise<ApiBlock[]> {
  const doc = editor.document ?? [];
  const rows: ApiBlock[] = [];

  for (let i = 0; i < doc.length; i++) {
    const block = doc[i];
    const html = await editor.blocksToHTMLLossy([block]);
    rows.push(mapBlock(block, html, rows.length));
  }

  // Trim a single trailing empty paragraph (BlockNote keeps one by default).
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.type === 'PARAGRAPH' && !stripTags(last.value).trim()) {
      rows.pop();
    } else {
      break;
    }
  }

  return rows;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

/** Rebuild BlockNote document blocks from stored backend rows. */
export function backendToBlocks(blocks: ApiBlock[] | undefined): AnyBlock[] {
  if (!blocks || blocks.length === 0) return EMPTY_DOCUMENT;

  const ordered = [...blocks].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const result: AnyBlock[] = [];
  for (const row of ordered) {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    if (meta.bn && typeof meta.bn === 'object') {
      // Lossless path: use the stored BlockNote block (minus its stale id).
      const { id: _id, ...rest } = meta.bn as AnyBlock;
      result.push(rest);
      continue;
    }
    result.push(fallbackBlock(row, meta));
  }

  return result.length > 0 ? result : EMPTY_DOCUMENT;
}

function textContent(value: string): AnyBlock['content'] {
  const text = value.replace(/<[^>]*>/g, '').trim();
  return text ? [{ type: 'text', text, styles: {} }] : [];
}

/** Best-effort reconstruction when a row has no stored BlockNote JSON. */
function fallbackBlock(row: ApiBlock, meta: Record<string, unknown>): AnyBlock {
  switch (row.type) {
    case 'HEADING_1':
    case 'HEADING_2':
    case 'HEADING_3':
    case 'HEADING_4':
    case 'HEADING_5':
    case 'HEADING_6': {
      const level = Math.min(
        3,
        Number(row.type.split('_')[1] ?? 2),
      ) as 1 | 2 | 3;
      return { type: 'heading', props: { level }, content: textContent(row.value) };
    }
    case 'BULLET_LIST':
      return { type: 'bulletListItem', content: textContent(row.value) };
    case 'NUMBERED_LIST':
      return { type: 'numberedListItem', content: textContent(row.value) };
    case 'CODE':
      return {
        type: 'codeBlock',
        props: { language: (meta.language as string) ?? '' },
        content: row.value ? [{ type: 'text', text: row.value, styles: {} }] : [],
      };
    case 'IMAGE':
      return {
        type: 'image',
        props: { url: row.value, caption: (meta.caption as string) ?? '' },
      };
    case 'VIDEO':
      return { type: 'video', props: { url: row.value } };
    case 'QUOTE':
      return { type: 'quote', content: textContent(row.value) };
    case 'DIVIDER':
      return { type: 'paragraph', content: [] };
    case 'PARAGRAPH':
    default:
      return { type: 'paragraph', content: textContent(row.value) };
  }
}
