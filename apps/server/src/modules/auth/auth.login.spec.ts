import { describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';

vi.mock('./password-hash.js', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(async () => true),
}));

import { AuthService } from './auth.service.js';

describe('AuthService single active login', () => {
  it('revokes the previous session when the same account logs in again', async () => {
    const userId = new Types.ObjectId();
    const userModel: any = {
      findOne: vi.fn().mockResolvedValue({
        _id: userId,
        name: 'Student',
        email: 'student@example.com',
        phone: null,
        role: 'student',
        status: 'active',
        passwordHash: 'hash',
        emailVerifiedAt: new Date(),
      }),
    };
    const sessionModel: any = {
      updateMany: vi.fn().mockResolvedValue({ matchedCount: 1 }),
      create: vi.fn().mockResolvedValue({}),
    };
    const service = new AuthService(
      userModel,
      sessionModel,
      { create: vi.fn() } as any,
      { findOneAndUpdate: vi.fn() } as any,
      { create: vi.fn() } as any,
      { create: vi.fn() } as any,
    );

    await service.login('student@example.com', 'password');

    expect(sessionModel.updateMany).toHaveBeenCalledWith(
      { userId, revokedAt: null },
      { $set: { revokedAt: expect.any(Date) } },
    );
    expect(sessionModel.create).toHaveBeenCalledTimes(1);
    expect(sessionModel.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      sessionModel.create.mock.invocationCallOrder[0],
    );
  });
});
