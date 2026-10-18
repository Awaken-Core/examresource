import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, type NotificationItem } from './api';
import { useAdminToast } from './AdminToast';

export function NotificationsManager() {
  const { showToast } = useAdminToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [filterKind, setFilterKind] = useState<string>('ALL');

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [href, setHref] = useState('');

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getNotifications();
      setNotifications(data || []);
    } catch (err: any) {
      showToast(err?.message || 'Unable to load notifications history.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!cleanTitle || !cleanBody) {
      showToast('Please provide both a title and message.', 'error');
      return;
    }

    setIsSending(true);
    try {
      await adminApi.sendNotification({
        title: cleanTitle,
        body: cleanBody,
        href: href.trim() || null,
      });
      showToast('Notification sent to all active users!');
      setTitle('');
      setBody('');
      setHref('');
      fetchNotifications();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send notification.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filterKind === 'ALL' ? true : n.kind === filterKind
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-colors">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
          Push Notifications
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Broadcast instant announcements and updates to every signed-in user. Note: Publishing a new article also pushes an automatic update.
        </p>
      </div>

      {/* Grid: Composer Form on Left, Live Preview Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Compose Notification</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Notification Title <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  {title.length}/120
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                placeholder="e.g. SSC GD 2026 Admit Cards Released!"
                className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Message Body <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  {body.length}/500
                </span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={4}
                required
                placeholder="Download your hall tickets now and verify exam shift timings and reporting venue instructions."
                className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Target Link <span className="text-slate-400 dark:text-zinc-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/blog/government-jobs/ssc-gd-2026 or https://..."
                className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSending || !title.trim() || !body.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: '#2563EB' }}
              >
                {isSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Push Notification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Live User Preview
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            This is how your broadcast will appear in the student notifications dropdown:
          </p>

          <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3.5 shadow-sm space-y-1.5 transition-all">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">
                {title || 'Exam update notification'}
              </h4>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                BROADCAST
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">
              {body || 'Notification message text will appear here once composed in the form.'}
            </p>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              <span>Just now</span>
              {href ? (
                <span className="text-blue-600 dark:text-blue-400 font-sans font-semibold underline truncate max-w-[120px]">
                  View Link →
                </span>
              ) : (
                <span>No link</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications History Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Notification History
          </h2>

          <div className="flex items-center gap-1.5">
            {['ALL', 'broadcast', 'blog', 'welcome'].map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setFilterKind(kind)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                  filterKind === kind
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left divide-y divide-slate-100 dark:divide-zinc-800">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Sent Time</th>
                  <th className="py-3 px-4 text-right">Sender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded w-60" /></td>
                      <td className="py-3.5 px-3"><div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded-full w-16" /></td>
                      <td className="py-3.5 px-3"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-24" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                      No notifications recorded in history.
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((n) => {
                    const badgeClass =
                      n.kind === 'broadcast'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                        : n.kind === 'blog'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';

                    const dateFormatted = n.createdAt
                      ? new Date(n.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    const senderName = n.actor?.name || n.sender?.name || 'System';

                    return (
                      <tr
                        key={n.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                      >
                        <td className="py-3 px-4 max-w-sm">
                          <strong className="block font-semibold text-slate-900 dark:text-zinc-100">
                            {n.title}
                          </strong>
                          <p className="text-slate-600 dark:text-zinc-400 text-xs mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                          {n.href && (
                            <a
                              href={n.href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-mono inline-block mt-0.5"
                            >
                              {n.href} ↗
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${badgeClass}`}>
                            {n.kind}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-400 dark:text-zinc-500 font-mono text-[11px]">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap text-slate-600 dark:text-zinc-400 font-medium text-xs">
                          {senderName}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
