import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SlideConfig {
  id: string;
  type: 'diwali' | 'free-mocks' | 'dsssb';
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
    id: 'free-mocks',
    type: 'free-mocks',
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

const AUTO_SCROLL_INTERVAL = 3000; // 3.0s (faster and snappy auto-animation)

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
    <div className="w-full space-y-3 sm:space-y-4 font-['Geist']">
      {/* Inline styles for auto-animation & progress bar */}
      <style>{`
        @keyframes bannerProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes bannerFadeInUp {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .banner-content-animate {
          animation: bannerFadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .banner-progress-bar {
          animation: bannerProgress ${AUTO_SCROLL_INTERVAL}ms linear forwards;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          1. EXACT TESTBOOK PROPORTIONS (805px × 322px / 762px × 305px)
          ══════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full overflow-hidden flex items-center justify-center select-none group py-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured Test Series & Promotional Offers"
      >
        {/* Stage Wrapper (Centers the 805px / 762px card and anchors adjacent cards with exact 10px gap) */}
        <div className="relative w-[84%] sm:w-[80%] md:w-[76%] lg:max-w-[805px] lg:w-full h-[260px] xs:h-[280px] sm:h-[305px] md:h-[322px] mx-auto">
          {/* Left Peek Card (Exact 10px Gap from Center Card, matching Testbook seam!) */}
          <div
            onClick={prevSlide}
            aria-hidden="true"
            title="Previous slide preview"
            className="hidden sm:block absolute right-[calc(100%+10px)] top-0 w-[140px] md:w-[180px] lg:w-[220px] h-full rounded-2xl md:rounded-[20px] overflow-hidden opacity-100 transition-all duration-300 cursor-pointer shadow-md border border-editorial-border/60 z-0"
          >
            <div
              className="w-full h-full transform scale-100"
              style={{
                backgroundImage: `url(${SLIDES[prevIndex].bgImage})`,
                backgroundPosition: 'right center',
                backgroundSize: 'cover',
              }}
            />
          </div>

          {/* Floating Left Arrow (Positioned over the Left Peek Card seam!) */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute -left-4 sm:-left-5 md:-left-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white text-slate-800 dark:bg-slate-900 dark:text-white shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer hover:scale-110 z-20 opacity-95 group-hover:opacity-100"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Center Active Stage (Exact Testbook Spec: max-w-[805px] × 322px / 762px × 305px - NO WIDTH INCREASE) */}
          <div className="relative w-full h-full rounded-2xl md:rounded-[20px] overflow-hidden shadow-2xl border border-editorial-border/80 z-10 bg-editorial-surface">
            {/* SLIDE 0: DIWALI DHAMAKA SALE (Exact Testbook Recreation) */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-400 ease-in-out flex items-center ${
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
            {/* Rich Nocturnal Purple Festive Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0433]/92 via-[#2b0754]/80 to-[#19032f]/92 pointer-events-none" />

            <div
              key={`slide-0-${currentSlide}`}
              className={`relative z-10 w-full h-full px-4 sm:px-6 py-2 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 items-center ${
                currentSlide === 0 ? 'banner-content-animate' : ''
              }`}
            >
              {/* Left Column: Ornate Festive Branding & Illuminated Diwali Dhamaka Emblem */}
              <div className="md:col-span-6 flex flex-col items-center justify-center text-center py-1">
                {/* Brand Logo & Name */}
                <div className="flex items-center justify-center gap-1.5 pb-1">
                  <div className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xs">
                    <span className="text-slate-950 font-black text-[9px]">G</span>
                  </div>
                  <span className="font-['Geist'] text-[11px] font-bold text-white tracking-wider">
                    Govt<span className="text-amber-400">Pariksha</span>
                  </span>
                </div>

                {/* Central Ornate Arch Frame */}
                <div className="relative inline-flex flex-col items-center justify-center px-6 sm:px-8 pt-3 pb-2 rounded-t-[34px] rounded-b-2xl bg-gradient-to-b from-[#6b092b] via-[#430519] to-[#20020a] border-2 border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.55),inset_0_0_18px_rgba(244,63,94,0.35)]">
                  {/* Glowing Diya Flame at apex */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-t from-amber-500 via-yellow-300 to-white flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse">
                    <div className="w-1.5 h-2.5 bg-amber-100 rounded-full blur-[0.5px]" />
                  </div>

                  {/* "Diwali" in glowing golden-white cursive serif */}
                  <span className="font-['EB_Garamond'] italic text-2xl sm:text-[28px] md:text-[32px] font-bold text-white drop-shadow-[0_2px_8px_rgba(251,191,36,0.85)] tracking-tight leading-none mt-0.5">
                    Diwali
                  </span>

                  {/* "Dhamaka" in giant 3D extruded gold font */}
                  <span className="font-['Geist'] font-black text-2xl sm:text-[30px] md:text-[34px] tracking-tight bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)] uppercase leading-none my-0.5">
                    Dhamaka
                  </span>

                  {/* "Sale" in curved golden ribbon banner */}
                  <div className="relative mt-0.5 px-5 py-0.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-rose-950 font-black text-[10.5px] sm:text-xs uppercase tracking-widest shadow-md border border-amber-200/80">
                    Sale
                  </div>
                </div>

                {/* Sub-badge: Quality Mocks. Festive Prices. */}
                <div className="mt-1.5 inline-flex items-center px-3.5 py-0.5 rounded-full bg-rose-950/85 border border-amber-400/60 text-amber-200 text-[9.5px] sm:text-[10px] font-semibold tracking-wide shadow-md">
                  Quality Mocks. Festive Prices.
                </div>

                {/* Bottom Illumination: Diyas */}
                <div className="flex items-center justify-center gap-3 pt-1 text-amber-300 text-sm sm:text-base drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                  <span className="transform -scale-x-100 animate-pulse">🪔</span>
                  <span className="text-base sm:text-lg scale-110 animate-pulse">🪔</span>
                  <span className="animate-pulse">🪔</span>
                </div>
              </div>

              {/* Subtle Golden Diagonal Divider Line */}
              <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-amber-400/40 to-transparent transform -translate-x-1/2 rotate-3" />

              {/* Right Column: Festive Offer & Pricing Stack (Exact Testbook Layout) */}
              <div className="md:col-span-6 flex flex-col items-center justify-center space-y-1.5 sm:space-y-2 text-center py-1">
                {/* 1. Ornate SALE IS LIVE Crest */}
                <div className="relative px-4 sm:px-5 py-0.5 rounded-t-xl rounded-b-md bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border border-amber-400/90 shadow-[0_0_15px_rgba(239,68,68,0.55)]">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-black tracking-widest text-amber-300 uppercase">
                    <span className="text-amber-300 text-xs animate-ping">✨</span>
                    <span>SALE IS LIVE</span>
                    <span className="text-amber-300 text-xs animate-ping">✨</span>
                  </div>
                </div>

                {/* 2. Yearly GovtPariksha PASS Pill */}
                <div className="inline-flex items-center justify-center gap-2 px-3 py-0.5 rounded-full bg-slate-950/80 border border-amber-400/50 shadow-md">
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-400 text-slate-950 font-black text-[9.5px] sm:text-[10px] uppercase tracking-wider shadow-xs">
                    Yearly
                  </span>
                  <span className="text-white font-bold text-[11px] sm:text-xs flex items-center gap-1.5">
                    GovtPariksha
                    <span className="px-1.5 py-0.2 rounded bg-sky-500 text-white font-black text-[8.5px] tracking-wider uppercase shadow-xs">
                      PASS
                    </span>
                  </span>
                </div>

                {/* 3. Golden Connector: at Just */}
                <div className="flex items-center justify-center gap-2 text-amber-200/90 text-[10px] font-medium">
                  <span className="w-8 sm:w-10 h-px bg-gradient-to-r from-transparent to-amber-300/70" />
                  <span className="italic">at Just</span>
                  <span className="w-8 sm:w-10 h-px bg-gradient-to-l from-transparent to-amber-300/70" />
                </div>

                {/* 4. Golden Parchment Ticket Card */}
                <div className="relative w-full max-w-[210px] sm:max-w-[230px] py-1 px-4 rounded-xl bg-gradient-to-r from-[#fef08a] via-[#fde047] to-[#eab308] border-2 border-amber-400 shadow-[0_4px_18px_rgba(251,191,36,0.6)] text-center">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-800/60 font-serif text-sm">❧</div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-800/60 font-serif text-sm">☙</div>

                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl sm:text-[34px] font-black text-rose-950 tracking-tight leading-none drop-shadow-xs">
                      ₹299
                    </span>
                    <span className="text-xs line-through text-rose-900/70 font-semibold">
                      ₹999
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-900 text-amber-300 uppercase">
                      70% OFF
                    </span>
                  </div>
                </div>

                {/* 5. Date Validity Pill */}
                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-950/85 border border-amber-400/50 text-amber-200 text-[9px] sm:text-[9.5px] font-semibold shadow-xs">
                  <span>📅</span>
                  <span>7th - 8th November · 1 Year All-Access</span>
                </div>

                {/* 6. Big Glossy Green Buy Now Button */}
                <a
                  href="/pricing"
                  className="w-full max-w-[190px] sm:max-w-[210px] inline-flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-6 rounded-full font-black text-sm text-white bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] hover:from-[#16a34a] hover:to-[#15803d] shadow-[0_4px_20px_rgba(34,197,94,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-green-300/40"
                >
                  <span>Buy Now</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* SLIDE 1: ATTEMPT THE FREE 2 MOCK TESTS (Testbook Style Light/Clean Card with Rupee Coin) */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-400 ease-in-out flex items-center ${
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
            aria-label="2 of 3: Attempt the Free 2 Mock Tests"
          >
            {/* Soft Gradient Overlay for crisp text while letting the coin on right pop */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/90 to-transparent/15 dark:from-[#081528] dark:via-[#081528]/95 sm:dark:via-[#081528]/90 dark:to-transparent/25 pointer-events-none" />

            <div
              key={`slide-1-${currentSlide}`}
              className={`relative z-10 w-full p-4 sm:p-5 md:p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center ${
                currentSlide === 1 ? 'banner-content-animate' : ''
              }`}
            >
              {/* Left Content */}
              <div className="md:col-span-8 space-y-1.5 sm:space-y-2 text-left">
                {/* Free Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>100% FREE CBT PRACTICE · NO CARD REQUIRED</span>
                </div>

                <div className="space-y-0.5">
                  <h2 className="font-['Geist'] text-xl xs:text-2xl sm:text-[27px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                    Attempt the Free{' '}
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      2 Mock Tests
                    </span>
                  </h2>

                  <p className="font-['Geist'] text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Experience actual exam interface, sectional negative marking, and instant AI Rank Predictor with 2 Full-Length Free Mock Tests.
                  </p>
                </div>

                {/* 5 Feature Capsules (Matching Testbook Strip) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] sm:text-[10.5px] font-semibold text-slate-700 dark:text-slate-200">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <span>📝</span> 2 Full Mocks Free
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <span>⏱️</span> Real CBT Hall Timer
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <span>📊</span> Instant AI Rank
                  </span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 items-center gap-1">
                    <span>📜</span> Solved PYQs
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <span>💡</span> Bilingual
                  </span>
                </div>

                {/* CTA Button Row */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <a
                    href="/test-series/dsssb-tgt-computer-science"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full font-extrabold text-xs text-white bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_3px_15px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Attempt Free 2 Mock Tests</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>

                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    <span>⭐</span> Instant Access · No Payment or Card Needed
                  </span>
                </div>
              </div>

              {/* Right Spacer for the 1-Rupee Coin Graphic to show clearly */}
              <div className="hidden md:block md:col-span-4 pointer-events-none" />
            </div>
          </div>

          {/* SLIDE 2: DSSSB TGT & PGT COMPUTER SCIENCE */}
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-400 ease-in-out flex items-center ${
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
            <div className="absolute inset-0 bg-gradient-to-r from-[#041122]/95 via-[#081e3a]/90 sm:via-[#081e3a]/80 to-transparent/30 pointer-events-none" />

            <div
              key={`slide-2-${currentSlide}`}
              className={`relative z-10 w-full p-4 sm:p-5 md:p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center ${
                currentSlide === 2 ? 'banner-content-animate' : ''
              }`}
            >
              {/* Left Column: DSSSB Overview */}
              <div className="md:col-span-7 space-y-1.5 sm:space-y-2 text-left">
                {/* Live Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE CBT MOCKS · 2026 PATTERN</span>
                </div>

                <div className="space-y-0.5">
                  <h2
                    style={{ color: '#ffffff' }}
                    className="font-['EB_Garamond'] text-xl xs:text-2xl sm:text-[27px] font-bold tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                  >
                    DSSSB TGT & PGT <br className="hidden sm:inline" />
                    <span className="text-cyan-300 font-extrabold">Computer Science</span> Suite
                  </h2>

                  <p
                    style={{ color: '#cbd5e1' }}
                    className="font-['Geist'] text-[11px] sm:text-xs text-slate-300 font-medium drop-shadow"
                  >
                    Delhi Subordinate Services Selection Board (DSSSB) Comprehensive CBT Practice
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] sm:text-[11px] text-slate-200 pt-0.5">
                  <span className="flex items-center gap-1 drop-shadow">
                    <span className="text-cyan-400 font-bold">✓</span> Section A (General)
                  </span>
                  <span className="flex items-center gap-1 drop-shadow">
                    <span className="text-cyan-400 font-bold">✓</span> Section B (CS & IT)
                  </span>
                  <span className="flex items-center gap-1 drop-shadow">
                    <span className="text-cyan-400 font-bold">✓</span> Authentic 0.25 Negative Marking
                  </span>
                </div>
              </div>

              {/* Right Column: CBT Stats Card & Action */}
              <div className="md:col-span-5 flex flex-col items-start md:items-end justify-center">
                <div className="w-full max-w-[245px] sm:max-w-[260px] p-3 sm:p-3.5 rounded-xl bg-slate-900/85 border border-cyan-400/40 backdrop-blur-md shadow-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-700">
                    <span style={{ color: '#cbd5e1' }} className="font-semibold text-slate-300">
                      CBT Simulation
                    </span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Free Open
                    </span>
                  </div>

                  <div className="space-y-1 text-left text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-slate-800">
                      <span style={{ color: '#94a3b8' }} className="text-slate-400">
                        Total Tests:
                      </span>
                      <strong style={{ color: '#ffffff' }} className="text-white font-semibold">
                        520+ Tests
                      </strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-800">
                      <span style={{ color: '#94a3b8' }} className="text-slate-400">
                        Languages:
                      </span>
                      <strong style={{ color: '#ffffff' }} className="text-white font-semibold">
                        Bilingual
                      </strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span style={{ color: '#94a3b8' }} className="text-slate-400">
                        Rank Predictor:
                      </span>
                      <strong className="text-cyan-300 font-semibold">AI Powered</strong>
                    </div>
                  </div>

                  <a
                    href="/test-series/dsssb-tgt-computer-science"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-4 rounded-lg font-bold text-xs text-white bg-gradient-to-r from-[#ff4d00] to-[#ff6a26] hover:from-[#e04400] hover:to-[#ff5500] shadow-[0_3px_15px_rgba(255,77,0,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Start Free Mock</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Right Arrow (Positioned over the Right Peek Card seam, matching Testbook crop!) */}
        <button
          type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute -right-4 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white text-slate-800 dark:bg-slate-900 dark:text-white shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer hover:scale-110 z-20 opacity-95 group-hover:opacity-100"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Right Peek Card (Exact 10px Gap from Center Card, matching Testbook seam!) */}
          <div
            onClick={nextSlide}
            aria-hidden="true"
            title="Next slide preview"
            className="hidden sm:block absolute left-[calc(100%+10px)] top-0 w-[140px] md:w-[180px] lg:w-[220px] h-full rounded-2xl md:rounded-[20px] overflow-hidden opacity-100 transition-all duration-300 cursor-pointer shadow-md border border-editorial-border/60 z-0"
          >
            <div
              className="w-full h-full transform scale-100"
              style={{
                backgroundImage: `url(${SLIDES[nextIndex].bgImage})`,
                backgroundPosition: 'left center',
                backgroundSize: 'cover',
              }}
            />
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          INDICATOR PROGRESS DOTS (Auto-animating progress bar)
          ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-2 pt-0.5 pb-0.5"
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
              className="p-1 cursor-pointer focus:outline-hidden"
            >
              <div
                className={`rounded-full overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'w-9 sm:w-11 h-1.5 bg-slate-200 dark:bg-slate-700'
                    : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              >
                {isActive && (
                  <div
                    key={`progress-${currentSlide}-${isPaused}`}
                    className="h-full bg-editorial-accent rounded-full banner-progress-bar"
                    style={{
                      animationPlayState: isPaused ? 'paused' : 'running',
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. TESTBOOK-STYLE QUICK ACCESS FEATURE STRIP
          ══════════════════════════════════════════════════════════════ */}
      <div className="pt-2 sm:pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
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
    </div>
  );
}
