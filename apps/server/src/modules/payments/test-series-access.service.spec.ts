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

function makeService(options?: { pass?: any; freeTestId?: string | null }) {
  const exams: any = {
    find: vi.fn(() =>
      query([
        { _id: new Types.ObjectId(firstTestId) },
        { _id: new Types.ObjectId(secondTestId) },
      ]),
    ),
  };
  const attempts: any = {
    findOne: vi.fn(() =>
      query(options?.freeTestId ? { testId: new Types.ObjectId(options.freeTestId) } : null),
    ),
  };
  const passes: any = {
    findOne: vi.fn(() => query(options?.pass ?? null)),
  };
  return {
    service: new TestSeriesAccessService(exams, attempts, passes),
    passes,
  };
}

describe('Test series pass access', () => {
  it('lets an editor or admin start any test', async () => {
    const editor = makeService();
    await expect(
      editor.service.assertCanStart(
        { _id: secondTestId, type: 'exam', testSeriesId: seriesId },
        { ...student, role: 'editor' },
      ),
    ).resolves.toBeUndefined();
    expect(editor.passes.findOne).not.toHaveBeenCalled();

    const admin = makeService();
    await expect(
      admin.service.assertCanStart(
        { _id: secondTestId, type: 'exam', testSeriesId: seriesId },
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

  it('allows the first test in a series and later attempts of that same test', async () => {
    await expect(
      makeService().service.assertCanStart(
        { _id: firstTestId, type: 'exam', testSeriesId: seriesId },
        student,
      ),
    ).resolves.toBeUndefined();

    await expect(
      makeService({ freeTestId: firstTestId }).service.assertCanStart(
        { _id: firstTestId, type: 'exam', testSeriesId: seriesId },
        student,
      ),
    ).resolves.toBeUndefined();
  });

  it('blocks a different test until a pass is active', async () => {
    await expect(
      makeService({ freeTestId: firstTestId }).service.assertCanStart(
        { _id: secondTestId, type: 'exam', testSeriesId: seriesId },
        student,
      ),
    ).rejects.toMatchObject({ status: 402 });

    await expect(
      makeService({
        freeTestId: firstTestId,
        pass: { expiresAt: new Date(Date.now() + 86_400_000) },
      }).service.assertCanStart({ _id: secondTestId, type: 'full', testSeriesId: seriesId }, student),
    ).resolves.toBeUndefined();
  });

  it('blocks a different test when the pass has expired', async () => {
    await expect(
      makeService({
        freeTestId: firstTestId,
        pass: { expiresAt: new Date(Date.now() - 86_400_000) },
      }).service.assertCanStart(
        { _id: secondTestId, type: 'exam', testSeriesId: seriesId },
        student,
      ),
    ).rejects.toMatchObject({ status: 402 });
  });
});
