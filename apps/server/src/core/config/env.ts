import 'dotenv/config';
import { z } from 'zod';

export const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default('postgres://postgres:postgres@localhost:5433/postgres'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:4321'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
export const env = EnvSchema.parse(process.env);
