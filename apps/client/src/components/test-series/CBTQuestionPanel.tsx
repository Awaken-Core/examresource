import React from 'react';
import type { QuestionDetail } from './types/cbt';
import { CBTFlagIcon } from './CBTFlagIcon';

interface Props {
  readonly mode: 'conduct' | 'question';
  readonly currentIndex: number;
  readonly totalQuestions: number;
  readonly question: QuestionDetail | null;
  readonly language: 'English' | 'Hindi';
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
  const questionType = question?.type ?? 'single_choice';
  const multiple = questionType === 'multiple_choice';
  const saveLabel = isEndOfExam ? 'Save & end' : 'Save & next';

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_52px]">
      <div
        className="grid min-h-0 grid-cols-1 grid-rows-2 overflow-auto lg:grid-cols-2 lg:grid-rows-1"
        style={{ zoom }}
      >
        <article className="relative flex min-h-0 flex-col border-border lg:border-r">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <div className="mb-3 flex h-8 items-center justify-between gap-2">
            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {mode === 'conduct'
                ? 'Code of conduct'
                : `Question ${currentIndex + 1} of ${totalQuestions} · ${typeLabel(questionType)}`}
            </h2>
            {mode === 'question' && (
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-xs whitespace-nowrap tabular-nums text-emerald-700 dark:text-emerald-300">
                  +{question?.marks ?? 1}
                  {(question?.negativeMarks ?? 0) > 0 ? ` / -${question?.negativeMarks}` : ''}
                </span>
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={onToggleFlag}
                  aria-pressed={isFlagged}
                  aria-label={isFlagged ? 'Flagged' : 'Flag'}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                    isFlagged
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-orange-400 text-orange-600 dark:text-orange-300'
                  }`}
                >
                  <CBTFlagIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">{isFlagged ? 'Flagged' : 'Flag'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="h-8">
            {networkError && (
              <div className="flex h-8 items-center justify-between gap-2 rounded border border-rose-500/40 bg-rose-500/10 px-2 text-[11px] text-rose-700 dark:text-rose-200">
                <span className="truncate">{networkError}</span>
                <button type="button" onClick={onDismissError} className="shrink-0 font-semibold underline">
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {mode === 'conduct' ? (
            <div className="space-y-3 text-sm leading-7 text-slate-900 sm:text-base dark:text-slate-100">
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
                className="h-8 text-sm font-semibold text-accent"
              >
                Read the full instructions
              </button>
            </div>
          ) : (
            <div className="text-base leading-7 whitespace-pre-wrap text-slate-900 sm:text-[17px] dark:text-slate-100">
              {questionText(question, language)}
            </div>
          )}

          </div>
        </article>

        <section className="min-h-0 overflow-y-auto overscroll-contain bg-surface p-4 sm:p-5" aria-label="Options">
          <p className="mb-3 h-5 text-[11px] font-bold tracking-wider text-muted uppercase">
            {mode === 'conduct' ? 'Agreement' : multiple ? 'Select all that apply' : 'Options'}
          </p>
          {mode === 'conduct' ? (
            <button
              type="button"
              onClick={onAgree}
              className="flex min-h-11 w-full items-center gap-3 rounded border border-border px-3 py-2 text-left text-sm text-slate-900 hover:border-accent dark:text-slate-100"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current">
                <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
              </span>
              <span>A. I agree</span>
            </button>
          ) : questionType === 'numerical' ? (
            <label className="block space-y-2 text-sm text-slate-900 dark:text-slate-100">
              <span className="text-xs text-muted">Enter the numerical value</span>
              <input
                id="numerical-answer-input"
                value={numericalInput}
                disabled={isActionDisabled}
                onChange={(event) => onNumericalChange(event.target.value)}
                inputMode="decimal"
                autoComplete="off"
                className="h-11 w-full select-text rounded border border-border bg-canvas px-3 font-mono text-sm text-slate-900 outline-none focus:border-accent dark:text-slate-100"
              />
            </label>
          ) : (
            <div className="space-y-2">
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
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? 'border-accent bg-accent/10 text-slate-900 dark:text-slate-100'
                        : 'border-border text-slate-900 dark:text-slate-100'
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
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-current text-[10px] ${
                        multiple ? 'rounded-sm' : 'rounded-full'
                      } ${checked ? 'bg-accent text-on-accent' : ''}`}
                    >
                      {checked ? (multiple ? '✓' : '') : ''}
                      {!multiple && checked && <span className="h-2.5 w-2.5 rounded-full bg-on-accent" />}
                    </span>
                    <span className="min-w-0 leading-6">
                      <span className="font-semibold">{letter}. </span>
                      {content}
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt=""
                          width={320}
                          height={180}
                          className="mt-2 h-auto max-h-40 w-full object-contain"
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

      <footer className="grid h-[52px] grid-cols-3 border-t border-border">
        <button
          type="button"
          disabled={isActionDisabled || !hasPrevious || mode === 'conduct'}
          onClick={onPrevious}
          className="h-[52px] border-r border-border text-sm font-semibold text-slate-900 disabled:opacity-40 dark:text-slate-100"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={isActionDisabled || mode === 'conduct'}
          onClick={onToggleFlag}
          aria-pressed={isFlagged}
          className={`h-[52px] border-r border-border text-sm font-semibold disabled:opacity-40 ${
            isFlagged ? 'text-orange-600 dark:text-orange-300' : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <CBTFlagIcon className="h-4 w-4 text-orange-500" />
            {isFlagged ? 'Flagged' : 'Mark for review'}
          </span>
        </button>
        <button
          type="button"
          disabled={isActionDisabled || mode === 'conduct'}
          onClick={onSaveAndNext}
          className="h-[52px] bg-accent text-sm font-bold text-on-accent disabled:opacity-40"
        >
          {mode === 'conduct' ? 'Save & next' : saveLabel}
        </button>
      </footer>
    </div>
  );
});
