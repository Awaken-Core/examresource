import React from 'react';
import type { PaletteSummaryCounts } from './types/cbt';

interface Props {
  readonly counts: PaletteSummaryCounts;
  readonly isActionDisabled: boolean;
  readonly canSubmit: boolean;
  readonly onFinalSubmit: () => void;
}

export const CBTLegend = React.memo(function CBTLegend({
  counts,
  isActionDisabled,
  canSubmit,
  onFinalSubmit,
}: Props) {
  const marked = counts.marked_for_review + counts.answered_and_marked;
  const rows = [
    { label: 'Answered', value: counts.answered, swatch: 'rounded-sm bg-emerald-600' },
    { label: 'Unanswered', value: counts.not_answered, swatch: 'rounded-sm bg-rose-600' },
    { label: 'Marked for review', value: marked, swatch: 'rounded-full bg-orange-500' },
    { label: 'Not visited', value: counts.not_visited, swatch: 'rounded-sm bg-slate-400' },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col justify-between gap-2 border-border p-2 lg:border-l" aria-label="Legend and status">
      <div>
        <p className="text-[10px] font-bold tracking-wider text-muted uppercase">Legend and status</p>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 lg:grid-cols-1">
          {rows.map((row) => (
            <li key={row.label} className="flex h-5 items-center justify-between gap-2 overflow-hidden text-[11px] whitespace-nowrap">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-900 dark:text-slate-100">
                <span className={`h-2.5 w-2.5 shrink-0 ${row.swatch}`} />
                <span className="truncate">{row.label}</span>
              </span>
              <span className="w-8 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        disabled={isActionDisabled || !canSubmit}
        onClick={onFinalSubmit}
        className="h-9 w-full truncate rounded bg-emerald-700 px-2 text-xs font-bold text-on-accent disabled:opacity-50"
      >
        Final submit exam
      </button>
    </section>
  );
});
