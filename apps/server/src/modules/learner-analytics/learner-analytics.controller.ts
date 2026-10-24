import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service.js';
import { listPreparationAttemptsQuerySchema } from './dto/learner-analytics.dto.js';
import { LearnerAnalyticsService } from './learner-analytics.service.js';

@Controller('api/v1')
export class LearnerAnalyticsController {
  constructor(
    private readonly service: LearnerAnalyticsService,
    private readonly auth: AuthService,
  ) {}

  @Get('me/preparation/summary')
  async getSummary(@Req() req: Request) {
    const user = await this.auth.requireUser(req);
    return this.service.getSummary(user);
  }

  @Get('me/preparation/attempts')
  async getAttempts(@Query() rawQuery: Record<string, unknown>, @Req() req: Request) {
    const user = await this.auth.requireUser(req);
    const query = this.parse(listPreparationAttemptsQuerySchema, rawQuery);
    return this.service.getAttempts(user, query);
  }

  @Get('me/preparation/series/:seriesId')
  async getSeriesPreparation(
    @Param('seriesId') seriesId: string,
    @Req() req: Request,
  ) {
    const user = await this.auth.requireUser(req);
    return this.service.getSeriesPreparation(user, seriesId);
  }

  @Get('me/preparation/series/:seriesId/weak-topics')
  async getSeriesWeakTopics(
    @Param('seriesId') seriesId: string,
    @Req() req: Request,
  ) {
    const user = await this.auth.requireUser(req);
    return this.service.getSeriesWeakTopics(user, seriesId);
  }

  @Get('me/exam-attempts/:attemptId/analysis')
  async getAttemptAnalysis(
    @Param('attemptId') attemptId: string,
    @Req() req: Request,
  ) {
    const user = await this.auth.requireUser(req);
    return this.service.getAttemptAnalysis(user, attemptId);
  }

  private parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Request query or body is invalid.',
        errors: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}
