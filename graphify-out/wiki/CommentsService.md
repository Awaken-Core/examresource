# CommentsService

> 58 nodes · cohesion 0.07

## Key Concepts

- **CommentsService** (22 connections) — `apps/server/src/modules/comments/comments.service.ts`
- **CommentsController** (17 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **.create()** (11 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **initialize()** (10 connections) — `apps/client/src/components/blog/Comments.astro`
- **.create()** (10 connections) — `apps/server/src/modules/comments/comments.service.ts`
- **Comments.astro** (8 connections) — `apps/client/src/components/blog/Comments.astro`
- **.deleteComment()** (8 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **.moderate()** (8 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **.remove()** (8 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **.updateComment()** (8 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **renderComments()** (7 connections) — `apps/client/src/components/blog/Comments.astro`
- **.listCommentArticles()** (7 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **.listForModeration()** (7 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **.listPublished()** (7 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **Req** (7 connections)
- **.assertSafeMutation()** (6 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **Param** (6 connections)
- **.moderate()** (6 connections) — `apps/server/src/modules/comments/comments.service.ts`
- **.language()** (5 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **.listPublished()** (5 connections) — `apps/server/src/modules/comments/comments.service.ts`
- **.publicComment()** (5 connections) — `apps/server/src/modules/comments/comments.service.ts`
- **createComment()** (4 connections) — `apps/client/src/components/blog/Comments.astro`
- **load()** (4 connections) — `apps/client/src/components/blog/Comments.astro`
- **.parse()** (4 connections) — `apps/server/src/modules/comments/comments.controller.ts`
- **Query** (4 connections)
- *... and 33 more nodes in this community*

## Relationships

- [comments.service.ts](comments.service.ts.md) (8 shared connections)
- [.requireUser](requireUser.md) (6 shared connections)
- [CurrentUser](CurrentUser.md) (6 shared connections)
- [lib/api.ts](lib-api.ts.md) (2 shared connections)
- [@nestjs/common](@nestjs-common.md) (2 shared connections)
- [AuthService](AuthService.md) (2 shared connections)
- [\[slug\].astro]([slug].astro.md) (1 shared connections)
- [BlogService](BlogService.md) (1 shared connections)

## Source Files

- `apps/client/src/components/blog/Comments.astro`
- `apps/server/src/modules/comments/comments.controller.ts`
- `apps/server/src/modules/comments/comments.service.ts`
- `apps/server/src/modules/comments/dto/comment.dto.ts`

## Audit Trail

- EXTRACTED: 129 (85%)
- INFERRED: 22 (15%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*