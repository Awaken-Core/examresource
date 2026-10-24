import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  type ChapterDocument,
  Chapter,
  type ExamDocument,
  Exam,
  type SubjectDocument,
  Subject,
  type TestAttemptDocument,
  TestAttempt,
  type TestSeriesDocument,
  TestSeries,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type { ListPreparationAttemptsQuery } from './dto/learner-analytics.dto.js';

@Injectable()
export class LearnerAnalyticsService {
  constructor(
    @InjectModel(TestAttempt.name)
    private readonly testAttemptModel: Model<TestAttemptDocument>,
    @InjectModel(Exam.name)
    private readonly examModel: Model<ExamDocument>,
    @InjectModel(TestSeries.name)
    private readonly testSeriesModel: Model<TestSeriesDocument>,
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
  ) {}

  /**
   * 1. GET /api/v1/me/preparation/summary
   * Aggregated preparation dashboard summary for the first screen.
   */
  async getSummary(user: CurrentUser) {
    const userId = new Types.ObjectId(user.id);

    // Project only fields strictly necessary for the top-level aggregates
    const attempts = await this.testAttemptModel
      .find({ userId })
      .select({
        _id: 1,
        testId: 1,
        status: 1,
        attemptNumber: 1,
        marksAwarded: 1,
        maximumMarks: 1,
        timeSpentSeconds: 1,
        startedAt: 1,
        endedAt: 1,
        expiresAt: 1,
        'answers.subjectId': 1,
        'answers.isCorrect': 1,
        'answers.status': 1,
      })
      .sort({ startedAt: -1 })
      .lean();

    const totalTests = attempts.length;
    const completedAttempts = attempts.filter((a) => a.status === 'submitted');
    const inProgress = attempts.find((a) => a.status === 'in_progress');

    let inProgressAttempt: {
      id: string;
      testTitle: string;
      expiresAt?: Date | null;
    } | null = null;

    if (inProgress) {
      const examDoc = await this.examModel
        .findById(inProgress.testId)
        .select({ title: 1 })
        .lean();
      inProgressAttempt = {
        id: inProgress._id.toString(),
        testTitle: examDoc?.title || 'Active Test',
        expiresAt: inProgress.expiresAt || null,
      };
    }

    let totalStudySeconds = 0;
    let totalMarksAwarded = 0;
    let totalMaximumMarks = 0;
    let totalAnswered = 0;
    let totalCorrect = 0;

    for (const att of attempts) {
      if (typeof att.timeSpentSeconds === 'number' && att.timeSpentSeconds > 0) {
        totalStudySeconds += att.timeSpentSeconds;
      } else if (att.startedAt && att.endedAt) {
        const diff = Math.floor(
          (new Date(att.endedAt).getTime() - new Date(att.startedAt).getTime()) /
            1000,
        );
        if (diff > 0) totalStudySeconds += diff;
      }
    }

    const subjectMap = new Map<string, { attempted: number; correct: number }>();

    for (const att of completedAttempts) {
      if (
        typeof att.marksAwarded === 'number' &&
        typeof att.maximumMarks === 'number' &&
        att.maximumMarks > 0
      ) {
        totalMarksAwarded += att.marksAwarded;
        totalMaximumMarks += att.maximumMarks;
      }

      if (att.answers && att.answers.length > 0) {
        for (const ans of att.answers) {
          const isAnswered =
            ans.status === 'answered' ||
            ans.status === 'answered_and_marked_for_review' ||
            (ans.isCorrect !== undefined && ans.isCorrect !== null);

          if (isAnswered) {
            totalAnswered++;
            if (ans.isCorrect) totalCorrect++;

            if (ans.subjectId) {
              const sId = ans.subjectId.toString();
              const curr = subjectMap.get(sId) || { attempted: 0, correct: 0 };
              curr.attempted++;
              if (ans.isCorrect) curr.correct++;
              subjectMap.set(sId, curr);
            }
          }
        }
      }
    }

    const averageAccuracy =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const averageScorePercent =
      totalMaximumMarks > 0
        ? Math.round((totalMarksAwarded / totalMaximumMarks) * 100)
        : 0;

    // Last up to 7 completed attempts for score trend
    const recentCompleted = completedAttempts.slice(0, 7).reverse();
    const recentTestIds = recentCompleted
      .map((a) => a.testId)
      .filter((id) => Types.ObjectId.isValid(id?.toString() || ''));

    const examTitles = new Map<string, string>();
    if (recentTestIds.length > 0) {
      const exams = await this.examModel
        .find({ _id: { $in: recentTestIds } })
        .select({ _id: 1, title: 1 })
        .lean();
      for (const e of exams) {
        examTitles.set(e._id.toString(), e.title);
      }
    }

    const recentScoreTrend = recentCompleted.map((att) => {
      const scorePct =
        att.maximumMarks && att.maximumMarks > 0
          ? Math.round(((att.marksAwarded || 0) / att.maximumMarks) * 100)
          : 0;
      const tId = att.testId?.toString() || '';
      return {
        date: (att.endedAt || att.startedAt || new Date()).toISOString(),
        scorePercent: scorePct,
        testId: tId,
        testTitle: examTitles.get(tId) || 'Practice Mock',
      };
    });

    // Resolve weakest subjects
    const subjectIds = Array.from(subjectMap.keys()).filter((id) =>
      Types.ObjectId.isValid(id),
    );
    const subjectDocs =
      subjectIds.length > 0
        ? await this.subjectModel
            .find({
              _id: { $in: subjectIds.map((id) => new Types.ObjectId(id)) },
            })
            .select({ _id: 1, name: 1 })
            .lean()
        : [];

    const subjectNameMap = new Map<string, string>();
    for (const s of subjectDocs) {
      subjectNameMap.set(s._id.toString(), s.name);
    }

    const subjectStats = Array.from(subjectMap.entries()).map(([sId, val]) => {
      const accuracy =
        val.attempted > 0 ? Math.round((val.correct / val.attempted) * 100) : 0;
      return {
        subjectId: sId,
        name: subjectNameMap.get(sId) || 'Subject',
        accuracy,
        attempted: val.attempted,
      };
    });

    subjectStats.sort((a, b) => a.accuracy - b.accuracy);
    const weakestSubjects = subjectStats.slice(0, 5);

    return {
      totalTests,
      completedTests: completedAttempts.length,
      inProgressAttempt: inProgressAttempt ?? undefined,
      averageAccuracy,
      averageScorePercent,
      totalStudySeconds,
      recentScoreTrend,
      weakestSubjects,
    };
  }

