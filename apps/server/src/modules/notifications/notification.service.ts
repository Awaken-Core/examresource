import { Injectable } from '@nestjs/common';
import {
  createBroadcastNotification,
  listNotificationsForUser,
  listRecentNotifications,
  markNotificationsRead,
} from './notification.store.js';

@Injectable()
export class NotificationService {
  listForUser(userId: string) {
    return listNotificationsForUser(userId);
  }

  markRead(userId: string, ids?: string[]) {
    return markNotificationsRead(userId, ids);
  }

  broadcast(adminId: string, input: { title: unknown; body: unknown; href?: unknown }) {
    return createBroadcastNotification(adminId, input);
  }

  listRecent() {
    return listRecentNotifications();
  }
}
