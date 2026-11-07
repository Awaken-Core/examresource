import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { API_URL, isClientAuthenticated, getCachedCurrentUser } from '../../lib/api';
import { formatRupees, getClientPlanDefaults } from '../../lib/passOffer';
import { getCachedSeriesAccess, setCachedSeriesAccess, clearCachedPassAccess } from '../../lib/passAccess';
import { normalizeTestsPayload, TESTS_API_PAGE_SIZE } from '../../lib/testList';
import { TestSeriesPassCard } from './TestSeriesPassCard';
import { openTestSeriesCheckout } from './openTestSeriesCheckout';

export function cleanDisplayTitle(str?: string | null): string {
  if (!str) return '';
  return str.replace(/[\u2014\u2013]/g, ' - ').replace(/\s+-\s+/g, ' - ').trim();
}

export interface Chapter {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  order: number;
  status: string;
  description?: string | null;
  topics?: string[];
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
  initialFullTestsTotal?: number;
  initialPyqTestsTotal?: number;
}

type TabType = 'full' | 'pyq' | 'subject' | 'chapter';

function subjectLabel(subject?: Partial<AssignedSubject> | null) {
  return subject?.customDisplayName || subject?.name || '';
}

function isPyqTest(test: { title?: string; slug?: string | null; testMode?: string }) {
  if (test.testMode === 'pyq') return true;
  if (test.slug?.toLowerCase().startsWith('pyq-')) return true;
  if (test.title?.startsWith('[PYQ]') || test.title?.includes('PYQ')) return true;
  return false;
}

function testRouteId(test: PublishedTestItem) {
  return test.slug || test.id || test._id || '';
}

const TEST_NUMBER_REGEX = /(?:Mock\s*Test|Grand\s*Mock|Mock|Test|Paper)\s*#?(\d+)/i;

function extractTestNumber(title: string): number | null {
  const match = TEST_NUMBER_REGEX.exec(title);
  return match ? Number.parseInt(match[1], 10) : null;
}

