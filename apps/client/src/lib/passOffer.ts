import { API_URL } from './api';

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

export type PassOffer = {
  amountPaise: number;
  listPricePaise: number;
  validityMonths: number;
  currency: 'INR';
  plans: PlanItem[];
  seriesPlan: PlanItem;
  allAccessPlan: PlanItem;
};

export function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatValidity(months: number): string {
  if (months >= 12 && months % 12 === 0) {
    const years = months / 12;
    return `${years} Year${years > 1 ? 's' : ''}`;
  }
  return `${months} Month${months > 1 ? 's' : ''}`;
}

export function calculateDiscount(amountPaise: number, listPricePaise: number): {
  savePaise: number;
  saveRupees: string;
  discountPercent: number;
} {
  const savePaise = Math.max(0, listPricePaise - amountPaise);
  const discountPercent = listPricePaise > 0 ? Math.round((savePaise / listPricePaise) * 100) : 0;
  return {
    savePaise,
    saveRupees: formatRupees(savePaise),
    discountPercent,
  };
}

/**
 * Offline / build fallback defaults if the API server is unreachable.
 * The authoritative source of truth for pricing is strictly the server API:
 * GET /api/v1/payments/test-series-pass/offer
 */
const DEFAULT_SERIES_PRICE = 99;
const DEFAULT_SERIES_LIST_PRICE = 299;
const DEFAULT_SERIES_VALIDITY_MONTHS = 6;

const DEFAULT_PASS_PRICE = 399;
const DEFAULT_PASS_LIST_PRICE = 999;
const DEFAULT_PASS_VALIDITY_MONTHS = 36;

export function getClientPlanDefaults(): {
  plans: PlanItem[];
  seriesPlan: PlanItem;
  allAccessPlan: PlanItem;
} {
  const seriesPrice = DEFAULT_SERIES_PRICE;
  const seriesAmountPaise = seriesPrice * 100;
  const seriesListPrice = DEFAULT_SERIES_LIST_PRICE;
  const seriesListPricePaise = seriesListPrice * 100;
  const seriesValidityMonths = DEFAULT_SERIES_VALIDITY_MONTHS;

  const passPrice = DEFAULT_PASS_PRICE;
  const passAmountPaise = passPrice * 100;
  const passListPrice = DEFAULT_PASS_LIST_PRICE;
  const passListPricePaise = passListPrice * 100;
  const passValidityMonths = DEFAULT_PASS_VALIDITY_MONTHS;

  const seriesPlan: PlanItem = {
    id: 'series',
    name: 'Single Series Plan',
    badge: 'TARGETED PREP',
    price: seriesPrice,
    amountPaise: seriesAmountPaise,
    listPricePaise: seriesListPricePaise,
    validityMonths: seriesValidityMonths,
    description: `Complete access to this specific test series for ${seriesValidityMonths} months`,
  };

  const passYears = passValidityMonths >= 12 ? Math.round(passValidityMonths / 12) : null;
  const passValidityLabel = passYears ? `${passYears} full years` : `${passValidityMonths} months`;

  const allAccessPlan: PlanItem = {
    id: 'all',
    name: 'All-Access Pass',
    badge: 'BEST VALUE · ALL EXAMS',
    price: passPrice,
    amountPaise: passAmountPaise,
    listPricePaise: passListPricePaise,
    validityMonths: passValidityMonths,
    description: `Unrestricted access to all test series across the platform for ${passValidityLabel}`,
  };

  return {
    plans: [seriesPlan, allAccessPlan],
    seriesPlan,
    allAccessPlan,
  };
}

function parsePlanItem(raw: any, defaults: { seriesPlan: PlanItem; allAccessPlan: PlanItem }): PlanItem {
  const isAll = raw?.id === 'all';
  const fallback = isAll ? defaults.allAccessPlan : defaults.seriesPlan;

  const name = typeof raw?.name === 'string' ? raw.name : fallback.name;
  const badge = typeof raw?.badge === 'string' ? raw.badge : fallback.badge;
  const price = Number(raw?.price) || fallback.price;
  const amountPaise = Number(raw?.amountPaise) || fallback.amountPaise;
  const listPricePaise = Number(raw?.listPricePaise) || fallback.listPricePaise;
  const validityMonths = Number(raw?.validityMonths) || fallback.validityMonths;
  const description = typeof raw?.description === 'string' ? raw.description : fallback.description;

  return {
    id: isAll ? 'all' : 'series',
    name,
    badge,
    price,
    amountPaise,
    listPricePaise,
    validityMonths,
    description,
  };
}

export async function loadPassOffer(): Promise<PassOffer> {
  const defaults = getClientPlanDefaults();
  const fallbackOffer: PassOffer = {
    amountPaise: defaults.seriesPlan.amountPaise,
    listPricePaise: defaults.seriesPlan.listPricePaise,
    validityMonths: defaults.seriesPlan.validityMonths,
    currency: 'INR',
    plans: defaults.plans,
    seriesPlan: defaults.seriesPlan,
    allAccessPlan: defaults.allAccessPlan,
  };

  const api = API_URL;
  if (!api) return fallbackOffer;
  try {
    const response = await fetch(`${api}/payments/test-series-pass/offer`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return fallbackOffer;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return fallbackOffer;
    const data = await response.json();
    const plans: PlanItem[] =
      Array.isArray(data?.plans) && data.plans.length > 0
        ? data.plans.map((p: any) => parsePlanItem(p, defaults))
        : defaults.plans;

    const seriesPlan = plans.find((p) => p.id === 'series') || defaults.seriesPlan;
    const allAccessPlan = plans.find((p) => p.id === 'all') || defaults.allAccessPlan;

    return {
      amountPaise: seriesPlan.amountPaise,
      listPricePaise: seriesPlan.listPricePaise,
      validityMonths: seriesPlan.validityMonths,
      currency: 'INR',
      plans,
      seriesPlan,
      allAccessPlan,
    };
  } catch {
    return fallbackOffer;
  }
}
