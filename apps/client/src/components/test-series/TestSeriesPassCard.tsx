import { useEffect, useState } from 'react';
import { API_URL, isClientAuthenticated } from '../../lib/api';
import { openTestSeriesCheckout } from './openTestSeriesCheckout';

export interface PlanItem {
  id: 'series' | 'all';
  name: string;
  badge?: string;
  price: number;
  amountPaise: number;
  listPricePaise: number;
  validityMonths: number;
  description: string;
}

type PassOffer = {
  plans?: PlanItem[];
  amountPaise: number;
  listPricePaise: number;
  validityMonths: number;
  currency: string;
  active?: boolean;
  passType?: 'series' | 'all' | null;
  expiresAt?: string | null;
};

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'series',
    name: 'Single Series Plan',
    badge: 'TARGETED PREP',
    price: 69,
    amountPaise: 6900,
    listPricePaise: 19900,
    validityMonths: 6,
    description: 'Complete access to this specific test series for 6 months',
  },
  {
    id: 'all',
    name: 'All-Access Pass',
    badge: 'BEST VALUE · ALL EXAMS',
    price: 399,
    amountPaise: 39900,
    listPricePaise: 99900,
    validityMonths: 12,
    description: 'Unrestricted access to all test series across the platform for 1 year',
  },
];

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
  layout = 'dual',
  initialActive = false,
  initialPassType = null,
  initialExpiresAt = null,
  onPurchased,
}: {
  seriesId?: string;
  variant?: 'series' | 'instructions';
  layout?: 'dual' | 'stacked' | 'compact';
  initialActive?: boolean;
  initialPassType?: 'series' | 'all' | null;
  initialExpiresAt?: string | null;
  onPurchased?: () => void;
}) {
  const [offer, setOffer] = useState<PassOffer | null>(null);
  const [active, setActive] = useState(initialActive);
  const [passType, setPassType] = useState<'series' | 'all' | null>(initialPassType);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);
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
        const userPassPromise = isAuth
          ? fetch(
              seriesId
                ? `${API_URL}/payments/test-series-access?seriesId=${encodeURIComponent(seriesId)}`
                : `${API_URL}/payments/test-series-pass`,
              { credentials: 'include' },
            ).catch(() => null)
          : Promise.resolve(null);

        const [publicOffer, res] = await Promise.all([publicOfferPromise, userPassPromise]);
        if (!publicOffer.ok) {
          if (!ignore) setError('Pass details are unavailable right now.');
          return;
        }
        const offerBody = (await publicOffer.json()) as PassOffer;
        if (ignore) return;
        setOffer(offerBody);
        if (res && res.ok) {
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

  const buy = async (planId: 'series' | 'all') => {
    if (buyingPlan) return;
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

  const containerClass =
    layout === 'stacked'
      ? 'space-y-6 w-full'
      : layout === 'compact'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 w-full'
      : 'grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full items-stretch';

  return (
    <div className="w-full">
      <div className={containerClass}>
        {/* ══════════════════════════════════════════════════════
            CARD 1: SINGLE SERIES PLAN (₹69 / 6 Months)
            ══════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="card-series-plan-heading"
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-xs transition hover:border-accent/40"
        >
          <div>
            {/* Header / Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-md border border-border bg-surface-raised px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                {seriesPlan.badge || 'TARGETED EXAM'}
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                SAVE ₹130 (65% OFF)
              </span>
            </div>

            <h3 id="card-series-plan-heading" className="mt-3 text-xl font-black tracking-tight text-heading sm:text-2xl">
              Single Series Pass
            </h3>
            <p className="mt-1 text-xs text-muted leading-relaxed font-medium">
              Complete access to this specific examination series with all mock tests &amp; drills.
            </p>

            {/* Price block */}
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

            {/* Features List */}
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

          {/* Action Button */}
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
            <p className="mt-2 text-center text-[10.5px] text-muted">
              Access to this test series for 6 months.
            </p>
          </div>
        </section>


        {/* ══════════════════════════════════════════════════════
            CARD 2: ALL-ACCESS PASS (₹399 / 1 Year - Best Value)
            ══════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="card-all-access-heading"
          className="relative flex flex-col justify-between rounded-2xl border-2 border-accent bg-surface p-6 sm:p-7 shadow-md transition hover:shadow-lg"
        >
          {/* Featured Top Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-accent px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
              ⭐ BEST VALUE · ALL EXAMS UNLIMITED
            </span>
          </div>

          <div>
            {/* Header / Badge */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                {allAccessPlan.badge || 'ALL EXAMS UNLOCKED'}
              </span>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                SAVE ₹600 (60% OFF)
              </span>
            </div>

            <h3 id="card-all-access-heading" className="mt-3 text-xl font-black tracking-tight text-heading sm:text-2xl">
              All-Access Pass
            </h3>
            <p className="mt-1 text-xs text-muted leading-relaxed font-medium">
              One pass unlocks every single test series across the entire platform for 1 full year.
            </p>

            {/* Price block */}
            <div className="mt-5 rounded-xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-heading sm:text-4xl tabular-nums">
                  {rupees(allAccessPlan.amountPaise)}
                </span>
                <span className="text-sm text-muted line-through tabular-nums">
                  {rupees(allAccessPlan.listPricePaise)}
                </span>
                <span className="text-xs font-semibold text-muted ml-auto">
                  / 1 Year
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Only ~₹33/month • Best value for serious aspirants
              </p>
            </div>

            {/* Features List */}
            <div className="mt-5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                EVERYTHING INCLUDED:
              </span>
              <ul className="mt-3 space-y-2.5 text-xs text-heading font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-accent">✔</span>
                  <span><strong>All Test Series Unlocked</strong> — DSSSB, SSC, Teaching, Railways &amp; State Exams</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-accent">✔</span>
                  <span><strong>All Upcoming Series</strong> added automatically at zero extra cost</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-accent">✔</span>
                  <span>Unlimited re-attempts with All-India Rank (AIR) benchmarking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-accent">✔</span>
                  <span>Authentic CBT portal simulator with question palette</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-accent">✔</span>
                  <span>Instant language swap between English and Hindi</span>
                </li>

              </ul>
            </div>
          </div>

          {/* Action Button */}
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
            <p className="mt-2 text-center text-[10.5px] text-muted">
              Unrestricted access to all exams across the platform.
            </p>
          </div>
        </section>
      </div>

      {statusNote}
    </div>
  );
}
