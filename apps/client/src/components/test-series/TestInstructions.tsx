import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/api';

export interface SectionRule {
  id?: string;
  name: string;
  topic?: string | null;
  durationMinutes?: number | null;
  positiveMarks: number;
  negativeMarks: number;
  requiredQuestionCount?: number;
  questionsCount?: number;
}

export interface TestInstructionsData {
  id: string;
  _id?: string;
  title: string;
  description?: string | null;
  testMode: 'subject' | 'chapter' | 'full';
  access: 'free' | 'premium';
  durationMinutes?: number | null;
  totalQuestionsCount: number;
  positiveMarks: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  maxAttempts?: number | null;
  languages: string[];
  instructions?: string | null;
  version: number;
  sections?: SectionRule[];
}

interface Props {
  testId: string;
}

export function TestInstructions({ testId }: Props) {
  const [test, setTest] = useState<TestInstructionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTest() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/test-series/tests/${testId}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Test was not found or is currently unavailable.'
              : `Unable to load test instructions (status ${res.status})`,
          );
        }
        const data = await res.json();
        setTest(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load test details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadTest();
  }, [testId]);

  const handleStartTest = async () => {
    if (!confirmed || starting || !test) return;
    setStarting(true);
    setStartError(null);

    try {
      const res = await fetch(`${API_URL}/exams/${test.id}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
      });

      if (res.status === 401 || res.status === 403) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || 'Unable to start test attempt. Check permissions or attempt limits.',
        );
      }

      const attempt = await res.json();
      const attemptId = attempt.id || attempt._id;
      // Navigate to the CBT Test Runner
      window.location.href = `/test-series/cbt/${attemptId}`;
    } catch (err: any) {
      setStartError(err.message || 'Failed to initialize test attempt.');
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin"></div>
        <p className="text-xs text-muted">Loading examination guidelines and test parameters...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center max-w-lg mx-auto space-y-3 my-8">
        <svg
          className="w-8 h-8 text-rose-500 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-sm font-semibold text-rose-200">
          {error || 'Test details could not be loaded.'}
        </p>
        <a
          href="/test-series"
          className="inline-block text-xs font-semibold text-[#2563EB] hover:underline"
        >
          &larr; Back to Test Series
        </a>
      </div>
    );
  }

  const sections = test.sections || [];
  const isFull = test.testMode === 'full';
  const totalQuestions = test.totalQuestionsCount;
  const estimatedMarks =
    isFull && sections.length > 0
      ? sections.reduce(
          (sum, s) =>
            sum + (s.questionsCount || s.requiredQuestionCount || 0) * (s.positiveMarks || 1),
          0,
        )
      : totalQuestions * (test.positiveMarks || 1);

  return (
    <div className="w-full space-y-6 py-2">
      {/* Test Meta Header */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-surface-raised border border-border text-slate-700 dark:text-slate-300">
            {isFull
              ? 'Full Length Mock Paper'
              : test.testMode === 'chapter'
                ? 'Chapter Practice Test'
                : 'Subject Practice Test'}
          </span>
          <span className="text-xs text-muted">Version {test.version}</span>
          {test.access === 'free' ? (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Free Access
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              Premium Paper
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {test.title}
          </h1>
          {test.description && (
            <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">{test.description}</p>
          )}
        </div>

        {/* 4 Overview Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-surface-raised/40 border border-border/80 rounded-xl p-3">
            <span className="text-[11px] text-muted block">Total Questions</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {totalQuestions} Questions
            </span>
          </div>
          <div className="bg-surface-raised/40 border border-border/80 rounded-xl p-3">
            <span className="text-[11px] text-muted block">Duration</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {test.durationMinutes ? `${test.durationMinutes} Minutes` : 'Untimed'}
            </span>
          </div>
          <div className="bg-surface-raised/40 border border-border/80 rounded-xl p-3">
            <span className="text-[11px] text-muted block">Total Marks</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {estimatedMarks} Marks
            </span>
          </div>
          <div className="bg-surface-raised/40 border border-border/80 rounded-xl p-3">
            <span className="text-[11px] text-muted block">Languages</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {test.languages?.join(', ') || 'English, Hindi'}
            </span>
          </div>
        </div>
      </section>

      {/* Sections Table for Full Tests */}
      {isFull && sections.length > 0 && (
        <section className="bg-surface border border-border rounded-2xl p-6 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Sectional Structure & Timing
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Section Name</th>
                  <th className="py-2.5 px-3">Questions</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Marking Scheme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sections.map((sec, idx) => (
                  <tr key={idx} className="hover:bg-surface-raised/30">
                    <td className="py-2.5 px-3 text-muted">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {sec.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {sec.questionsCount || sec.requiredQuestionCount || '-'} Qs
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {sec.durationMinutes ? `${sec.durationMinutes} mins` : 'Shared'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      +{sec.positiveMarks || test.positiveMarks || 1}
                      {test.negativeMarkingEnabled && sec.negativeMarks > 0
                        ? ` / -${sec.negativeMarks}`
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Examination Instructions */}
      <section className="bg-surface border border-border rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          General Examination Instructions
        </h2>

        {test.instructions ? (
          <div className="text-xs text-muted leading-relaxed whitespace-pre-wrap bg-surface-raised/30 p-4 rounded-xl border border-border/60">
            {test.instructions}
          </div>
        ) : (
          <div className="space-y-2.5 text-xs text-muted leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <p>
                The countdown clock in the top banner will display the remaining time available for
                completing the examination.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <p>
                When the overall exam timer expires, your test will be automatically submitted with
                your currently saved answers.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <p>Question palette states:</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-7 pt-1 text-[11px] text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-600"></span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-rose-500"></span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-purple-500"></span>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <span className="w-3.5 h-3.5 rounded bg-indigo-500"></span>
                <span>Answered & Marked</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-1">
              <span className="w-5 h-5 rounded-full bg-[#2563EB]/20 text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                4
              </span>
              <p>
                Negative marking:{' '}
                {test.negativeMarkingEnabled && test.negativeMarks > 0
                  ? `Each incorrect answer will incur a penalty of -${test.negativeMarks} marks.`
                  : 'No negative marking is applied for this test.'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Confirmation & Start Action */}
      <section className="bg-surface border border-border rounded-2xl p-6 shadow-2xs space-y-4">
        {startError && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
            {startError}
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-border text-[#2563EB] focus:ring-[#2563EB]"
          />
          <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            I have read and understood all the examination instructions above. I declare that I will
            follow the rules of the test honestly and acknowledge that closing or navigating away
            may automatically submit my attempt.
          </span>
        </label>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border/80">
          <a
            href="/test-series"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border text-muted hover:text-white text-center"
          >
            Cancel & Return
          </a>

          <button
            type="button"
            disabled={!confirmed || starting}
            onClick={handleStartTest}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              confirmed && !starting
                ? 'bg-[#2563EB] text-white hover:bg-blue-600 shadow-2xs active:scale-[0.98]'
                : 'bg-surface-raised border border-border text-muted/50 cursor-not-allowed'
            }`}
          >
            {starting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Initializing Test Environment...</span>
              </>
            ) : (
              <>
                <span>I am Ready to Begin</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
