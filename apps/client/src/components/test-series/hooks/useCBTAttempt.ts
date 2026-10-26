import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../../../lib/api';
import type {
  AttemptDetail,
  PublishedTestMetadata,
  QuestionPaletteStatus,
} from '../types/cbt';

function leaveExamFullscreen() {
  const keyboard = (navigator as Navigator & { keyboard?: { unlock?: () => void } }).keyboard;
  keyboard?.unlock?.();
  const doc = document as Document & {
    webkitExitFullscreen?: () => void;
    mozCancelFullScreen?: () => void;
    msExitFullscreen?: () => void;
  };
  if (document.fullscreenElement) {
    void document.exitFullscreen?.().catch(() => undefined);
    return;
  }
  doc.webkitExitFullscreen?.();
  doc.mozCancelFullScreen?.();
  doc.msExitFullscreen?.();
}

function navigateToResults(targetId: string) {
  const url = `/test-series/results/${targetId}`;
  void import('astro:transitions/client')
    .then(({ navigate }) => navigate(url, { history: 'replace' }))
    .catch(() => {
      window.location.replace(url);
    });
}

interface UseCBTAttemptProps {
  readonly attemptId: string;
}

export function useCBTAttempt({ attemptId }: UseCBTAttemptProps) {
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [testMeta, setTestMeta] = useState<PublishedTestMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const [networkError, setNetworkError] = useState<string | null>(null);

  // Submit modal state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasAutoSubmitted = useRef(false);
  const submitLockRef = useRef(false);
  const questionOpenedAtRef = useRef(Date.now());
  const sectionOpenedAtRef = useRef(Date.now());
  const saveGenerationRef = useRef(0);
  const saveChainRef = useRef(Promise.resolve());

  const enqueueSave = useCallback((job: () => Promise<boolean>) => {
    const run = saveChainRef.current.then(job, job);
    saveChainRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

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

      if (data.testId) {
        try {
          const testRes = await fetch(`${API_URL}/test-series/tests/${data.testId}`);
          if (testRes.ok) {
            const tMeta: PublishedTestMetadata = await testRes.json();
            setTestMeta(tMeta);
          }
        } catch {
          // Non-fatal if metadata fetch fails
        }
      }

      if (data.status === 'submitted') {
        const targetId = data.id || data._id || attemptId;
        leaveExamFullscreen();
        navigateToResults(targetId);
        return;
      }

      if (data.pausedAt && data.expiresAt) {
        const frozen = new Date(data.expiresAt).getTime() - new Date(data.pausedAt).getTime();
        setRemainingSeconds(Math.max(0, Math.floor(frozen / 1000)));
        setPaused(true);
      } else if (data.expiresAt) {
        const diffMs = new Date(data.expiresAt).getTime() - Date.now();
        setRemainingSeconds(Math.max(0, Math.floor(diffMs / 1000)));
        setPaused(false);
      }

      if (data.sectionProgress?.length) {
        setActiveSectionId(data.sectionProgress[0].sectionId);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error initializing CBT test environment.';
      setFatalError(message);
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  // Save single question answer state
  const saveAnswerState = useCallback(
    (
      index: number,
      payload: {
        readonly status?: QuestionPaletteStatus;
        readonly optionIds?: readonly string[];
        readonly numericalValue?: string | null;
        readonly timeSpentSeconds?: number;
        readonly quiet?: boolean;
        readonly background?: boolean;
      },
    ): Promise<boolean> => {
      return enqueueSave(async () => {
        if (attempt?.status !== 'in_progress') return false;
        const ans = attempt.answers[index];
        if (!ans) return false;
        const generation = ++saveGenerationRef.current;

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
                optionIds: payload.optionIds ?? ans.optionIds,
                numericalValue: payload.numericalValue ?? ans.numericalValue,
                status: payload.status ?? ans.status,
                timeSpentSeconds: payload.timeSpentSeconds ?? ans.timeSpentSeconds,
              }),
            },
          );

          if (!res.ok) {
            throw new Error('Failed to save response to server. Please retry.');
          }

          const updatedAttempt: AttemptDetail = await res.json();
          if (generation === saveGenerationRef.current) {
            setAttempt((prev) => {
              if (!prev) return updatedAttempt;
              const serverAnswerMap = new Map(
                updatedAttempt.answers.map((a) => [a.questionId, a]),
              );
              return {
                ...updatedAttempt,
                answers: prev.answers.map((prevAns) => {
                  if (prevAns.questionId === ans.questionId) {
                    return serverAnswerMap.get(prevAns.questionId) ?? prevAns;
                  }
                  return prevAns;
                }),
              };
            });
            questionOpenedAtRef.current = Date.now();
          }
          return true;
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Network error saving response. Please retry.';
          if (generation === saveGenerationRef.current) setNetworkError(msg);
          return false;
        }
      });
    },
    [attempt, enqueueSave],
  );

  // Clear Response
  const handleClearResponse = useCallback(
    (currentIndex: number): Promise<boolean> => {
      return enqueueSave(async () => {
        if (!attempt || attempt.status !== 'in_progress') return false;
        const activeAnswer = attempt.answers[currentIndex];
        if (!activeAnswer) return false;
        const generation = ++saveGenerationRef.current;

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

          const updatedAttempt: AttemptDetail = await res.json();
          if (generation === saveGenerationRef.current) {
            setAttempt((prev) => {
              if (!prev) return updatedAttempt;
              const serverAnswerMap = new Map(
                updatedAttempt.answers.map((a) => [a.questionId, a]),
              );
              return {
                ...updatedAttempt,
                answers: prev.answers.map((prevAns) => {
                  if (prevAns.questionId === activeAnswer.questionId) {
                    return serverAnswerMap.get(prevAns.questionId) ?? prevAns;
                  }
                  return prevAns;
                }),
              };
            });
          }
          return true;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error clearing response. Please retry.';
          if (generation === saveGenerationRef.current) setNetworkError(msg);
          return false;
        }
      });
    },
    [attempt, enqueueSave],
  );

  // Save Section Time
  const saveSectionTime = useCallback(
    (sectionId: string | null | undefined): Promise<boolean> => {
      return enqueueSave(async () => {
        if (!attempt || !sectionId) return true;
        const section = attempt.sectionProgress.find((item) => item.sectionId === sectionId);
        if (!section) return true;

        const elapsed = Math.max(0, Math.floor((Date.now() - sectionOpenedAtRef.current) / 1000));
        const generation = ++saveGenerationRef.current;

        try {
          const res = await fetch(`${API_URL}/exam-attempts/${attempt.id}/section-progress`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Protection': '1',
            },
            credentials: 'include',
            body: JSON.stringify({
              sectionId,
              timeSpentSeconds: section.timeSpentSeconds + elapsed,
              isCompleted: section.isCompleted,
            }),
          });
          if (!res.ok) return false;
          const updated: AttemptDetail = await res.json();
          if (generation === saveGenerationRef.current) {
            setAttempt((prev) =>
              prev ? { ...prev, sectionProgress: updated.sectionProgress } : updated,
            );
            sectionOpenedAtRef.current = Date.now();
          }
          return true;
        } catch {
          return false;
        }
      });
    },
    [attempt, enqueueSave],
  );

  // Final Submit
  const handleFinalSubmit = useCallback(
    async (isAutoExpire = false) => {
      if (!attempt || submitLockRef.current) return;
      submitLockRef.current = true;
      setSubmitting(true);
      setSubmitError(null);
      await saveChainRef.current;

      try {
        const res = await fetch(`${API_URL}/exam-attempts/${attempt.id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Protection': '1',
          },
          credentials: 'include',
        });

        if (res.ok || res.status === 409) {
          const finalized: AttemptDetail | null = res.ok
            ? await res.json().catch(() => null)
            : null;
          const targetId = finalized?.id || finalized?._id || attempt.id;
          (window as any).__cbtNavigatingFromUI = true;
          leaveExamFullscreen();
          navigateToResults(targetId);
          return;
        }

        throw new Error('Unable to submit attempt. Re-trying status check...');
      } catch (err: unknown) {
        // Fallback: check if the attempt is already finalized in database
        try {
          const recheck = await fetch(`${API_URL}/exam-attempts/${attempt.id}`, {
            credentials: 'include',
          });
          if (recheck.ok) {
            const finalData: AttemptDetail = await recheck.json();
            if (finalData.status === 'submitted') {
              const targetId = finalData.id || finalData._id || attempt.id;
              (window as any).__cbtNavigatingFromUI = true;
              leaveExamFullscreen();
              navigateToResults(targetId);
              return;
            }
          }
        } catch {
          // ignore background check failure
        }
        const errMsg =
          err instanceof Error
            ? err.message
            : 'Error submitting test attempt. Please check your connection and retry.';
        setSubmitError(errMsg);
        setNetworkError(errMsg);
      } finally {
        submitLockRef.current = false;
        setSubmitting(false);
      }
    },
    [attempt],
  );

  // Auto-expire countdown timer. A pause freezes the displayed clock.
  useEffect(() => {
    if (paused || remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      if (!hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        void handleFinalSubmit(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            void handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, handleFinalSubmit, paused]);

  const applyClock = useCallback((data: AttemptDetail) => {
    if (data.pausedAt && data.expiresAt) {
      const frozen = new Date(data.expiresAt).getTime() - new Date(data.pausedAt).getTime();
      setRemainingSeconds(Math.max(0, Math.floor(frozen / 1000)));
      setPaused(true);
      return;
    }
    setPaused(false);
    if (data.expiresAt) {
      const diffMs = new Date(data.expiresAt).getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.floor(diffMs / 1000)));
    }
  }, []);

  const setClockFromAttempt = useCallback(
    async (path: 'pause' | 'resume') => {
      if (!attempt || attempt.status !== 'in_progress') return false;
      if (path === 'pause') setPaused(true);
      try {
        const res = await fetch(`${API_URL}/exam-attempts/${attempt.id}/${path}`, {
          method: 'POST',
          headers: { 'X-CSRF-Protection': '1' },
          credentials: 'include',
        });
        if (!res.ok) throw new Error(path === 'pause' ? 'Could not pause the test.' : 'Could not resume the test.');
        const updated: AttemptDetail = await res.json();
        setAttempt(updated);
        applyClock(updated);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'The clock could not be updated.';
        setNetworkError(msg);
        if (path === 'pause') setPaused(false);
        return false;
      }
    },
    [attempt, applyClock],
  );

  const pauseTest = useCallback(() => setClockFromAttempt('pause'), [setClockFromAttempt]);
  const resumeTest = useCallback(() => setClockFromAttempt('resume'), [setClockFromAttempt]);

  const calculateQuestionElapsedSeconds = useCallback(
    (index: number) => {
      const current = attempt?.answers[index];
      if (!current) return 0;
      const elapsed = Math.max(0, Math.floor((Date.now() - questionOpenedAtRef.current) / 1000));
      return current.timeSpentSeconds + elapsed;
    },
    [attempt?.answers],
  );

  return {
    attempt,
    setAttempt,
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
    saveAnswerState,
    handleClearResponse,
    saveSectionTime,
    handleFinalSubmit,
    calculateQuestionElapsedSeconds,
  };
}
