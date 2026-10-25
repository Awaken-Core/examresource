import React from 'react';
import type { PaletteSummaryCounts } from './types/cbt';

interface Props {
  readonly isOpen: boolean;
  readonly submitting: boolean;
  readonly submitError: string | null;
  readonly summaryCounts: PaletteSummaryCounts;
  readonly totalQuestions: number;
  readonly onClose: () => void;
  readonly onConfirmSubmit: () => void;
}

export function CBTSubmitModal({
  isOpen,
  submitting,
  submitError,
  summaryCounts,
  totalQuestions,
  onClose,
  onConfirmSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <dialog
      open
      aria-labelledby="submit-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 w-full h-full max-w-none max-h-none border-0 m-0"
    >
      <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-5 sm:p-7 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 id="submit-modal-title" className="text-base font-bold text-white">
              Confirm Final Submission
            </h3>
            <p className="text-[11px] text-muted">
              Are you sure you are ready to end this examination?
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Please review your attempt summary below. Once submitted, your answers will be locked for
          evaluation and you will not be able to return to this test.
        </p>

        {/* Official Assessment Summary Grid */}
        <div className="border border-border/80 rounded-xl overflow-hidden bg-surface-raised/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-border/60 text-xs">
            <div className="p-3">
              <span className="text-[10px] text-muted block uppercase font-medium">
                Total Questions
              </span>
              <span className="text-base font-bold text-white">{totalQuestions}</span>
            </div>

            <div className="p-3 bg-emerald-500/5">
              <span className="text-[10px] text-emerald-400 block uppercase font-medium">
                Answered
              </span>
              <span className="text-base font-bold text-emerald-400">{summaryCounts.answered}</span>
            </div>

            <div className="p-3 bg-rose-500/5">
              <span className="text-[10px] text-rose-400 block uppercase font-medium">
                Not Answered
              </span>
              <span className="text-base font-bold text-rose-400">
                {summaryCounts.not_answered}
              </span>
            </div>

            <div className="p-3 bg-purple-500/5">
              <span className="text-[10px] text-purple-400 block uppercase font-medium">
                Marked for Review
              </span>
              <span className="text-base font-bold text-purple-400">
                {summaryCounts.marked_for_review}
              </span>
            </div>

            <div className="p-3 bg-indigo-500/5">
              <span className="text-[10px] text-indigo-400 block uppercase font-medium">
                Ans & Reviewed
              </span>
              <span className="text-base font-bold text-indigo-400">
                {summaryCounts.answered_and_marked}
              </span>
            </div>

            <div className="p-3 bg-slate-500/5">
              <span className="text-[10px] text-muted block uppercase font-medium">
                Not Visited
              </span>
              <span className="text-base font-bold text-slate-400">
                {summaryCounts.not_visited}
              </span>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {submitError}
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold bg-surface-raised border border-border text-muted hover:text-white transition ${
              submitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            Return to Exam
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirmSubmit}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 transition ${
              submitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {submitting && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{submitting ? 'Submitting & Evaluating...' : 'Yes, End Test'}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
