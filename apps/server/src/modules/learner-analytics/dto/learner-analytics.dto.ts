import { z } from 'zod';

export const listPreparationAttemptsQuerySchema = z.object({
  seriesId: z.string().optional(),
  status: z.enum(['all', 'in_progress', 'submitted']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type ListPreparationAttemptsQuery = z.infer<typeof listPreparationAttemptsQuerySchema>;
