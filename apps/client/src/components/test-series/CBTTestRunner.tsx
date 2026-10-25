import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { API_URL } from '../../lib/api';
import type { AttemptAnswer, QuestionPaletteStatus, PaletteSummaryCounts } from './types/cbt';
import { useCBTAttempt } from './hooks/useCBTAttempt';
import { useProctoringMonitor } from './hooks/useProctoringMonitor';
import { CBTHeader } from './CBTHeader';
import { CBTQuestionPanel } from './CBTQuestionPanel';
import { CBTPalette } from './CBTPalette';
import { CBTOutline } from './CBTOutline';
import { CBTLegend } from './CBTLegend';
import { CBTCodeOfConductModal } from './CBTCodeOfConductModal';
import { CBTSubmitModal } from './CBTSubmitModal';
import { CBTKeyboardShortcutsModal } from './CBTKeyboardShortcutsModal';
import { CBTCalculator } from './CBTCalculator';

interface Props {
  readonly attemptId: string;
  readonly siteName: string;
}

function responseStatus(
  current: QuestionPaletteStatus | undefined,
  hasSelection: boolean,
): QuestionPaletteStatus {
  const flagged =
    current === 'marked_for_review' || current === 'answered_and_marked_for_review';
  if (flagged) return hasSelection ? 'answered_and_marked_for_review' : 'marked_for_review';
  return hasSelection ? 'answered' : 'not_answered';
}

function readConduct(attemptId: string): boolean {
  try {
    return sessionStorage.getItem(`cbt-conduct:${attemptId}`) === '1';
  } catch {
    return false;
  }
}

