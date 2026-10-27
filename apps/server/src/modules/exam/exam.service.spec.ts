import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { HttpException } from '@nestjs/common';
import { ExamService } from './exam.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

const student: CurrentUser = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Student',
  email: 'student@example.com',
  phone: null,
  role: 'student',
  emailVerified: true,
};

describe('ExamService timing, publication and duration rules', () => {
  function makeService() {
    const exams: any = { findOne: vi.fn(), findById: vi.fn() };
    const questions: any = { countDocuments: vi.fn() };
    const attempts: any = {
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      updateOne: vi.fn(),
    };
    const users: any = { findById: vi.fn() };
    const testSeries: any = { findById: vi.fn() };
    return {
      service: new ExamService(exams, questions, attempts, users, testSeries),
      exams,
      questions,
      attempts,
      users,
      testSeries,
    };
  }

  it('does not start an attempt for a draft exam', async () => {
    const { service, exams } = makeService();
    exams.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    await expect(
      service.startAttempt('65f1a2b3c4d5e6f7a8b9c0d2', student),
    ).rejects.toThrow('Exam was not found.');
    expect(exams.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
    );
  });

  it('stops a new attempt when the series pass is required', async () => {
    const seriesAccess = {
      assertCanStart: vi.fn().mockRejectedValue(
        new HttpException(
          {
            statusCode: 402,
            code: 'TEST_SERIES_PASS_REQUIRED',
            message: 'A test series pass is required to start this test.',
          },
          402,
        ),
      ),
    };
    const exams: any = { findOne: vi.fn(), findById: vi.fn() };
    const attempts: any = {
      findOne: vi.fn(),
      countDocuments: vi.fn(),
      create: vi.fn(),
    };
    const service = new ExamService(
      exams,
      { countDocuments: vi.fn() } as any,
      attempts,
      { findById: vi.fn() } as any,
      { findById: vi.fn() } as any,
      undefined,
      seriesAccess as any,
    );
    exams.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: '65f1a2b3c4d5e6f7a8b9c0d2',
        status: 'published',
        type: 'exam',
        testSeriesId: '65f1a2b3c4d5e6f7a8b9c0d3',
      }),
    });
    attempts.countDocuments.mockResolvedValue(0);
    attempts.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    await expect(service.startAttempt('65f1a2b3c4d5e6f7a8b9c0d2', student)).rejects.toMatchObject({
      status: 402,
    });
    expect(attempts.create).not.toHaveBeenCalled();
  });

  it('resumes an in-progress attempt without asking for a pass', async () => {
    const seriesAccess = { assertCanStart: vi.fn() };
    const exams: any = { findOne: vi.fn() };
    const attempts: any = { findOne: vi.fn(), countDocuments: vi.fn(), create: vi.fn() };
    const service = new ExamService(
      exams,
      {} as any,
      attempts,
      {} as any,
      {} as any,
      undefined,
      seriesAccess as any,
    );
    const attemptId = new Types.ObjectId();
    exams.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: '65f1a2b3c4d5e6f7a8b9c0d2',
        status: 'published',
        type: 'exam',
        testSeriesId: '65f1a2b3c4d5e6f7a8b9c0d3',
      }),
    });
    attempts.countDocuments.mockResolvedValue(1);
    attempts.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: attemptId,
        status: 'in_progress',
        testId: '65f1a2b3c4d5e6f7a8b9c0d2',
        userId: student.id,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    });

    const resumed = await service.startAttempt('65f1a2b3c4d5e6f7a8b9c0d2', student);
    expect(resumed.status).toBe('in_progress');
    expect(seriesAccess.assertCanStart).not.toHaveBeenCalled();
    expect(attempts.create).not.toHaveBeenCalled();
  });

  it('requires published questions when publishing an exam', async () => {
    const { service, questions } = makeService();
    questions.countDocuments.mockResolvedValue(0);

    await expect(
      (service as any).validateQuestionIds(['65f1a2b3c4d5e6f7a8b9c0d2'], true),
    ).rejects.toThrow('questions do not exist');
    expect(questions.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
    );
  });

  it('expires an over-time attempt before it can be changed and marks as submitted', async () => {
    const { service, attempts } = makeService();
    const attemptId = new Types.ObjectId().toString();
    attempts.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(attemptId),
        status: 'in_progress',
        startedAt: new Date(Date.now() - 3600000),
        expiresAt: new Date(Date.now() - 1000),
        answers: [],
      }),
    });

    await expect(
      (service as any).requireActiveAttempt(attemptId, student),
    ).rejects.toThrow('has expired');
    expect(attempts.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    const [calledId, update] = attempts.findByIdAndUpdate.mock.calls[0];
    expect(calledId.toString()).toBe(attemptId);
    expect(update.$set.status).toBe('submitted');
  });

  it('persists accurate question timing, visitedAt and lastViewedAt on answer save', async () => {
    const { service, attempts } = makeService();
    const attemptId = new Types.ObjectId().toString();
    const questionId = new Types.ObjectId().toString();
    const optionId = new Types.ObjectId().toString();

    const mockAttempt = {
      _id: new Types.ObjectId(attemptId),
      status: 'in_progress',
      expiresAt: new Date(Date.now() + 3600000),
      answers: [
        {
          questionId: new Types.ObjectId(questionId),
          status: 'not_visited',
          timeSpentSeconds: 15,
          visitedAt: null,
        },
      ],
    };

    attempts.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockAttempt),
    });

    attempts.updateOne.mockResolvedValue({ modifiedCount: 1 });

    // Mock getAttempt return
    vi.spyOn(service, 'getAttempt').mockResolvedValue(mockAttempt as any);

    await service.saveAnswer(
      attemptId,
      questionId,
      {
        optionIds: [optionId],
        timeSpentSeconds: 45,
      },
      student,
    );

    expect(attempts.updateOne).toHaveBeenCalledWith(
      {
        _id: new Types.ObjectId(attemptId),
        'answers.questionId': new Types.ObjectId(questionId),
      },
      {
        $set: expect.objectContaining({
          'answers.$.status': 'answered',
          'answers.$.timeSpentSeconds': 45,
          'answers.$.lastViewedAt': expect.any(Date),
        }),
      },
    );
  });

  it('persists section progress timing and completion state accurately', async () => {
    const { service, attempts } = makeService();
    const attemptId = new Types.ObjectId().toString();

    const mockAttempt = {
      _id: new Types.ObjectId(attemptId),
      status: 'in_progress',
      expiresAt: new Date(Date.now() + 3600000),
      sectionProgress: [
        {
          sectionId: 'sec-reasoning',
          name: 'General Reasoning',
          timeSpentSeconds: 120,
          isCompleted: false,
        },
      ],
    };

    attempts.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockAttempt),
    });

    attempts.updateOne.mockResolvedValue({ modifiedCount: 1 });
    vi.spyOn(service, 'getAttempt').mockResolvedValue(mockAttempt as any);

    await service.updateSectionProgress(
      attemptId,
      {
        sectionId: 'sec-reasoning',
        timeSpentSeconds: 300,
        isCompleted: true,
      },
      student,
    );

    expect(attempts.updateOne).toHaveBeenCalledWith(
      {
        _id: new Types.ObjectId(attemptId),
        'sectionProgress.sectionId': 'sec-reasoning',
      },
      {
        $set: {
          'sectionProgress.$.timeSpentSeconds': 300,
          'sectionProgress.$.isCompleted': true,
        },
      },
    );
  });
});
