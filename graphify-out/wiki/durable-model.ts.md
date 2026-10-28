# durable-model.ts

> 46 nodes · cohesion 0.08

## Key Concepts

- **durable-model.ts** (20 connections) — `apps/server/src/core/database/durable-model.ts`
- **DurableQuery** (13 connections) — `apps/server/src/core/database/durable-model.ts`
- **executeDatabaseOperation()** (11 connections) — `apps/server/src/core/database/durable-model.ts`
- **worker.ts** (10 connections) — `apps/server/src/worker.ts`
- **durable-model.spec.ts** (8 connections) — `apps/server/src/core/database/durable-model.spec.ts`
- **serializer.ts** (8 connections) — `apps/server/src/core/database/serializer.ts`
- **MongoDurableObject** (7 connections) — `apps/server/src/core/database/mongo-durable-object.ts`
- **serializer.spec.ts** (7 connections) — `apps/server/src/core/database/serializer.spec.ts`
- **deserializeInDO()** (6 connections) — `apps/server/src/core/database/serializer.ts`
- **deserializeResultInWorker()** (6 connections) — `apps/server/src/core/database/serializer.ts`
- **serializeForDO()** (6 connections) — `apps/server/src/core/database/serializer.ts`
- **serializeResultFromDO()** (6 connections) — `apps/server/src/core/database/serializer.ts`
- **DatabaseModule** (5 connections) — `apps/server/src/core/database/database.module.ts`
- **createDurableConnection()** (5 connections) — `apps/server/src/core/database/durable-model.ts`
- **.exec()** (4 connections) — `apps/server/src/core/database/durable-model.ts`
- **runWithMongoDONamespace()** (4 connections) — `apps/server/src/core/database/durable-model.ts`
- **MongoDOQuery** (4 connections) — `apps/server/src/core/database/mongo-durable-object.ts`
- **.runQuery()** (4 connections) — `apps/server/src/core/database/mongo-durable-object.ts`
- **getHandler()** (4 connections) — `apps/server/src/worker.ts`
- **.forRoot()** (3 connections) — `apps/server/src/core/database/database.module.ts`
- **createDurableModelProxy()** (3 connections) — `apps/server/src/core/database/durable-model.ts`
- **getMongoDOStub()** (3 connections) — `apps/server/src/core/database/durable-model.ts`
- **isWorkerDatabaseProxyEnabled()** (3 connections) — `apps/server/src/core/database/durable-model.ts`
- **.ensureConnected()** (3 connections) — `apps/server/src/core/database/mongo-durable-object.ts`
- **.execute()** (3 connections) — `apps/server/src/core/database/mongo-durable-object.ts`
- *... and 21 more nodes in this community*

## Relationships

- [blog.service.ts](blog.service.ts.md) (7 shared connections)
- [comments.service.ts](comments.service.ts.md) (6 shared connections)
- [auth.service.ts](auth.service.ts.md) (6 shared connections)
- [@nestjs/common](@nestjs-common.md) (1 shared connections)

## Source Files

- `apps/server/src/core/database/database.module.ts`
- `apps/server/src/core/database/durable-model.spec.ts`
- `apps/server/src/core/database/durable-model.ts`
- `apps/server/src/core/database/mongo-durable-object.ts`
- `apps/server/src/core/database/serializer.spec.ts`
- `apps/server/src/core/database/serializer.ts`
- `apps/server/src/worker.ts`

## Audit Trail

- EXTRACTED: 101 (94%)
- INFERRED: 6 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*