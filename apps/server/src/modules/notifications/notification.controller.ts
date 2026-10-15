import { BadRequestException, Controller, ForbiddenException, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ClerkAuthService } from '../clerk-auth/clerk-auth.service.js';
import { NotificationService } from './notification.service.js';

@Controller('api/v1')
export class NotificationController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly auth: ClerkAuthService,
  ) {}

  @Get('me/notifications')
  async listMine(@Req() req: Request) {
    const user = await this.auth.requireUser(req);
    const items = await this.notifications.listForUser(user.id);
    return {
      unreadCount: items.filter((item) => !item.read).length,
      items,
    };
  }

  @Post('me/notifications/read')
  async markRead(@Req() req: Request) {
    const user = await this.auth.requireUser(req);
    const ids = req.body?.ids;
    if (ids != null && (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string'))) {
      throw new BadRequestException('ids must be a list of notification ids.');
    }
    return this.notifications.markRead(user.id, ids);
  }

  @Get('notifications')
  async listAll(@Req() req: Request) {
    await this.requireAdmin(req);
    return this.notifications.listRecent();
  }

  @Post('notifications')
  async broadcast(@Req() req: Request) {
    const admin = await this.requireAdmin(req);
    return this.notifications.broadcast(admin.id, {
      title: req.body?.title,
      body: req.body?.body,
      href: req.body?.href,
    });
  }

  private async requireAdmin(req: Request) {
    const user = await this.auth.requireUser(req);
    if (user.role !== 'admin') {
      throw new ForbiddenException('Administrator access is required.');
    }
    return user;
  }
}
