import { describe, expect, it, vi } from 'vitest';
import { QuestionService } from './question.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

const editor: CurrentUser = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1', name: 'Editor', email: 'editor@example.com',
  phone: null, role: 'editor', emailVerified: true,
};

describe('QuestionService access and integrity', () => {
  function makeService() {
    const questions: any = { findById: vi.fn(), findByIdAndDelete: vi.fn() };
    const saved: any = { create: vi.fn(), deleteMany: vi.fn() };
    const reports: any = { create: vi.fn(), deleteMany: vi.fn() };
    const exams: any = { exists: vi.fn() };
    const subjects: any = { find: vi.fn() };
    const chapters: any = { find: vi.fn() };
    const testSeries: any = { find: vi.fn() };
    return {
      service: new QuestionService(questions, saved, reports, exams, subjects, chapters, testSeries),
      questions,
      saved,
      exams,
    };
  }

  it('does not let a student save a draft question', async () => {
    const { service, questions, saved } = makeService();
    questions.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({ status: 'draft' }) });

    await expect(service.save('65f1a2b3c4d5e6f7a8b9c0d2', editor)).rejects.toThrow('Question was not found.');
    expect(saved.create).not.toHaveBeenCalled();
  });

  it('prevents deletion when an exam references the question', async () => {
    const { service, questions, exams } = makeService();
    questions.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue({
      status: 'draft', createdBy: { toString: () => editor.id },
    }) });
    exams.exists.mockResolvedValue({ _id: 'referencing-exam' });

    await expect(service.remove('65f1a2b3c4d5e6f7a8b9c0d2', editor)).rejects.toThrow('used in an exam');
    expect(questions.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('delegates question generation to GeminiService for editors', async () => {
    const questions: any = {};
    const saved: any = {};
    const reports: any = {};
    const exams: any = {};
    const subjects: any = {};
    const chapters: any = {};
    const testSeries: any = {};
    const mockGemini: any = {
      generateQuestions: vi.fn().mockResolvedValue({ questions: [{ content: 'Test Q' }] }),
      translateAndExplainQuestion: vi.fn().mockResolvedValue({ contentHi: 'परीक्षण प्रश्न' }),
      parseRawQuestions: vi.fn().mockResolvedValue({ questions: [{ content: 'Parsed Q' }] }),
    };

    const service = new QuestionService(questions, saved, reports, exams, subjects, chapters, testSeries, mockGemini);

    const genResult = await service.generateAiQuestions({ subject: 'History', count: 3 }, editor);
    expect(mockGemini.generateQuestions).toHaveBeenCalledWith({ subject: 'History', count: 3 });
    expect(genResult.questions).toHaveLength(1);

    const transResult = await service.translateAndExplainAi(
      { content: 'Q?', options: [{ content: 'A', isCorrect: true }] },
      editor,
    );
    expect(mockGemini.translateAndExplainQuestion).toHaveBeenCalled();
    expect(transResult.contentHi).toBe('परीक्षण प्रश्न');

    const parseResult = await service.parseRawQuestionsAi({ rawText: '1. What is X?' }, editor);
    expect(mockGemini.parseRawQuestions).toHaveBeenCalledWith({ rawText: '1. What is X?' });
    expect(parseResult.questions[0].content).toBe('Parsed Q');
  });

  it('rejects students from using Question AI generation', async () => {
    const student: CurrentUser = {
      id: '65f1a2b3c4d5e6f7a8b9c0d9', name: 'Student', email: 'student@example.com',
      phone: null, role: 'student', emailVerified: true,
    };
    const { service } = makeService();
    await expect(service.generateAiQuestions({ subject: 'History' }, student)).rejects.toThrow('Editor access is required.');
  });
});

