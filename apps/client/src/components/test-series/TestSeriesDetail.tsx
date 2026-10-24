import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../../lib/api';

export interface Chapter {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  order: number;
  status: string;
}

export interface AssignedSubject {
  id: string;
  _id?: string;
  subjectId: string;
  name: string;
  slug: string;
  customDisplayName?: string;
  description?: string | null;
  iconUrl?: string | null;
  order: number;
  chapters: Chapter[];
}

export interface TestSeriesDetailData {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description?: string | null;
  targetExam: string;
  category: string;
  organization?: string | null;
  status: string;
  accessType: 'free' | 'premium' | 'freemium';
  supportedLanguages: string[];
  badge?: string | null;
  logoUrl?: string | null;
  order: number;
  subjects: AssignedSubject[];
}

export interface SectionSummary {
  id?: string;
  name: string;
  durationMinutes?: number | null;
  positiveMarks: number;
  negativeMarks: number;
  questionsCount?: number;
}

export interface PublishedTestItem {
  id: string;
  _id?: string;
  title: string;
  description?: string | null;
  testMode: 'subject' | 'chapter' | 'full';
  subjectId?: string | null;
  chapterId?: string | null;
  access: 'free' | 'premium';
  durationMinutes?: number | null;
  totalQuestionsCount: number;
  positiveMarks: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  languages: string[];
  version: number;
  availableFrom?: string | null;
  availableTo?: string | null;
  sections?: SectionSummary[];
}

export interface LatestAttemptMeta {
  id: string;
  attemptNumber: number;
  status: 'in_progress' | 'submitted' | 'abandoned';
  startedAt: string;
  endedAt?: string | null;
  timeSpentSeconds: number;
  marksAwarded?: number;
  maximumMarks?: number;
  scorePercent?: number;
}

export interface LearnerSeriesPrep {
  series: {
    id: string;
    title: string;
    slug: string;
    category: string;
    targetExam: string;
  };
  totalTestsCount: number;
  completedTestsCount: number;
  inProgressTestsCount: number;
  unattemptedTestsCount: number;
  averageScorePercent: number | null;
  averageAccuracy: number | null;
  tests: Array<{
    id: string;
    title: string;
    testMode: string;
    type: string;
    durationMinutes: number;
    totalMarks: number;
    latestAttempt?: LatestAttemptMeta | null;
  }>;
}

interface Props {
  seriesIdOrSlug: string;
}

type TabType = 'all' | 'subject' | 'chapter' | 'full';

