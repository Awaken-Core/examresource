# AuthService

> 88 nodes · cohesion 0.06

## Key Concepts

- **AuthService** (55 connections) — `apps/server/src/modules/auth/auth.service.ts`
- **AuthController** (32 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **auth.controller.ts** (17 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **Req** (15 connections)
- **.googleCallback()** (11 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.tokenHash()** (11 connections) — `apps/server/src/modules/auth/auth.service.ts`
- **.assertSafeMutation()** (10 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.logout()** (10 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **auth.dto.ts** (10 connections) — `apps/server/src/modules/auth/dto/auth.dto.ts`
- **.google()** (9 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.login()** (9 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.loginWithGoogle()** (8 connections) — `apps/server/src/modules/auth/auth.service.ts`
- **password-hash.ts** (8 connections) — `apps/server/src/modules/auth/password-hash.ts`
- **.forgotPassword()** (7 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.isHostedEnvironment()** (7 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.parse()** (7 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.resetPassword()** (7 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.revokeSession()** (7 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.updateProfile()** (7 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.verifyEmail()** (7 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.login()** (7 connections) — `apps/server/src/modules/auth/auth.service.ts`
- **hashPassword()** (7 connections) — `apps/server/src/modules/auth/password-hash.ts`
- **.register()** (6 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.requireSession()** (6 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- **.sessions()** (6 connections) — `apps/server/src/modules/auth/auth.controller.ts`
- *... and 63 more nodes in this community*

## Relationships

- [auth.service.ts](auth.service.ts.md) (14 shared connections)
- [@nestjs/common](@nestjs-common.md) (8 shared connections)
- [BlogService](BlogService.md) (8 shared connections)
- [.requireUser](requireUser.md) (5 shared connections)
- [comments.service.ts](comments.service.ts.md) (3 shared connections)
- [ExamService](ExamService.md) (3 shared connections)
- [CommentsService](CommentsService.md) (2 shared connections)
- [blog.cache.spec.ts](blog.cache.spec.ts.md) (1 shared connections)
- [blog.service.ts](blog.service.ts.md) (1 shared connections)
- [question.dto.ts](question.dto.ts.md) (1 shared connections)
- [test-series.service.ts](test-series.service.ts.md) (1 shared connections)
- [BookService](BookService.md) (1 shared connections)

## Source Files

- `apps/server/src/modules/auth/auth.controller.ts`
- `apps/server/src/modules/auth/auth.profile.spec.ts`
- `apps/server/src/modules/auth/auth.redirect.spec.ts`
- `apps/server/src/modules/auth/auth.service.ts`
- `apps/server/src/modules/auth/dto/auth.dto.ts`
- `apps/server/src/modules/auth/password-hash.spec.ts`
- `apps/server/src/modules/auth/password-hash.ts`
- `apps/server/src/modules/blog/blog.controller.ts`
- `apps/server/src/modules/exam/exam.controller.ts`
- `apps/server/src/modules/payments/payment.controller.ts`
- `apps/server/src/modules/test-series/test-series.controller.ts`

## Audit Trail

- EXTRACTED: 257 (94%)
- INFERRED: 17 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*