import { httpServerHandler } from 'cloudflare:node';
import {
  enableWorkerDatabaseProxy,
  runWithMongoDONamespace,
} from './core/database/durable-model.js';

export { MongoDurableObject } from './core/database/mongo-durable-object.js';

const workerPort = 3000;
// This runs before Nest creates DatabaseModule, preventing a Worker-global
// Mongoose connection during application bootstrap.
enableWorkerDatabaseProxy();

let handlerPromise: Promise<ReturnType<typeof httpServerHandler>> | undefined;

function exposeRuntimeVariables(env: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(env)) {
    // Durable Object bindings are objects and must remain on `env`; only
    // string vars/secrets are compatible with the Nest Node configuration.
    if (typeof value === 'string') {
      process.env[name] = value;
    }
  }
}

async function getHandler(env: Record<string, unknown>) {
  exposeRuntimeVariables(env);
  handlerPromise ??= (async () => {
    // Import after runtime variables are available. Importing bootstrap at
    // module scope runs EnvSchema.parse() before a Worker fetch receives env.
    const { createApplication } = await import('./bootstrap.js');
    const app = await createApplication();
    await app.listen(workerPort);
    return httpServerHandler({ port: workerPort });
  })();
  return handlerPromise;
}

export default {
  async fetch(request: any, env: any, ctx: any) {
    return runWithMongoDONamespace(env.MONGO_DO, async () => {
      const handler = await getHandler(env);
      const fetchHandler = handler.fetch;
      if (fetchHandler) {
        return fetchHandler(request, env, ctx);
      }
      throw new Error('httpServerHandler did not expose a fetch handler');
    });
  },
};
