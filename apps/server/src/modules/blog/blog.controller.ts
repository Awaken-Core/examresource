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
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import { ClerkAuthService } from '../clerk-auth/clerk-auth.service.js';
import { BlogService } from './blog.service.js';
import {
  createBlockSchema,
  createBlogSchema,
  reorderBlocksSchema,
  replaceBlocksSchema,
  updateBlockSchema,
  updateBlogSchema,
} from './dto/blog.dto.js';

@Controller('api/v1')
export class BlogController {
  constructor(
    private readonly blogs: BlogService,
    private readonly auth: ClerkAuthService,
  ) {}

  @Get('blogs')
  listPublished() {
    return this.blogs.listPublished();
  }

  @Get('blogs/:slug')
  getPublished(@Param('slug') slug: string) {
    return this.blogs.getPublished(slug);
  }

  @Get('me/blogs')
  async listManageable(@Req() req: Request) {
    return this.blogs.listManageable(await this.currentUser(req));
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

  @Patch('blogs/:id')
  async update(@Param('id') id: string, @Req() req: Request) {
    const currentUser = await this.currentUser(req);
    return this.blogs.update(
      id,
      this.parse(updateBlogSchema, req.body),
      currentUser,
    );
  }

  @Post('blogs/:blogId/blocks')
  async createBlock(
    @Param('blogId') blogId: string,
    @Req() req: Request,
  ) {
    return this.blogs.createBlock(
      blogId,
      this.parse(createBlockSchema, req.body),
      await this.currentUser(req),
    );
  }

  @Put('blogs/:blogId/blocks')
  async replaceBlocks(
    @Param('blogId') blogId: string,
    @Req() req: Request,
  ) {
    const input = this.parse(replaceBlocksSchema, req.body);
    return this.blogs.replaceBlocks(
      blogId,
      input.blocks,
      await this.currentUser(req),
    );
  }

  @Patch('blogs/:blogId/blocks/reorder')
  async reorderBlocks(
    @Param('blogId') blogId: string,
    @Req() req: Request,
  ) {
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

  @Delete('blogs/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() req: Request) {
    await this.blogs.remove(id, await this.currentUser(req));
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
