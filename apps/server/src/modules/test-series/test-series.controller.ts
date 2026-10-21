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
  assignSubjectSchema,
  createChapterSchema,
  createIndividualTestSchema,
  createQuestionMappingSchema,
  createSubjectSchema,
  createTestSeriesSchema,
  listIndividualTestsQuerySchema,
  questionBankQuerySchema,
  reorderChaptersSchema,
  updateChapterSchema,
  updateIndividualTestSchema,
  updateQuestionMappingSchema,
  updateSubjectAssignmentSchema,
  updateSubjectSchema,
  updateTestSeriesSchema,
  updateTestStatusSchema,
} from './dto/test-series.dto.js';
import { TestSeriesService } from './test-series.service.js';

@Controller('api/v1')
export class TestSeriesController {
  constructor(
    private readonly service: TestSeriesService,
    private readonly auth: AuthService,
  ) {}

  // =========================================================================
  // 1. PUBLIC TEST SERIES ROUTES
  // =========================================================================

  @Get('test-series')
  listPublished(@Query('category') category?: string) {
    return this.service.listPublished(category);
  }

  @Get('test-series/:idOrSlug')
  getPublished(@Param('idOrSlug') idOrSlug: string) {
    return this.service.getPublished(idOrSlug);
  }

  @Get('test-series/:id/subjects/:subjectId/chapters')
  listPublicChapters(
    @Param('id') seriesId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.service.listChapters(seriesId, subjectId);
  }

  // =========================================================================
  // 2. ADMIN / EDITOR TEST SERIES MANAGEMENT
  // =========================================================================

  @Get('me/test-series')
  async listManageable(@Req() req: Request) {
    return this.service.listManageable(await this.auth.requireUser(req));
  }

  @Get('me/test-series/:id')
  async getManageable(@Param('id') id: string, @Req() req: Request) {
    return this.service.getManageable(id, await this.auth.requireUser(req));
  }

