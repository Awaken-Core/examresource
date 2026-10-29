import React, { useState } from 'react';
import type { QuestionDetail } from './types/cbt';
import { CBTFlagIcon } from './CBTFlagIcon';
import { CBTQuestionReportModal } from './CBTQuestionReportModal';

interface Props {
  readonly mode: 'conduct' | 'question';
  readonly currentIndex: number;
  readonly totalQuestions: number;
  readonly question: QuestionDetail | null;
  readonly language: 'English' | 'Hindi';
  readonly onLanguageChange?: (language: 'English' | 'Hindi') => void;
  readonly selectedOptionIds: readonly string[];
  readonly numericalInput: string;
  readonly isFlagged: boolean;
  readonly networkError: string | null;
  readonly isActionDisabled: boolean;
  readonly isEndOfExam: boolean;
  readonly hasPrevious: boolean;
  readonly zoom: number;
  readonly onToggleOption: (optionId: string) => void;
  readonly onNumericalChange: (value: string) => void;
  readonly onToggleFlag: () => void;
  readonly onPrevious: () => void;
  readonly onSaveAndNext: () => void;
  readonly onAgree: () => void;
  readonly onOpenInstructions: () => void;
  readonly onDismissError: () => void;
}

function typeLabel(type: string): string {
  if (type === 'numerical') return 'Numerical';
  if (type === 'multiple_choice') return 'MSQ';
  return 'MCQ';
}

function questionText(question: QuestionDetail | null, language: 'English' | 'Hindi'): string {
  if (!question) return 'The question will appear here.';
  if (language === 'Hindi' && question.translations?.hi) return question.translations.hi;
  return question.content;
}

