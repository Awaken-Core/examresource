import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { LearnerAnalyticsService } from './learner-analytics.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

const student: CurrentUser = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Test Student',
  email: 'student@example.com',
  phone: null,
  role: 'student',
  emailVerified: true,
};

describe('LearnerAnalyticsService', () => {
  function makeService() {
    const testAttemptModel: any = {
      find: vi.fn(),
      findOne: vi.fn(),
      countDocuments: vi.fn(),
    };
    const examModel: any = {
      find: vi.fn(),
      findById: vi.fn(),
    };
    const testSeriesModel: any = {
      find: vi.fn(),
      findById: vi.fn(),
    };
    const subjectModel: any = {
      find: vi.fn(),
    };
    const chapterModel: any = {
      find: vi.fn(),
    };

    const service = new LearnerAnalyticsService(
      testAttemptModel,
      examModel,
      testSeriesModel,
      subjectModel,
      chapterModel,
    );

    return {
      service,
      testAttemptModel,
      examModel,
      testSeriesModel,
      subjectModel,
      chapterModel,
    };
  }

  it('computes learner preparation summary correctly', async () => {
    const { service, testAttemptModel, examModel, subjectModel } = makeService();

    const subjectId = new Types.ObjectId();
    const testId = new Types.ObjectId();

    const mockAttempts = [
      {
        _id: new Types.ObjectId(),
        testId,
        status: 'submitted',
        attemptNumber: 1,
        marksAwarded: 80,
        maximumMarks: 100,
        timeSpentSeconds: 1800,
        startedAt: new Date('2026-10-24T10:00:00Z'),
        endedAt: new Date('2026-10-24T10:30:00Z'),
        answers: [
          { subjectId, isCorrect: true, status: 'answered' },
          { subjectId, isCorrect: false, status: 'answered' },
        ],
      },
      {
        _id: new Types.ObjectId(),
        testId: new Types.ObjectId(),
        status: 'in_progress',
        attemptNumber: 1,
        timeSpentSeconds: 300,
        startedAt: new Date('2026-10-25T01:00:00Z'),
        expiresAt: new Date('2026-10-25T02:00:00Z'),
        answers: [],
      },
    ];

    testAttemptModel.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockAttempts),
        }),
      }),
    });

    examModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ title: 'DSSSB TGT Mock 01' }),
      }),
    });

    examModel.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: testId, title: 'DSSSB TGT Mock 01' }]),
      }),
    });

    subjectModel.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: subjectId, name: 'Computer Science' }]),
      }),
    });

    const summary = await service.getSummary(student);

    expect(summary.totalTests).toBe(2);
    expect(summary.completedTests).toBe(1);
    expect(summary.inProgressAttempt?.testTitle).toBe('DSSSB TGT Mock 01');
    expect(summary.averageScorePercent).toBe(80);
    expect(summary.averageAccuracy).toBe(50);
    expect(summary.totalStudySeconds).toBe(2100);
    expect(summary.recentScoreTrend).toHaveLength(1);
    expect(summary.recentScoreTrend[0].scorePercent).toBe(80);
    expect(summary.weakestSubjects).toHaveLength(1);
    expect(summary.weakestSubjects[0].name).toBe('Computer Science');
    expect(summary.weakestSubjects[0].accuracy).toBe(50);
  });

  it('rejects attempt analysis when attempt does not belong to user', async () => {
    const { service, testAttemptModel } = makeService();

    testAttemptModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.getAttemptAnalysis(student, new Types.ObjectId().toString()),
    ).rejects.toThrow('Exam attempt was not found.');
  });

  it('computes detailed attempt analysis with section and chapter metrics', async () => {
    const { service, testAttemptModel, examModel, chapterModel } = makeService();

    const attemptId = new Types.ObjectId();
    const testId = new Types.ObjectId();
    const chapterId = new Types.ObjectId();

    const mockAttempt = {
      _id: attemptId,
      testId,
      userId: new Types.ObjectId(student.id),
      attemptNumber: 1,
      status: 'submitted',
      marksAwarded: 15,
      maximumMarks: 20,
      timeSpentSeconds: 600,
      startedAt: new Date('2026-10-24T12:00:00Z'),
      endedAt: new Date('2026-10-24T12:10:00Z'),
      sectionProgress: [
        { sectionId: 'sec-1', name: 'General Ability', timeSpentSeconds: 300, isCompleted: true },
      ],
      answers: [
        {
          questionId: new Types.ObjectId(),
          sectionId: 'sec-1',
          chapterId,
          status: 'answered',
          isCorrect: true,
          marksAwarded: 10,
          maximumMarks: 10,
          timeSpentSeconds: 45,
          questionSnapshot: { content: 'What is binary?' },
        },
        {
          questionId: new Types.ObjectId(),
          sectionId: 'sec-1',
          chapterId,
          status: 'answered',
          isCorrect: false,
          marksAwarded: 0,
          maximumMarks: 10,
          timeSpentSeconds: 60,
          questionSnapshot: { content: 'Explain parity.' },
        },
      ],
    };

    testAttemptModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockAttempt),
    });

    examModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: testId,
        title: 'Full Mock Test',
        durationMinutes: 60,
      }),
    });

    chapterModel.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: chapterId, name: 'Digital Electronics' }]),
      }),
    });

    const analysis = await service.getAttemptAnalysis(student, attemptId.toString());

    expect(analysis.attemptId).toBe(attemptId.toString());
    expect(analysis.testTitle).toBe('Full Mock Test');
    expect(analysis.summary.totalQuestions).toBe(2);
    expect(analysis.summary.correctCount).toBe(1);
    expect(analysis.summary.wrongCount).toBe(1);
    expect(analysis.summary.accuracy).toBe(50);
    expect(analysis.summary.scorePercent).toBe(75);
    expect(analysis.sections).toHaveLength(1);
    expect(analysis.sections[0].name).toBe('General Ability');
    expect(analysis.needsRevisionChapters).toHaveLength(1);
    expect(analysis.needsRevisionChapters[0].name).toBe('Digital Electronics');
    expect(analysis.questionReview).toHaveLength(2);
    expect(analysis.questionReview[0].snippet).toBe('What is binary?');
  });
});
