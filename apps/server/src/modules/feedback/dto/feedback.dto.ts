import { z } from 'zod';
import { feedbackSources, feedbackStatuses } from '../../../core/schema/feedback.schema.js';

export const createFeedbackSchema = z.object({
  source: z.enum(feedbackSources),
  message: z.string().trim().min(3, 'Message must be at least 3 characters.').max(3000, 'Message cannot exceed 3000 characters.'),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  testId: z.string().trim().optional().nullable(),
  testTitle: z.string().trim().max(200).optional().nullable(),
  attemptId: z.string().trim().optional().nullable(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(feedbackStatuses),
  adminNotes: z.string().trim().max(1000).optional().nullable(),
});

export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;

