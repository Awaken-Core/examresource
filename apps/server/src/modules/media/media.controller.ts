import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { MediaService } from './media.service.js';

export interface UploadedMediaFile {
  buffer: Buffer;
  originalname?: string;
  size: number;
  mimetype?: string;
}

@Controller('api/v1/uploads')
export class MediaController {
  constructor(
    private readonly auth: AuthService,
    private readonly media: MediaService,
  ) {}

  @Get('images')
  async listMedia(@Req() req: Request) {
    const user = await this.auth.requireUser(req);
    return this.media.listMedia(user);
  }

  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB upload limit before compression
    }),
  )
  async uploadCompressedImage(
    @Req() req: Request,
    @UploadedFile() file?: UploadedMediaFile,
  ) {
    const user = await this.auth.requireUser(req);
    if (!file || !file.buffer) {
      throw new BadRequestException('No image file provided in upload request.');
    }
    return this.media.uploadCompressedImage(user, file);
  }

  @Post('images/sign')
  async signImageUpload(@Req() req: Request, @Body() body: unknown) {
    const user = await this.auth.requireUser(req);
    return this.media.createImageUploadUrl(user, (body ?? {}) as { contentType?: unknown; size?: unknown });
  }
}

