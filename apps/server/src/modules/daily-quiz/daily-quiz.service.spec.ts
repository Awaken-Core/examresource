import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DailyQuizService } from './daily-quiz.service.js';

describe('DailyQuizService', () => {
  let service: DailyQuizService;
  let mockQuizModel: any;
  let mockAttemptModel: any;

  const mockQuiz = {
    _id: '507f1f77bcf86cd799439011',
    date: '2026-10-28',
    title: 'Daily Current Affairs Quiz',
    category: 'current-affairs',
    totalMarks: 2,
    attemptsCount: 10,
    averageScore: 1.5,
    questions: [
      {
        _id: 'q1',
        content: { en: 'Question 1', hi: 'प्रश्न 1' },
        options: [
          { id: 'A', text: { en: 'Option A' }, isCorrect: true },
          { id: 'B', text: { en: 'Option B' }, isCorrect: false },
        ],
        marks: 1,
        negativeMarks: 0.25,
        explanation: { en: 'Explanation 1' },
      },
      {
        _id: 'q2',
        content: { en: 'Question 2', hi: 'प्रश्न 2' },
        options: [
          { id: 'A', text: { en: 'Option A' }, isCorrect: false },
          { id: 'B', text: { en: 'Option B' }, isCorrect: true },
        ],
        marks: 1,
        negativeMarks: 0.25,
        explanation: { en: 'Explanation 2' },
      },
    ],
  };

  beforeEach(() => {
    mockQuizModel = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([mockQuiz]),
            }),
          }),
        }),
      }),
      findOne: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockQuiz),
        }),
        lean: vi.fn().mockResolvedValue(mockQuiz),
      }),
      findById: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockQuiz),
      }),
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    };

    mockAttemptModel = {
      create: vi.fn().mockResolvedValue({}),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              { date: '2026-10-28' },
              { date: '2026-10-27' },
              { date: '2026-10-26' },
            ]),
          }),
        }),
      }),
    };

    service = new DailyQuizService(mockQuizModel, mockAttemptModel);
  });

  it('correctly calculates score, accuracy, and evaluated questions', async () => {
    const submission = {
      userResponses: {
        q1: 'A', // Correct (+1)
        q2: 'A', // Incorrect (-0.25)
      },
      timeSpentSeconds: 45,
    };

    const result = await service.submitQuiz(mockQuiz._id, submission, null);

    expect(result.score).toBe(0.75);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.accuracy).toBe(50);
    expect(result.totalQuestions).toBe(2);
    expect(result.questions[0].isCorrect).toBe(true);
    expect(result.questions[1].isCorrect).toBe(false);
  });

  it('calculates consecutive daily streak correctly', async () => {
    const streak = await service.calculateStreak('507f1f77bcf86cd799439012' as any);
    expect(streak).toBeGreaterThanOrEqual(1);
  });
});
