import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Exam,
  type ExamDocument,
  TestAttempt,
  type TestAttemptDocument,
  TestSeriesPass,
  type TestSeriesPassDocument,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';

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
  ) {}

  async activePass(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return null;
    const pass = await this.passModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: 'paid',
        expiresAt: { $gt: new Date() },
      })
      .sort({ expiresAt: -1 })
      .lean();
    if (!pass?.expiresAt || new Date(pass.expiresAt).getTime() <= Date.now()) return null;
    return pass;
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
    const freeTestId = await this.freeTestIdForSeries(user.id, seriesId);
    if (!freeTestId || freeTestId === testId) return;

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
