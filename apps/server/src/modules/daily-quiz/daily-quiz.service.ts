import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { z } from 'zod';
import {
  DailyQuiz,
  DailyQuizAttempt,
  DailyQuizDocument,
  DailyQuizAttemptDocument,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type {
  createDailyQuizDtoSchema,
  submitDailyQuizDtoSchema,
} from './dto/daily-quiz.dto.js';

export type DailyQuizCategory =
  | 'current-affairs'
  | 'quantitative-aptitude'
  | 'reasoning'
  | 'english'
  | 'general-science';

@Injectable()
export class DailyQuizService {
  constructor(
    @InjectModel(DailyQuiz.name)
    private readonly quizModel: Model<DailyQuizDocument>,
    @InjectModel(DailyQuizAttempt.name)
    private readonly attemptModel: Model<DailyQuizAttemptDocument>,
  ) {}

  /**
   * List recent daily quizzes for calendar/archive navigation
   */
  async listRecent(limit = 14, category: DailyQuizCategory = 'current-affairs') {
    const quizzes = await this.quizModel
      .find({ category, isPublished: true })
      .sort({ date: -1 })
      .limit(Math.min(limit, 30))
      .select('date title category targetExams durationMinutes totalMarks attemptsCount createdAt')
      .lean();

    return quizzes;
  }

  /**
   * Get today's quiz (or the latest available quiz)
   */
  async getTodayQuiz(category: DailyQuizCategory = 'current-affairs') {
    const today = new Date().toISOString().slice(0, 10);
    let quiz = await this.quizModel.findOne({ date: today, category, isPublished: true }).lean();

    if (!quiz) {
      // Fallback to most recent published quiz
      quiz = await this.quizModel
        .findOne({ category, isPublished: true })
        .sort({ date: -1 })
        .lean();
    }

    if (!quiz) {
      throw new NotFoundException(`No daily quiz found for ${category}.`);
    }

    return this.sanitizeQuizForAttempt(quiz);
  }

  /**
   * Get quiz by specific date (YYYY-MM-DD)
   */
  async getQuizByDate(date: string, category: DailyQuizCategory = 'current-affairs') {
    const quiz = await this.quizModel.findOne({ date, category, isPublished: true }).lean();
    if (!quiz) {
      throw new NotFoundException(`Daily quiz for date ${date} (${category}) not found.`);
    }

    return this.sanitizeQuizForAttempt(quiz);
  }

  /**
   * Submit student answers, calculate score, evaluate questions, and update daily streak
   */
  async submitQuiz(
    quizId: string,
    submission: z.infer<typeof submitDailyQuizDtoSchema>,
    user?: CurrentUser | null,
  ) {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('Invalid quiz ID.');
    }

    const quiz = await this.quizModel.findById(quizId).lean();
    if (!quiz) {
      throw new NotFoundException('Daily quiz not found.');
    }

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const evaluatedQuestions = quiz.questions.map((q) => {
      const qId = q._id.toString();
      const userSelected = submission.userResponses[qId] ?? null;
      const correctOption = q.options.find((opt) => opt.isCorrect);
      const isCorrect = userSelected && correctOption && userSelected === correctOption.id;
      const isUnattempted = !userSelected;

      if (isUnattempted) {
        unattemptedCount++;
      } else if (isCorrect) {
        correctCount++;
        score += q.marks ?? 1;
      } else {
        incorrectCount++;
        score = Math.max(0, score - (q.negativeMarks ?? 0.25));
      }

      return {
        questionId: qId,
        content: q.content,
        options: q.options,
        userSelected,
        correctOptionId: correctOption?.id ?? null,
        isCorrect: !!isCorrect,
        explanation: q.explanation,
        examTip: q.examTip,
        marksAwarded: isCorrect ? q.marks : isUnattempted ? 0 : -(q.negativeMarks ?? 0.25),
      };
    });

    // Save attempt if user is authenticated
    let streakDays = 1;
    if (user?.id && Types.ObjectId.isValid(user.id)) {
      const userObjectId = new Types.ObjectId(user.id);
      await this.attemptModel.create({
        quizId: quiz._id,
        userId: userObjectId,
        date: quiz.date,
        score: Math.round(score * 100) / 100,
        totalQuestions: quiz.questions.length,
        correctCount,
        incorrectCount,
        unattemptedCount,
        timeSpentSeconds: submission.timeSpentSeconds,
        userResponses: submission.userResponses,
      });

      // Update quiz stats
      await this.quizModel.updateOne(
        { _id: quiz._id },
        {
          $inc: { attemptsCount: 1 },
          $set: {
            averageScore:
              Math.round(
                ((quiz.averageScore * quiz.attemptsCount + score) / (quiz.attemptsCount + 1)) * 100,
              ) / 100,
          },
        },
      );

      streakDays = await this.calculateStreak(userObjectId);
    }

    const accuracy =
      correctCount + incorrectCount > 0
        ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
        : 0;

    return {
      quizId: quiz._id.toString(),
      date: quiz.date,
      title: quiz.title,
      category: quiz.category,
      score: Math.round(score * 100) / 100,
      totalMarks: quiz.totalMarks,
      totalQuestions: quiz.questions.length,
      correctCount,
      incorrectCount,
      unattemptedCount,
      accuracy,
      timeSpentSeconds: submission.timeSpentSeconds,
      streakDays,
      questions: evaluatedQuestions,
    };
  }

  /**
   * Calculate consecutive daily quiz streak
   */
  async calculateStreak(userId: Types.ObjectId): Promise<number> {
    const attempts = await this.attemptModel
      .find({ userId })
      .sort({ date: -1 })
      .select('date')
      .lean();

    if (!attempts.length) return 0;

    const uniqueDates = Array.from(new Set(attempts.map((a) => a.date))).sort().reverse();
    if (!uniqueDates.length) return 0;

    const today = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    // If latest attempt is neither today nor yesterday, streak is broken
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 1;
    }

    let streak = 1;
    let curr = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
        curr = prev;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Create or seed a daily quiz (Admin / Feed Generator)
   */
  async create(dto: z.infer<typeof createDailyQuizDtoSchema>) {
    const totalMarks = dto.questions.reduce((acc, q) => acc + (q.marks ?? 1), 0);

    const quiz = await this.quizModel.findOneAndUpdate(
      { date: dto.date, category: dto.category },
      {
        $set: {
          ...dto,
          totalMarks,
          isPublished: true,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    return quiz;
  }

  /**
   * Helper: Strip correct answer flag before candidate begins the quiz
   */
  private sanitizeQuizForAttempt(quiz: any) {
    return {
      id: quiz._id.toString(),
      date: quiz.date,
      title: quiz.title,
      category: quiz.category,
      description: quiz.description,
      targetExams: quiz.targetExams,
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      totalQuestions: quiz.questions.length,
      questions: quiz.questions.map((q: any) => ({
        id: q._id.toString(),
        content: q.content,
        options: q.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
        })),
        marks: q.marks,
        negativeMarks: q.negativeMarks,
      })),
    };
  }
}
