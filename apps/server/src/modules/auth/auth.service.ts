import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { OAuth2Client } from 'google-auth-library';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { env } from '../../core/config/env.js';
import {
  type EmailVerificationTokenDocument,
  EmailVerificationToken,
  type NotificationDocument,
  Notification,
  type OauthStateDocument,
  OauthState,
  type PasswordResetTokenDocument,
  PasswordResetToken,
  type SessionDocument,
  Session,
  type UserDocument,
  User,
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
  preferredLanguage?: 'English' | 'Hindi';
  targetExam?: string | null;
  targetSeriesIds?: string[];
  examGoalDate?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(OauthState.name)
    private readonly oauthStateModel: Model<OauthStateDocument>,
    @InjectModel(PasswordResetToken.name)
    private readonly passwordResetTokenModel: Model<PasswordResetTokenDocument>,
    @InjectModel(EmailVerificationToken.name)
    private readonly emailVerificationTokenModel: Model<EmailVerificationTokenDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  private tokenHash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private newToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(48));
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private publicUser(user: any): CurrentUser {
    return {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
      preferredLanguage: user.preferredLanguage || 'English',
      targetExam: user.targetExam ?? null,
      targetSeriesIds: (user.targetSeriesIds || []).map((id: any) => id?.toString?.() || String(id)),
      examGoalDate: user.examGoalDate ? new Date(user.examGoalDate).toISOString() : null,
    };
  }

  async register(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const email = input.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException(
        'An account already exists for this email address.',
      );
    }
    try {
      const user = await this.userModel.create({
        name: input.name.trim(),
        email,
        phone: input.phone || null,
        passwordHash: await hashPassword(input.password),
        role: 'student',
        status: 'active',
      });
      await this.createEmailVerificationToken(user._id.toString());
      return { user: this.publicUser(user) };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'An account already exists for this email address.',
        );
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (
      !user ||
      user.status !== 'active' ||
      !user.passwordHash ||
      !(await verifyPassword(user.passwordHash, password))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const token = this.newToken();
    await this.sessionModel.create({
      userId: user._id,
      tokenHash: this.tokenHash(token),
      expiresAt: new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000),
    });
    return { user: this.publicUser(user), token };
  }

  async createGoogleAuthorizationUrl() {
    const client = this.googleClient();
    const state = this.newToken();
    await this.oauthStateModel.create({
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
    const oauthState = await this.oauthStateModel.findOneAndUpdate(
      {
        stateHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true },
    );
    if (!oauthState) {
      throw new BadRequestException(
        'Google sign-in request is invalid or has expired.',
      );
    }

    const client = this.googleClient();
    const tokenResult = await client.getToken(code);
    if (!tokenResult.tokens.id_token) {
      throw new UnauthorizedException(
        'Google did not return an identity token.',
      );
    }
    const ticket = await client.verifyIdToken({
      idToken: tokenResult.tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException(
        'A verified Google email address is required.',
      );
    }

    let user = await this.userModel.findOne({ googleSubject: payload.sub });

    if (!user) {
      const email = payload.email.toLowerCase();
      const emailOwner = await this.userModel.findOne({ email });

      if (emailOwner) {
        user = await this.userModel.findByIdAndUpdate(
          emailOwner._id,
          {
            $set: {
              googleSubject: payload.sub,
              emailVerifiedAt: emailOwner.emailVerifiedAt ?? new Date(),
            },
          },
          { new: true },
        );
      } else {
        user = await this.userModel.create({
          name: payload.name?.slice(0, 100) || payload.email.split('@')[0]!,
          email,
          googleSubject: payload.sub,
          passwordHash: null,
          emailVerifiedAt: new Date(),
          role: 'student',
          status: 'active',
        });
        if (user) {
          try {
            await ensureWelcomeNotification(this.notificationModel, {
              id: user._id.toString(),
              name: user.name,
            });
          } catch (error) {
            console.error('Failed to create welcome notification', error);
          }
        }
      }
    }

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('This account is unavailable.');
    }

    const token = this.newToken();
    await this.sessionModel.create({
      userId: user._id,
      tokenHash: this.tokenHash(token),
      expiresAt: new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000),
    });
    return { user: this.publicUser(user), token };
  }

  async getSession(token: string | undefined) {
    if (!token) return null;
    const session = await this.sessionModel.findOne({
      tokenHash: this.tokenHash(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!session) return null;

    const user = await this.userModel.findById(session.userId);
    if (!user || user.status !== 'active') return null;

    await this.sessionModel.updateOne(
      { _id: session._id },
      { $set: { lastUsedAt: new Date() } },
    );

    return {
      session: {
        id: session._id.toString(),
        userId: session.userId.toString(),
        expiresAt: session.expiresAt,
        createdAt: (session as any).createdAt,
      },
      user: this.publicUser(user),
    };
  }

  async requireUser(req: Request): Promise<CurrentUser> {
    const user = await this.optionalUser(req);
    if (!user) throw new UnauthorizedException('Authentication is required.');
    return user;
  }

  async optionalUser(req: Request): Promise<CurrentUser | null> {
    const current = await this.getSession(req.cookies?.[this.cookieName()]);
    return current?.user ?? null;
  }

  async listAuthors(req: Request) {
    const user = await this.requireUser(req);
    if (user.role !== 'admin' && user.role !== 'editor') {
      throw new ForbiddenException('Editor access is required.');
    }
    const docs = await this.userModel
      .find({ role: { $in: ['admin', 'editor'] } })
      .select({ _id: 1, name: 1, role: 1 })
      .sort({ name: 1 })
      .lean();
    return docs.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      role: u.role,
    }));
  }

  async listUsers(req: Request) {
    await this.requireAdmin(req);
    const docs = await this.userModel
      .find({})
      .select({ _id: 1, name: 1, email: 1, role: 1, status: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
    }));
  }

  async updateUserRole(req: Request, userId: string, role: CurrentUser['role']) {
    const currentUser = await this.requireAdmin(req);
    if (currentUser.id === userId && role !== 'admin') {
      throw new ForbiddenException(
        'You cannot remove your own administrator access.',
      );
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found.');
    }
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: { role } }, { new: true })
      .select({ _id: 1, name: 1, email: 1, role: 1, status: 1, createdAt: 1 })
      .lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: (user as any).createdAt,
    };
  }

  private async requireAdmin(req: Request) {
    const user = await this.requireUser(req);
    if (user.role !== 'admin')
      throw new ForbiddenException('Administrator access is required.');
    return user;
  }

  private cookieName() {
    return env.NODE_ENV === 'production' || env.NODE_ENV === 'preview'
      ? '__Host-sid'
      : 'sid';
  }

  async logout(token: string | undefined) {
    if (token) {
      await this.sessionModel.updateMany(
        {
          tokenHash: this.tokenHash(token),
          revokedAt: null,
        },
        {
          $set: { revokedAt: new Date() },
        },
      );
    }
  }

  async listSessions(userId: string, currentToken?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const rows = await this.sessionModel
      .find({
        userId: userObjectId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .select({ _id: 1, createdAt: 1, lastUsedAt: 1, expiresAt: 1, tokenHash: 1 })
      .lean();
    const currentHash = currentToken ? this.tokenHash(currentToken) : undefined;
    return rows.map((s: any) => ({
      id: s._id.toString(),
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      current: s.tokenHash === currentHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new BadRequestException('Session was not found.');
    }
    const result = await this.sessionModel.updateMany(
      {
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
      },
    );
    if (result.matchedCount === 0)
      throw new BadRequestException('Session was not found.');
  }

  async updateProfile(
    userId: string,
    input: {
      name?: string;
      phone?: string | null;
      preferredLanguage?: 'English' | 'Hindi';
      targetExam?: string | null;
      targetSeriesIds?: string[];
      examGoalDate?: string | null;
    },
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Account was not found.');
    }
    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.preferredLanguage !== undefined) updateData.preferredLanguage = input.preferredLanguage;
    if (input.targetExam !== undefined) updateData.targetExam = input.targetExam;
    if (input.targetSeriesIds !== undefined) {
      updateData.targetSeriesIds = input.targetSeriesIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
    }
    if (input.examGoalDate !== undefined) {
      if (input.examGoalDate) {
        const parsed = new Date(input.examGoalDate);
        if (isNaN(parsed.getTime())) {
          throw new BadRequestException('examGoalDate must be a valid date.');
        }
        updateData.examGoalDate = parsed;
      } else {
        updateData.examGoalDate = null;
      }
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    );
    if (!user) throw new BadRequestException('Account was not found.');
    return this.publicUser(user);
  }

  async createPasswordResetToken(email: string) {
    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (!user || user.status !== 'active') return null;
    const token = this.newToken();
    await this.passwordResetTokenModel.create({
      userId: user._id,
      tokenHash: this.tokenHash(token),
      expiresAt: new Date(Date.now() + 60 * 60_000),
    });
    return token;
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.tokenHash(token);
    const row = await this.passwordResetTokenModel.findOneAndUpdate(
      {
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true },
    );
    if (!row) {
      throw new BadRequestException(
        'This password reset link is invalid or has expired.',
      );
    }
    await this.userModel.updateOne(
      { _id: row.userId },
      {
        $set: {
          passwordHash: await hashPassword(password),
        },
      },
    );
    await this.sessionModel.updateMany(
      {
        userId: row.userId,
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
      },
    );
  }

  async verifyEmail(token: string) {
    const hash = this.tokenHash(token);
    const row = await this.emailVerificationTokenModel.findOneAndUpdate(
      {
        tokenHash: hash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true },
    );
    if (!row) {
      throw new BadRequestException(
        'This verification link is invalid or has expired.',
      );
    }
    await this.userModel.updateOne(
      { _id: row.userId },
      {
        $set: { emailVerifiedAt: new Date() },
      },
    );
  }

  private async createEmailVerificationToken(userId: string) {
    const token = this.newToken();
    await this.emailVerificationTokenModel.create({
      userId: new Types.ObjectId(userId),
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
    ) {
      throw new BadRequestException('Google sign-in is not configured.');
    }
    return new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_CALLBACK_URL,
    );
  }
}
