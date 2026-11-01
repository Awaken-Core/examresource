import React, { useState, useEffect, useCallback, Component } from 'react';
import {
  adminApi,
  type AdminQuestionReport,
} from './api';
import { useAdminToast } from './AdminToast';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class QuestionReportsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('QuestionReportsManager error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-surface border border-border rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-heading">
              Something went wrong loading Question Reports
            </h3>
            <p className="text-xs text-muted mt-1 max-w-md mx-auto">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-accent text-accent-contrast rounded-xl text-xs font-semibold shadow-xs transition hover:opacity-90 cursor-pointer"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function QuestionReportsManager() {
  return (
    <QuestionReportsErrorBoundary>
      <QuestionReportsManagerContent />
    </QuestionReportsErrorBoundary>
  );
}

const REPORT_REASONS = [
  'Incorrect Answer Key',
  'Typo or Formatting Glitch in Question',
  'Translation Discrepancy (Hindi vs English)',
  'Formula or Diagram Unreadable / Missing',
  'Ambiguous / Multiple Correct Answers',
  'Other Issue',
] as const;

const RESOLUTION_TEMPLATES = [
  'Verified answer key — updated in question bank.',
  'Question text typo corrected.',
  'Translation discrepancy fixed in Hindi version.',
  'Report investigated — question and answer key verified accurate.',
  'Clarified explanation and added reference steps.',
  'Diagram / formula formatting re-uploaded.',
];

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr || '—';
  }
}

