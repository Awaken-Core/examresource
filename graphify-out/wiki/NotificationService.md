# NotificationService

> 16 nodes · cohesion 0.21

## Key Concepts

- **NotificationService** (10 connections) — `apps/server/src/modules/notifications/notification.service.ts`
- **NotificationController** (9 connections) — `apps/server/src/modules/notifications/notification.controller.ts`
- **.broadcast()** (5 connections) — `apps/server/src/modules/notifications/notification.controller.ts`
- **.listAll()** (5 connections) — `apps/server/src/modules/notifications/notification.controller.ts`
- **.listMine()** (5 connections) — `apps/server/src/modules/notifications/notification.controller.ts`
- **.markRead()** (5 connections) — `apps/server/src/modules/notifications/notification.controller.ts`
- **.requireAdmin()** (4 connections) — `apps/server/src/modules/notifications/notification.controller.ts`
- **Req** (4 connections)
- **.constructor()** (3 connections) — `apps/server/src/modules/notifications/notification.controller.ts`
- **.broadcast()** (3 connections) — `apps/server/src/modules/notifications/notification.service.ts`
- **.listForUser()** (3 connections) — `apps/server/src/modules/notifications/notification.service.ts`
- **.listRecent()** (3 connections) — `apps/server/src/modules/notifications/notification.service.ts`
- **.markRead()** (3 connections) — `apps/server/src/modules/notifications/notification.service.ts`
- **Get** (2 connections)
- **Controller** (1 connections)
- **Injectable** (1 connections)

## Relationships

- [notification.store.ts](notification.store.ts.md) (6 shared connections)
- [@nestjs/common](@nestjs-common.md) (4 shared connections)
- [.requireUser](requireUser.md) (3 shared connections)
- [BlogService](BlogService.md) (2 shared connections)
- [AuthService](AuthService.md) (1 shared connections)

## Source Files

- `apps/server/src/modules/notifications/notification.controller.ts`
- `apps/server/src/modules/notifications/notification.service.ts`

## Audit Trail

- EXTRACTED: 34 (83%)
- INFERRED: 7 (17%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*