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
  Chapter,
  type ChapterDocument,
  Exam,
  type ExamDocument,
  Question,
  type QuestionDocument,
  QuestionMapping,
  type QuestionMappingDocument,
  Subject,
  type SubjectDocument,
  TestSeries,
  type TestSeriesDocument,
  TestSeriesSubject,
  type TestSeriesSubjectDocument,
  TestAttempt,
  type TestAttemptDocument,
} from '../../core/schema/index.js';
import type { CurrentUser } from '../auth/auth.service.js';
import type {
  AssignSubjectInput,
  CreateChapterInput,
  CreateIndividualTestInput,
  CreateQuestionMappingInput,
  CreateSubjectInput,
  CreateTestSeriesInput,
  ListIndividualTestsQueryInput,
  QuestionBankQueryInput,
  ReorderChaptersInput,
  TestQuestionItemInput,
  TestSectionInput,
  UpdateChapterInput,
  UpdateIndividualTestInput,
  UpdateQuestionMappingInput,
  UpdateSubjectAssignmentInput,
  UpdateSubjectInput,
  UpdateTestSeriesInput,
  UpdateTestStatusInput,
} from './dto/test-series.dto.js';

@Injectable()
export class TestSeriesService {
  constructor(
    @InjectModel(TestSeries.name)
    private readonly testSeriesModel: Model<TestSeriesDocument>,
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<SubjectDocument>,
    @InjectModel(TestSeriesSubject.name)
    private readonly testSeriesSubjectModel: Model<TestSeriesSubjectDocument>,
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Exam.name)
    private readonly examModel: Model<ExamDocument>,
    @InjectModel(QuestionMapping.name)
    private readonly questionMappingModel: Model<QuestionMappingDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(TestAttempt.name)
    private readonly testAttemptModel: Model<TestAttemptDocument>,
  ) {}

  // =========================================================================
  // 1. TEST SERIES MANAGEMENT
  // =========================================================================

  async listPublished(category?: string) {
    const filter: Record<string, any> = { status: 'published' };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const docs: any[] = await this.testSeriesModel
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return docs.map((doc) => this.formatTestSeries(doc));
  }

  async getPublished(idOrSlug: string) {
    const isObjectId = Types.ObjectId.isValid(idOrSlug);
    const filter: Record<string, any> = isObjectId
      ? { _id: new Types.ObjectId(idOrSlug), status: 'published' }
      : { slug: idOrSlug.toLowerCase(), status: 'published' };

    const doc: any = await this.testSeriesModel.findOne(filter).lean();
    if (!doc) {
      throw new NotFoundException('Test series was not found.');
    }

    // Hydrate assigned subjects and chapters for published view (published chapters only)
    const subjects = await this.listSubjectsForSeries(doc._id.toString(), true);
    return {
      ...this.formatTestSeries(doc),
      subjects,
    };
  }

  async listManageable(user: CurrentUser) {
    this.assertEditor(user);
    const filter: Record<string, any> =
      user.role === 'admin'
        ? {}
        : {
            $or: [
              { createdBy: new Types.ObjectId(user.id) },
              { status: 'published' },
            ],
          };

    const docs: any[] = await this.testSeriesModel
      .find(filter)
      .sort({ order: 1, updatedAt: -1 })
      .lean();

    return docs.map((doc) => this.formatTestSeries(doc));
  }

  async getManageable(id: string, user: CurrentUser) {
    this.assertEditor(user);
    const doc = await this.findSeriesById(id);
    return this.formatTestSeries(doc);
  }

  async create(input: CreateTestSeriesInput, user: CurrentUser) {
    this.assertEditor(user);

    const existingSlug = await this.testSeriesModel.findOne({
      slug: input.slug.toLowerCase(),
    });
    if (existingSlug) {
      throw new ConflictException('A test series with this slug already exists.');
    }

    // Only admins can publish directly; editors create as draft
    const status = user.role === 'admin' ? input.status : 'draft';

    const created = await this.testSeriesModel.create({
      ...input,
      slug: input.slug.toLowerCase(),
      status,
      createdBy: new Types.ObjectId(user.id),
    });

    return this.formatTestSeries(created.toObject());
  }

  async update(id: string, input: UpdateTestSeriesInput, user: CurrentUser) {
    this.assertEditor(user);
    const existing = await this.findSeriesById(id);

    if (input.slug && input.slug.toLowerCase() !== existing.slug) {
      const slugTaken = await this.testSeriesModel.findOne({
        slug: input.slug.toLowerCase(),
        _id: { $ne: existing._id },
      });
      if (slugTaken) {
        throw new ConflictException('A test series with this slug already exists.');
      }
    }

    if (input.status && input.status !== existing.status && user.role !== 'admin') {
      throw new ForbiddenException(
        'Only administrators can publish or archive a test series.',
      );
    }

    const updatePayload: Record<string, any> = { ...input };
    if (input.slug) {
      updatePayload.slug = input.slug.toLowerCase();
    }

    const updated = await this.testSeriesModel
      .findByIdAndUpdate(
        existing._id,
        { $set: updatePayload },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Test series was not found.');
    }
    return this.formatTestSeries(updated);
  }

  async updateStatus(
    id: string,
    status: 'draft' | 'published' | 'archived',
    user: CurrentUser,
  ) {
    this.assertAdmin(user);
    const existing = await this.findSeriesById(id);

    const updated = await this.testSeriesModel
      .findByIdAndUpdate(
        existing._id,
        { $set: { status } },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Test series was not found.');
    }
    return this.formatTestSeries(updated);
  }

  async remove(id: string, user: CurrentUser) {
    this.assertAdmin(user);
    const existing = await this.findSeriesById(id);

    // Safety checks against dependent items
    const [dependentTests, dependentChapters, dependentMappings] = await Promise.all([
      this.examModel.countDocuments({ testSeriesId: existing._id }),
      this.chapterModel.countDocuments({ testSeriesId: existing._id }),
      this.questionMappingModel.countDocuments({ testSeriesId: existing._id }),
    ]);

    if (dependentTests > 0 || dependentChapters > 0 || dependentMappings > 0) {
      throw new ConflictException(
        `Cannot delete test series because it has ${dependentTests} test(s), ${dependentChapters} chapter(s), and ${dependentMappings} question mapping(s). Archive it instead.`,
      );
    }

    // Clean up subject associations for this series
    await this.testSeriesSubjectModel.deleteMany({ testSeriesId: existing._id });
    await this.testSeriesModel.findByIdAndDelete(existing._id);
  }

  // =========================================================================
  // 2. SHARED SUBJECT MANAGEMENT
  // =========================================================================

  async listSubjects(search?: string) {
    const filter: Record<string, any> = {};
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const docs = await this.subjectModel.find(filter).sort({ name: 1 }).lean();
    return docs.map((doc) => this.formatSubject(doc));
  }

  async getSubject(id: string) {
    const doc = await this.findSubjectById(id);
    return this.formatSubject(doc);
  }

  async createSubject(input: CreateSubjectInput, user: CurrentUser) {
    this.assertEditor(user);

    const existingName = await this.subjectModel.findOne({
      $or: [
        { name: { $regex: `^${input.name.trim()}$`, $options: 'i' } },
        { slug: input.slug.toLowerCase() },
      ],
    });

    if (existingName) {
      throw new ConflictException(
        'A subject with this name or slug already exists.',
      );
    }

    const created = await this.subjectModel.create({
      ...input,
      slug: input.slug.toLowerCase(),
      createdBy: new Types.ObjectId(user.id),
    });

    return this.formatSubject(created.toObject());
  }

  async updateSubject(id: string, input: UpdateSubjectInput, user: CurrentUser) {
    this.assertEditor(user);
    const existing = await this.findSubjectById(id);

    if (input.name && input.name.trim() !== existing.name) {
      const nameConflict = await this.subjectModel.findOne({
        name: { $regex: `^${input.name.trim()}$`, $options: 'i' },
        _id: { $ne: existing._id },
      });
      if (nameConflict) {
        throw new ConflictException('A subject with this name already exists.');
      }
    }

    if (input.slug && input.slug.toLowerCase() !== existing.slug) {
      const slugConflict = await this.subjectModel.findOne({
        slug: input.slug.toLowerCase(),
        _id: { $ne: existing._id },
      });
      if (slugConflict) {
        throw new ConflictException('A subject with this slug already exists.');
      }
    }

    const updatePayload: Record<string, any> = { ...input };
    if (input.slug) updatePayload.slug = input.slug.toLowerCase();

    const updated = await this.subjectModel
      .findByIdAndUpdate(
        existing._id,
        { $set: updatePayload },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Subject was not found.');
    }
    return this.formatSubject(updated);
  }

  async removeSubject(id: string, user: CurrentUser) {
    this.assertAdmin(user);
    const existing = await this.findSubjectById(id);

    // Safe deletion: verify no active usages
    const [assignedSeries, dependentTests, dependentChapters, dependentMappings] =
      await Promise.all([
        this.testSeriesSubjectModel.countDocuments({ subjectId: existing._id }),
        this.examModel.countDocuments({ subjectId: existing._id }),
        this.chapterModel.countDocuments({ subjectId: existing._id }),
        this.questionMappingModel.countDocuments({ subjectId: existing._id }),
      ]);

    if (
      assignedSeries > 0 ||
      dependentTests > 0 ||
      dependentChapters > 0 ||
      dependentMappings > 0
    ) {
      throw new ConflictException(
        `Cannot delete subject "${existing.name}" because it is assigned to ${assignedSeries} test series, ${dependentTests} test(s), ${dependentChapters} chapter(s), and ${dependentMappings} question mapping(s).`,
      );
    }

    await this.subjectModel.findByIdAndDelete(existing._id);
  }

  // =========================================================================
  // 3. TEST SERIES <-> SUBJECT ASSIGNMENT
  // =========================================================================

  async listSubjectsForSeries(seriesId: string, onlyPublishedChapters = false) {
    const series = await this.findSeriesById(seriesId);

    const assignments = await this.testSeriesSubjectModel
      .find({ testSeriesId: series._id })
      .sort({ order: 1 })
      .populate<{ subjectId: SubjectDocument }>('subjectId')
      .lean();

    const subjectIds = assignments
      .map((a) => a.subjectId?._id)
      .filter(Boolean);

    // Fetch chapters for these subjects within this specific TestSeries
    const chapterFilter: Record<string, any> = {
      testSeriesId: series._id,
      subjectId: { $in: subjectIds },
      ...(onlyPublishedChapters ? { status: 'published' } : {}),
    };

    const chapters = await this.chapterModel
      .find(chapterFilter)
      .sort({ order: 1, name: 1 })
      .lean();

    const chaptersBySubject = new Map<string, any[]>();
    for (const chap of chapters) {
      const sId = chap.subjectId.toString();
      if (!chaptersBySubject.has(sId)) {
        chaptersBySubject.set(sId, []);
      }
      chaptersBySubject.get(sId)!.push(this.formatChapter(chap));
    }

    return assignments
      .filter((a) => a.subjectId)
      .map((a) => {
        const sub = a.subjectId as any;
        const subIdStr = sub._id.toString();
        return {
          id: a._id.toString(),
          _id: a._id.toString(),
          testSeriesId: series._id.toString(),
          subjectId: subIdStr,
          name: sub.name,
          slug: sub.slug,
          customDisplayName: a.customDisplayName || sub.name,
          description: sub.description || null,
          iconUrl: sub.iconUrl || null,
          order: a.order,
          chapters: chaptersBySubject.get(subIdStr) || [],
        };
      });
  }

  async listManageableSubjectsForSeries(seriesId: string, user: CurrentUser) {
    this.assertEditor(user);
    // Editors and admins need to see all chapters including drafts
    return this.listSubjectsForSeries(seriesId, false);
  }

  async assignSubject(
    seriesId: string,
    input: AssignSubjectInput,
    user: CurrentUser,
  ) {
    this.assertEditor(user);
    const series = await this.findSeriesById(seriesId);
    const subject = await this.findSubjectById(input.subjectId);

    const existingAssignment = await this.testSeriesSubjectModel.findOne({
      testSeriesId: series._id,
      subjectId: subject._id,
    });

    if (existingAssignment) {
      throw new ConflictException(
        `Subject "${subject.name}" is already assigned to this test series.`,
      );
    }

    const created = await this.testSeriesSubjectModel.create({
      testSeriesId: series._id,
      subjectId: subject._id,
      order: input.order ?? 0,
      customDisplayName: input.customDisplayName ?? null,
    });

    return {
      id: created._id.toString(),
      _id: created._id.toString(),
      testSeriesId: series._id.toString(),
      subjectId: subject._id.toString(),
      name: subject.name,
      slug: subject.slug,
      customDisplayName: created.customDisplayName || subject.name,
      order: created.order,
    };
  }

  async updateSubjectAssignment(
    seriesId: string,
    subjectId: string,
    input: UpdateSubjectAssignmentInput,
    user: CurrentUser,
  ) {
    this.assertEditor(user);
    const series = await this.findSeriesById(seriesId);
    const subject = await this.findSubjectById(subjectId);

    const existing = await this.testSeriesSubjectModel.findOne({
      testSeriesId: series._id,
      subjectId: subject._id,
    });

    if (!existing) {
      throw new NotFoundException(
        'Subject is not assigned to this test series.',
      );
    }

    const payload: Record<string, any> = {};
    if (input.order !== undefined) payload.order = input.order;
    if (input.customDisplayName !== undefined) {
      payload.customDisplayName = input.customDisplayName;
    }

    const updated = await this.testSeriesSubjectModel
      .findByIdAndUpdate(existing._id, { $set: payload }, { new: true })
      .lean();

    return {
      id: updated!._id.toString(),
      _id: updated!._id.toString(),
      testSeriesId: series._id.toString(),
      subjectId: subject._id.toString(),
      name: subject.name,
      slug: subject.slug,
      customDisplayName: updated!.customDisplayName || subject.name,
      order: updated!.order,
    };
  }

  async removeSubjectAssignment(
    seriesId: string,
    subjectId: string,
    user: CurrentUser,
  ) {
    this.assertAdmin(user);
    const series = await this.findSeriesById(seriesId);
    const subject = await this.findSubjectById(subjectId);

    const assignment = await this.testSeriesSubjectModel.findOne({
      testSeriesId: series._id,
      subjectId: subject._id,
    });

    if (!assignment) {
      throw new NotFoundException(
        'Subject is not assigned to this test series.',
      );
    }

    // Safety checks: ensure no chapters, tests, or question mappings depend on this series-subject combo
    const [dependentChapters, dependentTests, dependentMappings] = await Promise.all([
      this.chapterModel.countDocuments({
        testSeriesId: series._id,
        subjectId: subject._id,
      }),
      this.examModel.countDocuments({
        testSeriesId: series._id,
        subjectId: subject._id,
      }),
      this.questionMappingModel.countDocuments({
        testSeriesId: series._id,
        subjectId: subject._id,
      }),
    ]);

    if (dependentChapters > 0 || dependentTests > 0 || dependentMappings > 0) {
      throw new ConflictException(
        `Cannot remove subject "${subject.name}" from this test series because it has ${dependentChapters} chapter(s), ${dependentTests} test(s), and ${dependentMappings} question mapping(s) linked to it.`,
      );
    }

    await this.testSeriesSubjectModel.findByIdAndDelete(assignment._id);
  }

  // =========================================================================
  // 4. EXAM-SPECIFIC CHAPTER MANAGEMENT
  // =========================================================================

  async listChapters(
    seriesId: string,
    subjectId: string,
    user?: CurrentUser,
  ) {
    const series = await this.findSeriesById(seriesId);
    const subject = await this.findSubjectById(subjectId);

    const isAssigned = await this.testSeriesSubjectModel.exists({
      testSeriesId: series._id,
      subjectId: subject._id,
    });

    if (!isAssigned) {
      throw new BadRequestException(
        'Subject is not assigned to this test series.',
      );
    }

    const isEditorOrAdmin =
      user && (user.role === 'admin' || user.role === 'editor');

    // Public visibility safeguard: if not editor/admin, series must be published
    if (!isEditorOrAdmin && series.status !== 'published') {
      throw new NotFoundException('Test series was not found.');
    }

    const filter: Record<string, any> = {
      testSeriesId: series._id,
      subjectId: subject._id,
      ...(isEditorOrAdmin ? {} : { status: 'published' }),
    };

    const docs = await this.chapterModel
      .find(filter)
      .sort({ order: 1, name: 1 })
      .lean();

    return docs.map((doc) => this.formatChapter(doc));
  }

  async listAllChapters(subjectId?: string, user?: CurrentUser) {
    if (user) this.assertEditor(user);
    const filter: Record<string, any> = {};
    if (subjectId && Types.ObjectId.isValid(subjectId)) {
      filter.subjectId = new Types.ObjectId(subjectId);
    }
    const docs = await this.chapterModel
      .find(filter)
      .sort({ order: 1, name: 1 })
      .lean();
    return docs.map((doc) => this.formatChapter(doc));
  }

  async getChapter(id: string) {
    const doc = await this.findChapterById(id);
    return this.formatChapter(doc);
  }

  async createChapter(
    seriesId: string,
    input: CreateChapterInput,
    user: CurrentUser,
  ) {
    this.assertEditor(user);
    const series = await this.findSeriesById(seriesId);
    const subject = await this.findSubjectById(input.subjectId);

    // Verify subject is assigned to this TestSeries
    const isAssigned = await this.testSeriesSubjectModel.exists({
      testSeriesId: series._id,
      subjectId: subject._id,
    });

    if (!isAssigned) {
      throw new BadRequestException(
        `Subject "${subject.name}" is not assigned to this test series. Assign the subject before creating chapters.`,
      );
    }

    // Verify slug uniqueness within this TestSeries + Subject
    const slugTaken = await this.chapterModel.findOne({
      testSeriesId: series._id,
      subjectId: subject._id,
      slug: input.slug.toLowerCase(),
    });

    if (slugTaken) {
      throw new ConflictException(
        'A chapter with this slug already exists for this subject in this test series.',
      );
    }

    const created = await this.chapterModel.create({
      ...input,
      slug: input.slug.toLowerCase(),
      testSeriesId: series._id,
      subjectId: subject._id,
      createdBy: new Types.ObjectId(user.id),
    });

    return this.formatChapter(created.toObject());
  }

  async updateChapter(
    id: string,
    input: UpdateChapterInput,
    user: CurrentUser,
  ) {
    this.assertEditor(user);
    const chapter = await this.findChapterById(id);

    if (input.slug && input.slug.toLowerCase() !== chapter.slug) {
      const slugTaken = await this.chapterModel.findOne({
        testSeriesId: chapter.testSeriesId,
        subjectId: chapter.subjectId,
        slug: input.slug.toLowerCase(),
        _id: { $ne: chapter._id },
      });
      if (slugTaken) {
        throw new ConflictException(
          'A chapter with this slug already exists for this subject in this test series.',
        );
      }
    }

    const updatePayload: Record<string, any> = { ...input };
    if (input.slug) updatePayload.slug = input.slug.toLowerCase();

    const updated = await this.chapterModel
      .findByIdAndUpdate(
        chapter._id,
        { $set: updatePayload },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Chapter was not found.');
    }
    return this.formatChapter(updated);
  }

  async reorderChapters(
    seriesId: string,
    subjectId: string,
    input: ReorderChaptersInput,
    user: CurrentUser,
  ) {
    this.assertEditor(user);
    const series = await this.findSeriesById(seriesId);
    const subject = await this.findSubjectById(subjectId);

    const updatePromises = input.orders.map((item) => {
      if (!Types.ObjectId.isValid(item.chapterId)) {
        throw new BadRequestException(`Invalid chapter ID: ${item.chapterId}`);
      }
      return this.chapterModel.updateOne(
        {
          _id: new Types.ObjectId(item.chapterId),
          testSeriesId: series._id,
          subjectId: subject._id,
        },
        { $set: { order: item.order } },
      );
    });

    await Promise.all(updatePromises);
    return this.listChapters(seriesId, subjectId, user);
  }

  async removeChapter(id: string, user: CurrentUser) {
    this.assertAdmin(user);
    const chapter = await this.findChapterById(id);

    // Safe deletion: verify no tests or question mappings depend on this chapter
    const [dependentTests, dependentMappings] = await Promise.all([
      this.examModel.countDocuments({ chapterId: chapter._id }),
      this.questionMappingModel.countDocuments({ chapterId: chapter._id }),
    ]);

    if (dependentTests > 0 || dependentMappings > 0) {
      throw new ConflictException(
        `Cannot delete chapter "${chapter.name}" because it is linked to ${dependentTests} test(s) and ${dependentMappings} question mapping(s).`,
      );
    }

    await this.chapterModel.findByIdAndDelete(chapter._id);
  }

  // =========================================================================
  // 5. QUESTION MAPPING MANAGEMENT (CENTRAL QUESTION BANK REUSE)
  // =========================================================================

  async listMappings(
    seriesId: string,
    subjectId: string,
    chapterId?: string,
    user?: CurrentUser,
  ) {
    const series = await this.findSeriesById(seriesId);
    const subject = await this.findSubjectById(subjectId);

    const isAssigned = await this.testSeriesSubjectModel.exists({
      testSeriesId: series._id,
      subjectId: subject._id,
    });
    if (!isAssigned) {
      throw new BadRequestException('Subject is not assigned to this test series.');
    }

    const isEditorOrAdmin = user && (user.role === 'admin' || user.role === 'editor');
    if (!isEditorOrAdmin && series.status !== 'published') {
      throw new NotFoundException('Test series was not found.');
    }

    const filter: Record<string, any> = {
      testSeriesId: series._id,
      subjectId: subject._id,
    };

    if (chapterId) {
      if (!Types.ObjectId.isValid(chapterId)) {
        throw new BadRequestException('Invalid chapter ID.');
      }
      filter.chapterId = new Types.ObjectId(chapterId);
    }

    const mappings = await this.questionMappingModel
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate<{ questionId: QuestionDocument }>('questionId')
      .lean();

    return mappings
      .filter((m) => {
        if (!m.questionId) return false;
        if (!isEditorOrAdmin && (m.questionId as any).status !== 'published') {
          return false;
        }
        return true;
      })
      .map((m) => this.formatQuestionMapping(m, Boolean(isEditorOrAdmin)));
  }

  async getMapping(mappingId: string, user: CurrentUser) {
    this.assertEditor(user);
    if (!Types.ObjectId.isValid(mappingId)) {
      throw new BadRequestException('Invalid question mapping ID.');
    }
    const doc = await this.questionMappingModel
      .findById(new Types.ObjectId(mappingId))
      .populate<{ questionId: QuestionDocument }>('questionId')
      .lean();

    if (!doc) {
      throw new NotFoundException('Question mapping was not found.');
    }
    return this.formatQuestionMapping(doc, true);
  }

  async createMapping(input: CreateQuestionMappingInput, user: CurrentUser) {
    this.assertEditor(user);

    // 1. Verify question exists
    if (!Types.ObjectId.isValid(input.questionId)) {
      throw new BadRequestException('Invalid question ID.');
    }
    const question = await this.questionModel.findById(
      new Types.ObjectId(input.questionId),
    ).lean();
    if (!question) {
      throw new NotFoundException('Question was not found.');
    }

    // 2. Verify test series exists
    const series = await this.findSeriesById(input.testSeriesId);

    // 3. Verify subject exists and is assigned to this test series
    const subject = await this.findSubjectById(input.subjectId);
    const isAssigned = await this.testSeriesSubjectModel.exists({
      testSeriesId: series._id,
      subjectId: subject._id,
    });
    if (!isAssigned) {
      throw new BadRequestException(
        `Subject "${subject.name}" is not assigned to test series "${series.title}".`,
      );
    }

    // 4. If chapterId is provided, verify it belongs to this test series and subject
    let chapterObjectId: Types.ObjectId | null = null;
    if (input.chapterId) {
      if (!Types.ObjectId.isValid(input.chapterId)) {
        throw new BadRequestException('Invalid chapter ID.');
      }
      chapterObjectId = new Types.ObjectId(input.chapterId);
      const chapter = await this.chapterModel.findOne({
        _id: chapterObjectId,
        testSeriesId: series._id,
        subjectId: subject._id,
      }).lean();

      if (!chapter) {
        throw new BadRequestException(
          'Chapter does not belong to the selected test series and subject.',
        );
      }
    }

    // 5. Prevent duplicate mapping
    const existing = await this.questionMappingModel.findOne({
      questionId: question._id,
      subjectId: subject._id,
      testSeriesId: series._id,
      chapterId: chapterObjectId,
    });

    if (existing) {
      throw new ConflictException(
        'This question is already mapped to this subject and chapter within this test series.',
      );
    }

    const created = await this.questionMappingModel.create({
      questionId: question._id,
      subjectId: subject._id,
      testSeriesId: series._id,
      chapterId: chapterObjectId,
      order: input.order ?? 0,
      createdBy: new Types.ObjectId(user.id),
    });

    const populated = await this.questionMappingModel
      .findById(created._id)
      .populate<{ questionId: QuestionDocument }>('questionId')
      .lean();

    return this.formatQuestionMapping(populated!, true);
  }

  async updateMapping(
    mappingId: string,
    input: UpdateQuestionMappingInput,
    user: CurrentUser,
  ) {
    this.assertEditor(user);
    if (!Types.ObjectId.isValid(mappingId)) {
      throw new NotFoundException('Question mapping was not found.');
    }
    const mapping = await this.questionMappingModel.findById(new Types.ObjectId(mappingId));
    if (!mapping) throw new NotFoundException('Question mapping was not found.');

    const updatePayload: Record<string, any> = {};

    if (input.order !== undefined) {
      updatePayload.order = input.order;
    }

    if (input.chapterId !== undefined) {
      if (input.chapterId === null) {
        updatePayload.chapterId = null;
      } else {
        if (!Types.ObjectId.isValid(input.chapterId)) {
          throw new BadRequestException('Invalid chapter ID.');
        }
        const chapter = await this.chapterModel.findOne({
          _id: new Types.ObjectId(input.chapterId),
          testSeriesId: mapping.testSeriesId,
          subjectId: mapping.subjectId,
        }).lean();

        if (!chapter) {
          throw new BadRequestException(
            'Chapter does not belong to the test series and subject of this mapping.',
          );
        }
        updatePayload.chapterId = new Types.ObjectId(input.chapterId);
      }
    }

    const updated = await this.questionMappingModel
      .findByIdAndUpdate(mapping._id, { $set: updatePayload }, { new: true })
      .populate<{ questionId: QuestionDocument }>('questionId')
      .lean();

    return this.formatQuestionMapping(updated!, true);
  }

  async removeMapping(mappingId: string, user: CurrentUser) {
    this.assertAdmin(user);
    if (!Types.ObjectId.isValid(mappingId)) {
      throw new NotFoundException('Question mapping was not found.');
    }
    const mapping = await this.questionMappingModel.findById(new Types.ObjectId(mappingId));
    if (!mapping) throw new NotFoundException('Question mapping was not found.');

    // Deleting mapping strictly unlinks the relationship; does NOT delete the question
    await this.questionMappingModel.findByIdAndDelete(mapping._id);
  }

  // =========================================================================
  // 6. QUESTION BANK SEARCH & SELECTION (CANDIDATE POOL FOR TESTS)
  // =========================================================================

  async searchQuestionBank(query: QuestionBankQueryInput, user: CurrentUser) {
    this.assertEditor(user);

    const filter: Record<string, any> = {};

    if (query.search && query.search.trim()) {
      filter.content = { $regex: query.search.trim(), $options: 'i' };
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }

    if (query.subject && query.subject.trim()) {
      filter.subject = { $regex: query.subject.trim(), $options: 'i' };
    }

    if (query.subjectId && Types.ObjectId.isValid(query.subjectId)) {
      const subjectObjId = new Types.ObjectId(query.subjectId);
      const sub = await this.subjectModel.findById(subjectObjId).lean();
      if (sub) {
        filter.$or = filter.$or || [];
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { subjectId: subjectObjId },
            { subject: { $regex: `^${sub.name.trim()}$`, $options: 'i' } },
          ],
        });
      } else {
        filter.subjectId = subjectObjId;
      }
    }

    if (query.chapterId && Types.ObjectId.isValid(query.chapterId)) {
      const chapterObjId = new Types.ObjectId(query.chapterId);
      const chap = await this.chapterModel.findById(chapterObjId).lean();
      if (chap) {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { chapterId: chapterObjId },
            { topic: { $regex: `^${chap.name.trim()}$`, $options: 'i' } },
          ],
        });
      } else {
        filter.chapterId = chapterObjId;
      }
    }

    if (query.topic && query.topic.trim()) {
      filter.topic = { $regex: query.topic.trim(), $options: 'i' };
    }

    if (query.tag && query.tag.trim()) {
      filter.tags = query.tag.trim();
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.isAvailableForNewTests !== undefined) {
      filter.isAvailableForNewTests = query.isAvailableForNewTests === 'true';
    }

    const [total, docs] = await Promise.all([
      this.questionModel.countDocuments(filter),
      this.questionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .lean(),
    ]);

    return {
      total,
      limit: query.limit,
      offset: query.offset,
      questions: docs.map((doc: any) => ({
        id: doc._id.toString(),
        _id: doc._id.toString(),
        content: doc.content,
        type: doc.type,
        numericalAnswer: doc.numericalAnswer || null,
        difficulty: doc.difficulty,
        status: doc.status,
        isAvailableForNewTests: doc.isAvailableForNewTests !== false,
        subject: doc.subject,
        subjectId: doc.subjectId?.toString() || null,
        chapterId: doc.chapterId?.toString() || null,
        topic: doc.topic || null,
        subtopic: doc.subtopic || null,
        tags: doc.tags || [],
        marks: doc.marks,
        negativeMarks: doc.negativeMarks,
        source: doc.source || null,
        optionsCount: (doc.options || []).length,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    };
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  private async findSeriesById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Test series was not found.');
    }
    const doc = await this.testSeriesModel.findById(new Types.ObjectId(id)).lean();
    if (!doc) throw new NotFoundException('Test series was not found.');
    return doc;
  }

  private async findSubjectById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Subject was not found.');
    }
    const doc = await this.subjectModel.findById(new Types.ObjectId(id)).lean();
    if (!doc) throw new NotFoundException('Subject was not found.');
    return doc;
  }

  private async findChapterById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Chapter was not found.');
    }
    const doc = await this.chapterModel.findById(new Types.ObjectId(id)).lean();
    if (!doc) throw new NotFoundException('Chapter was not found.');
    return doc;
  }

  private assertEditor(user: CurrentUser) {
    if (user.role !== 'editor' && user.role !== 'admin') {
      throw new ForbiddenException('Editor or administrator access is required.');
    }
  }

  private assertAdmin(user: CurrentUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Administrator access is required for this action.');
    }
  }

  private formatTestSeries(doc: any) {
    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      description: doc.description || null,
      targetExam: doc.targetExam,
      category: doc.category,
      organization: doc.organization || null,
      status: doc.status,
      accessType: doc.accessType,
      supportedLanguages: doc.supportedLanguages || ['Hindi', 'English'],
      badge: doc.badge || null,
      logoUrl: doc.logoUrl || null,
      order: doc.order ?? 0,
      createdBy: doc.createdBy?.toString() || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private formatSubject(doc: any) {
    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description || null,
      iconUrl: doc.iconUrl || null,
      createdBy: doc.createdBy?.toString() || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private formatChapter(doc: any) {
    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      testSeriesId: doc.testSeriesId.toString(),
      subjectId: doc.subjectId.toString(),
      description: doc.description || null,
      order: doc.order ?? 0,
      status: doc.status,
      createdBy: doc.createdBy?.toString() || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private formatQuestionMapping(doc: any, includeSensitiveDetails: boolean) {
    const q = doc.questionId as any;
    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      questionId: q ? q._id.toString() : doc.questionId.toString(),
      testSeriesId: doc.testSeriesId ? doc.testSeriesId.toString() : null,
      subjectId: doc.subjectId ? doc.subjectId.toString() : null,
      chapterId: doc.chapterId ? doc.chapterId.toString() : null,
      order: doc.order ?? 0,
      question: q
        ? {
            id: q._id.toString(),
            _id: q._id.toString(),
            content: q.content,
            type: q.type,
            difficulty: q.difficulty,
            status: q.status,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            isAvailableForNewTests: q.isAvailableForNewTests !== false,
            options: (q.options || []).map((opt: any) => ({
              id: opt._id?.toString() || opt.id?.toString(),
              _id: opt._id?.toString() || opt.id?.toString(),
              content: opt.content,
              position: opt.position,
              imageUrl: opt.imageUrl || null,
              ...(includeSensitiveDetails ? { isCorrect: opt.isCorrect } : {}),
            })),
            ...(includeSensitiveDetails
              ? {
                  explanation: q.explanation || null,
                  numericalAnswer: q.numericalAnswer || null,
                }
              : {}),
          }
        : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  // =========================================================================
  // 7. INDIVIDUAL TEST BUILDER & VERSIONING (STAGE 4)
  // =========================================================================

  async listPublishedTests(
    seriesId: string,
    query: ListIndividualTestsQueryInput,
  ) {
    const series = await this.findSeriesById(seriesId);
    if (series.status !== 'published') {
      throw new NotFoundException('Test series was not found.');
    }

    const now = new Date();
    const filter: Record<string, any> = {
      testSeriesId: series._id,
      status: 'published',
      isCurrentVersion: true,
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
    };

    if (query.testMode) filter.testMode = query.testMode;
    if (query.subjectId) {
      if (!Types.ObjectId.isValid(query.subjectId)) {
        throw new BadRequestException('Invalid subject ID.');
      }
      filter.subjectId = new Types.ObjectId(query.subjectId);
    }
    if (query.chapterId) {
      if (!Types.ObjectId.isValid(query.chapterId)) {
        throw new BadRequestException('Invalid chapter ID.');
      }
      filter.chapterId = new Types.ObjectId(query.chapterId);
    }
    if (query.access) filter.access = query.access;

    const docs = await this.examModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((doc) => this.formatIndividualTest(doc, false));
  }

  async getPublishedTest(testId: string) {
    if (!Types.ObjectId.isValid(testId)) {
      throw new NotFoundException('Test was not found.');
    }
    const now = new Date();
    const doc = await this.examModel
      .findOne({
        _id: new Types.ObjectId(testId),
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

    if (!doc) {
      throw new NotFoundException('Test was not found or is currently unavailable.');
    }

    // Ensure parent series is published
    if (doc.testSeriesId) {
      const series = await this.testSeriesModel.findById(doc.testSeriesId).lean();
      if (!series || series.status !== 'published') {
        throw new NotFoundException('Test series was not found.');
      }
    }

    return this.formatIndividualTest(doc, false);
  }

  async listManageableTests(
    seriesId: string,
    query: ListIndividualTestsQueryInput,
    user: CurrentUser,
  ) {
    this.assertEditor(user);
    const series = await this.findSeriesById(seriesId);

    const filter: Record<string, any> = {
      testSeriesId: series._id,
    };

    if (query.testMode) filter.testMode = query.testMode;
    if (query.status) filter.status = query.status;
    if (query.subjectId) {
      if (!Types.ObjectId.isValid(query.subjectId)) {
        throw new BadRequestException('Invalid subject ID.');
      }
      filter.subjectId = new Types.ObjectId(query.subjectId);
    }
    if (query.chapterId) {
      if (!Types.ObjectId.isValid(query.chapterId)) {
        throw new BadRequestException('Invalid chapter ID.');
      }
      filter.chapterId = new Types.ObjectId(query.chapterId);
    }
    if (query.access) filter.access = query.access;

    const docs = await this.examModel
      .find(filter)
      .sort({ version: -1, createdAt: -1 })
      .lean();

    return docs.map((doc) => this.formatIndividualTest(doc, true));
  }

  async getManageableTest(testId: string, user: CurrentUser) {
    this.assertEditor(user);
    if (!Types.ObjectId.isValid(testId)) {
      throw new NotFoundException('Test was not found.');
    }
    const doc = await this.examModel.findById(new Types.ObjectId(testId)).lean();
    if (!doc) throw new NotFoundException('Test was not found.');
    return this.formatIndividualTest(doc, true);
  }

  async createIndividualTest(input: CreateIndividualTestInput, user: CurrentUser) {
    this.assertEditor(user);

    // 1. Verify parent TestSeries exists
    const series = await this.findSeriesById(input.testSeriesId);

    // 2. Validate hierarchy based on testMode
    const { subjectId, chapterId } = await this.validateTestHierarchy(
      series._id,
      input.testMode,
      input.subjectId,
      input.chapterId,
    );

    // 3. Assemble and validate questions
    const { questions, sections, totalQuestionsCount } =
      await this.assembleAndValidateTestQuestions({
        seriesId: series._id,
        testMode: input.testMode,
        subjectId,
        chapterId,
        input,
        isPublishing: false,
      });

    const created = await this.examModel.create({
      title: input.title,
      description: input.description ?? null,
      type: input.testMode,
      testMode: input.testMode,
      status: 'draft',
      access: input.access,
      testSeriesId: series._id,
      subjectId,
      chapterId,
      durationMinutes: input.durationMinutes ?? null,
      maxAttempts: input.maxAttempts ?? null,
      languages: input.languages,
      instructions: input.instructions ?? null,
      positiveMarks: input.positiveMarks,
      negativeMarkingEnabled: input.negativeMarkingEnabled,
      negativeMarks: input.negativeMarkingEnabled ? input.negativeMarks : 0,
      questionSelectionMode: input.questionSelectionMode,
      questionOrderMode: input.questionOrderMode,
      questionSetMode: input.questionSetMode,
      totalQuestionsCount,
      availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
      availableTo: input.availableTo ? new Date(input.availableTo) : null,
      version: 1,
      isCurrentVersion: false, // Remains false until published
      parentTestId: null,
      createdBy: new Types.ObjectId(user.id),
      questions,
      sections,
    });

    return this.formatIndividualTest(created.toObject(), true);
  }

  async updateIndividualTest(
    testId: string,
    input: UpdateIndividualTestInput,
    user: CurrentUser,
  ) {
    this.assertEditor(user);
    if (!Types.ObjectId.isValid(testId)) {
      throw new NotFoundException('Test was not found.');
    }
    const test = await this.examModel.findById(new Types.ObjectId(testId)).lean();
    if (!test) throw new NotFoundException('Test was not found.');

    if (test.testMode === 'legacy') {
      throw new BadRequestException('Legacy exams cannot be managed through the test series individual test builder.');
    }

    if (test.status === 'published') {
      throw new ConflictException(
        'Published tests are immutable. Create a new draft version to make modifications.',
      );
    }

    const testMode = (input.testMode ?? test.testMode) as 'subject' | 'chapter' | 'full';
    const seriesId = test.testSeriesId!;

    let subjectId = test.subjectId ?? null;
    let chapterId = test.chapterId ?? null;

    if (input.subjectId !== undefined || input.chapterId !== undefined || input.testMode !== undefined) {
      const validated = await this.validateTestHierarchy(
        seriesId,
        testMode,
        input.subjectId !== undefined ? input.subjectId : subjectId?.toString(),
        input.chapterId !== undefined ? input.chapterId : chapterId?.toString(),
      );
      subjectId = validated.subjectId;
      chapterId = validated.chapterId;
    }

    // Assemble questions if updated
    let questionsPayload = test.questions;
    let sectionsPayload = test.sections;
    let totalQuestionsCount = test.totalQuestionsCount;

    if (input.questions !== undefined || input.sections !== undefined || input.questionSelectionMode !== undefined) {
      const assembled = await this.assembleAndValidateTestQuestions({
        seriesId,
        testMode,
        subjectId,
        chapterId,
        input: {
          ...test,
          ...input,
          questions: input.questions ?? (test.questions as any),
          sections: input.sections ?? (test.sections as any),
        } as any,
        isPublishing: false,
      });
      questionsPayload = assembled.questions;
      sectionsPayload = assembled.sections;
      totalQuestionsCount = assembled.totalQuestionsCount;
    }

    const updatePayload: Record<string, any> = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.access !== undefined) updatePayload.access = input.access;
    if (input.durationMinutes !== undefined) updatePayload.durationMinutes = input.durationMinutes;
    if (input.maxAttempts !== undefined) updatePayload.maxAttempts = input.maxAttempts;
    if (input.languages !== undefined) updatePayload.languages = input.languages;
    if (input.instructions !== undefined) updatePayload.instructions = input.instructions;
    if (input.positiveMarks !== undefined) updatePayload.positiveMarks = input.positiveMarks;
    if (input.negativeMarkingEnabled !== undefined) {
      updatePayload.negativeMarkingEnabled = input.negativeMarkingEnabled;
      if (!input.negativeMarkingEnabled) {
        updatePayload.negativeMarks = 0;
      }
    }
    if (input.negativeMarks !== undefined && (input.negativeMarkingEnabled ?? test.negativeMarkingEnabled)) {
      updatePayload.negativeMarks = input.negativeMarks;
    }
    if (input.questionSelectionMode !== undefined) {
      updatePayload.questionSelectionMode = input.questionSelectionMode;
    }
    if (input.questionOrderMode !== undefined) {
      updatePayload.questionOrderMode = input.questionOrderMode;
    }
    if (input.questionSetMode !== undefined) {
      updatePayload.questionSetMode = input.questionSetMode;
    }
    if (input.availableFrom !== undefined) {
      updatePayload.availableFrom = input.availableFrom ? new Date(input.availableFrom) : null;
    }
    if (input.availableTo !== undefined) {
      updatePayload.availableTo = input.availableTo ? new Date(input.availableTo) : null;
    }

    updatePayload.testMode = testMode;
    updatePayload.type = testMode;
    updatePayload.subjectId = subjectId;
    updatePayload.chapterId = chapterId;
    updatePayload.questions = questionsPayload;
    updatePayload.sections = sectionsPayload;
    updatePayload.totalQuestionsCount = totalQuestionsCount;

    const updated = await this.examModel
      .findByIdAndUpdate(test._id, { $set: updatePayload }, { new: true })
      .lean();

    return this.formatIndividualTest(updated!, true);
  }

  async updateTestStatus(
    testId: string,
    input: UpdateTestStatusInput,
    user: CurrentUser,
  ) {
    this.assertAdmin(user);
    if (!Types.ObjectId.isValid(testId)) {
      throw new NotFoundException('Test was not found.');
    }
    const test = await this.examModel.findById(new Types.ObjectId(testId)).lean();
    if (!test) throw new NotFoundException('Test was not found.');

    if (input.status === test.status) {
      return this.formatIndividualTest(test, true);
    }

    if (test.testMode === 'legacy') {
      throw new BadRequestException('Legacy exams cannot be published via test series builder.');
    }

    if (input.status === 'published') {
      // Re-verify hierarchy, questions, snapshots, and pool validity
      const assembled = await this.assembleAndValidateTestQuestions({
        seriesId: test.testSeriesId!,
        testMode: test.testMode as 'subject' | 'chapter' | 'full',
        subjectId: test.subjectId ?? null,
        chapterId: test.chapterId ?? null,
        input: test as any,
        isPublishing: true, // creates exact QuestionSnapshot
      });

      // Root lineage ID
      const rootId = test.parentTestId || test._id;

      // Atomically designate this test as the active published current version
      // and demote any previous published version in this lineage
      await this.examModel.updateMany(
        {
          $or: [{ _id: rootId }, { parentTestId: rootId }],
          _id: { $ne: test._id },
          status: 'published',
        },
        { $set: { isCurrentVersion: false } },
      );

      const published = await this.examModel
        .findByIdAndUpdate(
          test._id,
          {
            $set: {
              status: 'published',
              isCurrentVersion: true,
              questions: assembled.questions,
              sections: assembled.sections,
              totalQuestionsCount: assembled.totalQuestionsCount,
            },
          },
          { new: true },
        )
        .lean();

      return this.formatIndividualTest(published!, true);
    }

    if (input.status === 'archived') {
      const archived = await this.examModel
        .findByIdAndUpdate(
          test._id,
          { $set: { status: 'archived', isCurrentVersion: false } },
          { new: true },
        )
        .lean();
      return this.formatIndividualTest(archived!, true);
    }

    // Changing back to draft: only permitted if no attempts have started
    const attemptCount = await this.testAttemptModel.countDocuments({
      testId: test._id,
    });
    if (attemptCount > 0) {
      throw new ConflictException(
        `Cannot revert test to draft because ${attemptCount} student attempt(s) already exist.`,
      );
    }

    const draft = await this.examModel
      .findByIdAndUpdate(
        test._id,
        { $set: { status: 'draft', isCurrentVersion: false } },
        { new: true },
      )
      .lean();
    return this.formatIndividualTest(draft!, true);
  }

  async createNewTestVersion(testId: string, user: CurrentUser) {
    this.assertEditor(user);
    if (!Types.ObjectId.isValid(testId)) {
      throw new NotFoundException('Test was not found.');
    }
    const sourceTest = await this.examModel.findById(new Types.ObjectId(testId)).lean();
    if (!sourceTest) throw new NotFoundException('Test was not found.');

    if (sourceTest.status !== 'published') {
      throw new BadRequestException(
        'A new version can only be created from a published test.',
      );
    }

    const rootTestId = sourceTest.parentTestId || sourceTest._id;

    // Check if an un-published draft version in this lineage already exists
    const existingDraft = await this.examModel
      .findOne({
        $or: [{ _id: rootTestId }, { parentTestId: rootTestId }],
        status: 'draft',
      })
      .lean();

    if (existingDraft) {
      throw new ConflictException(
        `A draft version (${existingDraft.title} v${existingDraft.version}) already exists in this lineage. Edit or publish it before creating another version.`,
      );
    }

    // Determine the next version number
    const maxVersionDoc = await this.examModel
      .findOne({
        $or: [{ _id: rootTestId }, { parentTestId: rootTestId }],
      })
      .sort({ version: -1 })
      .lean();

    const nextVersion = (maxVersionDoc?.version || sourceTest.version || 1) + 1;

    // Clone the published version into a new draft
    const clonedQuestions = (sourceTest.questions || []).map((q: any) => ({
      questionId: q.questionId,
      position: q.position,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      sectionId: q.sectionId,
      snapshot: null, // Draft questions reference live bank until published
    }));

    const clonedSections = (sourceTest.sections || []).map((sec: any) => ({
      name: sec.name,
      topic: sec.topic,
      subjectId: sec.subjectId,
      chapterId: sec.chapterId,
      order: sec.order,
      durationMinutes: sec.durationMinutes,
      positiveMarks: sec.positiveMarks,
      negativeMarkingEnabled: sec.negativeMarkingEnabled,
      negativeMarks: sec.negativeMarks,
      selectionMode: sec.selectionMode,
      questionOrderMode: sec.questionOrderMode,
      questionSetMode: sec.questionSetMode,
      requiredQuestionCount: sec.requiredQuestionCount,
      questions: (sec.questions || []).map((q: any) => ({
        questionId: q.questionId,
        position: q.position,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        sectionId: q.sectionId,
        snapshot: null,
      })),
    }));

    const newVersion = await this.examModel.create({
      title: sourceTest.title,
      description: sourceTest.description,
      type: sourceTest.type,
      testMode: sourceTest.testMode,
      status: 'draft',
      access: sourceTest.access,
      testSeriesId: sourceTest.testSeriesId,
      subjectId: sourceTest.subjectId,
      chapterId: sourceTest.chapterId,
      durationMinutes: sourceTest.durationMinutes,
      maxAttempts: sourceTest.maxAttempts,
      languages: sourceTest.languages,
      instructions: sourceTest.instructions,
      positiveMarks: sourceTest.positiveMarks,
      negativeMarkingEnabled: sourceTest.negativeMarkingEnabled,
      negativeMarks: sourceTest.negativeMarks,
      questionSelectionMode: sourceTest.questionSelectionMode,
      questionOrderMode: sourceTest.questionOrderMode,
      questionSetMode: sourceTest.questionSetMode,
      totalQuestionsCount: sourceTest.totalQuestionsCount,
      availableFrom: sourceTest.availableFrom,
      availableTo: sourceTest.availableTo,
      version: nextVersion,
      isCurrentVersion: false,
      parentTestId: rootTestId,
      createdBy: new Types.ObjectId(user.id),
      questions: clonedQuestions,
      sections: clonedSections,
    });

    return this.formatIndividualTest(newVersion.toObject(), true);
  }

  async removeIndividualTest(testId: string, user: CurrentUser) {
    this.assertAdmin(user);
    if (!Types.ObjectId.isValid(testId)) {
      throw new NotFoundException('Test was not found.');
    }
    const test = await this.examModel.findById(new Types.ObjectId(testId)).lean();
    if (!test) throw new NotFoundException('Test was not found.');

    const rootTestId = test.parentTestId || test._id;

    // Find all version IDs belonging to this lineage
    const versions = await this.examModel
      .find({
        $or: [{ _id: rootTestId }, { parentTestId: rootTestId }],
      })
      .select('_id')
      .lean();

    const versionIds = versions.map((v) => v._id);

    // Cascading deletion:
    // 1. Delete all TestAttempts associated with any version in this test lineage
    await this.testAttemptModel.deleteMany({ testId: { $in: versionIds } });

    // 2. Delete all test versions in the lineage
    await this.examModel.deleteMany({ _id: { $in: versionIds } });

    // Shared Question documents and QuestionMapping records are strictly PRESERVED
  }

  // =========================================================================
  // HELPER METHODS (TEST VALIDATION & QUESTION ASSEMBLY)
  // =========================================================================

  private async validateTestHierarchy(
    seriesId: Types.ObjectId,
    testMode: 'subject' | 'chapter' | 'full',
    subjectIdStr?: string | null,
    chapterIdStr?: string | null,
  ): Promise<{
    subjectId: Types.ObjectId | null;
    chapterId: Types.ObjectId | null;
  }> {
    if (testMode === 'subject') {
      if (!subjectIdStr || !Types.ObjectId.isValid(subjectIdStr)) {
        throw new BadRequestException('A valid subjectId is required for a subject-wise test.');
      }
      const subjectObjectId = new Types.ObjectId(subjectIdStr);
      const isAssigned = await this.testSeriesSubjectModel.exists({
        testSeriesId: seriesId,
        subjectId: subjectObjectId,
      });
      if (!isAssigned) {
        throw new BadRequestException('The selected subject is not assigned to this test series.');
      }
      return { subjectId: subjectObjectId, chapterId: null };
    }

    if (testMode === 'chapter') {
      if (!subjectIdStr || !Types.ObjectId.isValid(subjectIdStr)) {
        throw new BadRequestException('A valid subjectId is required for a chapter-wise test.');
      }
      if (!chapterIdStr || !Types.ObjectId.isValid(chapterIdStr)) {
        throw new BadRequestException('A valid chapterId is required for a chapter-wise test.');
      }
      const subjectObjectId = new Types.ObjectId(subjectIdStr);
      const chapterObjectId = new Types.ObjectId(chapterIdStr);

      const isAssigned = await this.testSeriesSubjectModel.exists({
        testSeriesId: seriesId,
        subjectId: subjectObjectId,
      });
      if (!isAssigned) {
        throw new BadRequestException('The selected subject is not assigned to this test series.');
      }

      const chapter = await this.chapterModel.findOne({
        _id: chapterObjectId,
        testSeriesId: seriesId,
        subjectId: subjectObjectId,
      }).lean();

      if (!chapter) {
        throw new BadRequestException(
          'Chapter does not belong to the selected test series and subject.',
        );
      }

      return { subjectId: subjectObjectId, chapterId: chapterObjectId };
    }

    // Full Test
    return { subjectId: null, chapterId: null };
  }

  private async assembleAndValidateTestQuestions(params: {
    seriesId: Types.ObjectId;
    testMode: 'subject' | 'chapter' | 'full';
    subjectId: Types.ObjectId | null;
    chapterId: Types.ObjectId | null;
    input: CreateIndividualTestInput;
    isPublishing: boolean;
  }): Promise<{
    questions: any[];
    sections: any[];
    totalQuestionsCount: number;
  }> {
    const { seriesId, testMode, subjectId, chapterId, input, isPublishing } = params;

    if (testMode === 'full') {
      if (!input.sections || input.sections.length === 0) {
        throw new BadRequestException('A Full Test must contain at least one section.');
      }

      const processedSections: any[] = [];
      const globalUsedQuestionIds = new Set<string>();

      for (let sIdx = 0; sIdx < input.sections.length; sIdx++) {
        const sec = input.sections[sIdx];

        let secSubjectId: Types.ObjectId | null = null;
        let secChapterId: Types.ObjectId | null = null;

        if (sec.subjectId) {
          if (!Types.ObjectId.isValid(sec.subjectId)) {
            throw new BadRequestException(`Invalid subjectId in section "${sec.name}".`);
          }
          secSubjectId = new Types.ObjectId(sec.subjectId);
          const isAssigned = await this.testSeriesSubjectModel.exists({
            testSeriesId: seriesId,
            subjectId: secSubjectId,
          });
          if (!isAssigned) {
            throw new BadRequestException(
              `Subject in section "${sec.name}" is not assigned to this test series.`,
            );
          }
        }

        if (sec.chapterId) {
          if (!secSubjectId) {
            throw new BadRequestException(
              `Section "${sec.name}" has a chapter specified without a subject.`,
            );
          }
          if (!Types.ObjectId.isValid(sec.chapterId)) {
            throw new BadRequestException(`Invalid chapterId in section "${sec.name}".`);
          }
          secChapterId = new Types.ObjectId(sec.chapterId);
          const chapterExists = await this.chapterModel.exists({
            _id: secChapterId,
            testSeriesId: seriesId,
            subjectId: secSubjectId,
          });
          if (!chapterExists) {
            throw new BadRequestException(
              `Chapter in section "${sec.name}" does not belong to the test series and subject.`,
            );
          }
        }

        // Section question assembly
        const sectionQuestions = await this.resolveQuestionSet({
          seriesId,
          subjectId: secSubjectId,
          chapterId: secChapterId,
          selectionMode: sec.selectionMode,
          requiredCount: sec.requiredQuestionCount ?? sec.questions?.length ?? 0,
          manualQuestions: sec.questions || [],
          isPublishing,
          existingUsedIds: globalUsedQuestionIds,
        });

        // Add questions to global uniqueness tracker
        sectionQuestions.forEach((q) => globalUsedQuestionIds.add(q.questionId.toString()));

        processedSections.push({
          name: sec.name,
          topic: sec.topic ?? null,
          subjectId: secSubjectId,
          chapterId: secChapterId,
          order: sec.order ?? sIdx,
          durationMinutes: sec.durationMinutes ?? null,
          positiveMarks: sec.positiveMarks,
          negativeMarkingEnabled: sec.negativeMarkingEnabled,
          negativeMarks: sec.negativeMarkingEnabled ? sec.negativeMarks : 0,
          selectionMode: sec.selectionMode,
          questionOrderMode: sec.questionOrderMode,
          questionSetMode: sec.questionSetMode,
          requiredQuestionCount: sec.requiredQuestionCount ?? sectionQuestions.length,
          questions: sectionQuestions,
        });
      }

      const totalQuestions = processedSections.reduce(
        (sum, s) => sum + s.questions.length,
        0,
      );

      return {
        questions: [],
        sections: processedSections,
        totalQuestionsCount: totalQuestions,
      };
    }

    // Subject or Chapter Test
    const questions = await this.resolveQuestionSet({
      seriesId,
      subjectId,
      chapterId,
      selectionMode: input.questionSelectionMode,
      requiredCount: input.totalQuestionsCount ?? input.questions?.length ?? 0,
      manualQuestions: input.questions || [],
      isPublishing,
      existingUsedIds: new Set<string>(),
    });

    return {
      questions,
      sections: [],
      totalQuestionsCount: questions.length,
    };
  }

  private async resolveQuestionSet(params: {
    seriesId: Types.ObjectId;
    subjectId: Types.ObjectId | null;
    chapterId: Types.ObjectId | null;
    selectionMode: 'manual' | 'automatic';
    requiredCount: number;
    manualQuestions: TestQuestionItemInput[];
    isPublishing: boolean;
    existingUsedIds: Set<string>;
  }): Promise<any[]> {
    const {
      seriesId,
      subjectId,
      chapterId,
      selectionMode,
      requiredCount,
      manualQuestions,
      isPublishing,
      existingUsedIds,
    } = params;

    // MANUAL SELECTION
    if (selectionMode === 'manual') {
      if (manualQuestions.length === 0) {
        if (isPublishing) {
          throw new BadRequestException('A test must contain at least one question to be published.');
        }
        return [];
      }

      const questionIds = manualQuestions.map((q) => q.questionId);
      // Check for duplicates in the current input
      const uniqueIds = new Set(questionIds);
      if (uniqueIds.size !== questionIds.length) {
        throw new BadRequestException('Duplicate question IDs found within the same test paper.');
      }

      // Check for collision across sections in full test
      for (const qId of questionIds) {
        if (existingUsedIds.has(qId)) {
          throw new BadRequestException(
            `Question ID ${qId} is used more than once across sections in this test.`,
          );
        }
      }

      // Validate mappings & availability
      const qObjectIds = questionIds.map((id) => {
        if (!Types.ObjectId.isValid(id)) {
          throw new BadRequestException(`Invalid question ID format: ${id}`);
        }
        return new Types.ObjectId(id);
      });

      // Verify each question is mapped to this test series
      const mappingFilter: Record<string, any> = {
        testSeriesId: seriesId,
        questionId: { $in: qObjectIds },
      };
      if (subjectId) mappingFilter.subjectId = subjectId;
      if (chapterId) mappingFilter.chapterId = chapterId;

      const validMappings = await this.questionMappingModel
        .find(mappingFilter)
        .select('questionId')
        .lean();

      const mappedIds = new Set(validMappings.map((m) => m.questionId.toString()));
      for (const id of questionIds) {
        if (!mappedIds.has(id)) {
          throw new BadRequestException(
            `Question ${id} is not mapped to the eligible TestSeries/Subject/Chapter scope.`,
          );
        }
      }

      // Fetch questions to verify published & available for new tests
      const questionDocs = await this.questionModel
        .find({ _id: { $in: qObjectIds } })
        .lean();

      const docMap = new Map<string, any>();
      questionDocs.forEach((d) => docMap.set(d._id.toString(), d));

      const processedItems: any[] = [];
      for (let pos = 0; pos < manualQuestions.length; pos++) {
        const item = manualQuestions[pos];
        const doc = docMap.get(item.questionId);

        if (!doc) {
          throw new NotFoundException(`Question ${item.questionId} was not found.`);
        }
        if (doc.status !== 'published') {
          throw new BadRequestException(
            `Question ${item.questionId} cannot be included because it is not published.`,
          );
        }
        if (doc.isAvailableForNewTests === false) {
          throw new BadRequestException(
            `Question ${item.questionId} is marked unavailable for new tests.`,
          );
        }

        processedItems.push({
          questionId: doc._id,
          position: pos,
          marks: item.marks ?? doc.marks ?? 1,
          negativeMarks: item.negativeMarks ?? doc.negativeMarks ?? 0,
          snapshot: isPublishing ? this.createQuestionSnapshot(doc) : null,
        });
      }

      return processedItems;
    }

    // AUTOMATIC SELECTION
    if (requiredCount <= 0) {
      if (isPublishing) {
        throw new BadRequestException('Configured question count must be greater than 0.');
      }
      return [];
    }

    // Find eligible question IDs through QuestionMapping
    const mappingFilter: Record<string, any> = {
      testSeriesId: seriesId,
    };
    if (subjectId) mappingFilter.subjectId = subjectId;
    if (chapterId) mappingFilter.chapterId = chapterId;

    const mappings = await this.questionMappingModel
      .find(mappingFilter)
      .select('questionId')
      .lean();

    const candidateIds = mappings
      .map((m) => m.questionId)
      .filter((id) => !existingUsedIds.has(id.toString()));

    // Filter available and published questions
    const eligibleQuestions = await this.questionModel
      .find({
        _id: { $in: candidateIds },
        status: 'published',
        isAvailableForNewTests: { $ne: false },
      })
      .lean();

    if (eligibleQuestions.length < requiredCount) {
      throw new BadRequestException(
        `Insufficient eligible questions for automatic selection. Requested: ${requiredCount}, Eligible available: ${eligibleQuestions.length}.`,
      );
    }

    // Deterministically take required count (first N)
    const selected = eligibleQuestions.slice(0, requiredCount);

    return selected.map((doc, pos) => ({
      questionId: doc._id,
      position: pos,
      marks: doc.marks ?? 1,
      negativeMarks: doc.negativeMarks ?? 0,
      snapshot: isPublishing ? this.createQuestionSnapshot(doc) : null,
    }));
  }

  private createQuestionSnapshot(questionDoc: any) {
    return {
      questionId: questionDoc._id,
      content: questionDoc.content,
      translations: questionDoc.translations || {},
      explanation: questionDoc.explanation || null,
      explanationTranslations: questionDoc.explanationTranslations || {},
      type: questionDoc.type,
      numericalAnswer: questionDoc.numericalAnswer || null,
      marks: questionDoc.marks ?? 1,
      negativeMarks: questionDoc.negativeMarks ?? 0,
      options: (questionDoc.options || []).map((opt: any) => ({
        _id: opt._id,
        content: opt.content,
        translations: opt.translations || {},
        imageUrl: opt.imageUrl || null,
        position: opt.position,
        isCorrect: Boolean(opt.isCorrect),
      })),
    };
  }

  private formatIndividualTest(doc: any, includeInternalDetails: boolean) {
    const isSubjectOrChapter = doc.testMode !== 'full';

    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description || null,
      testMode: doc.testMode,
      type: doc.type,
      status: doc.status,
      access: doc.access,
      testSeriesId: doc.testSeriesId ? doc.testSeriesId.toString() : null,
      subjectId: doc.subjectId ? doc.subjectId.toString() : null,
      chapterId: doc.chapterId ? doc.chapterId.toString() : null,
      durationMinutes: doc.durationMinutes || null,
      maxAttempts: doc.maxAttempts ?? null,
      languages: doc.languages || ['Hindi', 'English'],
      instructions: doc.instructions || null,
      positiveMarks: doc.positiveMarks ?? 1,
      negativeMarkingEnabled: Boolean(doc.negativeMarkingEnabled),
      negativeMarks: doc.negativeMarks ?? 0,
      questionSelectionMode: doc.questionSelectionMode || 'manual',
      questionOrderMode: doc.questionOrderMode || 'fixed',
      questionSetMode: doc.questionSetMode || 'fixed',
      totalQuestionsCount: doc.totalQuestionsCount || 0,
      version: doc.version || 1,
      isCurrentVersion: Boolean(doc.isCurrentVersion),
      parentTestId: doc.parentTestId ? doc.parentTestId.toString() : null,
      availableFrom: doc.availableFrom || null,
      availableTo: doc.availableTo || null,
      createdBy: includeInternalDetails ? doc.createdBy?.toString() || null : undefined,
      sections: (doc.sections || []).map((s: any) => ({
        id: s._id?.toString(),
        name: s.name,
        topic: s.topic || null,
        subjectId: s.subjectId ? s.subjectId.toString() : null,
        chapterId: s.chapterId ? s.chapterId.toString() : null,
        order: s.order ?? 0,
        durationMinutes: s.durationMinutes || null,
        positiveMarks: s.positiveMarks ?? 1,
        negativeMarkingEnabled: Boolean(s.negativeMarkingEnabled),
        negativeMarks: s.negativeMarks ?? 0,
        selectionMode: s.selectionMode || 'manual',
        questionOrderMode: s.questionOrderMode || 'fixed',
        questionSetMode: s.questionSetMode || 'fixed',
        requiredQuestionCount: s.requiredQuestionCount || 0,
        questionsCount: (s.questions || []).length,
        questions: includeInternalDetails
          ? (s.questions || []).map((q: any) => ({
              questionId: q.questionId.toString(),
              position: q.position,
              marks: q.marks,
              negativeMarks: q.negativeMarks,
              snapshot: q.snapshot || null,
            }))
          : undefined,
      })),
      questions: isSubjectOrChapter && includeInternalDetails
        ? (doc.questions || []).map((q: any) => ({
            questionId: q.questionId.toString(),
            position: q.position,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            snapshot: q.snapshot || null,
          }))
        : undefined,
      questionsCount: isSubjectOrChapter
        ? (doc.questions || []).length
        : (doc.sections || []).reduce((acc: number, s: any) => acc + (s.questions || []).length, 0),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

