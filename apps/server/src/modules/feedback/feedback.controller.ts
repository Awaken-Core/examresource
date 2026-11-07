import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service.js';
import { FeedbackService } from './feedback.service.js';
import { createFeedbackSchema, updateFeedbackStatusSchema } from './dto/feedback.dto.js';

@Controller('api/v1')
export class FeedbackController {
  constructor(
    private readonly feedback: FeedbackService,
    private readonly auth: AuthService,
  ) {}

  @Post('feedback')
  @HttpCode(HttpStatus.CREATED)
  async createFeedback(@Req() req: Request) {
    const user = await this.auth.requireUser(req);
    const input = this.parse(createFeedbackSchema, req.body);
    return this.feedback.create(input, user);
  }

  @Get('admin/feedback')
  async listAdminFeedback(
    @Req() req: Request,
    @Query('source') source?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = await this.auth.requireUser(req);
    this.assertStaff(user.role);
    return this.feedback.list({
      source,
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Patch('admin/feedback/:id')
  async updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = await this.auth.requireUser(req);
    this.assertStaff(user.role);
    const input = this.parse(updateFeedbackStatusSchema, req.body);
    return this.feedback.updateStatus(id, input, user);
  }

  @Delete('admin/feedback/:id')
  async deleteFeedback(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = await this.auth.requireUser(req);
    this.assertStaff(user.role);
    return this.feedback.remove(id);
  }

  private assertStaff(role: string) {
    if (role !== 'admin' && role !== 'editor') {
      throw new ForbiddenException('Staff privileges required.');
    }
  }

  private parse<T>(schema: z.ZodSchema<T>, payload: unknown): T {
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message || 'Input validation failed.');
    }
    return parsed.data;
  }
}

