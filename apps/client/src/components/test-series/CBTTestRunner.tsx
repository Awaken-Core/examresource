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
  question: QuestionDetail | null;
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
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Submission confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<AttemptDetail | null>(null);

  // Countdown timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Active section for Full Tests
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Auto-submit lock ref
  const hasAutoSubmitted = useRef(false);

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

      if (data.status === 'submitted') {
        setSubmittedResult(data);
        setLoading(false);
        return;
      }

      // Fetch test details for section duration / titles
      if (data.testId) {
        const testRes = await fetch(`${API_URL}/test-series/tests/${data.testId}`);
        if (testRes.ok) {
          const tMeta = await testRes.json();
          setTestMeta(tMeta);
        }
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
    setSelectedOptionIds(activeAnswer.optionIds || []);
    setNumericalInput(activeAnswer.numericalValue || '');
    setNetworkError(null);

    // If question was not visited, mark as not answered
    if (activeAnswer.status === 'not_visited' && attempt) {
      saveAnswerState(currentIndex, {
        status: 'not_answered',
        optionIds: [],
        numericalValue: null,
      });
    }
  }, [currentIndex, attempt?.answers?.length]);

  // Save answer to backend
  const saveAnswerState = async (
    index: number,
    payload: {
      status?: QuestionPaletteStatus;
      optionIds?: string[];
      numericalValue?: string | null;
      timeSpentSeconds?: number;
    }
  ) => {
    if (!attempt || attempt.status !== 'in_progress') return;
    const ans = attempt.answers[index];
    if (!ans) return;

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
            optionIds: payload.optionIds !== undefined ? payload.optionIds : ans.optionIds,
            numericalValue: payload.numericalValue !== undefined ? payload.numericalValue : ans.numericalValue,
            status: payload.status || ans.status,
            timeSpentSeconds: payload.timeSpentSeconds || 0,
          }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to persist response to server. Retrying...');
      }

      const updatedAttempt = await res.json();
      setAttempt(updatedAttempt);
    } catch (err: any) {
      setNetworkError(err.message || 'Network error saving response.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear Response
  const handleClearResponse = async () => {
    if (!attempt || !activeAnswer) return;
    setIsSaving(true);
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
        }
      );

      if (!res.ok) {
        throw new Error('Could not clear response.');
      }

      setSelectedOptionIds([]);
      setNumericalInput('');
      const updatedAttempt = await res.json();
      setAttempt(updatedAttempt);
    } catch (err: any) {
      setNetworkError(err.message || 'Error clearing response.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save & Next Action
  const handleSaveAndNext = async () => {
    if (!attempt || !activeAnswer) return;
    const hasSelection =
      selectedOptionIds.length > 0 || (numericalInput !== '' && numericalInput !== null);
    const newStatus: QuestionPaletteStatus = hasSelection ? 'answered' : 'not_answered';

    await saveAnswerState(currentIndex, {
      status: newStatus,
      optionIds: selectedOptionIds,
      numericalValue: numericalInput.trim() ? numericalInput.trim() : null,
    });

    if (currentIndex < (attempt.answers.length - 1)) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Mark for Review & Next
  const handleMarkForReviewAndNext = async () => {
    if (!attempt || !activeAnswer) return;
    const hasSelection =
      selectedOptionIds.length > 0 || (numericalInput !== '' && numericalInput !== null);
    const newStatus: QuestionPaletteStatus = hasSelection
      ? 'answered_and_marked_for_review'
      : 'marked_for_review';

    await saveAnswerState(currentIndex, {
      status: newStatus,
      optionIds: selectedOptionIds,
      numericalValue: numericalInput.trim() ? numericalInput.trim() : null,
    });

    if (currentIndex < (attempt.answers.length - 1)) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Submit Test Action
  const handleFinalSubmit = async (isAutoExpire = false) => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
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
        const recheck = await fetch(`${API_URL}/exam-attempts/${attempt.id}`, { credentials: 'include' });
        if (recheck.ok) {
          const finalData = await recheck.json();
          setSubmittedResult(finalData);
        }
      } else {
        alert(err.message || 'Error submitting test attempt. Please check your internet connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <p className="text-xs text-muted">Securing CBT test connection and decrypting paper...</p>
      </div>
    );
  }

  if (fatalError || !attempt) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center max-w-lg mx-auto space-y-3 my-12">
        <p className="text-sm font-semibold text-rose-200">{fatalError || 'Attempt not found.'}</p>
        <a href="/test-series" className="inline-block text-xs font-semibold text-[#2563EB] hover:underline">
          &larr; Return to Test Series
        </a>
      </div>
    );
  }

  // Submitted Confirmation Screen (Stage 6 Requirement: submitted confirmation & safe placeholder)
  if (submittedResult) {
    const totalQ = submittedResult.answers?.length || 0;
    const answeredCount = submittedResult.answers?.filter(
      (a) => a.status === 'answered' || a.status === 'answered_and_marked_for_review'
    ).length || 0;

    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <div className="bg-surface border border-border rounded-2xl p-7 text-center space-y-5 shadow-2xs">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Test Submitted Successfully!
            </h1>
            <p className="text-xs text-muted">
              Your responses have been recorded and evaluated authoritatively on the server.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2 text-left">
            <div className="bg-surface-raised/40 border border-border p-3.5 rounded-xl">
              <span className="text-[11px] text-muted block">Questions Answered</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {answeredCount} / {totalQ}
              </span>
            </div>
            <div className="bg-surface-raised/40 border border-border p-3.5 rounded-xl">
              <span className="text-[11px] text-muted block">Marks Scored</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                {submittedResult.marksAwarded ?? 0} / {submittedResult.maximumMarks ?? 0}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/test-series"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-600 shadow-2xs"
            >
              Explore More Tests
            </a>
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

  // Filter questions by section if Full Test with sectionProgress
  const answersList = attempt.answers || [];
  const isFullTest = (attempt.sectionProgress?.length || 0) > 0;

  // Question counts by palette status for summary
  const summaryCounts = {
    answered: answersList.filter((a) => a.status === 'answered').length,
    not_answered: answersList.filter((a) => a.status === 'not_answered').length,
    marked_for_review: answersList.filter((a) => a.status === 'marked_for_review').length,
    answered_and_marked: answersList.filter((a) => a.status === 'answered_and_marked_for_review').length,
    not_visited: answersList.filter((a) => a.status === 'not_visited').length,
  };

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
              onClick={() => setLanguage('English')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                language === 'English' ? 'bg-[#2563EB] text-white shadow-2xs' : 'text-muted hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('Hindi')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                language === 'Hindi' ? 'bg-[#2563EB] text-white shadow-2xs' : 'text-muted hover:text-white'
              }`}
            >
              HI
            </button>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-xs font-mono font-bold text-slate-900 dark:text-white">
            <svg className="w-4 h-4 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className={remainingSeconds !== null && remainingSeconds < 300 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}>
              {formatTime(remainingSeconds)}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-2xs"
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
            const isSelected = (activeSectionId || attempt.sectionProgress[0].sectionId) === sec.sectionId;
            return (
              <button
                key={sec.sectionId}
                type="button"
                onClick={() => {
                  setActiveSectionId(sec.sectionId);
                  // Find first question in this section
                  const targetIdx = answersList.findIndex((a) => a.sectionId === sec.sectionId);
                  if (targetIdx !== -1) setCurrentIndex(targetIdx);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'bg-surface border border-border text-muted hover:text-white'
                }`}
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
                <span className="text-emerald-400 font-semibold">+{currentQ?.marks || 1}</span>
                {currentQ?.negativeMarks ? (
                  <span className="text-rose-400 font-semibold">-{currentQ.negativeMarks}</span>
                ) : null}
              </div>
            </div>

            {/* Network or Saving Status Indicator */}
            {isSaving && (
              <div className="flex items-center gap-2 text-[11px] text-muted italic">
                <div className="w-2.5 h-2.5 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></div>
                <span>Saving response to server...</span>
              </div>
            )}
            {networkError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {networkError}
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
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isChecked = selectedOptionIds.includes(opt.id || opt._id || '');
                    const optContent =
                      language === 'Hindi' && opt.translations?.['hi']
                        ? opt.translations['hi']
                        : opt.content;

                    return (
                      <label
                        key={opt.id || opt._id || optIdx}
                        onClick={() => {
                          const optId = opt.id || opt._id || '';
                          if (questionType === 'single_choice') {
                            setSelectedOptionIds([optId]);
                          } else {
                            // Multiple Choice
                            if (isChecked) {
                              setSelectedOptionIds(selectedOptionIds.filter((id) => id !== optId));
                            } else {
                              setSelectedOptionIds([...selectedOptionIds, optId]);
                            }
                          }
                        }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-[#2563EB]/15 border-[#2563EB] text-slate-900 dark:text-white font-medium shadow-2xs'
                            : 'bg-surface-raised/40 border-border text-slate-700 dark:text-slate-300 hover:bg-surface-raised/70'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-${questionType === 'single_choice' ? 'full' : 'md'} border flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold ${
                            isChecked
                              ? 'bg-[#2563EB] border-[#2563EB] text-white'
                              : 'border-slate-500 text-muted'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed">{optContent}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Type 3: Numerical Answer */}
              {questionType === 'numerical' && (
                <div className="space-y-2 max-w-sm pt-2">
                  <label className="text-xs text-muted block">
                    Enter the exact numerical value:
                  </label>
                  <input
                    type="text"
                    value={numericalInput}
                    onChange={(e) => setNumericalInput(e.target.value)}
                    placeholder="e.g. 42 or 3.14"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono focus:border-[#2563EB] focus:outline-none"
                  />
                  <p className="text-[11px] text-muted">
                    Exact-match evaluation is applied upon final test submission.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Answering Controls Footer */}
          <div className="pt-4 border-t border-border/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-raised border border-border text-muted hover:text-white transition cursor-pointer"
              >
                Clear Response
              </button>
              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition cursor-pointer"
              >
                Mark for Review & Next
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-raised border border-border text-muted hover:text-white transition cursor-pointer"
                >
                  &larr; Previous
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-600 text-white transition cursor-pointer shadow-2xs"
              >
                Save & Next &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Navigation Palette (1 col) */}
        <aside className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Question Palette
          </h2>

          {/* Palette Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-muted pb-3 border-b border-border/80">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0"></span>
              <span>Answered ({summaryCounts.answered})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 shrink-0"></span>
              <span>Not Answered ({summaryCounts.not_answered})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-purple-500 shrink-0"></span>
              <span>Review ({summaryCounts.marked_for_review})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-indigo-500 shrink-0"></span>
              <span>Ans & Review ({summaryCounts.answered_and_marked})</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-600 shrink-0"></span>
              <span>Not Visited ({summaryCounts.not_visited})</span>
            </div>
          </div>

          {/* Palette Grid Buttons */}
          <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {answersList.map((ans, idx) => {
              const isCurrent = idx === currentIndex;
              const status = ans.status || 'not_visited';

              let statusClasses = 'bg-slate-700 text-slate-300';
              if (status === 'answered') statusClasses = 'bg-emerald-500 text-white';
              if (status === 'not_answered') statusClasses = 'bg-rose-500 text-white';
              if (status === 'marked_for_review') statusClasses = 'bg-purple-500 text-white';
              if (status === 'answered_and_marked_for_review') statusClasses = 'bg-indigo-500 text-white';

              return (
                <button
                  key={ans.questionId || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${statusClasses} ${
                    isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0B132B]' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Confirmation Modal for Final Submit */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white">Confirm Final Submission</h3>
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to finish and submit this test? You will not be able to change any answers after submission.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs py-1">
              <div className="bg-surface-raised/60 p-2.5 rounded-lg">
                <span className="text-[10px] text-muted block">Answered</span>
                <span className="font-bold text-emerald-400">
                  {summaryCounts.answered + summaryCounts.answered_and_marked} Qs
                </span>
              </div>
              <div className="bg-surface-raised/60 p-2.5 rounded-lg">
                <span className="text-[10px] text-muted block">Unanswered</span>
                <span className="font-bold text-rose-400">
                  {summaryCounts.not_answered + summaryCounts.not_visited + summaryCounts.marked_for_review} Qs
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-raised border border-border text-muted hover:text-white"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs"
              >
                {submitting ? 'Finalizing Evaluation...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
