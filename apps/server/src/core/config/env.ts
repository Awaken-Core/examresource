import { z } from "zod";

export const EnvSchema = z.object({
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.string().optional(),
    CLIENT_URL: z.string().url(),
    PORT: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;
export const env = EnvSchema.parse(process.env);