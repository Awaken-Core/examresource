import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SlideConfig {
  id: string;
  type: 'diwali' | 'pass-rupee' | 'dsssb';
  bgImage: string;
  bgPosition: string;
}

const SLIDES: SlideConfig[] = [
  {
    id: 'diwali-sale',
    type: 'diwali',
    bgImage: '/images/banners/diwali-banner.webp',
    bgPosition: 'center',
  },
  {
    id: 'pass-rupee',
    type: 'pass-rupee',
    bgImage: '/images/banners/pass-rupee-banner.webp',
    bgPosition: 'right center',
  },
  {
    id: 'dsssb-cs',
    type: 'dsssb',
    bgImage: '/images/banners/dsssb-cs-banner.webp',
    bgPosition: 'right center',
  },
];

const AUTO_SCROLL_INTERVAL = 5500; // 5.5s

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
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
  const nextIndex = (currentSlide + 1) % totalSlides;

  return (
    <div className="w-full space-y-5 sm:space-y-6 font-['Geist']">
      {/* ══════════════════════════════════════════════════════════════
          1. TESTBOOK-STYLE PEEK CAROUSEL (Fade Transition in Center)
          ══════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full flex items-center justify-center select-none group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured Test Series & Promotional Offers"
      >
        {/* Left Peek Card (Previous Slide Preview) */}
        <div
          onClick={prevSlide}
          aria-hidden="true"
          title="Click to view previous slide"
          className="hidden md:block absolute left-0 w-[7%] lg:w-[8%] h-[88%] rounded-2xl overflow-hidden opacity-40 hover:opacity-75 transition-all duration-300 cursor-pointer shadow-md border border-editorial-border/60 z-0"
        >
          <div
            className="w-full h-full transform scale-105"
            style={{
              backgroundImage: `url(${SLIDES[prevIndex].bgImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
        </div>

        {/* Center Active Stage (Crossfade Container with Fixed Position) */}
        <div className="relative w-full md:w-[87%] lg:w-[89%] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl min-h-[310px] xs:min-h-[340px] sm:min-h-[370px] md:min-h-[390px] border border-editorial-border/80 z-10 bg-editorial-surface">
          {/* SLIDE 0: DIWALI DHAMAKA SALE */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out flex items-center ${
              currentSlide === 0 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${SLIDES[0].bgImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
            role="group"
            aria-roledescription="slide"
            aria-label="1 of 3: Diwali Dhamaka Sale"
          >
            {/* Dark Gradient Overlay for high-contrast legible text */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#17052e]/95 via-[#230742]/85 sm:via-[#230742]/75 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full p-5 sm:p-8 md:p-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
              {/* Left Column: Festive Branding & Titles */}
              <div className="md:col-span-7 space-y-2.5 sm:space-y-3.5 text-left">
                {/* Top Badge: SALE IS LIVE */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-400/20 border border-amber-300/50 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.35)]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>SALE IS LIVE · FESTIVE SPECIAL</span>
                </div>

                {/* Main Festive Title */}
                <div className="space-y-1">
                  <h2
                    style={{ color: '#ffffff' }}
                    className="font-['EB_Garamond'] text-2xl xs:text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
                  >
                    Diwali{' '}
                    <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(251,191,36,0.6)]">
                      Dhamaka
                    </span>{' '}
                    Sale
                  </h2>

                  <p
                    style={{ color: '#f3e8ff' }}
                    className="font-['Geist'] text-xs sm:text-[13.5px] text-purple-100 font-medium drop-shadow-md"
                  >
                    Quality Mocks. Festive Prices. Complete Govt Exam Preparation.
                  </p>
                </div>

                {/* Benefits checkmarks */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] sm:text-xs text-purple-100">
                  <span className="flex items-center gap-1.5 drop-shadow">
                    <span className="text-amber-300 font-bold">✓</span> Real CBT Simulator
                  </span>
                  <span className="flex items-center gap-1.5 drop-shadow">
                    <span className="text-amber-300 font-bold">✓</span> 500+ Sectional Tests
                  </span>
                  <span className="flex items-center gap-1.5 drop-shadow">
                    <span className="text-amber-300 font-bold">✓</span> Hindi & English Solutions
                  </span>
                </div>
              </div>

              {/* Right Column: Festive Price Card & CTA Button */}
              <div className="md:col-span-5 flex flex-col items-start md:items-end justify-center">
                <div className="w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-purple-950/80 to-[#1e0738]/95 border-2 border-amber-400/60 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.6)] text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-400 text-purple-950">
                      YEARLY PASS
                    </span>
                    <span style={{ color: '#f3e8ff' }} className="text-xs font-semibold text-purple-200">
                      GovtPariksha PASS
                    </span>
                  </div>

                  <div className="flex items-baseline justify-center gap-2">
                    <span style={{ color: '#e9d5ff' }} className="text-xs sm:text-sm text-purple-200 font-medium">
                      at Just
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-tight drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)]">
                      ₹299
                    </span>
                    <span style={{ color: '#c084fc' }} className="text-xs sm:text-sm line-through text-purple-300/70">
                      ₹999
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                      70% OFF
                    </span>
                  </div>

                  <p style={{ color: '#e9d5ff' }} className="text-[11px] text-purple-200/90 font-medium">
                    Validity: 1 Full Year All-Access to All CBT Mocks
                  </p>

                  <a
                    href="/pricing"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600 hover:from-emerald-400 hover:to-green-500 shadow-[0_4px_20px_rgba(16,185,129,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
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

          {/* SLIDE 1: ONE SUBSCRIPTION / SUPER PASS (@ ₹1 Trial) */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out flex items-center ${
              currentSlide === 1 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${SLIDES[1].bgImage})`,
              backgroundPosition: 'right center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
            role="group"
            aria-roledescription="slide"
            aria-label="2 of 3: Super Pass Trial"
          >
            {/* Gradient Overlay for high-contrast legible text */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/90 to-transparent/10 dark:from-[#091322] dark:via-[#091322]/95 sm:dark:via-[#091322]/90 dark:to-transparent/20 pointer-events-none" />

            <div className="relative z-10 w-full p-5 sm:p-8 md:p-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
              {/* Left Content */}
              <div className="md:col-span-8 space-y-2.5 sm:space-y-3.5 text-left">
                {/* Brand Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-extrabold tracking-wider uppercase bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 shadow-2xs">
                  <span className="text-[#ff4d00] font-black">GovtPariksha</span>
                  <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[9.5px]">SUPER</span>
                  <span className="text-blue-900 dark:text-blue-200 font-black">PASS</span>
                </div>

                <div className="space-y-1">
                  <h2 className="font-['Geist'] text-2xl xs:text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                    One Subscription for{' '}
                    <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-[#ff4d00] bg-clip-text text-transparent">
                      375+ Govt. Exams
                    </span>
                  </h2>

                  <p className="font-['Geist'] text-xs sm:text-[13.5px] text-slate-600 dark:text-slate-300 font-medium">
                    All-access pass for DSSSB, SSC CGL, RRB Railways, and Teaching Examination CBT Mocks.
                  </p>
                </div>

                {/* Feature Capsules (like Testbook) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <span>🎥</span> Live Tests
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <span>📚</span> Chapter Tests
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <span>📝</span> Full Mocks
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <span>📑</span> Solved PYQs
                  </span>
                </div>

                {/* CTA Button Row */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-[0_4px_18px_rgba(225,29,72,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Start Trial @ ₹1</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>

                  <span className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    <span>🔄</span> Unlimited CBT mock hall access
                  </span>
                </div>
              </div>

              <div className="hidden md:block md:col-span-4" />
            </div>
          </div>

          {/* SLIDE 2: DSSSB TGT & PGT COMPUTER SCIENCE */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out flex items-center ${
              currentSlide === 2 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${SLIDES[2].bgImage})`,
              backgroundPosition: 'right center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
            role="group"
            aria-roledescription="slide"
            aria-label="3 of 3: DSSSB Computer Science CBT"
          >
            {/* Dark Overlay for clear text reading */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#061424]/95 via-[#0b2440]/85 sm:via-[#0b2440]/75 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full p-5 sm:p-8 md:p-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
              {/* Left Column: DSSSB Overview */}
              <div className="md:col-span-7 space-y-2.5 sm:space-y-3.5 text-left">
                {/* Live Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE CBT MOCKS · 2026 PATTERN</span>
                </div>

                <div className="space-y-1">
                  <h2
                    style={{ color: '#ffffff' }}
                    className="font-['EB_Garamond'] text-2xl xs:text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
                  >
                    DSSSB TGT & PGT <br className="hidden sm:inline" />
                    <span className="text-cyan-300 font-extrabold">Computer Science</span> Suite
                  </h2>

                  <p
                    style={{ color: '#cbd5e1' }}
                    className="font-['Geist'] text-xs sm:text-[13.5px] text-slate-300 font-medium drop-shadow"
                  >
                    Delhi Subordinate Services Selection Board (DSSSB) Comprehensive CBT Practice
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] sm:text-xs text-slate-200">
                  <span className="flex items-center gap-1.5 drop-shadow">
                    <span className="text-cyan-400 font-bold">✓</span> Section A (GK, Math, Reasoning, English, Hindi)
                  </span>
                  <span className="flex items-center gap-1.5 drop-shadow">
                    <span className="text-cyan-400 font-bold">✓</span> Section B (CS, Python, DBMS, OS, Networks)
                  </span>
                  <span className="flex items-center gap-1.5 drop-shadow">
                    <span className="text-cyan-400 font-bold">✓</span> Authentic 0.25 Negative Marking Simulation
                  </span>
                </div>
              </div>

              {/* Right Column: CBT Stats Card & Action */}
              <div className="md:col-span-5 flex flex-col items-start md:items-end justify-center">
                <div className="w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-slate-900/85 border border-cyan-400/40 backdrop-blur-md shadow-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700">
                    <span style={{ color: '#cbd5e1' }} className="font-semibold text-slate-300">
                      CBT Hall Simulation
                    </span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      100% Free Mocks Open
                    </span>
                  </div>

                  <div className="space-y-1.5 text-left text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span style={{ color: '#94a3b8' }} className="text-slate-400">
                        Total Available Tests:
                      </span>
                      <strong style={{ color: '#ffffff' }} className="text-white font-semibold">
                        520+ Tests
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span style={{ color: '#94a3b8' }} className="text-slate-400">
                        Languages:
                      </span>
                      <strong style={{ color: '#ffffff' }} className="text-white font-semibold">
                        Bilingual (Hindi / English)
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span style={{ color: '#94a3b8' }} className="text-slate-400">
                        Analysis:
                      </span>
                      <strong className="text-cyan-300 font-semibold">AI Rank & Sectional Score</strong>
                    </div>
                  </div>

                  <a
                    href="/test-series/dsssb-tgt-computer-science"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#ff4d00] to-[#ff6a26] hover:from-[#e04400] hover:to-[#ff5500] shadow-[0_4px_20px_rgba(255,77,0,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
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

          {/* Floating Navigation Buttons on the Left/Right Seam */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-slate-800 dark:bg-slate-900/95 dark:hover:bg-slate-900 dark:text-white backdrop-blur-md border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110 z-30 opacity-80 group-hover:opacity-100"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white text-slate-800 dark:bg-slate-900/95 dark:hover:bg-slate-900 dark:text-white backdrop-blur-md border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-110 z-30 opacity-80 group-hover:opacity-100"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right Peek Card (Next Slide Preview) */}
        <div
          onClick={nextSlide}
          aria-hidden="true"
          title="Click to view next slide"
          className="hidden md:block absolute right-0 w-[7%] lg:w-[8%] h-[88%] rounded-2xl overflow-hidden opacity-40 hover:opacity-75 transition-all duration-300 cursor-pointer shadow-md border border-editorial-border/60 z-0"
        >
          <div
            className="w-full h-full transform scale-105"
            style={{
              backgroundImage: `url(${SLIDES[nextIndex].bgImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          INDICATOR DOTS (with clean spacing)
          ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-2 pt-1 pb-1"
        role="tablist"
        aria-label="Banner Navigation Dots"
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
                  ? 'w-7 sm:w-8 h-2 bg-editorial-accent shadow-[0_0_8px_rgba(255,77,0,0.6)]'
                  : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
              }`}
            />
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. TESTBOOK-STYLE QUICK ACCESS FEATURE STRIP (with generous spacing)
          ══════════════════════════════════════════════════════════════ */}
      <div className="pt-3 sm:pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
          {/* Item 1: Live Tests */}
          <div className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
            <div className="w-8.5 h-8.5 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 font-bold text-xs border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-editorial-heading truncate">Live CBT Tests</span>
              <span className="block text-[10.5px] text-editorial-muted truncate">Real Exam Hall</span>
            </div>
          </div>

          {/* Item 2: Sectional Tests */}
          <div className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs border border-emerald-500/20">
              ✓
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-editorial-heading truncate">Sectional Tests</span>
              <span className="block text-[10.5px] text-editorial-muted truncate">Topic Mastery</span>
            </div>
          </div>

          {/* Item 3: Free Quizzes */}
          <div className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
            <div className="w-8.5 h-8.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold text-xs border border-amber-500/20">
              ⚡
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-editorial-heading truncate">Daily Quizzes</span>
              <span className="block text-[10.5px] text-editorial-muted truncate">10-Min Fast Practice</span>
            </div>
          </div>

          {/* Item 4: Previous Year Papers */}
          <div className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs border border-indigo-500/20">
              📜
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-editorial-heading truncate">Solved PYQs</span>
              <span className="block text-[10.5px] text-editorial-muted truncate">Authentic Papers</span>
            </div>
          </div>

          {/* Item 5: AI Rank Predictor */}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-editorial-surface border border-editorial-border hover:border-editorial-accent/40 transition-colors shadow-2xs">
            <div className="w-8.5 h-8.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs border border-cyan-500/20">
              📊
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-editorial-heading truncate">AI Rank Predictor</span>
              <span className="block text-[10.5px] text-editorial-muted truncate">Speed & Accuracy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
