import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gt, isNull, or } from 'drizzle-orm';
import type { Request } from 'express';
import { db } from '../../core/config/db.js';
import { env } from '../../core/config/env.js';
import {
  emailVerificationTokens,
  oauthStates,
  passwordResetTokens,
  sessions,
  users,
} from '../../core/schema/index.js';
import { ensureWelcomeNotification } from '../notifications/notification.store.js';
import { hashPassword, verifyPassword } from './password-hash.js';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'student' | 'editor' | 'admin';
  emailVerified: boolean;
};

@Injectable()
export class AuthService {
  private tokenHash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
  private newToken() {
    return randomBytes(48).toString('base64url');
  }
  private publicUser(user: typeof users.$inferSelect): CurrentUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  async register(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (existing)
      throw new ConflictException(
        'An account already exists for this email address.',
      );
    try {
      const [user] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash: await hashPassword(input.password),
        })
        .returning();
      if (!user) throw new Error('User creation did not return a row.');
      await this.createEmailVerificationToken(user.id);
      return { user: this.publicUser(user) };
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException(
          'An account already exists for this email address.',
        );
      throw error;
    }
  }

  async login(email: string, password: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (
      !user ||
      user.status !== 'active' ||
      !user.passwordHash ||
      !(await verifyPassword(user.passwordHash, password))
    )
      throw new UnauthorizedException('Invalid email or password.');
    const token = this.newToken();
    await db
      .insert(sessions)
      .values({
        id: randomUUID(),
        userId: user.id,
        tokenHash: this.tokenHash(token),
        expiresAt: new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000),
      });
    return { user: this.publicUser(user), token };
  }

  async createGoogleAuthorizationUrl() {
    const client = this.googleClient();
    const state = this.newToken();
    await db
      .insert(oauthStates)
      .values({
        id: randomUUID(),
        stateHash: this.tokenHash(state),
        expiresAt: new Date(Date.now() + 10 * 60_000),
      });
    return {
      state,
      url: client.generateAuthUrl({
        access_type: 'online',
        scope: ['openid', 'email', 'profile'],
        state,
        prompt: 'select_account',
      }),
    };
  }

  async loginWithGoogle(code: string, state: string) {
    const stateHash = this.tokenHash(state);
    const [oauthState] = await db
      .select()
      .from(oauthStates)
      .where(
        and(
          eq(oauthStates.stateHash, stateHash),
          isNull(oauthStates.usedAt),
          gt(oauthStates.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!oauthState)
      throw new BadRequestException(
        'Google sign-in request is invalid or has expired.',
      );
    const consumed = await db
      .update(oauthStates)
      .set({ usedAt: new Date() })
      .where(and(eq(oauthStates.id, oauthState.id), isNull(oauthStates.usedAt)))
      .returning({ id: oauthStates.id });
    if (!consumed.length)
      throw new BadRequestException(
        'Google sign-in request has already been used.',
      );

    const client = this.googleClient();
    const tokenResult = await client.getToken(code);
    if (!tokenResult.tokens.id_token)
      throw new UnauthorizedException(
        'Google did not return an identity token.',
      );
    const ticket = await client.verifyIdToken({
      idToken: tokenResult.tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true)
      throw new UnauthorizedException(
        'A verified Google email address is required.',
      );

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleSubject, payload.sub))
      .limit(1);
    if (!user) {
      const [emailOwner] = await db
        .select()
        .from(users)
        .where(eq(users.email, payload.email.toLowerCase()))
        .limit(1);
      if (emailOwner) {
        [user] = await db
          .update(users)
          .set({
            googleSubject: payload.sub,
            emailVerifiedAt: emailOwner.emailVerifiedAt ?? new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, emailOwner.id))
          .returning();
      } else {
        [user] = await db
          .insert(users)
          .values({
            id: randomUUID(),
            name: payload.name?.slice(0, 100) || payload.email.split('@')[0]!,
            email: payload.email.toLowerCase(),
            googleSubject: payload.sub,
            passwordHash: null,
            emailVerifiedAt: new Date(),
          })
          .returning();
        if (user) {
          try {
            await ensureWelcomeNotification({ id: user.id, name: user.name });
          } catch (error) {
            console.error('Failed to create welcome notification', error);
          }
        }
      }
    }
    if (!user || user.status !== 'active')
      throw new UnauthorizedException('This account is unavailable.');
    const token = this.newToken();
    await db
      .insert(sessions)
      .values({
        id: randomUUID(),
        userId: user.id,
        tokenHash: this.tokenHash(token),
        expiresAt: new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000),
      });
    return { user: this.publicUser(user), token };
  }

  async getSession(token: string | undefined) {
    if (!token) return null;
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, this.tokenHash(token)),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!session) return null;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    if (!user || user.status !== 'active') return null;
    await db
      .update(sessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(sessions.id, session.id));
    return { session, user: this.publicUser(user) };
  }

  async requireUser(req: Request): Promise<CurrentUser> {
    const current = await this.getSession(req.cookies?.[this.cookieName()]);
    if (!current) throw new UnauthorizedException('Authentication is required.');
    return current.user;
  }

  async listAuthors(req: Request) {
    const user = await this.requireUser(req);
    if (user.role !== 'admin' && user.role !== 'editor') {
      throw new ForbiddenException('Editor access is required.');
    }
    return db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(or(eq(users.role, 'admin'), eq(users.role, 'editor')))
      .orderBy(asc(users.name));
  }

  async listUsers(req: Request) {
    await this.requireAdmin(req);
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(req: Request, userId: string, role: CurrentUser['role']) {
    const currentUser = await this.requireAdmin(req);
    if (currentUser.id === userId && role !== 'admin') {
      throw new ForbiddenException('You cannot remove your own administrator access.');
    }
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      });
    if (!updatedUser) throw new NotFoundException('User not found.');
    return updatedUser;
  }

  private async requireAdmin(req: Request) {
    const user = await this.requireUser(req);
    if (user.role !== 'admin') throw new ForbiddenException('Administrator access is required.');
    return user;
  }

  private cookieName() {
    return env.NODE_ENV === 'production' || env.NODE_ENV === 'preview'
      ? '__Host-sid'
      : 'sid';
  }

  async logout(token: string | undefined) {
    if (token)
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(sessions.tokenHash, this.tokenHash(token)),
            isNull(sessions.revokedAt),
          ),
        );
  }

  async listSessions(userId: string, currentToken?: string) {
    const rows = await db
      .select({
        id: sessions.id,
        createdAt: sessions.createdAt,
        lastUsedAt: sessions.lastUsedAt,
        expiresAt: sessions.expiresAt,
        tokenHash: sessions.tokenHash,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      );
    const currentHash = currentToken ? this.tokenHash(currentToken) : undefined;
    return rows.map(({ tokenHash, ...session }) => ({
      ...session,
      current: tokenHash === currentHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const result = await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
        ),
      )
      .returning({ id: sessions.id });
    if (!result.length) throw new BadRequestException('Session was not found.');
  }

  async updateProfile(
    userId: string,
    input: { name?: string; phone?: string | null },
  ) {
    const [user] = await db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new BadRequestException('Account was not found.');
    return this.publicUser(user);
  }

  async createPasswordResetToken(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user || user.status !== 'active') return null;
    const token = this.newToken();
    await db
      .insert(passwordResetTokens)
      .values({
        id: randomUUID(),
        userId: user.id,
        tokenHash: this.tokenHash(token),
        expiresAt: new Date(Date.now() + 60 * 60_000),
      });
    return token;
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.tokenHash(token);
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!row)
      throw new BadRequestException(
        'This password reset link is invalid or has expired.',
      );
    await db.transaction(async (tx) => {
      const used = await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.id, row.id),
            isNull(passwordResetTokens.usedAt),
          ),
        )
        .returning({ id: passwordResetTokens.id });
      if (!used.length)
        throw new BadRequestException(
          'This password reset link has already been used.',
        );
      await tx
        .update(users)
        .set({
          passwordHash: await hashPassword(password),
          updatedAt: new Date(),
        })
        .where(eq(users.id, row.userId));
      await tx
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
          and(eq(sessions.userId, row.userId), isNull(sessions.revokedAt)),
        );
    });
  }

  async verifyEmail(token: string) {
    const hash = this.tokenHash(token);
    const [row] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, hash),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!row)
      throw new BadRequestException(
        'This verification link is invalid or has expired.',
      );
    await db.transaction(async (tx) => {
      await tx
        .update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, row.id));
      await tx
        .update(users)
        .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, row.userId));
    });
  }

  private async createEmailVerificationToken(userId: string) {
    const token = this.newToken();
    await db
      .insert(emailVerificationTokens)
      .values({
        id: randomUUID(),
        userId,
        tokenHash: this.tokenHash(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
      });
    return token;
  }

  private googleClient() {
    if (
      !env.GOOGLE_CLIENT_ID ||
      !env.GOOGLE_CLIENT_SECRET ||
      !env.GOOGLE_CALLBACK_URL
    )
      throw new BadRequestException('Google sign-in is not configured.');
    return new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_CALLBACK_URL,
    );
  }
}
