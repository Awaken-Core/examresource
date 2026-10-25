import React from 'react';
import type { QuestionDetail } from './types/cbt';

interface Props {
  readonly currentIndex: number;
  readonly totalQuestions: number;
  readonly question: QuestionDetail | null;
  readonly language: 'English' | 'Hindi';
  readonly selectedOptionIds: readonly string[];
  readonly numericalInput: string;
  readonly isFlagged: boolean;
  readonly isSaving: boolean;
  readonly savingAction: 'save_and_next' | 'mark_review' | 'clear' | null;
  readonly networkError: string | null;
  readonly isActionDisabled: boolean;
  readonly isLastQuestion: boolean;
  readonly hasPrevious: boolean;
  readonly onToggleOption: (optionId: string) => void;
  readonly onNumericalChange: (value: string) => void;
  readonly onToggleFlag: () => void;
  readonly onClearResponse: () => void;
  readonly onMarkForReviewAndNext: () => void;
  readonly onPrevious: () => void;
  readonly onSaveAndNext: () => void;
  readonly onOpenSubmit: () => void;
  readonly onDismissError: () => void;
}

function getQuestionTypeLabel(type: string): string {
  if (type === 'numerical') return 'Numerical Answer';
  if (type === 'multiple_choice') return 'Multiple Correct MCQ';
  return 'Single Correct MCQ';
}

function getSavingActionText(action: 'save_and_next' | 'mark_review' | 'clear' | null): string {
  if (action === 'save_and_next') return 'Saving response & advancing...';
  if (action === 'mark_review') return 'Marking for review & saving...';
  if (action === 'clear') return 'Clearing response on server...';
  return 'Saving response to server...';
}

