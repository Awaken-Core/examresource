import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../../lib/api';

export type QuestionPaletteStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_and_marked_for_review';

export interface QuestionOption {
  id: string;
  _id?: string;
  content: string;
  translations?: Record<string, string>;
  imageUrl?: string | null;
  position: number;
}

export interface QuestionDetail {
  id: string;
  content: string;
  translations?: Record<string, string>;
  type: 'single_choice' | 'multiple_choice' | 'numerical';
  options: QuestionOption[];
  marks: number;
  negativeMarks: number;
}

export interface AttemptAnswer {
  id?: string;
  questionId: string;
  sectionId?: string | null;
  optionIds: string[];
  numericalValue?: string | null;
  status: QuestionPaletteStatus;
  timeSpentSeconds: number;
  answeredAt?: string | null;
  visitedAt?: string | null;
  lastViewedAt?: string | null;
  question: QuestionDetail | null;
  isCorrect?: boolean;
  marksAwarded?: number;
  maximumMarks?: number;
  negativeMarks?: number;
}

export interface SectionProgressItem {
  sectionId: string;
  name: string;
  timeSpentSeconds: number;
  isCompleted: boolean;
}

export interface AttemptDetail {
  id: string;
  _id?: string;
  testId: string;
  userId: string;
  attemptNumber: number;
  testVersion: number;
  status: 'in_progress' | 'submitted' | 'abandoned';
  startedAt: string;
  endedAt?: string | null;
  expiresAt?: string | null;
  timeSpentSeconds?: number | null;
  questionOrder: string[];
  sectionProgress: SectionProgressItem[];
  answers: AttemptAnswer[];
  marksAwarded?: number;
  maximumMarks?: number;
}

export interface PublishedTestMetadata {
  id: string;
  title: string;
  testMode: 'subject' | 'chapter' | 'full';
  durationMinutes?: number | null;
  sections?: Array<{
    id?: string;
    name: string;
    durationMinutes?: number | null;
    order?: number;
  }>;
}

interface Props {
  attemptId: string;
}

