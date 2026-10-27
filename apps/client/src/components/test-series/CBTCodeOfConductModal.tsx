import React from 'react';

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly testTitle: string;
  readonly positiveMarks: number;
  readonly negativeMarks: number;
}

export function CBTCodeOfConductModal({
  isOpen,
  onClose,
  testTitle,
  positiveMarks,
  negativeMarks,
}: Props) {
  if (!isOpen) return null;

  return (
    <dialog
      open
      aria-labelledby="conduct-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto w-full h-full max-w-none max-h-none border-0 m-0"
    >
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <h2 id="conduct-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              Official Examination Instructions & Code of Conduct
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Instructions"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-raised text-muted hover:text-slate-900 dark:hover:text-slate-100"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-foreground">
            <p className="mb-0.5 font-semibold text-slate-900 dark:text-slate-100">{testTitle}</p>
            <p className="text-[11px] text-accent">
              Candidate Examination Session &bull; Standard NPTEL / National CBT Protocol
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-slate-100">
              1. General Instructions
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
              <li>
                The countdown clock in the top bar indicates the remaining time. When the timer
                reaches zero, the examination ends automatically.
              </li>
              <li>
                Each correct answer awards <strong>+{positiveMarks}</strong> marks.
                {negativeMarks > 0 ? (
                  <span>
                    {' '}
                    Each incorrect answer carries a negative marking of{' '}
                    <strong className="text-rose-400">-{negativeMarks}</strong> marks.
                  </span>
                ) : (
                  <span> No negative marking is applicable.</span>
                )}
              </li>
              <li>Unattempted questions receive zero marks and do not attract penalties.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-slate-100">
              2. Question Palette Legend
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-raised border border-border">
                <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>You have answered the question.</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-raised border border-border">
                <span className="w-5 h-5 rounded-md bg-rose-500 text-white font-bold flex items-center justify-center text-[10px]">
                  ✗
                </span>
                <span>You have not answered the question.</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-raised border border-border">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
                  ●
                </span>
                <span>Marked for review without answering.</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-raised border border-border">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] text-white">
                  ●
                </span>
                <span>Answered & marked for review (evaluated).</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-raised border border-border sm:col-span-2">
                <span className="w-5 h-5 rounded-md bg-slate-600 text-white font-bold flex items-center justify-center text-[10px]">
                  &bull;
                </span>
                <span>You have not visited the question yet.</span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-slate-100">
              3. Academic Integrity & Proctoring Code of Conduct
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
              <li>
                The paper opens in full screen. Switching tabs or leaving this window shows a reminder
                to practise in good faith. The examination stays open.
              </li>
              <li>
                Copying the paper and screenshots stay blocked.
              </li>
              <li>
                <strong>External Assistance:</strong> Use of secondary devices, browsers, or AI
                scrapers is strictly prohibited.
              </li>
            </ul>
          </section>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-accent hover:opacity-90 text-on-accent transition cursor-pointer shadow-md"
          >
            I Understand &bull; Return to Test
          </button>
        </div>
      </div>
    </dialog>
  );
}
