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
    return { service: new QuestionService(questions, saved, reports, exams), questions, saved, exams };
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
});
