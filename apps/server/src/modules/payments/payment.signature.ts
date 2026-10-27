import { createHmac, timingSafeEqual } from 'node:crypto';

export function paymentSignature(orderId: string, paymentId: string, secret: string) {
  return createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

export function webhookSignature(rawBody: Buffer | string, secret: string) {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function signaturesMatch(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Adds calendar months in UTC so a 6-month pass lands on the same day when that day exists. */
export function addCalendarMonths(from: Date, months: number) {
  const next = new Date(from.getTime());
  const originalDay = next.getUTCDate();
  next.setUTCMonth(next.getUTCMonth() + months);
  if (next.getUTCDate() !== originalDay) {
    next.setUTCDate(0);
  }
  return next;
}
