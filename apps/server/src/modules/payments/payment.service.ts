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

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentOrder.name)
    private readonly orderModel: Model<PaymentOrderDocument>,
    @InjectModel(TestSeriesPass.name)
    private readonly passModel: Model<TestSeriesPassDocument>,
    private readonly access: TestSeriesAccessService,
  ) {}

  offer() {
    return {
      amountPaise: env.RAZORPAY_PASS_AMOUNT_PAISE,
      listPricePaise: env.RAZORPAY_PASS_LIST_PRICE_PAISE,
      validityMonths: env.RAZORPAY_PASS_VALIDITY_MONTHS,
      currency: 'INR',
    };
  }

  async passStatus(user: CurrentUser) {
    const pass = await this.access.activePass(user.id);
    return {
      ...this.offer(),
      active: Boolean(pass),
      expiresAt: pass?.expiresAt ? new Date(pass.expiresAt).toISOString() : null,
    };
  }

  async seriesAccess(user: CurrentUser, seriesId: string) {
    const access = await this.access.seriesAccess(user.id, seriesId);
    return { ...this.offer(), ...access };
  }

  async createOrder(user: CurrentUser) {
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException('Payments are not configured.');
    }
    const amount = env.RAZORPAY_PASS_AMOUNT_PAISE;
    if (!Number.isInteger(amount) || amount < 100) {
      throw new BadRequestException('Pass amount must be at least 100 paise.');
    }

    const receipt = `ts_${user.id.slice(-8)}_${Date.now().toString(36)}`.slice(0, 40);
    const order = await this.requestRazorpayOrder(keyId, keySecret, amount, receipt);
    await this.orderModel.create({
      userId: new Types.ObjectId(user.id),
      purpose: 'test_series_pass',
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
      keyId,
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
    const current = await this.passModel
      .findOne({
        userId: order.userId,
        status: 'paid',
        expiresAt: { $gt: now },
      })
      .sort({ expiresAt: -1 })
      .lean();
    const base = current?.expiresAt && new Date(current.expiresAt) > now ? new Date(current.expiresAt) : now;
    const expiresAt = addCalendarMonths(base, env.RAZORPAY_PASS_VALIDITY_MONTHS);

    await this.orderModel.updateOne(
      { _id: order._id },
      { $set: { status: 'paid', razorpayPaymentId: paymentId } },
    );

    try {
      const created = await this.passModel.create({
        userId: order.userId,
        status: 'paid',
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

  private formatPass(pass: { expiresAt: Date; startsAt?: Date; razorpayPaymentId: string }) {
    return {
      active: new Date(pass.expiresAt).getTime() > Date.now(),
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