export function TestSeriesDetail({ seriesIdOrSlug }: Props) {
  const [series, setSeries] = useState<TestSeriesDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Learner series progress state (after login)
  const [learnerPrep, setLearnerPrep] = useState<LearnerSeriesPrep | null>(null);

  // Tab: 'all' | 'subject' | 'chapter' | 'full'
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // All tests state
  const [allTests, setAllTests] = useState<PublishedTestItem[]>([]);
  const [loadingAllTests, setLoadingAllTests] = useState(false);

  // Subject-wise state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectTests, setSubjectTests] = useState<PublishedTestItem[]>([]);
  const [loadingSubjectTests, setLoadingSubjectTests] = useState(false);

  // Chapter-wise state
  const [chapterSubjectId, setChapterSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [chapterTests, setChapterTests] = useState<PublishedTestItem[]>([]);
  const [loadingChapterTests, setLoadingChapterTests] = useState(false);

  // Full tests state
  const [fullTests, setFullTests] = useState<PublishedTestItem[]>([]);
  const [loadingFullTests, setLoadingFullTests] = useState(false);

  // Load series details
  useEffect(() => {
    async function loadSeries() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/test-series/${seriesIdOrSlug}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Test series was not found or is currently not published.'
              : `Unable to load test series (status ${res.status})`
          );
        }
        const data = await res.json();
        setSeries(data);

        // Pre-select first subject if available
        if (data.subjects && data.subjects.length > 0) {
          const firstSub = data.subjects[0];
          setSelectedSubjectId(firstSub.subjectId);
          setChapterSubjectId(firstSub.subjectId);
          if (firstSub.chapters && firstSub.chapters.length > 0) {
            setSelectedChapterId(firstSub.chapters[0].id || firstSub.chapters[0]._id || null);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch test series.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSeries();
  }, [seriesIdOrSlug]);

  // Load Learner's Personal Preparation Progress for this Series
  useEffect(() => {
    if (!series) return;
    const seriesId = series.id || series._id;
    if (!seriesId) return;

    async function fetchPrepData() {
      try {
        const res = await fetch(`${API_URL}/me/preparation/series/${seriesId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = (await res.json()) as LearnerSeriesPrep;
          setLearnerPrep(data);
        }
      } catch {
        // Non-fatal if student is not signed in
      }
    }

    void fetchPrepData();
  }, [series]);

  // Create fast map of latest attempt by test ID
  const testAttemptMap = useMemo(() => {
    const map = new Map<string, LatestAttemptMeta>();
    if (!learnerPrep?.tests) return map;
    for (const item of learnerPrep.tests) {
      if (item.latestAttempt) {
        map.set(item.id, item.latestAttempt);
      }
    }
    return map;
  }, [learnerPrep]);

  // Find active attempt in progress if any
  const activeAttemptInProgress = useMemo(() => {
    if (!learnerPrep?.tests) return null;
    return learnerPrep.tests.find((t) => t.latestAttempt?.status === 'in_progress');
  }, [learnerPrep]);

  // Load All tests when 'all' tab is selected
  useEffect(() => {
    if (!series || activeTab !== 'all') return;
    async function fetchAll() {
      setLoadingAllTests(true);
      try {
        const res = await fetch(`${API_URL}/test-series/${series!.id || series!._id}/tests`);
        if (res.ok) {
          const tests = await res.json();
          setAllTests(tests || []);
        } else {
          setAllTests([]);
        }
      } catch {
        setAllTests([]);
      } finally {
        setLoadingAllTests(false);
      }
    }
    fetchAll();
  }, [series, activeTab]);

  // Load Subject-wise tests
  useEffect(() => {
    if (!series || !selectedSubjectId || activeTab !== 'subject') return;
    async function fetchSubTests() {
      setLoadingSubjectTests(true);
      try {
        const res = await fetch(
          `${API_URL}/test-series/${series!.id || series!._id}/tests?testMode=subject&subjectId=${selectedSubjectId}`
        );
        if (res.ok) {
          const tests = await res.json();
          setSubjectTests(tests || []);
        } else {
          setSubjectTests([]);
        }
      } catch {
        setSubjectTests([]);
      } finally {
        setLoadingSubjectTests(false);
      }
    }
    fetchSubTests();
  }, [series, selectedSubjectId, activeTab]);

  // Load Chapter-wise tests
  useEffect(() => {
    if (!series || !selectedChapterId || activeTab !== 'chapter') return;
    async function fetchChapTests() {
      setLoadingChapterTests(true);
      try {
        const res = await fetch(
          `${API_URL}/test-series/${series!.id || series!._id}/tests?testMode=chapter&chapterId=${selectedChapterId}`
        );
        if (res.ok) {
          const tests = await res.json();
          setChapterTests(tests || []);
        } else {
          setChapterTests([]);
        }
      } catch {
        setChapterTests([]);
      } finally {
        setLoadingChapterTests(false);
      }
    }
    fetchChapTests();
  }, [series, selectedChapterId, activeTab]);

  // Load Full tests
  useEffect(() => {
    if (!series || activeTab !== 'full') return;
    async function fetchFullTests() {
      setLoadingFullTests(true);
      try {
        const res = await fetch(
          `${API_URL}/test-series/${series!.id || series!._id}/tests?testMode=full`
        );
        if (res.ok) {
          const tests = await res.json();
          setFullTests(tests || []);
        } else {
          setFullTests([]);
        }
      } catch {
        setFullTests([]);
      } finally {
        setLoadingFullTests(false);
      }
    }
    fetchFullTests();
  }, [series, activeTab]);

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-xs text-muted">Loading test series and exam papers...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center max-w-lg mx-auto space-y-3">
        <svg className="w-8 h-8 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-sm font-semibold text-red-200">{error || 'Test series could not be loaded.'}</p>
        <a
          href="/test-series"
          className="inline-block text-xs font-semibold text-accent hover:underline"
        >
          &larr; Back to all test series
        </a>
      </div>
    );
  }

  const assignedSubjects = series.subjects || [];
  const currentChapterSubject = assignedSubjects.find((s) => s.subjectId === chapterSubjectId);
  const currentSubjectChapters = currentChapterSubject?.chapters || [];

  const completionPct =
    learnerPrep && learnerPrep.totalTestsCount > 0
      ? Math.round((learnerPrep.completedTestsCount / learnerPrep.totalTestsCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          SERIES HERO OVERVIEW CARD
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start justify-between gap-5">
          <div className="space-y-3 flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-surface-raised border border-border text-slate-700 dark:text-slate-300">
                {series.targetExam || series.category}
              </span>
              {series.organization && (
                <span className="text-xs font-medium text-muted bg-surface-raised/60 px-2 py-0.5 rounded border border-border">
                  {series.organization}
                </span>
              )}
              {series.accessType === 'free' ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Free Access
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <span>★</span>
                  <span>{series.accessType === 'freemium' ? 'Free & Premium' : 'Premium'}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {series.title}
            </h1>

            {/* Description */}
            {series.description && (
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-3xl">
                {series.description}
              </p>
            )}

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>{assignedSubjects.length} Assigned Subjects</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Bilingual ({series.supportedLanguages?.join(', ') || 'English, Hindi'})</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          PERSONAL LAYER: Progress & Continue Active Attempt (After Login)
          ───────────────────────────────────────────────────────────── */}
      {learnerPrep && (
        <section aria-label="Personal Progress in this Series" className="space-y-4">
          {/* Active test banner if an attempt is currently in progress */}
          {activeAttemptInProgress && (
            <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
                      Active Test in Progress
                    </p>
                    <h2 className="text-base font-bold text-white">
                      {activeAttemptInProgress.title}
                    </h2>
                    <p className="text-xs text-muted">
                      Attempt in progress · Continue right where you left off.
                    </p>
                  </div>
                </div>

                <a
                  href={`/exams/${activeAttemptInProgress.id}/attempt`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
                >
                  <span>Resume Test</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          )}

          {/* Progress Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Your Preparation Progress
                </p>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  {learnerPrep.completedTestsCount} of {learnerPrep.totalTestsCount} tests completed
                </h2>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {learnerPrep.averageScorePercent !== null && (
                  <span className="rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-white">
                    Avg Score: <strong className="text-accent">{learnerPrep.averageScorePercent}%</strong>
                  </span>
                )}
                {learnerPrep.averageAccuracy !== null && (
                  <span className="rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-white">
                    Accuracy: <strong className="text-emerald-400">{learnerPrep.averageAccuracy}%</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  style={{ width: `${completionPct}%` }}
                  className="h-full bg-accent transition-all duration-500 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted">
                <span>{completionPct}% Complete</span>
                <span>{learnerPrep.unattemptedTestsCount} unattempted tests remaining</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FILTER TABS: All / Subject / Chapter / Full Mock
          ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'all'
                ? 'bg-accent text-white shadow-2xs'
                : 'bg-surface border border-border text-muted hover:text-white hover:bg-surface-raised'
            }`}
          >
            <span>All Tests</span>
            {learnerPrep?.totalTestsCount !== undefined && (
              <span className="text-[11px] opacity-80">({learnerPrep.totalTestsCount})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subject')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'subject'
                ? 'bg-accent text-white shadow-2xs'
                : 'bg-surface border border-border text-muted hover:text-white hover:bg-surface-raised'
            }`}
          >
            <span>Subject-wise</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chapter')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'chapter'
                ? 'bg-accent text-white shadow-2xs'
                : 'bg-surface border border-border text-muted hover:text-white hover:bg-surface-raised'
            }`}
          >
            <span>Chapter-wise</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('full')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'full'
                ? 'bg-accent text-white shadow-2xs'
                : 'bg-surface border border-border text-muted hover:text-white hover:bg-surface-raised'
            }`}
          >
            <span>Full Mock Tests</span>
          </button>
        </div>

        {/* ── TAB: ALL TESTS ── */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {loadingAllTests ? (
              <div className="py-12 text-center text-xs text-muted">
                Loading all published tests...
              </div>
            ) : allTests.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted">
                No published tests available in this series yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allTests.map((t) => (
                  <TestCard
                    key={t.id || t._id}
                    test={t}
                    latestAttempt={testAttemptMap.get(t.id || (t as any)._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SUBJECT-WISE TESTS ── */}
        {activeTab === 'subject' && (
          <div className="space-y-4">
            {assignedSubjects.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted">
                No subjects assigned to this test series yet.
              </div>
            ) : (
              <>
                {/* Horizontal Subjects Selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {assignedSubjects.map((sub) => {
                    const isSelected = selectedSubjectId === sub.subjectId;
                    return (
                      <button
                        key={sub.subjectId}
                        type="button"
                        onClick={() => setSelectedSubjectId(sub.subjectId)}
                        className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-accent/20 border border-accent text-accent'
                            : 'bg-surface border border-border text-muted hover:text-white hover:bg-surface-raised'
                        }`}
                      >
                        {sub.customDisplayName || sub.name}
                      </button>
                    );
                  })}
                </div>

                {/* Tests List for Selected Subject */}
                {loadingSubjectTests ? (
                  <div className="py-12 text-center text-xs text-muted">
                    Loading subject tests...
                  </div>
                ) : subjectTests.length === 0 ? (
                  <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted">
                    No published subject-wise tests available for this subject at this time.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectTests.map((t) => (
                      <TestCard
                        key={t.id || t._id}
                        test={t}
                        latestAttempt={testAttemptMap.get(t.id || (t as any)._id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: CHAPTER-WISE TESTS ── */}
        {activeTab === 'chapter' && (
          <div className="space-y-4">
            {assignedSubjects.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted">
                No subjects or chapters assigned to this test series yet.
              </div>
            ) : (
              <>
                {/* Subject Selector for Chapters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {assignedSubjects.map((sub) => {
                    const isSelected = chapterSubjectId === sub.subjectId;
                    return (
                      <button
                        key={sub.subjectId}
                        type="button"
                        onClick={() => {
                          setChapterSubjectId(sub.subjectId);
                          if (sub.chapters && sub.chapters.length > 0) {
                            setSelectedChapterId(sub.chapters[0].id || sub.chapters[0]._id || null);
                          } else {
                            setSelectedChapterId(null);
                          }
                        }}
                        className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-accent/20 border border-accent text-accent'
                            : 'bg-surface border border-border text-muted hover:text-white hover:bg-surface-raised'
                        }`}
                      >
                        {sub.customDisplayName || sub.name}
                      </button>
                    );
                  })}
                </div>

                {/* Chapters sub-selector */}
                {currentSubjectChapters.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-border/40 pt-2">
                    {currentSubjectChapters.map((ch) => {
                      const chId = ch.id || ch._id;
                      const isSelected = selectedChapterId === chId;
                      return (
                        <button
                          key={chId}
                          type="button"
                          onClick={() => setSelectedChapterId(chId || null)}
                          className={`shrink-0 px-3 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-surface-raised border border-accent text-white'
                              : 'text-muted hover:text-white hover:bg-surface-raised/40'
                          }`}
                        >
                          {ch.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Chapter tests grid */}
                {loadingChapterTests ? (
                  <div className="py-12 text-center text-xs text-muted">
                    Loading chapter tests...
                  </div>
                ) : chapterTests.length === 0 ? (
                  <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted">
                    No published chapter tests available for this selection.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chapterTests.map((t) => (
                      <TestCard
                        key={t.id || t._id}
                        test={t}
                        latestAttempt={testAttemptMap.get(t.id || (t as any)._id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: FULL MOCK TESTS ── */}
        {activeTab === 'full' && (
          <div className="space-y-4">
            {loadingFullTests ? (
              <div className="py-12 text-center text-xs text-muted">
                Loading full tests...
              </div>
            ) : fullTests.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted">
                No published Full Length mock tests available at this time.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fullTests.map((t) => (
                  <TestCard
                    key={t.id || t._id}
                    test={t}
                    latestAttempt={testAttemptMap.get(t.id || (t as any)._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TestCard({
  test,
  latestAttempt,
}: {
  test: PublishedTestItem;
  latestAttempt?: LatestAttemptMeta | null;
}) {
  const isFull = test.testMode === 'full';
  const sectionsCount = test.sections?.length || 0;

  const isInProgress = latestAttempt?.status === 'in_progress';
  const isSubmitted = latestAttempt?.status === 'submitted';

  return (
    <div className="bg-surface border border-border hover:border-accent/40 rounded-xl p-5 flex flex-col justify-between transition-all duration-150 shadow-2xs hover:shadow-xs">
      <div className="space-y-2.5">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-raised border border-border text-muted">
              {test.testMode === 'full' ? 'Full Test' : test.testMode === 'chapter' ? 'Chapter Test' : 'Subject Test'}
            </span>

            {/* Learner Personal Status Badge */}
            {isInProgress ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                ● In Progress
              </span>
            ) : isSubmitted ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                ✓ Submitted (v{latestAttempt?.attemptNumber || 1})
              </span>
            ) : (
              <span className="text-[10px] font-medium text-muted px-2 py-0.5 rounded bg-surface-raised/40 border border-border">
                Not Started
              </span>
            )}
          </div>

          {test.access === 'free' ? (
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Free
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              Premium
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white line-clamp-1 leading-snug">
          {test.title}
        </h3>

        {/* Description */}
        {test.description && (
          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
            {test.description}
          </p>
        )}

        {/* Submitted Attempt Score Box (when test was submitted) */}
        {isSubmitted && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-muted block">Latest Score</span>
              <span className="font-extrabold text-white">
                {latestAttempt?.marksAwarded ?? 0}
                {latestAttempt?.maximumMarks !== undefined && (
                  <span className="text-muted font-normal"> / {latestAttempt.maximumMarks}</span>
                )}
              </span>
            </div>

            {latestAttempt?.scorePercent !== undefined && (
              <div className="text-right">
                <span className="text-[11px] text-muted block">Accuracy</span>
                <span className="font-bold text-accent">{latestAttempt.scorePercent}%</span>
              </div>
            )}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-muted border-t border-border/60">
          <div>
            <span className="text-[10px] text-muted block">Questions</span>
            <span className="font-semibold text-white">{test.totalQuestionsCount} Qs</span>
          </div>
          <div>
            <span className="text-[10px] text-muted block">Duration</span>
            <span className="font-semibold text-white">
              {test.durationMinutes ? `${test.durationMinutes} Mins` : 'Untimed'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted block">Marking</span>
            <span className="font-semibold text-white">
              +{test.positiveMarks}
              {test.negativeMarkingEnabled && test.negativeMarks > 0 ? ` / -${test.negativeMarks}` : ''}
            </span>
          </div>
        </div>

        {/* Section info for Full Tests */}
        {isFull && sectionsCount > 0 && (
          <div className="pt-1 text-[11px] text-muted flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-300">
              {sectionsCount} {sectionsCount === 1 ? 'Section' : 'Sections'}:
            </span>
            <span className="truncate">
              {test.sections!.map((s) => s.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Relevant One-Click Action Button */}
      <div className="mt-4 pt-2 flex flex-col gap-1.5">
        {isInProgress ? (
          <a
            href={`/exams/${test.id || (test as any)._id}/attempt`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold bg-accent text-white hover:opacity-90 transition duration-150 shadow-xs cursor-pointer"
          >
            <span>Resume Test</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : isSubmitted ? (
          <div className="flex items-center gap-2">
            <a
              href={`/test-series/results/${latestAttempt!.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-semibold border border-accent bg-accent/15 text-accent hover:bg-accent hover:text-white transition duration-150 cursor-pointer"
            >
              <span>View Result</span>
              <span aria-hidden="true">→</span>
            </a>
            <a
              href={`/test-series/instructions/${test.id || (test as any)._id}`}
              className="inline-flex items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold border border-border bg-surface-raised text-muted hover:text-white hover:border-accent transition duration-150 cursor-pointer"
              title="Take a fresh attempt"
            >
              <span>Reattempt</span>
            </a>
          </div>
        ) : (
          <a
            href={`/test-series/instructions/${test.id || (test as any)._id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold bg-accent/15 text-accent hover:bg-accent hover:text-white transition duration-150 cursor-pointer"
          >
            <span>View Instructions & Start</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
