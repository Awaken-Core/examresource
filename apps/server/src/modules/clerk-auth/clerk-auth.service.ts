import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../../core/config/db.js';
import { env } from '../../core/config/env.js';
import { users } from '../../core/schema/index.js';

export type CurrentUser = {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: 'student' | 'editor' | 'admin';
};

@Injectable()
export class ClerkAuthService {
  private readonly clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

  async requireUser(req: Request): Promise<CurrentUser> {
    // Never infer a privileged identity from a missing or invalid credential.
    // Local development must use a real Clerk session (or an explicitly seeded
    // account) just like every other environment.
    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const token = this.bearerToken(req);
    let payload: Awaited<ReturnType<typeof verifyToken>>;
    try {
      payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    } catch {
      throw new UnauthorizedException('Authentication token is invalid or expired.');
    }
    const clerkUserId = payload.sub;
    if (!clerkUserId) {
      throw new UnauthorizedException('Authentication token is invalid.');
    }

    let [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!user) user = await this.syncProfile(clerkUserId);
    if (user.status !== 'active') throw new ForbiddenException('This account is unavailable.');

    return {
      id: user.id,
      clerkUserId,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private bearerToken(req: Request) {
    const value = req.header('authorization');
    if (!value?.startsWith('Bearer ')) throw new UnauthorizedException('Authentication is required.');
    const token = value.slice('Bearer '.length).trim();
    if (!token) throw new UnauthorizedException('Authentication is required.');
    return token;
  }

  async syncProfile(clerkUserId: string) {
    const clerkUser = await this.clerk.users.getUser(clerkUserId);
    const email = clerkUser.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
    if (!email) throw new UnauthorizedException('A primary email address is required.');
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() || clerkUser.username || email.split('@')[0]!;

    const [matchingEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (matchingEmail) {
      if (matchingEmail.clerkUserId && matchingEmail.clerkUserId !== clerkUserId) {
        throw new ForbiddenException('This email is linked to a different account.');
      }
      const [linked] = await db.update(users).set({ clerkUserId, name, updatedAt: new Date() }).where(eq(users.id, matchingEmail.id)).returning();
      if (!linked) throw new UnauthorizedException('Unable to link your account.');
      return linked;
    }

    const [created] = await db.insert(users).values({
      id: randomUUID(),
      clerkUserId,
      name: name.slice(0, 100),
      email,
      phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
      emailVerifiedAt: clerkUser.primaryEmailAddress?.verification?.status === 'verified' ? new Date() : null,
    }).returning();
    if (!created) throw new UnauthorizedException('Unable to create your account profile.');
    return created;
  }

  async suspendProfile(clerkUserId: string) {
    await db.update(users).set({ status: 'suspended', updatedAt: new Date() }).where(eq(users.clerkUserId, clerkUserId));
  }
}