  /**
   * 2. GET /api/v1/me/preparation/attempts
   * Filtered, paginated list of learner attempts.
   */
  async getAttempts(user: CurrentUser, query: ListPreparationAttemptsQuery) {
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(user.id),
    };

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.seriesId) {
      if (!Types.ObjectId.isValid(query.seriesId)) {
        throw new BadRequestException('Invalid seriesId parameter.');
      }
      const exams = await this.examModel
        .find({ seriesId: new Types.ObjectId(query.seriesId) })
        .select({ _id: 1 })
        .lean();
      const examIds = exams.map((e) => e._id);
      filter.testId = { $in: examIds };
    }

    const limit = query.limit || 20;

    let sortOption: Record<string, any> = { startedAt: -1 };
    if (query.cursor) {
      try {
        const cursorDate = new Date(query.cursor);
        if (!isNaN(cursorDate.getTime())) {
          filter.startedAt = { $lt: cursorDate };
        }
      } catch {
        // ignore malformed cursor
      }
    }

    const [total, docs] = await Promise.all([
      this.testAttemptModel.countDocuments({
        userId: new Types.ObjectId(user.id),
        ...(query.status && query.status !== 'all' ? { status: query.status } : {}),
      }),
      this.testAttemptModel
        .find(filter)
        .populate('testId', 'title seriesId durationMinutes totalMarks testMode type')
        .sort(sortOption)
        .limit(limit)
        .lean(),
    ]);

    // Gather series names
    const seriesIds = docs
      .map((d: any) => d.testId?.seriesId)
      .filter((id) => id && Types.ObjectId.isValid(id.toString()));

    const seriesDocs =
      seriesIds.length > 0
        ? await this.testSeriesModel
            .find({ _id: { $in: seriesIds } })
            .select({ _id: 1, title: 1 })
            .lean()
        : [];

    const seriesTitleMap = new Map<string, string>();
    for (const s of seriesDocs) {
      seriesTitleMap.set(s._id.toString(), s.title);
    }

    const items = docs.map((doc: any) => {
      const test = doc.testId && typeof doc.testId === 'object' ? doc.testId : null;
      const testIdStr = (test?._id || doc.testId)?.toString() || '';
      const sId = test?.seriesId ? test.seriesId.toString() : null;

      const scorePercent =
        doc.maximumMarks && doc.maximumMarks > 0
          ? Math.round(((doc.marksAwarded || 0) / doc.maximumMarks) * 100)
          : null;

      return {
        id: doc._id.toString(),
        testId: testIdStr,
        testTitle: test?.title || 'Practice Test',
        seriesId: sId,
        seriesTitle: sId ? seriesTitleMap.get(sId) || null : null,
        attemptNumber: doc.attemptNumber || 1,
        status: doc.status,
        startedAt: doc.startedAt,
        endedAt: doc.endedAt || null,
        timeSpentSeconds: doc.timeSpentSeconds || 0,
        durationMinutes: test?.durationMinutes || null,
        marksAwarded: doc.status !== 'in_progress' ? doc.marksAwarded : undefined,
        maximumMarks: doc.status !== 'in_progress' ? doc.maximumMarks : undefined,
        scorePercent: doc.status !== 'in_progress' ? scorePercent : undefined,
      };
    });

    const nextCursor =
      docs.length === limit && docs[docs.length - 1].startedAt
        ? new Date(docs[docs.length - 1].startedAt).toISOString()
        : null;

    return {
      items,
      nextCursor,
      total,
    };
  }

  /**
   * 3. GET /api/v1/me/preparation/series/:seriesId
   * Learner progress for a specific test series.
   */
  async getSeriesPreparation(user: CurrentUser, seriesId: string) {
    if (!Types.ObjectId.isValid(seriesId)) {
      throw new BadRequestException('Invalid seriesId parameter.');
    }

    const series = await this.testSeriesModel.findById(seriesId).lean();
    if (!series) {
      throw new NotFoundException('Test series was not found.');
    }

    const exams = await this.examModel
      .find({ seriesId: new Types.ObjectId(seriesId), status: 'published' })
      .select({ _id: 1, title: 1, testMode: 1, type: 1, durationMinutes: 1 })
      .lean();

    const examIds = exams.map((e) => e._id);

    const attempts = await this.testAttemptModel
      .find({
        userId: new Types.ObjectId(user.id),
        testId: { $in: examIds },
      })
      .sort({ startedAt: -1 })
      .lean();

    // Map latest attempt per exam
    const latestAttemptByExam = new Map<string, any>();
    for (const att of attempts) {
      const eId = att.testId.toString();
      if (!latestAttemptByExam.has(eId)) {
        latestAttemptByExam.set(eId, att);
      }
    }

    let completedCount = 0;
    let inProgressCount = 0;
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let totalAnswered = 0;
    let totalCorrect = 0;

    for (const att of latestAttemptByExam.values()) {
      if (att.status === 'submitted') {
        completedCount++;
        if (typeof att.marksAwarded === 'number' && typeof att.maximumMarks === 'number' && att.maximumMarks > 0) {
          totalMarks += att.marksAwarded;
          totalMaxMarks += att.maximumMarks;
        }

        if (att.answers) {
          for (const ans of att.answers) {
            const isAnswered =
              ans.status === 'answered' ||
              ans.status === 'answered_and_marked_for_review' ||
              (ans.isCorrect !== undefined && ans.isCorrect !== null);
            if (isAnswered) {
              totalAnswered++;
              if (ans.isCorrect) totalCorrect++;
            }
          }
        }
      } else if (att.status === 'in_progress') {
        inProgressCount++;
      }
    }

    const tests = exams.map((exam) => {
      const eId = exam._id.toString();
      const latest = latestAttemptByExam.get(eId);

      const scorePercent =
        latest && latest.maximumMarks && latest.maximumMarks > 0
          ? Math.round(((latest.marksAwarded || 0) / latest.maximumMarks) * 100)
          : null;

      return {
        id: eId,
        title: exam.title,
        testMode: exam.testMode,
        type: exam.type,
        durationMinutes: exam.durationMinutes,
        totalMarks: (exam as any).totalMarks ?? null,
        latestAttempt: latest
          ? {
              id: latest._id.toString(),
              attemptNumber: latest.attemptNumber || 1,
              status: latest.status,
              startedAt: latest.startedAt,
              endedAt: latest.endedAt || null,
              timeSpentSeconds: latest.timeSpentSeconds || 0,
              marksAwarded: latest.status !== 'in_progress' ? latest.marksAwarded : undefined,
              maximumMarks: latest.status !== 'in_progress' ? latest.maximumMarks : undefined,
              scorePercent: latest.status !== 'in_progress' ? scorePercent : undefined,
            }
          : null,
      };
    });

    return {
      series: {
        id: series._id.toString(),
        title: series.title,
        slug: series.slug,
        category: series.category,
        targetExam: series.targetExam,
      },
      totalTestsCount: exams.length,
      completedTestsCount: completedCount,
      inProgressTestsCount: inProgressCount,
      unattemptedTestsCount: Math.max(0, exams.length - (completedCount + inProgressCount)),
      averageScorePercent: totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : null,
      averageAccuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null,
      tests,
    };
  }

  /**
   * 4. GET /api/v1/me/preparation/series/:seriesId/weak-topics
   * Weak topic diagnostics for a specific series.
   */
  async getSeriesWeakTopics(user: CurrentUser, seriesId: string) {
    if (!Types.ObjectId.isValid(seriesId)) {
      throw new BadRequestException('Invalid seriesId parameter.');
    }

    const series = await this.testSeriesModel.findById(seriesId).lean();
    if (!series) {
      throw new NotFoundException('Test series was not found.');
    }

    const exams = await this.examModel
      .find({ seriesId: new Types.ObjectId(seriesId) })
      .select({ _id: 1 })
      .lean();
    const examIds = exams.map((e) => e._id);

    const attempts = await this.testAttemptModel
      .find({
        userId: new Types.ObjectId(user.id),
        testId: { $in: examIds },
        status: 'submitted',
      })
      .select({ 'answers.chapterId': 1, 'answers.subjectId': 1, 'answers.topic': 1, 'answers.isCorrect': 1, 'answers.status': 1 })
      .lean();

    const chapterStatsMap = new Map<string, { attempted: number; correct: number; subjectId?: string }>();

    for (const att of attempts) {
      if (!att.answers) continue;
      for (const ans of att.answers) {
        const isAnswered =
          ans.status === 'answered' ||
          ans.status === 'answered_and_marked_for_review' ||
          (ans.isCorrect !== undefined && ans.isCorrect !== null);
        if (isAnswered) {
          const key = ans.chapterId?.toString() || ans.topic || 'General';
          const curr = chapterStatsMap.get(key) || {
            attempted: 0,
            correct: 0,
            subjectId: ans.subjectId?.toString(),
          };
          curr.attempted++;
          if (ans.isCorrect) curr.correct++;
          chapterStatsMap.set(key, curr);
        }
      }
    }

    const chapterIds = Array.from(chapterStatsMap.keys()).filter((k) => Types.ObjectId.isValid(k));
    const chapters =
      chapterIds.length > 0
        ? await this.chapterModel
            .find({ _id: { $in: chapterIds.map((id) => new Types.ObjectId(id)) } })
            .select({ _id: 1, name: 1, subjectId: 1 })
            .lean()
        : [];

    const chapterMetaMap = new Map<string, { name: string; subjectId?: string }>();
    for (const ch of chapters) {
      chapterMetaMap.set(ch._id.toString(), {
        name: ch.name,
        subjectId: ch.subjectId?.toString(),
      });
    }

    const topics = Array.from(chapterStatsMap.entries()).map(([key, stat]) => {
      const meta = chapterMetaMap.get(key);
      const name = meta?.name || key;
      const accuracy = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;
      const status: 'needs_revision' | 'moderate' | 'strong' =
        accuracy < 60 ? 'needs_revision' : accuracy >= 75 ? 'strong' : 'moderate';

      return {
        chapterId: key,
        name,
        subjectId: meta?.subjectId || stat.subjectId || null,
        attempted: stat.attempted,
        correct: stat.correct,
        accuracy,
        status,
      };
    });

    topics.sort((a, b) => a.accuracy - b.accuracy);
    return topics;
  }

  /**
   * 5. GET /api/v1/me/exam-attempts/:attemptId/analysis
   * Deep analysis of a completed attempt for the post-exam result page.
   */
  async getAttemptAnalysis(user: CurrentUser, attemptId: string) {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new BadRequestException('Invalid attemptId parameter.');
    }

    const attempt = await this.testAttemptModel
      .findOne({
        _id: new Types.ObjectId(attemptId),
        userId: new Types.ObjectId(user.id),
      })
      .lean();

    if (!attempt) {
      throw new NotFoundException('Exam attempt was not found.');
    }

    const exam = await this.examModel.findById(attempt.testId).lean();

    const answers = attempt.answers || [];
    let attemptedCount = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    // Group answers by section
    const sectionMap = new Map<
      string,
      {
        name: string;
        marksAwarded: number;
        maximumMarks: number;
        correct: number;
        wrong: number;
        skipped: number;
        timeSpentSeconds: number;
      }
    >();

    // Initialise from attempt sectionProgress or exam sections
    if (attempt.sectionProgress && attempt.sectionProgress.length > 0) {
      for (const sp of attempt.sectionProgress) {
        sectionMap.set(sp.sectionId || sp.name, {
          name: sp.name,
          marksAwarded: 0,
          maximumMarks: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          timeSpentSeconds: sp.timeSpentSeconds || 0,
        });
      }
    }

    // Group answers by chapter for strength/revision classification
    const chapterMap = new Map<string, { name: string; correct: number; attempted: number }>();

    for (const ans of answers) {
      const isAnswered =
        ans.status === 'answered' ||
        ans.status === 'answered_and_marked_for_review' ||
        (ans.isCorrect !== undefined && ans.isCorrect !== null);

      if (isAnswered) {
        attemptedCount++;
        if (ans.isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        skippedCount++;
      }

      // Section update
      const secKey = ans.sectionId || 'Main';
      const sec = sectionMap.get(secKey) || {
        name: secKey,
        marksAwarded: 0,
        maximumMarks: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        timeSpentSeconds: 0,
      };

      sec.marksAwarded += ans.marksAwarded || 0;
      sec.maximumMarks += ans.maximumMarks || 0;
      if (isAnswered) {
        if (ans.isCorrect) sec.correct++;
        else sec.wrong++;
      } else {
        sec.skipped++;
      }
      sectionMap.set(secKey, sec);

      // Chapter update
      const chKey = ans.chapterId?.toString() || ans.topic || 'General';
      const ch = chapterMap.get(chKey) || { name: chKey, correct: 0, attempted: 0 };
      if (isAnswered) {
        ch.attempted++;
        if (ans.isCorrect) ch.correct++;
      }
      chapterMap.set(chKey, ch);
    }

    const totalQuestions = answers.length;
    const accuracy =
      attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const scorePercent =
      attempt.maximumMarks && attempt.maximumMarks > 0
        ? Math.round(((attempt.marksAwarded || 0) / attempt.maximumMarks) * 100)
        : 0;

    const sections = Array.from(sectionMap.entries()).map(([secId, val]) => {
      const secAttempted = val.correct + val.wrong;
      const secAccuracy =
        secAttempted > 0 ? Math.round((val.correct / secAttempted) * 100) : 0;
      return {
        sectionId: secId,
        name: val.name,
        marksAwarded: val.marksAwarded,
        maximumMarks: val.maximumMarks,
        correctCount: val.correct,
        wrongCount: val.wrong,
        skippedCount: val.skipped,
        accuracy: secAccuracy,
        timeSpentSeconds: val.timeSpentSeconds,
      };
    });

    // Resolve chapter names if possible
    const chIds = Array.from(chapterMap.keys()).filter((id) => Types.ObjectId.isValid(id));
    if (chIds.length > 0) {
      const chDocs = await this.chapterModel
        .find({ _id: { $in: chIds.map((id) => new Types.ObjectId(id)) } })
        .select({ _id: 1, name: 1 })
        .lean();
      for (const doc of chDocs) {
        const item = chapterMap.get(doc._id.toString());
        if (item) item.name = doc.name;
      }
    }

    const strongChapters: Array<{ name: string; accuracy: number; attempted: number }> = [];
    const needsRevisionChapters: Array<{ name: string; accuracy: number; attempted: number }> = [];

    for (const val of chapterMap.values()) {
      if (val.attempted > 0) {
        const acc = Math.round((val.correct / val.attempted) * 100);
        if (acc >= 75) {
          strongChapters.push({ name: val.name, accuracy: acc, attempted: val.attempted });
        } else if (acc < 60) {
          needsRevisionChapters.push({ name: val.name, accuracy: acc, attempted: val.attempted });
        }
      }
    }

    strongChapters.sort((a, b) => b.accuracy - a.accuracy);
    needsRevisionChapters.sort((a, b) => a.accuracy - b.accuracy);

    // Question review metadata
    const questionReview = answers.map((ans, idx) => {
      const snap = ans.questionSnapshot;
      return {
        questionId: ans.questionId?.toString() || `q_${idx}`,
        questionIndex: idx + 1,
        sectionId: ans.sectionId || null,
        status: ans.status || 'not_visited',
        isCorrect: ans.isCorrect,
        marksAwarded: ans.marksAwarded,
        maximumMarks: ans.maximumMarks,
        negativeMarks: ans.negativeMarks,
        timeSpentSeconds: ans.timeSpentSeconds || 0,
        difficulty: ans.difficulty || null,
        topic: ans.topic || null,
        snippet: snap?.content ? snap.content.slice(0, 140) : null,
      };
    });

    return {
      attemptId: attempt._id.toString(),
      testId: (exam?._id || attempt.testId).toString(),
      testTitle: exam?.title || 'Practice Test',
      attemptNumber: attempt.attemptNumber || 1,
      status: attempt.status,
      startedAt: attempt.startedAt,
      endedAt: attempt.endedAt || null,
      timeSpentSeconds: attempt.timeSpentSeconds || 0,
      durationMinutes: exam?.durationMinutes || null,
      summary: {
        score: attempt.marksAwarded || 0,
        maximumMarks: attempt.maximumMarks || 0,
        scorePercent,
        totalQuestions,
        attemptedCount,
        correctCount,
        wrongCount,
        skippedCount,
        accuracy,
      },
      sections,
      strongChapters,
      needsRevisionChapters,
      questionReview,
    };
  }
}
