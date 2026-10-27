export type PassOffer = {
  amountPaise: number;
  listPricePaise: number;
  validityMonths: number;
  currency: 'INR';
};

const fallbackOffer: PassOffer = {
  amountPaise: 6900,
  listPricePaise: 19900,
  validityMonths: 6,
  currency: 'INR',
};

export async function loadPassOffer(): Promise<PassOffer> {
  const api = import.meta.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (!api) return fallbackOffer;
  try {
    const response = await fetch(`${api}/payments/test-series-pass/offer`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return fallbackOffer;
    const data = await response.json();
    const amountPaise = Number(data.amountPaise);
    const listPricePaise = Number(data.listPricePaise);
    const validityMonths = Number(data.validityMonths);
    return {
      amountPaise: Number.isInteger(amountPaise) && amountPaise >= 100 ? amountPaise : fallbackOffer.amountPaise,
      listPricePaise:
        Number.isInteger(listPricePaise) && listPricePaise >= 100
          ? listPricePaise
          : fallbackOffer.listPricePaise,
      validityMonths:
        Number.isInteger(validityMonths) && validityMonths > 0
          ? validityMonths
          : fallbackOffer.validityMonths,
      currency: 'INR',
    };
  } catch {
    return fallbackOffer;
  }
}

export function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
