import { useEffect, useState } from 'react';
import {
  listSessions,
  logoutSession,
  revokeSession,
  roleLabel,
  type DeskSession,
  type DeskUser,
} from '../../lib/adminSession';

function formatWhen(iso?: string) {
  if (!iso) return 'Unknown';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Unknown';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function initials(user: DeskUser) {
  const name = (user.name || user.email || 'Staff').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface SessionPanelProps {
  user: DeskUser;
  onClose: () => void;
}

export function SessionPanel({ user, onClose }: SessionPanelProps) {
  const [sessions, setSessions] = useState<DeskSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listSessions()
      .then((rows) => {
        if (!cancelled) setSessions(rows || []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Could not load sessions.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function signOutHere() {
    setSigningOut(true);
    try {
      await logoutSession();
    } finally {
      window.location.assign('/login');
    }
  }

  async function signOutEverywhere() {
    setSigningOut(true);
    setError(null);
    try {
      const others = sessions.filter((session) => !session.current);
      await Promise.all(others.map((session) => revokeSession(session.id)));
      await logoutSession();
      window.location.assign('/login');
    } catch (err: any) {
      setSigningOut(false);
      setError(err?.message || 'Could not sign out every session.');
    }
  }

  async function endSession(session: DeskSession) {
    if (session.current) {
      await signOutHere();
      return;
    }
    setBusyId(session.id);
    setError(null);
    try {
      await revokeSession(session.id);
      setSessions((rows) => rows.filter((row) => row.id !== session.id));
    } catch (err: any) {
      setError(err?.message || 'Could not end that session.');
    } finally {
      setBusyId(null);
    }
  }

  const others = sessions.filter((session) => !session.current);

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close session panel"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="desk-session-title"
        className="absolute left-3 right-3 bottom-3 sm:left-4 sm:bottom-4 sm:right-auto sm:w-[22rem] bg-surface border border-border rounded-2xl shadow-elevated p-3 desk-fg"
      >
        <div className="flex items-start gap-2.5 px-1 pb-3 border-b border-border/70">
          <div className="w-9 h-9 rounded-full bg-surface-raised border border-border text-xs font-bold flex items-center justify-center shrink-0">
            {initials(user)}
          </div>
          <div className="min-w-0 flex-1">
            <p id="desk-session-title" className="text-sm font-semibold truncate">
              {user.name || 'Editorial staff'}
            </p>
            <p className="text-[11px] text-muted truncate">{user.email}</p>
            <p className="text-[11px] text-accent font-medium mt-0.5">{roleLabel(user.role)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted desk-hover hover:bg-surface-raised cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="pt-3 space-y-2 max-h-72 overflow-y-auto">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted">Signed-in browsers</p>
          {loading && <p className="px-1 text-xs text-muted">Checking sessions…</p>}
          {!loading &&
            sessions.map((session) => (
              <div key={session.id} className="flex items-center gap-2 px-2 py-2 rounded-xl bg-canvas border border-border/80">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">
                    {session.current ? 'This browser' : 'Other browser'}
                  </p>
                  <p className="text-[11px] text-muted">
                    Active {formatWhen(session.lastUsedAt || session.createdAt)}
                  </p>
                </div>
                {session.current ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    Current
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === session.id || signingOut}
                    onClick={() => endSession(session)}
                    className="text-[11px] font-semibold text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {busyId === session.id ? 'Ending…' : 'End'}
                  </button>
                )}
              </div>
            ))}
          {!loading && sessions.length === 0 && (
            <p className="px-1 text-xs text-muted">No active sessions were returned.</p>
          )}
          {error && <p className="px-1 text-xs text-red-500">{error}</p>}
        </div>

        <div className="pt-3 mt-3 border-t border-border/70 grid grid-cols-1 gap-1.5">
          <button
            type="button"
            disabled={signingOut}
            onClick={signOutHere}
            className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 cursor-pointer disabled:opacity-50"
          >
            {signingOut ? 'Signing out…' : 'Sign out this browser'}
          </button>
          <button
            type="button"
            disabled={signingOut || loading || others.length === 0}
            onClick={signOutEverywhere}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-muted desk-hover hover:bg-surface-raised cursor-pointer disabled:opacity-40"
          >
            Sign out everywhere{others.length > 0 ? ` (${others.length + 1})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
