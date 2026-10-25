import React, { useEffect, useState } from 'react';

interface Props {
  readonly portalName: string;
  readonly testTitle: string;
  readonly candidateName: string;
  readonly language: 'English' | 'Hindi';
  readonly remainingSeconds: number | null;
  readonly onLanguageChange: (lang: 'English' | 'Hindi') => void;
  readonly onOpenShortcuts: () => void;
  readonly calculatorOpen: boolean;
  readonly onToggleCalculator: () => void;
  readonly zoom: number;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly canPause: boolean;
  readonly onPause: () => void;
  readonly fullscreen: boolean;
  readonly onToggleFullscreen: () => void;
}

function formatTime(secs: number | null): string {
  const safe = secs == null ? 0 : Math.max(0, secs);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function CBTHeader({
  portalName,
  testTitle,
  candidateName,
  language,
  remainingSeconds,
  onLanguageChange,
  onOpenShortcuts,
  calculatorOpen,
  onToggleCalculator,
  zoom,
  onZoomIn,
  onZoomOut,
  canPause,
  onPause,
  fullscreen,
  onToggleFullscreen,
}: Props) {
  const lowTime = remainingSeconds !== null && remainingSeconds < 300;
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('theme-dark'));
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains('theme-dark');
    document.documentElement.classList.toggle('theme-dark', nextDark);
    document.documentElement.classList.toggle('theme-light', !nextDark);
    const preference = nextDark ? 'dark' : 'light';
    localStorage.setItem('theme', preference);
    localStorage.setItem('theme_preference', preference);
    setDark(nextDark);
  };

  return (
    <div className="grid h-20 grid-rows-[48px_32px] border-b border-border bg-surface">
      <header className="grid h-12 grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] items-center gap-3 px-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {portalName} Exam Portal
          </p>
          <p className="truncate text-[11px] text-muted">{testTitle}</p>
        </div>
        <p
          className={`font-mono text-sm font-bold tabular-nums ${
            lowTime ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
          }`}
          aria-live="polite"
        >
          Time remaining {formatTime(remainingSeconds)}
        </p>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <p className="min-w-0 truncate text-sm text-slate-900 dark:text-slate-100">
            Candidate: {candidateName}
          </p>
          <button
            type="button"
            onClick={onToggleCalculator}
            aria-pressed={calculatorOpen}
            aria-label="Scientific calculator"
            title="Scientific calculator"
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border ${
              calculatorOpen
                ? 'border-accent bg-accent text-on-accent'
                : 'border-border bg-surface-raised text-slate-900 dark:text-slate-100'
            }`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="h-[18px] w-[18px]">
              <rect x="4" y="2.5" width="16" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <rect x="7" y="5" width="10" height="3.2" rx="0.6" fill="currentColor" />
              <circle cx="8.2" cy="12" r="0.9" fill="currentColor" />
              <circle cx="12" cy="12" r="0.9" fill="currentColor" />
              <circle cx="15.8" cy="12" r="0.9" fill="currentColor" />
              <circle cx="8.2" cy="15.4" r="0.9" fill="currentColor" />
              <circle cx="12" cy="15.4" r="0.9" fill="currentColor" />
              <circle cx="15.8" cy="15.4" r="0.9" fill="currentColor" />
              <circle cx="8.2" cy="18.6" r="0.9" fill="currentColor" />
              <circle cx="12" cy="18.6" r="0.9" fill="currentColor" />
              <circle cx="15.8" cy="18.6" r="0.9" fill="currentColor" />
            </svg>
          </button>
          <div className="flex h-7 w-[72px] shrink-0 items-center rounded border border-border bg-surface-raised p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => onLanguageChange('English')}
              className={`h-6 flex-1 rounded font-semibold ${
                language === 'English' ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('Hindi')}
              className={`h-6 flex-1 rounded font-semibold ${
                language === 'Hindi' ? 'bg-accent text-on-accent' : 'text-muted'
              }`}
            >
              HI
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-8 items-center justify-between gap-2 border-t border-border px-3 text-[11px]">
        <p className="min-w-0 truncate text-rose-700 dark:text-rose-300">
          Stay on this screen and practise in good faith.
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onPause}
            disabled={!canPause}
            className="h-6 rounded border border-border px-2 text-[11px] font-semibold text-slate-900 disabled:opacity-40 dark:text-slate-100"
          >
            Pause
          </button>
          <div className="flex h-6 items-center rounded border border-border">
            <button
              type="button"
              onClick={onZoomOut}
              disabled={zoom <= 0.8}
              aria-label="Zoom out"
              className="h-6 w-6 text-sm font-bold text-slate-900 disabled:opacity-40 dark:text-slate-100"
            >
              −
            </button>
            <span className="w-10 text-center font-mono text-[11px] tabular-nums text-slate-900 dark:text-slate-100">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              disabled={zoom >= 1.5}
              aria-label="Zoom in"
              className="h-6 w-6 text-sm font-bold text-slate-900 disabled:opacity-40 dark:text-slate-100"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={dark ? 'Light theme' : 'Dark theme'}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-border text-slate-900 dark:text-slate-100"
          >
            {dark ? (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="h-3.5 w-3.5">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <path
                  fill="currentColor"
                  d="M12 2.5h1v2h-1v-2Zm0 17h1v2h-1v-2ZM2.5 11h2v1h-2v-1Zm17 0h2v1h-2v-1ZM5.1 4.4l.7-.7 1.4 1.4-.7.7-1.4-1.4Zm12.1 12.1.7-.7 1.4 1.4-.7.7-1.4-1.4ZM18.6 5.1l.7.7-1.4 1.4-.7-.7 1.4-1.4ZM6.5 17.2l.7.7-1.4 1.4-.7-.7 1.4-1.4Z"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="h-3.5 w-3.5">
                <path
                  fill="currentColor"
                  d="M14.5 3.2a8.2 8.2 0 1 0 6.3 12.6 7 7 0 0 1-8.4-9.5 6 6 0 0 1 2.1-3.1Z"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            data-fullscreen-toggle=""
            onClick={onToggleFullscreen}
            aria-pressed={fullscreen}
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            title={fullscreen ? 'Exit full screen' : 'Full screen'}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-border text-slate-900 dark:text-slate-100"
          >
            {fullscreen ? (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="h-3.5 w-3.5">
                <path
                  d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="h-3.5 w-3.5">
                <path
                  d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts"
            className="h-6 w-6 rounded border border-border text-xs font-bold text-muted"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  );
}