export function CBTQuestionPanel({
  currentIndex,
  totalQuestions,
  question,
  language,
  selectedOptionIds,
  numericalInput,
  isFlagged,
  isSaving,
  savingAction,
  networkError,
  isActionDisabled,
  isLastQuestion,
  hasPrevious,
  onToggleOption,
  onNumericalChange,
  onToggleFlag,
  onClearResponse,
  onMarkForReviewAndNext,
  onPrevious,
  onSaveAndNext,
  onOpenSubmit,
  onDismissError,
}: Props) {
  const questionType = question?.type ?? 'single_choice';
  const questionTypeLabel = getQuestionTypeLabel(questionType);

  let questionContent = question?.content ?? 'Loading question...';
  if (language === 'Hindi' && question?.translations?.['hi']) {
    questionContent = question.translations['hi'];
  }

  const flagBtnClass = isFlagged
    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
    : 'bg-surface-raised border-border text-muted hover:text-white';

  return (
    <div className="flex flex-col justify-between bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 min-h-[480px]">
      <div className="space-y-4">
        {/* Question Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600/15 text-blue-400 border border-blue-500/30">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-[11px] text-muted">
              Type: <strong className="text-slate-200 font-medium">{questionTypeLabel}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Flag / Review Quick Toggle */}
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={onToggleFlag}
              aria-label={isFlagged ? 'Remove question flag' : 'Flag question for review'}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${flagBtnClass}`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={isFlagged ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
            </button>

            {/* Marking Scheme */}
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
              <span className="text-emerald-400">+{question?.marks ?? 1}</span>
              {(question?.negativeMarks ?? 0) > 0 && (
                <span className="text-rose-400">-{question?.negativeMarks}</span>
              )}
            </div>
          </div>
        </div>

        {/* Network / Saving Feedback */}
        {isSaving && (
          <div className="flex items-center gap-2 text-[11px] text-blue-400 font-medium">
            <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span>{getSavingActionText(savingAction)}</span>
          </div>
        )}

        {networkError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 shrink-0 text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{networkError}</span>
            </div>
            <button
              type="button"
              onClick={onDismissError}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-200 underline ml-auto shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* NPTEL Official Split Layout: Left Question Stem, Right Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-start">
          {/* Left Column: Official Question Text */}
          <div className="space-y-4 pr-0 md:pr-4 md:border-r md:border-border/60 min-h-[220px]">
            <div className="text-[11px] uppercase tracking-wider text-muted font-bold">
              Question Statement:
            </div>
            <div className="text-sm sm:text-base font-normal text-slate-100 leading-relaxed whitespace-pre-wrap select-text">
              {questionContent}
            </div>
          </div>

          {/* Right Column: Options & Answer Input */}
          <div className="space-y-3 min-h-[220px]">
            <div className="text-[11px] uppercase tracking-wider text-muted font-bold">
              Select Response:
            </div>

            {/* Type 1 & 2: Single or Multiple Choice MCQ */}
            {questionType !== 'numerical' && question?.options && (
              <div className="space-y-2.5">
                {question.options.map((opt, optIdx) => {
                  const optId = opt.id || opt._id || String(optIdx);
                  const isChecked = selectedOptionIds.includes(optId);
                  const optLetter = String.fromCodePoint(65 + optIdx);
                  let optContent = opt.content;
                  if (language === 'Hindi' && opt.translations?.['hi']) {
                    optContent = opt.translations['hi'];
                  }

                  const inputType = questionType === 'multiple_choice' ? 'checkbox' : 'radio';

                  const cardClass = isChecked
                    ? 'bg-blue-600/15 border-blue-500 text-white font-medium shadow-xs ring-1 ring-blue-500/50'
                    : 'bg-surface-raised border-border text-slate-200 hover:border-border/80 hover:bg-surface-raised/80';

                  const badgeClass = isChecked
                    ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                    : 'border-border text-muted bg-surface';

                  return (
                    <label
                      key={optId}
                      className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition select-none cursor-pointer active:scale-[0.99] ${cardClass} ${
                        isActionDisabled ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      <input
                        type={inputType}
                        name={`question-option-${currentIndex}`}
                        value={optId}
                        checked={isChecked}
                        disabled={isActionDisabled}
                        onChange={() => onToggleOption(optId)}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded-${questionType === 'single_choice' ? 'full' : 'md'} border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition ${badgeClass}`}
                      >
                        {optLetter}
                      </div>
                      <span className="text-xs sm:text-sm leading-relaxed pt-0.5">
                        {optContent}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Type 3: Numerical Answer */}
            {questionType === 'numerical' && (
              <div className="space-y-2 pt-1">
                <label
                  htmlFor="numerical-answer-input"
                  className="text-xs text-muted block font-medium"
                >
                  Enter the exact numerical value:
                </label>
                <input
                  id="numerical-answer-input"
                  type="text"
                  disabled={isActionDisabled}
                  value={numericalInput}
                  onChange={(e) => onNumericalChange(e.target.value)}
                  placeholder="e.g. 42 or 3.14"
                  className={`w-full bg-surface-raised border border-border rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden ${
                    isActionDisabled ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                />
                <p className="text-[11px] text-muted">
                  Official CBT numerical evaluation is applied upon submission.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official CBT Action Toolbar Footer */}
      <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          {/* Clear Response */}
          <button
            type="button"
            disabled={isActionDisabled}
            onClick={onClearResponse}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-raised border border-border text-slate-300 hover:text-white hover:bg-surface-raised/80 transition cursor-pointer flex items-center gap-1.5 ${
              isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {savingAction === 'clear' && (
              <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
            )}
            <span>Clear Response</span>
          </button>

          {/* Mark for Review & Next */}
          <button
            type="button"
            disabled={isActionDisabled}
            onClick={onMarkForReviewAndNext}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 transition cursor-pointer flex items-center gap-1.5 ${
              isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {savingAction === 'mark_review' && (
              <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            )}
            <span>Mark for Review & Next</span>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Previous Question */}
          {hasPrevious && (
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={onPrevious}
              className={`px-4 py-2 rounded-xl text-xs font-semibold bg-surface-raised border border-border text-slate-300 hover:text-white hover:bg-surface-raised/80 transition cursor-pointer ${
                isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              &larr; Previous
            </button>
          )}

          {/* Save & Next or End Test */}
          {isLastQuestion ? (
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={onOpenSubmit}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-2 ${
                isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <span>Submit Test</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={onSaveAndNext}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2 ${
                isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {savingAction === 'save_and_next' && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>
                {savingAction === 'save_and_next' ? 'Saving & Next...' : 'Save & Next \u2192'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