  @Post('test-series')
  async create(@Req() req: Request) {
    return this.service.create(
      this.parse(createTestSeriesSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('test-series/:id')
  async update(@Param('id') id: string, @Req() req: Request) {
    return this.service.update(
      id,
      this.parse(updateTestSeriesSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('test-series/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = await this.auth.requireUser(req);
    const status = req.body?.status;
    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new BadRequestException('Status must be draft, published, or archived.');
    }
    return this.service.updateStatus(id, status, user);
  }

  @Delete('test-series/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.service.remove(id, await this.auth.requireUser(req));
  }

  // =========================================================================
  // 3. SHARED SUBJECT ROUTES
  // =========================================================================

  @Get('subjects')
  listSubjects(@Query('search') search?: string) {
    return this.service.listSubjects(search);
  }

  @Get('subjects/:id')
  getSubject(@Param('id') id: string) {
    return this.service.getSubject(id);
  }

  @Post('subjects')
  async createSubject(@Req() req: Request) {
    return this.service.createSubject(
      this.parse(createSubjectSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('subjects/:id')
  async updateSubject(@Param('id') id: string, @Req() req: Request) {
    return this.service.updateSubject(
      id,
      this.parse(updateSubjectSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Delete('subjects/:id')
  @HttpCode(204)
  async removeSubject(@Param('id') id: string, @Req() req: Request) {
    await this.service.removeSubject(id, await this.auth.requireUser(req));
  }

  // =========================================================================
  // 4. TEST SERIES <-> SUBJECT ASSIGNMENT ROUTES
  // =========================================================================

  @Get('test-series/:id/subjects')
  listAssignedSubjects(@Param('id') id: string) {
    return this.service.listSubjectsForSeries(id, true);
  }

  @Get('me/test-series/:id/subjects')
  async listManageableAssignedSubjects(@Param('id') id: string, @Req() req: Request) {
    return this.service.listManageableSubjectsForSeries(id, await this.auth.requireUser(req));
  }

  @Post('test-series/:id/subjects')
  async assignSubject(@Param('id') id: string, @Req() req: Request) {
    return this.service.assignSubject(
      id,
      this.parse(assignSubjectSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Post('me/test-series/:id/subjects')
  async assignSubjectMe(@Param('id') id: string, @Req() req: Request) {
    return this.service.assignSubject(
      id,
      this.parse(assignSubjectSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('test-series/:id/subjects/:subjectId')
  async updateSubjectAssignment(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @Req() req: Request,
  ) {
    return this.service.updateSubjectAssignment(
      id,
      subjectId,
      this.parse(updateSubjectAssignmentSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('me/test-series/:id/subjects/:subjectId')
  async updateSubjectAssignmentMe(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @Req() req: Request,
  ) {
    return this.service.updateSubjectAssignment(
      id,
      subjectId,
      this.parse(updateSubjectAssignmentSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Delete('test-series/:id/subjects/:subjectId')
  @HttpCode(204)
  async removeSubjectAssignment(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @Req() req: Request,
  ) {
    await this.service.removeSubjectAssignment(
      id,
      subjectId,
      await this.auth.requireUser(req),
    );
  }

  @Delete('me/test-series/:id/subjects/:subjectId')
  @HttpCode(204)
  async removeSubjectAssignmentMe(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @Req() req: Request,
  ) {
    await this.service.removeSubjectAssignment(
      id,
      subjectId,
      await this.auth.requireUser(req),
    );
  }

  // =========================================================================
  // 5. EXAM-SPECIFIC CHAPTER ROUTES
  // =========================================================================

  @Get('me/test-series/:id/subjects/:subjectId/chapters')
  async listManageableChapters(
    @Param('id') seriesId: string,
    @Param('subjectId') subjectId: string,
    @Req() req: Request,
  ) {
    return this.service.listChapters(
      seriesId,
      subjectId,
      await this.auth.requireUser(req),
    );
  }

  @Get('chapters/:id')
  getChapter(@Param('id') id: string) {
    return this.service.getChapter(id);
  }

  @Post('test-series/:id/chapters')
  async createChapter(@Param('id') seriesId: string, @Req() req: Request) {
    return this.service.createChapter(
      seriesId,
      this.parse(createChapterSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('chapters/:id')
  async updateChapter(@Param('id') id: string, @Req() req: Request) {
    return this.service.updateChapter(
      id,
      this.parse(updateChapterSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Put('test-series/:id/subjects/:subjectId/chapters/reorder')
  async reorderChapters(
    @Param('id') seriesId: string,
    @Param('subjectId') subjectId: string,
    @Req() req: Request,
  ) {
    return this.service.reorderChapters(
      seriesId,
      subjectId,
      this.parse(reorderChaptersSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Delete('chapters/:id')
  @HttpCode(204)
  async removeChapter(@Param('id') id: string, @Req() req: Request) {
    await this.service.removeChapter(id, await this.auth.requireUser(req));
  }

  // =========================================================================
  // 6. QUESTION MAPPING MANAGEMENT
  // =========================================================================

  @Get('test-series/:id/subjects/:subjectId/mappings')
  async listMappings(
    @Param('id') seriesId: string,
    @Param('subjectId') subjectId: string,
    @Query('chapterId') chapterId: string | undefined,
    @Req() req: Request,
  ) {
    const user = await this.auth.requireUser(req).catch(() => null);
    return this.service.listMappings(seriesId, subjectId, chapterId, user ?? undefined);
  }

  @Get('question-mappings/:id')
  async getMapping(@Param('id') id: string, @Req() req: Request) {
    return this.service.getMapping(id, await this.auth.requireUser(req));
  }

  @Post('question-mappings')
  async createMapping(@Req() req: Request) {
    return this.service.createMapping(
      this.parse(createQuestionMappingSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('question-mappings/:id')
  async updateMapping(@Param('id') id: string, @Req() req: Request) {
    return this.service.updateMapping(
      id,
      this.parse(updateQuestionMappingSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Delete('question-mappings/:id')
  @HttpCode(204)
  async removeMapping(@Param('id') id: string, @Req() req: Request) {
    await this.service.removeMapping(id, await this.auth.requireUser(req));
  }

  // =========================================================================
  // 7. CENTRAL QUESTION BANK SEARCH & SELECTION POOL
  // =========================================================================

  @Get('me/question-bank/search')
  async searchQuestionBank(@Query() query: unknown, @Req() req: Request) {
    return this.service.searchQuestionBank(
      this.parse(questionBankQuerySchema, query),
      await this.auth.requireUser(req),
    );
  }

  // =========================================================================
  // 8. INDIVIDUAL TEST BUILDER & VERSIONING (STAGE 4)
  // =========================================================================

  @Get('test-series/:id/tests')
  listPublishedTests(
    @Param('id') seriesId: string,
    @Query() query: unknown,
  ) {
    return this.service.listPublishedTests(
      seriesId,
      this.parse(listIndividualTestsQuerySchema, query),
    );
  }

  @Get('test-series/tests/:testId')
  getPublishedTest(@Param('testId') testId: string) {
    return this.service.getPublishedTest(testId);
  }

  @Get('me/test-series/:id/tests')
  async listManageableTests(
    @Param('id') seriesId: string,
    @Query() query: unknown,
    @Req() req: Request,
  ) {
    return this.service.listManageableTests(
      seriesId,
      this.parse(listIndividualTestsQuerySchema, query),
      await this.auth.requireUser(req),
    );
  }

  @Get('me/test-series/tests/:testId')
  async getManageableTest(
    @Param('testId') testId: string,
    @Req() req: Request,
  ) {
    return this.service.getManageableTest(
      testId,
      await this.auth.requireUser(req),
    );
  }

  @Post('me/test-series/tests')
  async createIndividualTest(@Req() req: Request) {
    return this.service.createIndividualTest(
      this.parse(createIndividualTestSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('me/test-series/tests/:testId')
  async updateIndividualTest(
    @Param('testId') testId: string,
    @Req() req: Request,
  ) {
    return this.service.updateIndividualTest(
      testId,
      this.parse(updateIndividualTestSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Patch('me/test-series/tests/:testId/status')
  async updateTestStatus(
    @Param('testId') testId: string,
    @Req() req: Request,
  ) {
    return this.service.updateTestStatus(
      testId,
      this.parse(updateTestStatusSchema, req.body),
      await this.auth.requireUser(req),
    );
  }

  @Post('me/test-series/tests/:testId/versions')
  async createNewTestVersion(
    @Param('testId') testId: string,
    @Req() req: Request,
  ) {
    return this.service.createNewTestVersion(
      testId,
      await this.auth.requireUser(req),
    );
  }

  @Delete('me/test-series/tests/:testId')
  @HttpCode(204)
  async removeIndividualTest(
    @Param('testId') testId: string,
    @Req() req: Request,
  ) {
    await this.service.removeIndividualTest(
      testId,
      await this.auth.requireUser(req),
    );
  }

  // =========================================================================
  // HELPER: ZOD VALIDATION
  // =========================================================================

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
