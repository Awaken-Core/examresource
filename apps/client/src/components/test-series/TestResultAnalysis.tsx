import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../../lib/api";

type OptionReview = {
  id: string;
  content: string;
  translations?: Record<string, string>;
  isCorrect: boolean;
  isSelected: boolean;
};

type QuestionReviewItem = {
  questionId: string;
  questionIndex: number;
  sectionId?: string | null;
  status: string;
  isCorrect?: boolean | null;
  marksAwarded: number;
  maximumMarks: number;
  negativeMarks: number;
  timeSpentSeconds: number;
  difficulty?: string | null;
  topic?: string | null;
  type: string;
  content: string;
  translations?: Record<string, string>;
  explanation?: string | null;
  explanationTranslations?: Record<string, string>;
  numericalAnswer?: string | null;
  userNumericalValue?: string | null;
  userSelectedOptionIds?: string[];
  options: OptionReview[];
};

type SectionStat = {
  sectionId: string;
  name: string;
  marksAwarded: number;
  maximumMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  timeSpentSeconds: number;
};

type ChapterStrength = {
  name: string;
  accuracy: number;
  attempted: number;
};

type AnalysisData = {
  attemptId: string;
  testId: string;
  testTitle: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  endedAt?: string | null;
  timeSpentSeconds: number;
  durationMinutes?: number | null;
  summary: {
    score: number;
    maximumMarks: number;
    scorePercent: number;
    totalQuestions: number;
    attemptedCount: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    accuracy: number;
  };
  sections: SectionStat[];
  strongChapters: ChapterStrength[];
  needsRevisionChapters: ChapterStrength[];
  questionReview: QuestionReviewItem[];
};

type FilterKey = "all" | "correct" | "incorrect" | "skipped" | "marked";

