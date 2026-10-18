import { z } from 'zod';

const optionSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  content: z.string().trim().min(1).max(10_000),
  imageUrl: z.string().trim().max(2_000).nullable().optional(),
  isCorrect: z.boolean(),
});

const baseQuestionSchema = z.object({
  content: z.string().trim().min(1).max(50_000),
  explanation: z.string().trim().max(50_000).nullable().optional(),
  type: z.enum(['single_choice', 'multiple_choice']).default('single_choice'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  subject: z.string().trim().min(1).max(200),
  topic: z.string().trim().max(200).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  marks: z.number().positive().max(10_000).default(1),
  negativeMarks: z.number().min(0).max(10_000).default(0),
  source: z.string().trim().max(2_000).nullable().optional(),
  options: z.array(optionSchema).min(2).max(20),
});

export const questionSchema = baseQuestionSchema.superRefine((input, ctx) => {
  const correct = input.options.filter((option) => option.isCorrect).length;
  if (correct === 0 || (input.type === 'single_choice' && correct !== 1)) {
    ctx.addIssue({
      code: 'custom',
      path: ['options'],
      message:
        input.type === 'single_choice'
          ? 'A single-choice question must have exactly one correct option.'
          : 'A multiple-choice question must have at least one correct option.',
    });
  }
});

export const createQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(1).max(500),
});

export const updateQuestionSchema = baseQuestionSchema
  .partial()
  .superRefine((input, ctx) => {
    if (Object.keys(input).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one field is required.',
      });
    }
    if (input.options) {
      const correct = input.options.filter((option) => option.isCorrect).length;
      if (correct === 0 || (input.type === 'single_choice' && correct !== 1)) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'The correct options are invalid.',
        });
      }
    }
  });

export const reportQuestionSchema = z.object({
  reason: z.string().trim().min(1).max(250),
  details: z.string().trim().max(5_000).nullable().optional(),
});

export type CreateQuestionsInput = z.infer<typeof createQuestionsSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ReportQuestionInput = z.infer<typeof reportQuestionSchema>;
