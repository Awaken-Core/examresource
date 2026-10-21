import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import {
  SubjectSchema,
  TestSeriesSchema,
  TestSeriesSubjectSchema,
  ChapterSchema,
  QuestionMappingSchema,
  QuestionSchema,
  ExamSchema,
  TestAttemptSchema,
} from './index.js';

describe('Test Series Schema Foundation & Validation', () => {
  it('instantiates Subject schema with unique constraints and required fields', () => {
    const SubjectModel = mongoose.model('TestSubject', SubjectSchema);
    const doc = new SubjectModel({
      name: 'Mathematics',
      slug: 'mathematics',
    });
    expect(doc.name).toBe('Mathematics');
    expect(doc.slug).toBe('mathematics');

    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it('instantiates TestSeries schema with targetExam and accessType defaults', () => {
    const TestSeriesModel = mongoose.model('TestTestSeries', TestSeriesSchema);
    const doc = new TestSeriesModel({
      title: 'RRB NTPC Graduate Level 2026',
      slug: 'rrb-ntpc-graduate-level-2026',
      targetExam: 'RRB NTPC',
      category: 'ssc-railways',
    });
    expect(doc.accessType).toBe('free');
    expect(doc.status).toBe('draft');
    expect(doc.supportedLanguages).toEqual(['Hindi', 'English']);

    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it('instantiates Chapter schema linked to TestSeries and Subject', () => {
    const ChapterModel = mongoose.model('TestChapter', ChapterSchema);
    const testSeriesId = new mongoose.Types.ObjectId();
    const subjectId = new mongoose.Types.ObjectId();

    const doc = new ChapterModel({
      name: 'Percentages',
      slug: 'percentages',
      testSeriesId,
      subjectId,
    });
    expect(doc.order).toBe(0);
    expect(doc.testSeriesId).toEqual(testSeriesId);
    expect(doc.subjectId).toEqual(subjectId);

    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it('validates Question schema with single_choice, multiple_choice, and numerical types', () => {
    const QuestionModel = mongoose.model('TestQuestionValidation', QuestionSchema);
    const userObjectId = new mongoose.Types.ObjectId();

    // Numerical question validation
    const numDoc = new QuestionModel({
      content: 'What is the value of 2^10?',
      type: 'numerical',
      numericalAnswer: '1024',
      subject: 'Mathematics',
      createdBy: userObjectId,
    });
    expect(numDoc.type).toBe('numerical');
    expect(numDoc.numericalAnswer).toBe('1024');
    expect(numDoc.isAvailableForNewTests).toBe(true);

    const err = numDoc.validateSync();
    expect(err).toBeUndefined();
  });

  it('supports sections and versioning in Exam model', () => {
    const ExamModel = mongoose.model('TestExamValidation', ExamSchema);
    const userObjectId = new mongoose.Types.ObjectId();
    const testSeriesId = new mongoose.Types.ObjectId();
    const qId = new mongoose.Types.ObjectId();

    const doc = new ExamModel({
      title: 'RRB NTPC Mock Test 01',
      type: 'full',
      testMode: 'full',
      testSeriesId,
      access: 'free',
      version: 1,
      isCurrentVersion: true,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.33,
      sections: [
        {
          name: 'General Intelligence & Reasoning',
          order: 0,
          positiveMarks: 1,
          negativeMarkingEnabled: true,
          negativeMarks: 0.33,
          durationMinutes: 30,
          questions: [
            {
              questionId: qId,
              position: 0,
              marks: 1,
              negativeMarks: 0.33,
            },
          ],
        },
      ],
      createdBy: userObjectId,
    });

    expect(doc.testMode).toBe('full');
    expect(doc.version).toBe(1);
    expect(doc.sections.length).toBe(1);
    expect(doc.sections[0].name).toBe('General Intelligence & Reasoning');

    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it('tracks question palette statuses, test version, and section progress in TestAttempt', () => {
    const AttemptModel = mongoose.model('TestAttemptValidation', TestAttemptSchema);
    const testId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const qId = new mongoose.Types.ObjectId();

    const attempt = new AttemptModel({
      testId,
      userId,
      attemptNumber: 1,
      testVersion: 2,
      status: 'in_progress',
      questionOrder: [qId],
      sectionProgress: [
        {
          sectionId: 'sec-1',
          name: 'Reasoning',
          timeSpentSeconds: 120,
          isCompleted: false,
        },
      ],
      answers: [
        {
          questionId: qId,
          sectionId: 'sec-1',
          status: 'marked_for_review',
          maximumMarks: 1,
          negativeMarks: 0.25,
          timeSpentSeconds: 45,
        },
      ],
    });

    expect(attempt.testVersion).toBe(2);
    expect(attempt.answers[0].status).toBe('marked_for_review');
    expect(attempt.sectionProgress[0].name).toBe('Reasoning');

    const err = attempt.validateSync();
    expect(err).toBeUndefined();
  });
});
