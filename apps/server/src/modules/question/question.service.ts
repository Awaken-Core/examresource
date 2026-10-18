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
  Question,
  type QuestionDocument,
  ReportedQuestion,
  type ReportedQuestionDocument,
  SavedQuestion,
  type SavedQuestionDocument,
  Exam,
  type ExamDocument,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type {
  CreateQuestionsInput,
  ReportQuestionInput,
  UpdateQuestionInput,
} from './dto/question.dto.js';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(SavedQuestion.name)
    private readonly savedQuestionModel: Model<SavedQuestionDocument>,
    @InjectModel(ReportedQuestion.name)
    private readonly reportedQuestionModel: Model<ReportedQuestionDocument>,
    @InjectModel(Exam.name)
    private readonly examModel: Model<ExamDocument>,
  ) {}

  async listPublished() {
    const docs = await this.questionModel
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc) => this.formatQuestion(doc, false));
  }

  async getPublished(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Question was not found.');
    }
    const doc = await this.questionModel
      .findOne({ _id: new Types.ObjectId(id), status: 'published' })
      .lean();
    if (!doc) throw new NotFoundException('Question was not found.');
    return this.formatQuestion(doc, false);
  }

  async listManageable(user: CurrentUser) {
    this.assertEditor(user);
    const filter =
      user.role === 'admin'
        ? {}
        : { createdBy: new Types.ObjectId(user.id) };

    const docs = await this.questionModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .lean();
    return docs.map((doc) => this.formatQuestion(doc, true));
  }

  async createMany(input: CreateQuestionsInput, user: CurrentUser) {
    this.assertEditor(user);
    const userObjectId = new Types.ObjectId(user.id);
    const questionsToInsert = input.questions.map((item) => {
      const { options, ...rest } = item;
      return {
        ...rest,
        createdBy: userObjectId,
        options: options.map((option, position) => ({
          _id: new Types.ObjectId(),
          content: option.content,
          imageUrl: option.imageUrl || null,
          position,
          isCorrect: option.isCorrect,
        })),
      };
    });

    const insertedDocs = await this.questionModel.insertMany(questionsToInsert);
    return insertedDocs.map((doc) => this.formatQuestion(doc.toObject(), true));
  }

  async update(id: string, input: UpdateQuestionInput, user: CurrentUser) {
    const existing = await this.findManageable(id, user);

    if (input.type || input.options) {
      const effectiveType = input.type ?? existing.type;
      const effectiveOptions = input.options ?? existing.options;
      const correctCount = effectiveOptions.filter(
        (option) => option.isCorrect,
      ).length;
      if (
        correctCount === 0 ||
        (effectiveType === 'single_choice' && correctCount !== 1)
      ) {
        throw new BadRequestException(
          'The correct options do not match the question type.',
        );
      }
    }

    const { options, ...rest } = input;
    const updatePayload: Record<string, any> = { ...rest };
    if (options) {
      updatePayload.options = options.map((option, position) => ({
        _id: option.id && Types.ObjectId.isValid(option.id)
          ? new Types.ObjectId(option.id)
          : new Types.ObjectId(),
        content: option.content,
        imageUrl: option.imageUrl || null,
        position,
        isCorrect: option.isCorrect,
      }));
    }

    const updated = await this.questionModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: updatePayload },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Question was not found.');
    }
    return this.formatQuestion(updated, true);
  }

  async remove(id: string, user: CurrentUser) {
    await this.findManageable(id, user);
    const questionObjectId = new Types.ObjectId(id);
    const referencedByExam = await this.examModel.exists({
      'questions.questionId': questionObjectId,
    });
    if (referencedByExam) {
      throw new ConflictException(
        'This question is used in an exam. Archive it instead of deleting it.',
      );
    }
    await this.questionModel.findByIdAndDelete(questionObjectId);
    await this.savedQuestionModel.deleteMany({ questionId: questionObjectId });
    await this.reportedQuestionModel.deleteMany({ questionId: questionObjectId });
  }

  async listSaved(user: CurrentUser) {
    const userObjectId = new Types.ObjectId(user.id);
    const saved = await this.savedQuestionModel
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .populate('questionId')
      .lean();

    return saved
      .filter((item: any) => item.questionId?.status === 'published')
      .map((item: any) => ({
        id: item._id.toString(),
        _id: item._id.toString(),
        savedAt: item.createdAt,
        question: this.formatQuestion(item.questionId, false),
      }));
  }

  async save(questionId: string, user: CurrentUser) {
    await this.requirePublishedQuestion(questionId);
    try {
      const saved = await this.savedQuestionModel.create({
        userId: new Types.ObjectId(user.id),
        questionId: new Types.ObjectId(questionId),
      });
      return {
        id: saved._id.toString(),
        _id: saved._id.toString(),
        userId: user.id,
        questionId,
        createdAt: (saved as any).createdAt,
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Question is already saved.');
      }
      throw error;
    }
  }

  async unsave(questionId: string, user: CurrentUser) {
    if (!Types.ObjectId.isValid(questionId)) return;
    await this.savedQuestionModel.deleteOne({
      userId: new Types.ObjectId(user.id),
      questionId: new Types.ObjectId(questionId),
    });
  }

  async report(
    questionId: string,
    input: ReportQuestionInput,
    user: CurrentUser,
  ) {
    await this.requirePublishedQuestion(questionId);
    try {
      const report = await this.reportedQuestionModel.create({
        ...input,
        userId: new Types.ObjectId(user.id),
        questionId: new Types.ObjectId(questionId),
      });
      return {
        id: report._id.toString(),
        _id: report._id.toString(),
        userId: user.id,
        questionId,
        reason: report.reason,
        details: report.details,
        status: report.status,
        createdAt: (report as any).createdAt,
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('You have already reported this question.');
      }
      throw error;
    }
  }

  private async requireQuestion(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Question was not found.');
    }
    const doc = await this.questionModel.findById(new Types.ObjectId(id)).lean();
    if (!doc) throw new NotFoundException('Question was not found.');
    return doc;
  }

  private async requirePublishedQuestion(id: string) {
    const doc = await this.requireQuestion(id);
    if (doc.status !== 'published') {
      throw new NotFoundException('Question was not found.');
    }
    return doc;
  }

  private async findManageable(id: string, user: CurrentUser) {
    this.assertEditor(user);
    const doc = await this.requireQuestion(id);
    if (user.role !== 'admin' && doc.createdBy.toString() !== user.id) {
      throw new ForbiddenException('You cannot manage this question.');
    }
    return doc;
  }

  private assertEditor(user: CurrentUser) {
    if (user.role === 'student') {
      throw new ForbiddenException('Editor access is required.');
    }
  }

  private formatQuestion(doc: any, includeAnswers: boolean) {
    const options = (doc.options || []).map((option: any) => ({
      id: option._id?.toString() || option.id?.toString(),
      _id: option._id?.toString() || option.id?.toString(),
      questionId: doc._id.toString(),
      content: option.content,
      imageUrl: option.imageUrl || null,
      position: option.position,
      ...(includeAnswers ? { isCorrect: option.isCorrect } : {}),
    }));

    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      content: doc.content,
      type: doc.type,
      difficulty: doc.difficulty,
      status: doc.status,
      subject: doc.subject,
      topic: doc.topic || null,
      subtopic: doc.subtopic || null,
      tags: doc.tags || [],
      marks: doc.marks,
      negativeMarks: doc.negativeMarks,
      source: doc.source || null,
      createdBy: doc.createdBy?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      options,
      ...(includeAnswers ? { explanation: doc.explanation || null } : {}),
    };
  }
}
