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
    <div className="space-y-4 font-['Geist']">
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
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
              className="w-full sm:w-auto bg-editorial-surface border border-editorial-border text-editorial-heading rounded-xl px-3 py-2 text-xs font-medium focus:border-editorial-accent focus:outline-hidden cursor-pointer shadow-2xs"
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
      <section className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4.5 bg-editorial-accent rounded-full inline-block"></span>
            <div>
              <h2 className="font-['EB_Garamond'] text-xl sm:text-[23px] font-normal text-editorial-heading tracking-tight leading-tight">
                Published Test Series
              </h2>
              <p className="text-[12px] text-editorial-muted">
                Select an exam suite to practice Subject-wise tests, Chapter-wise tests, and Full Mock Tests.
              </p>
            </div>
          </div>
          <span className="text-[11.5px] font-medium text-editorial-accent bg-editorial-accent-badge px-3 py-0.5 rounded-full border border-editorial-accent/20 shrink-0">
            {sortedList.length} Suites Available
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
          <div className="py-16 text-center rounded-2xl border border-dashed border-editorial-border bg-editorial-surface/50 p-8 space-y-2">
            <p className="text-sm font-semibold text-editorial-heading">No test series found</p>
            <p className="text-xs text-editorial-muted">Try resetting your category or search filters.</p>
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
                  data-astro-prefetch="hover"
                  className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-3">
                    {/* Header: Organization and Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-editorial-accent-soft border border-editorial-accent/25 text-editorial-accent flex items-center justify-center font-bold text-xs shrink-0">
                          {series.targetExam ? series.targetExam.slice(0, 3).toUpperCase() : 'EX'}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[11.5px] font-medium text-editorial-muted truncate">
                            {series.organization || series.targetExam}
                          </span>
                        </div>
                      </div>

                      {series.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-editorial-accent-badge text-editorial-accent border border-editorial-accent/25 shrink-0">
                          {series.badge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-['EB_Garamond'] text-[17px] sm:text-[18px] font-medium text-editorial-heading group-hover:text-editorial-accent transition-colors line-clamp-2 leading-snug">
                      {series.title}
                    </h3>

                    {/* Description if present */}
                    {series.description && (
                      <p className="text-[12.5px] text-editorial-muted line-clamp-2 leading-relaxed">
                        {series.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Metadata and CTA */}
                  <div className="pt-3.5 mt-3.5 border-t border-editorial-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          series.accessType === 'free'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                            : series.accessType === 'freemium'
                              ? 'bg-editorial-accent-soft text-editorial-accent border border-editorial-accent/25'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25'
                        }`}
                      >
                        {series.accessType}
                      </span>
                      <span className="text-[11.5px] text-editorial-muted">
                        {series.supportedLanguages?.join('/') || 'Hindi/English'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-editorial-accent font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
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
