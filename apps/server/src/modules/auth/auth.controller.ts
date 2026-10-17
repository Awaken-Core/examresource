import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../core/config/env.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from './dto/auth.dto.js';
import { AuthService } from './auth.service.js';

type SessionRequest = Request & { cookies?: Record<string, string> };

@Controller('api/v1')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/register')
  async register(@Req() req: SessionRequest) {
    this.assertSafeMutation(req);
    const input = this.parse(registerSchema, req.body);
    return this.auth.register(input);
  }

  @Post('auth/login')
  @HttpCode(200)
  async login(
    @Req() req: SessionRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.assertSafeMutation(req);
    const input = this.parse(loginSchema, req.body);
    const result = await this.auth.login(input.email, input.password);
    this.setSessionCookie(res, result.token);
    return { user: result.user };
  }

  @Get('auth/google')
  async google(@Res() res: Response) {
    const { state, url } = await this.auth.createGoogleAuthorizationUrl();
    res.cookie(this.googleStateCookieName(), state, {
      httpOnly: true,
      secure: this.isHostedEnvironment(),
      sameSite: 'lax',
      path: '/api/v1/auth/google',
      maxAge: 10 * 60_000,
    });
    return res.redirect(url);
  }

  @Get('auth/google/callback')
  async googleCallback(@Req() req: SessionRequest, @Res() res: Response) {
    const code =
      typeof req.query.code === 'string' ? req.query.code : undefined;
    const state =
      typeof req.query.state === 'string' ? req.query.state : undefined;
    if (
      !code ||
      !state ||
      req.cookies?.[this.googleStateCookieName()] !== state
    )
      throw new BadRequestException(
        'Google sign-in request is invalid or has expired.',
      );
    res.clearCookie(this.googleStateCookieName(), {
      path: '/api/v1/auth/google',
    });
    const result = await this.auth.loginWithGoogle(code, state);
    this.setSessionCookie(res, result.token);
    return res.redirect(new URL('/?login=success', env.CLIENT_URL).toString());
  }

  @Post('auth/logout')
  @HttpCode(204)
  async logout(
    @Req() req: SessionRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.assertSafeMutation(req);
    await this.auth.logout(this.sessionToken(req));
    res.clearCookie(this.cookieName(), this.sessionCookieOptions());
  }

  @Post('auth/forgot-password')
  @HttpCode(202)
  async forgotPassword(@Req() req: SessionRequest) {
    this.assertSafeMutation(req);
    const input = this.parse(forgotPasswordSchema, req.body);
    await this.auth.createPasswordResetToken(input.email);
    // A mailer adapter should deliver the token; never expose whether this email exists.
    return {
      message: 'If an account exists, a password reset email will be sent.',
    };
  }

  @Post('auth/reset-password')
  @HttpCode(204)
  async resetPassword(@Req() req: SessionRequest) {
    this.assertSafeMutation(req);
    const input = this.parse(resetPasswordSchema, req.body);
    await this.auth.resetPassword(input.token, input.password);
  }

  @Post('auth/verify-email')
  @HttpCode(204)
  async verifyEmail(@Req() req: SessionRequest) {
    this.assertSafeMutation(req);
    const input = this.parse(verifyEmailSchema, req.body);
    await this.auth.verifyEmail(input.token);
  }

  @Get('me')
  async me(@Req() req: SessionRequest) {
    return (await this.requireSession(req)).user;
  }

  @Get('authors')
  listAuthors(@Req() req: SessionRequest) {
    return this.auth.listAuthors(req);
  }

  @Get('users')
  listUsers(@Req() req: SessionRequest) {
    return this.auth.listUsers(req);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Req() req: SessionRequest) {
    this.assertSafeMutation(req);
    const role = req.body?.role;
    if (role !== 'student' && role !== 'editor' && role !== 'admin') {
      throw new BadRequestException('Role must be student, editor, or admin.');
    }
    return this.auth.updateUserRole(req, id, role);
  }

  @Patch('me')
  async updateProfile(@Req() req: SessionRequest) {
    this.assertSafeMutation(req);
    const current = await this.requireSession(req);
    return this.auth.updateProfile(
      current.user.id,
      this.parse(updateProfileSchema, req.body),
    );
  }

  @Get('me/sessions')
  async sessions(@Req() req: SessionRequest) {
    const current = await this.requireSession(req);
    return this.auth.listSessions(current.user.id, this.sessionToken(req));
  }

  @Delete('me/sessions/:id')
  @HttpCode(204)
  async revokeSession(@Req() req: SessionRequest & { params: { id: string } }) {
    this.assertSafeMutation(req);
    const current = await this.requireSession(req);
    await this.auth.revokeSession(current.user.id, req.params.id);
  }

  private parse<T>(
    schema: { safeParse(value: unknown): { success: boolean; data?: T } },
    value: unknown,
  ): T {
    const parsed = schema.safeParse(value);
    if (!parsed.success)
      throw new BadRequestException('Request body is invalid.');
    return parsed.data as T;
  }
  private sessionToken(req: SessionRequest) {
    return req.cookies?.[this.cookieName()];
  }
  private async requireSession(req: SessionRequest) {
    const current = await this.auth.getSession(this.sessionToken(req));
    if (!current)
      throw new UnauthorizedException('Authentication is required.');
    return current;
  }
  private cookieName() {
    return this.isHostedEnvironment() ? '__Host-sid' : 'sid';
  }
  private googleStateCookieName() {
    return this.isHostedEnvironment()
      ? '__Secure-google-oauth-state'
      : 'google-oauth-state';
  }
  private isHostedEnvironment() {
    return env.NODE_ENV === 'production' || env.NODE_ENV === 'preview';
  }
  private sessionCookieOptions(): CookieOptions {
    const hosted = this.isHostedEnvironment();
    return {
      httpOnly: true,
      secure: hosted,
      sameSite: hosted ? 'none' : 'lax',
      path: '/',
    };
  }
  private setSessionCookie(res: Response, token: string) {
    res.cookie(this.cookieName(), token, {
      ...this.sessionCookieOptions(),
      maxAge: env.SESSION_TTL_DAYS * 86_400_000,
    });
  }
  private assertSafeMutation(req: SessionRequest) {
    const origin = req.header('origin');
    if (origin !== env.CLIENT_URL)
      throw new BadRequestException('Origin is not allowed.');
    if (req.header('x-csrf-protection') !== '1')
      throw new BadRequestException('Missing CSRF protection header.');
  }
}
