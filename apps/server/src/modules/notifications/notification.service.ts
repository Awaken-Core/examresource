import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  Notification,
  type NotificationDocument,
  NotificationRead,
  type NotificationReadDocument,
  User,
  type UserDocument,
} from '../../core/schema/index.js';
import {
  createBroadcastNotification,
  listNotificationsForUser,
  listRecentNotifications,
  markNotificationsRead,
} from './notification.store.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationRead.name)
    private readonly notificationReadModel: Model<NotificationReadDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  listForUser(userId: string) {
    return listNotificationsForUser(
      this.notificationModel,
      this.notificationReadModel,
      this.userModel,
      userId,
    );
  }

  markRead(userId: string, ids?: string[]) {
    return markNotificationsRead(
      this.notificationModel,
      this.notificationReadModel,
      this.userModel,
      userId,
      ids,
    );
  }

  broadcast(adminId: string, input: { title: unknown; body: unknown; href?: unknown }) {
    return createBroadcastNotification(this.notificationModel, adminId, input);
  }

  listRecent() {
    return listRecentNotifications(this.notificationModel);
  }
}
