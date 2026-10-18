import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { AuthService } from '../auth/auth.service.js';
import {
  createQuestionsSchema,
  reportQuestionSchema,
  updateQuestionSchema,
} from './dto/question.dto.js';
import { QuestionService } from './question.service.js';

@Controller('api/v1')
export class QuestionController {
  constructor(
    private readonly service: QuestionService,
    private readonly auth: AuthService,
  ) {}

  @Get('questions')
  list() {
    return this.service.listPublished();
  }

  @Get('questions/:id')
  get(@Param('id') id: string) {
    return this.service.getPublished(id);
  }

  @Get('me/questions')
  async listManageable(@Req() req: Request) {
    return this.service.listManageable(await this.auth.requireUser(req));
  }

  @Post('questions')
  async createMany(@Req() req: Request) {
    return this.service.createMany(
      this.parse(createQuestionsSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('questions/:id')
  async update(@Param('id') id: string, @Req() req: Request) {
    return this.service.update(
      id,
      this.parse(updateQuestionSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Delete('questions/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.service.remove(id, await this.auth.requireUser(req));
  }

  @Get('me/saved-questions')
  async saved(@Req() req: Request) {
    return this.service.listSaved(await this.auth.requireUser(req));
  }

  @Post('questions/:id/save')
  async save(@Param('id') id: string, @Req() req: Request) {
    return this.service.save(id, await this.auth.requireUser(req));
  }

  @Delete('questions/:id/save')
  @HttpCode(204)
  async unsave(@Param('id') id: string, @Req() req: Request) {
    await this.service.unsave(id, await this.auth.requireUser(req));
  }

  @Post('questions/:id/reports')
  async report(@Param('id') id: string, @Req() req: Request) {
    return this.service.report(
      id,
      this.parse(reportQuestionSchema, req.body),
      await this.auth.requireUser(req),
    );
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
