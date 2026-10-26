import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { AuthService } from './auth.service.js';

describe('AuthService learner preparation preferences', () => {
  function makeService() {
    const userModel: any = {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findOne: vi.fn(),
    };
    const sessionModel: any = { findOne: vi.fn(), updateOne: vi.fn() };
    const oauthStateModel: any = { create: vi.fn() };
    const passwordResetTokenModel: any = { findOneAndUpdate: vi.fn() };
    const emailVerificationTokenModel: any = { create: vi.fn() };
    const notificationModel: any = { create: vi.fn() };

    const service = new AuthService(
      userModel,
      sessionModel,
      oauthStateModel,
      passwordResetTokenModel,
      emailVerificationTokenModel,
      notificationModel,
    );

    return { service, userModel };
  }

  it('updates learner preparation preferences and goals successfully', async () => {
    const { service, userModel } = makeService();
    const userId = new Types.ObjectId().toString();
    const seriesId = new Types.ObjectId().toString();
    const targetDate = new Date('2026-12-15T00:00:00.000Z');

    const updatedUserDoc = {
      _id: new Types.ObjectId(userId),
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      phone: '+919876543210',
      role: 'student',
      emailVerifiedAt: new Date(),
      preferredLanguage: 'Hindi',
      targetExam: 'DSSSB TGT Computer Science 2026',
      targetSeriesIds: [new Types.ObjectId(seriesId)],
      examGoalDate: targetDate,
    };

    userModel.findByIdAndUpdate.mockResolvedValue(updatedUserDoc);

    const result = await service.updateProfile(userId, {
      name: 'Rohan Sharma',
      phone: '+919876543210',
      preferredLanguage: 'Hindi',
      targetExam: 'DSSSB TGT Computer Science 2026',
      targetSeriesIds: [seriesId],
      examGoalDate: targetDate.toISOString(),
    });

    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      {
        $set: {
          name: 'Rohan Sharma',
          phone: '+919876543210',
          preferredLanguage: 'Hindi',
          targetExam: 'DSSSB TGT Computer Science 2026',
          targetSeriesIds: [expect.any(Types.ObjectId)],
          examGoalDate: expect.any(Date),
        },
      },
      { new: true },
    );

    expect(result.id).toBe(userId);
    expect(result.name).toBe('Rohan Sharma');
    expect(result.preferredLanguage).toBe('Hindi');
    expect(result.targetExam).toBe('DSSSB TGT Computer Science 2026');
    expect(result.targetSeriesIds).toEqual([seriesId]);
    expect(result.examGoalDate).toBe(targetDate.toISOString());
  });

  it('rejects invalid examGoalDate strings', async () => {
    const { service } = makeService();
    const userId = new Types.ObjectId().toString();

    await expect(
      service.updateProfile(userId, {
        examGoalDate: 'not-a-valid-date',
      }),
    ).rejects.toThrow('examGoalDate must be a valid date.');
  });

  it('rejects updateProfile when account ID is not a valid ObjectId', async () => {
    const { service } = makeService();

    await expect(
      service.updateProfile('invalid-id', {
        name: 'New Name',
      }),
    ).rejects.toThrow('Account was not found.');
  });

  it('ensures User schema does not persist duplicated analytics counters', () => {
    const { service } = makeService();
    const dummyUser = {
      _id: new Types.ObjectId(),
      name: 'Ananya',
      email: 'ananya@example.com',
      role: 'student',
    };

    const publicProfile = (service as any).publicUser(dummyUser);

    // Profile contains only learner identity and preferences
    expect(publicProfile).toHaveProperty('preferredLanguage', 'English');
    expect(publicProfile).toHaveProperty('targetExam', null);
    expect(publicProfile).toHaveProperty('targetSeriesIds', []);
    expect(publicProfile).toHaveProperty('examGoalDate', null);

    // Never duplicates attempt counters in User doc
    expect(publicProfile).not.toHaveProperty('totalAttempts');
    expect(publicProfile).not.toHaveProperty('overallAccuracy');
    expect(publicProfile).not.toHaveProperty('averageScore');
  });
});
