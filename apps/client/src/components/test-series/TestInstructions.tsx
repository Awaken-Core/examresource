import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/api';
import { BrandMark } from '../BrandMark';
import { CBTStatusShape } from './CBTStatusShape';
import { TestSeriesPassCard } from './TestSeriesPassCard';

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
  initialData?: TestInstructionsData | null;
  siteName?: string;
}

export function TestInstructions({ testId, initialData, siteName = 'GovtPariksha' }: Props) {
  const [test, setTest] = useState<TestInstructionsData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // 2-Step Instruction Flow
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi'>('English');
  const [confirmed, setConfirmed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [passRequired, setPassRequired] = useState(false);

  // Candidate Profile
  const [candidateName, setCandidateName] = useState('Shivam');
  const [candidateAvatar, setCandidateAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${API_URL}/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((user: { name?: string; avatarUrl?: string; avatar?: string } | null) => {
        if (cancelled || !user?.name?.trim()) return;
        setCandidateName(user.name.trim());
        if (user.avatarUrl || user.avatar) {
          setCandidateAvatar(user.avatarUrl || user.avatar);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const matchesInitial =
      initialData &&
      (initialData.id === testId ||
        (initialData as any)._id === testId ||
        (initialData as any).slug?.toLowerCase() === testId.toLowerCase() ||
        Boolean(initialData.id || (initialData as any)._id));

    if (matchesInitial) {
      setTest(initialData);
      setIsLoading(false);
      return;
    }

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
  }, [testId, initialData]);

  const handleStartTest = async () => {
    if (!confirmed || starting || !test) return;
    setStarting(true);
    setStartError(null);
    setPassRequired(false);

    try {
      // Save default language preference
      try {
        localStorage.setItem('cbt_default_language', selectedLanguage);
      } catch {
        /* storage may fail in restricted iframes */
      }

      const res = await fetch(`${API_URL}/exams/${test.id}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
      });

      if (res.status === 402) {
        setPassRequired(true);
        setStarting(false);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        const loginUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        void import('astro:transitions/client')
          .then(({ navigate }) => navigate(loginUrl))
          .catch(() => {
            window.location.href = loginUrl;
          });
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to start this test. Please try again.');
      }

      const attempt = await res.json();
      const attemptId = attempt.id || attempt._id;

      // Mark conduct as agreed in session
      try {
        sessionStorage.setItem(`cbt-conduct:${attemptId}`, '1');
      } catch {
        /* ignore */
      }

      // Navigate to the CBT Test Runner via ClientRouter
      const cbtUrl = `/test-series/cbt/${attemptId}`;
      void import('astro:transitions/client')
        .then(({ navigate }) => navigate(cbtUrl))
        .catch(() => {
          window.location.href = cbtUrl;
        });
    } catch (err: any) {
      setStartError(err.message || 'Failed to initialize test attempt.');
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-canvas p-6 space-y-4">
        <div className="h-10 w-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-muted">Loading examination instructions...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-canvas p-4">
        <div className="max-w-md w-full bg-surface border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 shadow-lg">
          <svg className="w-10 h-10 text-rose-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-semibold text-heading">{error || 'Test details could not be loaded.'}</p>
          <a
            href="/test-series"
            className="inline-block rounded-xl bg-accent px-5 py-2 text-xs font-bold text-on-accent hover:opacity-90 transition"
          >
            &larr; Back to Test Series
          </a>
        </div>
      </div>
    );
  }

  const sections = test.sections || [];
  const totalQuestions = test.totalQuestionsCount;
  const duration = test.durationMinutes || 120;
  const positiveMarks = test.positiveMarks || 1;
  const negativeMarks = test.negativeMarkingEnabled ? (test.negativeMarks || 0.25) : 0;
  const totalMarks =
    test.testMode === 'full' && sections.length > 0
      ? sections.reduce(
          (sum, s) =>
            sum + (s.questionsCount || s.requiredQuestionCount || 0) * (s.positiveMarks || 1),
          0,
        )
      : totalQuestions * positiveMarks;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas text-slate-900 select-none dark:text-slate-100">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark size={28} className="shrink-0" />
          <div className="min-w-0">
            <span className="font-extrabold tracking-tight text-accent text-sm sm:text-base mr-2">
              {siteName}
            </span>
            <span className="truncate text-xs sm:text-sm font-medium text-heading">
              {test.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-raised border border-border px-3 py-1 text-[11px] font-semibold text-muted">
            {step === 1 ? 'Step 1 of 2: General Instructions' : 'Step 2 of 2: Exam Specific Rules'}
          </span>
        </div>
      </header>

      {/* ── Two-Column Instruction Workspace ──────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ── Left Column: Instruction Content ──────────────────────── */}
        <main
          data-lenis-prevent
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 custom-scrollbar border-border md:border-r bg-canvas"
        >
          {step === 1 ? (
            /* ────────────────────────────────────────────────────────
               STEP 1: GENERAL INSTRUCTIONS (Image 1 reference)
               ──────────────────────────────────────────────────────── */
            <div className="max-w-3xl space-y-6 text-xs sm:text-sm text-heading leading-relaxed">
              <h1 className="text-base sm:text-lg font-bold text-heading">
                General Instructions:
              </h1>

              <div className="space-y-4">
                <p>
                  <strong>1.</strong> The clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.
                </p>

                <p>
                  <strong>2.</strong> The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                </p>

                <div className="space-y-3 pl-2 sm:pl-4">
                  <div className="flex items-center gap-3.5">
                    <CBTStatusShape status="not_visited" size="md" />
                    <span>You have not visited the question yet.</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <CBTStatusShape status="not_answered" size="md" />
                    <span>You have not answered the question.</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <CBTStatusShape status="answered" size="md" />
                    <span>You have answered the question.</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <CBTStatusShape status="marked_for_review" size="md" />
                    <span>You have NOT answered the question, but have marked the question for review.</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <CBTStatusShape status="answered_and_marked_for_review" size="md" />
                    <span>You have answered the question, but marked it for review.</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface-raised/40 p-3.5 text-xs text-muted leading-relaxed">
                  The <strong>Mark For Review</strong> status for a question simply indicates that you would like to look at that question again. If a question is answered, but marked for review, then the answer will be considered for evaluation unless the status is modified by the candidate.
                </div>
              </div>

              {/* Navigating to a Question */}
              <div className="space-y-3 pt-2">
                <h2 className="font-bold text-heading text-sm sm:text-base">
                  Navigating to a Question :
                </h2>
                <p>
                  <strong>3.</strong> To answer a question, do the following:
                </p>
                <div className="space-y-2 pl-4 text-muted">
                  <p>
                    <strong>1.</strong> Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.
                  </p>
                  <p>
                    <strong>2.</strong> Click on <strong>Save &amp; Next</strong> to save your answer for the current question and then go to the next question.
                  </p>
                  <p>
                    <strong>3.</strong> Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current question and also mark it for review, and then go to the next question.
                  </p>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Note that your answer for the current question will not be saved, if you navigate to another question directly by clicking on a question number without saving the answer to the previous question.
                </p>
                <p className="text-muted">
                  You can view all the questions by clicking on the <strong>Question Paper</strong> button. This feature is provided, so that if you want you can just see the entire question paper at a glance.
                </p>
              </div>

              {/* Answering a Question */}
              <div className="space-y-3 pt-2">
                <h2 className="font-bold text-heading text-sm sm:text-base">
                  Answering a Question :
                </h2>
                <p>
                  <strong>4.</strong> Procedure for answering a multiple choice (MCQ) type question:
                </p>
                <div className="space-y-2 pl-4 text-muted">
                  <p>
                    <strong>1.</strong> Choose one answer from the options given below the question, click on the bubble placed before the chosen option.
                  </p>
                  <p>
                    <strong>2.</strong> To deselect your chosen answer, click on the bubble of the chosen option again or click on the <strong>Clear Response</strong> button.
                  </p>
                  <p>
                    <strong>3.</strong> To change your chosen answer, click on the bubble of another option.
                  </p>
                  <p>
                    <strong>4.</strong> To save your answer, you MUST click on the <strong>Save &amp; Next</strong> button.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ────────────────────────────────────────────────────────
               STEP 2: SPECIFIC INSTRUCTIONS (Image 3 reference)
               ──────────────────────────────────────────────────────── */
            <div className="max-w-3xl space-y-6 text-xs sm:text-sm text-heading leading-relaxed">
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-heading tracking-tight">
                  {test.title}
                </h1>
                <div className="flex flex-wrap items-center justify-between border-b border-border py-2 text-xs sm:text-sm font-semibold text-muted">
                  <span>Duration: {duration} Mins</span>
                  <span>Maximum Marks: {totalMarks}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="font-bold text-heading text-sm sm:text-base">
                  Read the following instructions carefully.
                </h2>
                <div className="space-y-2 pl-2 text-muted">
                  <p><strong>1.</strong> The test contains {totalQuestions} total questions.</p>
                  <p><strong>2.</strong> Each question has 4 options out of which only one is correct (unless MSQ is indicated).</p>
                  <p><strong>3.</strong> You have to finish the test in {duration} minutes.</p>
                  <p>
                    <strong>4.</strong> You will be awarded +{positiveMarks} mark for each correct answer and{' '}
                    {negativeMarks > 0
                      ? `-${negativeMarks} will be deducted for each wrong answer.`
                      : 'there is no negative marking.'}
                  </p>
                  <p><strong>5.</strong> There is no negative marking for the questions that you have not attempted.</p>
                  <p>
                    <strong>6.</strong> You can write this test only once. Make sure that you complete the test before you submit the test and/or close the browser.
                  </p>
                </div>
              </div>

              {/* Sections Table if Full Mock */}
              {sections.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-heading text-xs uppercase tracking-wider">
                    Sectional Breakdown
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-raised border-b border-border text-muted">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Section Name</th>
                          <th className="py-2 px-3">Questions</th>
                          <th className="py-2 px-3">Duration</th>
                          <th className="py-2 px-3">Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {sections.map((sec, idx) => (
                          <tr key={idx} className="hover:bg-surface-raised/40">
                            <td className="py-2 px-3 text-muted">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-heading">{sec.name}</td>
                            <td className="py-2 px-3 text-muted">
                              {sec.questionsCount || sec.requiredQuestionCount || '-'} Qs
                            </td>
                            <td className="py-2 px-3 text-muted">
                              {sec.durationMinutes ? `${sec.durationMinutes} mins` : 'Shared'}
                            </td>
                            <td className="py-2 px-3 text-muted">
                              +{sec.positiveMarks || positiveMarks}
                              {negativeMarks > 0 ? ` / -${sec.negativeMarks || negativeMarks}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Choose Default Language */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="default-lang-select" className="font-bold text-heading">
                    Choose your default language:
                  </label>
                  <select
                    id="default-lang-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as 'English' | 'Hindi')}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-heading cursor-pointer focus:ring-1 focus:ring-accent"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Please note all questions will appear in your default language. This language can be changed for a particular question later on.
                </p>
              </div>

              {/* Declaration Checkbox */}
              <div className="border-t border-border pt-4 space-y-2">
                <h3 className="font-bold text-heading">Declaration:</h3>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                  />
                  <span className="text-xs leading-relaxed text-muted">
                    I have understood and agree to all the instructions. I declare that I will follow the examination code of conduct honestly and acknowledge that closing or navigating away may automatically submit my attempt.
                  </span>
                </label>
              </div>

              {/* Pass Card or Error */}
              {passRequired && (
                <div className="pt-2">
                  <TestSeriesPassCard variant="instructions" onPurchased={() => void handleStartTest()} />
                </div>
              )}

              {startError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300">
                  {startError}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Right Column: Candidate Profile Panel ────────────────── */}
        <aside
          className="flex min-h-0 flex-col items-center justify-start border-t md:border-t-0 p-6 bg-surface space-y-4"
          aria-label="Candidate Information"
        >
          {candidateAvatar ? (
            <img
              src={candidateAvatar}
              alt={candidateName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover border-2 border-border shadow-xs"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 text-accent font-black text-2xl border-2 border-accent/30 shadow-xs">
              {candidateName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="text-center space-y-1">
            <p className="text-base font-bold text-heading">{candidateName}</p>
            <p className="text-xs text-muted">Candidate Roll No.</p>
            <span className="inline-block rounded-md bg-surface-raised border border-border px-2.5 py-0.5 font-mono text-[11px] font-semibold text-muted">
              CBT-2026-ROLL
            </span>
          </div>

          <div className="w-full pt-4 border-t border-border space-y-2 text-xs text-muted">
            <div className="flex justify-between">
              <span>Test Mode:</span>
              <span className="font-semibold text-heading uppercase text-[11px]">
                {test.testMode}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Questions:</span>
              <span className="font-semibold text-heading">{totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-semibold text-heading">{duration} Mins</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Bottom Fixed Action Navigation Bar ────────────────────── */}
      <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border bg-surface px-4 sm:px-6">
        {step === 1 ? (
          <>
            <a
              href="/test-series"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted hover:text-heading transition"
            >
              <span>&larr;</span>
              <span>Go to Tests</span>
            </a>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg bg-sky-600 dark:bg-sky-500 text-white px-6 py-2 text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 active:scale-98 transition cursor-pointer"
            >
              Next &rarr;
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-4 py-2 text-xs sm:text-sm font-semibold text-muted hover:text-heading active:scale-98 transition cursor-pointer"
            >
              <span>&larr;</span>
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={!confirmed || starting}
              onClick={handleStartTest}
              className={`rounded-lg px-6 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                confirmed && !starting
                  ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs hover:opacity-90 active:scale-98'
                  : 'bg-surface-raised border border-border text-muted/50 cursor-not-allowed'
              }`}
            >
              {starting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Initializing Examination...</span>
                </>
              ) : (
                <span>I am ready to begin</span>
              )}
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
