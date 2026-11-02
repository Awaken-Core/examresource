import { useEffect, useState } from 'react';
import { API_URL, isClientAuthenticated } from '../../lib/api';
import { openTestSeriesCheckout } from './openTestSeriesCheckout';

export interface PlanItem {
  id: 'series' | 'all';
  name: string;
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
    price: 69,
    amountPaise: 6900,
    listPricePaise: 19900,
    validityMonths: 6,
    description: 'Access to this complete test series for 6 months',
  },
  {
    id: 'all',
    name: 'All-Access Pass',
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
  initialActive = false,
  initialExpiresAt = null,
  onPurchased,
}: {
  seriesId?: string;
  variant?: 'series' | 'instructions';
  initialActive?: boolean;
  initialExpiresAt?: string | null;
  onPurchased?: () => void;
}) {
  const [offer, setOffer] = useState<PassOffer | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'series' | 'all'>('series');
  const [active, setActive] = useState(initialActive);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    setActive(initialActive);
    setExpiresAt(initialExpiresAt);
  }, [initialActive, initialExpiresAt]);

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
          const status = (await res.json()) as PassOffer;
          setActive(Boolean(status.active || (status as any).hasActivePass));
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
  const currentPlan = plans.find((p) => p.id === selectedPlan) || plans[0];

  const buy = async () => {
    if (buying) return;
    setBuying(true);
    setError(null);
    setCancelled(false);
    const result = await openTestSeriesCheckout({
      planType: selectedPlan,
      seriesId: selectedPlan === 'series' ? seriesId : undefined,
      validityMonths: currentPlan.validityMonths,
    });
    if (result.status === 'paid') {
      setActive(true);
      setExpiresAt(result.expiresAt);
      setBuying(false);
      onPurchased?.();
      return;
    }
    if (result.status === 'cancelled') {
      setCancelled(true);
      setBuying(false);
      return;
    }
    if (result.status === 'failed') {
      setError(result.message);
      setBuying(false);
    }
  };

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const savings =
    currentPlan.listPricePaise > currentPlan.amountPaise
      ? rupees(currentPlan.listPricePaise - currentPlan.amountPaise)
      : null;

  const statusNote = (
    <>
      {cancelled && <p className="text-body-xs text-muted mt-2">Payment was cancelled.</p>}
      {error && (
        <div role="alert" className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-body-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}
    </>
  );

  if (variant === 'series') {
    return (
      <section id="series-pass" aria-labelledby="series-pass-heading" className="overflow-hidden rounded-2xl shadow-xs">
        {/* Top Pass Header */}
        <div data-dark-card="true" className="dark-card bg-[#141312] p-4 !text-white sm:p-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              TEST SERIES PASS
            </span>
            <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-black">
              {savings ? `SAVE ${savings}` : 'SPECIAL OFFER'}
            </span>
          </div>
          <h2 id="series-pass-heading" className="mt-2 text-lg font-black tracking-tight !text-white">
            CHOOSE YOUR PREPARATION PASS
          </h2>
          <p className="mt-0.5 text-xs text-zinc-200 font-medium">
            1 Free test slot in every section • Unlock unlimited attempts with a pass
          </p>
        </div>

        {/* Surface Card Body */}
        <div className="rounded-b-2xl border-x border-b border-border bg-surface p-5 shadow-sm">
          {/* Plan Selector Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSelectedPlan('series')}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                selectedPlan === 'series'
                  ? 'border-accent bg-accent/10 shadow-xs'
                  : 'border-border bg-surface-raised hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-heading">This Series</span>
                {selectedPlan === 'series' && <span className="text-accent text-xs">●</span>}
              </div>
              <div className="mt-1 text-base font-black text-heading">₹69</div>
              <div className="text-[11px] text-muted font-medium">6 Months</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlan('all')}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                selectedPlan === 'all'
                  ? 'border-accent bg-accent/10 shadow-xs'
                  : 'border-border bg-surface-raised hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-heading">All-Access</span>
                <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                  Best Value
                </span>
              </div>
              <div className="mt-1 text-base font-black text-heading">₹399</div>
              <div className="text-[11px] text-muted font-medium">1 Year (12 Mo)</div>
            </button>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-heading sm:text-4xl tabular-nums">
                  {rupees(currentPlan.amountPaise)}
                </span>
                <span className="text-sm text-muted line-through tabular-nums">
                  {rupees(currentPlan.listPricePaise)}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {currentPlan.description}
              </p>
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                Validity
              </span>
              <span className="mt-0.5 inline-block rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-xs font-bold text-heading">
                {currentPlan.validityMonths} Months
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-border" />

          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              WHAT YOU GET IN THIS PASS:
            </span>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-heading font-medium">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>
                  {selectedPlan === 'all'
                    ? 'All Test Series — Full access to all exams across the platform'
                    : 'Complete Test Series — All full mocks, subject tests, chapter tests & PYQs'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>Unlimited re-attempts with instant rank &amp; percentile analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>Authentic CBT interface with timer and question palette</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>Detailed step-by-step solutions with bilingual explanations</span>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-amber-800 dark:text-amber-300 border border-amber-500/25">
                <span className="font-bold text-amber-500">⚡</span>
                <span className="font-semibold text-[11px] leading-snug">
                  1 Free test attempt per section included for every student
                </span>
              </li>
            </ul>
          </div>

          {active && (
            <div className="my-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Pass active until {expiryLabel || 'Active'}
              </span>
              <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Enrolled
              </span>
            </div>
          )}

          {active ? (
            <a
              href="/test-series"
              className="mt-4 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold !text-white shadow-md transition-all duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span>Start Preparation Now</span>
              <span aria-hidden="true">→</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => void buy()}
              disabled={buying}
              className="mt-4 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold !text-white shadow-md transition-all duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{buying ? 'Opening checkout...' : `Unlock Pass · ${rupees(currentPlan.amountPaise)}`}</span>
              <span aria-hidden="true">→</span>
            </button>
          )}

          <p className="mt-2.5 text-center text-[11px] text-muted font-medium">
            Books &amp; daily quizzes always stay free.
          </p>

          <div>{statusNote}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-heading">Test Series Pass</h2>
        {savings && (
          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            Save {savings}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          type="button"
          onClick={() => setSelectedPlan('series')}
          className={`cursor-pointer rounded-xl border p-2.5 text-left text-xs transition ${
            selectedPlan === 'series'
              ? 'border-accent bg-accent/10 font-bold'
              : 'border-border bg-surface-raised font-medium'
          }`}
        >
          Single Series: ₹69 (6 Mo)
        </button>
        <button
          type="button"
          onClick={() => setSelectedPlan('all')}
          className={`cursor-pointer rounded-xl border p-2.5 text-left text-xs transition ${
            selectedPlan === 'all'
              ? 'border-accent bg-accent/10 font-bold'
              : 'border-border bg-surface-raised font-medium'
          }`}
        >
          All-Access: ₹399 (1 Year)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-raised p-3">
          <span className="block text-[11px] font-semibold text-muted">Price</span>
          <span className="mt-0.5 block text-base font-bold text-heading">
            <span className="mr-2 font-medium text-muted line-through">{rupees(currentPlan.listPricePaise)}</span>
            {rupees(currentPlan.amountPaise)}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-3">
          <span className="block text-[11px] font-semibold text-muted">Validity</span>
          <span className="mt-0.5 block text-base font-bold text-heading">{currentPlan.validityMonths} months</span>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-surface-raised p-3 sm:col-span-1">
          <span className="block text-[11px] font-semibold text-muted">Covers</span>
          <span className="mt-0.5 block text-base font-bold text-heading">
            {selectedPlan === 'all' ? 'All series' : 'This series'}
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted font-medium">
        Every user gets 1 free test attempt in each section (Full Mocks, Subject Tests, Chapter Tests, PYQs). Subsequent tests require a pass.
      </p>

      {active && expiryLabel ? (
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Pass active until {expiryLabel}</p>
      ) : (
        <button
          type="button"
          onClick={() => void buy()}
          disabled={buying}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-pill bg-accent px-6 text-button-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buying ? 'Opening checkout...' : `Buy pass · ${rupees(currentPlan.amountPaise)}`}
        </button>
      )}

      {statusNote}
    </section>
  );
}
