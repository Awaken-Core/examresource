/// <reference path="../worker-configuration.d.ts" />

import { httpServerHandler } from 'cloudflare:node';
import { createApplication } from './bootstrap.js';

const workerPort = 3000;
const app = await createApplication();
await app.listen(workerPort);

export default httpServerHandler({ port: workerPort });
