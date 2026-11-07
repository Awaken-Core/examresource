import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { env } from '../../core/config/env.js';
import {
  PaymentOrder,
  type PaymentOrderDocument,
  TestSeriesPass,
  type TestSeriesPassDocument,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import { addCalendarMonths, paymentSignature, signaturesMatch, webhookSignature } from './payment.signature.js';
import { TestSeriesAccessService } from './test-series-access.service.js';

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

export interface PassPlan {
  id: 'series' | 'all';
  name: string;
  price: number;
  amountPaise: number;
  listPricePaise: number;
  validityMonths: number;
  description: string;
  currency: string;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentOrder.name)
    private readonly orderModel: Model<PaymentOrderDocument>,
    @InjectModel(TestSeriesPass.name)
    private readonly passModel: Model<TestSeriesPassDocument>,
    private readonly access: TestSeriesAccessService,
  ) {}

  plans(): PassPlan[] {
    return [
      {
        id: 'series',
        name: 'Single Series Plan',
        price: 99,
        amountPaise: 9900,
        listPricePaise: 29900,
        validityMonths: 6,
        description: 'Complete 6-month access to this specific test series (Mock tests, subject tests, chapter tests & PYQs)',
        currency: 'INR',
      },
      {
        id: 'all',
        name: 'Yearly All-Access Pass',
        price: 399,
        amountPaise: 39900,
        listPricePaise: 99900,
        validityMonths: 12,
        description: 'Unlimited access to all test series across all exams on the platform for 1 full year',
        currency: 'INR',
      },
    ];
  }

  offer() {
    return {
      plans: this.plans(),
      amountPaise: 9900,
      listPricePaise: 29900,
      validityMonths: 6,
      currency: 'INR',
    };
  }

  async passStatus(user: CurrentUser) {
    const pass = await this.access.activePass(user.id);
    return {
      ...this.offer(),
      active: Boolean(pass),
      passType: pass ? ((pass as any).planType || 'series') : null,
      expiresAt: pass?.expiresAt ? new Date(pass.expiresAt).toISOString() : null,
    };
  }

  async seriesAccess(user: CurrentUser, seriesId: string) {
    const access = await this.access.seriesAccess(user.id, seriesId);
    return { ...this.offer(), ...access };
  }

  async createOrder(user: CurrentUser, input?: { planType?: 'series' | 'all'; seriesId?: string }) {
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException('Payments are not configured.');
    }

    const planType = input?.planType === 'all' ? 'all' : 'series';
    const seriesId = input?.seriesId && Types.ObjectId.isValid(input.seriesId) ? input.seriesId : null;

    const amount = planType === 'all' ? 39900 : 9900;
    const validityMonths = planType === 'all' ? 12 : 6;

    if (!Number.isInteger(amount) || amount < 100) {
      throw new BadRequestException('Pass amount must be at least 100 paise.');
    }

    const receipt = `ts_${user.id.slice(-8)}_${Date.now().toString(36)}`.slice(0, 40);
    const order = await this.requestRazorpayOrder(keyId, keySecret, amount, receipt);
    await this.orderModel.create({
      userId: new Types.ObjectId(user.id),
      purpose: 'test_series_pass',
      planType,
      testSeriesId: seriesId ? new Types.ObjectId(seriesId) : null,
      amountPaise: amount,
      currency: 'INR',
      razorpayOrderId: order.id,
      receipt,
      status: 'created',
    });

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      planType,
      seriesId,
      validityMonths,
      keyId,
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone || undefined,
      },
    };
  }

  async verifyPayment(
    user: CurrentUser,
    input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  ) {
    const secret = env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('Payments are not configured.');
    }
    const order = await this.orderModel.findOne({
      razorpayOrderId: input.razorpay_order_id,
      userId: new Types.ObjectId(user.id),
    });
    if (!order) {
      throw new BadRequestException('Payment order was not found.');
    }
    const expected = paymentSignature(input.razorpay_order_id, input.razorpay_payment_id, secret);
    if (!signaturesMatch(expected, input.razorpay_signature)) {
      throw new BadRequestException('Payment signature did not match.');
    }
    return this.grantCapturedPayment(input.razorpay_order_id, input.razorpay_payment_id);
  }

  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('Payment webhooks are not configured.');
    }
    if (!rawBody || !signature) {
      throw new BadRequestException('Webhook signature is missing.');
    }
    const expected = webhookSignature(rawBody, secret);
    if (!signaturesMatch(expected, signature)) {
      throw new BadRequestException('Webhook signature did not match.');
    }

    let body: any;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Webhook body is not valid JSON.');
    }

    const payment = body?.payload?.payment?.entity;
    const orderId = typeof payment?.order_id === 'string' ? payment.order_id : '';
    const paymentId = typeof payment?.id === 'string' ? payment.id : '';

    if (body?.event === 'payment.captured' && orderId && paymentId) {
      await this.grantCapturedPayment(orderId, paymentId);
    } else if (body?.event === 'payment.failed' && orderId) {
      await this.orderModel.updateOne(
        { razorpayOrderId: orderId, status: 'created' },
        { $set: { status: 'failed', razorpayPaymentId: paymentId || null } },
      );
    }
    return { received: true };
  }

  async grantCapturedPayment(orderId: string, paymentId: string) {
    const existing = await this.passModel.findOne({ razorpayPaymentId: paymentId }).lean();
    if (existing) return this.formatPass(existing);

    const order = await this.orderModel.findOne({ razorpayOrderId: orderId });
    if (!order) throw new NotFoundException('Payment order was not found.');

    const now = new Date();
    const planType = (order as any).planType || 'series';
    const testSeriesId = (order as any).testSeriesId || null;
    const validityMonths = planType === 'all' ? 12 : 6;

    const passFilter: any = {
      userId: order.userId,
      status: 'paid',
      expiresAt: { $gt: now },
    };
    if (planType === 'series' && testSeriesId) {
      passFilter.testSeriesId = testSeriesId;
    } else if (planType === 'all') {
      passFilter.planType = 'all';
    }

    const current = await this.passModel
      .findOne(passFilter)
      .sort({ expiresAt: -1 })
      .lean();
    const base = current?.expiresAt && new Date(current.expiresAt) > now ? new Date(current.expiresAt) : now;
    const expiresAt = addCalendarMonths(base, validityMonths);

    await this.orderModel.updateOne(
      { _id: order._id },
      { $set: { status: 'paid', razorpayPaymentId: paymentId } },
    );

    try {
      const created = await this.passModel.create({
        userId: order.userId,
        status: 'paid',
        planType,
        testSeriesId,
        startsAt: now,
        expiresAt,
        paymentOrderId: order._id,
        razorpayPaymentId: paymentId,
      });
      return this.formatPass(created.toObject());
    } catch (error: any) {
      if (error?.code === 11000) {
        const pass = await this.passModel.findOne({ razorpayPaymentId: paymentId }).lean();
        if (pass) return this.formatPass(pass);
      }
      throw error;
    }
  }

  private formatPass(pass: { expiresAt: Date; startsAt?: Date; razorpayPaymentId: string; planType?: string }) {
    return {
      active: new Date(pass.expiresAt).getTime() > Date.now(),
      planType: pass.planType || 'series',
      startsAt: pass.startsAt ? new Date(pass.startsAt).toISOString() : null,
      expiresAt: new Date(pass.expiresAt).toISOString(),
      razorpayPaymentId: pass.razorpayPaymentId,
    };
  }

  private async requestRazorpayOrder(
    keyId: string,
    keySecret: string,
    amount: number,
    receipt: string,
  ): Promise<RazorpayOrder> {
    let response: Response;
    try {
      response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, currency: 'INR', receipt }),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new InternalServerErrorException('Unable to reach Razorpay.');
    }

    if (response.status === 401) {
      throw new UnauthorizedException('Razorpay rejected the API credentials.');
    }
    if (!response.ok) {
      throw new InternalServerErrorException('Razorpay could not create the order.');
    }

    const body = (await response.json()) as Partial<RazorpayOrder>;
    if (!body.id || body.amount == null || !body.currency) {
      throw new InternalServerErrorException('Razorpay returned an incomplete order.');
    }
    return { id: body.id, amount: body.amount, currency: body.currency };
  }
}
