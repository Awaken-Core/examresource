import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_URL, isClientAuthenticated } from '../../lib/api';
import { TestSeriesPassCard } from './TestSeriesPassCard';

export interface Chapter {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  order: number;
  status: string;
  questionsCount?: number;
  testsCount?: number;
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
  questionsCount?: number;
  testsCount?: number;
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

export interface UpcomingMockTest {
  id: string;
  mockNumber: number;
  title: string;
  totalQuestionsCount: number;
  durationMinutes: number;
  totalMarks: number;
  negativeMarks: number;
  sections: string[];
}

export interface PublishedTestItem {
  id: string;
  _id?: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  testMode: 'subject' | 'chapter' | 'full' | 'pyq';
  isPreviousYear?: boolean;
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
  initialPyqTests?: PublishedTestItem[] | null;
  initialAllTests?: PublishedTestItem[] | null;
}

type TabType = 'full' | 'pyq' | 'subject' | 'chapter' | 'syllabus';

function subjectLabel(subject?: Partial<AssignedSubject> | null) {
  return subject?.customDisplayName || subject?.name || '';
}

function isPyqTest(test: { title?: string; slug?: string | null; testMode?: string }) {
  if (test.testMode === 'pyq') return true;
  if (test.slug && test.slug.toLowerCase().startsWith('pyq-')) return true;
  if (test.title && (test.title.startsWith('[PYQ]') || test.title.includes('PYQ'))) return true;
  return false;
}

function testRouteId(test: PublishedTestItem) {
  return test.slug || test.id || test._id || '';
}

function handleTestNavigate(e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) {
  if (!isClientAuthenticated()) {
    e.preventDefault();
    const loginUrl = `/login?redirect=${encodeURIComponent(targetPath)}`;
    void import('astro:transitions/client')
      .then(({ navigate }) => navigate(loginUrl))
      .catch(() => {
        window.location.href = loginUrl;
      });
  }
}

export function TestSeriesDetail({ seriesIdOrSlug, initialData, initialFullTests, initialPyqTests, initialAllTests }: Props) {
  const [series, setSeries] = useState<TestSeriesDetailData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const partitionedInitial = useMemo(() => {
    if (!initialAllTests || initialAllTests.length === 0) {
      const fullList = (initialFullTests || []).filter((t) => !isPyqTest(t));
      const pyqList = initialPyqTests || (initialFullTests || []).filter(isPyqTest);
      return {
        full: fullList,
        pyq: pyqList,
        subject: [] as PublishedTestItem[],
        chapter: [] as PublishedTestItem[],
        hasAll: false,
      };
    }
    return {
      full: initialAllTests.filter((t) => (t.testMode === 'full' || (!t.testMode && !isPyqTest(t))) && !isPyqTest(t)),
      pyq: initialAllTests.filter((t) => t.testMode === 'pyq' || isPyqTest(t)),
      subject: initialAllTests.filter((t) => t.testMode === 'subject'),
      chapter: initialAllTests.filter((t) => t.testMode === 'chapter'),
      hasAll: true,
    };
  }, [initialAllTests, initialFullTests, initialPyqTests]);

  // Learner series progress state (after login)
  const [learnerPrep, setLearnerPrep] = useState<LearnerSeriesPrep | null>(null);
  const [seriesAccess, setSeriesAccess] = useState<{
    hasActivePass: boolean;
    passType?: 'series' | 'all' | null;
    expiresAt: string | null;
    sectionTrials?: {
      full?: { used: boolean; attemptId?: string; examId?: string };
      subject?: { used: boolean; attemptId?: string; examId?: string };
      chapter?: { used: boolean; attemptId?: string; examId?: string };
      pyq?: { used: boolean; attemptId?: string; examId?: string };
    };
    freeTestId: string | null;
  } | null>(null);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<TabType>('full');
  const [testSearchQuery, setTestSearchQuery] = useState('');

  // Subject state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectTests, setSubjectTests] = useState<PublishedTestItem[]>(partitionedInitial.subject);
  const [loadingSubjectTests, setLoadingSubjectTests] = useState(!partitionedInitial.hasAll && activeTab === 'subject');

  // Chapter state
  const [chapterSubjectId, setChapterSubjectId] = useState<string | null>(() => initialData?.subjects?.[0]?.subjectId || null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(() => {
    const firstSub = initialData?.subjects?.[0];
    return firstSub?.chapters?.[0]?.id || firstSub?.chapters?.[0]?._id || null;
  });
  const [chapterTests, setChapterTests] = useState<PublishedTestItem[]>(partitionedInitial.chapter);
  const [loadingChapterTests, setLoadingChapterTests] = useState(!partitionedInitial.hasAll && activeTab === 'chapter');

  // Full tests state (strictly mock tests, excluding PYQs)
  const [fullTests, setFullTests] = useState<PublishedTestItem[]>(partitionedInitial.full);
  const [loadingFullTests, setLoadingFullTests] = useState(!partitionedInitial.hasAll && partitionedInitial.full.length === 0);

  // PYQ tests state (dedicated official papers section)
  const [pyqTests, setPyqTests] = useState<PublishedTestItem[]>(partitionedInitial.pyq);
  const [loadingPyqTests, setLoadingPyqTests] = useState(!partitionedInitial.hasAll && activeTab === 'pyq');
  const [pyqYearFilter, setPyqYearFilter] = useState<string>('ALL');
  const [pyqExamFilter, setPyqExamFilter] = useState<string>('ALL');

  // Syllabus state
  const [syllabusSubjectId, setSyllabusSubjectId] = useState<string | null>(null);
  const [subjectQuery, setSubjectQuery] = useState('');
  const [expandedSyllabusIds, setExpandedSyllabusIds] = useState<string[]>([]);

  // In-memory cache for test query responses
  const testsCacheRef = useRef<Map<string, PublishedTestItem[]>>(new Map());

  // Seed cache from SSR bundled tests for 0ms instant tab swapping
  useEffect(() => {
    if (!series) return;
    const seriesId = series.id || series._id;
    if (!seriesId) return;

    if (partitionedInitial.hasAll) {
      testsCacheRef.current.set(`${API_URL}/test-series/${seriesId}/tests?testMode=full`, partitionedInitial.full);
      testsCacheRef.current.set(`${API_URL}/test-series/${seriesId}/tests?testMode=pyq`, partitionedInitial.pyq);
      testsCacheRef.current.set(`${API_URL}/test-series/${seriesId}/tests?testMode=subject`, partitionedInitial.subject);
      testsCacheRef.current.set(`${API_URL}/test-series/${seriesId}/tests?testMode=chapter`, partitionedInitial.chapter);
      if (series.slug) {
        testsCacheRef.current.set(`${API_URL}/test-series/${series.slug}/tests?testMode=full`, partitionedInitial.full);
        testsCacheRef.current.set(`${API_URL}/test-series/${series.slug}/tests?testMode=pyq`, partitionedInitial.pyq);
        testsCacheRef.current.set(`${API_URL}/test-series/${series.slug}/tests?testMode=subject`, partitionedInitial.subject);
        testsCacheRef.current.set(`${API_URL}/test-series/${series.slug}/tests?testMode=chapter`, partitionedInitial.chapter);
      }
    }
  }, [series, partitionedInitial]);

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

    if (!isClientAuthenticated()) {
      return;
    }

    async function fetchPrepData() {
      try {
        const [res, accessRes] = await Promise.all([
          fetch(`${API_URL}/me/preparation/series/${resolvedSeriesId}`, {
            credentials: 'include',
          }).catch(() => null),
          fetch(
            `${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(resolvedSeriesId)}`,
            { credentials: 'include' },
          ).catch(() => null),
        ]);

        if (res && res.ok) {
          const data = (await res.json()) as LearnerSeriesPrep;
          setLearnerPrep(data);
        }
        if (accessRes && accessRes.ok) {
          const access = await accessRes.json();
          setSeriesAccess({
            hasActivePass: Boolean(access.hasActivePass),
            passType: access.passType ?? null,
            expiresAt: access.expiresAt ?? null,
            sectionTrials: access.sectionTrials ?? undefined,
            freeTestId: access.freeTestId ?? null,
          });
        }
      } catch {
        // Non-fatal if student is not signed in
      }
    }

    void fetchPrepData();
  }, [series]);

