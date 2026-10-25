import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { QuestionPaletteStatus, PaletteSummaryCounts } from './types/cbt';
import { useCBTAttempt } from './hooks/useCBTAttempt';
import { useProctoringMonitor } from './hooks/useProctoringMonitor';
import { CBTHeader } from './CBTHeader';
import { CBTQuestionPanel } from './CBTQuestionPanel';
import { CBTPalette } from './CBTPalette';
import { CBTCodeOfConductModal } from './CBTCodeOfConductModal';
import { CBTSubmitModal } from './CBTSubmitModal';
import { CBTKeyboardShortcutsModal } from './CBTKeyboardShortcutsModal';

interface Props {
  readonly attemptId: string;
}

export function CBTTestRunner({ attemptId }: Props) {
  const {
    attempt,
    testMeta,
    loading,
    fatalError,
    remainingSeconds,
    activeSectionId,
    setActiveSectionId,
    isSaving,
    savingAction,
    setSavingAction,
    networkError,
    setNetworkError,
    submitting,
    submitError,
    setSubmitError,
    saveAnswerState,
    handleClearResponse,
    saveSectionTime,
    handleFinalSubmit,
    calculateQuestionElapsedSeconds,
  } = useCBTAttempt({ attemptId });

  const proctoring = useProctoringMonitor();

  // Active question index & language
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');

  // Input states for the active question
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [numericalInput, setNumericalInput] = useState<string>('');

  // Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showConductModal, setShowConductModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const answersList = useMemo(() => attempt?.answers ?? [], [attempt?.answers]);
  const activeAnswer = answersList[currentIndex] ?? null;
  const currentQ = activeAnswer?.question ?? null;

  // Sync inputs when active question changes
  useEffect(() => {
    if (!activeAnswer) return;
    setSelectedOptionIds(Array.from(activeAnswer.optionIds ?? []));
    setNumericalInput(activeAnswer.numericalValue ?? '');
    setNetworkError(null);

    if (activeAnswer.sectionId && activeAnswer.sectionId !== activeSectionId) {
      setActiveSectionId(activeAnswer.sectionId);
    }

    if (activeAnswer.status === 'not_visited') {
      void saveAnswerState(currentIndex, {
        status: 'not_answered',
        optionIds: [],
        numericalValue: null,
      });
    }
  }, [currentIndex, activeAnswer?.questionId]);

  // Navigate to Question
  const navigateToQuestion = useCallback(
    async (nextIndex: number) => {
      if (
        !attempt ||
        nextIndex === currentIndex ||
        nextIndex < 0 ||
        nextIndex >= answersList.length
      ) {
        return;
      }
      const current = answersList[currentIndex];
      const next = answersList[nextIndex];
      if (!current || !next) return;

      if (current.sectionId !== next.sectionId && !(await saveSectionTime(current.sectionId))) {
        setNetworkError('Could not save section time. Please retry.');
        return;
      }

      const saved = await saveAnswerState(currentIndex, {
        status: current.status,
        timeSpentSeconds: calculateQuestionElapsedSeconds(currentIndex),
      });
      if (saved) setCurrentIndex(nextIndex);
    },
    [
      attempt,
      currentIndex,
      answersList,
      saveSectionTime,
      saveAnswerState,
      calculateQuestionElapsedSeconds,
      setNetworkError,
    ],
  );

  // Filter questions for active section if full test
  const isFullTest = (attempt?.sectionProgress?.length ?? 0) > 0;
  const currentSectionIndices = useMemo(() => {
    if (isFullTest && activeSectionId) {
      return answersList
        .map((a, idx) => (a.sectionId === activeSectionId ? idx : -1))
        .filter((idx) => idx !== -1);
    }
    return answersList.map((_, idx) => idx);
  }, [isFullTest, activeSectionId, answersList]);

  const currentPosInSection = currentSectionIndices.indexOf(currentIndex);
  let nextIndexInSection = -1;
  if (currentPosInSection !== -1 && currentPosInSection < currentSectionIndices.length - 1) {
    nextIndexInSection = currentSectionIndices[currentPosInSection + 1] ?? -1;
  } else if (currentIndex < answersList.length - 1) {
    nextIndexInSection = currentIndex + 1;
  }

  let prevIndexInSection = -1;
  if (currentPosInSection > 0) {
    prevIndexInSection = currentSectionIndices[currentPosInSection - 1] ?? -1;
  } else if (currentIndex > 0) {
    prevIndexInSection = currentIndex - 1;
  }

  const isLastQuestion =
    currentSectionIndices.length > 0
      ? currentIndex === currentSectionIndices.at(-1)
      : currentIndex >= answersList.length - 1;

  // Toggle Option Selection
  const handleToggleOption = useCallback(
    (optionId: string) => {
      const qType = currentQ?.type ?? 'single_choice';
      if (qType === 'single_choice') {
        setSelectedOptionIds([optionId]);
      } else {
        setSelectedOptionIds((prev) =>
          prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
        );
      }
    },
    [currentQ?.type],
  );

  // Clear current response
  const onClear = useCallback(async () => {
    const cleared = await handleClearResponse(currentIndex);
    if (cleared) {
      setSelectedOptionIds([]);
      setNumericalInput('');
    }
  }, [handleClearResponse, currentIndex]);

  // Save & Next
  const handleSaveAndNext = useCallback(async () => {
    if (!attempt || !activeAnswer || isSaving || submitting) return;
    setSavingAction('save_and_next');

    const hasSelection = selectedOptionIds.length > 0 || numericalInput.trim() !== '';
    const newStatus: QuestionPaletteStatus = hasSelection ? 'answered' : 'not_answered';

    const saved = await saveAnswerState(currentIndex, {
      status: newStatus,
      optionIds: selectedOptionIds,
      numericalValue: numericalInput.trim() || null,
      timeSpentSeconds: calculateQuestionElapsedSeconds(currentIndex),
    });

    setSavingAction(null);
    if (saved && nextIndexInSection !== -1) {
      setCurrentIndex(nextIndexInSection);
    }
  }, [
    attempt,
    activeAnswer,
    isSaving,
    submitting,
    selectedOptionIds,
    numericalInput,
    saveAnswerState,
    currentIndex,
    calculateQuestionElapsedSeconds,
    setSavingAction,
    nextIndexInSection,
  ]);

  // Mark for Review & Next
  const handleMarkForReviewAndNext = useCallback(async () => {
    if (!attempt || !activeAnswer || isSaving || submitting) return;
    setSavingAction('mark_review');

    const hasSelection = selectedOptionIds.length > 0 || numericalInput.trim() !== '';
    const newStatus: QuestionPaletteStatus = hasSelection
      ? 'answered_and_marked_for_review'
      : 'marked_for_review';

    const saved = await saveAnswerState(currentIndex, {
      status: newStatus,
      optionIds: selectedOptionIds,
      numericalValue: numericalInput.trim() || null,
      timeSpentSeconds: calculateQuestionElapsedSeconds(currentIndex),
    });

    setSavingAction(null);
    if (saved && nextIndexInSection !== -1) {
      setCurrentIndex(nextIndexInSection);
    }
  }, [
    attempt,
    activeAnswer,
    isSaving,
    submitting,
    selectedOptionIds,
    numericalInput,
    saveAnswerState,
    currentIndex,
    calculateQuestionElapsedSeconds,
    setSavingAction,
    nextIndexInSection,
  ]);

  // Toggle Flag on Question Header
  const handleToggleFlag = useCallback(async () => {
    if (!attempt || !activeAnswer || isSaving || submitting) return;
    const isCurrentlyFlagged =
      activeAnswer.status === 'marked_for_review' ||
      activeAnswer.status === 'answered_and_marked_for_review';
    const hasSelection = selectedOptionIds.length > 0 || numericalInput.trim() !== '';

    let nextStatus: QuestionPaletteStatus;
    if (isCurrentlyFlagged) {
      nextStatus = hasSelection ? 'answered' : 'not_answered';
    } else {
      nextStatus = hasSelection ? 'answered_and_marked_for_review' : 'marked_for_review';
    }

    await saveAnswerState(currentIndex, {
      status: nextStatus,
      optionIds: selectedOptionIds,
      numericalValue: numericalInput.trim() || null,
      timeSpentSeconds: calculateQuestionElapsedSeconds(currentIndex),
    });
  }, [
    attempt,
    activeAnswer,
    isSaving,
    submitting,
    selectedOptionIds,
    numericalInput,
    saveAnswerState,
    currentIndex,
    calculateQuestionElapsedSeconds,
  ]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focused inside a text input or modal is open
      const target = e.target as HTMLElement;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        showSubmitModal ||
        showConductModal ||
        showShortcutsModal
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        void handleSaveAndNext();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (prevIndexInSection !== -1) {
          void navigateToQuestion(prevIndexInSection);
        }
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        void onClear();
      } else if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        void handleToggleFlag();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const optIdx = Number.parseInt(e.key, 10) - 1;
        const opt = currentQ?.options?.[optIdx];
        if (opt) {
          e.preventDefault();
          handleToggleOption(opt.id || opt._id || String(optIdx));
        }
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const optIdx = (e.key.toLowerCase().codePointAt(0) ?? 97) - 97;
        const opt = currentQ?.options?.[optIdx];
        if (opt) {
          e.preventDefault();
          handleToggleOption(opt.id || opt._id || String(optIdx));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleSaveAndNext,
    prevIndexInSection,
    navigateToQuestion,
    onClear,
    handleToggleFlag,
    currentQ?.options,
    handleToggleOption,
    showSubmitModal,
    showConductModal,
    showShortcutsModal,
  ]);

  const summaryCounts: PaletteSummaryCounts = useMemo(
    () => ({
      answered: answersList.filter((a) => a.status === 'answered').length,
      not_answered: answersList.filter((a) => a.status === 'not_answered').length,
      marked_for_review: answersList.filter((a) => a.status === 'marked_for_review').length,
      answered_and_marked: answersList.filter((a) => a.status === 'answered_and_marked_for_review')
        .length,
      not_visited: answersList.filter((a) => a.status === 'not_visited').length,
    }),
    [answersList],
  );

  const isActionDisabled = isSaving || submitting;
  const isFlagged =
    activeAnswer?.status === 'marked_for_review' ||
    activeAnswer?.status === 'answered_and_marked_for_review';

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-muted">
          Securing CBT candidate session and loading official questions...
        </p>
      </div>
    );
  }

  if (fatalError || !attempt) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center max-w-lg mx-auto space-y-3 my-12">
        <p className="text-sm font-semibold text-rose-200">
          {fatalError ?? 'Attempt not found or expired.'}
        </p>
        <a
          href="/test-series"
          className="inline-block text-xs font-semibold text-blue-500 hover:underline"
        >
          &larr; Return to Test Series
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <CBTHeader
        testTitle={testMeta?.title ?? 'GovtPariksha Computer-Based Test'}
        attemptNumber={attempt.attemptNumber}
        language={language}
        remainingSeconds={remainingSeconds}
        isActionDisabled={isActionDisabled}
        proctoring={proctoring}
        onLanguageChange={setLanguage}
        onOpenInstructions={() => setShowConductModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onOpenSubmit={() => {
          setSubmitError(null);
          setShowSubmitModal(true);
        }}
      />

      {/* Section Tabs for Full Tests */}
      {isFullTest && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted shrink-0 mr-1">
            Sections:
          </span>
          {attempt.sectionProgress.map((sec, idx) => {
            const isSelected =
              (activeSectionId || attempt.sectionProgress[0].sectionId) === sec.sectionId;
            return (
              <button
                key={sec.sectionId}
                type="button"
                disabled={isActionDisabled}
                onClick={() => {
                  const targetIdx = answersList.findIndex((a) => a.sectionId === sec.sectionId);
                  if (targetIdx !== -1) void navigateToQuestion(targetIdx);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-surface border border-border text-muted hover:text-white'
                } ${isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span>{sec.name || `Section ${idx + 1}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main CBT Grid: Left Question Panel, Right Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        <div className="lg:col-span-3">
          <CBTQuestionPanel
            currentIndex={currentIndex}
            totalQuestions={answersList.length}
            question={currentQ}
            language={language}
            selectedOptionIds={selectedOptionIds}
            numericalInput={numericalInput}
            isFlagged={isFlagged}
            isSaving={isSaving}
            savingAction={savingAction}
            networkError={networkError}
            isActionDisabled={isActionDisabled}
            isLastQuestion={isLastQuestion}
            hasPrevious={currentIndex > 0}
            onToggleOption={handleToggleOption}
            onNumericalChange={setNumericalInput}
            onToggleFlag={() => void handleToggleFlag()}
            onClearResponse={() => void onClear()}
            onMarkForReviewAndNext={() => void handleMarkForReviewAndNext()}
            onPrevious={() => {
              if (prevIndexInSection !== -1) {
                void navigateToQuestion(prevIndexInSection);
              } else if (currentIndex > 0) {
                void navigateToQuestion(currentIndex - 1);
              }
            }}
            onSaveAndNext={() => void handleSaveAndNext()}
            onOpenSubmit={() => {
              setSubmitError(null);
              setShowSubmitModal(true);
            }}
            onDismissError={() => setNetworkError(null)}
          />
        </div>

        <div className="lg:col-span-1">
          <CBTPalette
            answers={answersList}
            currentIndex={currentIndex}
            isActionDisabled={isActionDisabled}
            summaryCounts={summaryCounts}
            onSelectQuestion={(idx) => void navigateToQuestion(idx)}
          />
        </div>
      </div>

      {/* Official Modals */}
      <CBTCodeOfConductModal
        isOpen={showConductModal}
        onClose={() => setShowConductModal(false)}
        testTitle={testMeta?.title ?? 'Computer Based Examination'}
        positiveMarks={currentQ?.marks ?? 1}
        negativeMarks={currentQ?.negativeMarks ?? 0}
      />

      <CBTSubmitModal
        isOpen={showSubmitModal}
        submitting={submitting}
        submitError={submitError}
        summaryCounts={summaryCounts}
        totalQuestions={answersList.length}
        onClose={() => {
          setSubmitError(null);
          setShowSubmitModal(false);
        }}
        onConfirmSubmit={() => void handleFinalSubmit(false)}
      />

      <CBTKeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
