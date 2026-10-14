import { z } from 'zod';

const testQuestionSchema = z.object({
  questionId: z.uuid(),
  marks: z.number().positive().max(10_000).nullable().optional(),
  negativeMarks: z.number().min(0).max(10_000).nullable().optional(),
});

export const createExamSchema = z.object({
  title: z.string().trim().min(1).max(250),
  description: z.string().trim().max(5_000).nullable().optional(),
  type: z.enum(['exam', 'quiz', 'current_affairs_quiz']),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  subject: z.string().trim().max(200).nullable().optional(),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(10_080)
    .nullable()
    .optional(),
  questions: z
    .array(testQuestionSchema)
    .min(1)
    .max(1_000)
    .refine(
      (items) =>
        new Set(items.map((item) => item.questionId)).size === items.length,
      'Question IDs must be unique.',
    ),
});

export const updateExamSchema = createExamSchema
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    'At least one field is required.',
  );

export const saveAnswerSchema = z.object({
  optionIds: z
    .array(z.uuid())
    .max(20)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'Option IDs must be unique.',
    ),
  timeSpentSeconds: z.number().int().min(0).max(86_400).optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
