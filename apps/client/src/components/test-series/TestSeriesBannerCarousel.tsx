import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Slide {
  id: string;
  type: 'diwali' | 'dsssb' | 'upcoming';
}

const SLIDES: Slide[] = [
  { id: 'diwali-sale', type: 'diwali' },
  { id: 'dsssb-live', type: 'dsssb' },
  { id: 'upcoming-2026', type: 'upcoming' },
];

const AUTO_SCROLL_INTERVAL = 5500; // 5.5 seconds

export function TestSeriesBannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlides = SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance timer (pauses on user hover)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const scrollToExplorer = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('test-series-grid-anchor');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full space-y-4 font-['Geist']">
      {/* ══════════════════════════════════════════════════════════════
          1. MAIN AUTO-SCROLLING HERO BANNER CAROUSEL
          ══════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl select-none group border border-amber-500/20"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured Test Series & Festive Promotions"
      >
        {/* Slides Track */}
        <div
          className="flex transition-transform duration-700 ease-out will-change-transform"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* ──────────────────────────────────────────────────────────
              SLIDE 1: DIWALI DHAMAKA SALE (Testbook Style)
              ────────────────────────────────────────────────────────── */}
          <div
            className="w-full shrink-0 relative overflow-hidden bg-gradient-to-br from-[#1b0738] via-[#2c0a4e] to-[#450e7a] text-white p-5 sm:p-8 md:p-10 min-h-[340px] sm:min-h-[380px] flex items-center"
            role="group"
            aria-roledescription="slide"
            aria-label="1 of 3: Diwali Dhamaka Sale"
          >
            {/* Ambient Festive Radial Glows */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-fuchsia-600/25 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-400/10 blur-[100px] pointer-events-none" />

            {/* Decorative Hanging Lanterns (Kandeels) SVG - Left & Right */}
            <div className="absolute top-0 left-4 sm:left-10 opacity-70 pointer-events-none hidden xs:block">
              <svg width="48" height="110" viewBox="0 0 48 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="24" y1="0" x2="24" y2="35" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                {/* Lantern Body */}
                <polygon points="24,35 44,55 24,75 4,55" fill="#f59e0b" fillOpacity="0.85" stroke="#fbbf24" strokeWidth="1.5" />
                <polygon points="24,42 38,55 24,68 10,55" fill="#fef08a" fillOpacity="0.95" />
                <circle cx="24" cy="55" r="4" fill="#ffffff" />
                {/* Tassels */}
                <line x1="16" y1="75" x2="14" y2="105" stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="24" y1="75" x2="24" y2="108" stroke="#fbbf24" strokeWidth="1.5" />
                <line x1="32" y1="75" x2="34" y2="105" stroke="#f59e0b" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="absolute top-0 right-4 sm:right-10 opacity-70 pointer-events-none hidden md:block">
              <svg width="48" height="110" viewBox="0 0 48 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="24" y1="0" x2="24" y2="40" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                <polygon points="24,40 44,60 24,80 4,60" fill="#f59e0b" fillOpacity="0.85" stroke="#fbbf24" strokeWidth="1.5" />
                <polygon points="24,47 38,60 24,73 10,60" fill="#fef08a" fillOpacity="0.95" />
                <circle cx="24" cy="60" r="4" fill="#ffffff" />
                <line x1="16" y1="80" x2="14" y2="105" stroke="#f59e0b" strokeWidth="1.5" />
                <line x1="24" y1="80" x2="24" y2="108" stroke="#fbbf24" strokeWidth="1.5" />
                <line x1="32" y1="80" x2="34" y2="105" stroke="#f59e0b" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Sparkles / Fireworks Vectors */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15%" cy="25%" r="1.5" fill="#fef08a" />
                <circle cx="85%" cy="30%" r="2" fill="#fef08a" />
                <circle cx="50%" cy="15%" r="1.5" fill="#f59e0b" />
                <circle cx="78%" cy="75%" r="2" fill="#fbbf24" />
                <circle cx="25%" cy="80%" r="1.5" fill="#fef08a" />
                {/* 4-point sparkle stars */}
                <path d="M 220 50 Q 220 60 230 60 Q 220 60 220 70 Q 220 60 210 60 Q 220 60 220 50 Z" fill="#fbbf24" />
                <path d="M 720 90 Q 720 98 728 98 Q 720 98 720 106 Q 720 98 712 98 Q 720 98 720 90 Z" fill="#fef08a" />
              </svg>
            </div>

            {/* Slide Content Grid: Left Diya & Text, Right Offer Box & CTAs */}
            <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Festive Branding & Grand Titles (md: 7 cols) */}
              <div className="md:col-span-7 space-y-3 sm:space-y-4 text-center md:text-left">
                {/* Top Badge: SALE IS LIVE */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-400/15 border border-amber-300/40 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>SALE IS LIVE · FESTIVE SPECIAL</span>
                </div>

                {/* Main Festive Title with Diya Accents */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    {/* Glowing Diya SVG */}
                    <div className="shrink-0 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]">
                      <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Flame */}
                        <path d="M18 4C19.5 8.5 23 12 23 16C23 19 20.8 21 18 21C15.2 21 13 19 13 16C13 12 16.5 8.5 18 4Z" fill="url(#flameGrad)" />
                        <circle cx="18" cy="16" r="3" fill="#ffffff" />
                        {/* Diya Base */}
                        <path d="M7 21C7 27 12 29 18 29C24 29 29 27 29 21C29 20 28 20 26 21C23 22.5 13 22.5 10 21C8 20 7 20 7 21Z" fill="#d97706" stroke="#fbbf24" strokeWidth="1" />
                        <ellipse cx="18" cy="21.5" rx="9" ry="2" fill="#78350f" />
                        <defs>
                          <linearGradient id="flameGrad" x1="18" y1="4" x2="18" y2="21" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#fef08a" />
                            <stop offset="0.5" stopColor="#f59e0b" />
                            <stop offset="1" stopColor="#dc2626" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    <h2 className="font-['EB_Garamond'] text-2xl xs:text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-white leading-tight">
                      Diwali <span className="font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)]">Dhamaka</span> Sale
                    </h2>
                  </div>

                  <p className="font-['Geist'] text-xs sm:text-sm text-purple-200/90 font-medium">
                    Quality Mocks. Festive Prices. Unlimited Exam Preparation.
                  </p>
                </div>

                {/* Key Benefits List */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[11.5px] sm:text-xs text-purple-100">
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span> Real CBT Interface
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span> 500+ Sectional & Full Mocks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span> Hindi & English Solutions
                  </span>
                </div>
              </div>

              {/* Right Column: Festive Price Box & Action (md: 5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center md:items-end justify-center">
                <div className="w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-purple-900/60 to-purple-950/80 border-2 border-amber-400/50 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.45)] text-center space-y-3">
                  {/* Pass Title */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400 text-purple-950">
                      YEARLY PASS
                    </span>
                    <span className="text-xs font-semibold text-purple-200">GovtPariksha PASS</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-xs sm:text-sm text-purple-300 font-medium">at Just</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-tight drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]">
                      ₹299
                    </span>
                    <span className="text-xs sm:text-sm line-through text-purple-300/60">₹999</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      70% OFF
                    </span>
                  </div>

                  <p className="text-[11px] text-purple-200/80">
                    Validity: 1 Full Year All-Access to All Exams & CBT Mocks
                  </p>

                  {/* Buy Now Button */}
                  <a
                    href="/pricing"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600 hover:from-emerald-400 hover:to-green-500 shadow-[0_4px_18px_rgba(16,185,129,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Buy Pass Now</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              SLIDE 2: DSSSB TGT COMPUTER SCIENCE (Live Series)
              ────────────────────────────────────────────────────────── */}
          <div
            className="w-full shrink-0 relative overflow-hidden bg-gradient-to-br from-[#07162c] via-[#0d2a4e] to-[#16406e] text-white p-5 sm:p-8 md:p-10 min-h-[340px] sm:min-h-[380px] flex items-center"
            role="group"
            aria-roledescription="slide"
            aria-label="2 of 3: DSSSB TGT Computer Science Live Series"
          >
            {/* Ambient Cyan / Blue Glows */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-orange-600/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: DSSSB Overview */}
              <div className="md:col-span-7 space-y-3 sm:space-y-4 text-center md:text-left">
                {/* Live Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE CBT MOCKS · 2026 PATTERN</span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-['EB_Garamond'] text-2xl xs:text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-white leading-tight">
                    DSSSB TGT & PGT <br className="hidden sm:inline" />
                    <span className="font-bold text-cyan-300">Computer Science</span> Suite
                  </h2>

                  <p className="font-['Geist'] text-xs sm:text-sm text-slate-200/90 font-medium">
                    Delhi Subordinate Services Selection Board (DSSSB) Comprehensive CBT Practice
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[11.5px] sm:text-xs text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">✓</span> Section A (GK, Reasoning, Math, English, Hindi)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">✓</span> Section B (CS, Python, DBMS, OS, Networks)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold">✓</span> Authentic 0.25 Negative Marking Simulation
                  </span>
                </div>
              </div>

              {/* Right Column: CBT Preview & Action Button */}
              <div className="md:col-span-5 flex flex-col items-center md:items-end justify-center">
                <div className="w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-cyan-400/30 backdrop-blur-md shadow-2xl space-y-3.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700">
                    <span className="font-semibold text-slate-300">CBT Hall Simulation</span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      100% Free Mocks Open
                    </span>
                  </div>

                  <div className="space-y-2 text-left text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Total Available Tests:</span>
                      <strong className="text-white font-semibold">520+ Tests</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Languages:</span>
                      <strong className="text-white font-semibold">Bilingual (Hindi / English)</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Analysis:</span>
                      <strong className="text-cyan-300 font-semibold">AI Rank & Sectional Score</strong>
                    </div>
                  </div>

                  <a
                    href="/test-series/dsssb-tgt-computer-science"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#ff4d00] to-[#ff6a26] hover:from-[#e04400] hover:to-[#ff5500] shadow-[0_4px_18px_rgba(255,77,0,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Start Free DSSSB Mock</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              SLIDE 3: UPCOMING 2026 CBT SERIES (SSC & RAILWAYS)
              ────────────────────────────────────────────────────────── */}
          <div
            className="w-full shrink-0 relative overflow-hidden bg-gradient-to-br from-[#0a1e1b] via-[#10352e] to-[#184e44] text-white p-5 sm:p-8 md:p-10 min-h-[340px] sm:min-h-[380px] flex items-center"
            role="group"
            aria-roledescription="slide"
            aria-label="3 of 3: Upcoming 2026 CBT Series"
          >
            {/* Ambient Emerald & Gold Glows */}
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Upcoming Series Info */}
              <div className="md:col-span-7 space-y-3 sm:space-y-4 text-center md:text-left">
                {/* Coming Soon Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-400/15 border border-amber-300/40 text-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>LAUNCHING SOON · 2026 EDITIONS</span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-['EB_Garamond'] text-2xl xs:text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-white leading-tight">
                    SSC CGL & RRB NTPC <br className="hidden sm:inline" />
                    <span className="font-bold text-amber-300">Mega CBT 2026</span> Series
                  </h2>

                  <p className="font-['Geist'] text-xs sm:text-sm text-emerald-100/90 font-medium">
                    Comprehensive Question Banks Designed with Exam Mentors & Toppers
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[11.5px] sm:text-xs text-emerald-100">
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-300 font-bold">✓</span> 20,000+ TCS Pattern Questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-300 font-bold">✓</span> AI Weakness & Speed Analytics
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-300 font-bold">✓</span> Chapter-wise & Full Tests
                  </span>
                </div>
              </div>

              {/* Right Column: Pre-Register Card & Scroll Action */}
              <div className="md:col-span-5 flex flex-col items-center md:items-end justify-center">
                <div className="w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-emerald-950/60 border border-amber-400/30 backdrop-blur-md shadow-2xl text-center space-y-3">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400 text-emerald-950">
                    COMING SOON IN PREVIEW
                  </span>

                  <p className="text-xs text-emerald-100 font-medium">
                    Curated for Staff Selection Commission & Railway Recruitment Board Aspirants.
                  </p>

                  <div className="py-1 text-xs text-amber-200/90 font-semibold">
                    ⭐ SSC CGL · RRB NTPC · CTET Teaching
                  </div>

                  <button
                    type="button"
                    onClick={scrollToExplorer}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-[0_4px_18px_rgba(245,158,11,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Explore Upcoming Series</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────
            CAROUSEL CONTROLS: Left & Right Navigation Arrows
            ────────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white/90 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-md opacity-80 group-hover:opacity-100 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white/90 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-md opacity-80 group-hover:opacity-100 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* ──────────────────────────────────────────────────────────
            CAROUSEL INDICATOR DOTS
            ────────────────────────────────────────────────────────── */}
        <div
          className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20"
          role="tablist"
          aria-label="Slides"
        >
          {SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-selected={isActive}
                role="tab"
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-7 sm:w-8 h-2 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. TESTBOOK-STYLE QUICK ACCESS FEATURE STRIP
          ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 pt-1">
        {/* Item 1: Live Tests */}
        <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 font-bold text-xs border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-editorial-heading truncate">Live CBT Tests</span>
            <span className="block text-[10.5px] text-editorial-muted truncate">Real Exam Hall</span>
          </div>
        </div>

        {/* Item 2: Sectional Tests */}
        <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs border border-emerald-500/20">
            ✓
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-editorial-heading truncate">Sectional Tests</span>
            <span className="block text-[10.5px] text-editorial-muted truncate">Topic Mastery</span>
          </div>
        </div>

        {/* Item 3: Free Quizzes */}
        <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs border border-amber-500/20">
            ⚡
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-editorial-heading truncate">Daily Quizzes</span>
            <span className="block text-[10.5px] text-editorial-muted truncate">10-Min Fast Practice</span>
          </div>
        </div>

        {/* Item 4: Previous Year Papers */}
        <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs border border-indigo-500/20">
            📜
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-editorial-heading truncate">Solved PYQs</span>
            <span className="block text-[10.5px] text-editorial-muted truncate">Authentic Papers</span>
          </div>
        </div>

        {/* Item 5: AI Rank Predictor */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs border border-cyan-500/20">
            📊
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-editorial-heading truncate">AI Rank Predictor</span>
            <span className="block text-[10.5px] text-editorial-muted truncate">Speed & Accuracy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
