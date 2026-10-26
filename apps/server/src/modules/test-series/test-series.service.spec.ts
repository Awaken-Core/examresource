import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { TestSeriesService } from './test-series.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

const admin: CurrentUser = {
  id: new Types.ObjectId().toString(),
  name: 'Admin User',
  email: 'admin@example.com',
  phone: null,
  role: 'admin',
  emailVerified: true,
};

const editor: CurrentUser = {
  id: new Types.ObjectId().toString(),
  name: 'Editor User',
  email: 'editor@example.com',
  phone: null,
  role: 'editor',
  emailVerified: true,
};

const student: CurrentUser = {
  id: new Types.ObjectId().toString(),
  name: 'Student User',
  email: 'student@example.com',
  phone: null,
  role: 'student',
  emailVerified: true,
};

describe('TestSeriesService Hierarchy & Operations', () => {
  function makeService() {
    const testSeriesModel: any = {
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      create: vi.fn(),
    };
    const subjectModel: any = {
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      create: vi.fn(),
    };
    const testSeriesSubjectModel: any = {
      find: vi.fn(),
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      countDocuments: vi.fn(),
      exists: vi.fn(),
    };
    const chapterModel: any = {
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      updateOne: vi.fn(),
      create: vi.fn(),
      countDocuments: vi.fn(),
    };
    const examModel: any = {
      countDocuments: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateOne: vi.fn(),
      updateMany: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      deleteMany: vi.fn(),
    };
    const questionMappingModel: any = {
      countDocuments: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      exists: vi.fn(),
    };
    const questionModel: any = {
      findById: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      exists: vi.fn(),
    };
    const testAttemptModel: any = {
      countDocuments: vi.fn(),
      deleteMany: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    };

    const service = new TestSeriesService(
      testSeriesModel,
      subjectModel,
      testSeriesSubjectModel,
      chapterModel,
      examModel,
      questionMappingModel,
      questionModel,
      testAttemptModel,
    );

    return {
      service,
      testSeriesModel,
      subjectModel,
      testSeriesSubjectModel,
      chapterModel,
      examModel,
      questionMappingModel,
      questionModel,
      testAttemptModel,
    };
  }

  // =========================================================================
  // 1. TEST SERIES CRUD & PERMISSIONS
  // =========================================================================

  it('allows public users to list only published test series', async () => {
    const { service, testSeriesModel } = makeService();
    testSeriesModel.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            title: 'RRB NTPC 2026',
            slug: 'rrb-ntpc-2026',
            targetExam: 'RRB NTPC',
            category: 'ssc-railways',
            status: 'published',
            accessType: 'free',
            supportedLanguages: ['Hindi', 'English'],
            order: 0,
          },
        ]),
      }),
    });

    const result = await service.listPublished('ssc-railways');
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('RRB NTPC 2026');
    expect(testSeriesModel.find).toHaveBeenCalledWith({
      status: 'published',
      category: 'ssc-railways',
    });
  });

  it('rejects student from creating a test series', async () => {
    const { service } = makeService();
    await expect(
      service.create(
        {
          title: 'SSC CGL 2026',
          slug: 'ssc-cgl-2026',
          targetExam: 'SSC CGL',
          category: 'ssc-railways',
          status: 'draft',
          accessType: 'free',
          supportedLanguages: ['English'],
          order: 0,
        },
        student,
      ),
    ).rejects.toThrow('Editor or administrator access is required.');
  });

  it('allows editor to create draft, but prevents non-admin from publishing directly', async () => {
    const { service, testSeriesModel } = makeService();
    testSeriesModel.findOne.mockResolvedValue(null);
    testSeriesModel.create.mockImplementation((input: any) => ({
      toObject: () => ({
        _id: new Types.ObjectId(),
        ...input,
      }),
    }));

    const result = await service.create(
      {
        title: 'UPSC CSE 2026',
        slug: 'upsc-cse-2026',
        targetExam: 'UPSC CSE',
        category: 'central-government',
        status: 'published', // requested publish
        accessType: 'free',
        supportedLanguages: ['Hindi', 'English'],
        order: 0,
      },
      editor,
    );

    // Editor is restricted to 'draft'
    expect(result.status).toBe('draft');
    expect(testSeriesModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft' }),
    );
  });

  it('prevents non-admin editor from archiving or publishing via updateStatus', async () => {
    const { service } = makeService();
    await expect(
      service.updateStatus(new Types.ObjectId().toString(), 'published', editor),
    ).rejects.toThrow('Administrator access is required for this action.');
  });

  it('blocks deletion of a test series if dependent tests exist', async () => {
    const { service, testSeriesModel, examModel, chapterModel, questionMappingModel } =
      makeService();
    const seriesId = new Types.ObjectId();
    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    examModel.countDocuments.mockResolvedValue(5); // 5 dependent tests
    chapterModel.countDocuments.mockResolvedValue(0);
    questionMappingModel.countDocuments.mockResolvedValue(0);

    await expect(service.remove(seriesId.toString(), admin)).rejects.toThrow(
      /Cannot delete test series because it has 5 test\(s\)/,
    );
  });

  // =========================================================================
  // 2. SHARED SUBJECT MANAGEMENT
  // =========================================================================

  it('allows editor to create a reusable shared subject', async () => {
    const { service, subjectModel } = makeService();
    subjectModel.findOne.mockResolvedValue(null);
    subjectModel.create.mockImplementation((input: any) => ({
      toObject: () => ({
        _id: new Types.ObjectId(),
        ...input,
      }),
    }));

    const result = await service.createSubject(
      {
        name: 'Mathematics',
        slug: 'mathematics',
        description: 'Quantitative aptitude and pure math',
      },
      editor,
    );

    expect(result.name).toBe('Mathematics');
    expect(result.slug).toBe('mathematics');
  });

  it('blocks subject deletion when assigned to test series or tests', async () => {
    const { service, subjectModel, testSeriesSubjectModel, examModel, chapterModel, questionMappingModel } =
      makeService();
    const subjectId = new Types.ObjectId();
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'General Studies' }),
    });
    testSeriesSubjectModel.countDocuments.mockResolvedValue(2); // assigned to 2 test series
    examModel.countDocuments.mockResolvedValue(0);
    chapterModel.countDocuments.mockResolvedValue(0);
    questionMappingModel.countDocuments.mockResolvedValue(0);

    await expect(service.removeSubject(subjectId.toString(), admin)).rejects.toThrow(
      /Cannot delete subject "General Studies" because it is assigned to 2 test series/,
    );
  });

  // =========================================================================
  // 3. SUBJECT ASSIGNMENT (SHARING ACROSS SERIES)
  // =========================================================================

  it('assigns a shared subject to a test series', async () => {
    const { service, testSeriesModel, subjectModel, testSeriesSubjectModel } = makeService();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Reasoning', slug: 'reasoning' }),
    });
    testSeriesSubjectModel.findOne.mockResolvedValue(null);
    testSeriesSubjectModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      testSeriesId: seriesId,
      subjectId,
      order: 1,
      customDisplayName: 'General Intelligence',
    });

    const result = await service.assignSubject(
      seriesId.toString(),
      { subjectId: subjectId.toString(), order: 1, customDisplayName: 'General Intelligence' },
      editor,
    );

    expect(result.customDisplayName).toBe('General Intelligence');
    expect(result.testSeriesId).toBe(seriesId.toString());
  });

  it('rejects duplicate assignment of the same subject to the same test series', async () => {
    const { service, testSeriesModel, subjectModel, testSeriesSubjectModel } = makeService();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Reasoning', slug: 'reasoning' }),
    });
    testSeriesSubjectModel.findOne.mockResolvedValue({ _id: 'already-assigned' });

    await expect(
      service.assignSubject(
        seriesId.toString(),
        { subjectId: subjectId.toString(), order: 0 },
        editor,
      ),
    ).rejects.toThrow(/already assigned/);
  });

  // =========================================================================
  // 4. EXAM-SPECIFIC CHAPTER MANAGEMENT
  // =========================================================================

  it('rejects chapter creation if subject is not assigned to the test series', async () => {
    const { service, testSeriesModel, subjectModel, testSeriesSubjectModel } = makeService();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Computer Knowledge' }),
    });
    // Not assigned
    testSeriesSubjectModel.exists.mockResolvedValue(null);

    await expect(
      service.createChapter(
        seriesId.toString(),
        {
          name: 'Networking Basics',
          slug: 'networking-basics',
          subjectId: subjectId.toString(),
          order: 0,
          status: 'published',
        },
        editor,
      ),
    ).rejects.toThrow(/not assigned to this test series/);
  });

  it('creates an exam-specific chapter when subject is assigned', async () => {
    const { service, testSeriesModel, subjectModel, testSeriesSubjectModel, chapterModel } =
      makeService();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Mathematics' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);
    chapterModel.findOne.mockResolvedValue(null);
    chapterModel.create.mockImplementation((input: any) => ({
      toObject: () => ({
        _id: new Types.ObjectId(),
        ...input,
      }),
    }));

    const result = await service.createChapter(
      seriesId.toString(),
      {
        name: 'Percentages',
        slug: 'percentages',
        subjectId: subjectId.toString(),
        order: 1,
        status: 'published',
      },
      editor,
    );

    expect(result.name).toBe('Percentages');
    expect(result.testSeriesId).toBe(seriesId.toString());
    expect(result.subjectId).toBe(subjectId.toString());
  });

  it('blocks chapter deletion if dependent tests are linked to it', async () => {
    const { service, chapterModel, examModel, questionMappingModel } = makeService();
    const chapterId = new Types.ObjectId();
    chapterModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: chapterId, name: 'Trigonometry' }),
    });
    examModel.countDocuments.mockResolvedValue(2); // 2 chapter tests exist
    questionMappingModel.countDocuments.mockResolvedValue(0);

    await expect(service.removeChapter(chapterId.toString(), admin)).rejects.toThrow(
      /Cannot delete chapter "Trigonometry" because it is linked to 2 test\(s\)/,
    );
  });

  // =========================================================================
  // 5. QUESTION MAPPING MANAGEMENT & REUSE
  // =========================================================================

  it('successfully creates a question mapping for valid series, subject, and chapter', async () => {
    const {
      service,
      testSeriesModel,
      subjectModel,
      testSeriesSubjectModel,
      chapterModel,
      questionModel,
      questionMappingModel,
    } = makeService();

    const questionId = new Types.ObjectId();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const chapterId = new Types.ObjectId();

    questionModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: questionId, title: 'Sample Question', status: 'published' }),
    });
    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC', status: 'published' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Maths' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);
    chapterModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: chapterId,
        testSeriesId: seriesId,
        subjectId: subjectId,
        name: 'Percentages',
      }),
    });
    questionMappingModel.findOne.mockResolvedValue(null);
    questionMappingModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
    });
    questionMappingModel.findById.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          questionId: {
            _id: questionId,
            content: 'Sample Question',
            status: 'published',
          },
          testSeriesId: seriesId,
          subjectId,
          chapterId,
          order: 1,
        }),
      }),
    });

    const result = await service.createMapping(
      {
        questionId: questionId.toString(),
        testSeriesId: seriesId.toString(),
        subjectId: subjectId.toString(),
        chapterId: chapterId.toString(),
        order: 1,
      },
      editor,
    );

    expect(result.questionId).toBe(questionId.toString());
    expect(result.testSeriesId).toBe(seriesId.toString());
    expect(result.subjectId).toBe(subjectId.toString());
    expect(result.chapterId).toBe(chapterId.toString());
  });

  it('allows the same question to be mapped to a different Test Series (central reuse)', async () => {
    const {
      service,
      testSeriesModel,
      subjectModel,
      testSeriesSubjectModel,
      questionModel,
      questionMappingModel,
    } = makeService();

    const questionId = new Types.ObjectId();
    const seriesId2 = new Types.ObjectId();
    const subjectId = new Types.ObjectId();

    questionModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: questionId, title: 'Math Question' }),
    });
    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId2, title: 'SSC CGL', status: 'published' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Maths' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);
    questionMappingModel.findOne.mockResolvedValue(null);
    questionMappingModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
    });
    questionMappingModel.findById.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          questionId: {
            _id: questionId,
            content: 'Math Question',
            status: 'published',
          },
          testSeriesId: seriesId2,
          subjectId,
          chapterId: null,
          order: 0,
        }),
      }),
    });

    const result = await service.createMapping(
      {
        questionId: questionId.toString(),
        testSeriesId: seriesId2.toString(),
        subjectId: subjectId.toString(),
        order: 0,
      },
      admin,
    );

    expect(result.testSeriesId).toBe(seriesId2.toString());
    expect(result.chapterId).toBeNull();
  });

  it('rejects duplicate question mapping in the same Test Series and Subject/Chapter', async () => {
    const {
      service,
      testSeriesModel,
      subjectModel,
      testSeriesSubjectModel,
      questionModel,
      questionMappingModel,
    } = makeService();

    const questionId = new Types.ObjectId();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();

    questionModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: questionId, title: 'Math Question' }),
    });
    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC', status: 'published' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Maths' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);
    // Already mapped
    questionMappingModel.findOne.mockResolvedValue({ _id: new Types.ObjectId() });

    await expect(
      service.createMapping(
        {
          questionId: questionId.toString(),
          testSeriesId: seriesId.toString(),
          subjectId: subjectId.toString(),
          order: 0,
        },
        editor,
      ),
    ).rejects.toThrow(/already mapped/);
  });

  it('rejects mapping when subject is not assigned to the Test Series', async () => {
    const {
      service,
      testSeriesModel,
      subjectModel,
      testSeriesSubjectModel,
      questionModel,
    } = makeService();

    const questionId = new Types.ObjectId();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();

    questionModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: questionId }),
    });
    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Physics' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(false);

    await expect(
      service.createMapping(
        {
          questionId: questionId.toString(),
          testSeriesId: seriesId.toString(),
          subjectId: subjectId.toString(),
          order: 0,
        },
        editor,
      ),
    ).rejects.toThrow(/not assigned to test series/);
  });

  it('rejects mapping when chapter belongs to a different test series or subject', async () => {
    const {
      service,
      testSeriesModel,
      subjectModel,
      testSeriesSubjectModel,
      chapterModel,
      questionModel,
    } = makeService();

    const questionId = new Types.ObjectId();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const chapterId = new Types.ObjectId();

    questionModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: questionId }),
    });
    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Maths' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);

    // Chapter belongs to a different series (returns null from findOne)
    chapterModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.createMapping(
        {
          questionId: questionId.toString(),
          testSeriesId: seriesId.toString(),
          subjectId: subjectId.toString(),
          chapterId: chapterId.toString(),
          order: 0,
        },
        editor,
      ),
    ).rejects.toThrow(/Chapter does not belong to the selected test series and subject/);
  });

  it('deleting a mapping removes the mapping record without deleting the underlying question', async () => {
    const { service, questionMappingModel, questionModel } = makeService();
    const mappingId = new Types.ObjectId();

    questionMappingModel.findById.mockResolvedValue({ _id: mappingId });
    questionMappingModel.findByIdAndDelete.mockResolvedValue({ _id: mappingId });

    await service.removeMapping(mappingId.toString(), admin);

    expect(questionMappingModel.findByIdAndDelete).toHaveBeenCalledWith(mappingId);
    // Crucial check: underlying questionModel must NOT be deleted
    expect(questionModel.findByIdAndDelete).toBeUndefined();
  });

  it('rejects editors from deleting a question mapping (admin-only action)', async () => {
    const { service, questionMappingModel } = makeService();
    const mappingId = new Types.ObjectId();

    questionMappingModel.findById.mockResolvedValue({ _id: mappingId });

    await expect(
      service.removeMapping(mappingId.toString(), editor),
    ).rejects.toThrow(/Administrator access is required for this action/);
  });

  it('rejects student or unauthenticated users from creating or deleting mappings', async () => {
    const { service } = makeService();
    await expect(
      service.createMapping(
        {
          questionId: new Types.ObjectId().toString(),
          testSeriesId: new Types.ObjectId().toString(),
          subjectId: new Types.ObjectId().toString(),
          order: 0,
        },
        student,
      ),
    ).rejects.toThrow(/Editor or administrator access is required/);

    await expect(
      service.removeMapping(new Types.ObjectId().toString(), student),
    ).rejects.toThrow(/Administrator access is required for this action/);
  });

  // =========================================================================
  // 6. QUESTION BANK SEARCH & CANDIDATE FILTERS
  // =========================================================================

  it('allows editors to search questions and filters out questions unavailable for new tests', async () => {
    const { service, questionModel } = makeService();

    questionModel.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                content: 'What is 2 + 2?',
                type: 'single_choice',
                difficulty: 'easy',
                status: 'published',
                isAvailableForNewTests: true,
              },
            ]),
          }),
        }),
      }),
    });
    questionModel.countDocuments.mockResolvedValue(1);

    const result = await service.searchQuestionBank(
      {
        limit: 10,
        offset: 0,
        isAvailableForNewTests: 'true',
        type: 'single_choice',
        difficulty: 'easy',
      },
      editor,
    );

    expect(result.questions).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(questionModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isAvailableForNewTests: true,
        type: 'single_choice',
        difficulty: 'easy',
      }),
    );
  });

  it('public mapping list excludes draft questions for regular visitors', async () => {
    const { service, testSeriesModel, subjectModel, testSeriesSubjectModel, questionMappingModel } =
      makeService();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC', status: 'published' }),
    });
    subjectModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: subjectId, name: 'Maths' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);

    questionMappingModel.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              questionId: {
                _id: new Types.ObjectId(),
                content: 'Published Question',
                status: 'published',
              },
              testSeriesId: seriesId,
              subjectId,
            },
            {
              _id: new Types.ObjectId(),
              questionId: {
                _id: new Types.ObjectId(),
                content: 'Draft Question (Internal)',
                status: 'draft',
              },
              testSeriesId: seriesId,
              subjectId,
            },
          ]),
        }),
      }),
    });

    // Public visitor (no user or student)
    const publicResults = await service.listMappings(
      seriesId.toString(),
      subjectId.toString(),
      undefined,
      student,
    );

    // Only the published question should be returned
    expect(publicResults).toHaveLength(1);
    expect(publicResults[0].question?.content).toBe('Published Question');

    // Editor sees both
    const editorResults = await service.listMappings(
      seriesId.toString(),
      subjectId.toString(),
      undefined,
      editor,
    );
    expect(editorResults).toHaveLength(2);
  });

  // =========================================================================
  // 7. INDIVIDUAL TEST BUILDER, SECTIONS & VERSIONING (STAGE 4)
  // =========================================================================

  it('creates a subject-wise test with manual question validation', async () => {
    const {
      service,
      testSeriesModel,
      testSeriesSubjectModel,
      questionMappingModel,
      questionModel,
      examModel,
    } = makeService();

    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const questionId = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC', status: 'published' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);

    questionMappingModel.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ questionId }]),
      }),
    });

    questionModel.find.mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          _id: questionId,
          content: 'What is 5 + 5?',
          status: 'published',
          isAvailableForNewTests: true,
          marks: 2,
          negativeMarks: 0.5,
        },
      ]),
    });

    examModel.create.mockImplementation((input: any) => ({
      toObject: () => ({
        _id: new Types.ObjectId(),
        ...input,
        version: 1,
        isCurrentVersion: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }));

    const result = await service.createIndividualTest(
      {
        testSeriesId: seriesId.toString(),
        title: 'Maths Speed Test 1',
        testMode: 'subject',
        subjectId: subjectId.toString(),
        access: 'free',
        durationMinutes: 30,
        positiveMarks: 2,
        negativeMarkingEnabled: true,
        negativeMarks: 0.5,
        questionSelectionMode: 'manual',
        questionOrderMode: 'fixed',
        questionSetMode: 'fixed',
        questions: [{ questionId: questionId.toString(), marks: 2, negativeMarks: 0.5 }],
        languages: ['Hindi', 'English'],
        sections: [],
      },
      editor,
    );

    expect(result.title).toBe('Maths Speed Test 1');
    expect(result.testMode).toBe('subject');
    expect(result.status).toBe('draft');
    expect(result.questionsCount).toBe(1);
    expect(result.version).toBe(1);
    expect(result.isCurrentVersion).toBe(false);
  });

  it('rejects chapter-wise test if chapter does not belong to subject and series', async () => {
    const { service, testSeriesModel, testSeriesSubjectModel, chapterModel } = makeService();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const chapterId = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC', status: 'published' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);
    // Chapter belongs to a different series
    chapterModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(
      service.createIndividualTest(
        {
          testSeriesId: seriesId.toString(),
          title: 'Algebra Quiz',
          testMode: 'chapter',
          subjectId: subjectId.toString(),
          chapterId: chapterId.toString(),
          access: 'free',
          languages: ['English'],
          positiveMarks: 1,
          negativeMarkingEnabled: false,
          negativeMarks: 0,
          questionSelectionMode: 'manual',
          questionOrderMode: 'fixed',
          questionSetMode: 'fixed',
          questions: [],
          sections: [],
        },
        editor,
      ),
    ).rejects.toThrow(/Chapter does not belong to the selected test series and subject/);
  });

  it('creates a Full Test with multiple independent sections, each with own marks and timers', async () => {
    const {
      service,
      testSeriesModel,
      testSeriesSubjectModel,
      questionMappingModel,
      questionModel,
      examModel,
    } = makeService();

    const seriesId = new Types.ObjectId();
    const subject1Id = new Types.ObjectId();
    const subject2Id = new Types.ObjectId();
    const q1Id = new Types.ObjectId();
    const q2Id = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC Full Mock', status: 'published' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);

    // Question mappings for section 1 and 2
    questionMappingModel.find
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ questionId: q1Id }]),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ questionId: q2Id }]),
        }),
      });

    questionModel.find
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue([
          { _id: q1Id, content: 'Math Q', status: 'published', isAvailableForNewTests: true },
        ]),
      })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue([
          { _id: q2Id, content: 'Reasoning Q', status: 'published', isAvailableForNewTests: true },
        ]),
      });

    examModel.create.mockImplementation((input: any) => ({
      toObject: () => ({
        _id: new Types.ObjectId(),
        ...input,
        version: 1,
        isCurrentVersion: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }));

    const result = await service.createIndividualTest(
      {
        testSeriesId: seriesId.toString(),
        title: 'RRB NTPC Full Mock 1',
        testMode: 'full',
        access: 'premium',
        durationMinutes: 90,
        languages: ['Hindi', 'English'],
        positiveMarks: 1,
        negativeMarkingEnabled: true,
        negativeMarks: 0.33,
        questionSelectionMode: 'manual',
        questionOrderMode: 'fixed',
        questionSetMode: 'fixed',
        questions: [],
        sections: [
          {
            name: 'Mathematics',
            subjectId: subject1Id.toString(),
            order: 0,
            durationMinutes: 30,
            positiveMarks: 2,
            negativeMarkingEnabled: true,
            negativeMarks: 0.66,
            selectionMode: 'manual',
            questionOrderMode: 'fixed',
            questionSetMode: 'fixed',
            questions: [{ questionId: q1Id.toString() }],
          },
          {
            name: 'General Intelligence & Reasoning',
            subjectId: subject2Id.toString(),
            order: 1,
            durationMinutes: 30,
            positiveMarks: 1,
            negativeMarkingEnabled: true,
            negativeMarks: 0.25,
            selectionMode: 'manual',
            questionOrderMode: 'randomized',
            questionSetMode: 'fixed',
            questions: [{ questionId: q2Id.toString() }],
          },
        ],
      },
      editor,
    );

    expect(result.testMode).toBe('full');
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].positiveMarks).toBe(2);
    expect(result.sections[0].durationMinutes).toBe(30);
    expect(result.sections[1].positiveMarks).toBe(1);
    expect(result.sections[1].questionOrderMode).toBe('randomized');
    expect(result.questionsCount).toBe(2);
  });

  it('rejects duplicate questions within a test paper across sections', async () => {
    const { service, testSeriesModel, testSeriesSubjectModel, questionMappingModel } = makeService();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const duplicateQId = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);

    questionMappingModel.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ questionId: duplicateQId }]),
      }),
    });

    await expect(
      service.createIndividualTest(
        {
          testSeriesId: seriesId.toString(),
          title: 'Duplicate Q Test',
          testMode: 'subject',
          subjectId: subjectId.toString(),
          access: 'free',
          languages: ['English'],
          positiveMarks: 1,
          negativeMarkingEnabled: false,
          negativeMarks: 0,
          questionSelectionMode: 'manual',
          questionOrderMode: 'fixed',
          questionSetMode: 'fixed',
          questions: [
            { questionId: duplicateQId.toString() },
            { questionId: duplicateQId.toString() },
          ],
          sections: [],
        },
        editor,
      ),
    ).rejects.toThrow(/Duplicate question IDs found within the same test paper/);
  });

  it('rejects automatic question selection if eligible pool is insufficient', async () => {
    const {
      service,
      testSeriesModel,
      testSeriesSubjectModel,
      questionMappingModel,
      questionModel,
    } = makeService();

    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const q1Id = new Types.ObjectId();

    testSeriesModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: seriesId, title: 'RRB NTPC' }),
    });
    testSeriesSubjectModel.exists.mockResolvedValue(true);

    // Only 1 question mapped, but requested 10
    questionMappingModel.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ questionId: q1Id }]),
      }),
    });
    questionModel.find.mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        { _id: q1Id, content: 'Only 1 Question Available', status: 'published', isAvailableForNewTests: true },
      ]),
    });

    await expect(
      service.createIndividualTest(
        {
          testSeriesId: seriesId.toString(),
          title: 'Auto Generated Test',
          testMode: 'subject',
          subjectId: subjectId.toString(),
          access: 'free',
          languages: ['Hindi', 'English'],
          positiveMarks: 1,
          negativeMarkingEnabled: false,
          negativeMarks: 0,
          questionSelectionMode: 'automatic',
          questionOrderMode: 'fixed',
          questionSetMode: 'fixed',
          totalQuestionsCount: 10,
          questions: [],
          sections: [],
        },
        editor,
      ),
    ).rejects.toThrow(/Insufficient eligible questions for automatic selection/);
  });

  it('rejects publishing or archiving by editors (admin-only action)', async () => {
    const { service, examModel } = makeService();
    const testId = new Types.ObjectId();

    examModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: testId, status: 'draft', testMode: 'subject' }),
    });

    await expect(
      service.updateTestStatus(testId.toString(), { status: 'published' }, editor),
    ).rejects.toThrow(/Administrator access is required for this action/);
  });

  it('prevents direct mutation of published tests (immutability rule)', async () => {
    const { service, examModel } = makeService();
    const testId = new Types.ObjectId();

    examModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: testId,
        status: 'published',
        testMode: 'subject',
      }),
    });

    await expect(
      service.updateIndividualTest(testId.toString(), { title: 'Illegal Update' }, editor),
    ).rejects.toThrow(/Published tests are immutable/);
  });

  it('creates a new draft version cloned from a published test with incremented version number', async () => {
    const { service, examModel } = makeService();
    const publishedTestId = new Types.ObjectId();
    const seriesId = new Types.ObjectId();
    const subjectId = new Types.ObjectId();
    const questionId = new Types.ObjectId();

    examModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: publishedTestId,
        title: 'General Awareness Mock',
        status: 'published',
        version: 1,
        testMode: 'subject',
        testSeriesId: seriesId,
        subjectId,
        languages: ['English'],
        positiveMarks: 1,
        negativeMarkingEnabled: false,
        negativeMarks: 0,
        questions: [{ questionId, position: 0, marks: 1, negativeMarks: 0 }],
        sections: [],
      }),
    });

    // No existing draft in lineage
    examModel.findOne
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      })
      // Max version query
      .mockReturnValueOnce({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ version: 1 }),
        }),
      });

    examModel.create.mockImplementation((input: any) => ({
      toObject: () => ({
        _id: new Types.ObjectId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }));

    const newVersion = await service.createNewTestVersion(publishedTestId.toString(), editor);

    expect(newVersion.version).toBe(2);
    expect(newVersion.status).toBe('draft');
    expect(newVersion.isCurrentVersion).toBe(false);
    expect(newVersion.parentTestId).toBe(publishedTestId.toString());
  });

  it('cascading deletion permanently deletes test lineage and related test attempts without deleting questions', async () => {
    const { service, examModel, testAttemptModel, questionModel } = makeService();
    const testId = new Types.ObjectId();
    const v2Id = new Types.ObjectId();

    examModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: testId,
        parentTestId: null,
      }),
    });

    examModel.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: testId }, { _id: v2Id }]),
      }),
    });

    examModel.deleteMany.mockResolvedValue({ deletedCount: 2 });
    testAttemptModel.deleteMany.mockResolvedValue({ deletedCount: 5 });

    await service.removeIndividualTest(testId.toString(), admin);

    expect(testAttemptModel.deleteMany).toHaveBeenCalledWith({
      testId: { $in: [testId, v2Id] },
    });
    expect(examModel.deleteMany).toHaveBeenCalledWith({
      _id: { $in: [testId, v2Id] },
    });
    // Crucial check: shared questions are untouched
    expect(questionModel.deleteMany).toBeUndefined();
  });
});

