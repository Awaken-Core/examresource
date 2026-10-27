import { describe, expect, it } from 'vitest';
import { addCalendarMonths, paymentSignature, signaturesMatch, webhookSignature } from './payment.signature.js';

describe('Razorpay signature checks', () => {
  it('accepts a known payment signature and rejects a tampered one', () => {
    const secret = 'test_secret';
    const signature = paymentSignature('order_1', 'pay_1', secret);
    expect(signaturesMatch(signature, signature)).toBe(true);
    expect(signaturesMatch(signature, paymentSignature('order_1', 'pay_2', secret))).toBe(false);
    expect(signaturesMatch(signature, 'short')).toBe(false);
  });

  it('rejects a tampered webhook body', () => {
    const secret = 'whsec_test';
    const body = Buffer.from('{"event":"payment.captured"}');
    const signature = webhookSignature(body, secret);
    expect(signaturesMatch(signature, signature)).toBe(true);
    expect(signaturesMatch(signature, webhookSignature(Buffer.from('{"event":"payment.failed"}'), secret))).toBe(
      false,
    );
  });

  it('adds six calendar months', () => {
    const start = new Date('2026-10-27T00:00:00.000Z');
    expect(addCalendarMonths(start, 6).toISOString()).toBe('2027-04-27T00:00:00.000Z');
  });
});
