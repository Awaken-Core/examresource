import React from 'react';
import type { ProctoringState } from './hooks/useProctoringMonitor';

interface Props {
  readonly testTitle: string;
  readonly attemptNumber: number;
  readonly language: 'English' | 'Hindi';
  readonly remainingSeconds: number | null;
  readonly isActionDisabled: boolean;
  readonly proctoring: ProctoringState & {
    readonly videoRef: React.RefObject<HTMLVideoElement | null>;
    readonly startCamera: () => Promise<void>;
    readonly startScreenShare: () => Promise<void>;
  };
  readonly onLanguageChange: (lang: 'English' | 'Hindi') => void;
  readonly onOpenInstructions: () => void;
  readonly onOpenShortcuts: () => void;
  readonly onOpenSubmit: () => void;
}

function formatTime(secs: number | null): string {
  if (secs === null) return '--:--';
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function ProctoringPIP({ proctoring }: { readonly proctoring: Props['proctoring'] }) {
  const totalIncidents = proctoring.movementWarningCount + proctoring.tabWarningCount;

  let dotColor = 'bg-amber-500';
  let statusText = 'Cam Ready';
  if (proctoring.movementDetected) {
    dotColor = 'bg-rose-500 animate-ping';
    statusText = 'Movement Alert';
  } else if (proctoring.isLive) {
    dotColor = 'bg-emerald-500';
    statusText = 'Proctor Stable';
  }

  const isCamActive = !proctoring.isScreenSharing && proctoring.isLive;
  const isScreenActive = proctoring.isScreenSharing;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-raised border border-border/80">
      <div className="relative w-12 h-9 sm:w-14 sm:h-10 rounded-lg overflow-hidden bg-black border border-border/80 shrink-0 shadow-inner">
        <video
          ref={proctoring.videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Live Proctoring Video Feed"
          className="w-full h-full object-cover"
        />
        {proctoring.movementDetected && (
          <div className="absolute inset-0 border-2 border-rose-500 animate-ping pointer-events-none" />
        )}
        {!proctoring.isLive && (
          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-muted font-mono">
            OFF
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span
            className={`font-semibold tracking-tight ${
              proctoring.movementDetected ? 'text-rose-400 animate-pulse' : 'text-slate-300'
            }`}
          >
            {statusText}
          </span>
          {totalIncidents > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[9px] border border-rose-500/30">
              {totalIncidents}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[9px] text-muted">
          <div className="flex items-center gap-1">
            <span>Motion:</span>
            <div className="w-10 h-1.5 bg-black/40 rounded-full overflow-hidden border border-border/50">
              <div
                className={`h-full transition-all duration-200 ${
                  proctoring.motionScore > 35 ? 'bg-rose-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, proctoring.motionScore)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 font-semibold text-slate-400">
            <button
              type="button"
              onClick={() => void proctoring.startCamera()}
              title="Use Webcam"
              className={`hover:text-white transition cursor-pointer ${
                isCamActive ? 'text-blue-400 underline' : ''
              }`}
            >
              Cam
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => void proctoring.startScreenShare()}
              title="Share Screen"
              className={`hover:text-white transition cursor-pointer ${
                isScreenActive ? 'text-blue-400 underline' : ''
              }`}
            >
              Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CBTHeader({
  testTitle,
  attemptNumber,
  language,
  remainingSeconds,
  isActionDisabled,
  proctoring,
  onLanguageChange,
  onOpenInstructions,
  onOpenShortcuts,
  onOpenSubmit,
}: Props) {
  const isLowTime = remainingSeconds !== null && remainingSeconds < 300;
  const timerTextColor = isLowTime
    ? 'text-rose-600 dark:text-rose-400 font-extrabold'
    : 'text-slate-900 dark:text-white';
  const timerSvgColor = isLowTime
    ? 'text-rose-500 animate-pulse'
    : 'text-amber-500 dark:text-amber-400';

  return (
    <header className="bg-surface border border-border rounded-2xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm select-none">
      {/* Left: Test Identification & Session Status */}
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs md:max-w-md">
            {testTitle}
          </h1>
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span>Attempt #{attemptNumber}</span>
            <span>&bull;</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-medium">
              Secure CBT Active
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Live Proctoring & Movement Monitor in top small section */}
      <ProctoringPIP proctoring={proctoring} />

      {/* Right Controls: Instructions, Shortcuts, Language, Timer, Submit */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Code of Conduct button */}
        <button
          type="button"
          onClick={onOpenInstructions}
          title="Official Instructions & Code of Conduct"
          className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-surface-raised border border-border text-slate-300 hover:text-white hover:bg-surface-raised/80 transition cursor-pointer flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="hidden sm:inline">Instructions</span>
        </button>

        {/* Shortcuts guide */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Navigation Shortcuts (?)"
          className="px-2 py-1.5 rounded-xl text-xs font-mono font-bold bg-surface-raised border border-border text-muted hover:text-white transition cursor-pointer"
        >
          ?
        </button>

        {/* Language Switcher */}
        <div className="flex items-center bg-surface-raised border border-border rounded-lg p-0.5 text-[11px]">
          <button
            type="button"
            disabled={isActionDisabled}
            onClick={() => onLanguageChange('English')}
            className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
              language === 'English'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-muted hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            disabled={isActionDisabled}
            onClick={() => onLanguageChange('Hindi')}
            className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
              language === 'Hindi'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-muted hover:text-white'
            }`}
          >
            HI
          </button>
        </div>

        {/* Official Countdown Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-xs font-mono font-bold text-slate-900 dark:text-white shadow-xs">
          <svg
            className={`w-4 h-4 ${timerSvgColor}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className={timerTextColor}>{formatTime(remainingSeconds)}</span>
        </div>

        {/* End / Submit Test Button */}
        <button
          type="button"
          disabled={isActionDisabled}
          onClick={onOpenSubmit}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-md shadow-emerald-600/20 ${
            isActionDisabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          Submit Test
        </button>
      </div>
    </header>
  );
}
