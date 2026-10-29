import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { AuthService } from '../auth/auth.service.js';
import { DailyQuizService, type DailyQuizCategory } from './daily-quiz.service.js';
import {
  createDailyQuizDtoSchema,
  submitDailyQuizDtoSchema,
} from './dto/daily-quiz.dto.js';

const VALID_CATEGORIES: DailyQuizCategory[] = [
  'current-affairs',
  'quantitative-aptitude',
  'reasoning',
  'english',
  'general-science',
];

function sanitizeCategory(cat?: string): DailyQuizCategory {
  if (cat && (VALID_CATEGORIES as string[]).includes(cat)) {
    return cat as DailyQuizCategory;
  }
  return 'current-affairs';
}

@Controller('api/v1')
export class DailyQuizController {
  constructor(
    private readonly service: DailyQuizService,
    private readonly auth: AuthService,
  ) {}

  @Get('daily-quizzes')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  async listRecent(
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    const numLimit = limit ? Number.parseInt(limit, 10) : 14;
    return this.service.listRecent(
      Number.isNaN(numLimit) ? 14 : numLimit,
      sanitizeCategory(category),
    );
  }

  @Get('daily-quizzes/today')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  async getToday(@Query('category') category?: string) {
    return this.service.getTodayQuiz(sanitizeCategory(category));
  }

  @Get('daily-quizzes/date/:date')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')
  async getByDate(
    @Param('date') date: string,
    @Query('category') category?: string,
  ) {
    return this.service.getQuizByDate(date, sanitizeCategory(category));
  }

  @Post('daily-quizzes/:id/submit')
  async submitQuiz(
    @Param('id') quizId: string,
    @Req() req: Request,
  ) {
    const payload = this.parse(submitDailyQuizDtoSchema, req.body);
    const user = await this.auth.optionalUser(req);
    return this.service.submitQuiz(quizId, payload, user);
  }

  @Post('admin/daily-quizzes')
  async createQuiz(@Req() req: Request) {
    const user = await this.auth.requireUser(req);
    if (user.role !== 'admin' && user.role !== 'editor') {
      throw new BadRequestException('Only admins or editors can publish daily quizzes.');
    }
    const payload = this.parse(createDailyQuizDtoSchema, req.body);
    return this.service.create(payload);
  }

  private parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Request payload is invalid.',
        errors: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}
