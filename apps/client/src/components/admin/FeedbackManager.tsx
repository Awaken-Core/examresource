import { useCallback, useEffect, useState } from 'react';
import { adminApi, type AdminFeedbackItem } from './api';

const SOURCES = [
  { id: 'ALL', label: 'All Sources' },
  { id: 'test_result', label: 'Test Results' },
  { id: 'footer', label: 'Footer Submissions' },
] as const;

const STATUSES = [
  { id: 'ALL', label: 'All Status' },
  { id: 'NEW', label: 'New' },
  { id: 'REVIEWED', label: 'Reviewed' },
  { id: 'ARCHIVED', label: 'Archived' },
] as const;

export function FeedbackManager() {
  const [feedbacks, setFeedbacks] = useState<AdminFeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [source, setSource] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesEditingId, setNotesEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getFeedbacks({
        source,
        status,
        search: search.trim() || undefined,
        page,
        limit: 20,
      });
      setFeedbacks(res.feedbacks || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load feedbacks.');
    } finally {
      setLoading(false);
    }
  }, [source, status, search, page]);

  useEffect(() => {
    const timer = window.setTimeout(loadFeedbacks, 200);
    return () => window.clearTimeout(timer);
  }, [loadFeedbacks]);

  const handleStatusUpdate = async (
    item: AdminFeedbackItem,
    newStatus: 'NEW' | 'REVIEWED' | 'ARCHIVED',
    notes?: string,
  ) => {
    setBusyId(item.id);
    try {
      await adminApi.updateFeedbackStatus(item.id, newStatus, notes ?? item.adminNotes);
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: newStatus, adminNotes: notes ?? f.adminNotes } : f,
        ),
      );
      setNotesEditingId(null);
    } catch (e: any) {
      alert(e.message || 'Failed to update feedback status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: AdminFeedbackItem) => {
    if (!window.confirm('Are you sure you want to permanently delete this feedback?')) return;
    setBusyId(item.id);
    try {
      await adminApi.deleteFeedback(item.id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== item.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      alert(e.message || 'Failed to delete feedback.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 font-['Geist']">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Learner Feedback & Reviews
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Real-time feedback submitted from test result analysis and site footer. Total:{' '}
            <span className="font-semibold text-slate-800 dark:text-zinc-200">{total}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadFeedbacks()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer self-start sm:self-auto"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <input
            type="text"
            placeholder="Search feedback text, test title, learner name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-hidden"
          />
        </div>

        {/* Source Filter */}
        <div className="sm:col-span-4 flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">
            Source:
          </span>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden"
          >
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3 flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">
            Status:
          </span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden"
          >
            {STATUSES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Feedbacks List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 dark:text-zinc-500 space-y-2">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading feedbacks...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-xs text-slate-500 dark:text-zinc-400">
          No feedback entries match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((item) => {
            const isTestResult = item.source === 'test_result';
            const isNew = item.status === 'NEW';
            const isReviewed = item.status === 'REVIEWED';
            const isArchived = item.status === 'ARCHIVED';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  isNew
                    ? 'border-cyan-500/40 bg-cyan-500/5 dark:bg-cyan-950/10 shadow-xs'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Source Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isTestResult
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300/60'
                      }`}
                    >
                      {isTestResult ? '📝 Test Result' : '🌐 Footer Form'}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isNew
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60'
                          : isReviewed
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/60'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {item.status}
                    </span>

                    {/* Category */}
                    {item.category && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">
                        {item.category}
                      </span>
                    )}

                    {/* Star Rating */}
                    {item.rating && (
                      <span className="text-amber-400 font-bold text-xs tracking-widest">
                        {'★'.repeat(item.rating)}
                        {'☆'.repeat(5 - item.rating)}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Content Body */}
                <div className="pt-3 space-y-2">
                  {/* Test context if test_result */}
                  {isTestResult && item.testTitle && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      <span className="text-slate-400 dark:text-zinc-500">Test:</span>
                      <span>{item.testTitle}</span>
                      {item.attemptId && (
                        <a
                          href={`/test-series/results/${item.attemptId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline ml-1"
                        >
                          View Result →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Feedback Message */}
                  <p className="text-xs sm:text-[13px] text-slate-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {item.message}
                  </p>

                  {/* Learner Info */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                    {item.userName && (
                      <span>
                        👤 Learner: <strong className="text-slate-700 dark:text-zinc-300">{item.userName}</strong>
                      </span>
                    )}
                    {item.userEmail && (
                      <span>
                        ✉️ <a href={`mailto:${item.userEmail}`} className="hover:underline">{item.userEmail}</a>
                      </span>
                    )}
                    {item.userPhone && (
                      <span>
                        📞 <a href={`tel:${item.userPhone}`} className="hover:underline">{item.userPhone}</a>
                      </span>
                    )}
                  </div>

                  {/* Admin Notes Display */}
                  {item.adminNotes && (
                    <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-700 dark:text-zinc-300">
                      <strong className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-0.5">
                        Admin Note:
                      </strong>
                      {item.adminNotes}
                    </div>
                  )}

                  {/* Inline Notes Editor */}
                  {notesEditingId === item.id && (
                    <div className="mt-2 space-y-2 p-3 rounded-lg border border-cyan-500/40 bg-cyan-500/5">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                        Edit Internal Admin Note
                      </label>
                      <textarea
                        rows={2}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal notes regarding bug fix or syllabus correction..."
                        className="w-full rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setNotesEditingId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleStatusUpdate(item, item.status, adminNotes)}
                          className="px-3 py-1 rounded-md bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition cursor-pointer"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-1.5">
                      {!isReviewed && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleStatusUpdate(item, 'REVIEWED')}
                          className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 transition cursor-pointer disabled:opacity-50"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {!isNew && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleStatusUpdate(item, 'NEW')}
                          className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 transition cursor-pointer disabled:opacity-50"
                        >
                          Mark as New
                        </button>
                      )}
                      {!isArchived && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleStatusUpdate(item, 'ARCHIVED')}
                          className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-200 transition cursor-pointer disabled:opacity-50"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNotesEditingId(notesEditingId === item.id ? null : item.id);
                          setAdminNotes(item.adminNotes || '');
                        }}
                        className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                      >
                        {item.adminNotes ? 'Edit Note' : '+ Add Note'}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void handleDelete(item)}
                      className="px-2 py-1 text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
          <span>
            Page {page} of {pages} ({total} items)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

