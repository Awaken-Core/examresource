import React, { useEffect, useRef, useState } from 'react';
import { BrandMark } from '../BrandMark';
import { CBTStatusShape } from './CBTStatusShape';
import type { AttemptAnswer, PaletteSummaryCounts, SectionProgressItem } from './types/cbt';
import { CBTQuestionReportModal } from './CBTQuestionReportModal';

interface Props {
  readonly portalName: string;
  readonly testTitle: string;
  readonly candidateName: string;
  readonly candidateAvatar?: string | null;
  readonly remainingSeconds: number | null;
  readonly uiMode: 'modern' | 'govt';
  readonly onToggleUiMode: (mode: 'modern' | 'govt') => void;
  readonly isFullscreen: boolean;
  readonly onToggleFullscreen: () => void;
  readonly canPause: boolean;
  readonly onPause: () => void;

  // New controls: Calculator, Zoom, Theme & Shortcuts
  readonly calculatorOpen: boolean;
  readonly onToggleCalculator: () => void;
  readonly zoom: number;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onOpenShortcuts: () => void;

  // Sections
  readonly sections: readonly SectionProgressItem[];
  readonly activeSectionId: string | null;
  readonly onSelectSection: (sectionId: string | null) => void;

  // Question & Navigation
  readonly currentIndex: number;
  readonly totalQuestions: number;
  readonly activeAnswer: AttemptAnswer | null;
  readonly answersList: readonly AttemptAnswer[];
  readonly currentSectionIndices: readonly number[];
  readonly language: 'English' | 'Hindi';
  readonly onLanguageChange: (lang: 'English' | 'Hindi') => void;
  readonly selectedOptionIds: readonly string[];
  readonly numericalInput: string;
  readonly onToggleOption: (optionId: string) => void;
  readonly onNumericalChange: (value: string) => void;
  readonly onClearResponse: () => void;
  readonly onMarkForReviewAndNext: () => void;
  readonly onSaveAndNext: () => void;
  readonly onNavigateToQuestion: (index: number) => void;
  readonly isActionDisabled: boolean;

  // Modals & Submissions
  readonly summaryCounts: PaletteSummaryCounts;
  readonly onOpenQuestionPaper: () => void;
  readonly onOpenInstructions: () => void;
  readonly onOpenSubmitModal: () => void;
}

function formatClockParts(secs: number | null): { h: string; m: string; s: string } {
  const safe = secs == null ? 0 : Math.max(0, secs);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return {
    h: hrs.toString().padStart(2, '0'),
    m: mins.toString().padStart(2, '0'),
    s: s.toString().padStart(2, '0'),
  };
}

