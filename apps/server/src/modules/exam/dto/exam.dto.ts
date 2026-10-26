import { z } from 'zod';

const testQuestionSchema = z.object({
  questionId: z.string().min(1),
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
    .array(z.string().min(1))
    .max(20)
    .optional()
    .default([])
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'Option IDs must be unique.',
    ),
  numericalValue: z.string().trim().max(100).nullable().optional(),
  status: z
    .enum([
      'not_visited',
      'not_answered',
      'answered',
      'marked_for_review',
      'answered_and_marked_for_review',
    ])
    .optional(),
  timeSpentSeconds: z.number().int().min(0).max(86_400).optional(),
});

export const updateSectionProgressSchema = z.object({
  sectionId: z.string().min(1),
  timeSpentSeconds: z.number().int().min(0).default(0),
  isCompleted: z.boolean().default(false),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type UpdateSectionProgressInput = z.infer<typeof updateSectionProgressSchema>;
