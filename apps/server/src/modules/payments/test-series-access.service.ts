import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { env } from '../../core/config/env.js';
import {
  Exam,
  type ExamDocument,
  PaymentOrder,
  type PaymentOrderDocument,
  TestAttempt,
  type TestAttemptDocument,
  TestSeriesPass,
  type TestSeriesPassDocument,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import { addCalendarMonths } from './payment.signature.js';

const QUIZ_TYPES = new Set(['quiz', 'current_affairs_quiz']);

@Injectable()
export class TestSeriesAccessService {
  constructor(
    @InjectModel(Exam.name)
    private readonly examModel: Model<ExamDocument>,
    @InjectModel(TestAttempt.name)
    private readonly testAttemptModel: Model<TestAttemptDocument>,
    @InjectModel(TestSeriesPass.name)
    private readonly passModel: Model<TestSeriesPassDocument>,
    @Optional()
    @InjectModel(PaymentOrder.name)
    private readonly orderModel?: Model<PaymentOrderDocument>,
  ) {}

  async activePass(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return null;
    const userObjectId = new Types.ObjectId(userId);
    const pass = await this.passModel
      .findOne({
        userId: userObjectId,
        status: 'paid',
        expiresAt: { $gt: new Date() },
      })
      .sort({ expiresAt: -1 })
      .lean();
    if (pass?.expiresAt && new Date(pass.expiresAt).getTime() > Date.now()) {
      return pass;
    }

    // Auto-sync fallback: If an order was marked 'paid' in payment_orders
    // (e.g. manually in Compass or through reconciliations) but missing in test_series_passes
    if (this.orderModel) {
      const paidOrder = await this.orderModel
        .findOne({
          userId: userObjectId,
          status: 'paid',
        })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      if (paidOrder) {
        const orderDate = paidOrder.updatedAt || paidOrder.createdAt || new Date();
        const expiresAt = addCalendarMonths(new Date(orderDate), env.RAZORPAY_PASS_VALIDITY_MONTHS);
        if (expiresAt.getTime() > Date.now()) {
          const paymentId =
            paidOrder.razorpayPaymentId || `manual_${paidOrder._id.toString()}`;
          try {
            const created = await this.passModel.findOneAndUpdate(
              { paymentOrderId: paidOrder._id },
              {
                $setOnInsert: {
                  userId: paidOrder.userId,
                  status: 'paid',
                  startsAt: new Date(orderDate),
                  expiresAt,
                  paymentOrderId: paidOrder._id,
                  razorpayPaymentId: paymentId,
                },
              },
              { upsert: true, returnDocument: 'after' },
            ).lean();
            if (created) return created;
          } catch {
            const existing = await this.passModel.findOne({ paymentOrderId: paidOrder._id }).lean();
            if (existing) return existing;
          }
        }
      }
    }

    return null;
  }

  async freeTestIdForSeries(userId: string, seriesId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(seriesId)) {
      return null;
    }
    const exams = await this.examModel
      .find({ testSeriesId: new Types.ObjectId(seriesId) })
      .select('_id')
      .lean();
    if (exams.length === 0) return null;
    const first = await this.testAttemptModel
      .findOne({
        userId: new Types.ObjectId(userId),
        testId: { $in: exams.map((exam) => exam._id) },
      })
      .sort({ startedAt: 1, _id: 1 })
      .select('testId')
      .lean();
    return first?.testId ? first.testId.toString() : null;
  }

  async assertCanStart(exam: { _id?: unknown; type?: string; testSeriesId?: unknown }, user: CurrentUser) {
    if (user.role === 'admin' || user.role === 'editor') return;
    if (!exam.testSeriesId) return;
    if (exam.type && QUIZ_TYPES.has(exam.type)) return;

    const pass = await this.activePass(user.id);
    if (pass) return;

    const seriesId = exam.testSeriesId.toString();
    const testId = exam._id ? String(exam._id) : '';

    // Check if the user has already attempted this test before (prevent reattempting for free)
    if (Types.ObjectId.isValid(user.id) && Types.ObjectId.isValid(testId)) {
      const existingAttempt = await this.testAttemptModel
        .findOne({
          userId: new Types.ObjectId(user.id),
          testId: new Types.ObjectId(testId),
        })
        .select('_id')
        .lean();

      if (existingAttempt) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            code: 'TEST_SERIES_PASS_REQUIRED',
            message: 'A test series pass is required to reattempt this test.',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    const freeTestId = await this.freeTestIdForSeries(user.id, seriesId);
    if (!freeTestId) return;

    throw new HttpException(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        code: 'TEST_SERIES_PASS_REQUIRED',
        message: 'A test series pass is required to start this test.',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  async seriesAccess(userId: string, seriesId: string) {
    if (!Types.ObjectId.isValid(seriesId)) {
      throw new BadRequestException('Test series was not found.');
    }
    const pass = await this.activePass(userId);
    const freeTestId = await this.freeTestIdForSeries(userId, seriesId);
    return {
      hasActivePass: Boolean(pass),
      expiresAt: pass?.expiresAt ? new Date(pass.expiresAt).toISOString() : null,
      freeTestId,
    };
  }
}
