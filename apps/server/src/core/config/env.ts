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
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  CLERK_SECRET_KEY: z.string().min(1).default('sk_test_placeholder_key'),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(3).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
});

export type Env = z.infer<typeof EnvSchema>;
export const env = EnvSchema.parse(process.env);
