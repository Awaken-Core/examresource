import { createApplication } from './bootstrap.js';
import { env } from './core/config/env.js';

async function bootstrap() {
  const app = await createApplication();
  await app.listen(env.PORT, '0.0.0.0');
}
await bootstrap();
