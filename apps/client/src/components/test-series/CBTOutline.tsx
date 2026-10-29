import React from 'react';
import type { SectionProgressItem } from './types/cbt';

interface Props {
  readonly conductAgreed: boolean;
  readonly viewingConduct: boolean;
  readonly sections: readonly SectionProgressItem[];
  readonly activeSectionId: string | null;
  readonly currentNumber: number;
  readonly totalQuestions: number;
  readonly locked: boolean;
  readonly onShowConduct: () => void;
  readonly onOpenSection: (sectionId: string | null) => void;
}

export const CBTOutline = React.memo(function CBTOutline({
  conductAgreed,
  viewingConduct,
  sections,
  activeSectionId,
  currentNumber,
  totalQuestions,
  locked,
  onShowConduct,
  onOpenSection,
}: Props) {
  const sectionItems =
    sections.length > 0
      ? sections
      : [{ sectionId: '', name: 'Test questions', timeSpentSeconds: 0, isCompleted: false }];

  return (
    <aside className="h-full min-h-0 overflow-hidden border-border bg-surface lg:border-r" aria-label="Outline">
      <div className="flex h-10 items-center gap-2 overflow-x-auto px-2 lg:hidden">
        <button
          type="button"
          onClick={onShowConduct}
          className={`h-7 shrink-0 rounded border px-2 text-[11px] font-semibold ${
            viewingConduct ? 'border-accent text-slate-900 dark:text-slate-100' : 'border-border text-muted'
          }`}
        >
          Conduct {conductAgreed ? 'agreed' : 'required'}
        </button>
        {sectionItems.map((section, index) => (
          <button
            key={section.sectionId || index}
            type="button"
            disabled={locked}
            onClick={() => onOpenSection(section.sectionId || null)}
            className="h-7 shrink-0 rounded border border-border px-2 text-[11px] font-semibold text-slate-900 disabled:opacity-50 dark:text-slate-100"
          >
            {section.name || `Section ${index + 1}`}
          </button>
        ))}
      </div>

      <div data-lenis-prevent className="hidden h-full flex-col gap-3 overflow-y-auto overscroll-contain p-3 lg:flex custom-scrollbar">
        <p className="text-[10px] font-bold tracking-wider text-muted uppercase">Outline panel</p>
        <section className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">Section 1</p>
          <button
            type="button"
            onClick={onShowConduct}
            className={`flex w-full items-start justify-between gap-2 rounded border px-2 py-2 text-left text-xs ${
              viewingConduct ? 'border-slate-900 dark:border-slate-100' : 'border-border'
            }`}
          >
            <span>
              <span className="block font-semibold text-slate-900 dark:text-slate-100">
                Q1 · Code of conduct
              </span>
              <span className="text-[11px] text-muted">Agreement required first</span>
            </span>
            <span
              className={`shrink-0 text-[11px] font-semibold ${
                conductAgreed ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {conductAgreed ? 'Agreed' : 'Pending'}
            </span>
          </button>
        </section>
        <section className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">Section 2</p>
          {sectionItems.map((section, index) => {
            const selected = !viewingConduct && (activeSectionId ?? sectionItems[0]?.sectionId) === section.sectionId;
            return (
              <button
                key={section.sectionId || `section-${index}`}
                type="button"
                disabled={locked}
                onClick={() => onOpenSection(section.sectionId || null)}
                className={`flex w-full items-center justify-between gap-2 rounded border px-2 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected ? 'border-slate-900 dark:border-slate-100' : 'border-border'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">
                    {selected ? '→ ' : ''}
                    {section.name || `Questions ${index + 1}`}
                  </span>
                  <span className="text-[11px] text-muted">
                    {locked ? 'Opens after agreement' : `Question ${currentNumber} of ${totalQuestions}`}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </aside>
  );
});
