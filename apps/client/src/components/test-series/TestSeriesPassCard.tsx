import { useEffect, useState } from 'react';
import { API_URL, isClientAuthenticated } from '../../lib/api';
import {
  calculateDiscount,
  formatValidity,
  getClientPlanDefaults,
  type PlanItem,
} from '../../lib/passOffer';
import { openTestSeriesCheckout } from './openTestSeriesCheckout';

export type { PlanItem };
export type PassPlanType = 'series' | 'all' | null;

type PassOffer = {
  plans?: PlanItem[];
  amountPaise: number;
  listPricePaise: number;
  validityMonths: number;
  currency: string;
  active?: boolean;
  passType?: PassPlanType;
  expiresAt?: string | null;
};

const DEFAULT_PLANS: PlanItem[] = getClientPlanDefaults().plans;

function rupees(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function TestSeriesPassCard({
  seriesId,
  variant = 'series',
  layout = 'stacked',
  initialActive = false,
  initialPassType = null,
  initialExpiresAt = null,
  onPurchased,
}: Readonly<{
  seriesId?: string;
  variant?: 'series' | 'instructions';
  layout?: 'dual' | 'stacked' | 'compact';
  initialActive?: boolean;
  initialPassType?: PassPlanType;
  initialExpiresAt?: string | null;
  onPurchased?: () => void;
}>) {
  const [offer, setOffer] = useState<PassOffer | null>(null);
  const [active, setActive] = useState(initialActive);
  const [passType, setPassType] = useState<PassPlanType>(initialPassType);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);
  const [selectedPlan, setSelectedPlan] = useState<'all' | 'series'>('all');
  const [buyingPlan, setBuyingPlan] = useState<'series' | 'all' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    setActive(initialActive);
    setPassType(initialPassType);
    setExpiresAt(initialExpiresAt);
  }, [initialActive, initialPassType, initialExpiresAt]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const publicOfferPromise = fetch(`${API_URL}/payments/test-series-pass/offer`);
        const isAuth = isClientAuthenticated();
        const accessUrl = seriesId
          ? `${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(seriesId)}`
          : `${API_URL}/payments/test-series-pass`;
        const userPassPromise = isAuth
          ? fetch(accessUrl, { credentials: 'include' }).catch(() => null)
          : Promise.resolve(null);

        const [publicOffer, res] = await Promise.all([publicOfferPromise, userPassPromise]);
        if (!publicOffer.ok) {
          if (!ignore) setError('Pass details are unavailable right now.');
          return;
        }
        const offerBody = (await publicOffer.json()) as PassOffer;
        if (ignore) return;
        setOffer(offerBody);
        if (res?.ok) {
          const status = (await res.json()) as any;
          setActive(Boolean(status.active || status.hasActivePass));
          setPassType(status.passType ?? null);
          setExpiresAt(status.expiresAt ?? null);
        }
      } catch {
        if (!ignore) setError('Pass details are unavailable right now.');
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [seriesId]);

  const plans = offer?.plans || DEFAULT_PLANS;
  const seriesPlan = plans.find((p) => p.id === 'series') || DEFAULT_PLANS[0];
  const allAccessPlan = plans.find((p) => p.id === 'all') || DEFAULT_PLANS[1];
  const seriesDiscount = calculateDiscount(seriesPlan.amountPaise, seriesPlan.listPricePaise);
  const allAccessDiscount = calculateDiscount(allAccessPlan.amountPaise, allAccessPlan.listPricePaise);

  const buy = async (planId: 'series' | 'all') => {
    if (buyingPlan) return;
    if (!isClientAuthenticated()) {
      const loginUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      void import('astro:transitions/client')
        .then(({ navigate }) => navigate(loginUrl))
        .catch(() => {
          window.location.href = loginUrl;
        });
      return;
    }

    setBuyingPlan(planId);
    setError(null);
    setCancelled(false);
    const plan = planId === 'all' ? allAccessPlan : seriesPlan;
    const result = await openTestSeriesCheckout({
      planType: planId,
      seriesId: planId === 'series' ? seriesId : undefined,
      validityMonths: plan.validityMonths,
    });
    if (result.status === 'paid') {
      setActive(true);
      setPassType(planId);
      setExpiresAt(result.expiresAt);
      setBuyingPlan(null);
      onPurchased?.();
      return;
    }
    if (result.status === 'cancelled') {
      setCancelled(true);
      setBuyingPlan(null);
      return;
    }
    if (result.status === 'failed') {
      setError(result.message);
      setBuyingPlan(null);
    }
  };

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const statusNote = (
    <>
      {cancelled && <p className="text-body-xs text-muted mt-3 text-center">Payment was cancelled.</p>}
      {error && (
        <div role="alert" className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-body-xs text-rose-700 dark:text-rose-300 text-center">
          {error}
        </div>
      )}
    </>
  );

  // Dual layout: side-by-side cards (used only if specifically requested)
  if (layout === 'dual') {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full items-stretch">
          {/* Card 1: Single Series Plan */}
          <section
            aria-labelledby="card-series-plan-heading"
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-xs transition hover:border-accent/40"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md border border-border bg-surface-raised px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {seriesPlan.badge || 'TARGETED EXAM'}
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  SAVE {seriesDiscount.saveRupees} ({seriesDiscount.discountPercent}% OFF)
                </span>
              </div>
              <h3 id="card-series-plan-heading" className="mt-3 text-xl font-black tracking-tight text-heading sm:text-2xl">
                Single Series Pass
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed font-medium">
                Complete access to this specific examination series with all mock tests &amp; drills.
              </p>
              <div className="mt-5 rounded-xl border border-border bg-surface-raised p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-heading sm:text-4xl tabular-nums">
                    {rupees(seriesPlan.amountPaise)}
                  </span>
                  <span className="text-sm text-muted line-through tabular-nums">
                    {rupees(seriesPlan.listPricePaise)}
                  </span>
                  <span className="text-xs font-semibold text-muted ml-auto">
                    / {seriesPlan.validityMonths} Months
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  One-time payment • No auto-debit
                </p>
              </div>
              <div className="mt-5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                  INCLUDED IN THIS PASS:
                </span>
                <ul className="mt-3 space-y-2.5 text-xs text-heading font-medium leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                    <span>All Full Length Mock Tests tailored to exam syllabus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                    <span>Subject-wise &amp; Chapter-wise practice test suites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                    <span>Official Previous Year Question Papers (PYQs)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                    <span>1 Free trial attempt slot per section included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                    <span>Detailed step-by-step bilingual solutions &amp; instant score</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              {active && (passType === 'series' || passType === 'all') ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Pass Active {expiryLabel ? `until ${expiryLabel}` : ''}
                  </span>
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Enrolled
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void buy('series')}
                  disabled={Boolean(buyingPlan)}
                  className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-accent bg-accent/10 px-4 text-sm font-bold text-accent transition hover:bg-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{buyingPlan === 'series' ? 'Opening checkout...' : `Unlock This Series · ${rupees(seriesPlan.amountPaise)}`}</span>
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </section>

          {/* Card 2: All-Access Pass */}
          <section
            aria-labelledby="card-all-access-heading"
            className="relative flex flex-col justify-between rounded-2xl border-2 border-accent bg-surface p-6 sm:p-7 shadow-md transition hover:shadow-lg"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-accent px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                ⭐ BEST VALUE · ALL EXAMS UNLIMITED
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  {allAccessPlan.badge || 'ALL EXAMS UNLOCKED'}
                </span>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                  SAVE {allAccessDiscount.saveRupees} ({allAccessDiscount.discountPercent}% OFF)
                </span>
              </div>
              <h3 id="card-all-access-heading" className="mt-3 text-xl font-black tracking-tight text-heading sm:text-2xl">
                All-Access Pass
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed font-medium">
                One pass unlocks every single test series across the entire platform for {allAccessPlan.validityMonths >= 12 ? `${Math.round(allAccessPlan.validityMonths / 12)} full years` : `${allAccessPlan.validityMonths} months`}.
              </p>
              <div className="mt-5 rounded-xl border border-accent/20 bg-accent/5 p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-heading sm:text-4xl tabular-nums">
                    {rupees(allAccessPlan.amountPaise)}
                  </span>
                  <span className="text-sm text-muted line-through tabular-nums">
                    {rupees(allAccessPlan.listPricePaise)}
                  </span>
                  <span className="text-xs font-semibold text-muted ml-auto">
                    / {allAccessPlan.validityMonths >= 12 ? `${Math.round(allAccessPlan.validityMonths / 12)} Years` : `${allAccessPlan.validityMonths} Months`}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Only ~₹{Math.round(allAccessPlan.amountPaise / 100 / allAccessPlan.validityMonths)}/month • Best value for serious aspirants
                </p>
              </div>
              <div className="mt-5">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
                  What is included:
                </span>
                <ul className="mt-2.5 space-y-2 text-xs text-heading leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Access to all test series across DSSSB, SSC, Teaching and State exams</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Full-length mock tests, subject tests, and chapter practice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Official previous year question papers with detailed solutions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Real CBT exam interface with timer, palette, and negative marking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Bilingual test questions in English and Hindi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                    <span>Unlimited test attempts valid for {allAccessPlan.validityMonths >= 12 ? `${Math.round(allAccessPlan.validityMonths / 12)} full years` : `${allAccessPlan.validityMonths} months`}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              {active && passType === 'all' ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    All-Access Active {expiryLabel ? `until ${expiryLabel}` : ''}
                  </span>
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    All-Access Pass
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void buy('all')}
                  disabled={Boolean(buyingPlan)}
                  className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{buyingPlan === 'all' ? 'Opening checkout...' : `Get All-Access Pass · ${rupees(allAccessPlan.amountPaise)}`}</span>
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </section>
        </div>
        {statusNote}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // COMBINED 1-CARD SECTION (Default for Detail Page & Sidebar)
  // Combines Single Series & All-Access Pass into 1 sleek interactive card
  // ══════════════════════════════════════════════════════════════════
  const isAllSelected = selectedPlan === 'all';
  const currentPlan = isAllSelected ? allAccessPlan : seriesPlan;
  const isEnrolledInCurrent = active && (passType === 'all' || (passType === 'series' && !isAllSelected));
  const allValidity = formatValidity(allAccessPlan.validityMonths);
  const seriesValidity = formatValidity(seriesPlan.validityMonths);

  let submitButtonText = 'Opening checkout...';
  if (buyingPlan !== selectedPlan) {
    submitButtonText = isAllSelected
      ? `Get All-Access Pass · ${rupees(allAccessPlan.amountPaise)}`
      : `Unlock This Series · ${rupees(seriesPlan.amountPaise)}`;
  }

  return (
    <div className="w-full">
      <section
        id="series-pass"
        aria-labelledby="card-combined-pass-heading"
        className="relative flex flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs scroll-mt-20 sm:scroll-mt-24 transition-all hover:border-accent/40"
      >
        {/* Header & Savings Pill */}
        <div className="flex items-center justify-between gap-2">
          <h3 id="card-combined-pass-heading" className="text-lg font-bold tracking-tight text-heading">
            {isAllSelected ? 'All-Access Pass' : 'Single Series Pass'}
          </h3>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            {isAllSelected ? `Save ${allAccessDiscount.discountPercent}%` : `Save ${seriesDiscount.discountPercent}%`}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted leading-relaxed">
          {isAllSelected
            ? `Access all mock tests across the platform for ${allValidity}.`
            : `Access all mock tests and practice sets for this exam series for ${seriesValidity}.`}
        </p>

        {/* ── Plan Switcher: 2 Selectable Plan Option Tiles ── */}
        <div className="mt-4 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Select examination pass plan">
          {/* Tile 1: All-Access Pass */}
          <button
            type="button"
            role="radio"
            aria-checked={isAllSelected}
            onClick={() => setSelectedPlan('all')}
            className={`relative flex flex-col rounded-xl p-3 text-left transition-all cursor-pointer ${
              isAllSelected
                ? 'border-2 border-accent bg-accent/5 ring-1 ring-accent'
                : 'border border-border bg-surface-raised/40 hover:border-accent/30 hover:bg-surface-raised'
            }`}
          >
            <span className="inline-block w-fit rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold text-accent">
              Best Value
            </span>
            <span className="mt-1.5 text-xs font-bold text-heading">All-Access</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-heading tabular-nums">{rupees(allAccessPlan.amountPaise)}</span>
              <span className="text-[10px] text-muted line-through tabular-nums">{rupees(allAccessPlan.listPricePaise)}</span>
            </div>
            <span className="mt-0.5 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400">
              {allValidity} · All Exams
            </span>
          </button>

          {/* Tile 2: Single Series Plan */}
          <button
            type="button"
            role="radio"
            aria-checked={!isAllSelected}
            onClick={() => setSelectedPlan('series')}
            className={`relative flex flex-col rounded-xl p-3 text-left transition-all cursor-pointer ${
              !isAllSelected
                ? 'border-2 border-accent bg-accent/5 ring-1 ring-accent'
                : 'border border-border bg-surface-raised/40 hover:border-accent/30 hover:bg-surface-raised'
            }`}
          >
            <span className="inline-block w-fit rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[9px] font-medium text-muted">
              Single Exam
            </span>
            <span className="mt-1.5 text-xs font-bold text-heading">Single Series</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-heading tabular-nums">{rupees(seriesPlan.amountPaise)}</span>
              <span className="text-[10px] text-muted line-through tabular-nums">{rupees(seriesPlan.listPricePaise)}</span>
            </div>
            <span className="mt-0.5 text-[10.5px] font-medium text-muted">
              {seriesValidity} · This Exam
            </span>
          </button>
        </div>

        {/* Selected Plan Price & Validity Box */}
        <div className="mt-4 rounded-xl border border-border bg-surface-raised/40 p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-heading tabular-nums">
                {rupees(currentPlan.amountPaise)}
              </span>
              <span className="text-xs text-muted line-through tabular-nums">
                {rupees(currentPlan.listPricePaise)}
              </span>
            </div>
            <span className="text-xs font-semibold text-muted">
              {isAllSelected ? `${allValidity} Access` : `${seriesValidity} Access`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {isAllSelected
              ? 'One-time payment. Full access to all test series.'
              : 'One-time payment. Complete access to this test series.'}
          </p>
        </div>

        {/* Features Checklist */}
        <div className="mt-4">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
            What is included:
          </span>
          <ul className="mt-2.5 space-y-2 text-xs text-heading leading-relaxed">
            {isAllSelected ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Access to all test series across DSSSB, SSC, Teaching and State exams</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Full-length mock tests, subject tests, and chapter practice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Official previous year question papers with detailed solutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Real CBT exam interface with timer, palette, and negative marking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Bilingual test questions in English and Hindi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Unlimited test attempts valid for {allAccessPlan.validityMonths >= 12 ? `${Math.round(allAccessPlan.validityMonths / 12)} full years` : `${allAccessPlan.validityMonths} months`}</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>All full-length mock tests for this exam series</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Subject-wise and chapter-wise practice test suites</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Official previous year question papers with complete solutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Real CBT exam interface with timer and negative marking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>Bilingual test questions in English and Hindi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{seriesPlan.validityMonths} months validity with re-attempt access</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-border">
          {isEnrolledInCurrent ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Pass Active {expiryLabel ? `until ${expiryLabel}` : ''}
              </span>
              <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Enrolled
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void buy(selectedPlan)}
              disabled={Boolean(buyingPlan)}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition-all duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{submitButtonText}</span>
              <span aria-hidden="true">→</span>
            </button>
          )}

          <p className="mt-2 text-center text-[10.5px] text-muted">
            {isAllSelected
              ? `Valid for ${allValidity} across all exams on the platform.`
              : `Valid for ${seriesValidity} for this specific exam series.`}
          </p>

          {/* Quick Toggle Link */}
          {!isEnrolledInCurrent && (
            <div className="mt-2 text-center">
              {isAllSelected ? (
                <button
                  type="button"
                  onClick={() => setSelectedPlan('series')}
                  className="text-[11px] text-muted hover:text-heading transition cursor-pointer"
                >
                  Need only this exam? Select Single Series ({rupees(seriesPlan.amountPaise)})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedPlan('all')}
                  className="text-[11px] font-medium text-accent hover:underline transition cursor-pointer"
                >
                  Upgrade to All-Access Pass ({rupees(allAccessPlan.amountPaise)})
                </button>
              )}
            </div>
          )}

          {/* Direct Support Assistance */}
          <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Need help with enrollment? Call/WhatsApp:</span>
            <a
              href="tel:+919326126931"
              className="font-bold text-heading hover:text-accent transition-colors"
            >
              +91 9326126931
            </a>
          </div>
        </div>
      </section>

      {statusNote}
    </div>
  );
}
