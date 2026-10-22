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
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { z } from 'zod';
import { AuthService } from '../auth/auth.service.js';
import { BlogService } from './blog.service.js';
import {
  createBlockSchema,
  createBlogSchema,
  createCategorySchema,
  createTagSchema,
  reorderBlocksSchema,
  updateBlockSchema,
  updateBlogSchema,
  updateCategorySchema,
} from './dto/blog.dto.js';

@Controller('api/v1')
export class BlogController {
  constructor(
    private readonly blogs: BlogService,
    private readonly auth: AuthService,
  ) {}

  // ==========================================
  // Public Endpoints
  // ==========================================

  @Get('blogs')
  @Header(
    'Cache-Control',
    'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
  )
  listPublished(
    @Query('category') categorySlug?: string,
    @Query('tag') tagSlug?: string,
    @Query('search') search?: string,
    @Query('language') language?: 'HINGLISH' | 'ENGLISH',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('includeImages') includeImages?: string,
  ) {
    return this.blogs.listPublished({
      categorySlug,
      tagSlug,
      search,
      language,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      includeImages:
        includeImages === 'false'
          ? false
          : includeImages === 'true'
            ? true
            : undefined,
    });
  }

  @Get('blogs/:slug')
  @Header(
    'Cache-Control',
    'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
  )
  getPublished(
    @Param('slug') slug: string,
    @Query('language') language?: 'HINGLISH' | 'ENGLISH',
  ) {
    return this.blogs.getPublished(slug, language);
  }

  @Get('sitemap-entries')
  @Header(
    'Cache-Control',
    'public, max-age=600, s-maxage=1800, stale-while-revalidate=3600',
  )
  getSitemapEntries() {
    return this.blogs.getSitemapEntries();
  }

  @Get('redirects/check')
  @Header(
    'Cache-Control',
    'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
  )
  checkRedirect(@Query('path') path: string) {
    return this.blogs.checkRedirect(path);
  }

  @Get('categories')
  @Header(
    'Cache-Control',
    'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
  )
  listCategories() {
    return this.blogs.listCategories();
  }

  @Get('tags')
  @Header(
    'Cache-Control',
    'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
  )
  listTags() {
    return this.blogs.listTags();
  }

  // ==========================================
  // Editorial & Admin Protected Endpoints
  // ==========================================

