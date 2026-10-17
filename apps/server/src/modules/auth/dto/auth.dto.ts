import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(12).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
  phone: z.string().trim().min(7).max(20).optional(),
});
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password,
});
export const verifyEmailSchema = z.object({
  token: z.string().min(32).max(256),
});
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(7).max(20).nullable().optional(),
  })
  .refine((value) => value.name !== undefined || value.phone !== undefined);
