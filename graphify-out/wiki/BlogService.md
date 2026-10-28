# BlogService

> 117 nodes · cohesion 0.05

## Key Concepts

- **BlogService** (53 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **Post** (52 connections) — `apps/client/src/components/admin/api.ts`
- **BlogController** (37 connections) — `apps/server/src/modules/blog/blog.controller.ts`
- **.currentUser()** (26 connections) — `apps/server/src/modules/blog/blog.controller.ts`
- **Req** (24 connections)
- **blog-content.adapter.ts** (20 connections) — `apps/server/src/modules/blog/blog-content.adapter.ts`
- **.update()** (20 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **.create()** (18 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **Param** (15 connections)
- **.findManageable()** (12 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **blocksToHtml()** (10 connections) — `apps/server/src/modules/blog/blog-content.adapter.ts`
- **.assertCanWrite()** (10 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **.duplicate()** (10 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **.getManageable()** (10 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **.invalidateCache()** (10 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **.parse()** (9 connections) — `apps/server/src/modules/blog/blog.controller.ts`
- **Get** (9 connections)
- **.getPublished()** (9 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **renderSingleBlock()** (8 connections) — `apps/server/src/modules/blog/blog-content.adapter.ts`
- **.saveBilingual()** (8 connections) — `apps/server/src/modules/blog/blog.service.ts`
- **htmlToBlocks()** (7 connections) — `apps/server/src/modules/blog/blog-content.adapter.ts`
- **syncImageBlocks()** (7 connections) — `apps/server/src/modules/blog/blog-content.adapter.ts`
- **.createBlock()** (7 connections) — `apps/server/src/modules/blog/blog.controller.ts`
- **.deleteCategory()** (7 connections) — `apps/server/src/modules/blog/blog.controller.ts`
- **.deleteTag()** (7 connections) — `apps/server/src/modules/blog/blog.controller.ts`
- *... and 92 more nodes in this community*

## Relationships

- [blog.service.ts](blog.service.ts.md) (20 shared connections)
- [.requireUser](requireUser.md) (9 shared connections)
- [AuthService](AuthService.md) (8 shared connections)
- [QuestionController](QuestionController.md) (6 shared connections)
- [ExamService](ExamService.md) (5 shared connections)
- [GeminiService](GeminiService.md) (5 shared connections)
- [MediaService](MediaService.md) (3 shared connections)
- [PaymentController](PaymentController.md) (3 shared connections)
- [ArticlesManager.tsx](ArticlesManager.tsx.md) (3 shared connections)
- [NotificationService](NotificationService.md) (2 shared connections)
- [auth.service.ts](auth.service.ts.md) (2 shared connections)
- [blog.cache.spec.ts](blog.cache.spec.ts.md) (2 shared connections)

## Source Files

- `apps/client/src/components/admin/api.ts`
- `apps/server/src/modules/blog/blog-content.adapter.spec.ts`
- `apps/server/src/modules/blog/blog-content.adapter.ts`
- `apps/server/src/modules/blog/blog.controller.ts`
- `apps/server/src/modules/blog/blog.service.ts`
- `apps/server/src/modules/blog/dto/blog.dto.ts`

## Audit Trail

- EXTRACTED: 391 (89%)
- INFERRED: 46 (11%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*