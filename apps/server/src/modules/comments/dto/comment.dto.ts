import { z } from 'zod';

export const createCommentSchema = z.object({
  authorName: z.string().trim().min(2).max(100).optional(),
  content: z.string().trim().min(1).max(2_000),
  parentCommentId: z.string().trim().min(1).max(80).optional(),
});

export const moderateCommentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SPAM']),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ModerateCommentInput = z.infer<typeof moderateCommentSchema>;