export function TestResultAnalysis({ attemptId }: { attemptId: string }) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/me/exam-attempts/${attemptId}/analysis`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = `/login?redirect=/test-series/results/${attemptId}`;
            return;
          }
          if (res.status === 404) {
            throw new Error("This test attempt analysis was not found.");
          }
          throw new Error("Unable to load test attempt analysis.");
        }

        const payload = (await res.json()) as AnalysisData;
        setData(payload);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err.message || "Failed to load attempt analysis.");
      } finally {
        setLoading(false);
      }
    }

    void loadAnalysis();
    return () => controller.abort();
  }, [attemptId]);

  function formatTime(totalSeconds: number) {
    if (!totalSeconds || totalSeconds <= 0) return "0s";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  function toggleSolution(qId: string) {
    setExpandedSolutions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  }

  // Question filter logic
  const filteredQuestions = useMemo(() => {
    if (!data?.questionReview) return [];
    return data.questionReview.filter((q) => {
      const isMarked =
        q.status === "marked_for_review" ||
        q.status === "answered_and_marked_for_review";

      if (filter === "correct") return q.isCorrect === true;
      if (filter === "incorrect") return q.isCorrect === false && (q.status === "answered" || q.status === "answered_and_marked_for_review");
      if (filter === "skipped") return q.status === "not_answered" || q.status === "not_visited" || (q.isCorrect === null && !isMarked);
      if (filter === "marked") return isMarked;
      return true;
    });
  }, [data?.questionReview, filter]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 w-full rounded-2xl border border-border bg-surface p-6" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-32 rounded-2xl border border-border bg-surface" />
          <div className="h-32 rounded-2xl border border-border bg-surface" />
          <div className="h-32 rounded-2xl border border-border bg-surface" />
          <div className="h-32 rounded-2xl border border-border bg-surface" />
        </div>
        <div className="h-64 rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-500/30 bg-surface p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold text-white">Analysis Not Available</h1>
        <p className="mt-2 text-sm text-muted">{error || "Could not retrieve attempt analysis."}</p>
        <div className="mt-6 flex justify-center gap-3">
          <a
            href="/profile"
            className="inline-flex rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            Go to My Preparation
          </a>
          <a
            href="/test-series"
            className="inline-flex rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-surface-raised/80"
          >
            Explore Tests
          </a>
        </div>
      </div>
    );
  }

  const { summary } = data;
  const avgSecondsPerQ =
    summary.attemptedCount > 0
      ? Math.round(data.timeSpentSeconds / summary.attemptedCount)
      : null;

  const markedCount = data.questionReview.filter(
    (q) =>
      q.status === "marked_for_review" ||
      q.status === "answered_and_marked_for_review"
  ).length;

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER
          ───────────────────────────────────────────────────────────── */}
      <header className="space-y-3">
        <a
          href="/profile#my-tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition"
        >
          <span aria-hidden="true">←</span>
          <span>Back to My Preparation</span>
        </a>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Submitted
              </span>
              <span className="text-xs text-muted">
                Attempt #{data.attemptNumber}
              </span>
              {data.endedAt && (
                <span className="text-xs text-muted">
                  · {new Date(data.endedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {data.testTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/test-series/instructions/${data.testId}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90"
            >
              <span>Reattempt Test</span>
              <span aria-hidden="true">↻</span>
            </a>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          1. SCORE, PERCENTAGE, ATTEMPTED/CORRECT/WRONG/UNATTEMPTED
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="score-breakdown-heading" className="space-y-3">
        <h2 id="score-breakdown-heading" className="text-xs font-bold uppercase tracking-wider text-muted">
          1. Overall Score & Question Summary
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          {/* Top Banner with Main Score */}
          <div className="bg-gradient-to-r from-accent/20 via-accent/5 to-transparent p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-muted">Total Marks Scored</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                    {summary.score}
                  </span>
                  <span className="text-lg text-muted">
                    / {summary.maximumMarks} Max Marks
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-accent/40 bg-surface/90 px-6 py-4 text-center sm:text-right shadow-xs">
                <p className="text-xs font-medium text-muted">Score Percentage</p>
                <p className="mt-0.5 text-3xl font-extrabold text-accent">
                  {summary.scorePercent}%
                </p>
              </div>
            </div>

            {/* Distribution Stacked Bar */}
            <div className="mt-6">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  style={{ width: `${(summary.correctCount / summary.totalQuestions) * 100}%` }}
                  className="bg-emerald-500 transition-all"
                  title={`Correct: ${summary.correctCount}`}
                />
                <div
                  style={{ width: `${(summary.wrongCount / summary.totalQuestions) * 100}%` }}
                  className="bg-red-500 transition-all"
                  title={`Incorrect: ${summary.wrongCount}`}
                />
                <div
                  style={{ width: `${(summary.skippedCount / summary.totalQuestions) * 100}%` }}
                  className="bg-zinc-600 transition-all"
                  title={`Skipped: ${summary.skippedCount}`}
                />
              </div>
            </div>
          </div>

          {/* 4 Breakdown Metrics Bar */}
          <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 sm:grid-cols-4 divide-border border-t border-border">
            <div className="p-4 sm:p-5">
              <span className="text-xs text-muted">Attempted</span>
              <p className="mt-1 text-2xl font-extrabold text-white">
                {summary.attemptedCount}
                <span className="text-xs font-normal text-muted"> / {summary.totalQuestions}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted">Questions answered</p>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-xs text-emerald-400 font-semibold">✓ Correct</span>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                {summary.correctCount}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">Earned positive marks</p>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-xs text-red-400 font-semibold">✗ Incorrect</span>
              <p className="mt-1 text-2xl font-extrabold text-red-400">
                {summary.wrongCount}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">Negative penalties applied</p>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-xs text-muted font-semibold">○ Unattempted</span>
              <p className="mt-1 text-2xl font-extrabold text-muted">
                {summary.skippedCount}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">Skipped questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ACCURACY AND TIME USED
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="accuracy-time-heading" className="space-y-3">
        <h2 id="accuracy-time-heading" className="text-xs font-bold uppercase tracking-wider text-muted">
          2. Accuracy Rate & Time Management
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Accuracy Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Overall Test Accuracy</span>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  summary.accuracy >= 75
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : summary.accuracy >= 50
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}
              >
                {summary.accuracy >= 75
                  ? "High Accuracy"
                  : summary.accuracy >= 50
                  ? "Moderate Accuracy"
                  : "Needs Improvement"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-white">
                {summary.accuracy}%
              </span>
              <span className="text-xs text-muted">
                ({summary.correctCount} of {summary.attemptedCount} attempted)
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Accuracy measures the proportion of questions you answered correctly out of the questions you actively attempted.
            </p>
          </div>

          {/* Time Used Card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Total Time Utilized</span>
              <span className="text-xs text-muted">
                {data.durationMinutes ? `Allowed: ${data.durationMinutes}m` : "No limit"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-white">
                {formatTime(data.timeSpentSeconds)}
              </span>
              {avgSecondsPerQ !== null && (
                <span className="text-xs font-semibold text-accent">
                  · ~{avgSecondsPerQ}s / attempted question
                </span>
              )}
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {data.durationMinutes && data.timeSpentSeconds < data.durationMinutes * 60 * 0.8
                ? "You completed well ahead of the allotted time. Consider spending extra time reviewing doubtful questions."
                : "Good time pacing across the test duration."}
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. SECTION-WISE TABLE
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="section-table-heading" className="space-y-3">
        <h2 id="section-table-heading" className="text-xs font-bold uppercase tracking-wider text-muted">
          3. Section-Wise Performance Breakdown
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-raised/40 text-muted uppercase font-bold text-[11px] tracking-wider">
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Marks Scored</th>
                <th className="py-3 px-4 text-center">Correct</th>
                <th className="py-3 px-4 text-center">Wrong</th>
                <th className="py-3 px-4 text-center">Skipped</th>
                <th className="py-3 px-4 text-right">Accuracy</th>
                <th className="py-3 px-4 text-right">Time Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.sections.map((sec, idx) => (
                <tr key={sec.sectionId || idx} className="hover:bg-surface-raised/20 transition">
                  <td className="py-3.5 px-4 font-bold text-white">{sec.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {Number(sec.marksAwarded.toFixed(2))}
                    <span className="text-muted font-normal"> / {sec.maximumMarks}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">{sec.correctCount}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-red-400">{sec.wrongCount}</td>
                  <td className="py-3.5 px-4 text-center text-muted">{sec.skippedCount}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`font-bold ${
                        sec.accuracy >= 75
                          ? "text-emerald-400"
                          : sec.accuracy >= 50
                          ? "text-amber-300"
                          : "text-red-400"
                      }`}
                    >
                      {sec.accuracy}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-muted font-mono">{formatTime(sec.timeSpentSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. "STRONG" AND "NEEDS REVISION" CHAPTERS
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="chapter-strength-heading" className="space-y-3">
        <h2 id="chapter-strength-heading" className="text-xs font-bold uppercase tracking-wider text-muted">
          4. Chapter Diagnostic Strengths & Revision Alerts
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Needs Revision Chapters */}
          <div className="rounded-2xl border border-red-500/20 bg-surface p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/15 text-xs text-red-400 font-bold">
                !
              </span>
              <h3 className="text-sm font-bold text-white">Needs Revision Chapters (&lt; 60% accuracy)</h3>
            </div>

            {data.needsRevisionChapters.length === 0 ? (
              <p className="text-xs text-muted">
                No weak chapters identified in this test. All attempted chapters maintained solid accuracy!
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.needsRevisionChapters.map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{ch.name}</p>
                      <p className="text-[11px] text-muted">{ch.attempted} questions attempted</p>
                    </div>
                    <span className="font-bold text-red-400">{ch.accuracy}% accuracy</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strong Chapters */}
          <div className="rounded-2xl border border-emerald-500/20 bg-surface p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-xs text-emerald-400 font-bold">
                ✓
              </span>
              <h3 className="text-sm font-bold text-white">Strong Chapters (≥ 75% accuracy)</h3>
            </div>

            {data.strongChapters.length === 0 ? (
              <p className="text-xs text-muted">
                No chapters reached the 75% accuracy benchmark yet. Practice targeted topic tests to build strength.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.strongChapters.map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{ch.name}</p>
                      <p className="text-[11px] text-muted">{ch.attempted} questions attempted</p>
                    </div>
                    <span className="font-bold text-emerald-400">{ch.accuracy}% accuracy</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. QUESTION REVIEW WITH FILTERS
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="question-review-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="question-review-heading" className="text-xs font-bold uppercase tracking-wider text-muted">
              5. Comprehensive Question Review & Solutions
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Review each question with solutions, your answer vs the correct answer, and time spent.
            </p>
          </div>

          {/* Review Filter Pills */}
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-1">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All"
              count={summary.totalQuestions}
            />
            <FilterButton
              active={filter === "correct"}
              onClick={() => setFilter("correct")}
              label="Correct"
              count={summary.correctCount}
              activeColor="bg-emerald-500 text-white"
            />
            <FilterButton
              active={filter === "incorrect"}
              onClick={() => setFilter("incorrect")}
              label="Incorrect"
              count={summary.wrongCount}
              activeColor="bg-red-500 text-white"
            />
            <FilterButton
              active={filter === "skipped"}
              onClick={() => setFilter("skipped")}
              label="Skipped"
              count={summary.skippedCount}
            />
            {markedCount > 0 && (
              <FilterButton
                active={filter === "marked"}
                onClick={() => setFilter("marked")}
                label="Marked"
                count={markedCount}
                activeColor="bg-amber-500 text-white"
              />
            )}
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-xs text-muted">
            No questions match the "{filter}" filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isSolutionOpen = Boolean(expandedSolutions[q.questionId]);
              const isCorrect = q.isCorrect === true;
              const isWrong = q.isCorrect === false && (q.status === "answered" || q.status === "answered_and_marked_for_review");

              return (
                <div
                  key={q.questionId}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4 transition hover:border-border/80"
                >
                  {/* Question header row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-raised text-xs font-bold text-white">
                        Q{q.questionIndex}
                      </span>
                      {q.difficulty && (
                        <span className="rounded-md border border-border bg-surface-raised px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                          {q.difficulty}
                        </span>
                      )}
                      {q.topic && (
                        <span className="text-[11px] text-muted">
                          {q.topic}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-muted">
                        ⏱️ {formatTime(q.timeSpentSeconds)}
                      </span>

                      {isCorrect ? (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                          ✓ Correct (+{q.marksAwarded})
                        </span>
                      ) : isWrong ? (
                        <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-400">
                          ✗ Incorrect ({q.negativeMarks ? `-${q.negativeMarks}` : "0"})
                        </span>
                      ) : (
                        <span className="rounded-md border border-border bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-muted">
                          ○ Skipped
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-sm font-medium leading-relaxed text-white">
                    {q.content}
                  </div>

                  {/* Question Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isStudentChoice = opt.isSelected;
                        const isActualCorrect = opt.isCorrect;

                        let borderClass = "border-border bg-surface-raised/40 text-muted";
                        if (isActualCorrect) {
                          borderClass = "border-emerald-500/50 bg-emerald-500/10 text-white font-semibold";
                        } else if (isStudentChoice && !isActualCorrect) {
                          borderClass = "border-red-500/50 bg-red-500/10 text-white";
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-3 rounded-xl border p-3 text-xs transition ${borderClass}`}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-surface font-bold text-[10px]">
                              {optLetter}
                            </span>
                            <div className="flex-1 min-w-0">{opt.content}</div>
                            {isActualCorrect && (
                              <span className="shrink-0 font-bold text-emerald-400 text-[11px]">
                                Correct Answer
                              </span>
                            )}
                            {isStudentChoice && !isActualCorrect && (
                              <span className="shrink-0 font-bold text-red-400 text-[11px]">
                                Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Numerical answer if applicable */}
                  {q.type === "numerical" && (
                    <div className="rounded-xl border border-border bg-surface-raised/40 p-3 text-xs space-y-1">
                      <p className="text-muted">
                        Correct Numerical Answer:{" "}
                        <span className="font-bold text-emerald-400">{q.numericalAnswer}</span>
                      </p>
                      {q.userNumericalValue && (
                        <p className="text-muted">
                          Your Input:{" "}
                          <span className={`font-bold ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                            {q.userNumericalValue}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Explanation Toggle */}
                  <div className="border-t border-border/60 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleSolution(q.questionId)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                    >
                      <span>{isSolutionOpen ? "Hide Solution" : "View Detailed Solution"}</span>
                      <span aria-hidden="true">{isSolutionOpen ? "↑" : "↓"}</span>
                    </button>

                    {isSolutionOpen && (
                      <div className="mt-3 rounded-xl border border-border bg-surface-raised/60 p-4 text-xs space-y-1.5">
                        <p className="font-bold text-accent uppercase tracking-wider text-[10px]">
                          Explanation & Solution Notes
                        </p>
                        <div className="leading-relaxed text-muted whitespace-pre-line">
                          {q.explanation || "No explanation text provided for this question."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. CLEAR NEXT ACTIONS: Reattempt, practice weak, take next
          ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="next-actions-heading" className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <h2 id="next-actions-heading" className="text-base font-bold text-white">
          6. Recommended Next Actions
        </h2>
        <p className="mt-1 text-xs text-muted">
          Keep your momentum going. Choose the best next step to improve your test scores.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <a
            href={`/test-series/instructions/${data.testId}`}
            className="flex flex-col justify-between rounded-xl border border-border bg-surface-raised/50 p-4 transition hover:border-accent hover:bg-surface-raised group"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-accent">
                Reattempt This Test
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Retry the same paper to verify your retention of the correct solutions.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-accent">Start Reattempt →</span>
          </a>

          <a
            href="/profile#weak-topics"
            className="flex flex-col justify-between rounded-xl border border-border bg-surface-raised/50 p-4 transition hover:border-accent hover:bg-surface-raised group"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-accent">
                Practice Weak Chapters
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Focus revision on chapters where accuracy fell below the 60% threshold.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-accent">Review Weak Topics →</span>
          </a>

          <a
            href="/test-series"
            className="flex flex-col justify-between rounded-xl border border-border bg-surface-raised/50 p-4 transition hover:border-accent hover:bg-surface-raised group"
          >
            <div>
              <p className="text-xs font-bold text-white group-hover:text-accent">
                Take Next Mock Test
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Explore the test catalog to attempt a fresh sectional or full mock paper.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-accent">Browse Test Catalog →</span>
          </a>
        </div>
      </section>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  activeColor = "bg-accent text-white",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? `${activeColor} shadow-xs`
          : "text-muted hover:bg-surface-raised hover:text-white"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-1 opacity-80 text-[11px]">({count})</span>
      )}
    </button>
  );
}
