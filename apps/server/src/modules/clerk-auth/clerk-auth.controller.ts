import { BadRequestException, Controller, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import { verifyWebhook } from '@clerk/backend/webhooks';
import type { Request } from 'express';
import { env } from '../../core/config/env.js';
import { ClerkAuthService } from './clerk-auth.service.js';

@Controller('api/v1')
export class ClerkAuthController {
  constructor(private readonly auth: ClerkAuthService) {}

  @Get('me')
  me(@Req() req: Request) {
    return this.auth.requireUser(req);
  }

  @Get('authors')
  listAuthors(@Req() req: Request) {
    return this.auth.listAuthors(req);
  }

  @Get('users')
  listUsers(@Req() req: Request) {
    return this.auth.listUsers(req);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Req() req: Request) {
    const role = req.body?.role;
    if (role !== 'student' && role !== 'editor' && role !== 'admin') {
      throw new BadRequestException('Role must be student, editor, or admin.');
    }
    return this.auth.updateUserRole(req, id, role);
  }

  @Post('webhooks/clerk')
  @HttpCode(204)
  async webhook(@Req() req: Request & { rawBody?: Buffer }) {
    if (!env.CLERK_WEBHOOK_SIGNING_SECRET || !req.rawBody) {
      throw new BadRequestException('Clerk webhook handling is not configured.');
    }
    let event: Awaited<ReturnType<typeof verifyWebhook>>;
    try {
      event = await verifyWebhook(
        new Request('http://localhost/api/v1/webhooks/clerk', {
          method: 'POST',
          headers: req.headers as HeadersInit,
          body: req.rawBody.toString('utf8'),
        }),
        { signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET },
      );
    } catch {
      throw new BadRequestException('Webhook signature is invalid.');
    }

    if (event.type === 'user.created' || event.type === 'user.updated') {
      await this.auth.syncProfile(event.data.id);
    } else if (event.type === 'user.deleted' && event.data.id) {
      await this.auth.suspendProfile(event.data.id);
    }
  }
}