export function CBTTestRunner({ attemptId, siteName }: Props) {
  const {
    attempt,
    testMeta,
    loading,
    fatalError,
    remainingSeconds,
    paused,
    pauseTest,
    resumeTest,
    activeSectionId,
    setActiveSectionId,
    networkError,
    setNetworkError,
    submitting,
    submitError,
    setSubmitError,
    setAttempt,
    saveAnswerState,
    handleClearResponse,
    saveSectionTime,
    handleFinalSubmit,
    calculateQuestionElapsedSeconds,
  } = useCBTAttempt({ attemptId });

  const shellRef = useRef<HTMLDivElement>(null);
  const [integrityWarning, setIntegrityWarning] = useState(false);

  const [conductAgreed, setConductAgreed] = useState(() => readConduct(attemptId));
  const [view, setView] = useState<'conduct' | 'questions'>(() =>
    readConduct(attemptId) ? 'questions' : 'conduct',
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
  const [candidateName, setCandidateName] = useState('Candidate');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showConductModal, setShowConductModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [fullscreen, setFullscreen] = useState(false);

  const setPageFullscreen = useCallback((enabled: boolean) => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
      mozCancelFullScreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
    };
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      mozRequestFullScreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    const active =
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement;

    (window as Window & { __cbtFullscreenUntil?: number }).__cbtFullscreenUntil = Date.now() + 1500;

    if (enabled && active) return;
    if (!enabled && !active) return;

    if (!enabled) {
      try {
        if (document.exitFullscreen) {
          void document.exitFullscreen().catch(() => undefined);
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
      } catch {
        /* Storage or fullscreen exit error ignored */
      }
      return;
    }

    try {
      const p =
        root.requestFullscreen?.() ??
        root.webkitRequestFullscreen?.() ??
        root.mozRequestFullScreen?.() ??
        root.msRequestFullscreen?.();
      if (p && typeof (p as Promise<void>).catch === 'function') {
        (p as Promise<void>).catch((err: unknown) => {
          console.warn('Fullscreen request failed:', err);
        });
      }
    } catch (err) {
      console.warn('Fullscreen request threw:', err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };
    const isFs = Boolean(
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    setPageFullscreen(!isFs);
  }, [setPageFullscreen]);

  useProctoringMonitor(
    conductAgreed && view === 'questions' && attempt?.status === 'in_progress' && !integrityWarning,
    () => setIntegrityWarning(true),
  );

  useEffect(() => {
    if (!conductAgreed || view !== 'questions') return;
    const node = shellRef.current;
    if (!node) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-fullscreen-toggle]')) return;
      setPageFullscreen(true);
    };
    node.addEventListener('pointerdown', onPointer);
    return () => node.removeEventListener('pointerdown', onPointer);
  }, [conductAgreed, view, setPageFullscreen]);

  useEffect(() => {
    const sync = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };
      setFullscreen(
        Boolean(
          document.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    sync();

    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    document.addEventListener('mozfullscreenchange', sync);
    document.addEventListener('MSFullscreenChange', sync);
    window.addEventListener('resize', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      document.removeEventListener('mozfullscreenchange', sync);
      document.removeEventListener('MSFullscreenChange', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

  const answersList = useMemo(() => attempt?.answers ?? [], [attempt?.answers]);
  const activeAnswer = answersList[currentIndex] ?? null;
  const draftKey = `${currentIndex}:${activeAnswer?.questionId ?? ''}`;
  const [draft, setDraft] = useState({ key: '', optionIds: [] as string[], numerical: '' });
  if (attempt && draft.key !== draftKey) {
    setDraft({
      key: draftKey,
      optionIds: Array.from(activeAnswer?.optionIds ?? []),
      numerical: activeAnswer?.numericalValue ?? '',
    });
  }
  const selectedOptionIds = draft.key === draftKey ? draft.optionIds : Array.from(activeAnswer?.optionIds ?? []);
  const numericalInput = draft.key === draftKey ? draft.numerical : (activeAnswer?.numericalValue ?? '');

  useEffect(() => {
    const html = document.documentElement;
    const previousHtml = html.style.overflow;
    const previousBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, []);

  useEffect(() => {
    const blockSelect = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea')) return;
      event.preventDefault();
    };
    document.addEventListener('selectstart', blockSelect);
    return () => document.removeEventListener('selectstart', blockSelect);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${API_URL}/me`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((user: { name?: string } | null) => {
        if (cancelled || !user?.name?.trim()) return;
        setCandidateName(user.name.trim());
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const patchAnswer = useCallback(
    (index: number, questionId: string, patch: Partial<AttemptAnswer>) => {
      setAttempt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: prev.answers.map((answer, answerIndex) =>
            answerIndex === index && answer.questionId === questionId
              ? { ...answer, ...patch }
              : answer,
          ),
        };
      });
    },
    [setAttempt],
  );

  useEffect(() => {
    if (!conductAgreed || view !== 'questions' || !activeAnswer) return;
    if (activeAnswer.sectionId && activeAnswer.sectionId !== activeSectionId) {
      setActiveSectionId(activeAnswer.sectionId);
    }
    if (activeAnswer.status !== 'not_visited') return;
    patchAnswer(currentIndex, activeAnswer.questionId, { status: 'not_answered' });
  }, [currentIndex, activeAnswer?.questionId, conductAgreed, view]);

  useEffect(() => {
    if (!conductAgreed || !attempt || attempt.status !== 'in_progress') return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [conductAgreed, attempt]);

  const navigateToQuestion = useCallback(
    (nextIndex: number) => {
      if (!conductAgreed || !attempt || nextIndex === currentIndex || nextIndex < 0 || nextIndex >= answersList.length) {
        return;
      }
      const current = answersList[currentIndex];
      const next = answersList[nextIndex];
      if (!current || !next) return;
      if (current.sectionId !== next.sectionId) void saveSectionTime(current.sectionId);
      const hasSelection = selectedOptionIds.length > 0 || numericalInput.trim() !== '';
      const status = responseStatus(current.status, hasSelection);
      patchAnswer(currentIndex, current.questionId, {
        status,
        optionIds: selectedOptionIds,
        numericalValue: numericalInput.trim() || null,
      });
      void saveAnswerState(currentIndex, {
        status,
        optionIds: selectedOptionIds,
        numericalValue: numericalInput.trim() || null,
        timeSpentSeconds: calculateQuestionElapsedSeconds(currentIndex),
        background: true,
      });
      setView('questions');
      setCurrentIndex(nextIndex);
    },
    [
      conductAgreed,
      attempt,
      currentIndex,
      answersList,
      selectedOptionIds,
      numericalInput,
      saveSectionTime,
      saveAnswerState,
      calculateQuestionElapsedSeconds,
      patchAnswer,
    ],
  );

  const currentSectionIndices = useMemo(() => {
    if ((attempt?.sectionProgress?.length ?? 0) > 0 && activeSectionId) {
      return answersList
        .map((answer, index) => (answer.sectionId === activeSectionId ? index : -1))
        .filter((index) => index !== -1);
    }
    return answersList.map((_, index) => index);
  }, [attempt?.sectionProgress, activeSectionId, answersList]);

  const currentPosInSection = currentSectionIndices.indexOf(currentIndex);
  let nextIndex = -1;
  if (currentPosInSection !== -1 && currentPosInSection < currentSectionIndices.length - 1) {
    nextIndex = currentSectionIndices[currentPosInSection + 1] ?? -1;
  } else if (currentIndex < answersList.length - 1) {
    nextIndex = currentIndex + 1;
  }
  let prevIndex = -1;
  if (currentPosInSection > 0) {
    prevIndex = currentSectionIndices[currentPosInSection - 1] ?? -1;
  } else if (currentIndex > 0) {
    prevIndex = currentIndex - 1;
  }
  const isEndOfExam = answersList.length > 0 && currentIndex === answersList.length - 1;

  const handleToggleOption = useCallback(
    (optionId: string) => {
      if (!conductAgreed || view !== 'questions') return;
      const qType = activeAnswer?.question?.type ?? 'single_choice';
      setDraft((prev) => {
        const base = prev.key === draftKey ? prev.optionIds : selectedOptionIds;
        const optionIds =
          qType === 'single_choice'
            ? base.includes(optionId)
              ? []
              : [optionId]
            : base.includes(optionId)
              ? base.filter((id) => id !== optionId)
              : [...base, optionId];
        return {
          key: draftKey,
          optionIds,
          numerical: prev.key === draftKey ? prev.numerical : numericalInput,
        };
      });
    },
    [conductAgreed, view, activeAnswer?.question?.type, draftKey, selectedOptionIds, numericalInput],
  );

  const onNumericalChange = useCallback(
    (value: string) => {
      setDraft((prev) => ({
        key: draftKey,
        optionIds: prev.key === draftKey ? prev.optionIds : selectedOptionIds,
        numerical: value,
      }));
    },
    [draftKey, selectedOptionIds],
  );

  const onClear = useCallback(() => {
    if (!conductAgreed || !activeAnswer) return;
    setDraft({ key: draftKey, optionIds: [], numerical: '' });
    patchAnswer(currentIndex, activeAnswer.questionId, {
      status: 'not_answered',
      optionIds: [],
      numericalValue: null,
    });
    void handleClearResponse(currentIndex);
  }, [conductAgreed, activeAnswer, handleClearResponse, currentIndex, draftKey, patchAnswer]);

  const persistCurrent = useCallback(
    (status: QuestionPaletteStatus) => {
      if (!attempt || !activeAnswer || submitting || !conductAgreed) return;
      patchAnswer(currentIndex, activeAnswer.questionId, {
        status,
        optionIds: selectedOptionIds,
        numericalValue: numericalInput.trim() || null,
      });
      void saveAnswerState(currentIndex, {
        status,
        optionIds: selectedOptionIds,
        numericalValue: numericalInput.trim() || null,
        timeSpentSeconds: calculateQuestionElapsedSeconds(currentIndex),
        background: true,
      });
    },
    [
      attempt,
      activeAnswer,
      submitting,
      conductAgreed,
      saveAnswerState,
      currentIndex,
      selectedOptionIds,
      numericalInput,
      calculateQuestionElapsedSeconds,
      patchAnswer,
    ],
  );

  const handleSaveAndNext = useCallback(() => {
    const hasSelection = selectedOptionIds.length > 0 || numericalInput.trim() !== '';
    persistCurrent(responseStatus(activeAnswer?.status, hasSelection));
    if (isEndOfExam) {
      setSubmitError(null);
      setShowSubmitModal(true);
      return;
    }
    if (nextIndex !== -1) setCurrentIndex(nextIndex);
  }, [selectedOptionIds, numericalInput, persistCurrent, activeAnswer?.status, isEndOfExam, setSubmitError, nextIndex]);

  const handleToggleFlag = useCallback(() => {
    const flagged =
      activeAnswer?.status === 'marked_for_review' ||
      activeAnswer?.status === 'answered_and_marked_for_review';
    const hasSelection = selectedOptionIds.length > 0 || numericalInput.trim() !== '';
    let nextStatus: QuestionPaletteStatus;
    if (flagged) nextStatus = hasSelection ? 'answered' : 'not_answered';
    else nextStatus = hasSelection ? 'answered_and_marked_for_review' : 'marked_for_review';
    persistCurrent(nextStatus);
  }, [activeAnswer?.status, selectedOptionIds, numericalInput, persistCurrent]);

  const openEndDialog = useCallback(() => {
    if (!conductAgreed) return;
    const hasSelection = selectedOptionIds.length > 0 || numericalInput.trim() !== '';
    persistCurrent(responseStatus(activeAnswer?.status, hasSelection));
    setSubmitError(null);
    setShowSubmitModal(true);
  }, [conductAgreed, selectedOptionIds, numericalInput, activeAnswer?.status, persistCurrent, setSubmitError]);

  const agreeToConduct = useCallback(() => {
    try {
      sessionStorage.setItem(`cbt-conduct:${attemptId}`, '1');
    } catch {
      /* Storage can be unavailable. Agreement still applies for this view. */
    }
    setPageFullscreen(true);
    setConductAgreed(true);
    setView('questions');
  }, [attemptId, setPageFullscreen]);

  const openQuestion = useCallback(
    (index: number) => {
      if (!conductAgreed) return;
      setView('questions');
      if (index !== currentIndex) void navigateToQuestion(index);
    },
    [conductAgreed, currentIndex, navigateToQuestion],
  );

  const openSection = useCallback(
    (sectionId: string | null) => {
      if (!conductAgreed) return;
      const target = sectionId
        ? answersList.findIndex((answer) => answer.sectionId === sectionId)
        : 0;
      openQuestion(target === -1 ? 0 : target);
    },
    [conductAgreed, answersList, openQuestion],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F11' || event.code === 'F11') {
        event.preventDefault();
        toggleFullscreen();
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if (event.key === 'Escape') {
        if (conductAgreed && view === 'questions') return;
        if (calculatorOpen) setCalculatorOpen(false);
        else if (showSubmitModal) setShowSubmitModal(false);
        else if (showShortcutsModal) setShowShortcutsModal(false);
        else if (showConductModal) setShowConductModal(false);
        return;
      }
      if (calculatorOpen || showSubmitModal || showConductModal || showShortcutsModal) return;
      if (!conductAgreed || view !== 'questions') {
        if (event.key === 'Enter' || event.key.toLowerCase() === 'a') {
          event.preventDefault();
          agreeToConduct();
        }
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (event.key === '?' ) {
        event.preventDefault();
        setShowShortcutsModal((open) => !open);
        return;
      }
      if (event.key === 'ArrowRight' || key === 'n' || event.key === 'Enter') {
        event.preventDefault();
        void handleSaveAndNext();
      } else if ((event.key === 'ArrowLeft' || key === 'p') && prevIndex !== -1) {
        event.preventDefault();
        void navigateToQuestion(prevIndex);
      } else if (key === 'c') {
        event.preventDefault();
        void onClear();
      } else if (key === 'f' || key === 'm') {
        event.preventDefault();
        void handleToggleFlag();
      } else if (activeAnswer?.question?.type !== 'numerical') {
        let optionIndex = -1;
        if (['1', '2', '3', '4'].includes(event.key)) optionIndex = Number.parseInt(event.key, 10) - 1;
        if (['a', 'b', 'c', 'd'].includes(key)) optionIndex = key.codePointAt(0)! - 97;
        const option = activeAnswer?.question?.options?.[optionIndex];
        if (option && optionIndex >= 0) {
          event.preventDefault();
          handleToggleOption(option.id || option._id || String(optionIndex));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    showSubmitModal,
    showConductModal,
    showShortcutsModal,
    calculatorOpen,
    conductAgreed,
    view,
    agreeToConduct,
    handleSaveAndNext,
    prevIndex,
    navigateToQuestion,
    onClear,
    handleToggleFlag,
    activeAnswer?.question,
    handleToggleOption,
    toggleFullscreen,
  ]);

  const summaryCounts: PaletteSummaryCounts = useMemo(
    () => ({
      answered: answersList.filter((answer) => answer.status === 'answered').length,
      not_answered: answersList.filter((answer) => answer.status === 'not_answered').length,
      marked_for_review: answersList.filter((answer) => answer.status === 'marked_for_review').length,
      answered_and_marked: answersList.filter((answer) => answer.status === 'answered_and_marked_for_review').length,
      not_visited: answersList.filter((answer) => answer.status === 'not_visited').length,
    }),
    [answersList],
  );

  const isFlagged =
    activeAnswer?.status === 'marked_for_review' ||
    activeAnswer?.status === 'answered_and_marked_for_review';
  const actionsDisabled = submitting;
  const viewingConduct = view === 'conduct' || !conductAgreed;

  return (
    <div ref={shellRef} className="fixed inset-0 z-[10050] flex flex-col overflow-hidden bg-canvas text-slate-900 select-none dark:text-slate-100">
      <CBTHeader
        portalName={siteName}
        testTitle={loading ? 'Loading examination' : (testMeta?.title ?? 'Computer-based test')}
        candidateName={candidateName}
        language={language}
        remainingSeconds={remainingSeconds}
        onLanguageChange={setLanguage}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        calculatorOpen={calculatorOpen}
        onToggleCalculator={() => setCalculatorOpen((open) => !open)}
        zoom={zoom}
        onZoomIn={() =>
          setZoom((current) => {
            const steps = [0.8, 0.9, 1, 1.1, 1.25, 1.5];
            const index = steps.findIndex((step) => step > current + 0.001);
            return index === -1 ? current : steps[index];
          })
        }
        onZoomOut={() =>
          setZoom((current) => {
            const steps = [0.8, 0.9, 1, 1.1, 1.25, 1.5];
            const smaller = steps.filter((step) => step < current - 0.001);
            return smaller.length === 0 ? current : smaller[smaller.length - 1];
          })
        }
        canPause={!viewingConduct && !paused && !submitting && !integrityWarning}
        onPause={() => void pauseTest()}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
      {calculatorOpen && (
        <div className="absolute top-20 left-3 z-30">
          <CBTCalculator
            onClose={() => setCalculatorOpen(false)}
            onUseValue={
              !viewingConduct && activeAnswer?.question?.type === 'numerical'
                ? (value) => {
                    if (value) onNumericalChange(value);
                  }
                : undefined
            }
          />
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_216px] lg:grid-rows-[minmax(0,1fr)_176px]">
          <div className="grid min-h-0 grid-cols-1 grid-rows-[40px_minmax(0,1fr)] lg:grid-cols-[252px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
            <CBTOutline
              conductAgreed={conductAgreed}
              viewingConduct={viewingConduct}
              sections={attempt?.sectionProgress ?? []}
              activeSectionId={activeSectionId}
              currentNumber={answersList.length === 0 ? 0 : currentIndex + 1}
              totalQuestions={answersList.length}
              locked={!conductAgreed || loading || Boolean(fatalError)}
              onShowConduct={() => setView('conduct')}
              onOpenSection={openSection}
            />
            {viewingConduct ? (
              <CBTQuestionPanel
                mode="conduct"
                currentIndex={0}
                totalQuestions={answersList.length}
                question={null}
                language={language}
                selectedOptionIds={[]}
                numericalInput=""
                isFlagged={false}
                networkError={fatalError}
                isActionDisabled={false}
                isEndOfExam={false}
                hasPrevious={false}
                zoom={zoom}
                onToggleOption={() => undefined}
                onNumericalChange={() => undefined}
                onToggleFlag={() => undefined}
                onPrevious={() => undefined}
                onSaveAndNext={() => undefined}
                onAgree={agreeToConduct}
                onOpenInstructions={() => setShowConductModal(true)}
                onDismissError={() => undefined}
              />
            ) : loading ? (
              <div className="flex items-center justify-center text-sm text-muted">
                Loading the examination paper
              </div>
            ) : !attempt ? (
              <div className="flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-3">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                    {fatalError ?? 'This examination session could not be opened.'}
                  </p>
                  <a href="/test-series" className="text-sm font-semibold text-accent">
                    Return to test series
                  </a>
                </div>
              </div>
            ) : (
              <CBTQuestionPanel
                mode={viewingConduct ? 'conduct' : 'question'}
                currentIndex={currentIndex}
                totalQuestions={answersList.length}
                question={activeAnswer?.question ?? null}
                language={language}
                selectedOptionIds={selectedOptionIds}
                numericalInput={numericalInput}
                isFlagged={isFlagged}
                networkError={networkError}
                isActionDisabled={actionsDisabled}
                isEndOfExam={isEndOfExam}
                hasPrevious={prevIndex !== -1}
                zoom={zoom}
                onToggleOption={handleToggleOption}
                onNumericalChange={onNumericalChange}
                onToggleFlag={() => void handleToggleFlag()}
                onPrevious={() => {
                  if (prevIndex !== -1) void navigateToQuestion(prevIndex);
                }}
                onSaveAndNext={() => void handleSaveAndNext()}
                onAgree={agreeToConduct}
                onOpenInstructions={() => setShowConductModal(true)}
                onDismissError={() => setNetworkError(null)}
              />
            )}
          </div>
          <div className="grid h-[232px] grid-cols-1 grid-rows-[112px_120px] border-t border-border lg:h-[176px] lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[minmax(0,1fr)]">
            <CBTPalette
              answers={answersList}
              currentIndex={currentIndex}
              isActionDisabled={actionsDisabled}
              locked={!conductAgreed || loading}
              onSelectQuestion={openQuestion}
            />
            <CBTLegend
              counts={summaryCounts}
              isActionDisabled={actionsDisabled}
              canSubmit={conductAgreed && !loading}
              onFinalSubmit={() => void openEndDialog()}
            />
          </div>
        </div>

      <CBTCodeOfConductModal
        isOpen={showConductModal}
        onClose={() => setShowConductModal(false)}
        testTitle={testMeta?.title ?? 'Computer-based examination'}
        positiveMarks={activeAnswer?.question?.marks ?? 1}
        negativeMarks={activeAnswer?.question?.negativeMarks ?? 0}
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
      <CBTKeyboardShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />
      {paused && !integrityWarning && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-6">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 text-center">
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">Test paused</p>
            <p className="mt-2 text-sm leading-6 text-slate-900 dark:text-slate-100">
              The clock is stopped. Resume when you are ready to continue.
            </p>
            <button
              type="button"
              onClick={() => void resumeTest()}
              className="mt-4 h-10 rounded bg-accent px-4 text-sm font-bold text-on-accent"
            >
              Resume test
            </button>
          </div>
        </div>
      )}
      {integrityWarning && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-6">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 text-center" role="alertdialog" aria-labelledby="integrity-title">
            <p id="integrity-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              Practise in good faith
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-900 dark:text-slate-100">
              Learn each question honestly, and carry the same discipline into the real examination.
              Stay on this screen. The paper is still open.
            </p>
            <button
              type="button"
              onClick={() => {
                setIntegrityWarning(false);
                setPageFullscreen(true);
              }}
              className="mt-4 h-10 rounded bg-accent px-4 text-sm font-bold text-on-accent"
            >
              Continue the examination
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
