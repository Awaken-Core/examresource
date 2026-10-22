import 'dotenv/config';
import { z } from 'zod';
export const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .regex(
      /^mongodb(?:\+srv)?:\/\//,
      'DATABASE_URL must be a MongoDB connection URI',
    ),
  NODE_ENV: z.enum(['development', 'test', 'production', 'preview']),
  CLIENT_URL: z.string().url(),
  PORT: z.coerce.number().int().min(1).max(65535),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  COMMENT_IP_HASH_SECRET: z.string().min(32).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(3).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_BACKUP_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GEMINI_FALLBACK_MODELS: z.string().optional(),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1).optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().url().optional(),
  ),
  OPENROUTER_MODEL: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().url().optional(),
  ),
  GROQ_MODEL: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
export const env = EnvSchema.parse(process.env);
