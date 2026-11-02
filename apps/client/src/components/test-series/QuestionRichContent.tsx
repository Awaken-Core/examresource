import type { QuestionDetail } from './types/cbt';

interface Cell {
  text?: string;
  translations?: Record<string, string>;
}

interface Block {
  type?: string;
  text?: string;
  translations?: Record<string, string>;
  imageUrl?: string | null;
  alt?: string | null;
  rows?: Array<{ cells?: Cell[] }>;
}

function localized(text: string | undefined, translations: Record<string, string> | undefined, language: 'English' | 'Hindi'): string {
  if (language === 'Hindi' && translations?.hi) return translations.hi;
  return text || '';
}

export function QuestionRichContent({
  question,
  language,
}: {
  question: QuestionDetail | null;
  language: 'English' | 'Hindi';
}) {
  if (!question) return <p>The question will appear here.</p>;
  const blocks = (question.blocks ?? []) as Block[];
  if (blocks.length === 0) {
    const text = localized(question.content, question.translations, language);
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          const rows = block.rows ?? [];
          return (
            <div key={index} className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {(row.cells ?? []).map((cell, cellIndex) => {
                        const value = localized(cell.text, cell.translations, language);
                        const Tag = rowIndex === 0 ? 'th' : 'td';
                        return (
                          <Tag
                            key={cellIndex}
                            className="border border-border px-2 py-1.5 text-left align-top font-medium text-heading"
                          >
                            {value}
                          </Tag>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === 'code') {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg border border-border bg-surface-raised p-3 font-mono text-sm leading-6 text-heading"
            >
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.type === 'image' && block.imageUrl) {
          return (
            <img
              key={index}
              src={block.imageUrl}
              alt={block.alt || 'Question diagram'}
              className="h-auto max-w-full rounded-lg border border-border"
            />
          );
        }
        const text = localized(block.text, block.translations, language);
        if (!text) return null;
        return (
          <p key={index} className="whitespace-pre-wrap">
            {text}
          </p>
        );
      })}
    </div>
  );
}
