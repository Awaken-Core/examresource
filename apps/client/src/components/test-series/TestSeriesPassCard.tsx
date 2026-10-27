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

  const buttonClass =
    variant === 'instructions'
      ? 'px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-accent text-on-accent hover:opacity-90 shadow-2xs active:scale-[0.98]'
      : 'w-full inline-flex items-center justify-center py-2 px-4 rounded-lg text-xs font-bold bg-accent text-on-accent hover:opacity-90 transition duration-150';

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <section className="bg-surface border border-border rounded-2xl p-6 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Test series pass
        </h2>
        {offer && offer.listPricePaise > offer.amountPaise && (
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            Save {rupees(offer.listPricePaise - offer.amountPaise)}
          </span>
        )}
      </div>

      {offer ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-surface-raised/40 border border-border/80 rounded-xl p-3">
            <span className="text-[11px] text-muted block">Price</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              <span className="line-through text-muted font-medium mr-2">{rupees(offer.listPricePaise)}</span>
              {rupees(offer.amountPaise)}
            </span>
          </div>
          <div className="bg-surface-raised/40 border border-border/80 rounded-xl p-3">
            <span className="text-[11px] text-muted block">Validity</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
              {offer.validityMonths} months
            </span>
          </div>
          <div className="bg-surface-raised/40 border border-border/80 rounded-xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-muted block">Covers</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">All test series</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">Loading pass details...</p>
      )}

      <p className="text-xs text-muted leading-relaxed">
        One test in each series is free. After that, this pass unlocks every test series for{' '}
        {offer?.validityMonths ?? 6} months. Blogs stay free. Books and quizzes are not included.
      </p>

      {active && expiryLabel ? (
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          Pass active until {expiryLabel}
        </p>
      ) : (
        <button type="button" onClick={() => void buy()} disabled={buying || !offer} className={buttonClass}>
          {buying ? 'Opening checkout...' : offer ? `Buy pass · ${rupees(offer.amountPaise)}` : 'Buy pass'}
        </button>
      )}

      {cancelled && <p className="text-xs text-muted">Payment was cancelled.</p>}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">{error}</div>
      )}
    </section>
  );
}
