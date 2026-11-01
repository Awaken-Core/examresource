import React from 'react';
import type { QuestionPaletteStatus } from './types/cbt';

interface Props {
  readonly status: QuestionPaletteStatus;
  readonly number?: number | string;
  readonly size?: 'sm' | 'md' | 'lg' | 'palette';
  readonly isCurrent?: boolean;
  readonly className?: string;
}

/**
 * Authentic Government CBT (TCS-iON / NTA / SSC / DSSSB) Question Palette Status Shape.
 *
 * Shapes:
 * - not_visited: White square with crisp border
 * - not_answered: Red downward rounded shield/badge
 * - answered: Green upward rounded shield/badge
 * - marked_for_review: Violet/purple circle
 * - answered_and_marked_for_review: Violet/purple circle with a small green tick badge
 */
export function CBTStatusShape({
  status,
  number,
  size = 'md',
  isCurrent = false,
  className = '',
}: Props) {
  const isPalette = size === 'palette';

  const baseDimensions = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-xs',
    palette: 'w-9 h-9 text-xs sm:text-sm font-bold',
  }[size];

  const currentRing = isCurrent
    ? 'ring-2 ring-accent ring-offset-2 ring-offset-canvas shadow-md z-10 scale-105'
    : '';

  switch (status) {
    case 'not_visited':
      return (
        <span
          className={`inline-flex shrink-0 items-center justify-center border border-slate-300 bg-white text-slate-800 shadow-2xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-sm select-none transition-all ${baseDimensions} ${currentRing} ${className}`}
        >
          {number ?? null}
        </span>
      );

    case 'not_answered':
      // Red shield with curved bottom
      return (
        <span
          className={`inline-flex shrink-0 items-center justify-center bg-rose-600 text-white font-bold rounded-t-xs rounded-b-xl shadow-2xs select-none transition-all ${baseDimensions} ${currentRing} ${className}`}
        >
          {number ?? null}
        </span>
      );

    case 'answered':
      // Green shield with curved top
      return (
        <span
          className={`inline-flex shrink-0 items-center justify-center bg-emerald-600 text-white font-bold rounded-t-xl rounded-b-xs shadow-2xs select-none transition-all ${baseDimensions} ${currentRing} ${className}`}
        >
          {number ?? null}
        </span>
      );

    case 'marked_for_review':
      // Purple/Violet circle
      return (
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-purple-700 text-white font-bold shadow-2xs select-none transition-all ${baseDimensions} ${currentRing} ${className}`}
        >
          {number ?? null}
        </span>
      );

    case 'answered_and_marked_for_review':
      // Purple/Violet circle with a small green checkmark in bottom-right corner
      return (
        <span
          className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-purple-700 text-white font-bold shadow-2xs select-none transition-all ${baseDimensions} ${currentRing} ${className}`}
        >
          {number ?? null}
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white ring-1 ring-white dark:ring-slate-900"
            title="Answered & Marked"
          >
            ✓
          </span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${baseDimensions} ${currentRing} ${className}`}
        >
          {number ?? null}
        </span>
      );
  }
}