export function CBTGovtExamView({
  portalName,
  testTitle,
  candidateName,
  candidateAvatar,
  remainingSeconds,
  uiMode,
  onToggleUiMode,
  isFullscreen,
  onToggleFullscreen,
  canPause,
  onPause,
  calculatorOpen,
  onToggleCalculator,
  zoom,
  onZoomIn,
  onZoomOut,
  onOpenShortcuts,
  sections,
  activeSectionId,
  onSelectSection,
  currentIndex,
  totalQuestions,
  activeAnswer,
  answersList,
  currentSectionIndices,
  language,
  onLanguageChange,
  selectedOptionIds,
  numericalInput,
  onToggleOption,
  onNumericalChange,
  onClearResponse,
  onMarkForReviewAndNext,
  onSaveAndNext,
  onNavigateToQuestion,
  isActionDisabled,
  summaryCounts,
  onOpenQuestionPaper,
  onOpenInstructions,
  onOpenSubmitModal,
}: Props) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const sectionScrollRef = useRef<HTMLDivElement>(null);
  const clock = formatClockParts(remainingSeconds);

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

  const scrollSections = (offset: number) => {
    if (sectionScrollRef.current) {
      sectionScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const question = activeAnswer?.question;
  const questionType = question?.type ?? 'single_choice';
  const isNumerical = questionType === 'numerical';
  const isMultiple = questionType === 'multiple_choice';

  const qText =
    language === 'Hindi' && question?.translations?.hi
      ? question.translations.hi
      : question?.content ?? 'Question content unavailable.';

  const positiveMarks = question?.marks ?? 1;
  const negativeMarks = question?.negativeMarks ?? 0.25;

  // Active section name
  const currentSectionItem = sections.find((s) => s.sectionId === activeSectionId);
  const currentSectionName = currentSectionItem?.name || 'General Awareness 1';

  // Section indices for question palette in Govt format
  const paletteIndices =
    currentSectionIndices.length > 0
      ? currentSectionIndices
      : answersList.map((_, idx) => idx);

  // Time spent on this question
  const timeSpent = activeAnswer?.timeSpentSeconds ?? 0;
  const spentMins = Math.floor(timeSpent / 60).toString().padStart(2, '0');
  const spentSecs = (timeSpent % 60).toString().padStart(2, '0');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas text-slate-900 select-none dark:text-slate-100">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-border bg-surface px-2 sm:px-4 gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark size={28} className="shrink-0" />
          <div className="min-w-0">
            <span className="font-extrabold tracking-tight text-accent text-sm sm:text-base mr-2">
              {portalName}
            </span>
            <span className="truncate text-xs sm:text-sm font-medium text-heading">
              {testTitle}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Format Switcher (Modern vs Govt) */}
          <div className="inline-flex items-center rounded-lg border border-border bg-surface-raised p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onToggleUiMode('modern')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                uiMode === 'modern'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Modern
            </button>
            <button
              type="button"
              onClick={() => onToggleUiMode('govt')}
              className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                uiMode === 'govt'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:text-heading'
              }`}
            >
              Govt CBT
            </button>
          </div>

          {/* Calculator Button */}
          <button
            type="button"
            onClick={onToggleCalculator}
            aria-pressed={calculatorOpen}
            aria-label="Scientific calculator"
            title="Scientific calculator"
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border cursor-pointer transition ${
              calculatorOpen
                ? 'border-accent bg-accent text-on-accent'
                : 'border-border bg-surface text-slate-900 dark:text-slate-100 hover:bg-surface-raised'
            }`}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="h-4 w-4">
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

          {/* Digital Time Left Boxes */}
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="hidden xl:inline text-muted font-bold mr-0.5">Time Left</span>
            <span className="flex items-center gap-1 font-mono">
              <span className="rounded border border-border bg-surface-raised px-1.5 py-1 text-xs font-bold text-heading shadow-2xs">
                {clock.h}
              </span>
              <span className="text-muted font-bold">:</span>
              <span className="rounded border border-border bg-surface-raised px-1.5 py-1 text-xs font-bold text-heading shadow-2xs">
                {clock.m}
              </span>
              <span className="text-muted font-bold">:</span>
              <span className="rounded border border-border bg-surface-raised px-1.5 py-1 text-xs font-bold text-heading shadow-2xs">
                {clock.s}
              </span>
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hidden md:inline-flex rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-heading hover:bg-surface-raised cursor-pointer transition-colors"
          >
            {isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          </button>

          {/* Controls Cluster: Pause, [- 100% +], Theme Toggle, Shortcuts [?] */}
          <div className="flex items-center gap-1">
            {canPause && (
              <button
                type="button"
                onClick={onPause}
                className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-heading hover:bg-surface-raised cursor-pointer transition-colors"
              >
                Pause
              </button>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex h-7 items-center rounded border border-border bg-surface">
              <button
                type="button"
                onClick={onZoomOut}
                disabled={zoom <= 0.8}
                aria-label="Zoom out"
                className="h-6 w-5 text-sm font-bold text-slate-900 disabled:opacity-40 dark:text-slate-100 cursor-pointer flex items-center justify-center"
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
                className="h-6 w-5 text-sm font-bold text-slate-900 disabled:opacity-40 dark:text-slate-100 cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>

            {/* Theme Toggle (Dark/Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={dark ? 'Light theme' : 'Dark theme'}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-slate-900 dark:text-slate-100 hover:bg-surface-raised cursor-pointer transition-colors"
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

            {/* Keyboard Shortcuts Button */}
            <button
              type="button"
              onClick={onOpenShortcuts}
              title="Keyboard shortcuts"
              className="h-7 w-7 rounded border border-border bg-surface text-xs font-bold text-muted hover:text-heading cursor-pointer flex items-center justify-center transition-colors"
            >
              ?
            </button>
          </div>
        </div>
      </header>

      {/* ── Section Tabs Horizontal Bar ──────────────────────────── */}
      <nav
        className="flex h-10 shrink-0 items-center border-b border-border bg-surface-raised/60 px-2 sm:px-4 text-xs font-semibold"
        aria-label="Exam Sections"
      >
        <span className="mr-2 shrink-0 font-bold uppercase tracking-wider text-muted text-[11px]">
          SECTIONS |
        </span>

        <button
          type="button"
          onClick={() => scrollSections(-150)}
          aria-label="Scroll sections left"
          className="flex h-7 w-6 shrink-0 items-center justify-center rounded border border-border bg-surface text-muted hover:text-heading cursor-pointer"
        >
          &lt;
        </button>

        <div
          ref={sectionScrollRef}
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1.5 custom-scrollbar no-scrollbar"
        >
          {sections.length > 0 ? (
            sections.map((sec, idx) => {
              const isActive = (activeSectionId || sections[0]?.sectionId) === sec.sectionId;
              return (
                <button
                  key={sec.sectionId || idx}
                  type="button"
                  onClick={() => onSelectSection(sec.sectionId)}
                  className={`shrink-0 rounded-t-md px-3 py-1.5 text-xs font-semibold border-t-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-accent bg-surface text-accent font-bold shadow-2xs'
                      : 'border-transparent text-muted hover:text-heading hover:bg-surface/50'
                  }`}
                >
                  {sec.name || `Section ${idx + 1}`}
                </button>
              );
            })
          ) : (
            <button
              type="button"
              className="shrink-0 rounded-t-md px-3 py-1.5 text-xs font-bold border-t-2 border-accent bg-surface text-accent shadow-2xs"
            >
              General Awareness 1
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => scrollSections(150)}
          aria-label="Scroll sections right"
          className="flex h-7 w-6 shrink-0 items-center justify-center rounded border border-border bg-surface text-muted hover:text-heading cursor-pointer"
        >
          &gt;
        </button>
      </nav>

      {/* ── Two-Column Main Exam Workspace ────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Left Column: Question & Answering Panel ─────────────── */}
        <main className="flex min-h-0 flex-col border-border lg:border-r bg-canvas">
          {/* Question Subheader Bar */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
            <h2 className="text-sm sm:text-base font-bold text-heading">
              Question No. {currentIndex + 1}
            </h2>

            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              {/* Marks Badges */}
              <div className="flex items-center gap-1 font-semibold">
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                  +{positiveMarks}
                </span>
                <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                  -{negativeMarks}
                </span>
              </div>

              {/* Question Time Counter */}
              <span className="hidden sm:inline-block font-mono text-muted text-[11px]">
                Time {spentMins}:{spentSecs}
              </span>

              {/* Language Switcher Dropdown */}
              <div className="flex items-center gap-1 text-muted text-xs">
                <span className="hidden md:inline">View in</span>
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as 'English' | 'Hindi')}
                  aria-label="Select question language"
                  className="rounded border border-border bg-surface-raised px-2 py-0.5 text-xs font-semibold text-heading cursor-pointer focus:ring-1 focus:ring-accent"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              {/* Report Button */}
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1 text-muted hover:text-rose-500 cursor-pointer font-medium text-xs transition-colors"
                title="Report issue in question"
              >
                <span>⚠️</span>
                <span className="hidden sm:inline">Report</span>
              </button>
            </div>
          </div>

          {/* Question Body Scrollable Area */}
          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar space-y-6"
            style={{ zoom }}
          >
            {/* Question Text */}
            <div className="text-sm sm:text-base leading-relaxed text-heading whitespace-pre-wrap font-sans">
              {qText}
            </div>

            {/* Question Options */}
            {isNumerical ? (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Type your numerical answer:
                </label>
                <input
                  type="text"
                  value={numericalInput}
                  onChange={(e) => onNumericalChange(e.target.value)}
                  placeholder="Enter numerical value"
                  className="w-full max-w-sm rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-mono text-heading focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            ) : question?.options && question.options.length > 0 ? (
              <div className="space-y-3 pt-2">
                {question.options.map((opt, optIndex) => {
                  const optId = opt.id || (opt as any)._id || String(optIndex);
                  const isSelected = selectedOptionIds.includes(optId);
                  const optText =
                    language === 'Hindi' && opt.translations?.hi
                      ? opt.translations.hi
                      : opt.content;

                  return (
                    <label
                      key={optId}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent bg-accent/10 shadow-2xs ring-1 ring-accent'
                          : 'border-border/80 bg-surface hover:border-border hover:bg-surface-raised/40'
                      }`}
                    >
                      <input
                        type={isMultiple ? 'checkbox' : 'radio'}
                        name={`question-${question.id || currentIndex}`}
                        checked={isSelected}
                        onChange={() => onToggleOption(optId)}
                        className="mt-0.5 h-4 w-4 rounded-full border-border text-accent focus:ring-accent cursor-pointer"
                      />
                      <span className="text-sm leading-relaxed text-heading font-medium">
                        {optText}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted">No options configured for this question.</div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex h-14 shrink-0 items-center justify-between border-t border-border bg-surface px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={onMarkForReviewAndNext}
                className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 active:scale-98 transition cursor-pointer disabled:opacity-50"
              >
                Mark for Review &amp; Next
              </button>

              <button
                type="button"
                disabled={isActionDisabled || (selectedOptionIds.length === 0 && !numericalInput)}
                onClick={onClearResponse}
                className="rounded-lg border border-border bg-surface-raised px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-muted hover:text-heading active:scale-98 transition cursor-pointer disabled:opacity-40"
              >
                Clear Response
              </button>
            </div>

            <div>
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={onSaveAndNext}
                className="rounded-lg bg-teal-600 dark:bg-teal-500 text-white px-5 sm:px-6 py-2 text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 active:scale-98 transition cursor-pointer disabled:opacity-50"
              >
                Save &amp; Next
              </button>
            </div>
          </div>
        </main>

        {/* ── Right Column: Candidate Panel & Question Palette ────── */}
        <aside
          className="flex min-h-0 flex-col bg-surface overflow-hidden"
          aria-label="Question Palette and Candidate"
        >
          {/* Candidate Profile Box */}
          <div className="flex items-center gap-3 border-b border-border p-3 sm:p-4 bg-surface-raised/40">
            {candidateAvatar ? (
              <img
                src={candidateAvatar}
                alt={candidateName}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent font-bold text-sm border border-accent/25">
                {candidateName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-heading">{candidateName}</p>
              <p className="text-[11px] text-muted">Roll No: 2026-CBT-{currentIndex + 100}</p>
            </div>
          </div>

          {/* Legend Summary Status Counters */}
          <div className="border-b border-border p-3 text-[11px]">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              <div className="flex items-center gap-2">
                <CBTStatusShape status="answered" number={summaryCounts.answered} size="sm" />
                <span className="truncate text-muted">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <CBTStatusShape
                  status="marked_for_review"
                  number={summaryCounts.marked_for_review}
                  size="sm"
                />
                <span className="truncate text-muted">Marked</span>
              </div>
              <div className="flex items-center gap-2">
                <CBTStatusShape
                  status="not_visited"
                  number={summaryCounts.not_visited}
                  size="sm"
                />
                <span className="truncate text-muted">Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <CBTStatusShape
                  status="answered_and_marked_for_review"
                  number={summaryCounts.answered_and_marked}
                  size="sm"
                />
                <span className="truncate text-muted">Marked &amp; answered</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <CBTStatusShape
                  status="not_answered"
                  number={summaryCounts.not_answered}
                  size="sm"
                />
                <span className="truncate text-muted">Not Answered</span>
              </div>
            </div>
          </div>

          {/* Active Section Banner */}
          <div className="bg-sky-500/10 border-b border-sky-500/20 px-3 py-1.5 text-xs font-bold text-sky-800 dark:text-sky-200 uppercase tracking-wide">
            SECTION : {currentSectionName}
          </div>

          {/* 5-Column Question Grid */}
          <div
            data-lenis-prevent
            className="flex-1 overflow-y-auto overscroll-contain p-3 custom-scrollbar"
          >
            <div className="grid grid-cols-5 gap-2 justify-items-center">
              {paletteIndices.map((answerIndex) => {
                const answer = answersList[answerIndex];
                if (!answer) return null;
                const isCurrent = answerIndex === currentIndex;

                return (
                  <button
                    key={answer.questionId || answerIndex}
                    type="button"
                    onClick={() => onNavigateToQuestion(answerIndex)}
                    className="cursor-pointer group transform transition active:scale-95"
                    title={`Question ${answerIndex + 1} (${answer.status.replace(/_/g, ' ')})`}
                  >
                    <CBTStatusShape
                      status={answer.status}
                      number={answerIndex + 1}
                      size="palette"
                      isCurrent={isCurrent}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Sidebar Action Buttons */}
          <div className="space-y-2 border-t border-border p-3 bg-surface-raised/30">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenQuestionPaper}
                className="rounded-lg border border-sky-500/40 bg-sky-500/10 py-2 text-xs font-bold text-sky-800 dark:text-sky-200 hover:bg-sky-500/20 cursor-pointer transition text-center"
              >
                Question Paper
              </button>
              <button
                type="button"
                onClick={onOpenInstructions}
                className="rounded-lg border border-sky-500/40 bg-sky-500/10 py-2 text-xs font-bold text-sky-800 dark:text-sky-200 hover:bg-sky-500/20 cursor-pointer transition text-center"
              >
                Instructions
              </button>
            </div>

            <button
              type="button"
              disabled={isActionDisabled}
              onClick={onOpenSubmitModal}
              className="w-full rounded-lg bg-teal-600 dark:bg-teal-500 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:opacity-90 active:scale-98 cursor-pointer transition disabled:opacity-50 text-center"
            >
              Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* Question Report Modal */}
      <CBTQuestionReportModal
        isOpen={isReportOpen}
        questionId={question?.id || (question as any)?._id || ''}
        questionIndex={currentIndex}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
