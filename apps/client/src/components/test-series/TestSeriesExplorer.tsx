import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_URL } from '../../lib/api';

const ITEMS_PER_PAGE = 9;

export interface StudentTestSeries {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description?: string | null;
  targetExam: string;
  category: string;
  organization?: string | null;
  status: 'published' | 'draft' | 'archived';
  accessType: 'free' | 'premium' | 'freemium';
  supportedLanguages: string[];
  badge?: string | null;
  logoUrl?: string | null;
  order: number;
  subjectsCount?: number;
  testsCount?: number;
  isComingSoon?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All Exams' },
  { id: 'teaching', label: 'Teaching' },
  { id: 'ssc-railways', label: 'SSC & Railways' },
  { id: 'central-government', label: 'Central Govt' },
  { id: 'state-exams', label: 'State Exams' },
  { id: 'banking', label: 'Banking' },
  { id: 'defence', label: 'Defence' },
  { id: 'others', label: 'Others' },
];

const CURATED_COMING_SOON_SERIES: StudentTestSeries[] = [
  {
    id: 'ssc-cgl-2026-cbt',
    title: 'SSC CGL Tier 1 & Tier 2 CBT Series 2026',
    slug: 'ssc-cgl-2026-cbt',
    targetExam: 'SSC CGL 2026',
    organization: 'Staff Selection Commission (SSC)',
    category: 'ssc-railways',
    badge: 'COMING SOON',
    status: 'published',
    accessType: 'free',
    supportedLanguages: ['Hindi', 'English'],
    description: 'Comprehensive Tier-1 & Tier-2 mock tests on latest 2026 TCS pattern, General Awareness updates, and sectional time-limit practice.',
    order: 2,
    isComingSoon: true,
  },
  {
    id: 'rrb-ntpc-group-d-2026',
    title: 'RRB NTPC & Group D CBT Mock Series 2026',
    slug: 'rrb-ntpc-group-d-2026',
    targetExam: 'RRB NTPC 2026',
    organization: 'Railway Recruitment Board (RRB)',
    category: 'ssc-railways',
    badge: 'COMING SOON',
    status: 'published',
    accessType: 'free',
    supportedLanguages: ['Hindi', 'English'],
    description: 'Stage 1 & Stage 2 CBT practice papers with exact Railway exam interface, negative marking simulation, and chapter-wise tests.',
    order: 3,
    isComingSoon: true,
  },
  {
    id: 'ctet-teaching-series-2026',
    title: 'CTET & State TET Teaching Mock Series 2026',
    slug: 'ctet-teaching-series-2026',
    targetExam: 'CTET & State TETs 2026',
    organization: 'CBSE & State Examination Boards',
    category: 'teaching',
    badge: 'COMING SOON',
    status: 'published',
    accessType: 'free',
    supportedLanguages: ['Hindi', 'English'],
    description: 'Paper-1 & Paper-2 bilingual mock tests covering Child Development, Pedagogy, Mathematics, Science, and Social Studies.',
    order: 4,
    isComingSoon: true,
  },
];

function curateTestSeries(rawList: StudentTestSeries[]): StudentTestSeries[] {
  // Find DSSSB from rawList if present
  const dsssbFromDb = rawList.find(
    (s) =>
      s.slug?.toLowerCase().includes('dsssb') ||
      s.title?.toLowerCase().includes('dsssb') ||
      s.targetExam?.toLowerCase().includes('dsssb')
  );

  const liveDsssb: StudentTestSeries = dsssbFromDb
    ? {
        ...dsssbFromDb,
        badge: 'LIVE CBT · POPULAR',
        category: 'teaching',
        order: 1,
        isComingSoon: false,
      }
    : {
        id: 'dsssb-tgt-computer-science',
        title: 'DSSSB TGT Computer Science',
        slug: 'dsssb-tgt-computer-science',
        targetExam: 'DSSSB TGT CS 2026',
        organization: 'Delhi Subordinate Services Selection Board',
        category: 'teaching',
        status: 'published',
        accessType: 'freemium',
        supportedLanguages: ['Hindi', 'English'],
        badge: 'LIVE CBT · POPULAR',
        description: 'Complete mock test series for DSSSB TGT & PGT Computer Science featuring full examination simulations, sectional tests, and subject practice.',
        order: 1,
        isComingSoon: false,
      };

  return [liveDsssb, ...CURATED_COMING_SOON_SERIES];
}

