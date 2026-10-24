import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Exam,
  type ExamDocument,
  Question,
  type QuestionDocument,
  QuestionMapping,
  type QuestionMappingDocument,
  TestAttempt,
  type TestAttemptDocument,
  TestSeries,
  type TestSeriesDocument,
  User,
  type UserDocument,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type {
  CreateExamInput,
  SaveAnswerInput,
  UpdateExamInput,
} from './dto/exam.dto.js';

@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name)
    private readonly examModel: Model<ExamDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(TestAttempt.name)
    private readonly testAttemptModel: Model<TestAttemptDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(TestSeries.name)
    private readonly testSeriesModel: Model<TestSeriesDocument>,
    @Optional()
    @InjectModel(QuestionMapping.name)
    private readonly questionMappingModel?: Model<QuestionMappingDocument>,
  ) {}

  async listPublished() {
    const docs = await this.examModel
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc) => this.formatExam(doc));
  }

  async getPublished(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Exam was not found.');
    }
    const doc = await this.examModel
      .findOne({ _id: new Types.ObjectId(id), status: 'published' })
      .lean();
    if (!doc) throw new NotFoundException('Exam was not found.');
    const hydratedQuestions = await this.getExamQuestions(doc, false);
    return { ...this.formatExam(doc), questions: hydratedQuestions };
  }

  async listManageable(user: CurrentUser) {
    this.assertEditor(user);
    const filter =
      user.role === 'admin' ? {} : { createdBy: new Types.ObjectId(user.id) };

    const docs = await this.examModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .lean();
    return docs.map((doc) => this.formatExam(doc));
  }

  async create(input: CreateExamInput, user: CurrentUser) {
    this.assertEditor(user);
    const questionIds = input.questions.map((q) => q.questionId);
    await this.validateQuestionIds(questionIds, input.status === 'published');

    const questionsPayload = input.questions.map((item, position) => ({
      questionId: new Types.ObjectId(item.questionId),
      position,
      marks: item.marks ?? null,
      negativeMarks: item.negativeMarks ?? null,
    }));

    const created = await this.examModel.create({
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      status: input.status,
      subject: input.subject ?? null,
      durationMinutes: input.durationMinutes ?? null,
      createdBy: new Types.ObjectId(user.id),
      questions: questionsPayload,
    });

    const doc = created.toObject();
    const hydratedQuestions = await this.getExamQuestions(doc, true);
    return { ...this.formatExam(doc), questions: hydratedQuestions };
  }

  async update(id: string, input: UpdateExamInput, user: CurrentUser) {
    const existing = await this.findManageable(id, user);

    const updatePayload: Record<string, any> = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined)
      updatePayload.description = input.description;
    if (input.type !== undefined) updatePayload.type = input.type;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.subject !== undefined) updatePayload.subject = input.subject;
    if (input.durationMinutes !== undefined)
      updatePayload.durationMinutes = input.durationMinutes;

    if (input.questions !== undefined) {
      const questionIds = input.questions.map((q) => q.questionId);
      await this.validateQuestionIds(
        questionIds,
        (input.status ?? existing.status) === 'published',
      );
      updatePayload.questions = input.questions.map((item, position) => ({
        questionId: new Types.ObjectId(item.questionId),
        position,
        marks: item.marks ?? null,
        negativeMarks: item.negativeMarks ?? null,
      }));
    }

    if (
      input.questions === undefined &&
      (input.status ?? existing.status) === 'published'
    ) {
      await this.validateQuestionIds(
        existing.questions.map((item: any) => item.questionId.toString()),
        true,
      );
    }

    const updated = await this.examModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: updatePayload },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Exam was not found.');
    }
    const hydratedQuestions = await this.getExamQuestions(updated, true);
    return { ...this.formatExam(updated), questions: hydratedQuestions };
  }

  async remove(id: string, user: CurrentUser) {
    await this.findManageable(id, user);
    const examObjectId = new Types.ObjectId(id);
    await this.examModel.findByIdAndDelete(examObjectId);
    await this.testAttemptModel.deleteMany({ testId: examObjectId });
  }

  async startAttempt(id: string, user: CurrentUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Exam was not found.');
    }
    const examObjectId = new Types.ObjectId(id);
    const now = new Date();

    const exam = await this.examModel
      .findOne({
        _id: examObjectId,
        status: 'published',
        $and: [
          {
            $or: [
              { availableFrom: null },
              { availableFrom: { $exists: false } },
              { availableFrom: { $lte: now } },
            ],
          },
          {
            $or: [
              { availableTo: null },
              { availableTo: { $exists: false } },
              { availableTo: { $gte: now } },
            ],
          },
        ],
      })
      .lean();
    if (!exam) throw new NotFoundException('Exam was not found.');

    const userObjectId = new Types.ObjectId(user.id);
    const prevAttemptsCount = await this.testAttemptModel.countDocuments({
      testId: examObjectId,
      userId: userObjectId,
    });

    // Check maxAttempts policy
    if (
      exam.maxAttempts &&
      exam.maxAttempts > 0 &&
      prevAttemptsCount >= exam.maxAttempts
    ) {
      throw new ConflictException(
        `You have reached the maximum allowed attempts (${exam.maxAttempts}) for this test.`,
      );
    }

    const activeAttempt = await this.testAttemptModel
      .findOne({
        testId: examObjectId,
        userId: userObjectId,
        status: 'in_progress',
      })
      .lean();

    if (activeAttempt) {
      // Check if expired while in progress
      if (
        activeAttempt.expiresAt &&
        new Date(activeAttempt.expiresAt).getTime() <= Date.now()
      ) {
        await this.autoFinalizeAttempt(activeAttempt);
        throw new ConflictException(
          'This exam attempt has expired and has been submitted.',
        );
      }
      return this.formatAttempt(activeAttempt, false);
    }

    // Resolve questions and sections
    let resolvedQuestions: any[] = [];
    let sectionProgress: any[] = [];

    if (exam.testMode === 'full' && exam.sections && exam.sections.length > 0) {
      // Build from sections
      for (const sec of exam.sections) {
        const secId =
          (sec as any).id || (sec as any)._id?.toString() || sec.name;
        sectionProgress.push({
          sectionId: secId,
          name: sec.name,
          timeSpentSeconds: 0,
          isCompleted: false,
        });

        let secQuestions = sec.questions || [];
        if (sec.questionOrderMode === 'randomized') {
          secQuestions = [...secQuestions].sort(() => Math.random() - 0.5);
        }

        if (
          sec.questionSetMode === 'random_per_attempt' &&
          typeof sec.requiredQuestionCount === 'number' &&
          sec.requiredQuestionCount > 0 &&
          sec.requiredQuestionCount < secQuestions.length
        ) {
          // If not already shuffled by randomized order mode, shuffle pool before drawing sample
          if (sec.questionOrderMode !== 'randomized') {
            secQuestions = [...secQuestions].sort(() => Math.random() - 0.5);
          }
          secQuestions = secQuestions.slice(0, sec.requiredQuestionCount);
        }

        for (const item of secQuestions) {
          resolvedQuestions.push({
            ...item,
            sectionId: secId,
            marks: item.marks ?? sec.positiveMarks ?? 1,
            negativeMarks: sec.negativeMarkingEnabled
              ? (item.negativeMarks ?? sec.negativeMarks ?? 0)
              : 0,
          });
        }
      }
    } else {
      let directQuestions = exam.questions || [];

      // Resilient fallback: if directQuestions is empty, dynamically query QuestionMapping or questions
      if (directQuestions.length === 0 && (exam.chapterId || exam.subjectId)) {
        let candidateIds: Types.ObjectId[] = [];
        if (this.questionMappingModel) {
          const mappingFilter: Record<string, any> = {};
          if (exam.testSeriesId) mappingFilter.testSeriesId = exam.testSeriesId;
          if (exam.subjectId) mappingFilter.subjectId = exam.subjectId;
          if (exam.chapterId) mappingFilter.chapterId = exam.chapterId;

          const mappings = await this.questionMappingModel
            .find(mappingFilter)
            .select('questionId')
            .lean();
          candidateIds = mappings.map((m: any) => m.questionId);
        }

        if (candidateIds.length === 0 && exam.chapterId) {
          const directQs = await this.questionModel
            .find({ chapterId: exam.chapterId, status: 'published' })
            .select('_id')
            .lean();
          candidateIds = directQs.map((q: any) => q._id);
        }

        if (candidateIds.length > 0) {
          const fetchedQuestions = await this.questionModel
            .find({ _id: { $in: candidateIds }, status: 'published' })
            .lean();

          directQuestions = fetchedQuestions.map((doc: any, pos: number) => ({
            questionId: doc._id,
            position: pos,
            marks: exam.positiveMarks ?? doc.marks ?? 1,
            negativeMarks: exam.negativeMarkingEnabled
              ? (exam.negativeMarks ?? doc.negativeMarks ?? 0)
              : 0,
          }));
        }
      }

      if (exam.questionOrderMode === 'randomized') {
        directQuestions = [...directQuestions].sort(() => Math.random() - 0.5);
      }
      if (
        exam.questionSetMode === 'random_per_attempt' &&
        typeof exam.totalQuestionsCount === 'number' &&
        exam.totalQuestionsCount > 0 &&
        exam.totalQuestionsCount < directQuestions.length
      ) {
        if (exam.questionOrderMode !== 'randomized') {
          directQuestions = [...directQuestions].sort(
            () => Math.random() - 0.5,
          );
        }
        directQuestions = directQuestions.slice(0, exam.totalQuestionsCount);
      }
      resolvedQuestions = directQuestions.map((q) => ({
        ...q,
        sectionId: null,
        marks: q.marks ?? exam.positiveMarks ?? 1,
        negativeMarks: exam.negativeMarkingEnabled
          ? (q.negativeMarks ?? exam.negativeMarks ?? 0)
          : 0,
      }));
    }

    if (resolvedQuestions.length === 0) {
      throw new BadRequestException(
        'This test does not have any questions configured yet.',
      );
    }

    // Hydrate questions and snapshots
    const hydratedQuestions =
      await this.getExamQuestionsWithSnapshots(resolvedQuestions);
    const totalMaxMarks = hydratedQuestions.reduce(
      (sum: number, q: any) => sum + (q.marks || 1),
      0,
    );

    const questionOrder = hydratedQuestions.map(
      (q: any) => new Types.ObjectId(q.id),
    );

    const initialAnswers = hydratedQuestions.map((q: any) => ({
      _id: new Types.ObjectId(),
      questionId: new Types.ObjectId(q.id),
      sectionId: q.sectionId || null,
      subjectId: q.subjectId || null,
      chapterId: q.chapterId || null,
      topic: q.topic || null,
      difficulty: q.difficulty || null,
      optionIds: [],
      numericalValue: null,
      status: 'not_visited',
      isCorrect: null,
      marksAwarded: 0,
      maximumMarks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      timeSpentSeconds: 0,
      visitedAt: null,
      lastViewedAt: null,
      answeredAt: null,
      questionSnapshot: q.snapshot || null,
    }));

    let attempt: any;
    try {
      attempt = await this.testAttemptModel.create({
        testId: examObjectId,
        userId: userObjectId,
        attemptNumber: prevAttemptsCount + 1,
        testVersion: exam.version || 1,
        status: 'in_progress',
        marksAwarded: 0,
        maximumMarks: totalMaxMarks,
        startedAt: new Date(),
        expiresAt: exam.durationMinutes
          ? new Date(Date.now() + exam.durationMinutes * 60_000)
          : null,
        questionOrder,
        sectionProgress,
        answers: initialAnswers as any,
      });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;

      const concurrentAttempt = await this.testAttemptModel
        .findOne({
          testId: examObjectId,
          userId: userObjectId,
          status: 'in_progress',
        })
        .lean();
      if (!concurrentAttempt) throw error;
      return this.formatAttempt(concurrentAttempt, false);
    }

    const docAttempt = (attempt as any).toObject
      ? (attempt as any).toObject()
      : attempt;
    return this.formatAttempt(docAttempt, false);
  }

  async listAttempts(user: CurrentUser) {
    const docs = await this.testAttemptModel
      .find({ userId: new Types.ObjectId(user.id) })
      .populate('testId', 'title testMode type durationMinutes totalMarks seriesId')
      .sort({ startedAt: -1 })
      .lean();
    return docs.map((doc) =>
      this.formatAttempt(doc, doc.status !== 'in_progress'),
    );
  }

  async getAttempt(id: string, user: CurrentUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Exam attempt was not found.');
    }
    const doc = await this.testAttemptModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(user.id),
      })
      .lean();

    if (!doc) throw new NotFoundException('Exam attempt was not found.');

    // Auto-finalize if expired
    if (
      doc.status === 'in_progress' &&
      doc.expiresAt &&
      new Date(doc.expiresAt).getTime() <= Date.now()
    ) {
      return this.autoFinalizeAttempt(doc);
    }

    return this.formatAttempt(doc, doc.status !== 'in_progress');
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    input: SaveAnswerInput,
    user: CurrentUser,
  ) {
    const attempt = await this.requireActiveAttempt(attemptId, user);
    if (!Types.ObjectId.isValid(questionId)) {
      throw new NotFoundException('Question is not part of this exam attempt.');
    }
    const qObjectId = new Types.ObjectId(questionId);

    const answer = attempt.answers.find(
      (ans: any) => ans.questionId.toString() === questionId,
    );
    if (!answer) {
      throw new NotFoundException('Question is not part of this exam attempt.');
    }

    // Determine pallet status
    let status = input.status || answer.status || 'not_answered';
    const hasOptions = input.optionIds && input.optionIds.length > 0;
    const hasNumerical =
      input.numericalValue && input.numericalValue.trim().length > 0;
    const isAnswered = hasOptions || hasNumerical;

    if (input.status === 'marked_for_review') {
      status = isAnswered
        ? 'answered_and_marked_for_review'
        : 'marked_for_review';
    } else if (!input.status) {
      status = isAnswered ? 'answered' : 'not_answered';
    }

    const selectedObjectIds = (input.optionIds || []).map(
      (optId) => new Types.ObjectId(optId),
    );
    const now = new Date();
    const timeSpentSeconds = Math.max(
      input.timeSpentSeconds ?? 0,
      answer.timeSpentSeconds ?? 0,
    );

    await this.testAttemptModel.updateOne(
      {
        _id: attempt._id,
        'answers.questionId': qObjectId,
      },
      {
        $set: {
          'answers.$.optionIds': selectedObjectIds,
          'answers.$.numericalValue':
            input.numericalValue !== undefined
              ? input.numericalValue
              : answer.numericalValue,
          'answers.$.status': status,
          'answers.$.answeredAt': isAnswered ? now : null,
          'answers.$.timeSpentSeconds': timeSpentSeconds,
          'answers.$.visitedAt': answer.visitedAt ?? now,
          'answers.$.lastViewedAt': now,
        },
      },
    );

    return this.getAttempt(attemptId, user);
  }

  async clearAnswer(attemptId: string, questionId: string, user: CurrentUser) {
    const attempt = await this.requireActiveAttempt(attemptId, user);
    if (!Types.ObjectId.isValid(questionId)) {
      throw new NotFoundException('Question is not part of this exam attempt.');
    }
    const qObjectId = new Types.ObjectId(questionId);

    await this.testAttemptModel.updateOne(
      {
        _id: attempt._id,
        'answers.questionId': qObjectId,
      },
      {
        $set: {
          'answers.$.optionIds': [],
          'answers.$.numericalValue': null,
          'answers.$.status': 'not_answered',
          'answers.$.answeredAt': null,
        },
      },
    );

    return this.getAttempt(attemptId, user);
  }

  async updateSectionProgress(
    attemptId: string,
    input: {
      sectionId: string;
      timeSpentSeconds: number;
      isCompleted: boolean;
    },
    user: CurrentUser,
  ) {
    const attempt = await this.requireActiveAttempt(attemptId, user);

    const exists = (attempt.sectionProgress || []).some(
      (sp: any) => sp.sectionId === input.sectionId,
    );

    if (exists) {
      await this.testAttemptModel.updateOne(
        {
          _id: attempt._id,
          'sectionProgress.sectionId': input.sectionId,
        },
        {
          $set: {
            'sectionProgress.$.timeSpentSeconds': Math.max(
              input.timeSpentSeconds,
              (attempt.sectionProgress || []).find(
                (sp: any) => sp.sectionId === input.sectionId,
              )?.timeSpentSeconds ?? 0,
            ),
            'sectionProgress.$.isCompleted': input.isCompleted,
          },
        },
      );
    } else {
      await this.testAttemptModel.updateOne(
        { _id: attempt._id },
        {
          $push: {
            sectionProgress: {
              sectionId: input.sectionId,
              name: input.sectionId,
              timeSpentSeconds: input.timeSpentSeconds,
              isCompleted: input.isCompleted,
            },
          },
        },
      );
    }

    return this.getAttempt(attemptId, user);
  }

  async submit(id: string, user: CurrentUser) {
    const attempt = await this.requireActiveAttempt(id, user);
    return this.scoreAndFinalizeAttempt(attempt, user);
  }

  private async autoFinalizeAttempt(attempt: any) {
    const endedAt = new Date();
    const startedAt = new Date(attempt.startedAt);
    const timeSpentSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    // Grade answers
    const { gradedAnswers, totalAwarded } = await this.gradeAnswers(attempt);

    await this.testAttemptModel.findByIdAndUpdate(attempt._id, {
      $set: {
        status: 'submitted',
        marksAwarded: totalAwarded,
        endedAt,
        timeSpentSeconds,
        answers: gradedAnswers,
      },
    });

    const doc = this.testAttemptModel.findById
      ? await this.testAttemptModel.findById(attempt._id).lean()
      : await this.testAttemptModel.findOne({ _id: attempt._id }).lean();
    return doc ? this.formatAttempt(doc, true) : null;
  }

  private async scoreAndFinalizeAttempt(attempt: any, user: CurrentUser) {
    const endedAt = new Date();
    const startedAt = new Date(attempt.startedAt);
    const timeSpentSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    const { gradedAnswers, totalAwarded } = await this.gradeAnswers(attempt);

    await this.testAttemptModel.findByIdAndUpdate(attempt._id, {
      $set: {
        status: 'submitted',
        marksAwarded: totalAwarded,
        endedAt,
        timeSpentSeconds,
        answers: gradedAnswers,
      },
    });

    return this.getAttempt(attempt._id.toString(), user);
  }

  private async gradeAnswers(attempt: any) {
    const rawAnswers = attempt.answers || [];
    const questionIds = rawAnswers
      .map((ans: any) => ans.questionId)
      .filter(Boolean);
    const questions =
      questionIds.length > 0
        ? await this.questionModel.find({ _id: { $in: questionIds } }).lean()
        : [];
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let totalAwarded = 0;
    const gradedAnswers = rawAnswers.map((answer: any) => {
      // 1. Snapshot takes precedence for immutable evaluation; fallback to live question document
      const snap = answer.questionSnapshot;
      const qDoc = snap || questionMap.get(answer.questionId.toString());

      if (!qDoc) {
        return {
          ...answer,
          isCorrect: false,
          marksAwarded: 0,
        };
      }

      const qType = qDoc.type || 'single_choice';
      let isCorrect = false;
      let isAnswered = false;

      if (qType === 'numerical') {
        const candidateValue = (answer.numericalValue || '').trim();
        const expectedValue = (qDoc.numericalAnswer || '').trim();
        isAnswered = candidateValue.length > 0;
        isCorrect =
          isAnswered &&
          candidateValue.toLowerCase() === expectedValue.toLowerCase();
      } else {
        const selectedIds = (answer.optionIds || [])
          .map((optId: any) => optId?.toString())
          .filter(Boolean)
          .sort();
        const correctIds = (qDoc.options || [])
          .filter((opt: any) => Boolean(opt?.isCorrect))
          .map((opt: any, idx: number) =>
            (opt?._id || opt?.id || `opt_${idx}`).toString(),
          )
          .sort();

        isAnswered = selectedIds.length > 0;
        isCorrect =
          isAnswered &&
          selectedIds.length === correctIds.length &&
          selectedIds.every(
            (val: string, idx: number) => val === correctIds[idx],
          );
      }

      const marksAwarded = !isAnswered
        ? 0
        : isCorrect
          ? answer.maximumMarks
          : -answer.negativeMarks;

      totalAwarded += marksAwarded;

      return {
        ...answer,
        isCorrect,
        marksAwarded,
      };
    });

    return { gradedAnswers, totalAwarded };
  }

  private async getExamQuestionsWithSnapshots(examQuestionItems: any[]) {
    if (!examQuestionItems || examQuestionItems.length === 0) return [];

    const qIds = examQuestionItems
      .map((item: any) => item?.questionId)
      .filter(Boolean);
    const questions =
      qIds.length > 0
        ? await this.questionModel.find({ _id: { $in: qIds } }).lean()
        : [];
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    return examQuestionItems
      .map((item: any) => {
        const qIdStr = item?.questionId?.toString();
        if (!qIdStr) return null;
        const qDoc = questionMap.get(qIdStr);
        if (!qDoc) return null;

        const options = (qDoc.options || []).map((opt: any, idx: number) => {
          const optionId = (
            opt?._id ||
            opt?.id ||
            new Types.ObjectId()
          ).toString();
          return {
            id: optionId,
            _id: optionId,
            content: typeof opt === 'string' ? opt : opt?.content || '',
            translations: opt?.translations || {},
            imageUrl: opt?.imageUrl || null,
            position: opt?.position ?? idx,
            isCorrect: Boolean(opt?.isCorrect),
          };
        });

        const snapshot = item.snapshot || {
          questionId: qDoc._id,
          content: qDoc.content,
          translations: qDoc.translations || {},
          explanation: qDoc.explanation || null,
          explanationTranslations: qDoc.explanationTranslations || {},
          type: qDoc.type,
          numericalAnswer: qDoc.numericalAnswer || null,
          options,
          marks: item.marks ?? qDoc.marks,
          negativeMarks: item.negativeMarks ?? qDoc.negativeMarks,
        };

        return {
          id: qDoc._id.toString(),
          _id: qDoc._id.toString(),
          sectionId: item.sectionId || null,
          content: qDoc.content,
          translations: qDoc.translations || {},
          subject: qDoc.subject,
          subjectId: qDoc.subjectId?.toString() || null,
          chapterId: qDoc.chapterId?.toString() || null,
          topic: qDoc.topic || null,
          type: qDoc.type,
          numericalAnswer: qDoc.numericalAnswer || null,
          difficulty: qDoc.difficulty,
          marks: item.marks ?? qDoc.marks,
          negativeMarks: item.negativeMarks ?? qDoc.negativeMarks,
          position: item.position,
          options: options.map((opt) => ({
            id: opt.id,
            _id: opt._id,
            content: opt.content,
            translations: opt.translations,
            imageUrl: opt.imageUrl,
            position: opt.position,
          })),
          snapshot,
        };
      })
      .filter(Boolean);
  }

  private async getExamQuestions(examDoc: any, includePrivate = false) {
    const rawQuestions = examDoc?.questions || [];
    return this.getExamQuestionsWithSnapshots(rawQuestions);
  }

  private async validateQuestionIds(ids: string[], requirePublished = false) {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      throw new BadRequestException('One or more question IDs are invalid.');
    }
    const count = await this.questionModel.countDocuments({
      _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
      ...(requirePublished ? { status: 'published' } : {}),
    });
    if (count !== ids.length) {
      throw new BadRequestException('One or more questions do not exist.');
    }
  }

  private async findManageable(id: string, user: CurrentUser) {
    this.assertEditor(user);
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Exam was not found.');
    }
    const doc = await this.examModel.findById(new Types.ObjectId(id)).lean();
    if (!doc) throw new NotFoundException('Exam was not found.');
    if (user.role !== 'admin' && doc.createdBy?.toString() !== user.id) {
      throw new ForbiddenException('You cannot manage this exam.');
    }
    return doc;
  }

  private async requireActiveAttempt(id: string, user: CurrentUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Exam attempt was not found.');
    }
    const doc = await this.testAttemptModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(user.id),
      })
      .lean();
    if (!doc) throw new NotFoundException('Exam attempt was not found.');
    if (doc.status !== 'in_progress') {
      throw new ConflictException('This exam attempt has already ended.');
    }
    if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= Date.now()) {
      await this.autoFinalizeAttempt(doc);
      throw new ConflictException(
        'This exam attempt has expired and was automatically finalized.',
      );
    }
    return doc;
  }

  private assertEditor(user: CurrentUser) {
    if (user.role === 'student') {
      throw new ForbiddenException('Editor access is required.');
    }
  }

  private formatExam(doc: any) {
    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description || null,
      type: doc.type,
      status: doc.status,
      subject: doc.subject || null,
      durationMinutes: doc.durationMinutes || null,
      createdBy: doc.createdBy?.toString() || null,
      questionsCount: doc.questions?.length || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private assertAdmin(user: CurrentUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin access is required.');
    }
  }

  async adminListAttempts(
    params: {
      search?: string;
      testSeriesId?: string;
      testId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number | string;
      offset?: number | string;
    },
    user: CurrentUser,
  ) {
    this.assertAdmin(user);

    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = Math.max(0, Number(params.offset) || 0);

    const matchQuery: Record<string, any> = {};

    if (
      params.status &&
      ['in_progress', 'submitted', 'abandoned'].includes(params.status)
    ) {
      matchQuery.status = params.status;
    }

    if (params.testId && Types.ObjectId.isValid(params.testId)) {
      matchQuery.testId = new Types.ObjectId(params.testId);
    }

    if (params.startDate || params.endDate) {
      matchQuery.startedAt = {};
      if (params.startDate) {
        matchQuery.startedAt.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.startedAt.$lte = end;
      }
    }

    // Pipeline to join user, exam, and test series
    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'testId',
          foreignField: '_id',
          as: 'exam',
        },
      },
      {
        $unwind: {
          path: '$exam',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'test_series',
          localField: 'exam.testSeriesId',
          foreignField: '_id',
          as: 'testSeries',
        },
      },
      {
        $unwind: {
          path: '$testSeries',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // Filter by testSeriesId if provided
    if (params.testSeriesId && Types.ObjectId.isValid(params.testSeriesId)) {
      pipeline.push({
        $match: {
          'exam.testSeriesId': new Types.ObjectId(params.testSeriesId),
        },
      });
    }

    // Filter by student search (name, email, or test title)
    if (params.search && params.search.trim()) {
      const term = params.search.trim();
      const regex = new RegExp(term, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: regex } },
            { 'user.email': { $regex: regex } },
            { 'exam.title': { $regex: regex } },
            { 'testSeries.title': { $regex: regex } },
          ],
        },
      });
    }

    // Facet for total count and paginated items
    pipeline.push({
      $facet: {
        total: [{ $count: 'count' }],
        items: [
          { $sort: { startedAt: -1, createdAt: -1 } },
          { $skip: offset },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              testId: 1,
              userId: 1,
              attemptNumber: 1,
              testVersion: 1,
              status: 1,
              marksAwarded: 1,
              maximumMarks: 1,
              startedAt: 1,
              endedAt: 1,
              timeSpentSeconds: 1,
              createdAt: 1,
              updatedAt: 1,
              'user._id': 1,
              'user.name': 1,
              'user.email': 1,
              'user.role': 1,
              'exam._id': 1,
              'exam.title': 1,
              'exam.testMode': 1,
              'exam.type': 1,
              'exam.durationMinutes': 1,
              'testSeries._id': 1,
              'testSeries.title': 1,
              'testSeries.slug': 1,
            },
          },
        ],
      },
    });

    const [result] = await this.testAttemptModel.aggregate(pipeline).exec();
    const total = result?.total?.[0]?.count || 0;
    const rawItems = result?.items || [];

    const items = rawItems.map((item: any) => ({
      id: item._id.toString(),
      _id: item._id.toString(),
      testId: item.testId?.toString() || '',
      userId: item.userId?.toString() || '',
      attemptNumber: item.attemptNumber || 1,
      testVersion: item.testVersion || 1,
      status: item.status,
      score: item.marksAwarded ?? 0,
      marksAwarded: item.marksAwarded ?? 0,
      maximumMarks: item.maximumMarks ?? 0,
      startedAt: item.startedAt,
      endedAt: item.endedAt || null,
      timeSpentSeconds: item.timeSpentSeconds || 0,
      createdAt: item.createdAt,
      user: item.user
        ? {
            id: item.user._id?.toString() || '',
            name: item.user.name || 'Unknown',
            email: item.user.email || '',
            role: item.user.role || 'student',
          }
        : null,
      test: item.exam
        ? {
            id: item.exam._id?.toString() || '',
            title: item.exam.title || 'Untitled Test',
            testMode: item.exam.testMode || 'legacy',
            type: item.exam.type,
            durationMinutes: item.exam.durationMinutes || null,
          }
        : null,
      testSeries: item.testSeries
        ? {
            id: item.testSeries._id?.toString() || '',
            title: item.testSeries.title || '',
            slug: item.testSeries.slug || '',
          }
        : null,
    }));

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  async adminGetAttempt(id: string, user: CurrentUser) {
    this.assertAdmin(user);

    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Exam attempt was not found.');
    }

    const doc = await this.testAttemptModel
      .findById(new Types.ObjectId(id))
      .lean();
    if (!doc) {
      throw new NotFoundException('Exam attempt was not found.');
    }

    // Hydrate user and test
    const [userDoc, examDoc] = await Promise.all([
      this.userModel.findById(doc.userId).select('name email role').lean(),
      this.examModel
        .findById(doc.testId)
        .select('title testMode type durationMinutes testSeriesId')
        .lean(),
    ]);

    let testSeriesDoc: any = null;
    if (examDoc?.testSeriesId) {
      testSeriesDoc = await this.testSeriesModel
        .findById(examDoc.testSeriesId)
        .select('title slug')
        .lean();
    }

    // Show correct answers, explanations, and scores ONLY if the attempt is submitted or ended.
    // If it is in_progress, exposeScore = false (do NOT leak answers/explanations).
    const exposeScore = doc.status !== 'in_progress';
    const formatted = this.formatAttempt(doc, exposeScore);

    return {
      ...formatted,
      user: userDoc
        ? {
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
          }
        : null,
      test: examDoc
        ? {
            id: examDoc._id.toString(),
            title: examDoc.title,
            testMode: examDoc.testMode,
            type: examDoc.type,
            durationMinutes: examDoc.durationMinutes,
          }
        : null,
      testSeries: testSeriesDoc
        ? {
            id: testSeriesDoc._id.toString(),
            title: testSeriesDoc.title,
            slug: testSeriesDoc.slug,
          }
        : null,
    };
  }

  private formatAttempt(doc: any, exposeScore: boolean) {
    if (!doc) return null;
    const testDoc =
      doc.testId && typeof doc.testId === 'object' && 'title' in doc.testId
        ? doc.testId
        : null;
    const testIdStr = (testDoc ? testDoc._id : doc.testId)?.toString() || '';
    return {
      id: doc._id?.toString() || '',
      _id: doc._id?.toString() || '',
      testId: testIdStr,
      test: testDoc
        ? {
            id: testDoc._id?.toString() || testIdStr,
            title: testDoc.title || 'Practice Test',
            testMode: testDoc.testMode,
            type: testDoc.type,
            durationMinutes: testDoc.durationMinutes,
            totalMarks: testDoc.totalMarks,
          }
        : null,
      userId: doc.userId?.toString() || '',
      attemptNumber: doc.attemptNumber || 1,
      testVersion: doc.testVersion || 1,
      status: doc.status,
      startedAt: doc.startedAt,
      endedAt: doc.endedAt || null,
      expiresAt: doc.expiresAt || null,
      timeSpentSeconds: doc.timeSpentSeconds || null,
      questionOrder: (doc.questionOrder || []).map((qId: any) =>
        qId?.toString(),
      ),
      sectionProgress: (doc.sectionProgress || []).map((sp: any) => ({
        sectionId: sp.sectionId,
        name: sp.name,
        timeSpentSeconds: sp.timeSpentSeconds || 0,
        isCompleted: sp.isCompleted || false,
      })),
      ...(exposeScore
        ? {
            marksAwarded: doc.marksAwarded,
            maximumMarks: doc.maximumMarks,
          }
        : {}),
      answers: (doc.answers || []).map((ans: any) => {
        const snap = ans.questionSnapshot;
        return {
          id: ans._id?.toString(),
          questionId: ans.questionId?.toString() || '',
          sectionId: ans.sectionId || null,
          subjectId: ans.subjectId?.toString() || null,
          chapterId: ans.chapterId?.toString() || null,
          topic: ans.topic || null,
          difficulty: ans.difficulty || null,
          optionIds: (ans.optionIds || []).map((id: any) => id.toString()),
          numericalValue: ans.numericalValue || null,
          status: ans.status || 'not_visited',
          timeSpentSeconds: ans.timeSpentSeconds || 0,
          visitedAt: ans.visitedAt || null,
          lastViewedAt: ans.lastViewedAt || null,
          answeredAt: ans.answeredAt || null,
          question: snap
            ? {
                id: (snap.questionId || ans.questionId)?.toString() || '',
                content: snap.content,
                translations: snap.translations || {},
                type: snap.type,
                options: (snap.options || []).map((opt: any, idx: number) => ({
                  id:
                    (opt?._id || opt?.id || `opt_${idx}`)?.toString() ||
                    `opt_${idx}`,
                  content: typeof opt === 'string' ? opt : opt?.content || '',
                  translations: opt?.translations || {},
                  imageUrl: opt?.imageUrl || null,
                  position: opt?.position ?? idx,
                  ...(exposeScore
                    ? { isCorrect: Boolean(opt?.isCorrect) }
                    : {}),
                })),
                marks: snap.marks,
                negativeMarks: snap.negativeMarks,
                ...(exposeScore
                  ? {
                      explanation: snap.explanation || null,
                      explanationTranslations:
                        snap.explanationTranslations || {},
                      numericalAnswer: snap.numericalAnswer || null,
                    }
                  : {}),
              }
            : null,
          ...(exposeScore
            ? {
                isCorrect: ans.isCorrect,
                marksAwarded: ans.marksAwarded,
                maximumMarks: ans.maximumMarks,
                negativeMarks: ans.negativeMarks,
              }
            : {}),
        };
      }),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
