import React from 'react';
import type { AttemptAnswer } from './types/cbt';
import { CBTStatusShape } from './CBTStatusShape';

interface Props {
  readonly isOpen: boolean;
  readonly testTitle: string;
  readonly answers: readonly AttemptAnswer[];
  readonly currentIndex: number;
  readonly language: 'English' | 'Hindi';
  readonly onClose: () => void;
  readonly onSelectQuestion: (index: number) => void;
}

export function CBTQuestionPaperModal({
  isOpen,
  testTitle,
  answers,
  currentIndex,
  language,
  onClose,
  onSelectQuestion,
}: Props) {
  if (!isOpen) return null;

  return (
    <dialog
      open
      aria-labelledby="question-paper-title"
      className="fixed inset-0 z-[10070] flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-black/75 p-3 backdrop-blur-xs sm:p-6"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h2 id="question-paper-title" className="truncate text-base font-bold text-heading">
              Question Paper &bull; {testTitle}
            </h2>
            <p className="text-xs text-muted">
              Review all questions at a glance. Click any question number to jump directly to it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close question paper"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised text-muted hover:text-heading"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content list */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar space-y-6">
          {answers.map((answer, index) => {
            const q = answer.question;
            const isCurrent = index === currentIndex;
            const qContent =
              language === 'Hindi' && q?.translations?.hi ? q.translations.hi : q?.content;

            return (
              <div
                key={answer.questionId || index}
                className={`rounded-xl border p-4 transition-colors ${
                  isCurrent
                    ? 'border-accent bg-accent/5'
                    : 'border-border/80 bg-surface-raised/30 hover:border-border'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectQuestion(index);
                        onClose();
                      }}
                      className="cursor-pointer"
                      title="Jump to this question"
                    >
                      <CBTStatusShape
                        status={answer.status}
                        number={index + 1}
                        size="md"
                        isCurrent={isCurrent}
                      />
                    </button>
                    <span className="text-xs font-bold text-heading">
                      Question {index + 1}
                    </span>
                    {answer.sectionId && (
                      <span className="text-[10px] uppercase font-semibold text-muted bg-surface-raised px-2 py-0.5 rounded border border-border">
                        {answer.sectionId}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectQuestion(index);
                      onClose();
                    }}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Go to Question &rarr;
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-heading leading-relaxed mb-3 whitespace-pre-wrap">
                  {qContent || 'Question content unavailable.'}
                </div>

                {q?.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const optText =
                        language === 'Hindi' && opt.translations?.hi
                          ? opt.translations.hi
                          : opt.content;
                      const isSelected = answer.optionIds.includes(opt.id || (opt as any)._id);

                      return (
                        <div
                          key={opt.id || optIdx}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
                            isSelected
                              ? 'border-accent/40 bg-accent/10 font-semibold text-heading'
                              : 'border-border/60 bg-surface text-muted'
                          }`}
                        >
                          <span className="font-bold text-heading">{letter}.</span>
                          <span className="leading-snug">{optText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6">
          <span className="text-xs text-muted">
            Total {answers.length} questions
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface-raised border border-border px-4 py-2 text-xs font-semibold text-heading hover:bg-border/60"
          >
            Close Question Paper
          </button>
        </div>
      </div>
    </dialog>
  );
}

