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

export function TestSeriesExplorer() {
  const [seriesList, setSeriesList] = useState<StudentTestSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    fetchPublishedSeries();
  }, []);

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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-700'
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
              className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search test series by exam name, syllabus or board..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
            />
          </div>

          <div className="shrink-0">
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-600 focus:outline-hidden cursor-pointer shadow-2xs"
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
              className="w-full sm:w-auto bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-600 focus:outline-hidden cursor-pointer shadow-2xs"
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
              className="w-full sm:w-auto bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-600 focus:outline-hidden cursor-pointer shadow-2xs"
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
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                Published Test Series
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Select an exam suite to practice Subject-wise tests, Chapter-wise tests, and Full Mock Tests.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            {sortedList.length} Suites Available
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Loading authentic test series from GovtPariksha...
            </span>
          </div>
        )}

        {/* Error State */}
        {fetchError && !isLoading && (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-center space-y-3">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={fetchPublishedSeries}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !fetchError && sortedList.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No test series found</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Try resetting your category or search filters.
            </p>
          </div>
        )}

        {/* Grid of Real Cards */}
        {!isLoading && !fetchError && sortedList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedList.map((series) => {
              const seriesId = series.id || series._id!;
              return (
                <a
                  key={seriesId}
                  href={`/test-series/${seriesId}`}
                  className="group flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-blue-500/60 dark:hover:border-blue-500/50 hover:shadow-md transition duration-200 shadow-2xs"
                >
                  <div className="space-y-3">
                    {/* Header: Organization and Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {series.targetExam ? series.targetExam.slice(0, 3).toUpperCase() : 'EX'}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 truncate">
                            {series.organization || series.targetExam}
                          </span>
                        </div>
                      </div>

                      {series.badge && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 shrink-0">
                          {series.badge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      {series.title}
                    </h3>

                    {/* Description if present */}
                    {series.description && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {series.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Metadata and CTA */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                          series.accessType === 'free'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : series.accessType === 'freemium'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        {series.accessType}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {series.supportedLanguages?.join('/') || 'Hindi/English'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                      <span>Explore Tests</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
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
