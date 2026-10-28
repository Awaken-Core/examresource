# ExamService

> 72 nodes · cohesion 0.07

## Key Concepts

- **ExamService** (38 connections) — `apps/server/src/modules/exam/exam.service.ts`
- **ExamController** (22 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **Req** (15 connections)
- **exam.controller.ts** (14 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **exam.dto.ts** (12 connections) — `apps/server/src/modules/exam/dto/exam.dto.ts`
- **Param** (12 connections)
- **.getAttempt()** (10 connections) — `apps/server/src/modules/exam/exam.service.ts`
- **.create()** (8 connections) — `apps/server/src/modules/exam/exam.service.ts`
- **.formatAttempt()** (8 connections) — `apps/server/src/modules/exam/exam.service.ts`
- **.requireActiveAttempt()** (8 connections) — `apps/server/src/modules/exam/exam.service.ts`
- **.update()** (8 connections) — `apps/server/src/modules/exam/exam.service.ts`
- **.answer()** (7 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.remove()** (7 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.update()** (7 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.updateSectionProgress()** (7 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **Get** (7 connections)
- **.startAttempt()** (7 connections) — `apps/server/src/modules/exam/exam.service.ts`
- **.adminGetAttempt()** (6 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.adminListAttempts()** (6 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.attempt()** (6 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.clearAnswer()** (6 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.create()** (6 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.pause()** (6 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.resume()** (6 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- **.start()** (6 connections) — `apps/server/src/modules/exam/exam.controller.ts`
- *... and 47 more nodes in this community*

## Relationships

- [CurrentUser](CurrentUser.md) (20 shared connections)
- [.requireUser](requireUser.md) (15 shared connections)
- [question.service.ts](question.service.ts.md) (7 shared connections)
- [BlogService](BlogService.md) (5 shared connections)
- [@nestjs/common](@nestjs-common.md) (4 shared connections)
- [AuthService](AuthService.md) (3 shared connections)
- [auth.service.ts](auth.service.ts.md) (3 shared connections)
- [exam.module.ts](exam.module.ts.md) (3 shared connections)
- [index.ts](index.ts.md) (1 shared connections)

## Source Files

- `apps/server/src/modules/exam/dto/exam.dto.ts`
- `apps/server/src/modules/exam/exam.controller.ts`
- `apps/server/src/modules/exam/exam.service.spec.ts`
- `apps/server/src/modules/exam/exam.service.ts`

## Audit Trail

- EXTRACTED: 203 (86%)
- INFERRED: 33 (14%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*