interface TestSeriesExplorerProps {
  initialList?: StudentTestSeries[];
}

export function TestSeriesExplorer({ initialList }: TestSeriesExplorerProps = {}) {
  const [seriesList, setSeriesList] = useState<StudentTestSeries[]>(() =>
    curateTestSeries(initialList || [])
  );
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  // Pagination state (9 suites per page: optimal 3x3 layout)
  const [currentPage, setCurrentPage] = useState(1);
  const gridTopRef = useRef<HTMLDivElement>(null);

  const fetchPublishedSeries = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_URL}/test-series`);
      if (!res.ok) {
        throw new Error(`Failed to load test series (status ${res.status})`);
      }
      const data = await res.json();
      setSeriesList(curateTestSeries(data || []));
    } catch (err: any) {
      setFetchError(err.message || 'Unable to connect to the test series service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialList || initialList.length === 0) {
      fetchPublishedSeries();
    }
  }, [initialList]);

  // Filter & sort logic
  const filteredList = seriesList.filter((s) => {
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'central-government') {
        const matchOrg = (s.organization || '').toLowerCase();
        const matchExam = (s.targetExam || '').toLowerCase();
        if (!matchOrg.includes('delhi') && !matchExam.includes('ssc') && !matchOrg.includes('staff')) {
          return false;
        }
      } else if (selectedCategory === 'state-exams') {
        const matchExam = (s.targetExam || '').toLowerCase();
        if (!matchExam.includes('tet') && !matchExam.includes('dsssb')) {
          return false;
        }
      } else if (s.category !== selectedCategory) {
        return false;
      }
    }

    if (languageFilter !== 'all') {
      if (!s.supportedLanguages || !s.supportedLanguages.includes(languageFilter)) {
        return false;
      }
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(term);
      const matchExam = s.targetExam?.toLowerCase().includes(term);
      const matchOrg = s.organization?.toLowerCase().includes(term);
      if (!matchTitle && !matchExam && !matchOrg) return false;
    }
    return true;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    if (sortBy === 'az') return a.title.localeCompare(b.title);
    if (sortBy === 'za') return b.title.localeCompare(a.title);
    const getPriority = (item: StudentTestSeries) => {
      if (typeof item.order === 'number' && item.order > 0) return item.order;
      const s = (item.slug || '').toLowerCase();
      const t = (item.title || '').toLowerCase();
      if (s.includes('dsssb') || t.includes('dsssb')) return 1;
      return 999;
    };
    const orderA = getPriority(a);
    const orderB = getPriority(b);
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });

  // Reset to first page when any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, search, languageFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedList.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedList = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return sortedList.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedList, safePage]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(clamped);
    if (typeof window !== 'undefined') {
      const topOffset = gridTopRef.current?.getBoundingClientRect().top ?? 0;
      if (topOffset < 0) {
        gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | 'dots')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('dots');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('dots');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <div id="test-series-grid-anchor" className="space-y-4 font-['Geist'] scroll-mt-6">
      {/* Category Tabs */}
      <section className="space-y-2.5 pt-1">
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer select-none border ${
                selectedCategory === cat.id
                  ? 'bg-editorial-accent text-white border-editorial-accent shadow-2xs font-semibold'
                  : 'bg-editorial-surface hover:bg-editorial-accent-soft border-editorial-border text-editorial-muted hover:text-editorial-heading'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <div className="relative flex-1 min-w-0">
            <svg
              className="w-4 h-4 text-editorial-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search test series by exam name, syllabus or board..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-editorial-surface border border-editorial-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-editorial-heading placeholder:text-editorial-muted/60 focus:border-editorial-accent focus:outline-hidden focus:ring-1 focus:ring-editorial-accent/20 transition shadow-2xs"
            />
          </div>

          <div className="shrink-0">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full sm:w-auto bg-editorial-surface border border-editorial-border text-editorial-heading rounded-xl px-3 py-2 text-xs font-medium focus:border-editorial-accent focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">All Languages</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
            </select>
          </div>

          <div className="shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-editorial-surface border border-editorial-border text-editorial-heading rounded-xl px-3 py-2 text-xs font-medium focus:border-editorial-accent focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="az">Name A-Z</option>
              <option value="za">Name Z-A</option>
            </select>
          </div>
        </div>
      </section>

      {/* Popular Test Series Header */}
      <section className="space-y-3.5 pt-2" ref={gridTopRef}>
        <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4.5 bg-editorial-accent rounded-full inline-block"></span>
            <div>
              <h2 className="font-['EB_Garamond'] text-xl sm:text-[23px] font-normal text-editorial-heading tracking-tight leading-tight">
                Curated Exam Test Series
              </h2>
              <p className="text-[12px] text-editorial-muted">
                Active examination suites and upcoming CBT question banks.
              </p>
            </div>
          </div>
          <span className="text-[11.5px] font-medium text-editorial-accent bg-editorial-accent-badge px-3 py-0.5 rounded-full border border-editorial-accent/20 shrink-0">
            {sortedList.length} Suites ({sortedList.filter((s) => !s.isComingSoon).length} Live · {sortedList.filter((s) => s.isComingSoon).length} In Prep)
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <span className="w-6 h-6 border-2 border-editorial-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-editorial-muted">
              Loading authentic test series from GovtPariksha...
            </span>
          </div>
        )}

        {/* Error State */}
        {fetchError && !isLoading && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
            <p className="text-xs font-semibold text-rose-500">{fetchError}</p>
            <button
              type="button"
              onClick={fetchPublishedSeries}
              className="px-4 py-2 bg-editorial-accent hover:bg-editorial-accent-hover text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !fetchError && sortedList.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-editorial-border bg-editorial-surface/50 p-8 space-y-3">
            <p className="text-sm font-semibold text-editorial-heading">No test series found under this filter</p>
            <p className="text-xs text-editorial-muted">We are actively preparing new exam suites. Check out All Exams to explore available tests.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearch('');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-editorial-accent text-white hover:bg-editorial-accent-hover transition cursor-pointer shadow-2xs"
            >
              Show All Exams
            </button>
          </div>
        )}

        {/* Grid of Real Cards */}
        {!isLoading && !fetchError && sortedList.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedList.map((series) => {
                const seriesId = series.id || series._id!;
                const seriesSlug = series.slug || seriesId;
                const isComingSoon = Boolean(series.isComingSoon);

                if (isComingSoon) {
                  return (
                    <div
                      key={seriesId}
                      className="group relative flex flex-col justify-between rounded-2xl overflow-hidden bg-editorial-surface/60 border border-editorial-border hover:border-amber-400/50 hover:shadow-sm transition-all duration-200"
                    >
                      {/* Subtle Top Accent */}
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

                      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
                        {/* Header: Organization and Coming Soon Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 tracking-tight">
                              {series.targetExam ? series.targetExam.slice(0, 3).toUpperCase() : 'EX'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className="block text-[11px] font-semibold text-editorial-muted truncate"
                                title={series.organization || series.targetExam}
                              >
                                {series.organization || series.targetExam}
                              </span>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 whitespace-nowrap flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Coming Soon
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-['EB_Garamond'] text-[18px] sm:text-[19px] font-medium text-editorial-heading leading-snug tracking-tight">
                          {series.title}
                        </h3>

                        {/* Description */}
                        {series.description && (
                          <p className="text-[12px] text-editorial-muted line-clamp-2 leading-relaxed">
                            {series.description}
                          </p>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="px-4 sm:px-5 py-3 border-t border-editorial-border/60 flex items-center justify-between gap-2 text-xs bg-editorial-surface/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] text-editorial-muted truncate">
                            {series.supportedLanguages?.join('/') || 'Hindi/English'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-amber-600/90 dark:text-amber-400 font-semibold text-[11px] shrink-0 select-none bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25">
                          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Launching Soon</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Live Active Test Series Card (DSSSB) — Premium Highlighted Design
                return (
                  <a
                    key={seriesId}
                    href={`/test-series/${seriesSlug}`}
                    data-astro-prefetch="hover"
                    className="group relative flex flex-col justify-between rounded-2xl overflow-hidden border-2 border-editorial-accent/40 hover:border-editorial-accent shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-editorial-surface via-editorial-surface to-editorial-accent-soft"
                  >
                    {/* Premium Top Accent Bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-editorial-accent via-amber-500 to-editorial-accent" />

                    <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
                      {/* Header: Organization and Live Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-editorial-accent to-editorial-accent-hover text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-md tracking-tight">
                            DSS
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              className="block text-[11px] font-semibold text-editorial-muted truncate"
                              title={series.organization || series.targetExam}
                            >
                              {series.organization || series.targetExam}
                            </span>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.5)] shrink-0 whitespace-nowrap flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          LIVE CBT
                        </span>
                      </div>

                      {/* Title — Large, Bold, Premium Font */}
                      <h3 className="font-['EB_Garamond'] text-[20px] sm:text-[22px] font-semibold text-editorial-heading group-hover:text-editorial-accent transition-colors leading-snug tracking-tight">
                        {series.title}
                      </h3>

                      {/* Description */}
                      {series.description && (
                        <p className="text-[12.5px] text-editorial-muted line-clamp-2 leading-relaxed">
                          {series.description}
                        </p>
                      )}

                      {/* Feature Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-editorial-accent-soft text-editorial-accent text-[10px] font-semibold border border-editorial-accent/20">
                          <span>📝</span> Full-Length Mocks
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[10px] font-semibold border border-cyan-500/20">
                          <span>📊</span> AI Rank
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[10px] font-semibold border border-violet-500/20">
                          <span>💡</span> Bilingual
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Premium CTA */}
                    <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-editorial-accent/5 via-transparent to-editorial-accent/5 border-t border-editorial-border flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] text-editorial-muted truncate">
                          {series.supportedLanguages?.join('/') || 'Hindi/English'}
                        </span>
                        <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">FREE</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-white font-bold text-[11px] shrink-0 bg-editorial-accent hover:bg-editorial-accent-hover px-3.5 py-1.5 rounded-lg shadow-sm group-hover:shadow-md transition-all">
                        <span>Explore Tests</span>
                        <svg
                          className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Test series pagination"
                className="pt-6 mt-4 border-t border-editorial-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-editorial-muted"
              >
                <div>
                  Showing <strong className="text-editorial-heading font-semibold tabular-nums">{(safePage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong className="text-editorial-heading font-semibold tabular-nums">{Math.min(safePage * ITEMS_PER_PAGE, sortedList.length)}</strong> of <strong className="text-editorial-heading font-semibold tabular-nums">{sortedList.length}</strong> suites
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => handlePageChange(safePage - 1)}
                    className="px-3 py-1.5 rounded-lg border border-editorial-border bg-editorial-surface text-editorial-heading hover:bg-editorial-accent-soft disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium select-none shadow-2xs"
                    aria-label="Previous page"
                  >
                    Previous
                  </button>

                  {pageNumbers.map((p, idx) => {
                    if (p === 'dots') {
                      return (
                        <span key={`dots-${idx}`} className="px-1 text-editorial-muted select-none">
                          …
                        </span>
                      );
                    }
                    const isActive = p === safePage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                          isActive
                            ? 'bg-editorial-accent text-white border border-editorial-accent shadow-2xs'
                            : 'border border-editorial-border bg-editorial-surface text-editorial-heading hover:bg-editorial-accent-soft'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => handlePageChange(safePage + 1)}
                    className="px-3 py-1.5 rounded-lg border border-editorial-border bg-editorial-surface text-editorial-heading hover:bg-editorial-accent-soft disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium select-none shadow-2xs"
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
