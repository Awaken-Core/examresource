import { useEffect, useState } from 'react';
import { API_URL } from '../../lib/api';
import { openTestSeriesCheckout } from './openTestSeriesCheckout';

type PassOffer = {
  amountPaise: number;
  listPricePaise: number;
  validityMonths: number;
  currency: string;
  active?: boolean;
  expiresAt?: string | null;
};

function rupees(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function TestSeriesPassCard({
  variant = 'series',
  initialActive = false,
  initialExpiresAt = null,
  onPurchased,
}: {
  variant?: 'series' | 'instructions';
  initialActive?: boolean;
  initialExpiresAt?: string | null;
  onPurchased?: () => void;
}) {
  const [offer, setOffer] = useState<PassOffer | null>(null);
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
        const res = await fetch(`${API_URL}/payments/test-series-pass`, { credentials: 'include' });
        const publicOffer = await fetch(`${API_URL}/payments/test-series-pass/offer`);
        if (!publicOffer.ok) {
          if (!ignore) setError('Pass details are unavailable right now.');
          return;
        }
        const offerBody = (await publicOffer.json()) as PassOffer;
        if (ignore) return;
        setOffer(offerBody);
        if (res.ok) {
          const status = (await res.json()) as PassOffer;
          setActive(Boolean(status.active));
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
  }, []);

  const buy = async () => {
    if (buying) return;
    setBuying(true);
    setError(null);
    setCancelled(false);
    const result = await openTestSeriesCheckout(offer?.validityMonths ?? 6);
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
    offer && offer.listPricePaise > offer.amountPaise
      ? rupees(offer.listPricePaise - offer.amountPaise)
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

  const months = offer?.validityMonths ?? 6;

  if (variant === 'series') {
    return (
      <section id="series-pass" aria-labelledby="series-pass-heading" className="overflow-hidden rounded-2xl shadow-xs">
        {/* Dark Top Pass Header */}
        <div data-dark-card="true" className="dark-card bg-[#141312] p-4 !text-white sm:p-5 border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              PREMIUM PASS
            </span>
            <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-black">
              {savings ? `SAVE ${savings} (65% OFF)` : 'SAVE ₹130 (65% OFF)'}
            </span>
          </div>
          <h2 id="series-pass-heading" className="mt-2 text-lg font-black tracking-tight !text-white">
            TEST SERIES PASS
          </h2>
          <p className="mt-0.5 text-xs text-zinc-200 font-medium">
            Unrestricted entry to all mocks, tests &amp; PYQs
          </p>
        </div>

        {/* Surface Card Body */}
        <div className="rounded-b-2xl border-x border-b border-border bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-heading sm:text-4xl tabular-nums">
                  {offer ? rupees(offer.amountPaise) : '₹69'}
                </span>
                <span className="text-sm text-muted line-through tabular-nums">
                  {offer && offer.listPricePaise > offer.amountPaise ? rupees(offer.listPricePaise) : '₹199'}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Special limited-time introductory fee
              </p>
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                Validity
              </span>
              <span className="mt-0.5 inline-block rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-xs font-bold text-heading">
                {months} Months
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-border" />

          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
              EVERYTHING IN THIS PASS:
            </span>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-heading font-medium">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>All 48 Full Mocks &amp; PYQs with instant re-attempts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>120 Chapter-wise drills for 20 designated subjects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>All-India Rank (AIR) &amp; Percentile benchmarking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>Bilingual detailed solutions + downloadable notes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">✔</span>
                <span>Real CBT exam portal simulator with question palette</span>
              </li>
            </ul>
          </div>

          {active && (
            <div className="my-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Pass active until {expiryLabel || '27 Apr 2027'}
              </span>
              <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Enrolled
              </span>
            </div>
          )}

          {active ? (
            <a
              href="#paper-panel"
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
              <span>{buying ? 'Opening checkout...' : 'Start Preparation Now'}</span>
              <span aria-hidden="true">→</span>
            </button>
          )}

          <p className="mt-2.5 text-center text-[11px] text-muted font-medium">
            Always stay free: Books &amp; Quizzes are not included in this pass.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 border-t border-border pt-3 text-[11px] text-muted font-semibold">
            <span>🔒 256-Bit SSL Encrypted</span>
            <span>•</span>
            <span>⚡ Instant Access</span>
          </div>

          <div>{statusNote}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-heading">Test series pass</h2>
        {savings && (
          <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            Save {savings}
          </span>
        )}
      </div>

      {offer ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-raised p-3">
            <span className="block text-[11px] font-semibold text-muted">Price</span>
            <span className="mt-0.5 block text-base font-bold text-heading">
              <span className="mr-2 font-medium text-muted line-through">{rupees(offer.listPricePaise)}</span>
              {rupees(offer.amountPaise)}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-surface-raised p-3">
            <span className="block text-[11px] font-semibold text-muted">Validity</span>
            <span className="mt-0.5 block text-base font-bold text-heading">{offer.validityMonths} months</span>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-surface-raised p-3 sm:col-span-1">
            <span className="block text-[11px] font-semibold text-muted">Covers</span>
            <span className="mt-0.5 block text-base font-bold text-heading">All test series</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted font-medium">Loading pass details...</p>
      )}

      <p className="text-xs leading-relaxed text-muted font-medium">
        One test in each series is free. After that, this pass unlocks every test series for{' '}
        {offer?.validityMonths ?? 6} months. Blogs stay free. Books and quizzes are not included.
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
          {buying ? 'Opening checkout...' : offer ? `Buy pass · ${rupees(offer.amountPaise)}` : 'Buy pass'}
        </button>
      )}

      {statusNote}
    </section>
  );
}
