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

export type TestSeriesSectionKey = 'full' | 'subject' | 'chapter' | 'pyq';

export function getExamSectionKey(exam: { testMode?: string; isPreviousYear?: boolean }): TestSeriesSectionKey {
  if (exam.testMode === 'pyq' || exam.isPreviousYear) return 'pyq';
  if (exam.testMode === 'subject') return 'subject';
  if (exam.testMode === 'chapter') return 'chapter';
  return 'full';
}

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

  async activePass(userId: string, seriesId?: string) {
    if (!Types.ObjectId.isValid(userId)) return null;
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();

    const query: any = {
      userId: userObjectId,
      status: 'paid',
      expiresAt: { $gt: now },
    };

    if (seriesId && Types.ObjectId.isValid(seriesId)) {
      query.$or = [
        { planType: 'all' },
        { testSeriesId: null },
        { testSeriesId: new Types.ObjectId(seriesId) },
        { planType: { $exists: false } },
      ];
    }

    const pass = await this.passModel
      .findOne(query)
      .sort({ expiresAt: -1 })
      .lean();

    if (pass?.expiresAt && new Date(pass.expiresAt).getTime() > Date.now()) {
      return pass;
    }

    // Auto-sync fallback: If an order was marked 'paid' in payment_orders
    if (this.orderModel) {
      const orderQuery: any = {
        userId: userObjectId,
        status: 'paid',
      };
      if (seriesId && Types.ObjectId.isValid(seriesId)) {
        orderQuery.$or = [
          { planType: 'all' },
          { testSeriesId: null },
          { testSeriesId: new Types.ObjectId(seriesId) },
          { planType: { $exists: false } },
        ];
      }

      const paidOrder = await this.orderModel
        .findOne(orderQuery)
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      if (paidOrder) {
        const orderDate = paidOrder.updatedAt || paidOrder.createdAt || new Date();
        const validityMonths = (paidOrder as any).planType === 'all' ? 12 : 6;
        const expiresAt = addCalendarMonths(new Date(orderDate), validityMonths);
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
                  planType: (paidOrder as any).planType || 'series',
                  testSeriesId: (paidOrder as any).testSeriesId || null,
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

  async sectionTrialStatus(userId: string, seriesId: string) {
    const defaultStatus = {
      full: { used: false, testId: null as string | null },
      subject: { used: false, testId: null as string | null },
      chapter: { used: false, testId: null as string | null },
      pyq: { used: false, testId: null as string | null },
    };

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(seriesId)) {
      return defaultStatus;
    }

    const seriesObjectId = new Types.ObjectId(seriesId);
    const userObjectId = new Types.ObjectId(userId);

    const exams = await this.examModel
      .find({ testSeriesId: seriesObjectId })
      .select('_id testMode isPreviousYear')
      .lean();

    if (exams.length === 0) return defaultStatus;

    const idsBySection: Record<TestSeriesSectionKey, Types.ObjectId[]> = {
      full: [],
      subject: [],
      chapter: [],
      pyq: [],
    };

    for (const ex of exams) {
      const key = getExamSectionKey(ex as any);
      idsBySection[key].push(ex._id as Types.ObjectId);
    }

    const [fullAtt, subjAtt, chapAtt, pyqAtt] = await Promise.all([
      idsBySection.full.length
        ? this.testAttemptModel.findOne({ userId: userObjectId, testId: { $in: idsBySection.full } }).select('testId').lean()
        : null,
      idsBySection.subject.length
        ? this.testAttemptModel.findOne({ userId: userObjectId, testId: { $in: idsBySection.subject } }).select('testId').lean()
        : null,
      idsBySection.chapter.length
        ? this.testAttemptModel.findOne({ userId: userObjectId, testId: { $in: idsBySection.chapter } }).select('testId').lean()
        : null,
      idsBySection.pyq.length
        ? this.testAttemptModel.findOne({ userId: userObjectId, testId: { $in: idsBySection.pyq } }).select('testId').lean()
        : null,
    ]);

    return {
      full: { used: Boolean(fullAtt), testId: fullAtt?.testId ? String(fullAtt.testId) : null },
      subject: { used: Boolean(subjAtt), testId: subjAtt?.testId ? String(subjAtt.testId) : null },
      chapter: { used: Boolean(chapAtt), testId: chapAtt?.testId ? String(chapAtt.testId) : null },
      pyq: { used: Boolean(pyqAtt), testId: pyqAtt?.testId ? String(pyqAtt.testId) : null },
    };
  }

  async assertCanStart(
    exam: { _id?: unknown; type?: string; testSeriesId?: unknown; testMode?: string; isPreviousYear?: boolean },
    user: CurrentUser,
  ) {
    if (user.role === 'admin' || user.role === 'editor') return;
    if (!exam.testSeriesId) return;
    if (exam.type && QUIZ_TYPES.has(exam.type)) return;

    const seriesId = exam.testSeriesId.toString();

    // 1. If user has active pass covering this series (or All-Access): allow start!
    const pass = await this.activePass(user.id, seriesId);
    if (pass) return;

    // 2. Otherwise check trial slot in this section
    const sectionKey = getExamSectionKey(exam);
    const trials = await this.sectionTrialStatus(user.id, seriesId);
    const secTrial = trials[sectionKey];

    // If 1st attempt in this section: allow start for free!
    if (!secTrial.used) {
      return;
    }

    // 1 free slot has already been used in this section
    throw new HttpException(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        code: 'TEST_SERIES_PASS_REQUIRED',
        message: 'Your 1 free trial attempt in this section has been used. Please purchase the Series Plan (₹69 for 6 months) or All-Access Pass (₹399 for 1 year) to continue.',
        section: sectionKey,
        usedTestId: secTrial.testId,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  async seriesAccess(userId: string, seriesId: string) {
    if (!Types.ObjectId.isValid(seriesId)) {
      throw new BadRequestException('Test series was not found.');
    }
    const pass = await this.activePass(userId, seriesId);
    const sectionTrials = await this.sectionTrialStatus(userId, seriesId);
    return {
      hasActivePass: Boolean(pass),
      passType: pass ? ((pass as any).planType || 'series') : null,
      expiresAt: pass?.expiresAt ? new Date(pass.expiresAt).toISOString() : null,
      sectionTrials,
      freeTestId: sectionTrials.full.testId || sectionTrials.subject.testId || null,
    };
  }
}
