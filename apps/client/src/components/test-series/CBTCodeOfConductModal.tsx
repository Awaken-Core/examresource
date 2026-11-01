import React, { useState } from 'react';
import { CBTStatusShape } from './CBTStatusShape';

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly testTitle: string;
  readonly positiveMarks: number;
  readonly negativeMarks: number;
  readonly durationMinutes?: number | null;
  readonly totalQuestions?: number;
}

export function CBTCodeOfConductModal({
  isOpen,
  onClose,
  testTitle,
  positiveMarks,
  negativeMarks,
  durationMinutes,
  totalQuestions,
}: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'specific'>('general');

  if (!isOpen) return null;

  return (
    <dialog
      open
      aria-labelledby="conduct-title"
      className="fixed inset-0 z-[10070] flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-black/75 p-3 backdrop-blur-xs sm:p-6"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <h2 id="conduct-title" className="text-base font-bold text-heading">
              Examination Instructions &bull; {testTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Instructions"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised text-muted hover:text-heading cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-border bg-surface-raised/40 px-5 pt-2 text-xs font-semibold sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`border-b-2 px-4 py-2 cursor-pointer transition ${
              activeTab === 'general'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-muted hover:text-heading'
            }`}
          >
            General Instructions (Question Palette)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specific')}
            className={`border-b-2 px-4 py-2 cursor-pointer transition ${
              activeTab === 'specific'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-muted hover:text-heading'
            }`}
          >
            Exam Specific Rules
          </button>
        </div>

        {/* Body content */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 custom-scrollbar space-y-5 text-xs sm:text-sm text-heading leading-relaxed">
          {activeTab === 'general' ? (
            <div className="space-y-4">
              <h3 className="font-bold text-heading text-sm sm:text-base">General Instructions:</h3>
              <p>
                <strong>1.</strong> The clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.
              </p>

              <p>
                <strong>2.</strong> The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
              </p>

              <div className="space-y-2.5 pl-2 sm:pl-4">
                <div className="flex items-center gap-3">
                  <CBTStatusShape status="not_visited" size="md" />
                  <span>You have not visited the question yet.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CBTStatusShape status="not_answered" size="md" />
                  <span>You have not answered the question.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CBTStatusShape status="answered" size="md" />
                  <span>You have answered the question.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CBTStatusShape status="marked_for_review" size="md" />
                  <span>You have NOT answered the question, but have marked the question for review.</span>
                </div>
                <div className="flex items-center gap-3">
                  <CBTStatusShape status="answered_and_marked_for_review" size="md" />
                  <span>You have answered the question, but marked it for review.</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-raised/40 p-3.5 text-xs leading-relaxed text-muted">
                The <strong>Mark For Review</strong> status for a question simply indicates that you would like to look at that question again. If a question is answered, but marked for review, then the answer will be considered for evaluation unless the status is modified by the candidate.
              </div>

              <h4 className="font-bold text-heading pt-2">Navigating to a Question :</h4>
              <p>
                <strong>3.</strong> To answer a question, do the following:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted">
                <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                <li>Click on <strong>Save &amp; Next</strong> to save your answer for the current question and then go to the next question.</li>
                <li>Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current question and also mark it for review, and then go to the next question.</li>
              </ul>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Note that your answer for the current question will not be saved, if you navigate to another question directly by clicking on a question number without saving the answer to the previous question.
              </p>

              <h4 className="font-bold text-heading pt-2">Answering a Question :</h4>
              <p>
                <strong>4.</strong> Procedure for answering a multiple choice (MCQ) type question:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted">
                <li>Choose one answer from the 4 options given below the question, click on the bubble placed before the chosen option.</li>
                <li>To deselect your chosen answer, click on the bubble of the chosen option again or click on the <strong>Clear Response</strong> button.</li>
                <li>To change your chosen answer, click on the bubble of another option.</li>
                <li>To save your answer, you MUST click on the <strong>Save &amp; Next</strong> button.</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-heading text-sm sm:text-base">Test Parameters &amp; Rules:</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-surface-raised/50 p-3">
                  <span className="text-[11px] text-muted block">Duration</span>
                  <span className="text-sm font-bold text-heading">
                    {durationMinutes ? `${durationMinutes} Minutes` : 'Untimed'}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-surface-raised/50 p-3">
                  <span className="text-[11px] text-muted block">Questions</span>
                  <span className="text-sm font-bold text-heading">
                    {totalQuestions ?? 'All'} Questions
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-surface-raised/50 p-3 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-muted block">Marking Scheme</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +{positiveMarks}
                  </span>
                  {negativeMarks > 0 && (
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 ml-1">
                      / -{negativeMarks}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p><strong>1.</strong> The test contains {totalQuestions ?? 'all allotted'} total questions.</p>
                <p><strong>2.</strong> Each question has multiple choice options out of which only one is correct (unless MSQ is indicated).</p>
                <p><strong>3.</strong> Each correct response awards +{positiveMarks} marks.</p>
                <p>
                  <strong>4.</strong>{' '}
                  {negativeMarks > 0
                    ? `Each incorrect response carries a penalty of -${negativeMarks} marks.`
                    : 'There is no negative marking for incorrect answers.'}
                </p>
                <p><strong>5.</strong> Unattempted questions receive zero marks and do not attract penalties.</p>
                <p><strong>6.</strong> Ensure you complete and submit before closing the session or navigating away.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-accent px-5 py-2 text-xs font-bold text-on-accent hover:opacity-90 cursor-pointer"
          >
            Close Instructions
          </button>
        </div>
      </div>
    </dialog>
  );
}
