import { z } from 'zod';

export const createCommentSchema = z.object({
  authorName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  content: z.string().trim().min(1).max(2_000),
  parentCommentId: z.string().trim().min(1).max(80).optional(),
});

export const moderateCommentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SPAM']),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(2_000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ModerateCommentInput = z.infer<typeof moderateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

