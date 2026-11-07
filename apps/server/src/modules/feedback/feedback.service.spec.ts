import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { FeedbackService } from './feedback.service.js';

function query<T>(value: T) {
  const chain: any = {
    select: vi.fn(() => chain),
    sort: vi.fn(() => chain),
    skip: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    lean: vi.fn().mockResolvedValue(value),
  };
  return chain;
}

describe('FeedbackService', () => {
  it('creates feedback for test_result and footer sources', async () => {
    const feedbackModel: any = {
      create: vi.fn().mockImplementation((data) => Promise.resolve({ _id: new Types.ObjectId(), ...data })),
    };
    const service = new FeedbackService(feedbackModel);

    const mockUser: any = {
      id: '65f1a2b3c4d5e6f7a8b9c0d1',
      name: 'Test Student',
      email: 'student@example.com',
      role: 'user',
    };

    const res = await service.create(
      {
        source: 'test_result',
        message: 'Great mock test with accurate timer!',
        rating: 5,
        category: 'Question Quality',
        testId: '65f1a2b3c4d5e6f7a8b9c0d4',
        testTitle: 'DSSSB TGT Mock 01',
        attemptId: '65f1a2b3c4d5e6f7a8b9c0d5',
      },
      mockUser,
    );

    expect(res.success).toBe(true);
    expect(feedbackModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'test_result',
        rating: 5,
        status: 'NEW',
        testTitle: 'DSSSB TGT Mock 01',
        userName: 'Test Student',
        userEmail: 'student@example.com',
      }),
    );
  });

  it('lists feedbacks with filters and pagination', async () => {
    const mockFeedbacks = [
      {
        _id: new Types.ObjectId(),
        source: 'footer',
        message: 'Please add more SSC mock tests',
        status: 'NEW',
        createdAt: new Date(),
      },
    ];
    const feedbackModel: any = {
      find: vi.fn(() => query(mockFeedbacks)),
      countDocuments: vi.fn().mockResolvedValue(1),
    };
    const service = new FeedbackService(feedbackModel);

    const res = await service.list({ source: 'footer', status: 'NEW' });
    expect(res.feedbacks).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(res.feedbacks[0].source).toBe('footer');
  });

  it('updates feedback status and notes', async () => {
    const id = new Types.ObjectId().toString();
    const feedbackModel: any = {
      findByIdAndUpdate: vi.fn(() => ({
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(id),
          status: 'REVIEWED',
          adminNotes: 'Addressed in update',
        }),
      })),
    };
    const service = new FeedbackService(feedbackModel);

    const res = await service.updateStatus(
      id,
      { status: 'REVIEWED', adminNotes: 'Addressed in update' },
      { id: '65f1a2b3c4d5e6f7a8b9c0d1', name: 'Admin', email: 'admin@example.com', role: 'admin', phone: null, emailVerified: true },
    );

    expect(res.success).toBe(true);
    expect(res.status).toBe('REVIEWED');
  });

  it('deletes feedback', async () => {
    const id = new Types.ObjectId().toString();
    const feedbackModel: any = {
      findByIdAndDelete: vi.fn(() => ({
        lean: vi.fn().mockResolvedValue({ _id: new Types.ObjectId(id) }),
      })),
    };
    const service = new FeedbackService(feedbackModel);

    const res = await service.remove(id);
    expect(res.success).toBe(true);
  });
});

