import React from 'react';
import type { AttemptAnswer, PaletteSummaryCounts } from './types/cbt';

interface Props {
  readonly answers: readonly AttemptAnswer[];
  readonly currentIndex: number;
  readonly isActionDisabled: boolean;
  readonly summaryCounts: PaletteSummaryCounts;
  readonly onSelectQuestion: (index: number) => void;
}

export function CBTPalette({
  answers,
  currentIndex,
  isActionDisabled,
  summaryCounts,
  onSelectQuestion,
}: Props) {
  return (
    <aside
      aria-label="Question Navigation Palette"
      className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col"
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/70">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          Question Palette
        </h2>
        <span className="text-[11px] font-semibold text-muted px-2 py-0.5 rounded-md bg-surface-raised border border-border/50">
          {currentIndex + 1} of {answers.length}
        </span>
      </div>

      {/* Official 5-State Legend */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] pb-3 border-b border-border/70">
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">Answered ({summaryCounts.answered})</span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span className="truncate">Not Ans ({summaryCounts.not_answered})</span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
          <span className="truncate">Review ({summaryCounts.marked_for_review})</span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="truncate">Ans & Rev ({summaryCounts.answered_and_marked})</span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-300 col-span-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
          <span className="truncate">Not Visited ({summaryCounts.not_visited})</span>
        </div>
      </div>

      {/* Palette Grid Buttons */}
      <div className="p-1 max-h-[380px] overflow-y-auto overflow-x-hidden pr-2">
        <div className="grid grid-cols-5 gap-2">
          {answers.map((ans, idx) => {
            const isCurrent = idx === currentIndex;
            const status = ans.status ?? 'not_visited';

            let statusStyle =
              'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 hover:bg-slate-300';
            if (status === 'answered') {
              statusStyle =
                'bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600';
            } else if (status === 'not_answered') {
              statusStyle = 'bg-rose-500 text-white border border-rose-600 hover:bg-rose-600';
            } else if (status === 'marked_for_review') {
              statusStyle = 'bg-purple-500 text-white border border-purple-600 hover:bg-purple-600';
            } else if (status === 'answered_and_marked_for_review') {
              statusStyle = 'bg-indigo-500 text-white border border-indigo-600 hover:bg-indigo-600';
            }

            return (
              <button
                key={ans.questionId || idx}
                type="button"
                disabled={isActionDisabled}
                onClick={() => onSelectQuestion(idx)}
                aria-label={`Jump to Question ${idx + 1}, status: ${status}`}
                className={`h-9 w-full rounded-xl text-xs font-bold transition flex items-center justify-center select-none ${statusStyle} ${
                  isCurrent
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-105 z-10'
                    : ''
                } ${
                  isActionDisabled
                    ? 'opacity-70 cursor-not-allowed'
                    : 'cursor-pointer active:scale-95'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
