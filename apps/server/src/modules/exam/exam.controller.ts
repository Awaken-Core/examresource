import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { AuthService } from '../auth/auth.service.js';
import {
  createExamSchema,
  saveAnswerSchema,
  updateExamSchema,
  updateSectionProgressSchema,
} from './dto/exam.dto.js';
import { ExamService } from './exam.service.js';

@Controller('api/v1')
export class ExamController {
  constructor(
    private readonly service: ExamService,
    private readonly auth: AuthService,
  ) {}

  @Get('admin/exam-attempts')
  async adminListAttempts(
    @Query('search') search: string | undefined,
    @Query('testSeriesId') testSeriesId: string | undefined,
    @Query('testId') testId: string | undefined,
    @Query('status') status: string | undefined,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @Req() req: Request,
  ) {
    return this.service.adminListAttempts(
      {
        search,
        testSeriesId,
        testId,
        status,
        startDate,
        endDate,
        limit,
        offset,
      },
      await this.auth.requireUser(req),
    );
  }

  @Get('admin/exam-attempts/:id')
  async adminGetAttempt(@Param('id') id: string, @Req() req: Request) {
    return this.service.adminGetAttempt(id, await this.auth.requireUser(req));
  }

  @Get('exams')
  list() {
    return this.service.listPublished();
  }

  @Get('exams/:id')
  get(@Param('id') id: string) {
    return this.service.getPublished(id);
  }

  @Get('me/exams')
  async manageable(@Req() req: Request) {
    return this.service.listManageable(await this.auth.requireUser(req));
  }

  @Post('exams')
  async create(@Req() req: Request) {
    return this.service.create(
      this.parse(createExamSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('exams/:id')
  async update(@Param('id') id: string, @Req() req: Request) {
    return this.service.update(
      id,
      this.parse(updateExamSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Delete('exams/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.service.remove(id, await this.auth.requireUser(req));
  }

  @Post('exams/:id/attempts')
  async start(@Param('id') id: string, @Req() req: Request) {
    return this.service.startAttempt(id, await this.auth.requireUser(req));
  }

  @Get('me/exam-attempts')
  async attempts(@Req() req: Request) {
    return this.service.listAttempts(await this.auth.requireUser(req));
  }

  @Get('exam-attempts/:id')
  async attempt(@Param('id') id: string, @Req() req: Request) {
    return this.service.getAttempt(id, await this.auth.requireUser(req));
  }

  @Put('exam-attempts/:attemptId/questions/:questionId/answer')
  async answer(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Req() req: Request,
  ) {
    return this.service.saveAnswer(
      attemptId,
      questionId,
      this.parse(saveAnswerSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Delete('exam-attempts/:attemptId/questions/:questionId/answer')
  async clearAnswer(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Req() req: Request,
  ) {
    return this.service.clearAnswer(attemptId, questionId, await this.auth.requireUser(req));
  }

  @Put('exam-attempts/:attemptId/section-progress')
  async updateSectionProgress(
    @Param('attemptId') attemptId: string,
    @Req() req: Request,
  ) {
    return this.service.updateSectionProgress(
      attemptId,
      this.parse(updateSectionProgressSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Post('exam-attempts/:id/pause')
  async pause(@Param('id') id: string, @Req() req: Request) {
    return this.service.pauseAttempt(id, await this.auth.requireUser(req));
  }

  @Post('exam-attempts/:id/resume')
  async resume(@Param('id') id: string, @Req() req: Request) {
    return this.service.resumeAttempt(id, await this.auth.requireUser(req));
  }

  @Post('exam-attempts/:id/submit')
  async submit(@Param('id') id: string, @Req() req: Request) {
    return this.service.submit(id, await this.auth.requireUser(req));
  }

  private parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Request body is invalid.',
        errors: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}
