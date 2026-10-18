import { httpServerHandler } from 'cloudflare:node';
import { createApplication } from './bootstrap.js';
import {
  enableWorkerDatabaseProxy,
  runWithMongoDONamespace,
} from './core/database/durable-model.js';

export { MongoDurableObject } from './core/database/mongo-durable-object.js';

const workerPort = 3000;
// This runs before Nest creates DatabaseModule, preventing a Worker-global
// Mongoose connection during application bootstrap.
enableWorkerDatabaseProxy();
const app = await createApplication();
await app.listen(workerPort);

const handler = httpServerHandler({ port: workerPort });

export default {
  async fetch(request: any, env: any, ctx: any) {
    const fetchHandler = handler.fetch;
    if (fetchHandler) {
      return runWithMongoDONamespace(env.MONGO_DO, () =>
        fetchHandler(request, env, ctx),
      );
    }
    throw new Error('httpServerHandler did not expose a fetch handler');
  },
};
