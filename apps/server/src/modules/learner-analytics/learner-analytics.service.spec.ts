import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { LearnerAnalyticsService } from './learner-analytics.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

const studentA: CurrentUser = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Student Alpha',
  email: 'alpha@example.com',
  phone: null,
  role: 'student',
  emailVerified: true,
};

const studentB: CurrentUser = {
  id: '65f1a2b3c4d5e6f7a8b9c0d9',
  name: 'Student Beta',
  email: 'beta@example.com',
  phone: null,
  role: 'student',
  emailVerified: true,
};

describe('LearnerAnalyticsService — Metrics & Access Controls', () => {
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

  describe('Access Controls & Data Isolation', () => {
    it('strictly isolates summary queries to the requesting student ID', async () => {
      const { service, testAttemptModel } = makeService();

      testAttemptModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await service.getSummary(studentA);

      expect(testAttemptModel.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId(studentA.id),
      });
    });

    it('strictly isolates attempt listings to the requesting student ID', async () => {
      const { service, testAttemptModel } = makeService();

      testAttemptModel.countDocuments.mockResolvedValue(0);
      testAttemptModel.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await service.getAttempts(studentA, { limit: 20 });

      expect(testAttemptModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: new Types.ObjectId(studentA.id),
        }),
      );
    });

    it('rejects attempt analysis if student does not own the attempt', async () => {
      const { service, testAttemptModel } = makeService();
      const foreignAttemptId = new Types.ObjectId().toString();

      // Attempt belongs to Student A; Student B tries to access it
      testAttemptModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.getAttemptAnalysis(studentB, foreignAttemptId),
      ).rejects.toThrow('Exam attempt was not found.');

      expect(testAttemptModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(foreignAttemptId),
        userId: new Types.ObjectId(studentB.id),
      });
    });
  });

  describe('Aggregation & Performance Metrics', () => {
    it('computes learner summary with active attempt and subject weaknesses', async () => {
      const { service, testAttemptModel, examModel, subjectModel } = makeService();

      const subjectId = new Types.ObjectId();
      const testId = new Types.ObjectId();

      const mockAttempts = [
        {
          _id: new Types.ObjectId(),
          testId,
          status: 'submitted',
          attemptNumber: 1,
          marksAwarded: 75,
          maximumMarks: 100,
          timeSpentSeconds: 1200,
          startedAt: new Date('2026-10-24T10:00:00Z'),
          endedAt: new Date('2026-10-24T10:20:00Z'),
          answers: [
            { subjectId, isCorrect: true, status: 'answered' },
            { subjectId, isCorrect: false, status: 'answered' },
          ],
        },
        {
          _id: new Types.ObjectId(),
          testId: new Types.ObjectId(),
          status: 'in_progress',
          attemptNumber: 2,
          timeSpentSeconds: 400,
          startedAt: new Date('2026-10-25T00:30:00Z'),
          expiresAt: new Date('2026-10-25T01:30:00Z'),
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
          lean: vi.fn().mockResolvedValue({ title: 'DSSSB Practice Test' }),
        }),
      });

      examModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ _id: testId, title: 'DSSSB Practice Test' }]),
        }),
      });

      subjectModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ _id: subjectId, name: 'Pedagogy' }]),
        }),
      });

      const summary = await service.getSummary(studentA);

      expect(summary.totalTests).toBe(2);
      expect(summary.completedTests).toBe(1);
      expect(summary.inProgressAttempt?.testTitle).toBe('DSSSB Practice Test');
      expect(summary.averageScorePercent).toBe(75);
      expect(summary.averageAccuracy).toBe(50);
      expect(summary.totalStudySeconds).toBe(1600);
      expect(summary.weakestSubjects[0].name).toBe('Pedagogy');
      expect(summary.weakestSubjects[0].accuracy).toBe(50);
    });

    it('paginates attempts and sets nextCursor accurately', async () => {
      const { service, testAttemptModel, testSeriesModel } = makeService();

      const testId = new Types.ObjectId();
      const seriesId = new Types.ObjectId();

      const mockDocs = [
        {
          _id: new Types.ObjectId(),
          testId: { _id: testId, title: 'Paper 1', seriesId, durationMinutes: 60 },
          status: 'submitted',
          marksAwarded: 45,
          maximumMarks: 50,
          startedAt: new Date('2026-10-24T15:00:00Z'),
          endedAt: new Date('2026-10-24T15:45:00Z'),
          timeSpentSeconds: 2700,
        },
        {
          _id: new Types.ObjectId(),
          testId: { _id: testId, title: 'Paper 1', seriesId, durationMinutes: 60 },
          status: 'submitted',
          marksAwarded: 38,
          maximumMarks: 50,
          startedAt: new Date('2026-10-23T15:00:00Z'),
          endedAt: new Date('2026-10-23T15:40:00Z'),
          timeSpentSeconds: 2400,
        },
      ];

      testAttemptModel.countDocuments.mockResolvedValue(15);
      testAttemptModel.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockDocs),
            }),
          }),
        }),
      });

      testSeriesModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ _id: seriesId, title: 'UGC NET Series' }]),
        }),
      });

      const result = await service.getAttempts(studentA, { limit: 2 });

      expect(result.total).toBe(15);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].testTitle).toBe('Paper 1');
      expect(result.items[0].seriesTitle).toBe('UGC NET Series');
      expect(result.items[0].scorePercent).toBe(90);
      expect(result.nextCursor).toBe(mockDocs[1].startedAt.toISOString());
    });

    it('computes series preparation matrix with completed and unattempted counts', async () => {
      const { service, testSeriesModel, examModel, testAttemptModel } = makeService();

      const seriesId = new Types.ObjectId().toString();
      const exam1 = new Types.ObjectId();
      const exam2 = new Types.ObjectId();
      const exam3 = new Types.ObjectId();

      testSeriesModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(seriesId),
          title: 'CS Mock Series',
          slug: 'cs-mock-series',
          category: 'teaching',
          targetExam: 'DSSSB',
        }),
      });

      examModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: exam1, title: 'Test 1', testMode: 'subject', type: 'exam', durationMinutes: 30 },
            { _id: exam2, title: 'Test 2', testMode: 'chapter', type: 'exam', durationMinutes: 30 },
            { _id: exam3, title: 'Test 3', testMode: 'full', type: 'exam', durationMinutes: 60 },
          ]),
        }),
      });

      testAttemptModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              testId: exam1,
              status: 'submitted',
              marksAwarded: 25,
              maximumMarks: 30,
              answers: [{ isCorrect: true, status: 'answered' }],
            },
            {
              _id: new Types.ObjectId(),
              testId: exam2,
              status: 'in_progress',
            },
          ]),
        }),
      });

      const prep = await service.getSeriesPreparation(studentA, seriesId);

      expect(prep.totalTestsCount).toBe(3);
      expect(prep.completedTestsCount).toBe(1);
      expect(prep.inProgressTestsCount).toBe(1);
      expect(prep.unattemptedTestsCount).toBe(1);
      expect(prep.tests[0].latestAttempt?.status).toBe('submitted');
      expect(prep.tests[1].latestAttempt?.status).toBe('in_progress');
      expect(prep.tests[2].latestAttempt).toBeNull();
    });

    it('computes series weak topics and categorizes into needs_revision and strong', async () => {
      const { service, testSeriesModel, examModel, testAttemptModel, chapterModel } = makeService();

      const seriesId = new Types.ObjectId().toString();
      const examId = new Types.ObjectId();
      const chWeak = new Types.ObjectId();
      const chStrong = new Types.ObjectId();

      testSeriesModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: new Types.ObjectId(seriesId) }),
      });

      examModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ _id: examId }]),
        }),
      });

      testAttemptModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              answers: [
                // Weak chapter: 1/4 correct (25%) -> needs_revision
                { chapterId: chWeak, isCorrect: false, status: 'answered' },
                { chapterId: chWeak, isCorrect: false, status: 'answered' },
                { chapterId: chWeak, isCorrect: false, status: 'answered' },
                { chapterId: chWeak, isCorrect: true, status: 'answered' },
                // Strong chapter: 4/4 correct (100%) -> strong
                { chapterId: chStrong, isCorrect: true, status: 'answered' },
                { chapterId: chStrong, isCorrect: true, status: 'answered' },
                { chapterId: chStrong, isCorrect: true, status: 'answered' },
                { chapterId: chStrong, isCorrect: true, status: 'answered' },
              ],
            },
          ]),
        }),
      });

      chapterModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: chWeak, name: 'Computer Networks', subjectId: new Types.ObjectId() },
            { _id: chStrong, name: 'Data Structures', subjectId: new Types.ObjectId() },
          ]),
        }),
      });

      const weakTopics = await service.getSeriesWeakTopics(studentA, seriesId);

      expect(weakTopics).toHaveLength(2);
      expect(weakTopics[0].name).toBe('Computer Networks');
      expect(weakTopics[0].accuracy).toBe(25);
      expect(weakTopics[0].status).toBe('needs_revision');

      expect(weakTopics[1].name).toBe('Data Structures');
      expect(weakTopics[1].accuracy).toBe(100);
      expect(weakTopics[1].status).toBe('strong');
    });

    it('computes attempt analysis sections, negative penalties, and question solutions', async () => {
      const { service, testAttemptModel, examModel, chapterModel } = makeService();

      const attemptId = new Types.ObjectId();
      const testId = new Types.ObjectId();
      const chapterId = new Types.ObjectId();
      const optCorrect = new Types.ObjectId();
      const optWrong = new Types.ObjectId();

      const mockAttempt = {
        _id: attemptId,
        testId,
        userId: new Types.ObjectId(studentA.id),
        attemptNumber: 1,
        status: 'submitted',
        marksAwarded: 8,
        maximumMarks: 10,
        timeSpentSeconds: 300,
        startedAt: new Date('2026-10-24T12:00:00Z'),
        endedAt: new Date('2026-10-24T12:05:00Z'),
        sectionProgress: [
          { sectionId: 'sec-a', name: 'Section A', timeSpentSeconds: 300, isCompleted: true },
        ],
        answers: [
          {
            questionId: new Types.ObjectId(),
            sectionId: 'sec-a',
            chapterId,
            status: 'answered',
            isCorrect: true,
            marksAwarded: 10,
            maximumMarks: 10,
            negativeMarks: 2,
            timeSpentSeconds: 40,
            optionIds: [optCorrect],
            questionSnapshot: {
              content: 'What is O(log n)?',
              type: 'single_choice',
              options: [
                { _id: optCorrect, content: 'Logarithmic', isCorrect: true },
                { _id: optWrong, content: 'Linear', isCorrect: false },
              ],
              explanation: 'Halving search space yields logarithmic time.',
            },
          },
        ],
      };

      testAttemptModel.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockAttempt),
      });

      examModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: testId,
          title: 'Algorithm Diagnostic',
          durationMinutes: 15,
        }),
      });

      chapterModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ _id: chapterId, name: 'Asymptotic Analysis' }]),
        }),
      });

      const analysis = await service.getAttemptAnalysis(studentA, attemptId.toString());

      expect(analysis.attemptId).toBe(attemptId.toString());
      expect(analysis.summary.accuracy).toBe(100);
      expect(analysis.summary.score).toBe(8);
      expect(analysis.sections[0].marksAwarded).toBe(10);
      expect(analysis.strongChapters[0].name).toBe('Asymptotic Analysis');
      expect(analysis.questionReview[0].options[0].isCorrect).toBe(true);
      expect(analysis.questionReview[0].options[0].isSelected).toBe(true);
      expect(analysis.questionReview[0].explanation).toBe('Halving search space yields logarithmic time.');
    });

    it('simulates load-test aggregation over 150 student attempts smoothly', async () => {
      const { service, testAttemptModel, examModel, subjectModel } = makeService();

      const subA = new Types.ObjectId();
      const subB = new Types.ObjectId();

      const largeAttempts = Array.from({ length: 150 }, (_, i) => ({
        _id: new Types.ObjectId(),
        testId: new Types.ObjectId(),
        status: 'submitted',
        attemptNumber: 1,
        marksAwarded: (i % 2 === 0 ? 80 : 40),
        maximumMarks: 100,
        timeSpentSeconds: 1500,
        startedAt: new Date(Date.now() - i * 86400000),
        endedAt: new Date(Date.now() - i * 86400000 + 1500000),
        answers: [
          { subjectId: subA, isCorrect: i % 2 === 0, status: 'answered' },
          { subjectId: subB, isCorrect: i % 3 === 0, status: 'answered' },
        ],
      }));

      testAttemptModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(largeAttempts),
          }),
        }),
      });

      examModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });

      subjectModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: subA, name: 'Subject A' },
            { _id: subB, name: 'Subject B' },
          ]),
        }),
      });

      const startTime = performance.now();
      const summary = await service.getSummary(studentA);
      const elapsed = performance.now() - startTime;

      expect(summary.totalTests).toBe(150);
      expect(summary.completedTests).toBe(150);
      expect(summary.averageScorePercent).toBe(60);
      expect(elapsed).toBeLessThan(100); // Executed within milliseconds
    });
  });
});
