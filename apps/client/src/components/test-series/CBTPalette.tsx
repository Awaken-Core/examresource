import React, { useEffect, useRef, useState } from 'react';
import type { AttemptAnswer } from './types/cbt';
import { CBTFlagIcon } from './CBTFlagIcon';

interface Props {
  readonly answers: readonly AttemptAnswer[];
  readonly currentIndex: number;
  readonly isActionDisabled: boolean;
  readonly locked: boolean;
  readonly onSelectQuestion: (index: number) => void;
}

const VISIBLE = 20;

function chipClass(status: string, current: boolean): string {
  if (status === 'marked_for_review' || status === 'answered_and_marked_for_review') {
    return current
      ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-accent shadow-sm font-black'
      : 'bg-amber-500 text-white border-amber-600';
  }
  if (current) {
    if (status === 'answered') {
      return 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-accent shadow-sm font-black';
    }
    if (status === 'not_answered') {
      return 'bg-rose-600 text-white border-rose-700 ring-2 ring-accent shadow-sm font-black';
    }
    return 'bg-accent text-on-accent border-accent ring-2 ring-accent/40 shadow-sm font-black';
  }
  if (status === 'answered') return 'bg-emerald-600 text-white border-emerald-700';
  if (status === 'not_answered') return 'bg-rose-600 text-white border-rose-700';
  return 'bg-surface text-slate-700 border-border dark:text-slate-200';
}

function isFlaggedStatus(status: string): boolean {
  return status === 'marked_for_review' || status === 'answered_and_marked_for_review';
}

function Chevron({ direction }: { readonly direction: 'left' | 'right' }) {
  const path = direction === 'left' ? 'M14.5 5 8 12l6.5 7' : 'M9.5 5 16 12l-6.5 7';
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="h-4 w-4">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const CBTPalette = React.memo(function CBTPalette({
  answers,
  currentIndex,
  isActionDisabled,
  locked,
  onSelectQuestion,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [windowStart, setWindowStart] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const disabled = isActionDisabled || locked || answers.length === 0;
  const columns = Math.max(answers.length, VISIBLE);
  const maxStart = Math.max(0, answers.length - VISIBLE);
  const start = Math.min(windowStart, maxStart);
  const activeIndex = scrub ?? currentIndex;
  const showDot = answers.length > 0 && activeIndex >= 0 && activeIndex < answers.length;

  useEffect(() => {
    setWindowStart((current) => {
      const limit = Math.max(0, answers.length - VISIBLE);
      if (answers.length === 0) return 0;
      if (currentIndex < current) return currentIndex;
      if (currentIndex >= current + VISIBLE) return Math.min(currentIndex - VISIBLE + 1, limit);
      return Math.min(current, limit);
    });
  }, [currentIndex, answers.length]);

  const slide = (delta: number) => {
    setScrub(null);
    setWindowStart((current) => Math.min(maxStart, Math.max(0, Math.min(current, maxStart) + delta)));
  };

  const indexFromClientX = (clientX: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || answers.length === 0) return null;
    const ratio = Math.min(0.999, Math.max(0, (clientX - rect.left) / rect.width));
    const index = start + Math.floor(ratio * VISIBLE);
    if (index < 0 || index >= answers.length) return null;
    return index;
  };

  const commit = (index: number | null) => {
    setScrub(null);
    if (index !== null) onSelectQuestion(index);
  };

  return (
    <section className="flex h-full min-h-0 flex-col justify-center gap-1.5 border-border px-2 py-2 lg:border-r lg:px-3" aria-label="Question palette">
      <div className="flex h-5 items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-wider text-muted uppercase">Question slider</h2>
        <span className="font-mono text-[11px] tabular-nums text-slate-900 dark:text-slate-100">
          {answers.length === 0 ? '0' : currentIndex + 1}
          <span className="text-muted"> / {answers.length}</span>
        </span>
      </div>

      <div className="flex items-start gap-1.5">
        <button
          type="button"
          onClick={() => slide(-1)}
          disabled={disabled || start === 0}
          aria-label="Slide questions left"
          className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border text-slate-900 disabled:opacity-40 dark:text-slate-100"
        >
          <Chevron direction="left" />
        </button>

        <div ref={viewportRef} className="min-w-0 flex-1 overflow-hidden">
          <div
            className="motion-safe:transition-transform motion-safe:duration-200"
            style={{
              width: `${(columns / VISIBLE) * 100}%`,
              transform: `translateX(calc(${-start} * 100% / ${columns}))`,
            }}
          >
            <div
              className="grid h-11 items-center pt-1"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {answers.map((answer, index) => {
                const current = index === currentIndex && !locked;
                const flagged = isFlaggedStatus(answer.status);
                return (
                  <button
                    key={answer.questionId || index}
                    type="button"
                    disabled={isActionDisabled || locked}
                    onClick={() => onSelectQuestion(index)}
                    aria-current={current ? 'true' : undefined}
                    aria-label={`Question ${index + 1}${flagged ? ', flagged' : ''}, ${answer.status}`}
                    className={`relative mx-auto flex aspect-square w-[84%] max-w-[34px] items-center justify-center rounded-full border text-[10px] font-bold tabular-nums disabled:opacity-40 sm:text-[11px] ${chipClass(answer.status, current)}`}
                  >
                    {index + 1}
                    {flagged && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-1.5 -right-1 z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                        title="Marked for review"
                      >
                        <CBTFlagIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label="Jump to question. Release to open it."
              aria-valuemin={1}
              aria-valuemax={Math.max(answers.length, 1)}
              aria-valuenow={answers.length === 0 ? 1 : activeIndex + 1}
              aria-disabled={disabled}
              className="relative mt-3 h-5 cursor-pointer touch-none"
              onPointerDown={(event) => {
                if (disabled) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                const index = indexFromClientX(event.clientX);
                if (index !== null) setScrub(index);
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                const index = indexFromClientX(event.clientX);
                if (index !== null) setScrub(index);
              }}
              onPointerUp={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                commit(indexFromClientX(event.clientX) ?? scrub);
              }}
              onKeyUp={(event) => {
                if (disabled) return;
                const current = scrub ?? currentIndex;
                let next = current;
                if (event.key === 'ArrowLeft') next = Math.max(0, current - 1);
                else if (event.key === 'ArrowRight') next = Math.min(answers.length - 1, current + 1);
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = Math.max(0, answers.length - 1);
                else return;
                commit(next);
              }}
            >
              <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-orange-100 dark:bg-orange-950" />
              {showDot && (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-orange-500 shadow-sm dark:border-slate-900"
                  style={{ left: `calc((${activeIndex} + 0.5) * 100% / ${columns})` }}
                />
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => slide(1)}
          disabled={disabled || start >= maxStart}
          aria-label="Slide questions right"
          className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border text-slate-900 disabled:opacity-40 dark:text-slate-100"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </section>
  );
});
