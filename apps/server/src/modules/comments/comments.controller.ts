import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { env } from '../../core/config/env.js';
import { AuthService } from '../auth/auth.service.js';
import { createCommentSchema, moderateCommentSchema, updateCommentSchema } from './dto/comment.dto.js';
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
  async listForModeration(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('blogId') blogId?: string,
    @Query('translationGroupId') translationGroupId?: string,
  ) {
    const user = await this.auth.requireUser(req);
    this.assertModerator(user.role);
    if (status && status !== 'ALL' && !['PENDING', 'APPROVED', 'REJECTED', 'SPAM'].includes(status)) {
      throw new BadRequestException('Comment status is invalid.');
    }
    return this.comments.listForModeration(status === 'ALL' ? undefined : status as any, blogId, translationGroupId);
  }

  @Get('admin/comment-articles')
  async listCommentArticles(@Req() req: Request, @Query('search') search?: string) {
    const user = await this.auth.requireUser(req);
    this.assertModerator(user.role);
    return this.comments.listArticlesWithCounts(search);
  }

  @Patch('comments/:id')
  async updateComment(@Param('id') id: string, @Req() req: Request) {
    this.assertSafeMutation(req);
    const user = await this.auth.requireUser(req);
    const body = this.parse(updateCommentSchema, req.body);
    return this.comments.updateByUserOrAdmin(id, body, user);
  }

  @Delete('comments/:id')
  @HttpCode(200)
  async deleteComment(@Param('id') id: string, @Req() req: Request) {
    this.assertSafeMutation(req);
    const user = await this.auth.requireUser(req);
    return this.comments.deleteByUserOrAdmin(id, user);
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

  @Delete('admin/comments/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: Request) {
    this.assertSafeMutation(req);
    await this.comments.remove(id, await this.auth.requireUser(req));
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
    const origin = req.header('origin')?.replace(/\/$/, '');
    const clientUrl = env.CLIENT_URL.replace(/\/$/, '');
    if (origin) {
      const stripWww = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '');
      if (origin !== clientUrl && stripWww(origin) !== stripWww(clientUrl)) {
        throw new BadRequestException('Origin is not allowed.');
      }
    }
    if (req.header('x-csrf-protection') !== '1') throw new BadRequestException('Missing CSRF protection header.');
  }

  private clientIp(req: Request) {
    const cfIp = req.header('cf-connecting-ip');
    const xForwarded = req.header('x-forwarded-for')?.split(',')[0]?.trim();
    const realIp = req.header('x-real-ip');
    return cfIp || xForwarded || realIp || req.ip || req.socket.remoteAddress || '127.0.0.1';
  }

  private assertModerator(role: string) {
    if (role !== 'admin' && role !== 'editor') throw new BadRequestException('Editor access is required.');
  }
}