  // Re-fetch progress if user logs in dynamically
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e?.detail?.user && series) {
        const seriesId = series.id || series._id;
        if (!seriesId) return;
        const resolvedSeriesId = seriesId;
        Promise.all([
          fetch(`${API_URL}/me/preparation/series/${resolvedSeriesId}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(resolvedSeriesId)}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]).then(([prep, access]) => {
          if (prep) setLearnerPrep(prep);
          if (access) {
            setSeriesAccess({
              hasActivePass: Boolean(access.hasActivePass),
              passType: access.passType ?? null,
              expiresAt: access.expiresAt ?? null,
              sectionTrials: access.sectionTrials ?? undefined,
              freeTestId: access.freeTestId ?? null,
            });
          }
        }).catch(() => {});
      } else if (!e?.detail?.user) {
        setLearnerPrep(null);
        setSeriesAccess(null);
      }
    };
    window.addEventListener('auth:change', handleAuthChange);
    return () => window.removeEventListener('auth:change', handleAuthChange);
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

  // Load PYQ tests from real database API
  useEffect(() => {
    if (!series) return;
    const url = `${API_URL}/test-series/${series.id || series._id}/tests?testMode=pyq`;
    if (testsCacheRef.current.has(url)) {
      setPyqTests(testsCacheRef.current.get(url)!);
      setLoadingPyqTests(false);
      return;
    }
    async function fetchPyqTests() {
      if (initialPyqTests && initialPyqTests.length > 0 && pyqTests.length === 0) {
        setPyqTests(initialPyqTests);
      }
      setLoadingPyqTests(true);
      try {
        const res = await fetch(url);
        if (res.ok) {
          const tests = (await res.json()) || [];
          const merged = Array.from(
            new Map(
              [...(initialPyqTests || []), ...tests].map((t: any) => [t.id || t._id, t]),
            ).values(),
          );
          testsCacheRef.current.set(url, merged);
          setPyqTests(merged);
        } else {
          setPyqTests(initialPyqTests || []);
        }
      } catch {
        setPyqTests(initialPyqTests || []);
      } finally {
        setLoadingPyqTests(false);
      }
    }
    fetchPyqTests();
  }, [series, initialPyqTests]);

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

  const getTestSectionKey = (test: PublishedTestItem): 'full' | 'subject' | 'chapter' | 'pyq' => {
    if (test.testMode === 'pyq' || isPyqTest(test)) return 'pyq';
    if (test.testMode === 'subject') return 'subject';
    if (test.testMode === 'chapter') return 'chapter';
    return 'full';
  };

  const isTestLocked = (test: PublishedTestItem) => {
    if (hasActivePass) return false;
    const secKey = getTestSectionKey(test);
    const trial = seriesAccess?.sectionTrials?.[secKey];
    const testId = test.id || test._id;
    if (!trial || !trial.used) {
      // 1 free trial attempt slot is available in each section for the student!
      return false;
    }
    // Trial used: only the attempted test can be reopened without pass
    return testId !== trial.examId;
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

  // Upcoming Locked Mock Tests (Coming Soon) - only show placeholder when no real full tests exist
  const upcomingMockTests = useMemo<UpcomingMockTest[]>(() => {
    if (fullTests.length > 0) return [];
    const examLabel = series?.targetExam || series?.title || 'Full Syllabus';
    const numToGenerate = 3;
    const startIndex = 1;

    const defaultSections = (series?.subjects && series.subjects.length > 0)
      ? series.subjects.slice(0, 5).map((s) => subjectLabel(s))
      : ['General Awareness', 'General Intelligence & Reasoning', 'Numerical Ability', 'Hindi Language', 'Subject Knowledge'];

    const mockSubtitles = [
      'All India Live CBT Mock Simulation',
      'High-Yield Full Syllabus Paper',
      'Latest Exam Pattern Mock Drill',
      'Advanced Speed & Accuracy Challenge',
      'Final Revision Full Length Paper',
      'Grand Booster Mock Test',
    ];

    const mocks: UpcomingMockTest[] = [];
    for (let i = 0; i < numToGenerate; i++) {
      const mockNum = startIndex + i;
      const subtitle = mockSubtitles[i % mockSubtitles.length];
      mocks.push({
        id: `upcoming-mock-${mockNum}`,
        mockNumber: mockNum,
        title: `${examLabel} Full Mock Test ${String(mockNum).padStart(2, '0')} · ${subtitle}`,
        totalQuestionsCount: 200,
        durationMinutes: 120,
        totalMarks: 200,
        negativeMarks: 0.25,
        sections: defaultSections,
      });
    }
    return mocks;
  }, [series, fullTests.length]);

  const filteredUpcomingTests = useMemo(() => {
    if (!testSearchQuery.trim()) return upcomingMockTests;
    const q = testSearchQuery.toLowerCase();
    return upcomingMockTests.filter(
      (m) => m.title.toLowerCase().includes(q) || m.sections.some((s) => s.toLowerCase().includes(q)),
    );
  }, [upcomingMockTests, testSearchQuery]);

  const totalFullMockCount = fullTests.length + upcomingMockTests.length;

  const completedCount = learnerPrep?.completedTestsCount ?? 0;
  const totalCount = learnerPrep?.totalTestsCount ?? (totalFullMockCount + pyqTests.length + assignedSubjects.length + chapterCount);
  const unattemptedCount = learnerPrep ? learnerPrep.unattemptedTestsCount : Math.max(0, totalCount - completedCount);
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered PYQ Tests
  const filteredPyqTests = useMemo(() => {
    return pyqTests.filter((t) => {
      if (pyqYearFilter !== 'ALL') {
        const str = `${t.title} ${t.slug || ''}`;
        if (!str.includes(pyqYearFilter)) return false;
      }
      if (pyqExamFilter !== 'ALL') {
        const str = `${t.title} ${t.slug || ''}`.toUpperCase();
        if (!str.includes(pyqExamFilter.toUpperCase())) return false;
      }
      if (testSearchQuery.trim()) {
        const q = testSearchQuery.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          (t.slug?.toLowerCase().includes(q) ?? false) ||
          (t.description?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [pyqTests, pyqYearFilter, pyqExamFilter, testSearchQuery]);

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

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Full Length Mocks</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">
              {totalFullMockCount} Tests
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Previous Year Papers</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">
              {pyqTests.length} Official Papers
            </p>
          </div>
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
                  onClick={(e) => handleTestNavigate(e, `/test-series/instructions/${testRouteId(diagnosticTest)}`)}
                  data-astro-prefetch="hover"
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
                  {totalFullMockCount}
                </span>
              </button>


              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pyq'}
                onClick={() => setActiveTab('pyq')}
                className={`inline-flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'pyq'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-heading'
                }`}
              >
                Previous Year Papers
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === 'pyq'
                      ? 'bg-accent-badge text-accent'
                      : 'bg-surface-raised border border-border text-muted'
                  }`}
                >
                  {pyqTests.length}
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
                  Showing {filteredFullTests.length + filteredUpcomingTests.length} of {totalFullMockCount} tests
                </span>
              </div>

              {loadingFullTests ? (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              ) : filteredFullTests.length === 0 && filteredUpcomingTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No mock tests found.</p>
                  <p className="mt-1 text-xs text-muted">
                    {testSearchQuery ? 'Try adjusting your search query.' : 'Tests for this mode will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFullTests.map((test, index) => {
                    const testId = test.id || test._id || '';
                    const latestAttempt = testAttemptMap.get(testId);
                    const isLocked = isTestLocked(test);
                    const secKey = getTestSectionKey(test);
                    const isTrialAvailable = !hasActivePass && !seriesAccess?.sectionTrials?.[secKey]?.used;
                    return (
                      <RealTestCard
                        key={testId}
                        test={test}
                        index={index}
                        latestAttempt={latestAttempt}
                        isLocked={isLocked}
                        hasActivePass={hasActivePass}
                        isTrialAvailable={isTrialAvailable}
                      />
                    );
                  })}
                  {filteredUpcomingTests.map((mock) => (
                    <UpcomingLockedMockCard key={mock.id} mock={mock} />
                  ))}
                </div>
              )}
            </div>
          )}


          {/* TAB 2: PREVIOUS YEAR PAPERS (PYQ SECTION) */}
          {activeTab === 'pyq' && (
            <div className="space-y-4">
              {/* Official Archive Header Card */}
              <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Official Exam Archive
                      </span>
                      <span className="text-xs font-semibold text-muted">2018 – 2024 Verified Papers</span>
                    </div>
                    <h2 className="mt-1 text-base font-bold text-heading sm:text-lg">
                      Previous Year Question Papers (PYQ)
                    </h2>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      Complete authentic exam simulations with negative marking (+1.00 / -0.25), CBT question palette, and detailed bilingual solutions.
                    </p>
                  </div>
                </div>

                {/* Filter Controls: Exam Board & Year */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1.5">Exam:</span>
                  {['ALL', 'DSSSB', 'KVS', 'NVS', 'Bihar STET', 'BPSC', 'HTET', 'EMRS'].map((examName) => (
                    <button
                      key={examName}
                      type="button"
                      onClick={() => setPyqExamFilter(examName)}
                      className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        pyqExamFilter === examName
                          ? 'bg-accent text-on-accent shadow-2xs'
                          : 'bg-surface-raised border border-border text-muted hover:text-heading'
                      }`}
                    >
                      {examName}
                    </button>
                  ))}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1.5">Year:</span>
                  {['ALL', '2024', '2023', '2022', '2021', '2020', '2019', '2018'].map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setPyqYearFilter(year)}
                      className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        pyqYearFilter === year
                          ? 'bg-accent text-on-accent shadow-2xs'
                          : 'bg-surface-raised border border-border text-muted hover:text-heading'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* PYQ Search Bar */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="search"
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    placeholder="Search PYQ papers by title, date, or shift..."
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
                  Showing {filteredPyqTests.length} of {pyqTests.length} official papers
                </span>
              </div>

              {loadingPyqTests ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              ) : filteredPyqTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No previous year papers match the selected filter.</p>
                  <p className="mt-1 text-xs text-muted">
                    {testSearchQuery || pyqYearFilter !== 'ALL' || pyqExamFilter !== 'ALL'
                      ? 'Try clearing the filters or search term to see all official papers.'
                      : 'PYQ papers will appear here.'}
                  </p>
                  {(testSearchQuery || pyqYearFilter !== 'ALL' || pyqExamFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setTestSearchQuery('');
                        setPyqYearFilter('ALL');
                        setPyqExamFilter('ALL');
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-raised border border-border px-3 py-1.5 text-xs font-semibold text-heading hover:border-accent cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPyqTests.map((test, index) => {
                    const testId = test.id || test._id || '';
                    const latestAttempt = testAttemptMap.get(testId);
                    const isLocked = isTestLocked(test);
                    const secKey = getTestSectionKey(test);
                    const isTrialAvailable = !hasActivePass && !seriesAccess?.sectionTrials?.[secKey]?.used;
                    return (
                      <RealTestCard
                        key={testId}
                        test={test}
                        index={index}
                        latestAttempt={latestAttempt}
                        isLocked={isLocked}
                        hasActivePass={hasActivePass}
                        isTrialAvailable={isTrialAvailable}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBJECT TESTS */}
          {activeTab === 'subject' && (
            <div className="space-y-4">
              {/* Subject Quick Selector Cards Grid */}
              {assignedSubjects.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="font-bold uppercase tracking-wider text-[11px]">Select a Subject for Deep Practice:</span>
                    <span>{assignedSubjects.length} Core Subjects</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectId(null)}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition cursor-pointer ${
                        !selectedSubjectId
                          ? 'border-accent bg-accent/5 ring-1 ring-accent'
                          : 'border-border bg-surface hover:border-accent/40'
                      }`}
                    >
                      <span className="text-xs font-bold text-heading">All Subjects</span>
                      <span className="text-[10px] text-muted">
                        {assignedSubjects.reduce((acc, s) => acc + (s.questionsCount || 0), 0)} Questions Bank
                      </span>
                    </button>
                    {assignedSubjects.map((sub) => {
                      const isSelected = selectedSubjectId === sub.subjectId;
                      return (
                        <button
                          key={sub.subjectId}
                          type="button"
                          onClick={() => setSelectedSubjectId(isSelected ? null : sub.subjectId)}
                          className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-accent bg-accent/5 ring-1 ring-accent'
                              : 'border-border bg-surface hover:border-accent/40'
                          }`}
                        >
                          <span className="truncate w-full text-xs font-bold text-heading" title={subjectLabel(sub)}>
                            {subjectLabel(sub)}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
                            {typeof sub.questionsCount === 'number' && (
                              <span className="font-semibold text-accent">{sub.questionsCount} Qs</span>
                            )}
                            <span>•</span>
                            <span>{sub.chapters?.length || 0} chaps</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subject Filter Bar: Dropdown + Search + Clear */}
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Subject Dropdown */}
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <label htmlFor="subject-filter-select" className="text-xs font-bold uppercase tracking-wider text-muted shrink-0">
                      Filter Subject:
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
                            {subjectLabel(sub)} ({sub.questionsCount ? `${sub.questionsCount} Qs` : `${sub.chapters?.length || 0} chaps`})
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
                      : `All ${assignedSubjects.length} Designated Exam Subjects`}
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
                  const secKey = getTestSectionKey(test);
                  const isTrialAvailable = !hasActivePass && !seriesAccess?.sectionTrials?.[secKey]?.used;
                  return (
                    <RealTestCard
                      key={testId}
                      test={test}
                      index={index}
                      latestAttempt={latestAttempt}
                      isLocked={isLocked}
                      hasActivePass={hasActivePass}
                      isTrialAvailable={isTrialAvailable}
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
                      1. Select Subject
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
                            {subjectLabel(sub)} ({sub.questionsCount ? `${sub.questionsCount} Qs, ` : ''}{sub.chapters?.length || 0} chaps)
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-2 text-xs text-muted">▼</span>
                    </div>
                  </div>

                  {/* Chapter Dropdown */}
                  <div className="sm:col-span-4">
                    <label htmlFor="chapter-select" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">
                      2. Select Chapter
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
                            {chap.name} ({chap.questionsCount ? `${chap.questionsCount} Qs` : ''})
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

                {/* Chapter Quick Chips for Active Subject */}
                {currentSubjectChapters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedChapterId(null)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        !selectedChapterId
                          ? 'bg-accent text-white'
                          : 'border border-border bg-surface text-muted hover:text-heading'
                      }`}
                    >
                      All {currentSubjectChapters.length} Chapters
                    </button>
                    {currentSubjectChapters.map((chap) => {
                      const cId = chap.id || chap._id || chap.name;
                      const isSel = selectedChapterId === cId;
                      return (
                        <button
                          key={cId}
                          type="button"
                          onClick={() => setSelectedChapterId(isSel ? null : cId)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                            isSel
                              ? 'bg-accent text-white'
                              : 'border border-border bg-surface text-muted hover:text-heading'
                          }`}
                        >
                          <span>{chap.name}</span>
                          {typeof chap.questionsCount === 'number' && chap.questionsCount > 0 && (
                            <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${isSel ? 'bg-white/20 text-white' : 'bg-surface-raised text-muted'}`}>
                              {chap.questionsCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span>
                      {chapterSubjectId
                        ? `Filtered by: ${subjectLabel(assignedSubjects.find((s) => s.subjectId === chapterSubjectId) || { name: '' })}`
                        : `All Chapters across ${assignedSubjects.length} Subjects`}
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
                  const secKey = getTestSectionKey(test);
                  const isTrialAvailable = !hasActivePass && !seriesAccess?.sectionTrials?.[secKey]?.used;
                  return (
                    <RealTestCard
                      key={testId}
                      test={test}
                      index={index}
                      latestAttempt={latestAttempt}
                      isLocked={isLocked}
                      hasActivePass={hasActivePass}
                      isTrialAvailable={isTrialAvailable}
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
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="truncate text-sm font-bold text-heading">
                              {subjectLabel(sub)}
                            </span>
                            {typeof sub.questionsCount === 'number' && sub.questionsCount > 0 && (
                              <span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold shrink-0">
                                {sub.questionsCount} Qs
                              </span>
                            )}
                          </div>
                          <span className="rounded-full bg-surface-raised border border-border px-2 py-0.5 text-xs font-semibold text-muted shrink-0">
                            {chaps.length} chaps
                          </span>
                        </button>
                        {isOpen && (
                          <div className="mt-3 space-y-3 border-t border-border pt-3 text-xs text-muted">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubjectId(sub.subjectId);
                                  setActiveTab('subject');
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent/20 transition cursor-pointer"
                              >
                                Attempt Subject Tests ({sub.testsCount || 4} Tests) →
                              </button>
                              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                ✓ Covered in Full Mocks
                              </span>
                            </div>
                            <ul className="space-y-1.5 pt-1">
                              {chaps.map((c) => (
                                <li
                                  key={c.id || c._id || c.name}
                                  className="flex items-center justify-between rounded-lg bg-surface-raised/40 p-2 border border-border/50"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                                    <span className="truncate text-heading font-medium">{c.name}</span>
                                    {typeof c.questionsCount === 'number' && c.questionsCount > 0 && (
                                      <span className="rounded-md border border-border bg-surface px-1.5 py-0.2 text-[10px] font-semibold text-muted shrink-0">
                                        {c.questionsCount} Qs
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChapterSubjectId(sub.subjectId);
                                      setSelectedChapterId(c.id || c._id || null);
                                      setActiveTab('chapter');
                                    }}
                                    className="text-[11px] font-bold text-accent hover:underline cursor-pointer shrink-0 ml-2"
                                  >
                                    Practice Test →
                                  </button>
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
          <aside className="space-y-5 lg:sticky lg:top-20 lg:col-span-4">
            {/* TEST SERIES PASS CARDS */}
            <TestSeriesPassCard
              seriesId={series.id || series._id}
              variant="series"
              layout="stacked"
              initialActive={hasActivePass}
              initialPassType={seriesAccess?.passType ?? null}
              initialExpiresAt={seriesAccess?.expiresAt ?? null}
              onPurchased={() => {
                const resolvedSeriesId = series.id || series._id;
                if (resolvedSeriesId) {
                  fetch(`${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(resolvedSeriesId)}`, { credentials: 'include' })
                    .then((r) => (r.ok ? r.json() : null))
                    .then((access) => {
                      if (access) setSeriesAccess(access);
                    })
                    .catch(() => {});
                }
              }}
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
  isTrialAvailable = false,
}: {
  test: PublishedTestItem;
  index?: number;
  latestAttempt?: LatestAttemptMeta | null;
  isLocked: boolean;
  hasActivePass: boolean;
  isTrialAvailable?: boolean;
}) {
  const routeId = testRouteId(test);
  const testId = test.id || test._id || '';
  const isInProgress = latestAttempt?.status === 'in_progress';
  const isSubmitted = latestAttempt?.status === 'submitted';
  const totalMarks = test.positiveMarks * test.totalQuestionsCount;
  const sections = test.sections || [];

  const isHighlighted = isTrialAvailable && index === 0;

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
          {isLocked ? (
            <div>
              <span className="inline-flex items-center rounded-full border border-border bg-surface-raised px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                PASS REQUIRED
              </span>
            </div>
          ) : isTrialAvailable ? (
            <div>
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                1 FREE ATTEMPT AVAILABLE
              </span>
            </div>
          ) : null}

          {/* Test Title */}
          <h3 className="text-base font-bold text-heading hover:text-accent transition sm:text-lg">
            <a
              href={`/test-series/instructions/${routeId}`}
              onClick={(e) => handleTestNavigate(e, `/test-series/instructions/${routeId}`)}
              data-astro-prefetch="hover"
            >
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
            
          </div>

          {/* Section pills for Full Tests or details */}
          {sections.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Sections:</span>
              {sections.map((section) => (
                <span
                  key={section.id || section.name}
                  className="rounded-md border border-border bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-heading"
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
              onClick={(e) => handleTestNavigate(e, `/exams/${testId}/attempt`)}
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
                  onClick={(e) => handleTestNavigate(e, `/test-series/instructions/${routeId}`)}
                  data-astro-prefetch="hover"
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
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-bold text-accent transition hover:bg-accent hover:text-white"
              >
                <span>🔒 Unlock (from ₹69)</span>
              </a>
              <span className="mt-1.5 text-center text-[11px] text-muted sm:text-right font-medium">
                Pass needed for 2nd test
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:items-end">
              <a
                href={`/test-series/instructions/${routeId}`}
                onClick={(e) => handleTestNavigate(e, `/test-series/instructions/${routeId}`)}
                data-astro-prefetch="hover"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold !text-white shadow-xs transition hover:bg-accent-hover"
              >
                <span>{isTrialAvailable ? 'Start Free Attempt' : 'Start Test'}</span>
                <span aria-hidden="true">→</span>
              </a>
              {hasActivePass ? (
                <span className="mt-1.5 text-center text-[11px] text-muted sm:text-right font-medium">
                  Included in Pass
                </span>
              ) : isTrialAvailable ? (
                <span className="mt-1.5 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 sm:text-right">
                  1 Free Slot
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
// UPCOMING LOCKED MOCK CARD COMPONENT
function UpcomingLockedMockCard({ mock }: { mock: UpcomingMockTest }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6 transition hover:border-accent/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Top Status Pill: Locked • Coming Soon */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Locked • Coming Soon</span>
            </span>
          </div>

          {/* Test Title */}
          <h3 className="text-base font-bold text-heading sm:text-lg">
            {mock.title}
          </h3>

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted font-medium">
            <span>📄 <strong className="text-heading font-semibold tabular-nums">{mock.totalQuestionsCount}</strong> Questions</span>
            <span>•</span>
            <span>⏱ <strong className="text-heading font-semibold tabular-nums">{mock.durationMinutes} Mins</strong></span>
            <span>•</span>
            <span>🎯 <strong className="text-heading font-semibold tabular-nums">{mock.totalMarks}</strong> Marks</span>
            {mock.negativeMarks > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">-{mock.negativeMarks} Neg.</span>
              </>
            )}
            
          </div>
          
          {/* Section pills */}
          {mock.sections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {mock.sections.map((section) => (
                <span
                  key={section}
                  className="rounded-md border border-border bg-surface-raised px-2.5 py-0.5 text-[11px] font-medium text-heading"
                >
                  {section}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Button: Locked */}
        <div className="flex shrink-0 flex-col sm:items-end">
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-5 py-2.5 text-xs font-bold text-muted opacity-80 select-none shadow-2xs"
          >
            <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Locked · Coming Soon</span>
          </button>
          <span className="mt-1.5 text-center text-[10.5px] text-muted sm:text-right font-medium">
            Test release scheduled soon
          </span>
        </div>
      </div>
    </article>
  );
}
