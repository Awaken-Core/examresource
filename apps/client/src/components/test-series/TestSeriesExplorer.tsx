import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/api';

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
}

const CATEGORIES = [
  { id: 'all', label: 'All Exams' },
  { id: 'central-government', label: 'Central Govt' },
  { id: 'state-exams', label: 'State Exams' },
  { id: 'banking', label: 'Banking' },
  { id: 'ssc-railways', label: 'SSC & Railways' },
  { id: 'teaching', label: 'Teaching' },
  { id: 'defence', label: 'Defence' },
  { id: 'others', label: 'Others' },
];

interface TestSeriesExplorerProps {
  initialList?: StudentTestSeries[];
}

export function TestSeriesExplorer({ initialList }: TestSeriesExplorerProps = {}) {
  const [seriesList, setSeriesList] = useState<StudentTestSeries[]>(initialList || []);
  const [isLoading, setIsLoading] = useState(!initialList || initialList.length === 0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const fetchPublishedSeries = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_URL}/test-series`);
      if (!res.ok) {
        throw new Error(`Failed to load test series (status ${res.status})`);
      }
      const data = await res.json();
      setSeriesList(data || []);
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
    if (selectedCategory !== 'all' && s.category !== selectedCategory) {
      return false;
    }
    if (accessFilter === 'free' && s.accessType === 'premium') {
      return false;
    }
    if (accessFilter === 'premium' && s.accessType === 'free') {
      return false;
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
    return (a.order ?? 0) - (b.order ?? 0);
  });

  return (
    <div className="space-y-4">
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
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                selectedCategory === cat.id
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface hover:bg-surface-raised border border-border text-muted hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <svg
              className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-muted focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent transition shadow-2xs"
            />
          </div>

          <div className="shrink-0">
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
              className="w-full sm:w-auto bg-surface border border-border text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-accent focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">Free & Premium</option>
              <option value="free">Free Access</option>
              <option value="premium">Premium Only</option>
            </select>
          </div>

          <div className="shrink-0">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full sm:w-auto bg-surface border border-border text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-accent focus:outline-hidden cursor-pointer shadow-2xs"
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
              className="w-full sm:w-auto bg-surface border border-border text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-accent focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="az">Name A-Z</option>
              <option value="za">Name Z-A</option>
            </select>
          </div>
        </div>
      </section>

      {/* Popular Test Series Header */}
      <section className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <h2 className="text-base font-bold text-white tracking-tight">
                Published Test Series
              </h2>
            </div>
            <p className="text-[11px] text-muted">
              Select an exam suite to practice Subject-wise tests, Chapter-wise tests, and Full Mock
              Tests.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted">
            {sortedList.length} Suites Available
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-muted">
              Loading authentic test series from GovtPariksha...
            </span>
          </div>
        )}

        {/* Error State */}
        {fetchError && !isLoading && (
          <div className="p-6 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/20 dark:border-rose-900/40 text-center space-y-3">
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{fetchError}</p>
            <button
              type="button"
              onClick={fetchPublishedSeries}
              className="px-4 py-2 bg-accent hover:opacity-90 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !fetchError && sortedList.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border p-8 space-y-2">
            <p className="text-xs font-bold text-white">No test series found</p>
            <p className="text-[11px] text-muted">Try resetting your category or search filters.</p>
          </div>
        )}

        {/* Grid of Real Cards */}
        {!isLoading && !fetchError && sortedList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedList.map((series) => {
              const seriesId = series.id || series._id!;
              const seriesSlug = series.slug || seriesId;
              return (
                <a
                  key={seriesId}
                  href={`/test-series/${seriesSlug}`}
                  className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-surface border border-border/80 hover:border-accent/50 hover:shadow-lg transition-all duration-200 shadow-2xs"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/60 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl pointer-events-none" />

                  <div className="space-y-3">
                    {/* Header: Organization and Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                          {series.targetExam ? series.targetExam.slice(0, 3).toUpperCase() : 'EX'}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[11px] font-semibold text-muted truncate">
                            {series.organization || series.targetExam}
                          </span>
                        </div>
                      </div>

                      {series.badge && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                          {series.badge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                      {series.title}
                    </h3>

                    {/* Description if present */}
                    {series.description && (
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {series.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Metadata and CTA */}
                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                          series.accessType === 'free'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : series.accessType === 'freemium'
                              ? 'bg-accent/10 text-accent border border-accent/20'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {series.accessType}
                      </span>
                      <span className="text-[11px] text-muted">
                        {series.supportedLanguages?.join('/') || 'Hindi/English'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-accent font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                      <span>Explore Tests</span>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
