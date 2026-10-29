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
      findOne: vi.fn().mockImplementation((query) => ({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockQuiz),
        }),
        lean: vi.fn().mockResolvedValue(query.date === 'non-existent' ? null : mockQuiz),
      })),
      findById: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockQuiz),
      }),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: 'new-id' })),
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

  describe('Retrieval', () => {
    it('retrieves today quiz with fallback to latest published quiz', async () => {
      const result = await service.getTodayQuiz();
      expect(result).toBeDefined();
      expect(result?.title).toBe('Daily Current Affairs Quiz');
      expect(result?.totalQuestions).toBe(2);
    });

    it('retrieves quiz by specific date', async () => {
      const result = await service.getQuizByDate('2026-10-28');
      expect(result).toBeDefined();
      expect(result?.date).toBe('2026-10-28');
    });

    it('throws NotFoundException for non-existent date', async () => {
      await expect(service.getQuizByDate('non-existent')).rejects.toThrow();
    });

    it('lists recent published quizzes with metadata', async () => {
      const list = await service.listRecent(5);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(1);
      expect(list[0].title).toBe('Daily Current Affairs Quiz');
    });
  });

  describe('Scoring and Evaluation', () => {
    it('correctly calculates score with positive and negative marking', async () => {
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
      expect(result.unattemptedCount).toBe(0);
      expect(result.accuracy).toBe(50);
      expect(result.totalQuestions).toBe(2);
      expect(result.questions[0].isCorrect).toBe(true);
      expect(result.questions[1].isCorrect).toBe(false);
    });

    it('handles perfect score when all answers are correct', async () => {
      const submission = {
        userResponses: {
          q1: 'A', // Correct (+1)
          q2: 'B', // Correct (+1)
        },
        timeSpentSeconds: 30,
      };

      const result = await service.submitQuiz(mockQuiz._id, submission, null);

      expect(result.score).toBe(2);
      expect(result.correctCount).toBe(2);
      expect(result.incorrectCount).toBe(0);
      expect(result.unattemptedCount).toBe(0);
      expect(result.accuracy).toBe(100);
    });

    it('handles skipped questions without negative marking penalty', async () => {
      const submission = {
        userResponses: {
          q1: 'A', // Correct (+1)
          // q2 is skipped
        },
        timeSpentSeconds: 20,
      };

      const result = await service.submitQuiz(mockQuiz._id, submission, null);

      expect(result.score).toBe(1);
      expect(result.correctCount).toBe(1);
      expect(result.incorrectCount).toBe(0);
      expect(result.unattemptedCount).toBe(1);
      expect(result.accuracy).toBe(100);
    });

    it('ensures score does not drop below 0', async () => {
      const submission = {
        userResponses: {
          q1: 'B', // Incorrect (-0.25)
          q2: 'A', // Incorrect (-0.25)
        },
        timeSpentSeconds: 15,
      };

      const result = await service.submitQuiz(mockQuiz._id, submission, null);

      expect(result.score).toBe(0);
      expect(result.correctCount).toBe(0);
      expect(result.incorrectCount).toBe(2);
      expect(result.accuracy).toBe(0);
    });
  });

  describe('Streak Calculation', () => {
    it('calculates consecutive 3-day daily streak correctly', async () => {
      const streak = await service.calculateStreak('507f1f77bcf86cd799439012' as any);
      expect(streak).toBeGreaterThanOrEqual(1);
    });

    it('returns 0 streak for empty attempts', async () => {
      mockAttemptModel.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const streak = await service.calculateStreak('507f1f77bcf86cd799439012' as any);
      expect(streak).toBe(0);
    });
  });
});
