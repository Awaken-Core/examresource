import { Extension } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const findReplaceKey = new PluginKey('findReplace');

export type FindMatch = { from: number; to: number };

function isWordChar(ch: string) {
  return /[\p{L}\p{N}_]/u.test(ch);
}

/** Exact copies of `query` inside a plain string. Offsets are exclusive at `to`. */
export function findStringMatches(
  text: string,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
): FindMatch[] {
  const matches: FindMatch[] = [];
  if (!query) return matches;
  const hay = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  let cursor = 0;
  while (cursor <= hay.length - needle.length) {
    const idx = hay.indexOf(needle, cursor);
    if (idx < 0) break;
    const from = idx;
    const to = idx + query.length;
    const prev = text[from - 1] ?? '';
    const next = text[to] ?? '';
    const onBoundary = !isWordChar(prev) && !isWordChar(next);
    if (!wholeWord || onBoundary) matches.push({ from, to });
    cursor = idx + Math.max(query.length, 1);
  }
  return matches;
}

/** Map a textblock's textContent offset to a document position. */
export function mapTextOffset(block: PMNode, blockPos: number, offset: number) {
  if (offset <= 0) return blockPos + 1;
  if (offset >= block.textContent.length) return blockPos + block.nodeSize - 1;
  let seen = 0;
  let result = blockPos + 1;
  let done = false;
  block.descendants((node, rel) => {
    if (done) return false;
    if (!node.isText || !node.text) return;
    const len = node.text.length;
    if (seen + len >= offset) {
      result = blockPos + 1 + rel + (offset - seen);
      done = true;
      return false;
    }
    seen += len;
  });
  return result;
}

export function collectDocMatches(
  doc: PMNode,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
): FindMatch[] {
  const matches: FindMatch[] = [];
  if (!query) return matches;
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return;
    const local = findStringMatches(node.textContent, query, caseSensitive, wholeWord);
    for (const hit of local) {
      const from = mapTextOffset(node, pos, hit.from);
      const to = mapTextOffset(node, pos, hit.to);
      if (from >= to) continue;
      const actual = doc.textBetween(from, to, '', '\u0000');
      const same = caseSensitive ? actual === query : actual.toLowerCase() === query.toLowerCase();
      if (same) matches.push({ from, to });
    }
  });
  return matches;
}

export const FindReplace = Extension.create({
  name: 'findReplace',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: findReplaceKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, set) {
            const meta = tr.getMeta(findReplaceKey) as
              | { matches: FindMatch[]; active: number }
              | { clear: true }
              | undefined;
            if (meta && 'clear' in meta) return DecorationSet.empty;
            if (meta && 'matches' in meta) {
              const decos = meta.matches
                .filter((range) => range.from < range.to)
                .map((range, index) =>
                  Decoration.inline(range.from, range.to, {
                    class: index === meta.active ? 'find-match find-match-active' : 'find-match',
                  }),
                );
              return DecorationSet.create(tr.doc, decos);
            }
            return set.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return findReplaceKey.getState(state);
          },
        },
      }),
    ];
  },
});
