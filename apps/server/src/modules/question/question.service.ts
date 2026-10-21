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
  Chapter,
  type ChapterDocument,
  Exam,
  type ExamDocument,
  Question,
  type QuestionDocument,
  ReportedQuestion,
  type ReportedQuestionDocument,
  SavedQuestion,
  type SavedQuestionDocument,
  Subject,
  type SubjectDocument,
  TestSeries,
  type TestSeriesDocument,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type {
  CreateQuestionsInput,
  GenerateQuestionsAiInput,
  ParseRawQuestionsAiInput,
  ReportQuestionInput,
  TranslateExplainAiInput,
  UpdateQuestionInput,
} from './dto/question.dto.js';
import { GeminiService } from '../blog/gemini.service.js';

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
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(TestSeries.name)
    private readonly testSeriesModel: Model<TestSeriesDocument>,
    @Optional()
    private readonly gemini?: GeminiService,
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

    // Fetch existing subjects and chapters to auto-resolve IDs and names
    const [allSubjects, allChapters] = await Promise.all([
      this.subjectModel.find().lean(),
      this.chapterModel.find().lean(),
    ]);
    const defaultSubject = allSubjects[0];

    const questionsToInsert = input.questions.map((item) => {
      const { options, ...rest } = item;

      let subjectId = item.subjectId && Types.ObjectId.isValid(item.subjectId)
        ? new Types.ObjectId(item.subjectId)
        : null;
      let subjectName = item.subject?.trim() || '';

      if (subjectId) {
        const found = allSubjects.find(
          (s) => s._id.toString() === subjectId!.toString(),
        );
        if (found) {
          subjectName = found.name;
        }
      } else if (subjectName) {
        const matched = allSubjects.find(
          (s) => s.name.trim().toLowerCase() === subjectName.toLowerCase(),
        );
        if (matched) {
          subjectId = matched._id;
          subjectName = matched.name;
        }
      } else if (defaultSubject) {
        subjectId = defaultSubject._id;
        subjectName = defaultSubject.name;
      }

      let chapterId = item.chapterId && Types.ObjectId.isValid(item.chapterId)
        ? new Types.ObjectId(item.chapterId)
        : null;
      let topic = item.topic?.trim() || null;

      if (chapterId) {
        const found = allChapters.find(
          (c) => c._id.toString() === chapterId!.toString(),
        );
        if (found) {
          topic = found.name;
          if (!subjectId && found.subjectId) {
            subjectId = found.subjectId;
            const sub = allSubjects.find(
              (s) => s._id.toString() === subjectId!.toString(),
            );
            if (sub) subjectName = sub.name;
          }
        }
      } else if (topic) {
        const matched = allChapters.find((c) => {
          const nameMatches = c.name.trim().toLowerCase() === topic!.toLowerCase();
          if (!nameMatches) return false;
          if (subjectId) {
            return c.subjectId?.toString() === subjectId.toString();
          }
          return true;
        });
        if (matched) {
          chapterId = matched._id;
          topic = matched.name;
          if (!subjectId && matched.subjectId) {
            subjectId = matched.subjectId;
            const sub = allSubjects.find(
              (s) => s._id.toString() === subjectId!.toString(),
            );
            if (sub) subjectName = sub.name;
          }
        }
      }

      return {
        ...rest,
        subject: subjectName,
        subjectId,
        chapterId,
        topic,
        createdBy: userObjectId,
        options: options.map((option, position) => ({
          _id: new Types.ObjectId(),
          content: option.content,
          imageUrl: option.imageUrl || null,
          position,
          isCorrect: option.isCorrect,
          translations: option.translations || {},
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

    if (updatePayload.subjectId && Types.ObjectId.isValid(updatePayload.subjectId)) {
      updatePayload.subjectId = new Types.ObjectId(updatePayload.subjectId);
    }
    if (updatePayload.chapterId && Types.ObjectId.isValid(updatePayload.chapterId)) {
      updatePayload.chapterId = new Types.ObjectId(updatePayload.chapterId);
    }

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

  async generateAiQuestions(input: GenerateQuestionsAiInput, user: CurrentUser) {
    this.assertEditor(user);
    if (!this.gemini) {
      throw new BadRequestException('AI Question Service is not available.');
    }
    return this.gemini.generateQuestions(input);
  }

  async translateAndExplainAi(input: TranslateExplainAiInput, user: CurrentUser) {
    this.assertEditor(user);
    if (!this.gemini) {
      throw new BadRequestException('AI Question Service is not available.');
    }
    return this.gemini.translateAndExplainQuestion(input);
  }

  async parseRawQuestionsAi(input: ParseRawQuestionsAiInput, user: CurrentUser) {
    this.assertEditor(user);
    if (!this.gemini) {
      throw new BadRequestException('AI Question Service is not available.');
    }
    return this.gemini.parseRawQuestions(input);
  }

  private formatQuestion(doc: any, includeAnswers: boolean) {
    const options = (doc.options || []).map((option: any) => ({
      id: option._id?.toString() || option.id?.toString(),
      _id: option._id?.toString() || option.id?.toString(),
      questionId: doc._id.toString(),
      content: option.content,
      translations: option.translations || {},
      imageUrl: option.imageUrl || null,
      position: option.position,
      ...(includeAnswers ? { isCorrect: option.isCorrect } : {}),
    }));

    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      content: doc.content,
      translations: doc.translations || {},
      type: doc.type,
      difficulty: doc.difficulty,
      status: doc.status,
      subject: doc.subject,
      subjectId: doc.subjectId?.toString() || null,
      chapterId: doc.chapterId?.toString() || null,
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
      ...(includeAnswers
        ? {
            explanation: doc.explanation || null,
            explanationTranslations: doc.explanationTranslations || {},
          }
        : {}),
    };
  }
}