  @Get('me/blogs')
  async listManageable(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.blogs.listManageable(await this.currentUser(req), {
      search,
      status,
      categoryId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('me/blogs/:id')
  async getManageable(@Param('id') id: string, @Req() req: Request) {
    return this.blogs.getManageable(id, await this.currentUser(req));
  }

  @Post('blogs')
  async create(@Req() req: Request) {
    const currentUser = await this.currentUser(req);
    return this.blogs.create(
      this.parse(createBlogSchema, req.body),
      currentUser,
    );
  }

  @Post('blogs/:id/duplicate')
  async duplicate(@Param('id') id: string, @Req() req: Request) {
    return this.blogs.duplicate(id, await this.currentUser(req));
  }

  @Post('blogs/:id/translate')
  async translateBlog(@Param('id') id: string, @Req() req: Request) {
    const targetLanguage = req.body?.targetLanguage || 'HINGLISH';
    if (targetLanguage !== 'HINGLISH' && targetLanguage !== 'ENGLISH') {
      throw new BadRequestException(
        'targetLanguage must be HINGLISH or ENGLISH',
      );
    }
    return this.blogs.translateBlog(
      id,
      targetLanguage,
      await this.currentUser(req),
    );
  }

  @Post('blogs/ai-seo')
  async getSeoSuggestions(@Req() req: Request) {
    const body = (req.body as any) || {};
    return this.blogs.getSeoSuggestions(
      {
        blogId: body.blogId,
        title: body.title,
        description: body.description,
        content: body.content,
        language: body.language,
      },
      await this.currentUser(req),
    );
  }

  @Post('blogs/ai-image-meta')
  async getImageMeta(@Req() req: Request) {
    const body = (req.body as any) || {};
    return this.blogs.generateImageMeta(
      {
        articleTitle: body.articleTitle,
        sectionHeading: body.sectionHeading,
        contextText: body.contextText,
        language: body.language,
      },
      await this.currentUser(req),
    );
  }

  @Post('blogs/translate-content')
  async translateMarkdownContent(@Req() req: Request) {
    const body = (req.body as any) || {};
    return this.blogs.translateMarkdownContent(
      {
        title: body.title || '',
        markdown: body.markdown || '',
        sourceLanguage: body.sourceLanguage,
        targetLanguage: body.targetLanguage,
      },
      await this.currentUser(req),
    );
  }

  @Post('blogs/save-bilingual')
  async saveBilingual(@Req() req: Request) {
    const body = (req.body as any) || {};
    return this.blogs.saveBilingual(body, await this.currentUser(req));
  }

  @Get('blogs/ai/providers')
  @Header('Cache-Control', 'private, no-store')
  async articleProviders(@Req() req: Request) {
    return this.blogs.getArticleProviders(await this.currentUser(req));
  }

  @Post('blogs/generate-from-reference')
  async generateFromReference(@Req() req: Request) {
    const body = (req.body as any) || {};
    if (
      !body.referenceContent ||
      typeof body.referenceContent !== 'string' ||
      body.referenceContent.trim().length < 50
    ) {
      throw new BadRequestException(
        'referenceContent must be at least 50 characters.',
      );
    }
    const currentUser = await this.currentUser(req); // Auth guard — must be logged in
    const requestedModel =
      typeof body.model === 'string' && body.model.trim()
        ? body.model.trim()
        : undefined;
    return this.blogs.generateBilingualFromReference(
      {
        referenceContent: body.referenceContent,
        category: body.category,
        additionalInstructions: body.additionalInstructions,
        images: Array.isArray(body.images) ? body.images : undefined,
        model: requestedModel,
        provider: body.provider,
      },
      currentUser,
    );
  }

  @Post('blogs/generate-from-reference/stream')
  async generateFromReferenceStream(@Req() req: Request, @Res() res: Response) {
    const body = (req.body as any) || {};
    if (
      !body.referenceContent ||
      typeof body.referenceContent !== 'string' ||
      body.referenceContent.trim().length < 50
    ) {
      res
        .status(400)
        .json({ message: 'referenceContent must be at least 50 characters.' });
      return;
    }
    const currentUser = await this.currentUser(req);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const sendEvent = (eventData: any) => {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    const requestedModel =
      typeof body.model === 'string' && body.model.trim()
        ? body.model.trim()
        : undefined;
    sendEvent({
      type: 'stage',
      stage: 'CONNECTED',
      message: `Connected to pipeline. Selected Model: ${requestedModel || 'provider default'}`,
    });

    try {
      const result = await this.blogs.generateBilingualFromReference(
        {
          referenceContent: body.referenceContent,
          category: body.category,
          additionalInstructions: body.additionalInstructions,
          images: Array.isArray(body.images) ? body.images : undefined,
          model: requestedModel,
          provider: body.provider,
        },
        currentUser,
        (stage, message) => {
          sendEvent({ type: 'stage', stage, message });
        },
      );

      sendEvent({ type: 'complete', result });
      res.end();
    } catch (err: any) {
      sendEvent({
        type: 'error',
        message: err?.message || 'AI Generation failed. Please try again.',
      });
      res.end();
    }
  }

  @Patch('blogs/:id')
  async update(@Param('id') id: string, @Req() req: Request) {
    const currentUser = await this.currentUser(req);
    return this.blogs.update(
      id,
      this.parse(updateBlogSchema, req.body),
      currentUser,
    );
  }

  @Delete('blogs/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.blogs.remove(id, await this.currentUser(req));
  }

  // Revisions
  @Get('blogs/:id/revisions')
  async listRevisions(@Param('id') id: string, @Req() req: Request) {
    return this.blogs.listRevisions(id, await this.currentUser(req));
  }

  @Post('blogs/:id/revisions/:revisionId/restore')
  async restoreRevision(
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
    @Req() req: Request,
  ) {
    return this.blogs.restoreRevision(
      id,
      revisionId,
      await this.currentUser(req),
    );
  }

  // Categories CRUD
  @Post('categories')
  async createCategory(@Req() req: Request) {
    return this.blogs.createCategory(
      this.parse(createCategorySchema, req.body),
      await this.currentUser(req),
    );
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Req() req: Request) {
    return this.blogs.updateCategory(
      id,
      this.parse(updateCategorySchema, req.body),
      await this.currentUser(req),
    );
  }

  @Delete('categories/:id')
  @HttpCode(204)
  async deleteCategory(@Param('id') id: string, @Req() req: Request) {
    await this.blogs.deleteCategory(id, await this.currentUser(req));
  }

  // Tags CRUD
  @Post('tags')
  async createTag(@Req() req: Request) {
    return this.blogs.createTag(
      this.parse(createTagSchema, req.body),
      await this.currentUser(req),
    );
  }

  @Delete('tags/:id')
  @HttpCode(204)
  async deleteTag(@Param('id') id: string, @Req() req: Request) {
    await this.blogs.deleteTag(id, await this.currentUser(req));
  }

  // Block granular endpoints
  @Post('blogs/:blogId/blocks')
  async createBlock(@Param('blogId') blogId: string, @Req() req: Request) {
    return this.blogs.createBlock(
      blogId,
      this.parse(createBlockSchema, req.body),
      await this.currentUser(req),
    );
  }

  @Patch('blogs/:blogId/blocks/reorder')
  async reorderBlocks(@Param('blogId') blogId: string, @Req() req: Request) {
    const input = this.parse(reorderBlocksSchema, req.body);
    return this.blogs.reorderBlocks(
      blogId,
      input.blockIds,
      await this.currentUser(req),
    );
  }

  @Patch('blogs/:blogId/blocks/:blockId')
  async updateBlock(
    @Param('blogId') blogId: string,
    @Param('blockId') blockId: string,
    @Req() req: Request,
  ) {
    return this.blogs.updateBlock(
      blogId,
      blockId,
      this.parse(updateBlockSchema, req.body),
      await this.currentUser(req),
    );
  }

  @Delete('blogs/:blogId/blocks/:blockId')
  @HttpCode(204)
  async removeBlock(
    @Param('blogId') blogId: string,
    @Param('blockId') blockId: string,
    @Req() req: Request,
  ) {
    await this.blogs.removeBlock(blogId, blockId, await this.currentUser(req));
  }

  private parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Request body is invalid.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    return parsed.data;
  }

  private currentUser(req: Request) {
    return this.auth.requireUser(req);
  }
}
