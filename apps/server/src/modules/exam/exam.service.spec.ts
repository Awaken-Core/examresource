import { describe, expect, it, vi } from 'vitest';
import { ExamService } from './exam.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

const student: CurrentUser = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1', name: 'Student', email: 'student@example.com',
  phone: null, role: 'student', emailVerified: true,
};

describe('ExamService publication and duration rules', () => {
  function makeService() {
    const exams: any = { findOne: vi.fn() };
    const questions: any = { countDocuments: vi.fn() };
    const attempts: any = { findOne: vi.fn(), findByIdAndUpdate: vi.fn() };
    return { service: new ExamService(exams, questions, attempts), exams, questions, attempts };
  }

  it('does not start an attempt for a draft exam', async () => {
    const { service, exams } = makeService();
    exams.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    await expect(service.startAttempt('65f1a2b3c4d5e6f7a8b9c0d2', student)).rejects.toThrow('Exam was not found.');
    expect(exams.findOne).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
  });

  it('requires published questions when publishing an exam', async () => {
    const { service, questions } = makeService();
    questions.countDocuments.mockResolvedValue(0);

    await expect((service as any).validateQuestionIds(['65f1a2b3c4d5e6f7a8b9c0d2'], true)).rejects.toThrow('questions do not exist');
    expect(questions.countDocuments).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
  });

  it('expires an over-time attempt before it can be changed', async () => {
    const { service, attempts } = makeService();
    attempts.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({
      _id: 'attempt-id', status: 'in_progress', expiresAt: new Date(Date.now() - 1),
    }) });

    await expect((service as any).requireActiveAttempt('65f1a2b3c4d5e6f7a8b9c0d2', student)).rejects.toThrow('has expired');
    expect(attempts.findByIdAndUpdate).toHaveBeenCalledWith('attempt-id', expect.any(Object));
  });
});
