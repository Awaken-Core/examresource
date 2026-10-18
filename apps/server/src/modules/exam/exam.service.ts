import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Exam,
  type ExamDocument,
  Question,
  type QuestionDocument,
  TestAttempt,
  type TestAttemptDocument,
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
      user.role === 'admin'
        ? {}
        : { createdBy: new Types.ObjectId(user.id) };

    const docs = await this.examModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .lean();
    return docs.map((doc) => this.formatExam(doc));
  }

  async create(input: CreateExamInput, user: CurrentUser) {
    this.assertEditor(user);
    const questionIds = input.questions.map((q) => q.questionId);
    await this.validateQuestionIds(questionIds);

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
    await this.findManageable(id, user);

    const updatePayload: Record<string, any> = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.type !== undefined) updatePayload.type = input.type;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.subject !== undefined) updatePayload.subject = input.subject;
    if (input.durationMinutes !== undefined) updatePayload.durationMinutes = input.durationMinutes;

    if (input.questions !== undefined) {
      const questionIds = input.questions.map((q) => q.questionId);
      await this.validateQuestionIds(questionIds);
      updatePayload.questions = input.questions.map((item, position) => ({
        questionId: new Types.ObjectId(item.questionId),
        position,
        marks: item.marks ?? null,
        negativeMarks: item.negativeMarks ?? null,
      }));
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
    const exam = await this.examModel.findById(examObjectId).lean();
    if (!exam) throw new NotFoundException('Exam was not found.');

    const userObjectId = new Types.ObjectId(user.id);
    const prevAttemptsCount = await this.testAttemptModel.countDocuments({
      testId: examObjectId,
      userId: userObjectId,
    });

    const activeAttempt = await this.testAttemptModel
      .findOne({
        testId: examObjectId,
        userId: userObjectId,
        status: 'in_progress',
      })
      .lean();

    if (activeAttempt) {
      return this.formatAttempt(activeAttempt, false);
    }

    // Hydrate questions to calculate maximumMarks and prepare answer slots
    const examQuestions = await this.getExamQuestions(exam, false);
    const totalMaxMarks = examQuestions.reduce(
      (sum: number, q: any) => sum + (q.marks || 1),
      0,
    );

    const initialAnswers = examQuestions.map((q: any) => ({
      _id: new Types.ObjectId(),
      questionId: new Types.ObjectId(q.id),
      optionIds: [],
      isCorrect: null,
      marksAwarded: 0,
      maximumMarks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      timeSpentSeconds: 0,
      answeredAt: null,
    }));

    const attempt = await this.testAttemptModel.create({
      testId: examObjectId,
      userId: userObjectId,
      attemptNumber: prevAttemptsCount + 1,
      status: 'in_progress',
      marksAwarded: 0,
      maximumMarks: totalMaxMarks,
      startedAt: new Date(),
      answers: initialAnswers,
    });

    return this.formatAttempt(attempt.toObject(), false);
  }

  async listAttempts(user: CurrentUser) {
    const docs = await this.testAttemptModel
      .find({ userId: new Types.ObjectId(user.id) })
      .sort({ startedAt: -1 })
      .lean();
    return docs.map((doc) => this.formatAttempt(doc, doc.status !== 'in_progress'));
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

    const answerIndex = attempt.answers.findIndex(
      (ans: any) => ans.questionId.toString() === questionId,
    );
    if (answerIndex === -1) {
      throw new NotFoundException('Question is not part of this exam attempt.');
    }

    if (input.optionIds.length > 0) {
      const question = await this.questionModel.findById(qObjectId).lean();
      if (!question) {
        throw new NotFoundException('Question was not found.');
      }
      const validOptionIds = new Set(
        question.options.map((opt: any) => opt._id.toString()),
      );
      for (const optId of input.optionIds) {
        if (!validOptionIds.has(optId)) {
          throw new BadRequestException('One or more options do not belong to this question.');
        }
      }
    }

    const selectedObjectIds = input.optionIds.map((optId) => new Types.ObjectId(optId));
    const now = input.optionIds.length > 0 ? new Date() : null;

    await this.testAttemptModel.updateOne(
      {
        _id: attempt._id,
        'answers.questionId': qObjectId,
      },
      {
        $set: {
          'answers.$.optionIds': selectedObjectIds,
          'answers.$.answeredAt': now,
          'answers.$.timeSpentSeconds': input.timeSpentSeconds ?? null,
        },
      },
    );

    return this.getAttempt(attemptId, user);
  }

  async submit(id: string, user: CurrentUser) {
    const attempt = await this.requireActiveAttempt(id, user);

    const questionIds = attempt.answers.map((ans: any) => ans.questionId);
    const questions = await this.questionModel
      .find({ _id: { $in: questionIds } })
      .lean();
    const questionMap = new Map(
      questions.map((q) => [q._id.toString(), q]),
    );

    let totalAwarded = 0;
    const gradedAnswers = attempt.answers.map((answer: any) => {
      const qDoc = questionMap.get(answer.questionId.toString());
      if (!qDoc) {
        return {
          ...answer,
          isCorrect: false,
          marksAwarded: 0,
        };
      }

      const selectedIds = (answer.optionIds || [])
        .map((optId: any) => optId.toString())
        .sort();

      const correctIds = (qDoc.options || [])
        .filter((opt: any) => opt.isCorrect)
        .map((opt: any) => opt._id.toString())
        .sort();

      const isCorrect =
        selectedIds.length > 0 &&
        selectedIds.length === correctIds.length &&
        selectedIds.every((val: string, idx: number) => val === correctIds[idx]);

      const marksAwarded =
        selectedIds.length === 0
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

    const endedAt = new Date();
    const startedAt = new Date(attempt.startedAt);
    const timeSpentSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    await this.testAttemptModel.findByIdAndUpdate(attempt._id, {
      $set: {
        status: 'submitted',
        marksAwarded: totalAwarded,
        endedAt,
        timeSpentSeconds,
        answers: gradedAnswers,
      },
    });

    return this.getAttempt(id, user);
  }

  private async getExamQuestions(examDoc: any, includeAnswers: boolean) {
    if (!examDoc.questions || examDoc.questions.length === 0) {
      return [];
    }
    const qIds = examDoc.questions.map((item: any) => item.questionId);
    const questions = await this.questionModel
      .find({ _id: { $in: qIds } })
      .lean();
    const questionMap = new Map(
      questions.map((q) => [q._id.toString(), q]),
    );

    return examDoc.questions
      .map((item: any) => {
        const qDoc = questionMap.get(item.questionId.toString());
        if (!qDoc) return null;

        const options = (qDoc.options || []).map((opt: any) => ({
          id: opt._id.toString(),
          _id: opt._id.toString(),
          content: opt.content,
          imageUrl: opt.imageUrl || null,
          position: opt.position,
          ...(includeAnswers ? { isCorrect: opt.isCorrect } : {}),
        }));

        return {
          id: qDoc._id.toString(),
          _id: qDoc._id.toString(),
          content: qDoc.content,
          subject: qDoc.subject,
          type: qDoc.type,
          difficulty: qDoc.difficulty,
          marks: item.marks ?? qDoc.marks,
          negativeMarks: item.negativeMarks ?? qDoc.negativeMarks,
          position: item.position,
          options,
          ...(includeAnswers ? { explanation: qDoc.explanation || null } : {}),
        };
      })
      .filter(Boolean);
  }

  private async validateQuestionIds(ids: string[]) {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      throw new BadRequestException('One or more question IDs are invalid.');
    }
    const count = await this.questionModel.countDocuments({
      _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
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

  private formatAttempt(doc: any, exposeScore: boolean) {
    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      testId: doc.testId.toString(),
      userId: doc.userId.toString(),
      attemptNumber: doc.attemptNumber,
      status: doc.status,
      startedAt: doc.startedAt,
      endedAt: doc.endedAt || null,
      timeSpentSeconds: doc.timeSpentSeconds || null,
      ...(exposeScore
        ? {
            marksAwarded: doc.marksAwarded,
            maximumMarks: doc.maximumMarks,
          }
        : {}),
      answers: (doc.answers || []).map((ans: any) => ({
        id: ans._id?.toString(),
        questionId: ans.questionId.toString(),
        optionIds: (ans.optionIds || []).map((id: any) => id.toString()),
        timeSpentSeconds: ans.timeSpentSeconds || 0,
        answeredAt: ans.answeredAt || null,
        ...(exposeScore
          ? {
              isCorrect: ans.isCorrect,
              marksAwarded: ans.marksAwarded,
              maximumMarks: ans.maximumMarks,
              negativeMarks: ans.negativeMarks,
            }
          : {}),
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