export function CBTTestRunner({ attemptId }: Props) {
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [testMeta, setTestMeta] = useState<PublishedTestMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active language
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');

  // Working inputs for the current question
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [numericalInput, setNumericalInput] = useState<string>('');

  // Saving / Network feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<
    'save_and_next' | 'mark_review' | 'clear' | null
  >(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Submission confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<AttemptDetail | null>(
    null,
  );

  // Countdown timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Active section for Full Tests
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Auto-submit lock ref
  const hasAutoSubmitted = useRef(false);
  const questionOpenedAtRef = useRef(Date.now());
  const sectionOpenedAtRef = useRef(Date.now());

  // Load Attempt and Test Metadata
  const loadAttempt = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/exam-attempts/${attemptId}`, {
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) {
        throw new Error(`Unable to fetch attempt (status ${res.status})`);
      }
      const data: AttemptDetail = await res.json();
      setAttempt(data);

      // Fetch test details for section duration / titles
      if (data.testId) {
        try {
          const testRes = await fetch(
            `${API_URL}/test-series/tests/${data.testId}`,
          );
          if (testRes.ok) {
            const tMeta = await testRes.json();
            setTestMeta(tMeta);
          }
        } catch {
          // Non-fatal if metadata fetch fails
        }
      }

      if (data.status === 'submitted') {
        setSubmittedResult(data);
        setLoading(false);
        return;
      }

      // Initialize remaining time from server authoritative expiresAt
      if (data.expiresAt) {
        const diffMs = new Date(data.expiresAt).getTime() - Date.now();
        const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
        setRemainingSeconds(diffSecs);
      }

      // Default active section
      if (data.sectionProgress && data.sectionProgress.length > 0) {
        setActiveSectionId(data.sectionProgress[0].sectionId);
      }
    } catch (err: any) {
      setFatalError(err.message || 'Error initializing CBT test environment.');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // Overall Countdown Timer
  useEffect(() => {
    if (remainingSeconds === null || submittedResult) return;
    if (remainingSeconds <= 0) {
      if (!hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        handleFinalSubmit(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, submittedResult]);

  // Sync inputs whenever currentIndex changes
  const activeAnswer = attempt?.answers?.[currentIndex];
  useEffect(() => {
    if (!activeAnswer) return;
    questionOpenedAtRef.current = Date.now();
    setSelectedOptionIds(activeAnswer.optionIds || []);
    setNumericalInput(activeAnswer.numericalValue || '');
    setNetworkError(null);

    // Keep activeSectionId in sync with current question
    if (activeAnswer.sectionId && activeAnswer.sectionId !== activeSectionId) {
      setActiveSectionId(activeAnswer.sectionId);
    }

    // If question was not visited, mark as not answered
    if (activeAnswer.status === 'not_visited' && attempt) {
      saveAnswerState(currentIndex, {
        status: 'not_answered',
        optionIds: [],
        numericalValue: null,
      });
    }
  }, [currentIndex, attempt?.answers?.length]);

  useEffect(() => {
    sectionOpenedAtRef.current = Date.now();
  }, [activeSectionId]);

  // Save answer to backend - returns boolean indicating success
  const saveAnswerState = async (
    index: number,
    payload: {
      status?: QuestionPaletteStatus;
      optionIds?: string[];
      numericalValue?: string | null;
      timeSpentSeconds?: number;
    },
  ): Promise<boolean> => {
    if (!attempt || attempt.status !== 'in_progress') return false;
    const ans = attempt.answers[index];
    if (!ans) return false;

    setIsSaving(true);
    setNetworkError(null);

    try {
      const res = await fetch(
        `${API_URL}/exam-attempts/${attempt.id}/questions/${ans.questionId}/answer`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Protection': '1',
          },
          credentials: 'include',
          body: JSON.stringify({
            optionIds:
              payload.optionIds !== undefined
                ? payload.optionIds
                : ans.optionIds,
            numericalValue:
              payload.numericalValue !== undefined
                ? payload.numericalValue
                : ans.numericalValue,
            status: payload.status || ans.status,
            timeSpentSeconds: payload.timeSpentSeconds ?? ans.timeSpentSeconds,
          }),
        },
      );

      if (!res.ok) {
        throw new Error('Failed to save response to server. Please retry.');
      }

      const updatedAttempt = await res.json();
      setAttempt(updatedAttempt);
      if (index === currentIndex) questionOpenedAtRef.current = Date.now();
      return true;
    } catch (err: any) {
      setNetworkError(
        err.message || 'Network error saving response. Please retry.',
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Clear Response
  const handleClearResponse = async () => {
    if (!attempt || !activeAnswer || isSaving || submitting) return;
    setIsSaving(true);
    setSavingAction('clear');
    setNetworkError(null);
    try {
      const res = await fetch(
        `${API_URL}/exam-attempts/${attempt.id}/questions/${activeAnswer.questionId}/answer`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Protection': '1',
          },
          credentials: 'include',
        },
      );

      if (!res.ok) {
        throw new Error('Could not clear response. Please retry.');
      }

      setSelectedOptionIds([]);
      setNumericalInput('');
      const updatedAttempt = await res.json();
      setAttempt(updatedAttempt);
    } catch (err: any) {
      setNetworkError(err.message || 'Error clearing response. Please retry.');
    } finally {
      setIsSaving(false);
      setSavingAction(null);
    }
  };

  // Section & Last Question Calculations
  const answersList = attempt?.answers || [];

  const currentQuestionTimeSpent = () => {
    const current = attempt?.answers[currentIndex];
    if (!current) return 0;
    return (
      current.timeSpentSeconds +
      Math.max(0, Math.floor((Date.now() - questionOpenedAtRef.current) / 1000))
    );
  };

  const saveSectionTime = async (sectionId: string | null | undefined) => {
    if (!attempt || !sectionId) return true;
    const section = attempt.sectionProgress.find(
      (item) => item.sectionId === sectionId,
    );
    if (!section) return true;

    const res = await fetch(
      `${API_URL}/exam-attempts/${attempt.id}/section-progress`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
        body: JSON.stringify({
          sectionId,
          timeSpentSeconds:
            section.timeSpentSeconds +
            Math.max(
              0,
              Math.floor((Date.now() - sectionOpenedAtRef.current) / 1000),
            ),
          isCompleted: section.isCompleted,
        }),
      },
    );
    if (!res.ok) return false;
    setAttempt(await res.json());
    sectionOpenedAtRef.current = Date.now();
    return true;
  };

  const navigateToQuestion = async (nextIndex: number) => {
    if (
      !attempt ||
      nextIndex === currentIndex ||
      nextIndex < 0 ||
      nextIndex >= attempt.answers.length
    )
      return;
    const current = attempt.answers[currentIndex];
    const next = attempt.answers[nextIndex];
    if (!current || !next) return;

    if (
      current.sectionId !== next.sectionId &&
      !(await saveSectionTime(current.sectionId))
    ) {
      setNetworkError('Could not save section time. Please retry.');
      return;
    }

    const saved = await saveAnswerState(currentIndex, {
      status: current.status,
      timeSpentSeconds: currentQuestionTimeSpent(),
    });
    if (saved) setCurrentIndex(nextIndex);
  };
  const isFullTest = (attempt?.sectionProgress?.length || 0) > 0;

  // Filtered indices for current section if Full Test with active section
  const currentSectionQuestionIndices =
    isFullTest && activeSectionId
      ? answersList
          .map((a, idx) => (a.sectionId === activeSectionId ? idx : -1))
          .filter((idx) => idx !== -1)
      : answersList.map((_, idx) => idx);

  // Check if current question is last question in current section/test
  const isLastQuestionInSection =
    currentSectionQuestionIndices.length > 0
      ? currentIndex ===
        currentSectionQuestionIndices[currentSectionQuestionIndices.length - 1]
      : currentIndex >= answersList.length - 1;

  // Next question index within section or test
  const currentPosInSection =
    currentSectionQuestionIndices.indexOf(currentIndex);
  const nextIndexInSection =
    currentPosInSection !== -1 &&
    currentPosInSection < currentSectionQuestionIndices.length - 1
      ? currentSectionQuestionIndices[currentPosInSection + 1]
      : currentIndex < answersList.length - 1
        ? currentIndex + 1
        : -1;

  // Previous question index within section or test
  const prevIndexInSection =
    currentPosInSection > 0
      ? currentSectionQuestionIndices[currentPosInSection - 1]
      : currentIndex > 0
        ? currentIndex - 1
        : -1;

  // Save & Next Action
  const handleSaveAndNext = async () => {
    if (!attempt || !activeAnswer || isSaving || submitting) return;
    setSavingAction('save_and_next');

    const hasSelection =
      selectedOptionIds.length > 0 ||
      (numericalInput !== '' && numericalInput !== null);
    const newStatus: QuestionPaletteStatus = hasSelection
      ? 'answered'
      : 'not_answered';

    const saved = await saveAnswerState(currentIndex, {
      status: newStatus,
      optionIds: selectedOptionIds,
      numericalValue: numericalInput.trim() ? numericalInput.trim() : null,
      timeSpentSeconds: currentQuestionTimeSpent(),
    });

    setSavingAction(null);

    // Only navigate after backend confirms successful response
    if (saved) {
      if (nextIndexInSection !== -1) {
        setCurrentIndex(nextIndexInSection);
      }
    }
  };

  // Mark for Review & Next
  const handleMarkForReviewAndNext = async () => {
    if (!attempt || !activeAnswer || isSaving || submitting) return;
    setSavingAction('mark_review');

    const hasSelection =
      selectedOptionIds.length > 0 ||
      (numericalInput !== '' && numericalInput !== null);
    const newStatus: QuestionPaletteStatus = hasSelection
      ? 'answered_and_marked_for_review'
      : 'marked_for_review';

    const saved = await saveAnswerState(currentIndex, {
      status: newStatus,
      optionIds: selectedOptionIds,
      numericalValue: numericalInput.trim() ? numericalInput.trim() : null,
      timeSpentSeconds: currentQuestionTimeSpent(),
    });

    setSavingAction(null);

    // Only navigate after backend confirms successful response
    if (saved) {
      if (nextIndexInSection !== -1) {
        setCurrentIndex(nextIndexInSection);
      }
    }
  };

  // Submit Test Action
  const handleFinalSubmit = async (isAutoExpire = false) => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // If student manually confirmed submit, save any unsaved/pending answer changes first
      if (!isAutoExpire && activeAnswer) {
        const hasSelection =
          selectedOptionIds.length > 0 ||
          (numericalInput !== '' && numericalInput !== null);
        const currentSavedOptions = activeAnswer.optionIds || [];
        const currentSavedNumerical = activeAnswer.numericalValue || '';

        const isOptionsChanged =
          selectedOptionIds.length !== currentSavedOptions.length ||
          selectedOptionIds.some((id) => !currentSavedOptions.includes(id));
        const isNumericalChanged =
          numericalInput.trim() !== currentSavedNumerical.trim();

        if (
          isOptionsChanged ||
          isNumericalChanged ||
          currentQuestionTimeSpent() > activeAnswer.timeSpentSeconds
        ) {
          const statusToSave: QuestionPaletteStatus = hasSelection
            ? activeAnswer.status === 'marked_for_review' ||
              activeAnswer.status === 'answered_and_marked_for_review'
              ? 'answered_and_marked_for_review'
              : 'answered'
            : activeAnswer.status === 'marked_for_review' ||
                activeAnswer.status === 'answered_and_marked_for_review'
              ? 'marked_for_review'
              : 'not_answered';

          const saved = await saveAnswerState(currentIndex, {
            status: statusToSave,
            optionIds: selectedOptionIds,
            numericalValue: numericalInput.trim()
              ? numericalInput.trim()
              : null,
            timeSpentSeconds: currentQuestionTimeSpent(),
          });

          if (!saved) {
            throw new Error(
              'Failed to save latest answer changes before submitting. Your changes are preserved; please retry.',
            );
          }
        }
      }

      const res = await fetch(`${API_URL}/exam-attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Unable to submit attempt. Re-trying status check...');
      }

      const finalized: AttemptDetail = await res.json();
      setSubmittedResult(finalized);
      setShowSubmitModal(false);
    } catch (err: any) {
      if (isAutoExpire) {
        // Reload attempt status which autoFinalizeAttempt resolves
        const recheck = await fetch(`${API_URL}/exam-attempts/${attempt.id}`, {
          credentials: 'include',
        });
        if (recheck.ok) {
          const finalData = await recheck.json();
          setSubmittedResult(finalData);
        }
      } else {
        const errMsg =
          err.message ||
          'Error submitting test attempt. Please check your connection and retry.';
        setSubmitError(errMsg);
        setNetworkError(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Format Timer Display

  // Format Timer Display
  const formatTime = (secs: number | null) => {
    if (secs === null) return '--:--';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin"></div>
        <p className="text-xs text-muted">
          Securing CBT test connection and decrypting paper...
        </p>
      </div>
    );
  }

  if (fatalError || !attempt) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center max-w-lg mx-auto space-y-3 my-12">
        <p className="text-sm font-semibold text-rose-200">
          {fatalError || 'Attempt not found.'}
        </p>
        <a
          href="/test-series"
          className="inline-block text-xs font-semibold text-[#2563EB] hover:underline"
        >
          &larr; Return to Test Series
        </a>
      </div>
    );
  }

  // Submitted Confirmation & Results Screen (Enhanced with GovtPariksha Design System)
  if (submittedResult) {
    const totalQ = submittedResult.answers?.length || 0;
    const answeredCount =
      submittedResult.answers?.filter(
        (a) =>
          a.status === 'answered' ||
          a.status === 'answered_and_marked_for_review',
      ).length || 0;
    const unansweredCount = Math.max(0, totalQ - answeredCount);

    const correctCount =
      submittedResult.answers?.filter((a) => a.isCorrect === true).length || 0;
    const incorrectCount =
      submittedResult.answers?.filter((a) => {
        const isAttempted =
          a.status === 'answered' ||
          a.status === 'answered_and_marked_for_review';
        return isAttempted && a.isCorrect === false;
      }).length || 0;

    const accuracyPct =
      answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const marksAwarded = Number((submittedResult.marksAwarded ?? 0).toFixed(2));
    const maxMarks = Number((submittedResult.maximumMarks ?? 0).toFixed(2));
    const scorePct =
      maxMarks > 0
        ? Math.max(
            0,
            Math.min(100, Math.round((marksAwarded / maxMarks) * 100)),
          )
        : 0;
    const timeSpent = submittedResult.timeSpentSeconds ?? null;

    return (
      <div className="w-full max-w-3xl mx-auto py-8 sm:py-12 px-4 space-y-6">
        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-900/5 dark:shadow-black/40 relative overflow-hidden">
          {/* Subtle Accent Glow Ring */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          {/* Top Pill / Breadcrumb Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-6 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Evaluation Complete
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                Attempt #{submittedResult.attemptNumber || 1}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              Recorded authoritatively on server
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative z-10 text-center py-6 sm:py-7 space-y-3">
            {/* Layered Animated Success Icon */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 rotate-6" />
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/25 dark:bg-emerald-500/25 -rotate-3" />
              <div className="relative w-full h-full rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
                <svg
                  className="w-9 h-9 sm:w-11 sm:h-11"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Test Submitted Successfully!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                {testMeta?.title ? (
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    {testMeta.title} &mdash;{' '}
                  </span>
                ) : null}
                Your responses have been securely computed and graded.
              </p>
            </div>
          </div>

          {/* Hero Spotlight: Score Card */}
          <div className="relative z-10 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-zinc-800/80 dark:via-zinc-800/50 dark:to-zinc-800/20 border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-5 sm:p-6 mb-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Total Score Awarded
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                    {marksAwarded}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-slate-400 dark:text-zinc-500">
                    / {maxMarks} Marks
                  </span>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  {scorePct}% Score
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Negative marking applied
                </span>
              </div>
            </div>

            {/* Score Visual Bar */}
            <div className="w-full h-2.5 bg-slate-200 dark:bg-zinc-700/60 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(4, scorePct)}%` }}
              />
            </div>
          </div>

          {/* 4 Key Performance Metrics Grid */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* 1. Attempted */}
            <div className="bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  Attempted
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {answeredCount}{' '}
                <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                  / {totalQ}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                {unansweredCount} skipped
              </span>
            </div>

            {/* 2. Accuracy */}
            <div className="bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  Accuracy
                </span>
              </div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {accuracyPct}%
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                Based on attempts
              </span>
            </div>

            {/* 3. Correct / Incorrect Breakdown */}
            <div className="bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  Correct / Wrong
                </span>
              </div>
              <div className="text-xl font-bold flex items-baseline gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {correctCount}
                </span>
                <span className="text-slate-300 dark:text-zinc-600">/</span>
                <span className="text-rose-600 dark:text-rose-400">
                  {incorrectCount}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                Verified answers
              </span>
            </div>

            {/* 4. Time Spent */}
            <div className="bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  Time Taken
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {timeSpent !== null ? formatTime(timeSpent) : '--:--'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                Total duration
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/test-series"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] transition shadow-md shadow-blue-600/20"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Explore More Tests
            </a>

            {testMeta?.id && (
              <a
                href={`/test-series/tests/${testMeta.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                View Test Overview
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = activeAnswer?.question;
  const questionType = currentQ?.type || 'single_choice';

  // Localized question content
  const questionContent =
    language === 'Hindi' && currentQ?.translations?.['hi']
      ? currentQ.translations['hi']
      : currentQ?.content || 'Loading question...';

  // Question counts by palette status for summary
  const summaryCounts = {
    answered: answersList.filter((a) => a.status === 'answered').length,
    not_answered: answersList.filter((a) => a.status === 'not_answered').length,
    marked_for_review: answersList.filter(
      (a) => a.status === 'marked_for_review',
    ).length,
    answered_and_marked: answersList.filter(
      (a) => a.status === 'answered_and_marked_for_review',
    ).length,
    not_visited: answersList.filter((a) => a.status === 'not_visited').length,
  };

  const isActionDisabled = isSaving || submitting;

  return (
    <div className="space-y-4">
      {/* Top CBT Header Banner */}
      <header className="bg-surface border border-border rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs select-none">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {testMeta?.title || 'GovtPariksha Computer-Based Test'}
            </h1>
            <span className="text-[10px] text-muted">
              Attempt #{attempt.attemptNumber} • Candidate Assessment Session
            </span>
          </div>
        </div>

        {/* Right Header: Bilingual Switcher, Timer, Submit */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Language Switcher */}
          <div className="flex items-center bg-surface-raised border border-border rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => setLanguage('English')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                language === 'English'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-muted hover:text-white'
              } ${isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              EN
            </button>
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={() => setLanguage('Hindi')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                language === 'Hindi'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-muted hover:text-white'
              } ${isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              HI
            </button>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-xs font-mono font-bold text-slate-900 dark:text-white">
            <svg
              className="w-4 h-4 text-amber-500 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <polyline
                points="12 6 12 12 16 14"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span
              className={
                remainingSeconds !== null && remainingSeconds < 300
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }
            >
              {formatTime(remainingSeconds)}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={isActionDisabled}
            onClick={() => {
              setSubmitError(null);
              setShowSubmitModal(true);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-2xs ${
              isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Section Tabs for Full Tests */}
      {isFullTest && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted shrink-0 mr-1">
            Sections:
          </span>
          {attempt.sectionProgress.map((sec, idx) => {
            const isSelected =
              (activeSectionId || attempt.sectionProgress[0].sectionId) ===
              sec.sectionId;
            return (
              <button
                key={sec.sectionId}
                type="button"
                disabled={isActionDisabled}
                onClick={() => {
                  // Find first question in this section
                  const targetIdx = answersList.findIndex(
                    (a) => a.sectionId === sec.sectionId,
                  );
                  if (targetIdx !== -1) void navigateToQuestion(targetIdx);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'bg-surface border border-border text-muted hover:text-white'
                } ${isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span>{sec.name || `Section ${idx + 1}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main CBT Grid: Left Question Area, Right Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Question Area (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6 min-h-[460px]">
          <div className="space-y-4">
            {/* Question Info Bar */}
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#2563EB]/15 text-[#60A5FA] border border-[#2563EB]/30">
                  Question {currentIndex + 1}
                </span>
                <span className="text-[11px] text-muted">
                  Type:{' '}
                  <strong className="text-slate-300 font-medium">
                    {questionType === 'numerical'
                      ? 'Numerical Answer'
                      : questionType === 'multiple_choice'
                        ? 'Multiple Correct MCQ'
                        : 'Single Correct MCQ'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 font-semibold">
                  +{currentQ?.marks || 1}
                </span>
                {currentQ?.negativeMarks ? (
                  <span className="text-rose-400 font-semibold">
                    -{currentQ.negativeMarks}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Network or Saving Status Indicator */}
            {isSaving && (
              <div className="flex items-center gap-2 text-[11px] text-blue-400 font-medium">
                <div className="w-3 h-3 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></div>
                <span>
                  {savingAction === 'save_and_next'
                    ? 'Saving response & loading next...'
                    : savingAction === 'mark_review'
                      ? 'Marking for review & saving...'
                      : savingAction === 'clear'
                        ? 'Clearing response...'
                        : 'Saving response to server...'}
                </span>
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
                  onClick={() => setNetworkError(null)}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-200 underline ml-auto shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Question Text */}
            <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-white leading-relaxed pt-1">
              {questionContent}
            </div>

            {/* Question Options or Numerical Input */}
            <div className="pt-2">
              {/* Type 1 & 2: Single or Multiple Choice MCQ */}
              {questionType !== 'numerical' && currentQ?.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, optIdx) => {
                    const isChecked = selectedOptionIds.includes(
                      opt.id || opt._id || '',
                    );
                    const optContent =
                      language === 'Hindi' && opt.translations?.['hi']
                        ? opt.translations['hi']
                        : opt.content;

                    return (
                      <label
                        key={opt.id || opt._id || optIdx}
                        onClick={() => {
                          if (isActionDisabled) return;
                          const optId = opt.id || opt._id || '';
                          if (questionType === 'single_choice') {
                            setSelectedOptionIds([optId]);
                          } else {
                            // Multiple Choice
                            if (isChecked) {
                              setSelectedOptionIds(
                                selectedOptionIds.filter((id) => id !== optId),
                              );
                            } else {
                              setSelectedOptionIds([
                                ...selectedOptionIds,
                                optId,
                              ]);
                            }
                          }
                        }}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all select-none ${
                          isChecked
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-slate-900 dark:text-white font-medium shadow-sm ring-1 ring-blue-500/50'
                            : 'bg-white dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/80'
                        } ${isActionDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-${questionType === 'single_choice' ? 'full' : 'lg'} border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'border-slate-300 dark:border-zinc-600 text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-700/40'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
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
                <div className="space-y-2 max-w-sm pt-2">
                  <label className="text-xs text-muted block font-medium">
                    Enter the exact numerical value:
                  </label>
                  <input
                    type="text"
                    disabled={isActionDisabled}
                    value={numericalInput}
                    onChange={(e) => setNumericalInput(e.target.value)}
                    placeholder="e.g. 42 or 3.14"
                    className={`w-full bg-white dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden ${
                      isActionDisabled ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                  <p className="text-[11px] text-muted">
                    Exact-match evaluation is applied upon final test
                    submission.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Answering Controls Footer */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-zinc-700/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={handleClearResponse}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1.5 ${
                  isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {savingAction === 'clear' && (
                  <div className="w-3 h-3 border-2 border-slate-400 border-t-slate-700 dark:border-t-white rounded-full animate-spin"></div>
                )}
                <span>Clear Response</span>
              </button>
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={handleMarkForReviewAndNext}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer flex items-center gap-1.5 ${
                  isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {savingAction === 'mark_review' && (
                  <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-600 dark:border-t-purple-300 rounded-full animate-spin"></div>
                )}
                <span>Mark for Review & Next</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {currentIndex > 0 && (
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={() => {
                    if (prevIndexInSection !== -1) {
                      void navigateToQuestion(prevIndexInSection);
                    } else {
                      void navigateToQuestion(currentIndex - 1);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-700 transition cursor-pointer ${
                    isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  &larr; Previous
                </button>
              )}

              {isLastQuestionInSection ? (
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={() => {
                    setSubmitError(null);
                    setShowSubmitModal(true);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-2 ${
                    isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <span>Submit Test</span>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                  onClick={handleSaveAndNext}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2 ${
                    isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {savingAction === 'save_and_next' && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                  <span>
                    {savingAction === 'save_and_next'
                      ? 'Saving & Next...'
                      : 'Save & Next \u2192'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Navigation Palette (1 col) */}
        <aside className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
              Question Palette
            </h2>
            <span className="text-[11px] font-semibold text-muted px-2 py-0.5 rounded-md bg-surface-raised border border-border/50">
              {currentIndex + 1} of {answersList.length}
            </span>
          </div>

          {/* Palette Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] pb-3 border-b border-border/70">
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">
                Answered ({summaryCounts.answered})
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/20 text-rose-700 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
              <span className="truncate">
                Not Ans ({summaryCounts.not_answered})
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-950/40 border border-purple-500/20 text-purple-700 dark:text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
              <span className="truncate">
                Review ({summaryCounts.marked_for_review})
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
              <span className="truncate">
                Ans & Rev ({summaryCounts.answered_and_marked})
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-500/10 dark:bg-slate-800/60 border border-slate-500/20 text-slate-700 dark:text-slate-300 col-span-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0"></span>
              <span className="truncate">
                Not Visited ({summaryCounts.not_visited})
              </span>
            </div>
          </div>

          {/* Palette Grid Buttons with ample padding to prevent ring/edge clipping */}
          <div className="p-1 max-h-[380px] overflow-y-auto overflow-x-hidden pr-2">
            <div className="grid grid-cols-5 gap-2.5">
              {answersList.map((ans, idx) => {
                const isCurrent = idx === currentIndex;
                const status = ans.status || 'not_visited';

                let statusStyle =
                  'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700/80 hover:bg-slate-300/80 dark:hover:bg-zinc-700';
                if (status === 'answered') {
                  statusStyle =
                    'bg-emerald-500 text-white border border-emerald-600 shadow-xs hover:bg-emerald-600';
                } else if (status === 'not_answered') {
                  statusStyle =
                    'bg-rose-500 text-white border border-rose-600 shadow-xs hover:bg-rose-600';
                } else if (status === 'marked_for_review') {
                  statusStyle =
                    'bg-purple-500 text-white border border-purple-600 shadow-xs hover:bg-purple-600';
                } else if (status === 'answered_and_marked_for_review') {
                  statusStyle =
                    'bg-indigo-500 text-white border border-indigo-600 shadow-xs hover:bg-indigo-600';
                }

                return (
                  <button
                    key={ans.questionId || idx}
                    type="button"
                    disabled={isActionDisabled}
                    onClick={() => void navigateToQuestion(idx)}
                    className={`h-9 w-full rounded-xl text-xs font-bold transition flex items-center justify-center select-none ${statusStyle} ${
                      isCurrent
                        ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-105 z-10'
                        : ''
                    } ${isActionDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal for Final Submit */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white">
              Confirm Final Submission
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to finish and submit this test? You will not
              be able to change any answers after submission.
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs py-1">
              <div className="bg-surface-raised/60 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted block">Answered</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {summaryCounts.answered + summaryCounts.answered_and_marked}{' '}
                  Qs
                </span>
              </div>
              <div className="bg-surface-raised/60 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted block">Unanswered</span>
                <span className="font-bold text-rose-400 text-sm">
                  {summaryCounts.not_answered + summaryCounts.not_visited} Qs
                </span>
              </div>
              <div className="bg-surface-raised/60 p-2.5 rounded-lg border border-border/50">
                <span className="text-[10px] text-muted block">Review</span>
                <span className="font-bold text-purple-400 text-sm">
                  {summaryCounts.marked_for_review +
                    summaryCounts.answered_and_marked}{' '}
                  Qs
                </span>
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
                onClick={() => {
                  setSubmitError(null);
                  setShowSubmitModal(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold bg-surface-raised border border-border text-muted hover:text-white transition ${
                  submitting
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className={`px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs flex items-center gap-2 transition ${
                  submitting
                    ? 'opacity-70 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {submitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                <span>
                  {submitting
                    ? 'Submitting & Evaluating...'
                    : 'Yes, Submit Test'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