function sortTestsAscending(tests: PublishedTestItem[]): PublishedTestItem[] {
  return [...tests].sort((a, b) => {
    const numA = extractTestNumber(a.title);
    const numB = extractTestNumber(b.title);
    if (numA !== null && numB !== null) return numA - numB;
    if (numA !== null) return -1;
    if (numB !== null) return 1;
    return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
  });
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

export function TestSeriesDetail({
  seriesIdOrSlug,
  initialData,
  initialFullTests,
  initialPyqTests,
  initialAllTests,
  initialFullTestsTotal,
  initialPyqTestsTotal,
}: Readonly<Props>) {
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
  } | null>(() => {
    return (
      getCachedSeriesAccess(seriesIdOrSlug) ||
      (initialData?.id ? getCachedSeriesAccess(initialData.id) : null) ||
      (initialData?._id ? getCachedSeriesAccess(initialData._id) : null) ||
      (initialData?.slug ? getCachedSeriesAccess(initialData.slug) : null)
    );
  });

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
  const [fullTestsTotal, setFullTestsTotal] = useState(
    initialFullTestsTotal ?? partitionedInitial.full.length,
  );
  const [fullTestsPageLoaded, setFullTestsPageLoaded] = useState(1);
  const [loadingFullTests, setLoadingFullTests] = useState(!partitionedInitial.hasAll && partitionedInitial.full.length === 0);
  const [loadingMoreFullTests, setLoadingMoreFullTests] = useState(false);

  // PYQ tests state (dedicated official papers section)
  const [pyqTests, setPyqTests] = useState<PublishedTestItem[]>(partitionedInitial.pyq);
  const [pyqTestsTotal, setPyqTestsTotal] = useState(
    initialPyqTestsTotal ?? partitionedInitial.pyq.length,
  );
  const [pyqTestsPageLoaded, setPyqTestsPageLoaded] = useState(1);
  const [loadingPyqTests, setLoadingPyqTests] = useState(!partitionedInitial.hasAll && activeTab === 'pyq');
  const [loadingMorePyqTests, setLoadingMorePyqTests] = useState(false);
  const [pyqYearFilter, setPyqYearFilter] = useState<string>('ALL');
  const [pyqExamFilter, setPyqExamFilter] = useState<string>('ALL');

  // Pagination state (10 tests per page to minimize DOM footprint and React render compute)
  const [fullPage, setFullPage] = useState(1);
  const [pyqPage, setPyqPage] = useState(1);
  const [subjectPage, setSubjectPage] = useState(1);
  const [chapterPage, setChapterPage] = useState(1);
  const testListTopRef = useRef<HTMLDivElement>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setFullPage(1);
  }, [testSearchQuery]);

  useEffect(() => {
    setPyqPage(1);
  }, [testSearchQuery, pyqYearFilter, pyqExamFilter]);

  useEffect(() => {
    setSubjectPage(1);
  }, [testSearchQuery, selectedSubjectId]);

  useEffect(() => {
    setChapterPage(1);
  }, [testSearchQuery, chapterSubjectId, selectedChapterId]);

  // Fall back to full mocks if activeTab is pyq (with 0 pyqs) or chapter
  useEffect(() => {
    if ((activeTab === 'pyq' && pyqTests.length === 0) || activeTab === 'chapter') {
      setActiveTab('full');
    }
  }, [pyqTests.length, activeTab]);

  const scrollToTestList = () => {
    if (typeof window !== 'undefined') {
      const topOffset = testListTopRef.current?.getBoundingClientRect().top ?? 0;
      if (topOffset < 0) {
        testListTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };


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
    void loadSeries();
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

        if (res?.ok) {
          const data = (await res.json()) as LearnerSeriesPrep;
          setLearnerPrep(data);
        }
        if (accessRes?.ok) {
          const access = await accessRes.json();
          const accessData = {
            hasActivePass: Boolean(access.hasActivePass),
            passType: access.passType ?? null,
            expiresAt: access.expiresAt ?? null,
            sectionTrials: access.sectionTrials ?? undefined,
            freeTestId: access.freeTestId ?? null,
          };
          setSeriesAccess(accessData);
          setCachedSeriesAccess(resolvedSeriesId, accessData);
          if (series?.slug) setCachedSeriesAccess(series.slug, accessData);
          if (seriesIdOrSlug) setCachedSeriesAccess(seriesIdOrSlug, accessData);
        }
      } catch {
        // Non-fatal if student is not signed in
      }
    }

    void fetchPrepData();
  }, [series]);

  // Re-fetch progress if user logs in dynamically or switches accounts
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      const newUser = e?.detail?.user;
      if (newUser && series) {
        const seriesId = series.id || series._id;
        if (!seriesId) return;
        const resolvedSeriesId = seriesId;

        // Reset previous learner state immediately
        setLearnerPrep(null);
        // Load the new user's cached access immediately (or null if none)
        const freshCached = getCachedSeriesAccess(seriesIdOrSlug) || getCachedSeriesAccess(resolvedSeriesId);
        setSeriesAccess(freshCached);

        Promise.all([
          fetch(`${API_URL}/me/preparation/series/${resolvedSeriesId}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(resolvedSeriesId)}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]).then(([prep, access]) => {
          setLearnerPrep(prep ?? null);
          if (access) {
            const accessData = {
              hasActivePass: Boolean(access.hasActivePass),
              passType: access.passType ?? null,
              expiresAt: access.expiresAt ?? null,
              sectionTrials: access.sectionTrials ?? undefined,
              freeTestId: access.freeTestId ?? null,
            };
            setSeriesAccess(accessData);
            setCachedSeriesAccess(resolvedSeriesId, accessData);
            if (series?.slug) setCachedSeriesAccess(series.slug, accessData);
            if (seriesIdOrSlug) setCachedSeriesAccess(seriesIdOrSlug, accessData);
          } else {
            setSeriesAccess(null);
          }
        }).catch(() => {});
      } else if (!newUser) {
        setLearnerPrep(null);
        setSeriesAccess(null);
        clearCachedPassAccess();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user' || e.key === 'auth_active') {
        const currentUser = getCachedCurrentUser();
        if (!currentUser?.id) {
          setLearnerPrep(null);
          setSeriesAccess(null);
          clearCachedPassAccess();
        } else {
          setLearnerPrep(null);
          setSeriesAccess(getCachedSeriesAccess(seriesIdOrSlug));
          if (series) {
            const resolvedSeriesId = series.id || series._id;
            if (resolvedSeriesId) {
              void fetch(`${API_URL}/me/preparation/series/${resolvedSeriesId}`, { credentials: 'include' })
                .then(r => r.ok ? r.json() : null)
                .then(prep => setLearnerPrep(prep ?? null))
                .catch(() => {});
              void fetch(`${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(resolvedSeriesId)}`, { credentials: 'include' })
                .then(r => r.ok ? r.json() : null)
                .then(access => {
                  if (access) {
                    const accessData = {
                      hasActivePass: Boolean(access.hasActivePass),
                      passType: access.passType ?? null,
                      expiresAt: access.expiresAt ?? null,
                      sectionTrials: access.sectionTrials ?? undefined,
                      freeTestId: access.freeTestId ?? null,
                    };
                    setSeriesAccess(accessData);
                    setCachedSeriesAccess(resolvedSeriesId, accessData);
                  } else {
                    setSeriesAccess(null);
                  }
                })
                .catch(() => {});
            }
          }
        }
      }
    };

    window.addEventListener('auth:change', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('auth:change', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
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
    void fetchSubTests();
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
    void fetchChapTests();
  }, [series, activeTab]);

  // Load first page of Full tests (paginated) from API
  useEffect(() => {
    if (!series) return;
    const seriesKey = series.id || series._id;
    const url = `${API_URL}/test-series/${seriesKey}/tests?testMode=full&limit=${TESTS_API_PAGE_SIZE}&page=1`;
    if (initialFullTests && initialFullTests.length > 0 && !testsCacheRef.current.has(url)) {
      testsCacheRef.current.set(url, initialFullTests);
      setFullTests(initialFullTests);
      if (typeof initialFullTestsTotal === 'number') setFullTestsTotal(initialFullTestsTotal);
      setFullTestsPageLoaded(1);
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
          const parsed = normalizeTestsPayload(await res.json());
          testsCacheRef.current.set(url, parsed.items);
          setFullTests(parsed.items);
          setFullTestsTotal(parsed.total);
          setFullTestsPageLoaded(1);
        } else {
          setFullTests([]);
          setFullTestsTotal(0);
        }
      } catch {
        setFullTests([]);
        setFullTestsTotal(0);
      } finally {
        setLoadingFullTests(false);
      }
    }
    void fetchFullTests();
  }, [series, initialFullTests, initialFullTestsTotal]);

  // Load first page of PYQ tests (paginated) from API
  useEffect(() => {
    if (!series) return;
    const seriesKey = series.id || series._id;
    const url = `${API_URL}/test-series/${seriesKey}/tests?testMode=pyq&limit=${TESTS_API_PAGE_SIZE}&page=1`;
    if (testsCacheRef.current.has(url)) {
      setPyqTests(testsCacheRef.current.get(url)!);
      setLoadingPyqTests(false);
      return;
    }
    async function fetchPyqTests() {
      if (initialPyqTests && initialPyqTests.length > 0 && pyqTests.length === 0) {
        setPyqTests(initialPyqTests);
        if (typeof initialPyqTestsTotal === 'number') setPyqTestsTotal(initialPyqTestsTotal);
      }
      setLoadingPyqTests(true);
      try {
        const res = await fetch(url);
        if (res.ok) {
          const parsed = normalizeTestsPayload(await res.json());
          const merged = Array.from(
            new Map(
              [...(initialPyqTests || []), ...parsed.items].map((t: any) => [t.id || t._id, t]),
            ).values(),
          );
          testsCacheRef.current.set(url, merged);
          setPyqTests(merged);
          setPyqTestsTotal(Math.max(parsed.total, merged.length));
          setPyqTestsPageLoaded(1);
        } else {
          setPyqTests(initialPyqTests || []);
        }
      } catch {
        setPyqTests(initialPyqTests || []);
      } finally {
        setLoadingPyqTests(false);
      }
    }
    void fetchPyqTests();
  }, [series, initialPyqTests, initialPyqTestsTotal]);

  const loadMoreFullTests = useCallback(async () => {
    if (!series || loadingMoreFullTests) return;
    if (fullTests.length >= fullTestsTotal) return;
    const nextPage = fullTestsPageLoaded + 1;
    const seriesKey = series.id || series._id;
    const url = `${API_URL}/test-series/${seriesKey}/tests?testMode=full&limit=${TESTS_API_PAGE_SIZE}&page=${nextPage}`;
    setLoadingMoreFullTests(true);
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const parsed = normalizeTestsPayload(await res.json());
      setFullTests((prev) => {
        const merged = Array.from(
          new Map([...prev, ...parsed.items].map((t: any) => [t.id || t._id, t])).values(),
        );
        return merged;
      });
      setFullTestsTotal(parsed.total);
      setFullTestsPageLoaded(nextPage);
    } catch {
      // keep existing list
    } finally {
      setLoadingMoreFullTests(false);
    }
  }, [series, loadingMoreFullTests, fullTests.length, fullTestsTotal, fullTestsPageLoaded]);

  const loadMorePyqTests = useCallback(async () => {
    if (!series || loadingMorePyqTests) return;
    if (pyqTests.length >= pyqTestsTotal) return;
    const nextPage = pyqTestsPageLoaded + 1;
    const seriesKey = series.id || series._id;
    const url = `${API_URL}/test-series/${seriesKey}/tests?testMode=pyq&limit=${TESTS_API_PAGE_SIZE}&page=${nextPage}`;
    setLoadingMorePyqTests(true);
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const parsed = normalizeTestsPayload(await res.json());
      setPyqTests((prev) => {
        const merged = Array.from(
          new Map([...prev, ...parsed.items].map((t: any) => [t.id || t._id, t])).values(),
        );
        return merged;
      });
      setPyqTestsTotal(parsed.total);
      setPyqTestsPageLoaded(nextPage);
    } catch {
      // keep existing list
    } finally {
      setLoadingMorePyqTests(false);
    }
  }, [series, loadingMorePyqTests, pyqTests.length, pyqTestsTotal, pyqTestsPageLoaded]);

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
  const hasActivePass = Boolean(seriesAccess?.hasActivePass);
  const freeTestId = seriesAccess?.freeTestId ?? null;

  // STRICTLY 1 FREE TEST ONLY: Only Mock 01 in Full Mocks is free.
  // All other tests (Mock 02 onwards, all PYQs, all Subject Tests) are strictly locked and require the Pass / Series Plan.
  const freeTestIds = useMemo(() => {
    const ids = new Set<string>();
    const sortedFull = sortTestsAscending(fullTests);

    // Strictly the first Full Mock Test (Mock 01) is free
    sortedFull.slice(0, 1).forEach((t) => {
      const id = t.id || t._id;
      if (id) ids.add(id);
    });

    return ids;
  }, [fullTests]);

  const isTestLocked = (test: PublishedTestItem) => {
    if (hasActivePass) return false;
    const testId = test.id || test._id;
    if (!testId) return false;
    return !freeTestIds.has(testId);
  };

  const [unlockingTestId, setUnlockingTestId] = useState<string | null>(null);

  const handleUnlockTest = async (testId: string) => {
    if (!isClientAuthenticated()) {
      const loginUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      void import('astro:transitions/client')
        .then(({ navigate }) => navigate(loginUrl))
        .catch(() => {
          window.location.href = loginUrl;
        });
      return;
    }

    setUnlockingTestId(testId);
    try {
      const resolvedSeriesId = series?.id || series?._id || '';
      const planDefaults = getClientPlanDefaults();
      const result = await openTestSeriesCheckout({
        planType: 'series',
        seriesId: resolvedSeriesId || undefined,
        validityMonths: planDefaults.seriesPlan.validityMonths,
      });

      if (result.status === 'paid') {
        // Unlock all tests immediately
        const passData = {
          hasActivePass: true,
          passType: 'series' as const,
          expiresAt: result.expiresAt,
          freeTestId: seriesAccess?.freeTestId ?? null,
        };
        setSeriesAccess((prev) => ({
          hasActivePass: true,
          passType: 'series',
          expiresAt: result.expiresAt,
          freeTestId: prev?.freeTestId ?? null,
        }));
        if (resolvedSeriesId) setCachedSeriesAccess(resolvedSeriesId, passData);
        if (series?.slug) setCachedSeriesAccess(series.slug, passData);
        if (seriesIdOrSlug) setCachedSeriesAccess(seriesIdOrSlug, passData);

        if (resolvedSeriesId) {
          fetch(`${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(resolvedSeriesId)}`, {
            credentials: 'include',
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((access) => {
              if (access) {
                setSeriesAccess(access);
                if (resolvedSeriesId) setCachedSeriesAccess(resolvedSeriesId, access);
                if (series?.slug) setCachedSeriesAccess(series.slug, access);
              }
            })
            .catch(() => {});
        }
      } else if (result.status === 'cancelled') {
        const cardEl = document.getElementById('series-pass');
        cardEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setUnlockingTestId(null);
    }
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

  const totalFullMockCount = Math.max(fullTestsTotal, fullTests.length) + upcomingMockTests.length;
  const canLoadMoreFullTests = fullTests.length < fullTestsTotal;
  const canLoadMorePyqTests = pyqTests.length < pyqTestsTotal;
  const totalQuestionBankCount = useMemo(() => {
    return assignedSubjects.reduce((acc, s) => acc + (s.questionsCount || 0), 0);
  }, [assignedSubjects]);

  const totalAvailableTests = useMemo(() => {
    const subCount = subjectTests.length > 0 ? subjectTests.length : (assignedSubjects.length * 4);
    return totalFullMockCount + pyqTests.length + subCount;
  }, [totalFullMockCount, pyqTests.length, subjectTests.length, assignedSubjects.length]);

  const completedCount = useMemo(() => {
    if (!learnerPrep?.tests) return learnerPrep?.completedTestsCount ?? 0;
    return learnerPrep.tests.filter((t) => t.latestAttempt?.status === 'submitted' && t.testMode !== 'chapter').length;
  }, [learnerPrep]);

  const totalCount = Math.max(learnerPrep?.totalTestsCount || 0, totalAvailableTests);
  const unattemptedCount = Math.max(0, totalCount - completedCount);
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

  // Filtered Full Tests - Sorted ascending starting from Mock 1!
  const filteredFullTests = useMemo(() => {
    const sorted = sortTestsAscending(fullTests);
    if (!testSearchQuery.trim()) return sorted;
    const q = testSearchQuery.toLowerCase();
    return sorted.filter(
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

  const TESTS_PAGE_SIZE = 10;

  // Paginated slices for minimal DOM tree and zero layout thrashing
  const paginatedFullTests = useMemo(() => {
    const start = (fullPage - 1) * TESTS_PAGE_SIZE;
    return filteredFullTests.slice(start, start + TESTS_PAGE_SIZE);
  }, [filteredFullTests, fullPage]);

  const paginatedPyqTests = useMemo(() => {
    const start = (pyqPage - 1) * TESTS_PAGE_SIZE;
    return filteredPyqTests.slice(start, start + TESTS_PAGE_SIZE);
  }, [filteredPyqTests, pyqPage]);

  const paginatedSubjectTests = useMemo(() => {
    const start = (subjectPage - 1) * TESTS_PAGE_SIZE;
    return filteredSubjectTests.slice(start, start + TESTS_PAGE_SIZE);
  }, [filteredSubjectTests, subjectPage]);

  const paginatedChapterTests = useMemo(() => {
    const start = (chapterPage - 1) * TESTS_PAGE_SIZE;
    return filteredChapterTests.slice(start, start + TESTS_PAGE_SIZE);
  }, [filteredChapterTests, chapterPage]);

  return (
    <div className="space-y-6">
      {/* 1. HERO HEADER CARD */}
      <header className="rounded-3xl border border-border bg-surface-raised p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-heading px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-surface">
            {series.targetExam || 'DSSSB TGT'}
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-heading">
            {series.organization || 'Delhi Subordinate Services Selection Board'}
          </span>
          <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
            Part B (Computer Science & IT)
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl lg:text-[40px] leading-tight">
          {cleanDisplayTitle(series.title) || 'DSSSB TGT Computer Science'}
          <span className="ml-2 font-serif italic font-normal text-sky-700 dark:text-sky-400">
            Test Series
          </span>
        </h1>

        {/* 20 Days • 20 Tests Sprint Banner */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-linear-to-r from-amber-500/10 via-orange-500/10 to-transparent p-3.5 sm:p-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs">
            <span>🔥 20 DAYS SPRINT</span>
          </span>
          <p className="text-sm font-bold text-heading sm:text-base">
            <strong className="text-accent font-extrabold">20 Days • 20 Tests Challenge</strong> - 100% Authentic Previous Year Questions compiled from Multiple CS Exams!
          </p>
        </div>

        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted sm:text-[15px]">
          Dedicated CBT practice series featuring real PYQs curated from DSSSB, KVS, NVS, EMRS and State Teacher recruitment exams. Covers the complete Part B syllabus (100 Questions • 60 Mins • 100 Marks) with exact TCS-pattern interface, negative marking, and bilingual solutions.
        </p>

        {/* Stats Grid - 3 Columns (Chapters Covered removed per user request) */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Full Length Mocks</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">
              {totalFullMockCount} Tests (Part B)
            </p>
          </div>
          {pyqTests.length > 0 ? (
            <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Previous Year Papers</p>
              <p className="mt-1 text-base font-bold text-heading tabular-nums">
                {pyqTests.length} Official Papers
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Practice Questions</p>
              <p className="mt-1 text-base font-bold text-heading tabular-nums">
                {totalQuestionBankCount} Questions
              </p>
            </div>
          )}
          <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Assigned Subjects</p>
            <p className="mt-1 text-base font-bold text-heading tabular-nums">
              {assignedSubjects.length} Subjects
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
            className="dark-card rounded-2xl border border-white/10 bg-[#141312] p-5 text-white shadow-md sm:p-6"
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

            <p className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl tabular-nums">
              {completedCount} of {totalCount} tests completed
            </p>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-300 font-medium">
              <span>Overall Completion: {completionPct}%</span>
              <span>{unattemptedCount} unattempted tests remaining</span>
            </div>

            <progress
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full appearance-none bg-zinc-800 [&::-webkit-progress-bar]:bg-zinc-800 [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent"
              value={completionPct}
              max={100}
              aria-label="Overall test completion progress"
            >
              {completionPct}%
            </progress>
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
                <span>Full Mock Tests</span>
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

              {pyqTests.length > 0 && (
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
                  <span>Previous Year Papers</span>
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
              )}
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
                <span>Subject Tests</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === 'subject'
                      ? 'bg-accent-badge text-accent'
                      : 'bg-surface-raised border border-border text-muted'
                  }`}
                >
                  {subjectTests.length > 0 ? subjectTests.length : (assignedSubjects.length * 4)}
                </span>
              </button>

{/* Chapter Tests tab removed per user request */}
            </div>
          </div>

          {/* Top anchor for smooth tab pagination scrolling */}
          <div ref={testListTopRef} className="scroll-mt-6" />

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
                    aria-hidden="true"
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

              {loadingFullTests && (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              )}

              {!loadingFullTests && filteredFullTests.length === 0 && filteredUpcomingTests.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No mock tests found.</p>
                  <p className="mt-1 text-xs text-muted">
                    {testSearchQuery ? 'Try adjusting your search query.' : 'Tests for this mode will appear here.'}
                  </p>
                </div>
              )}

              {!loadingFullTests && (filteredFullTests.length > 0 || filteredUpcomingTests.length > 0) && (
                <>
                  <div className="space-y-4">
                    {paginatedFullTests.map((test, index) => {
                      const testId = test.id || test._id || '';
                      const latestAttempt = testAttemptMap.get(testId);
                      const isLocked = isTestLocked(test);
                      const isTrialAvailable = !hasActivePass && freeTestIds.has(testId);
                      return (
                        <RealTestCard
                          key={testId}
                          test={test}
                          index={(fullPage - 1) * TESTS_PAGE_SIZE + index}
                          latestAttempt={latestAttempt}
                          isLocked={isLocked}
                          hasActivePass={hasActivePass}
                          isTrialAvailable={isTrialAvailable}
                          onUnlock={() => void handleUnlockTest(testId)}
                          isUnlocking={unlockingTestId === testId}
                        />
                      );
                    })}
                    {filteredUpcomingTests.map((mock) => (
                      <UpcomingLockedMockCard key={mock.id} mock={mock} />
                    ))}
                  </div>

                  <PaginationControl
                    currentPage={fullPage}
                    totalItems={filteredFullTests.length}
                    pageSize={TESTS_PAGE_SIZE}
                    onPageChange={(p) => {
                      setFullPage(p);
                      scrollToTestList();
                    }}
                    itemName="mock tests"
                  />
                  {canLoadMoreFullTests && (
                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={() => void loadMoreFullTests()}
                        disabled={loadingMoreFullTests}
                        className="min-h-11 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-heading hover:bg-surface-raised disabled:opacity-60 cursor-pointer"
                      >
                        {loadingMoreFullTests ? 'Loading…' : `Load more tests (${fullTests.length}/${fullTestsTotal})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}


          {/* TAB 2: PREVIOUS YEAR PAPERS (PYQ SECTION) */}
          {activeTab === 'pyq' && pyqTests.length > 0 && (
            <div className="space-y-4">
              {/* Official Archive Header Card */}
              <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        Official Exam Archive
                      </span>
                      <span className="text-xs font-semibold text-muted">2018 - 2024 Verified Papers</span>
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
                    aria-hidden="true"
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

              {loadingPyqTests && (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              )}

              {!loadingPyqTests && filteredPyqTests.length === 0 && (
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
              )}

              {!loadingPyqTests && filteredPyqTests.length > 0 && (
                <>
                  <div className="space-y-4">
                    {paginatedPyqTests.map((test, index) => {
                      const testId = test.id || test._id || '';
                      const latestAttempt = testAttemptMap.get(testId);
                      const isLocked = isTestLocked(test);
                      const isTrialAvailable = !hasActivePass && freeTestIds.has(testId);
                      return (
                        <RealTestCard
                          key={testId}
                          test={test}
                          index={(pyqPage - 1) * TESTS_PAGE_SIZE + index}
                          latestAttempt={latestAttempt}
                          isLocked={isLocked}
                          hasActivePass={hasActivePass}
                          isTrialAvailable={isTrialAvailable}
                          onUnlock={() => void handleUnlockTest(testId)}
                          isUnlocking={unlockingTestId === testId}
                        />
                      );
                    })}
                  </div>

                  <PaginationControl
                    currentPage={pyqPage}
                    totalItems={filteredPyqTests.length}
                    pageSize={TESTS_PAGE_SIZE}
                    onPageChange={(p) => {
                      setPyqPage(p);
                      scrollToTestList();
                    }}
                    itemName="official papers"
                  />
                  {canLoadMorePyqTests && (
                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={() => void loadMorePyqTests()}
                        disabled={loadingMorePyqTests}
                        className="min-h-11 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-heading hover:bg-surface-raised disabled:opacity-60 cursor-pointer"
                      >
                        {loadingMorePyqTests ? 'Loading…' : `Load more papers (${pyqTests.length}/${pyqTestsTotal})`}
                      </button>
                    </div>
                  )}
                </>
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
                      aria-hidden="true"
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

              {loadingSubjectTests && (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              )}

              {!loadingSubjectTests && filteredSubjectTests.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No subject tests found.</p>
                  <p className="mt-1 text-xs text-muted">
                    {testSearchQuery || selectedSubjectId ? 'Try adjusting your subject or search query.' : 'Tests for this mode will appear here.'}
                  </p>
                </div>
              )}

              {!loadingSubjectTests && filteredSubjectTests.length > 0 && (
                <>
                  <div className="space-y-4">
                    {paginatedSubjectTests.map((test, index) => {
                      const testId = test.id || test._id || '';
                      const latestAttempt = testAttemptMap.get(testId);
                      const isLocked = isTestLocked(test);
                      const isTrialAvailable = !hasActivePass && freeTestIds.has(testId);
                      return (
                        <RealTestCard
                          key={testId}
                          test={test}
                          index={(subjectPage - 1) * TESTS_PAGE_SIZE + index}
                          latestAttempt={latestAttempt}
                          isLocked={isLocked}
                          hasActivePass={hasActivePass}
                          isTrialAvailable={isTrialAvailable}
                          onUnlock={() => void handleUnlockTest(testId)}
                          isUnlocking={unlockingTestId === testId}
                        />
                      );
                    })}
                  </div>

                  <PaginationControl
                    currentPage={subjectPage}
                    totalItems={filteredSubjectTests.length}
                    pageSize={TESTS_PAGE_SIZE}
                    onPageChange={(p) => {
                      setSubjectPage(p);
                      scrollToTestList();
                    }}
                    itemName="subject tests"
                  />
                </>
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
                        aria-hidden="true"
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

              {loadingChapterTests && (
                <div className="space-y-3 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface border border-border" />
                  ))}
                </div>
              )}

              {!loadingChapterTests && filteredChapterTests.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-sm font-semibold text-heading">No chapter tests found for this selection.</p>
                  <p className="mt-1 text-xs text-muted">Pick another chapter, subject or adjust your search.</p>
                </div>
              )}

              {!loadingChapterTests && filteredChapterTests.length > 0 && (
                <>
                  <div className="space-y-4">
                    {paginatedChapterTests.map((test, index) => {
                      const testId = test.id || test._id || '';
                      const latestAttempt = testAttemptMap.get(testId);
                      const isLocked = isTestLocked(test);
                      const isTrialAvailable = !hasActivePass && freeTestIds.has(testId);
                      return (
                        <RealTestCard
                          key={testId}
                          test={test}
                          index={(chapterPage - 1) * TESTS_PAGE_SIZE + index}
                          latestAttempt={latestAttempt}
                          isLocked={isLocked}
                          hasActivePass={hasActivePass}
                          isTrialAvailable={isTrialAvailable}
                        />
                      );
                    })}
                  </div>

                  <PaginationControl
                    currentPage={chapterPage}
                    totalItems={filteredChapterTests.length}
                    pageSize={TESTS_PAGE_SIZE}
                    onPageChange={(p) => {
                      setChapterPage(p);
                      scrollToTestList();
                    }}
                    itemName="chapter tests"
                  />
                </>
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
                      if (access) {
                        setSeriesAccess(access);
                        if (resolvedSeriesId) setCachedSeriesAccess(resolvedSeriesId, access);
                        if (series?.slug) setCachedSeriesAccess(series.slug, access);
                        if (seriesIdOrSlug) setCachedSeriesAccess(seriesIdOrSlug, access);
                      }
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
  onUnlock,
  isUnlocking = false,
}: Readonly<{
  test: PublishedTestItem;
  index?: number;
  latestAttempt?: LatestAttemptMeta | null;
  isLocked: boolean;
  hasActivePass: boolean;
  isTrialAvailable?: boolean;
  onUnlock?: () => void;
  isUnlocking?: boolean;
}>) {
  const routeId = testRouteId(test);
  const testId = test.id || test._id || '';
  const isInProgress = latestAttempt?.status === 'in_progress';
  const isSubmitted = latestAttempt?.status === 'submitted';
  const totalMarks = test.positiveMarks * test.totalQuestionsCount;

  const isHighlighted = isTrialAvailable && index === 0;

  function renderCardAction() {
    if (isInProgress) {
      return (
        <a
          href={`/exams/${testId}/attempt`}
          onClick={(e) => handleTestNavigate(e, `/exams/${testId}/attempt`)}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white transition hover:bg-accent-hover"
        >
          <span>Resume Test</span>
          <span aria-hidden="true">→</span>
        </a>
      );
    }

    if (isSubmitted) {
      return (
        <div className="flex flex-col gap-1.5 sm:items-end">
          <a
            href={`/test-series/results/${latestAttempt!.id}`}
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
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
      );
    }

    if (isLocked) {
      return (
        <div className="flex flex-col sm:items-end">
          <button
            type="button"
            onClick={onUnlock}
            disabled={isUnlocking}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-bold text-accent transition hover:bg-accent hover:text-white cursor-pointer disabled:cursor-wait disabled:opacity-60"
          >
            <span>{isUnlocking ? 'Opening Checkout...' : `🔒 Unlock (from ${formatRupees(getClientPlanDefaults().seriesPlan.amountPaise)})`}</span>
          </button>
          <span className="mt-1.5 text-center text-[11px] text-muted sm:text-right font-medium">
            Pass needed to attempt
          </span>
        </div>
      );
    }

    let subLabel = null;
    if (hasActivePass) {
      subLabel = (
        <span className="mt-1.5 text-center text-[11px] text-muted sm:text-right font-medium">
          Included in Pass
        </span>
      );
    } else if (isTrialAvailable) {
      subLabel = (
        <span className="mt-1.5 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 sm:text-right">
          100% Free Mock
        </span>
      );
    }

    return (
      <div className="flex flex-col sm:items-end">
        <a
          href={`/test-series/instructions/${routeId}`}
          onClick={(e) => handleTestNavigate(e, `/test-series/instructions/${routeId}`)}
          data-astro-prefetch="hover"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-accent-hover"
        >
          <span>{isTrialAvailable ? 'Start Free Attempt' : 'Start Test'}</span>
          <span aria-hidden="true">→</span>
        </a>
        {subLabel}
      </div>
    );
  }

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
          {isLocked && (
            <div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-raised px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                <span>🔒 PASS REQUIRED</span>
              </span>
            </div>
          )}
          {!isLocked && !hasActivePass && (
            <div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span>FREE TEST</span>
              </span>
            </div>
          )}

          {/* Test Title */}
          <h3 className="text-base font-bold text-heading hover:text-accent transition sm:text-lg">
            <a
              href={`/test-series/instructions/${routeId}`}
              onClick={(e) => handleTestNavigate(e, `/test-series/instructions/${routeId}`)}
              data-astro-prefetch="hover"
            >
              {cleanDisplayTitle(test.title)}
            </a>
          </h3>

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted font-medium">
            {test.testMode === 'full' && (
              <>
                <span className="inline-flex items-center rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                  Part B • CS
                </span>
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Multi-Exam PYQs
                </span>
              </>
            )}
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
          {renderCardAction()}
        </div>
      </div>
    </article>
  );
}

// UPCOMING LOCKED MOCK CARD COMPONENT
function UpcomingLockedMockCard({ mock }: Readonly<{ mock: UpcomingMockTest }>) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6 transition hover:border-accent/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Top Status Pill: Locked • Coming Soon */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <svg aria-hidden="true" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Locked • Coming Soon</span>
            </span>
          </div>

          {/* Test Title */}
          <h3 className="text-base font-bold text-heading sm:text-lg">
            {cleanDisplayTitle(mock.title)}
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
        </div>

        {/* Action Button: Locked */}
        <div className="flex shrink-0 flex-col sm:items-end">
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-5 py-2.5 text-xs font-bold text-muted opacity-80 select-none shadow-2xs"
          >
            <svg aria-hidden="true" className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

// REUSABLE TEST LIST PAGINATION BAR
function PaginationControl({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  itemName = 'tests',
}: Readonly<{
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}>) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pages: (number | 'dots')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('dots');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('dots');
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label={`${itemName} pagination`}
      className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-xs sm:flex-row sm:items-center sm:justify-between shadow-2xs"
    >
      <span className="font-medium text-muted">
        Showing <strong className="font-semibold text-heading tabular-nums">{startItem}</strong>-<strong className="font-semibold text-heading tabular-nums">{endItem}</strong> of <strong className="font-semibold text-heading tabular-nums">{totalItems}</strong> {itemName}
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border bg-surface-raised px-3 py-1.5 font-semibold text-heading hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer select-none"
        >
          Previous
        </button>

        {pages.map((p, idx) => {
          if (p === 'dots') {
            const dotsKey = idx < 4 ? 'dots-prev' : 'dots-next';
            return (
              <span key={dotsKey} className="px-1 text-muted select-none">
                …
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer select-none ${
                isActive
                  ? 'bg-accent text-white shadow-2xs'
                  : 'border border-border bg-surface-raised text-heading hover:border-accent/40'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border bg-surface-raised px-3 py-1.5 font-semibold text-heading hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40 transition cursor-pointer select-none"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