export const CBTQuestionPanel = React.memo(function CBTQuestionPanel({
  mode,
  currentIndex,
  totalQuestions,
  question,
  language,
  onLanguageChange,
  selectedOptionIds,
  numericalInput,
  isFlagged,
  networkError,
  isActionDisabled,
  isEndOfExam,
  hasPrevious,
  zoom,
  onToggleOption,
  onNumericalChange,
  onToggleFlag,
  onPrevious,
  onSaveAndNext,
  onAgree,
  onOpenInstructions,
  onDismissError,
}: Props) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const questionType = question?.type ?? 'single_choice';
  const multiple = questionType === 'multiple_choice';
  const saveLabel = isEndOfExam ? 'Save & end' : 'Save & next';
  const questionId = question?.id || (question as any)?._id || '';

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_52px] bg-canvas">
      <div
        className="grid min-h-0 grid-cols-1 grid-rows-2 overflow-auto lg:grid-cols-2 lg:grid-rows-1"
        style={{ zoom }}
      >
        <article className="relative flex min-h-0 flex-col border-border lg:border-r">
          <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 custom-scrollbar">
            <div className="mb-3 flex h-8 items-center justify-between gap-2">
              <h2 className="truncate text-sm font-bold text-heading">
                {mode === 'conduct'
                  ? 'Code of conduct'
                  : `Question ${currentIndex + 1} of ${totalQuestions} · ${typeLabel(questionType)}`}
              </h2>

              {mode === 'question' && (
                <div className="flex shrink-0 items-center gap-2">
                  {/* Testbook/Adda247-Style In-Question Language Switcher */}
                  {onLanguageChange && (
                    <div className="inline-flex items-center rounded-lg border border-border bg-surface-raised p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => onLanguageChange('English')}
                        className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                          language === 'English'
                            ? 'bg-accent text-on-accent font-semibold shadow-xs'
                            : 'text-muted hover:text-heading'
                        }`}
                        title="Switch to English"
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => onLanguageChange('Hindi')}
                        className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                          language === 'Hindi'
                            ? 'bg-accent text-on-accent font-semibold shadow-xs'
                            : 'text-muted hover:text-heading'
                        }`}
                        title="हिंदी में देखें"
                      >
                        हिंदी
                      </button>
                    </div>
                  )}

                  <span className="font-mono text-xs whitespace-nowrap tabular-nums text-success font-semibold">
                    +{question?.marks ?? 1}
                    {(question?.negativeMarks ?? 0) > 0 ? ` / -${question?.negativeMarks}` : ''}
                  </span>

                  {/* Flag / Bookmark */}
                  <button
                    type="button"
                    disabled={isActionDisabled}
                    onClick={onToggleFlag}
                    aria-pressed={isFlagged}
                    aria-label={isFlagged ? 'Flagged' : 'Flag'}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                      isFlagged
                        ? 'border-accent bg-accent text-on-accent'
                        : 'border-border text-muted hover:border-accent hover:text-accent'
                    }`}
                  >
                    <CBTFlagIcon className="h-3.5 w-3.5" />
                    <span className="sr-only">{isFlagged ? 'Flagged' : 'Flag'}</span>
                  </button>

                  {/* Report Issue Button */}
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    title="Report question error"
                    aria-label="Report error in question"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:border-error hover:text-error transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="h-8">
              {networkError && (
                <div className="flex h-8 items-center justify-between gap-2 rounded-lg border border-error/40 bg-error/10 px-2.5 text-[11px] text-error font-medium">
                  <span className="truncate">{networkError}</span>
                  <button type="button" onClick={onDismissError} className="shrink-0 font-semibold underline">
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {mode === 'conduct' ? (
              <div className="space-y-3 text-sm leading-7 text-heading sm:text-base">
                <p className="font-semibold">General information</p>
                <p>
                  This computer-based examination keeps the question on the left and the response on
                  the right. The clock in the header is the time remaining. It does not pause while
                  you read.
                </p>
                <p>
                  Single-correct questions use a round control. Multiple-correct questions use a
                  square control. Select every option that applies. Numerical answers are typed in
                  the response panel. The scientific calculator opens from the header icon and sits
                  on the left. The question circles stay in the bottom bar.
                </p>
                <p>
                  Save & next stores the response before the next question. On the last question,
                  Save & end stores it and asks whether you are ready to end. Only the latest saved
                  response is considered. Do not wait until the clock expires.
                </p>
                <p>
                  The questions stay closed until you agree, and the paper then opens in full screen.
                  Question text cannot be selected. Leaving this window reminds you to practise in
                  good faith. The paper stays open. Pause stops the clock until you resume.
                </p>
                <button
                  type="button"
                  onClick={onOpenInstructions}
                  className="h-8 text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  Read the full instructions
                </button>
              </div>
            ) : (
              <div className="text-base leading-7 whitespace-pre-wrap text-heading sm:text-[17px]">
                {questionText(question, language)}
              </div>
            )}
          </div>
        </article>

        <section data-lenis-prevent className="min-h-0 overflow-y-auto overscroll-contain bg-surface p-4 sm:p-5 custom-scrollbar" aria-label="Options">
          <p className="mb-3 h-5 text-[11px] font-bold tracking-wider text-muted uppercase">
            {mode === 'conduct' ? 'Agreement' : multiple ? 'Select all that apply' : 'Options'}
          </p>
          {mode === 'conduct' ? (
            <button
              type="button"
              onClick={onAgree}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border px-3.5 py-2 text-left text-sm text-heading hover:border-accent transition-colors"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current">
                <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
              </span>
              <span>A. I agree</span>
            </button>
          ) : questionType === 'numerical' ? (
            <label className="block space-y-2 text-sm text-heading">
              <span className="text-xs text-muted">Enter the numerical value</span>
              <input
                id="numerical-answer-input"
                value={numericalInput}
                disabled={isActionDisabled}
                onChange={(event) => onNumericalChange(event.target.value)}
                inputMode="decimal"
                autoComplete="off"
                className="h-11 w-full select-text rounded-xl border border-border bg-canvas px-3.5 font-mono text-sm text-heading outline-none focus:border-accent"
              />
            </label>
          ) : (
            <div className="space-y-2.5">
              {(question?.options ?? []).map((option, index) => {
                const optionId = option.id || option._id || String(index);
                const checked = selectedOptionIds.includes(optionId);
                const letter = String.fromCodePoint(65 + index);
                const content =
                  language === 'Hindi' && option.translations?.hi ? option.translations.hi : option.content;
                return (
                  <label
                    key={optionId}
                    onClick={(event) => {
                      if (isActionDisabled) return;
                      event.preventDefault();
                      onToggleOption(optionId);
                    }}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
                      checked
                        ? 'border-accent bg-accent-soft text-heading shadow-2xs'
                        : 'border-border bg-surface text-heading hover:border-border/80 hover:bg-surface-raised'
                    }`}
                  >
                    <input
                      type={multiple ? 'checkbox' : 'radio'}
                      name={`question-${currentIndex}`}
                      value={optionId}
                      checked={checked}
                      disabled={isActionDisabled}
                      readOnly
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[10px] ${
                        multiple ? 'rounded-md' : 'rounded-full'
                      } ${checked ? 'border-accent bg-accent text-on-accent' : 'border-border text-muted'}`}
                    >
                      {checked ? (multiple ? '✓' : '') : ''}
                      {!multiple && checked && <span className="h-2 w-2 rounded-full bg-on-accent" />}
                    </span>
                    <span className="min-w-0 leading-6">
                      <span className="font-semibold text-heading">{letter}. </span>
                      {content}
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt=""
                          width={320}
                          height={180}
                          className="mt-2 h-auto max-h-40 w-full object-contain rounded-lg border border-border"
                        />
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="grid h-[52px] grid-cols-3 border-t border-border bg-surface">
        <button
          type="button"
          disabled={isActionDisabled || !hasPrevious || mode === 'conduct'}
          onClick={onPrevious}
          className="h-[52px] border-r border-border text-sm font-semibold text-heading disabled:opacity-40 hover:bg-surface-raised transition-colors"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={isActionDisabled || mode === 'conduct'}
          onClick={onToggleFlag}
          aria-pressed={isFlagged}
          className={`h-[52px] border-r border-border text-sm font-semibold disabled:opacity-40 hover:bg-surface-raised transition-colors ${
            isFlagged ? 'text-accent' : 'text-heading'
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <CBTFlagIcon className={`h-4 w-4 ${isFlagged ? 'text-accent' : 'text-muted'}`} />
            {isFlagged ? 'Flagged' : 'Mark for review'}
          </span>
        </button>
        <button
          type="button"
          disabled={isActionDisabled || mode === 'conduct'}
          onClick={onSaveAndNext}
          className="h-[52px] bg-accent hover:bg-accent-hover text-sm font-bold text-on-accent disabled:opacity-40 transition-colors"
        >
          {mode === 'conduct' ? 'Save & next' : saveLabel}
        </button>
      </footer>

      {/* CBT Question Report Modal */}
      <CBTQuestionReportModal
        isOpen={isReportModalOpen}
        questionId={questionId}
        questionIndex={currentIndex}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
});
