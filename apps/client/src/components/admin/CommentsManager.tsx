import { useCallback, useEffect, useState } from 'react';
import { adminApi, type ModerationComment } from './api';

const filters = ['PENDING', 'APPROVED', 'REJECTED', 'SPAM'] as const;
type Filter = (typeof filters)[number];

export function CommentsManager() {
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [comments, setComments] = useState<ModerationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setComments((await adminApi.getComments(filter)).comments); }
    catch (err: any) { setError(err?.message || 'Could not load comments.'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function moderate(id: string, status: 'APPROVED' | 'REJECTED' | 'SPAM') {
    setBusy(id);
    try { await adminApi.moderateComment(id, status); setComments((rows) => rows.filter((comment) => comment.id !== id)); }
    catch (err: any) { setError(err?.message || 'Could not update the comment.'); }
    finally { setBusy(null); }
  }

  async function remove(comment: ModerationComment) {
    if (!window.confirm(comment.parentCommentId ? 'Permanently delete this reply?' : 'Permanently delete this comment and all of its replies?')) return;
    setBusy(comment.id);
    try { await adminApi.deleteComment(comment.id); setComments((rows) => rows.filter((row) => row.id !== comment.id && row.parentCommentId !== comment.id)); }
    catch (err: any) { setError(err?.message || 'Could not delete the comment.'); }
    finally { setBusy(null); }
  }

  return <div className="max-w-5xl space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Comment moderation</h2><p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Review discussion before it is visible on articles.</p></div>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Comment status">
        {filters.map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${filter === status ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`}>{status[0] + status.slice(1).toLowerCase()}</button>)}
      </div>
    </div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
    <div className="space-y-3">
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">Loading comments…</div> : comments.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">No {filter.toLowerCase()} comments.</div> : comments.map((comment) => <article key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><strong className="text-sm text-slate-900 dark:text-zinc-100">{comment.authorName}</strong>{comment.parentCommentId && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">REPLY</span>}<time className="text-xs text-slate-400 dark:text-zinc-500">{new Date(comment.createdAt).toLocaleString('en-IN')}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-zinc-300">{comment.content}</p>{comment.blog && <a href={`/${comment.blog.slug}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">{comment.blog.title} ↗</a>}</div>
          <div className="flex shrink-0 flex-wrap gap-2">{filter === 'PENDING' && <><button disabled={busy === comment.id} onClick={() => moderate(comment.id, 'APPROVED')} className="min-h-10 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-60">Approve</button><button disabled={busy === comment.id} onClick={() => moderate(comment.id, 'REJECTED')} className="min-h-10 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-200">Reject</button><button disabled={busy === comment.id} onClick={() => moderate(comment.id, 'SPAM')} className="min-h-10 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 disabled:opacity-60 dark:border-rose-900/60 dark:text-rose-300">Spam</button></>}<button disabled={busy === comment.id} onClick={() => remove(comment)} className="min-h-10 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30">Delete</button></div></div>
      </article>)}</div>
  </div>;
}
