import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../../../lib/api';
import type { AttemptDetail, PublishedTestMetadata, QuestionPaletteStatus } from '../types/cbt';

interface UseCBTAttemptProps {
  readonly attemptId: string;
}

export function useCBTAttempt({ attemptId }: UseCBTAttemptProps) {
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [testMeta, setTestMeta] = useState<PublishedTestMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [savingAction, setSavingAction] = useState<
    'save_and_next' | 'mark_review' | 'clear' | null
  >(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Submit modal state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
        window.location.replace(`/test-series/results/${targetId}`);
        return;
      }

      if (data.expiresAt) {
        const diffMs = new Date(data.expiresAt).getTime() - Date.now();
        const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
        setRemainingSeconds(diffSecs);
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
    async (
      index: number,
      payload: {
        readonly status?: QuestionPaletteStatus;
        readonly optionIds?: readonly string[];
        readonly numericalValue?: string | null;
        readonly timeSpentSeconds?: number;
      },
    ): Promise<boolean> => {
      if (attempt?.status !== 'in_progress') return false;
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
              optionIds: payload.optionIds ?? ans.optionIds,
              numericalValue:
                payload.numericalValue !== undefined ? payload.numericalValue : ans.numericalValue,
              status: payload.status ?? ans.status,
              timeSpentSeconds: payload.timeSpentSeconds ?? ans.timeSpentSeconds,
            }),
          },
        );

        if (!res.ok) {
          throw new Error('Failed to save response to server. Please retry.');
        }

        const updatedAttempt: AttemptDetail = await res.json();
        setAttempt(updatedAttempt);
        questionOpenedAtRef.current = Date.now();
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Network error saving response. Please retry.';
        setNetworkError(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [attempt],
  );

  // Clear Response
  const handleClearResponse = useCallback(
    async (currentIndex: number): Promise<boolean> => {
      if (!attempt || isSaving || submitting) return false;
      const activeAnswer = attempt.answers[currentIndex];
      if (!activeAnswer) return false;

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

        const updatedAttempt: AttemptDetail = await res.json();
        setAttempt(updatedAttempt);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error clearing response. Please retry.';
        setNetworkError(msg);
        return false;
      } finally {
        setIsSaving(false);
        setSavingAction(null);
      }
    },
    [attempt, isSaving, submitting],
  );

  // Save Section Time
  const saveSectionTime = useCallback(
    async (sectionId: string | null | undefined): Promise<boolean> => {
      if (!attempt || !sectionId) return true;
      const section = attempt.sectionProgress.find((item) => item.sectionId === sectionId);
      if (!section) return true;

      const elapsed = Math.max(0, Math.floor((Date.now() - sectionOpenedAtRef.current) / 1000));

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
        setAttempt(updated);
        sectionOpenedAtRef.current = Date.now();
        return true;
      } catch {
        return false;
      }
    },
    [attempt],
  );

  // Final Submit
  const handleFinalSubmit = useCallback(
    async (isAutoExpire = false) => {
      if (!attempt || submitting) return;
      setSubmitting(true);
      setSubmitError(null);

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
        const targetId = finalized.id || finalized._id || attempt.id;
        window.location.replace(`/test-series/results/${targetId}`);
      } catch (err: unknown) {
        if (isAutoExpire) {
          const recheck = await fetch(`${API_URL}/exam-attempts/${attempt.id}`, {
            credentials: 'include',
          });
          if (recheck.ok) {
            const finalData: AttemptDetail = await recheck.json();
            const targetId = finalData.id || finalData._id || attempt.id;
            window.location.replace(`/test-series/results/${targetId}`);
            return;
          }
        }
        const errMsg =
          err instanceof Error
            ? err.message
            : 'Error submitting test attempt. Please check your connection and retry.';
        setSubmitError(errMsg);
        setNetworkError(errMsg);
      } finally {
        setSubmitting(false);
      }
    },
    [attempt, submitting],
  );

  // Auto-expire countdown timer
  useEffect(() => {
    if (remainingSeconds === null) return;
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
  }, [remainingSeconds, handleFinalSubmit]);

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
  };
}
