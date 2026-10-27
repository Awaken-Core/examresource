import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { env } from '../../core/config/env.js';
import { addCalendarMonths } from './payment.signature.js';
import { PaymentService } from './payment.service.js';

const student = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Student',
  email: 'student@example.com',
  phone: null,
  role: 'student' as const,
  emailVerified: true,
};

describe('PaymentService pass grant', () => {
  it('grants a pass once when verify and the webhook both arrive', async () => {
    const userId = new Types.ObjectId();
    const orderId = new Types.ObjectId();
    const created = {
      _id: orderId,
      userId,
      expiresAt: new Date('2027-04-27T00:00:00.000Z'),
      startsAt: new Date('2026-10-27T00:00:00.000Z'),
      razorpayPaymentId: 'pay_1',
    };
    const passes: any = {
      findOne: vi
        .fn()
        .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) })
        .mockReturnValueOnce({
          sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
        })
        .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(created) }),
      create: vi.fn().mockResolvedValue({ toObject: () => created }),
    };
    const orders: any = {
      findOne: vi.fn().mockResolvedValue({ _id: orderId, userId }),
      updateOne: vi.fn().mockResolvedValue({ matchedCount: 1 }),
    };
    const service = new PaymentService(orders, passes, {} as any);

    const first = await service.grantCapturedPayment('order_1', 'pay_1');
    const second = await service.grantCapturedPayment('order_1', 'pay_1');

    expect(first.razorpayPaymentId).toBe('pay_1');
    expect(second.razorpayPaymentId).toBe('pay_1');
    expect(passes.create).toHaveBeenCalledTimes(1);
    expect(orders.updateOne).toHaveBeenCalledTimes(1);
  });

  it('extends an active pass from its current expiry', async () => {
    const userId = new Types.ObjectId();
    const orderId = new Types.ObjectId();
    const currentExpiry = new Date('2027-01-15T00:00:00.000Z');
    const passes: any = {
      findOne: vi
        .fn()
        .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) })
        .mockReturnValueOnce({
          sort: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue({ expiresAt: currentExpiry }),
          }),
        }),
      create: vi.fn().mockImplementation(async (doc) => ({ toObject: () => doc })),
    };
    const orders: any = {
      findOne: vi.fn().mockResolvedValue({ _id: orderId, userId }),
      updateOne: vi.fn().mockResolvedValue({ matchedCount: 1 }),
    };
    const service = new PaymentService(orders, passes, {} as any);

    await service.grantCapturedPayment('order_2', 'pay_2');

    expect(passes.create.mock.calls[0][0].expiresAt.toISOString()).toBe(
      addCalendarMonths(currentExpiry, env.RAZORPAY_PASS_VALIDITY_MONTHS).toISOString(),
    );
  });

  it('asks Razorpay for the server pass amount, not the list price', async () => {
    expect(env.RAZORPAY_PASS_AMOUNT_PAISE).toBe(6900);
    expect(env.RAZORPAY_PASS_LIST_PRICE_PAISE).toBe(19900);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'order_test', amount: 6900, currency: 'INR' }),
    });
    const previousFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as typeof fetch;
    const orders: any = { create: vi.fn().mockResolvedValue({}) };
    const service = new PaymentService(orders, {} as any, {} as any);

    try {
      const created = await service.createOrder(student);
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.amount).toBe(6900);
      expect(body.currency).toBe('INR');
      expect(created.amount).toBe(6900);
      expect(orders.create.mock.calls[0][0].amountPaise).toBe(6900);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
