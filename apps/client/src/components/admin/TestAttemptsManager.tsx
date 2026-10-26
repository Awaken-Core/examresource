import React, { useState, useEffect, useCallback, Component } from 'react';
import {
  adminApi,
  type AdminAttemptListItem,
  type AdminAttemptDetail,
  type AdminTestSeries,
} from './api';
import { useAdminToast } from './AdminToast';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class TestAttemptsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TestAttemptsManager error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Something went wrong loading Test Attempts
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function TestAttemptsManager() {
  return (
    <TestAttemptsErrorBoundary>
      <TestAttemptsManagerContent />
    </TestAttemptsErrorBoundary>
  );
}

function TestAttemptsManagerContent() {
  const toastContext = (() => {
    try {
      return useAdminToast();
    } catch {
      return { showToast: () => {} };
    }
  })();
  const showToast = toastContext?.showToast || (() => {});

  const [attempts, setAttempts] = useState<AdminAttemptListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Available test series list for filter dropdown
  const [seriesList, setSeriesList] = useState<AdminTestSeries[]>([]);

  // Detailed view modal state
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<AdminAttemptDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'sections' | 'questions'>('overview');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Fetch test series for filter
  useEffect(() => {
    adminApi
      .getTestSeries()
      .then((res) => {
        setSeriesList(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        // Silently tolerate series listing failure
      });
  }, []);

  // Fetch attempts with current filters & pagination
  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAttempts({
        search: search.trim() || undefined,
        testSeriesId: selectedSeriesId !== 'ALL' ? selectedSeriesId : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setAttempts(Array.isArray(res?.items) ? res.items : []);
      setTotal(typeof res?.total === 'number' ? res.total : 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch test attempts.');
      showToast(err?.message || 'Error loading attempts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedSeriesId, statusFilter, startDate, endDate, page, showToast]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  // Open detail view
  const handleOpenDetail = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setAttemptDetail(null);
    setIsLoadingDetail(true);
    setActiveDetailTab('overview');
    setActiveQuestionIndex(0);
    try {
      const detail = await adminApi.getAttemptDetail(attemptId);
      setAttemptDetail(detail);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load attempt details', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedAttemptId(null);
    setAttemptDetail(null);
  };

  const formatSeconds = (sec: number | null | undefined) => {
    if (sec === null || sec === undefined || sec === 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Submitted
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            In Progress
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Abandoned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            {status}
          </span>
        );
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Student Test Attempts & Performance
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Track student exam results, CBT attempts, scores, and detailed section breakdowns across all tests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchAttempts()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <svg
              className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search student name, email, or test..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Test Series dropdown */}
          <div>
            <select
              value={selectedSeriesId}
              onChange={(e) => {
                setSelectedSeriesId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="ALL">All Test Series</option>
              {seriesList.map((s) => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in_progress">In Progress</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          {/* Date range quick selector or clear filters */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              title="Start Date"
              className="w-full px-2 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              title="End Date"
              className="w-full px-2 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {(search || selectedSeriesId !== 'ALL' || statusFilter !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedSeriesId('ALL');
                  setStatusFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="px-2.5 py-2 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white shrink-0"
                title="Reset filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Attempts Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading test attempts...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
            <button
              type="button"
              onClick={() => fetchAttempts()}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">No attempts recorded</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                No student attempts match the selected criteria.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-800/40 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Test & Series</th>
                  <th className="px-4 py-3.5 text-center">Attempt</th>
                  <th className="px-5 py-3.5">Score / Max</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Time Spent</th>
                  <th className="px-5 py-3.5">Attempt Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-normal">
                {attempts.map((att) => {
                  const percentage =
                    att.maximumMarks > 0
                      ? Math.round((att.score / att.maximumMarks) * 100)
                      : 0;

                  return (
                    <tr
                      key={att.id || att._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition group"
                    >
                      {/* Student info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {att.user?.name ? att.user.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-semibold text-slate-900 dark:text-zinc-100 truncate">
                              {att.user?.name || 'Unknown Student'}
                            </span>
                            <span className="block text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                              {att.user?.email || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Test Title & Series */}
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <span className="block font-medium text-slate-900 dark:text-zinc-100 truncate">
                            {att.test?.title || 'Untitled Test'}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                            {att.testSeries?.title ? (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {att.testSeries.title}
                              </span>
                            ) : (
                              'Standalone Test'
                            )}
                            {att.testVersion > 1 && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-[10px]">
                                v{att.testVersion}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Attempt Number */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          #{att.attemptNumber || 1}
                        </span>
                      </td>

                      {/* Score / Max Marks */}
                      <td className="px-5 py-4">
                        {att.status === 'in_progress' ? (
                          <span className="text-slate-400 dark:text-zinc-500 italic text-[11px]">
                            Pending submit
                          </span>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1.5 font-bold text-slate-900 dark:text-zinc-100">
                              <span className={att.score >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {att.score}
                              </span>
                              <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
                                / {att.maximumMarks}
                              </span>
                              <span className="ml-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                                ({percentage}%)
                              </span>
                            </div>
                            <div className="w-24 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                              <div
                                className={`h-full ${
                                  percentage >= 60
                                    ? 'bg-emerald-500'
                                    : percentage >= 35
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(att.status)}
                      </td>

                      {/* Time Spent */}
                      <td className="px-4 py-4 text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                        {formatSeconds(att.timeSpentSeconds)}
                      </td>

                      {/* Attempt Date */}
                      <td className="px-5 py-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap text-[11px]">
                        {formatDate(att.startedAt)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(att.id || att._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer"
                        >
                          <span>View Details</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <div>
              Showing <span className="font-semibold text-slate-700 dark:text-zinc-200">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-700 dark:text-zinc-200">{Math.min(page * pageSize, total)}</span> of{' '}
              <span className="font-semibold text-slate-700 dark:text-zinc-200">{total}</span> attempts
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Slide-over / Modal */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex justify-end">
          <div
            className="w-full max-w-3xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    Attempt Breakdown
                  </h2>
                  {attemptDetail && getStatusBadge(attemptDetail.status)}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Attempt ID: <code className="font-mono text-[11px]">{selectedAttemptId}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            {isLoadingDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-500">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading detailed attempt evaluation...</span>
              </div>
            ) : !attemptDetail ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-rose-500">
                Failed to load attempt details.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Student & Test Info Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Candidate Details
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {attemptDetail.user?.name || 'Unknown Candidate'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {attemptDetail.user?.email}
                    </p>
                    <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-zinc-400">
                      <span>Attempt #{attemptDetail.attemptNumber || 1}</span>
                      <span>•</span>
                      <span>Paper v{attemptDetail.testVersion || 1}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Exam Details
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {attemptDetail.test?.title}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {attemptDetail.testSeries?.title || 'Standalone Test'}
                    </p>
                    <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-600 dark:text-zinc-400">
                      <span>Started: {formatDate(attemptDetail.startedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Score summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 block">Total Score</span>
                    <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                      {attemptDetail.status === 'in_progress' ? '—' : attemptDetail.marksAwarded ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                      Max: {attemptDetail.maximumMarks ?? 0}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 block">Accuracy / %</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {attemptDetail.status === 'in_progress' || !attemptDetail.maximumMarks
                        ? '—'
                        : `${Math.round(((attemptDetail.marksAwarded ?? 0) / attemptDetail.maximumMarks) * 100)}%`}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">Overall</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 block">Time Spent</span>
                    <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                      {formatSeconds(attemptDetail.timeSpentSeconds)}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                      Allocated: {attemptDetail.test?.durationMinutes ? `${attemptDetail.test.durationMinutes}m` : 'Untimed'}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 block">Questions</span>
                    <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                      {attemptDetail.answers?.length || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-0.5">
                      Answered: {attemptDetail.answers?.filter((a) => a.optionIds?.length || a.numericalValue)?.length || 0}
                    </span>
                  </div>
                </div>

                {/* In progress notice if not submitted */}
                {attemptDetail.status === 'in_progress' && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      This test is currently <strong>in progress</strong>. Question-level evaluation, correct choices, and explanations will be unlocked once the student submits the attempt.
                    </span>
                  </div>
                )}

                {/* Detail View Sub-tabs */}
                <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveDetailTab('overview')}
                    className={`pb-2.5 transition border-b-2 cursor-pointer ${
                      activeDetailTab === 'overview'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Question Palette ({(attemptDetail.answers || []).length})
                  </button>

                  {attemptDetail.sectionProgress && attemptDetail.sectionProgress.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('sections')}
                      className={`pb-2.5 transition border-b-2 cursor-pointer ${
                        activeDetailTab === 'sections'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Section-wise Results ({attemptDetail.sectionProgress.length})
                    </button>
                  )}
                </div>

                {/* Tab: Question Palette & Detailed Answer Review */}
                {activeDetailTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Question navigation pills */}
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-xl">
                      {(attemptDetail.answers || []).map((ans, idx) => {
                        const isCorrect = ans.isCorrect;
                        const isSelected = activeQuestionIndex === idx;

                        let pillStyle = 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300';
                        if (attemptDetail.status !== 'in_progress') {
                          if (isCorrect === true) {
                            pillStyle = 'bg-emerald-500 text-white';
                          } else if (isCorrect === false && ((ans.optionIds || []).length || ans.numericalValue)) {
                            pillStyle = 'bg-rose-500 text-white';
                          } else {
                            pillStyle = 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400';
                          }
                        }

                        return (
                          <button
                            key={ans.id || ans.questionId || idx}
                            type="button"
                            onClick={() => setActiveQuestionIndex(idx)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${pillStyle} ${
                              isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 scale-105' : 'opacity-90 hover:opacity-100'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Question Preview */}
                    {(attemptDetail.answers || [])[activeQuestionIndex] && (
                      <div className="bg-white dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl p-5 space-y-4">
                        {(() => {
                          const currentAns = (attemptDetail.answers || [])[activeQuestionIndex];
                          const q = currentAns.question;

                          return (
                            <>
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-700 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold text-xs">
                                    Q{activeQuestionIndex + 1}
                                  </span>
                                  {q?.type && (
                                    <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-medium">
                                      {q.type.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>

                                {attemptDetail.status !== 'in_progress' && (
                                  <div className="flex items-center gap-2 text-xs font-semibold">
                                    {currentAns.isCorrect ? (
                                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Correct (+{currentAns.marksAwarded ?? 0})
                                      </span>
                                    ) : currentAns.optionIds?.length || currentAns.numericalValue ? (
                                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Incorrect ({currentAns.marksAwarded ?? 0})
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 dark:text-zinc-500">
                                        Not Attempted (0)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Question Content */}
                              <div className="text-sm font-medium text-slate-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                                {q?.content || 'Question content preview'}
                              </div>

                              {/* Multiple Choice Options */}
                              {q?.options && q.options.length > 0 && (
                                <div className="space-y-2 pt-2">
                                  {q.options.map((opt, optIdx) => {
                                    const candidateOptionIds = currentAns.optionIds || [];
                                    const isCandidateSelection = candidateOptionIds.includes(opt.id);
                                    const isCorrectAnswer = opt.isCorrect === true;

                                    let optionBoxClass =
                                      'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200';

                                    if (attemptDetail.status !== 'in_progress') {
                                      if (isCorrectAnswer && isCandidateSelection) {
                                        // Selected and Correct
                                        optionBoxClass =
                                          'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100';
                                      } else if (isCorrectAnswer) {
                                        // The correct answer candidate missed
                                        optionBoxClass =
                                          'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 text-emerald-800 dark:text-emerald-200';
                                      } else if (isCandidateSelection) {
                                        // Selected but wrong
                                        optionBoxClass =
                                          'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100';
                                      }
                                    } else if (isCandidateSelection) {
                                      optionBoxClass =
                                        'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100';
                                    }

                                    return (
                                      <div
                                        key={opt.id || optIdx}
                                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs transition ${optionBoxClass}`}
                                      >
                                        <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                          {String.fromCharCode(65 + optIdx)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <span>{opt.content}</span>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-1.5 font-bold text-[10px]">
                                          {isCandidateSelection && (
                                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200">
                                              Candidate Answer
                                            </span>
                                          )}
                                          {attemptDetail.status !== 'in_progress' && isCorrectAnswer && (
                                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">
                                              Correct Answer
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Numerical Answer display */}
                              {q?.type === 'numerical' && (
                                <div className="space-y-2 pt-2">
                                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 text-xs">
                                    <span className="text-slate-500 dark:text-zinc-400 block mb-1">
                                      Candidate Response:
                                    </span>
                                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-zinc-100">
                                      {currentAns.numericalValue || '(No answer provided)'}
                                    </span>
                                  </div>
                                  {attemptDetail.status !== 'in_progress' && q.numericalAnswer && (
                                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
                                      <span className="text-emerald-700 dark:text-emerald-300 block mb-1 font-semibold">
                                        Expected Correct Value:
                                      </span>
                                      <span className="font-mono font-bold text-sm text-emerald-800 dark:text-emerald-200">
                                        {q.numericalAnswer}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Explanation & Solution */}
                              {attemptDetail.status !== 'in_progress' && q?.explanation && (
                                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-1 text-xs">
                                  <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Explanation & Solution
                                  </span>
                                  <p className="text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {q.explanation}
                                  </p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Section Progress Breakdown */}
                {activeDetailTab === 'sections' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      {attemptDetail.sectionProgress.map((sec, idx) => (
                        <div
                          key={sec.sectionId || idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                              {sec.name || `Section ${idx + 1}`}
                            </span>
                            <span className="block text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                              Section ID: {sec.sectionId}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-xs text-slate-700 dark:text-zinc-300 block">
                              Time Spent: {formatSeconds(sec.timeSpentSeconds)}
                            </span>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                sec.isCompleted
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {sec.isCompleted ? 'Completed' : 'Incomplete'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
