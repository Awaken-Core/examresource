import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ClerkAuthService } from '../clerk-auth/clerk-auth.service.js';
import { MediaService } from './media.service.js';

@Controller('api/v1/uploads')
export class MediaController {
  constructor(
    private readonly auth: ClerkAuthService,
    private readonly media: MediaService,
  ) {}

  @Post('images/sign')
  async signImageUpload(@Req() req: Request, @Body() body: unknown) {
    const user = await this.auth.requireUser(req);
    return this.media.createImageUploadUrl(user, (body ?? {}) as { contentType?: unknown; size?: unknown });
  }
}