function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function QuestionReportsManagerContent() {
  const toastContext = (() => {
    try {
      return useAdminToast();
    } catch {
      return { showToast: () => {} };
    }
  })();
  const showToast = toastContext?.showToast || (() => {});

  const [reports, setReports] = useState<AdminQuestionReport[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
    total: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Active report in inspection modal
  const [inspectingReport, setInspectingReport] = useState<AdminQuestionReport | null>(null);
  const [activeLang, setActiveLang] = useState<'en' | 'hi'>('en');
  const [resolutionStatus, setResolutionStatus] = useState<'pending' | 'reviewed' | 'resolved' | 'dismissed'>('resolved');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Quick updating row ID for inline status toggle
  const [updatingRowId, setUpdatingRowId] = useState<string | null>(null);

  // Deletion modal
  const [deletingReport, setDeletingReport] = useState<AdminQuestionReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getQuestionReports({
        status: statusFilter,
        reason: reasonFilter,
        search: debouncedSearch || undefined,
        page,
        limit: 15,
      });
      setReports(res.data || []);
      if (res.counts) setCounts(res.counts);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load question reports';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, reasonFilter, debouncedSearch, page, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Open inspection modal
  const handleInspect = (report: AdminQuestionReport) => {
    setInspectingReport(report);
    setResolutionStatus(report.status || 'resolved');
    setResolutionNote(report.resolutionNote || '');
    setActiveLang('en');
  };

  // Close inspection modal
  const handleCloseInspect = () => {
    setInspectingReport(null);
  };

  // Save resolution from modal
  const handleSaveResolution = async () => {
    if (!inspectingReport) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await adminApi.updateQuestionReportStatus(inspectingReport.id || inspectingReport._id!, {
        status: resolutionStatus,
        resolutionNote: resolutionNote.trim() || null,
      });

      // Update in reports list
      setReports((prev) =>
        prev.map((r) => ((r.id || r._id) === (updated.id || updated._id) ? updated : r))
      );
      setInspectingReport(updated);
      showToast(`Report marked as ${resolutionStatus}`, 'success');
      // Refresh count summary
      fetchReports();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update report status';
      showToast(message, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick inline status change
  const handleInlineStatusChange = async (
    report: AdminQuestionReport,
    newStatus: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  ) => {
    const reportId = report.id || report._id!;
    setUpdatingRowId(reportId);
    try {
      const updated = await adminApi.updateQuestionReportStatus(reportId, {
        status: newStatus,
        resolutionNote: report.resolutionNote || null,
      });
      setReports((prev) =>
        prev.map((r) => ((r.id || r._id) === reportId ? updated : r))
      );
      showToast(`Status changed to ${newStatus}`, 'success');
      // Update counts
      fetchReports();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update report status';
      showToast(message, 'error');
    } finally {
      setUpdatingRowId(null);
    }
  };

  // Delete report
  const handleDeleteReport = async () => {
    if (!deletingReport) return;
    setIsDeleting(true);
    const reportId = deletingReport.id || deletingReport._id!;
    try {
      await adminApi.deleteQuestionReport(reportId);
      setReports((prev) => prev.filter((r) => (r.id || r._id) !== reportId));
      showToast('Report deleted successfully', 'success');
      setDeletingReport(null);
      if (inspectingReport && (inspectingReport.id || inspectingReport._id) === reportId) {
        setInspectingReport(null);
      }
      fetchReports();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete report';
      showToast(message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Under Review
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-muted border border-border">
            {status}
          </span>
        );
    }
  };

  // Reason Badge Helper
  const renderReasonBadge = (reason: string) => {
    let colorClasses = 'bg-surface text-muted border-border';
    if (reason.includes('Incorrect Answer')) {
      colorClasses = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
    } else if (reason.includes('Typo') || reason.includes('Formatting')) {
      colorClasses = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    } else if (reason.includes('Translation')) {
      colorClasses = 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20';
    } else if (reason.includes('Formula') || reason.includes('Diagram')) {
      colorClasses = 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20';
    } else if (reason.includes('Ambiguous')) {
      colorClasses = 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colorClasses}`}>
        {reason}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-heading">Question Issue Reports</h2>
          <p className="text-xs text-muted mt-1">
            Track, inspect, and resolve issues flagged by candidates during CBT mock tests or question practice.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchReports}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface hover:bg-surface-raised text-xs font-medium text-heading transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
          title="Refresh reports"
        >
          <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-accent/10 border-accent/30 shadow-xs'
              : 'bg-surface hover:bg-surface-raised border-border'
          }`}
        >
          <span className="text-[11px] font-semibold text-muted block">All Reports</span>
          <span className="text-xl font-extrabold text-heading mt-0.5 block">{counts.total}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500/15 border-amber-500/40 shadow-xs'
              : 'bg-surface hover:bg-surface-raised border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Pending</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <span className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5 block">{counts.pending}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('reviewed'); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'reviewed'
              ? 'bg-blue-500/15 border-blue-500/40 shadow-xs'
              : 'bg-surface hover:bg-surface-raised border-border'
          }`}
        >
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">Under Review</span>
          <span className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 block">{counts.reviewed}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('resolved'); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'resolved'
              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-xs'
              : 'bg-surface hover:bg-surface-raised border-border'
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">Resolved</span>
          <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5 block">{counts.resolved}</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('dismissed'); setPage(1); }}
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            statusFilter === 'dismissed'
              ? 'bg-zinc-500/15 border-zinc-500/40 shadow-xs'
              : 'bg-surface hover:bg-surface-raised border-border'
          }`}
        >
          <span className="text-[11px] font-semibold text-muted block">Dismissed</span>
          <span className="text-xl font-extrabold text-muted mt-0.5 block">{counts.dismissed}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by question text, candidate name, email, or remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border rounded-xl text-xs text-heading placeholder:text-muted focus:outline-hidden focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Filter reports by status"
            className="px-3 py-2 bg-surface-raised border border-border rounded-xl text-xs text-heading focus:outline-hidden focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending ({counts.pending})</option>
            <option value="reviewed">Under Review ({counts.reviewed})</option>
            <option value="resolved">Resolved ({counts.resolved})</option>
            <option value="dismissed">Dismissed ({counts.dismissed})</option>
          </select>

          {/* Reason Select */}
          <select
            value={reasonFilter}
            onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
            aria-label="Filter reports by reason"
            className="px-3 py-2 bg-surface-raised border border-border rounded-xl text-xs text-heading focus:outline-hidden focus:border-accent max-w-[210px] truncate"
          >
            <option value="ALL">All Issue Reasons</option>
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'ALL' || reasonFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setReasonFilter('ALL');
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-4 p-4 rounded-xl bg-surface-raised/40">
                <div className="w-10 h-10 rounded-full bg-border shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border rounded w-1/4" />
                  <div className="h-3 bg-border rounded w-3/4" />
                  <div className="h-3 bg-border rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-raised border border-border text-muted flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-heading">No reported issues found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {search || statusFilter !== 'ALL' || reasonFilter !== 'ALL'
                ? 'No reports match your selected search or filter criteria. Try resetting filters.'
                : 'Great news! There are currently no unresolved question issue reports from students.'}
            </p>
            {(search || statusFilter !== 'ALL' || reasonFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setReasonFilter('ALL');
                  setPage(1);
                }}
                className="mt-2 px-4 py-2 bg-surface-raised border border-border rounded-xl text-xs font-semibold text-heading hover:bg-surface transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reports.map((report) => {
              const reportId = report.id || report._id!;
              const q = report.question;
              const user = report.user;
              const isPending = report.status === 'pending';
              const isResolved = report.status === 'resolved';

              return (
                <div
                  key={reportId}
                  className={`p-4 sm:p-5 transition hover:bg-surface-raised/40 flex flex-col md:flex-row gap-4 items-start justify-between ${
                    isPending ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* Left Column: Question Preview & Report Context */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Header tags: Reason, Status, Time, Question Type */}
                    <div className="flex flex-wrap items-center gap-2">
                      {renderReasonBadge(report.reason)}
                      {renderStatusBadge(report.status)}
                      <span className="text-[11px] text-muted flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatRelativeTime(report.createdAt)}
                      </span>
                      {q?.type && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                          {q.type.replace('_', ' ')}
                        </span>
                      )}
                      {q?.subject && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          {q.subject} {q.topic ? `• ${q.topic}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Question Content Snippet */}
                    <div className="text-xs font-medium text-heading line-clamp-2 leading-relaxed">
                      {q?.content || 'Question content not available'}
                    </div>

                    {/* User Remarks / Details (if provided) */}
                    {report.details && (
                      <div className="p-2.5 rounded-xl bg-surface-raised border border-border text-xs text-muted flex items-start gap-2">
                        <span className="text-amber-500 font-bold shrink-0">Note:</span>
                        <p className="italic line-clamp-2 text-heading/90">"{report.details}"</p>
                      </div>
                    )}

                    {/* Reporter Info & Resolution Note Preview */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-[9px] text-heading">
                          {(user?.name || user?.email || 'S').slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-heading font-medium">{user?.name || 'Student'}</span>
                        {user?.email && <span className="opacity-70">({user.email})</span>}
                      </span>

                      {report.resolutionNote && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-sm">
                          Resolution: {report.resolutionNote}
                        </span>
                      )}

                      {report.reviewedBy && (
                        <span className="text-muted opacity-80">
                          Reviewed by {report.reviewedBy.name || report.reviewedBy.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Quick Status Dropdown */}
                    <select
                      value={report.status}
                      disabled={updatingRowId === reportId}
                      onChange={(e) =>
                        handleInlineStatusChange(
                          report,
                          e.target.value as 'pending' | 'reviewed' | 'resolved' | 'dismissed'
                        )
                      }
                      aria-label="Change report status"
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-heading focus:outline-hidden focus:border-accent cursor-pointer disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Under Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>

                    {/* Inspect Button */}
                    <button
                      type="button"
                      onClick={() => handleInspect(report)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Inspect
                    </button>

                    {/* Delete Report Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingReport(report)}
                      className="p-1.5 rounded-lg border border-border hover:border-rose-500/40 text-muted hover:text-rose-600 transition cursor-pointer"
                      title="Delete Report"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} reports)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised font-medium disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised font-medium disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect & Resolve Modal */}
      {inspectingReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdatingStatus) handleCloseInspect();
          }}
        >
          <div className="bg-surface border border-border rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-raised/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-heading">Inspect Reported Question</h3>
                  <p className="text-[11px] text-muted">
                    Report ID: {inspectingReport.id || inspectingReport._id} • Submitted {formatFullDate(inspectingReport.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseInspect}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-heading hover:bg-surface-raised cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (Question & Report Details) - 7 cols */}
              <div className="lg:col-span-7 space-y-4">
                {/* Reporter & Issue Card */}
                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Issue Flagged</span>
                    {renderReasonBadge(inspectingReport.reason)}
                  </div>

                  {inspectingReport.details ? (
                    <div className="p-3 rounded-lg bg-surface border border-border text-xs text-heading space-y-1">
                      <span className="text-[11px] font-semibold text-muted block">Student's Comment:</span>
                      <p className="italic text-xs font-medium text-heading">"{inspectingReport.details}"</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic">No additional comments provided by the student.</p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <span className="text-muted">Reported by:</span>
                    <span className="font-semibold text-heading">
                      {inspectingReport.user?.name || 'Student'} ({inspectingReport.user?.email || 'N/A'})
                    </span>
                  </div>
                </div>

                {/* Question Content View */}
                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-heading">Question Statement</span>
                      {inspectingReport.question?.type && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface border border-border text-muted">
                          {inspectingReport.question.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {/* Language Switch for Bilingual Preview */}
                    {inspectingReport.question?.translations?.hi && (
                      <div className="flex items-center gap-1 p-0.5 bg-surface border border-border rounded-lg text-[11px]">
                        <button
                          type="button"
                          onClick={() => setActiveLang('en')}
                          className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                            activeLang === 'en' ? 'bg-accent text-accent-contrast' : 'text-muted'
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveLang('hi')}
                          className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                            activeLang === 'hi' ? 'bg-accent text-accent-contrast' : 'text-muted'
                          }`}
                        >
                          हिन्दी
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="p-3 rounded-lg bg-surface border border-border text-xs font-medium text-heading leading-relaxed whitespace-pre-wrap">
                    {activeLang === 'hi' && inspectingReport.question?.translations?.hi
                      ? inspectingReport.question.translations.hi
                      : inspectingReport.question?.content || 'Content not available'}
                  </div>

                  {/* Options List */}
                  {inspectingReport.question?.options && inspectingReport.question.options.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">Options</span>
                      <div className="space-y-1.5">
                        {inspectingReport.question.options.map((opt, idx) => {
                          const isCorrect = Boolean(opt.isCorrect);
                          const optLetter = String.fromCharCode(65 + idx);
                          const text =
                            activeLang === 'hi' && opt.translations?.hi
                              ? opt.translations.hi
                              : opt.content;

                          return (
                            <div
                              key={opt.id || idx}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : 'bg-surface border-border text-heading'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-surface-raised border border-border text-muted'
                                }`}
                              >
                                {optLetter}
                              </span>
                              <span className="flex-1 min-w-0 pt-0.5">{text}</span>
                              {isCorrect && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                                  ✓ Correct Key
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {(inspectingReport.question?.explanation ||
                    inspectingReport.question?.explanationTranslations?.hi) && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                        Official Explanation
                      </span>
                      <div className="p-3 rounded-lg bg-surface border border-border text-xs text-muted leading-relaxed whitespace-pre-wrap">
                        {activeLang === 'hi' &&
                        inspectingReport.question?.explanationTranslations?.hi
                          ? inspectingReport.question.explanationTranslations.hi
                          : inspectingReport.question?.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (Resolution Panel) - 5 cols */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-heading uppercase tracking-wider">Resolution Status</h4>
                    <p className="text-[11px] text-muted mt-0.5">
                      Update review progress and keep notes for other administrators.
                    </p>
                  </div>

                  {/* Status Options */}
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'pending', label: 'Pending', color: 'border-amber-500/40 text-amber-600 bg-amber-500/10' },
                        { id: 'reviewed', label: 'Under Review', color: 'border-blue-500/40 text-blue-600 bg-blue-500/10' },
                        { id: 'resolved', label: 'Resolved', color: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10' },
                        { id: 'dismissed', label: 'Dismissed', color: 'border-zinc-500/40 text-zinc-500 bg-zinc-500/10' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setResolutionStatus(st.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                          resolutionStatus === st.id
                            ? `${st.color} shadow-xs ring-1 ring-current`
                            : 'bg-surface hover:bg-surface-raised border-border text-muted'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Resolution Note */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-heading uppercase tracking-wider block">
                      Resolution Remarks / Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Corrected option B to C in question bank, verified official syllabus..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-heading placeholder:text-muted focus:outline-hidden focus:border-accent"
                    />

                    {/* Quick Templates */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-muted font-semibold block">Quick Templates:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {RESOLUTION_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl}
                            type="button"
                            onClick={() => setResolutionNote(tmpl)}
                            className="px-2 py-1 rounded-lg bg-surface border border-border hover:border-accent/40 text-[10px] text-muted hover:text-heading text-left transition cursor-pointer"
                          >
                            + {tmpl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reviewed metadata if available */}
                  {inspectingReport.reviewedBy && (
                    <div className="p-2.5 rounded-lg bg-surface border border-border text-[11px] text-muted space-y-0.5">
                      <span className="block font-semibold text-heading">Previous Review History</span>
                      <p>
                        Reviewed by {inspectingReport.reviewedBy.name || inspectingReport.reviewedBy.email} on{' '}
                        {formatFullDate(inspectingReport.reviewedAt)}
                      </p>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={handleSaveResolution}
                      className="w-full py-2.5 px-4 rounded-xl bg-accent text-accent-contrast text-xs font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      {isUpdatingStatus ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Saving Resolution...
                        </>
                      ) : (
                        'Save & Update Status'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-end">
              <button
                type="button"
                onClick={handleCloseInspect}
                className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-raised text-xs font-semibold text-heading transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingReport)}
        title="Delete Question Report"
        targetName={`Report for Question ${deletingReport?.questionId || ''}`}
        warning="Are you sure you want to delete this user report? This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={handleDeleteReport}
        onClose={() => setDeletingReport(null)}
      />
    </div>
  );
}
