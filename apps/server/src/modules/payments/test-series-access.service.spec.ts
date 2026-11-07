import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { TestSeriesAccessService } from './test-series-access.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

const student: CurrentUser = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Student',
  email: 'student@example.com',
  phone: null,
  role: 'student',
  emailVerified: true,
};

const seriesId = '65f1a2b3c4d5e6f7a8b9c0d3';
const firstTestId = '65f1a2b3c4d5e6f7a8b9c0d4';
const secondTestId = '65f1a2b3c4d5e6f7a8b9c0d5';

function query<T>(value: T) {
  const chain: any = {
    select: vi.fn(() => chain),
    sort: vi.fn(() => chain),
    lean: vi.fn().mockResolvedValue(value),
  };
  return chain;
}

function makeService(options?: {
  pass?: any;
  freeTestId?: string | null;
  paidOrder?: any;
}) {
  const exams: any = {
    find: vi.fn(() =>
      query([
        { _id: new Types.ObjectId(firstTestId), testMode: 'full', isPreviousYear: false },
        { _id: new Types.ObjectId(secondTestId), testMode: 'full', isPreviousYear: false },
      ]),
    ),
    findOne: vi.fn(() => query({ _id: new Types.ObjectId(firstTestId) })),
  };
  const attempts: any = {
    findOne: vi.fn((filter?: any) => {
      if (filter?.testId?.$in) {
        return query(options?.freeTestId ? { testId: new Types.ObjectId(options.freeTestId) } : null);
      }
      if (filter?.testId && options?.freeTestId && filter.testId.toString() === options.freeTestId) {
        return query({ _id: new Types.ObjectId() });
      }
      return query(null);
    }),
  };
  const passes: any = {
    findOne: vi.fn(() => query(options?.pass ?? null)),
    findOneAndUpdate: vi.fn(() => ({
      lean: vi.fn().mockResolvedValue(options?.pass ?? null),
    })),
  };
  const orders: any = options?.paidOrder
    ? {
        findOne: vi.fn(() => query(options.paidOrder)),
      }
    : undefined;
  return {
    service: new TestSeriesAccessService(exams, attempts, passes, orders),
    passes,
    orders,
  };
}

describe('Test series pass access', () => {
  it('lets an editor or admin start any test', async () => {
    const editor = makeService();
    await expect(
      editor.service.assertCanStart(
        { _id: secondTestId, type: 'exam', testSeriesId: seriesId, testMode: 'full' },
        { ...student, role: 'editor' },
      ),
    ).resolves.toBeUndefined();
    expect(editor.passes.findOne).not.toHaveBeenCalled();

    const admin = makeService();
    await expect(
      admin.service.assertCanStart(
        { _id: secondTestId, type: 'exam', testSeriesId: seriesId, testMode: 'full' },
        { ...student, role: 'admin' },
      ),
    ).resolves.toBeUndefined();
    expect(admin.passes.findOne).not.toHaveBeenCalled();
  });

  it('does not gate quizzes or papers outside a series', async () => {
    const { service, passes } = makeService();
    await service.assertCanStart({ _id: secondTestId, type: 'quiz', testSeriesId: seriesId }, student);
    await service.assertCanStart(
      { _id: secondTestId, type: 'current_affairs_quiz', testSeriesId: seriesId },
      student,
    );
    await service.assertCanStart({ _id: secondTestId, type: 'exam' }, student);
    expect(passes.findOne).not.toHaveBeenCalled();
  });

  it('allows the first free test attempt in the full mock section of a series', async () => {
    await expect(
      makeService().service.assertCanStart(
        { _id: firstTestId, type: 'exam', testSeriesId: seriesId, testMode: 'full' },
        student,
      ),
    ).resolves.toBeUndefined();
  });

  it('blocks non-full sections (subject/chapter/pyq) without an active pass', async () => {
    await expect(
      makeService().service.assertCanStart(
        { _id: firstTestId, type: 'exam', testSeriesId: seriesId, testMode: 'subject' },
        student,
      ),
    ).rejects.toMatchObject({ status: 402 });
  });

  it('blocks 2nd test or attempt in full section without an active pass', async () => {
    await expect(
      makeService({ freeTestId: firstTestId }).service.assertCanStart(
        { _id: secondTestId, type: 'exam', testSeriesId: seriesId, testMode: 'full' },
        student,
      ),
    ).rejects.toMatchObject({ status: 402 });
  });

  it('allows attempting tests when a pass is active', async () => {
    await expect(
      makeService({
        freeTestId: firstTestId,
        pass: { expiresAt: new Date(Date.now() + 86_400_000), planType: 'all' },
      }).service.assertCanStart(
        { _id: secondTestId, type: 'exam', testSeriesId: seriesId, testMode: 'full' },
        student,
      ),
    ).resolves.toBeUndefined();
  });

  it('reports section trial status accurately', async () => {
    const { service } = makeService({ freeTestId: firstTestId });
    const status = await service.sectionTrialStatus(student.id, seriesId);
    expect(status.full.used).toBe(true);
    expect(status.full.testId).toBe(firstTestId);
    expect(status.subject.used).toBe(false);
    expect(status.chapter.used).toBe(false);
  });
});
