import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_URL } from '../../lib/api';
import { TestSeriesPassCard } from './TestSeriesPassCard';

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
  slug?: string | null;
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
  initialData?: TestSeriesDetailData | null;
  initialFullTests?: PublishedTestItem[] | null;
}

type TabType = 'full' | 'subject' | 'chapter' | 'syllabus';
type CardFilter = 'all' | 'free' | 'pass';

function subjectLabel(subject?: Partial<AssignedSubject> | null) {
  return subject?.customDisplayName || subject?.name || '';
}

function testRouteId(test: PublishedTestItem) {
  return test.slug || test.id || test._id || '';
}

export function TestSeriesDetail({ seriesIdOrSlug, initialData, initialFullTests }: Props) {
  const [series, setSeries] = useState<TestSeriesDetailData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Learner series progress state (after login)
  const [learnerPrep, setLearnerPrep] = useState<LearnerSeriesPrep | null>(null);
  const [seriesAccess, setSeriesAccess] = useState<{
    hasActivePass: boolean;
    expiresAt: string | null;
    freeTestId: string | null;
  } | null>(null);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<TabType>('full');
  const [testSearchQuery, setTestSearchQuery] = useState('');

  // Subject state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectTests, setSubjectTests] = useState<PublishedTestItem[]>([]);
  const [loadingSubjectTests, setLoadingSubjectTests] = useState(false);

  // Chapter state
  const [chapterSubjectId, setChapterSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [chapterTests, setChapterTests] = useState<PublishedTestItem[]>([]);
  const [loadingChapterTests, setLoadingChapterTests] = useState(false);

  // Full tests state
  const [fullTests, setFullTests] = useState<PublishedTestItem[]>(initialFullTests || []);
  const [loadingFullTests, setLoadingFullTests] = useState(!initialFullTests || initialFullTests.length === 0);

  // Syllabus state
  const [syllabusSubjectId, setSyllabusSubjectId] = useState<string | null>(null);
  const [subjectQuery, setSubjectQuery] = useState('');
  const [expandedSyllabusIds, setExpandedSyllabusIds] = useState<string[]>([]);

  // In-memory cache for test query responses
  const testsCacheRef = useRef<Map<string, PublishedTestItem[]>>(new Map());

  // Load series details
  useEffect(() => {
    if (
      initialData &&
      (initialData.id === seriesIdOrSlug ||
        initialData.slug?.toLowerCase() === seriesIdOrSlug.toLowerCase() ||
        initialData._id === seriesIdOrSlug)
    ) {
      return;
    }

    async function loadSeries() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/test-series/${seriesIdOrSlug}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Test series was not found or is currently not published.'
              : `Unable to load test series (status ${res.status})`,
          );
        }
        const data = await res.json();
        setSeries(data);

        if (data.subjects && data.subjects.length > 0) {
          const firstSub = data.subjects[0];
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
  }, [seriesIdOrSlug, initialData]);

  // Load Learner's Personal Preparation Progress & Pass Access for this Series
  useEffect(() => {
    if (!series) return;
    const seriesId = series.id || series._id;
    if (!seriesId) return;
    const resolvedSeriesId = seriesId;

    async function fetchPrepData() {
      try {
        const res = await fetch(`${API_URL}/me/preparation/series/${resolvedSeriesId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = (await res.json()) as LearnerSeriesPrep;
          setLearnerPrep(data);
        }
        const accessRes = await fetch(
          `${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(resolvedSeriesId)}`,
          { credentials: 'include' },
        );
        if (accessRes.ok) {
          const access = await accessRes.json();
          setSeriesAccess({
            hasActivePass: Boolean(access.hasActivePass),
            expiresAt: access.expiresAt ?? null,
            freeTestId: access.freeTestId ?? null,
          });
        }
      } catch {
        // Non-fatal if student is not signed in
      }
    }

    void fetchPrepData();
  }, [series]);

  // Load Subject-wise tests from real database API (all 20 subject tests cached)
  useEffect(() => {
    if (!series || activeTab !== 'subject') return;
    const url = `${API_URL}/test-series/${series.id || series._id}/tests?testMode=subject`;
    if (testsCacheRef.current.has(url)) {
      setSubjectTests(testsCacheRef.current.get(url)!);
      setLoadingSubjectTests(false);
      return;
    }
    async function fetchSubTests() {
      setLoadingSubjectTests(true);
      try {
        const res = await fetch(url);
        if (res.ok) {
          const tests = await res.json();
          testsCacheRef.current.set(url, tests || []);
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
  }, [series, activeTab]);

  // Load Chapter-wise tests from real database API (all 102 chapter tests cached)
  useEffect(() => {
    if (!series || activeTab !== 'chapter') return;
    const url = `${API_URL}/test-series/${series.id || series._id}/tests?testMode=chapter`;
    if (testsCacheRef.current.has(url)) {
      setChapterTests(testsCacheRef.current.get(url)!);
      setLoadingChapterTests(false);
      return;
    }
    async function fetchChapTests() {
      setLoadingChapterTests(true);
      try {
        const res = await fetch(url);
        if (res.ok) {
          const tests = await res.json();
          testsCacheRef.current.set(url, tests || []);
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
  }, [series, activeTab]);

  // Load Full tests from real database API
  useEffect(() => {
    if (!series) return;
    const url = `${API_URL}/test-series/${series.id || series._id}/tests?testMode=full`;
    if (initialFullTests && initialFullTests.length > 0 && !testsCacheRef.current.has(url)) {
      testsCacheRef.current.set(url, initialFullTests);
      setFullTests(initialFullTests);
      setLoadingFullTests(false);
      return;
    }
    if (testsCacheRef.current.has(url)) {
      setFullTests(testsCacheRef.current.get(url)!);
      setLoadingFullTests(false);
      return;
    }
    async function fetchFullTests() {
      setLoadingFullTests(true);
      try {
        const res = await fetch(url);
        if (res.ok) {
          const tests = await res.json();
          testsCacheRef.current.set(url, tests || []);
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
  }, [series, initialFullTests]);

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

  const assignedSubjects = series?.subjects || [];
  const chapterCount = assignedSubjects.reduce(
    (total, subject) => total + (subject.chapters?.length || 0),
    0,
  );

  const hasActivePass = Boolean(seriesAccess?.hasActivePass);
  const freeTestId = seriesAccess?.freeTestId ?? null;
  const hasUsedFreeTest = Boolean(freeTestId);

  const isTestLocked = (test: PublishedTestItem) => {
    if (hasActivePass) return false;
    const testId = test.id || test._id;
    if (!hasUsedFreeTest) {
      // User can solve ANY 1 test for free! No test is locked!
      return false;
    }
    // Free test already claimed: only the claimed free test is unlocked. All other tests need pass!
    return testId !== freeTestId;
  };

  // Primary diagnostic test target
  const diagnosticTest = useMemo(() => {
    if (freeTestId) {
      const claimed = fullTests.find((t) => (t.id || t._id) === freeTestId) || subjectTests.find((t) => (t.id || t._id) === freeTestId);
      if (claimed) return claimed;
    }
    return fullTests[0] || subjectTests[0] || null;
  }, [freeTestId, fullTests, subjectTests]);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="h-32 animate-pulse rounded-3xl bg-surface-raised border border-border" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-2xl bg-surface border border-border lg:col-span-8" />
          <div className="h-96 animate-pulse rounded-2xl bg-surface border border-border lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-lg space-y-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center"
      >
        <p className="text-sm font-semibold text-heading">
          {error || 'Test series could not be loaded.'}
        </p>
        <a
          href="/test-series"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-bold text-white transition hover:bg-accent-hover"
        >
          Back to all test series
        </a>
      </div>
    );
  }

  const completedCount = learnerPrep?.completedTestsCount ?? 0;
  const totalCount = learnerPrep?.totalTestsCount ?? (fullTests.length + assignedSubjects.length + chapterCount);
  const unattemptedCount = learnerPrep ? learnerPrep.unattemptedTestsCount : Math.max(0, totalCount - completedCount);
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered Full Tests
  const filteredFullTests = useMemo(() => {
    if (!testSearchQuery.trim()) return fullTests;
    const q = testSearchQuery.toLowerCase();
    return fullTests.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false),
    );
  }, [fullTests, testSearchQuery]);

  // Filtered Subject Tests
  const filteredSubjectTests = useMemo(() => {
    return subjectTests.filter((t) => {
      if (selectedSubjectId && t.subjectId !== selectedSubjectId) return false;
      if (testSearchQuery.trim()) {
        const q = testSearchQuery.toLowerCase();
        const match = t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [subjectTests, selectedSubjectId, testSearchQuery]);

  // Current selected subject's chapters for Chapter tab dropdown
  const currentChapterSubject = assignedSubjects.find((s) => s.subjectId === chapterSubjectId);
  const currentSubjectChapters = currentChapterSubject?.chapters || [];

  // Filtered Chapter Tests
  const filteredChapterTests = useMemo(() => {
    return chapterTests.filter((t) => {
      if (chapterSubjectId && t.subjectId !== chapterSubjectId) return false;
      if (selectedChapterId && t.chapterId !== selectedChapterId) return false;
      if (testSearchQuery.trim()) {
        const q = testSearchQuery.toLowerCase();
        const match = t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [chapterTests, chapterSubjectId, selectedChapterId, testSearchQuery]);

  // Syllabus visible subjects
  const visibleSubjects = useMemo(() => {
    let list = assignedSubjects;
    if (syllabusSubjectId) {
      list = list.filter((s) => s.subjectId === syllabusSubjectId);
    }
    if (subjectQuery.trim()) {
      const q = subjectQuery.toLowerCase();
      list = list.filter((s) => {
        const nameMatch = subjectLabel(s).toLowerCase().includes(q);
        const chapMatch = (s.chapters || []).some((c) => (c.name || '').toLowerCase().includes(q));
        return nameMatch || chapMatch;
      });
    }
    return list;
  }, [assignedSubjects, syllabusSubjectId, subjectQuery]);

  return (
    <div className="space-y-6">
      {/* 1. HERO HEADER CARD */}
      <header className="rounded-3xl border border-border bg-surface-raised p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-heading px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-surface">
            {series.targetExam || 'DSSSB TGT'}
          </span>
          <span className="rounded-full border border-border bg-surface px-3.5 py-1 text-xs font-semibold text-heading">
            {series.organization || 'Delhi Subordinate Services Selection Board'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            1 Free Test Included
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl lg:text-[40px] leading-tight">
          {series.title || 'DSSSB TGT Computer Science'}
          <span className="ml-2 font-serif italic font-normal text-sky-700 dark:text-sky-400">
            Test Series
          </span>
        </h1>

        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted sm:text-[15px]">
          {series.description ||
            'Exhaustive PYQ question bank & timed CBT mock simulation covering all 20 subjects and 103 chapters (2018-2024 verified papers). Crafted according to Delhi Subordinate Services Selection Board standards, featuring dual-pane CBT software, instant percentiles, and chapter-wise deep analytics.'}
        </p>

        {/* 6 Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Assigned Subjects</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">
              {assignedSubjects.length} Subjects
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Chapters Covered</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">
              {chapterCount} Chapters
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Full Length Mocks</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">
              {fullTests.length} Tests
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Official PYQs</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">2018 – 2024</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Student Rating</p>
            <p className="mt-1 flex items-center gap-1 text-base font-bold text-heading tabular-nums">
              4.8 <span className="text-amber-500 text-xs">★★★★★</span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Active Aspirants</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">3,420+ Joined</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT (Single-column if pass active, 2-column if pass needed) */}
      <div className={`grid grid-cols-1 items-start gap-6 ${!hasActivePass ? 'lg:grid-cols-12' : ''}`}>
        {/* MAIN COLUMN: Progress + Tabs + Real Tests */}
        <div className={`space-y-6 ${!hasActivePass ? 'lg:col-span-8' : 'w-full'}`}>
          {/* YOUR PREPARATION PROGRESS CARD */}
          <section
            data-dark-card="true"
            className="dark-card rounded-2xl border border-white/10 bg-[#141312] p-5 !text-white shadow-md sm:p-6"
            aria-label="Preparation progress"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FB923C]">
                  YOUR PREPARATION PROGRESS
                </span>
                <span className="ml-2 inline-flex items-center rounded-full border border-[#EA580C]/50 bg-[#EA580C]/20 px-2 py-0.5 text-[10px] font-bold text-[#FB923C]">
                  Live Tracker
                </span>
              </div>
              {diagnosticTest && (
                <a
                  href={`/test-series/instructions/${testRouteId(diagnosticTest)}`}
                  className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {activeAttemptInProgress ? 'Resume In-Progress Test' : '+ Attempt Diagnostic Test'}
                </a>
              )}
            </div>

            <p className="mt-2 text-xl font-bold tracking-tight !text-white sm:text-2xl tabular-nums">
              {completedCount} of {totalCount} tests completed
            </p>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-300 font-medium">
              <span>Overall Completion: {completionPct}%</span>
              <span>{unattemptedCount} unattempted tests remaining</span>
            </div>

            <div
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800"
              role="progressbar"
              aria-valuenow={completionPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-white/10 pt-3.5 text-xs text-zinc-200 font-medium">
              <span>• Avg Accuracy: {learnerPrep?.averageAccuracy != null ? `${learnerPrep.averageAccuracy}%` : '--%'}</span>
              <span>• Predicted Cutoff Gap: Take 1st Mock</span>
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <span>✦</span> Estimated Target: 135+ / 200
              </span>
            </div>
          </section>

          {/* TABS NAVIGATION */}
          <div className="border-b border-border" role="tablist">
            <div className="flex gap-2 overflow-x-auto">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'full'}
                onClick={() => setActiveTab('full')}
                className={`inline-flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'full'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-heading'
                }`}
              >
                Full Mock Tests
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === 'full'
                      ? 'bg-accent-badge text-accent'
                      : 'bg-surface-raised border border-border text-muted'
                  }`}
                >
                  {fullTests.length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'subject'}
                onClick={() => setActiveTab('subject')}
                className={`inline-flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'subject'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-heading'
                }`}
              >
                Subject Tests
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === 'subject'
                      ? 'bg-accent-badge text-accent'
                      : 'bg-surface-raised border border-border text-muted'
                  }`}
                >
                  {assignedSubjects.length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'chapter'}
                onClick={() => setActiveTab('chapter')}
                className={`inline-flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'chapter'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-heading'
                }`}
              >
                Chapter Tests
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === 'chapter'
                      ? 'bg-accent-badge text-accent'
                      : 'bg-surface-raised border border-border text-muted'
                  }`}
                >
                  {chapterCount}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'syllabus'}
                onClick={() => setActiveTab('syllabus')}
                className={`inline-flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'syllabus'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-heading'
                }`}
              >
                Syllabus
              </button>
            </div>
          </div>

          {/* TAB 1: FULL MOCK TESTS */}
          {activeTab === 'full' && (
            <div className="space-y-4">
              {/* Full Mock Search Bar */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="search"
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    placeholder="Search full mock tests by title..."
                    className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 pl-9 text-xs text-heading placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {testSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTestSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs font-bold text-muted hover:text-heading cursor-pointer"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <span className="text-xs font-semibold text-muted">
                  Showing {filteredFullTests.length} of {fullTests.length} tests
                </span>
              </div>

              {loadingFullTests ? (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              ) : filteredFullTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No mock tests found.</p>
                  <p className="mt-1 text-xs text-muted">
                    {testSearchQuery ? 'Try adjusting your search query.' : 'Tests for this mode will appear here.'}
                  </p>
                </div>
              ) : (
                filteredFullTests.map((test, index) => {
                  const testId = test.id || test._id || '';
                  const latestAttempt = testAttemptMap.get(testId);
                  const isLocked = isTestLocked(test);
                  const isClaimedFree = Boolean(freeTestId && freeTestId === testId);
                  return (
                    <RealTestCard
                      key={testId}
                      test={test}
                      index={index}
                      latestAttempt={latestAttempt}
                      isLocked={isLocked}
                      hasActivePass={hasActivePass}
                      hasUsedFreeTest={hasUsedFreeTest}
                      isClaimedFree={isClaimedFree}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: SUBJECT TESTS */}
          {activeTab === 'subject' && (
            <div className="space-y-4">
              {/* Subject Filter Bar: Dropdown + Search + Clear */}
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Subject Dropdown */}
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <label htmlFor="subject-filter-select" className="text-xs font-bold uppercase tracking-wider text-muted shrink-0">
                      Subject:
                    </label>
                    <div className="relative min-w-[220px] max-w-xs flex-1">
                      <select
                        id="subject-filter-select"
                        value={selectedSubjectId || ''}
                        onChange={(e) => setSelectedSubjectId(e.target.value || null)}
                        className="w-full appearance-none rounded-xl border border-border bg-surface px-3.5 py-2 pr-8 text-xs font-semibold text-heading focus:border-accent focus:outline-none cursor-pointer"
                      >
                        <option value="">All Subjects ({assignedSubjects.length})</option>
                        {assignedSubjects.map((sub) => (
                          <option key={sub.subjectId} value={sub.subjectId}>
                            {subjectLabel(sub)}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted">▼</span>
                    </div>

                    {(selectedSubjectId || testSearchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubjectId(null);
                          setTestSearchQuery('');
                        }}
                        className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-heading transition cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[200px] sm:w-64">
                    <input
                      type="search"
                      value={testSearchQuery}
                      onChange={(e) => setTestSearchQuery(e.target.value)}
                      placeholder="Search subject tests..."
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 pl-9 text-xs text-heading placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {testSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTestSearchQuery('')}
                        className="absolute right-2.5 top-2 text-xs font-bold text-muted hover:text-heading cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  <span>
                    {selectedSubjectId
                      ? `Filtered by: ${subjectLabel(assignedSubjects.find((s) => s.subjectId === selectedSubjectId) || { name: '' })}`
                      : 'All 20 Designated Exam Subjects'}
                  </span>
                  <span className="font-semibold">
                    Showing {filteredSubjectTests.length} of {subjectTests.length} tests
                  </span>
                </div>
              </div>

              {loadingSubjectTests ? (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              ) : filteredSubjectTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No subject tests found.</p>
                  <p className="mt-1 text-xs text-muted">
                    {testSearchQuery || selectedSubjectId ? 'Try adjusting your subject or search query.' : 'Tests for this mode will appear here.'}
                  </p>
                </div>
              ) : (
                filteredSubjectTests.map((test, index) => {
                  const testId = test.id || test._id || '';
                  const latestAttempt = testAttemptMap.get(testId);
                  const isLocked = isTestLocked(test);
                  const isClaimedFree = Boolean(freeTestId && freeTestId === testId);
                  return (
                    <RealTestCard
                      key={testId}
                      test={test}
                      index={index}
                      latestAttempt={latestAttempt}
                      isLocked={isLocked}
                      hasActivePass={hasActivePass}
                      hasUsedFreeTest={hasUsedFreeTest}
                      isClaimedFree={isClaimedFree}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CHAPTER TESTS */}
          {activeTab === 'chapter' && (
            <div className="space-y-4">
              {/* Chapter Filter Bar: Subject Dropdown + Chapter Dropdown + Search */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                  {/* Subject Dropdown */}
                  <div className="sm:col-span-4">
                    <label htmlFor="chapter-subject-select" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">
                      Select Subject
                    </label>
                    <div className="relative">
                      <select
                        id="chapter-subject-select"
                        value={chapterSubjectId || ''}
                        onChange={(e) => {
                          const newSubId = e.target.value || null;
                          setChapterSubjectId(newSubId);
                          setSelectedChapterId(null);
                        }}
                        className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-2 pr-8 text-xs font-semibold text-heading focus:border-accent focus:outline-none cursor-pointer"
                      >
                        <option value="">All Subjects ({assignedSubjects.length})</option>
                        {assignedSubjects.map((sub) => (
                          <option key={sub.subjectId} value={sub.subjectId}>
                            {subjectLabel(sub)} ({sub.chapters?.length || 0} chaps)
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-2 text-xs text-muted">▼</span>
                    </div>
                  </div>

                  {/* Chapter Dropdown */}
                  <div className="sm:col-span-4">
                    <label htmlFor="chapter-select" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">
                      Select Chapter
                    </label>
                    <div className="relative">
                      <select
                        id="chapter-select"
                        value={selectedChapterId || ''}
                        onChange={(e) => setSelectedChapterId(e.target.value || null)}
                        disabled={!chapterSubjectId && currentSubjectChapters.length === 0}
                        className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-2 pr-8 text-xs font-semibold text-heading focus:border-accent focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {chapterSubjectId
                            ? `All Chapters in Subject (${currentSubjectChapters.length})`
                            : 'Choose Subject first or search below'}
                        </option>
                        {currentSubjectChapters.map((chap) => (
                          <option key={chap.id || chap._id || chap.name} value={chap.id || chap._id}>
                            {chap.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-2 text-xs text-muted">▼</span>
                    </div>
                  </div>

                  {/* Quick Search */}
                  <div className="sm:col-span-4">
                    <label htmlFor="chapter-search" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">
                      Quick Search
                    </label>
                    <div className="relative">
                      <input
                        id="chapter-search"
                        type="search"
                        value={testSearchQuery}
                        onChange={(e) => setTestSearchQuery(e.target.value)}
                        placeholder="Search chapter or topic..."
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 pl-8 text-xs text-heading placeholder:text-muted focus:border-accent focus:outline-none"
                      />
                      <svg
                        className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {testSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setTestSearchQuery('')}
                          className="absolute right-2.5 top-2 text-xs font-bold text-muted hover:text-heading cursor-pointer"
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span>
                      {chapterSubjectId
                        ? `Filtered by: ${subjectLabel(assignedSubjects.find((s) => s.subjectId === chapterSubjectId) || { name: '' })}`
                        : 'All Chapters across 20 Subjects'}
                    </span>
                    {(chapterSubjectId || selectedChapterId || testSearchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setChapterSubjectId(null);
                          setSelectedChapterId(null);
                          setTestSearchQuery('');
                        }}
                        className="rounded-md border border-border bg-surface-raised px-2 py-0.5 text-[11px] font-bold text-accent hover:underline cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                  </div>
                  <span className="font-semibold">
                    Showing {filteredChapterTests.length} of {chapterTests.length} chapter tests
                  </span>
                </div>
              </div>

              {loadingChapterTests ? (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              ) : filteredChapterTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No chapter tests found for this selection.</p>
                  <p className="mt-1 text-xs text-muted">Pick another chapter, subject or adjust your search.</p>
                </div>
              ) : (
                filteredChapterTests.map((test, index) => {
                  const testId = test.id || test._id || '';
                  const latestAttempt = testAttemptMap.get(testId);
                  const isLocked = isTestLocked(test);
                  const isClaimedFree = Boolean(freeTestId && freeTestId === testId);
                  return (
                    <RealTestCard
                      key={testId}
                      test={test}
                      index={index}
                      latestAttempt={latestAttempt}
                      isLocked={isLocked}
                      hasActivePass={hasActivePass}
                      hasUsedFreeTest={hasUsedFreeTest}
                      isClaimedFree={isClaimedFree}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: SYLLABUS */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              {/* Syllabus Filter Bar: Subject Dropdown + Search + Expand/Collapse All */}
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <label htmlFor="syllabus-subject-select" className="text-xs font-bold uppercase tracking-wider text-muted shrink-0">
                      Subject:
                    </label>
                    <div className="relative min-w-[220px] max-w-xs flex-1">
                      <select
                        id="syllabus-subject-select"
                        value={syllabusSubjectId || ''}
                        onChange={(e) => setSyllabusSubjectId(e.target.value || null)}
                        className="w-full appearance-none rounded-xl border border-border bg-surface px-3.5 py-2 pr-8 text-xs font-semibold text-heading focus:border-accent focus:outline-none cursor-pointer"
                      >
                        <option value="">All Subjects ({assignedSubjects.length})</option>
                        {assignedSubjects.map((sub) => (
                          <option key={sub.subjectId} value={sub.subjectId}>
                            {subjectLabel(sub)} ({sub.chapters?.length || 0} chaps)
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted">▼</span>
                    </div>

                    {(syllabusSubjectId || subjectQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSyllabusSubjectId(null);
                          setSubjectQuery('');
                        }}
                        className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-heading transition cursor-pointer"
                      >
                        Reset
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const allIds = visibleSubjects.map((s) => s.subjectId);
                        const allOpen = allIds.length > 0 && allIds.every((id) => expandedSyllabusIds.includes(id));
                        setExpandedSyllabusIds(allOpen ? [] : allIds);
                      }}
                      className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-heading hover:bg-surface-raised transition cursor-pointer"
                    >
                      {visibleSubjects.length > 0 && visibleSubjects.map((s) => s.subjectId).every((id) => expandedSyllabusIds.includes(id))
                        ? 'Collapse All'
                        : 'Expand All'}
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[200px] sm:w-64">
                    <input
                      type="search"
                      value={subjectQuery}
                      onChange={(e) => setSubjectQuery(e.target.value)}
                      placeholder="Search syllabus topics..."
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 pl-9 text-xs text-heading placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {subjectQuery && (
                      <button
                        type="button"
                        onClick={() => setSubjectQuery('')}
                        className="absolute right-2.5 top-2 text-xs font-bold text-muted hover:text-heading cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Showing {visibleSubjects.length} of {assignedSubjects.length} subjects</span>
                </div>
              </div>

              {visibleSubjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No subjects found in syllabus.</p>
                  <p className="mt-1 text-xs text-muted">Try clearing the search query or subject filter.</p>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {visibleSubjects.map((sub) => {
                    const isOpen = expandedSyllabusIds.includes(sub.subjectId);
                    const chaps = sub.chapters || [];
                    return (
                      <li
                        key={sub.subjectId}
                        className="rounded-2xl border border-border bg-surface p-4 shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedSyllabusIds((prev) =>
                              prev.includes(sub.subjectId)
                                ? prev.filter((id) => id !== sub.subjectId)
                                : [...prev, sub.subjectId],
                            );
                          }}
                          className="flex w-full cursor-pointer items-center justify-between text-left"
                        >
                          <span className="text-sm font-bold text-heading">
                            {subjectLabel(sub)}
                          </span>
                          <span className="rounded-full bg-surface-raised border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                            {chaps.length} chaps
                          </span>
                        </button>
                        {isOpen && (
                          <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs text-muted">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubjectId(sub.subjectId);
                                setActiveTab('subject');
                              }}
                              className="font-bold text-accent hover:underline cursor-pointer"
                            >
                              Open Subject Test →
                            </button>
                            <ul className="space-y-1.5 pt-1">
                              {chaps.map((c) => (
                                <li key={c.id || c._id || c.name} className="flex items-center gap-1.5">
                                  <span className="h-1 w-1 rounded-full bg-muted" />
                                  <span className="text-heading font-medium">{c.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar Cards (Only shown if pass is NOT activated) */}
        {!hasActivePass && (
          <aside className="space-y-5 lg:sticky lg:top-6 lg:col-span-4">
            {/* TEST SERIES PASS CARD */}
            <TestSeriesPassCard
              variant="series"
              initialActive={false}
              initialExpiresAt={null}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

// REAL TEST CARD COMPONENT
function RealTestCard({
  test,
  index = 0,
  latestAttempt,
  isLocked,
  hasActivePass,
  hasUsedFreeTest,
  isClaimedFree,
}: {
  test: PublishedTestItem;
  index?: number;
  latestAttempt?: LatestAttemptMeta | null;
  isLocked: boolean;
  hasActivePass: boolean;
  hasUsedFreeTest: boolean;
  isClaimedFree: boolean;
}) {
  const routeId = testRouteId(test);
  const testId = test.id || test._id || '';
  const isInProgress = latestAttempt?.status === 'in_progress';
  const isSubmitted = latestAttempt?.status === 'submitted';
  const totalMarks = test.positiveMarks * test.totalQuestionsCount;
  const sections = test.sections || [];

  const isHighlighted = !hasActivePass && !hasUsedFreeTest && index === 0;

  return (
    <article
      className={`rounded-2xl bg-surface p-5 shadow-xs sm:p-6 transition hover:border-accent/40 ${
        isHighlighted
          ? 'border-2 border-accent/40'
          : 'border border-border'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Top Status Pill */}
          <div>
            {hasActivePass ? (
              <span className="inline-flex items-center rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                INCLUDED IN PASS
              </span>
            ) : isClaimedFree ? (
              <span className="inline-flex items-center rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                YOUR CLAIMED FREE TEST
              </span>
            ) : isLocked ? (
              <span className="inline-flex items-center rounded-full border border-border bg-surface-raised px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                PASS REQUIRED
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                FREE ATTEMPT AVAILABLE • NO PASS NEEDED
              </span>
            )}
          </div>

          {/* Test Title */}
          <h3 className="text-base font-bold text-heading hover:text-accent transition sm:text-lg">
            <a href={`/test-series/instructions/${routeId}`}>
              {test.title}
            </a>
          </h3>

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted font-medium">
            <span>📄 <strong className="text-heading font-semibold tabular-nums">{test.totalQuestionsCount}</strong> Questions</span>
            <span>•</span>
            <span>⏱ <strong className="text-heading font-semibold tabular-nums">{test.durationMinutes ? `${test.durationMinutes} Mins` : 'Untimed'}</strong></span>
            <span>•</span>
            <span>🎯 <strong className="text-heading font-semibold tabular-nums">{totalMarks}</strong> Marks</span>
            {test.negativeMarkingEnabled && test.negativeMarks > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">-{test.negativeMarks} Neg.</span>
              </>
            )}
            <span>•</span>
            <span>🌐 Bilingual</span>
          </div>

          {/* Section pills for Full Tests or details */}
          {sections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {sections.map((section) => (
                <span
                  key={section.id || section.name}
                  className="rounded-md border border-border bg-surface-raised px-2.5 py-0.5 text-[11px] font-medium text-heading"
                >
                  {section.name}
                </span>
              ))}
            </div>
          )}

          {/* Score line if submitted */}
          {isSubmitted && latestAttempt && (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-1">
              Latest Score: <span className="tabular-nums font-bold">{latestAttempt.marksAwarded ?? 0}</span> / <span className="tabular-nums font-bold">{latestAttempt.maximumMarks ?? totalMarks}</span>
              {latestAttempt.scorePercent !== undefined && ` (${latestAttempt.scorePercent}%)`}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="flex shrink-0 flex-col sm:items-end">
          {isInProgress ? (
            <a
              href={`/exams/${testId}/attempt`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold !text-white transition hover:bg-accent-hover"
            >
              <span>Resume Test</span>
              <span aria-hidden="true">→</span>
            </a>
          ) : isSubmitted ? (
            <div className="flex flex-col gap-1.5 sm:items-end">
              <a
                href={`/test-series/results/${latestAttempt!.id}`}
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold !text-white transition hover:bg-emerald-700"
              >
                <span>View Result</span>
                <span aria-hidden="true">→</span>
              </a>
              {hasActivePass ? (
                <a
                  href={`/test-series/instructions/${routeId}`}
                  className="inline-flex items-center justify-center text-xs font-semibold text-accent hover:underline"
                >
                  Reattempt
                </a>
              ) : (
                <a
                  href="#series-pass"
                  className="text-[11px] text-muted hover:text-accent hover:underline font-medium"
                >
                  Reattempt requires Pass
                </a>
              )}
            </div>
          ) : isLocked ? (
            <div className="flex flex-col sm:items-end">
              <a
                href="#series-pass"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-bold text-heading transition hover:bg-surface"
              >
                <span>🔒 Unlock with Pass</span>
              </a>
              <span className="mt-1.5 text-center text-[11px] text-muted sm:text-right font-medium">
                Unlock all tests with Pass
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:items-end">
              <a
                href={`/test-series/instructions/${routeId}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold !text-white shadow-xs transition hover:bg-emerald-700"
              >
                <span>{hasActivePass ? 'Start Test' : 'Start Free Mock'}</span>
                <span aria-hidden="true">→</span>
              </a>
              <span className="mt-1.5 text-center text-[11px] text-muted sm:text-right font-medium">
                {hasActivePass ? 'Included in Pass' : '1 free test in this series'}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
