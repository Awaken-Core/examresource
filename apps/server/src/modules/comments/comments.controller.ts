import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { env } from '../../core/config/env.js';
import { AuthService } from '../auth/auth.service.js';
import { createCommentSchema, moderateCommentSchema } from './dto/comment.dto.js';
import { CommentsService } from './comments.service.js';

@Controller('api/v1')
export class CommentsController {
  constructor(
    private readonly comments: CommentsService,
    private readonly auth: AuthService,
  ) {}

  @Get('blogs/:slug/comments')
  @Header('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120')
  listPublished(
    @Param('slug') slug: string,
    @Query('language') language?: 'HINGLISH' | 'ENGLISH',
  ) {
    return this.comments.listPublished(slug, this.language(language));
  }

  @Post('blogs/:slug/comments')
  async create(
    @Param('slug') slug: string,
    @Query('language') language: 'HINGLISH' | 'ENGLISH' | undefined,
    @Req() req: Request,
  ) {
    this.assertSafeMutation(req);
    return this.comments.create(
      slug,
      this.language(language),
      this.parse(createCommentSchema, req.body),
      await this.auth.optionalUser(req),
      this.clientIp(req),
    );
  }

  @Get('admin/comments')
  async listForModeration(@Req() req: Request, @Query('status') status?: string) {
    const user = await this.auth.requireUser(req);
    this.assertModerator(user.role);
    if (status && !['PENDING', 'APPROVED', 'REJECTED', 'SPAM'].includes(status)) {
      throw new BadRequestException('Comment status is invalid.');
    }
    return this.comments.listForModeration(status as any);
  }

  @Patch('admin/comments/:id')
  async moderate(@Param('id') id: string, @Req() req: Request) {
    this.assertSafeMutation(req);
    return this.comments.moderate(
      id,
      this.parse(moderateCommentSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  private language(language: string | undefined) {
    if (!language) return undefined;
    if (language !== 'HINGLISH' && language !== 'ENGLISH') {
      throw new BadRequestException('language must be HINGLISH or ENGLISH.');
    }
    return language;
  }

  private parse<T>(schema: { safeParse(value: unknown): { success: boolean; data?: T } }, value: unknown): T {
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new BadRequestException('Request body is invalid.');
    return parsed.data as T;
  }

  private assertSafeMutation(req: Request) {
    if (req.header('origin') !== env.CLIENT_URL) throw new BadRequestException('Origin is not allowed.');
    if (req.header('x-csrf-protection') !== '1') throw new BadRequestException('Missing CSRF protection header.');
  }

  private clientIp(req: Request) {
    if (env.NODE_ENV === 'production' || env.NODE_ENV === 'preview') {
      return req.header('cf-connecting-ip') || null;
    }
    return req.ip || req.socket.remoteAddress || null;
  }

  private assertModerator(role: string) {
    if (role !== 'admin' && role !== 'editor') throw new BadRequestException('Editor access is required.');
  }
}
