import { z } from 'zod';

const optionSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  content: z.string().trim().min(1).max(10_000),
  translations: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().trim().max(2_000).nullable().optional(),
  isCorrect: z.boolean(),
});

const baseQuestionSchema = z.object({
  content: z.string().trim().min(1).max(50_000),
  translations: z.record(z.string(), z.string()).optional(),
  explanation: z.string().trim().max(50_000).nullable().optional(),
  explanationTranslations: z.record(z.string(), z.string()).optional(),
  type: z.enum(['single_choice', 'multiple_choice', 'numerical']).default('single_choice'),
  numericalAnswer: z.string().trim().max(100).nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  isAvailableForNewTests: z.boolean().default(true),
  subject: z.string().trim().min(1).max(200),
  subjectId: z.string().trim().nullable().optional(),
  chapterId: z.string().trim().nullable().optional(),
  topic: z.string().trim().max(200).nullable().optional(),
  subtopic: z.string().trim().max(200).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  marks: z.number().positive().max(10_000).default(1),
  negativeMarks: z.number().min(0).max(10_000).default(0),
  source: z.string().trim().max(2_000).nullable().optional(),
  options: z.array(optionSchema).max(20).default([]),
});

export const questionSchema = baseQuestionSchema.superRefine((input, ctx) => {
  if (input.type === 'numerical') {
    if (!input.numericalAnswer || input.numericalAnswer.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['numericalAnswer'],
        message: 'A numerical question requires a numericalAnswer.',
      });
    }
  } else {
    if (!input.options || input.options.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Multiple choice questions require at least 2 options.',
      });
      return;
    }
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
    if (input.type === 'numerical' && input.numericalAnswer !== undefined && !input.numericalAnswer) {
      ctx.addIssue({
        code: 'custom',
        path: ['numericalAnswer'],
        message: 'A numerical question requires a valid numericalAnswer.',
      });
    }
    if (input.options && input.type !== 'numerical') {
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

export const generateQuestionsAiSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  topic: z.string().trim().max(200).optional(),
  examName: z.string().trim().max(200).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  count: z.number().int().min(1).max(20).default(5),
  language: z.enum(['bilingual', 'english', 'hindi']).default('bilingual'),
  additionalPrompt: z.string().trim().max(2_000).optional(),
});

export const translateExplainAiSchema = z.object({
  content: z.string().trim().min(1),
  options: z
    .array(
      z.object({
        content: z.string().trim().min(1),
        isCorrect: z.boolean(),
      }),
    )
    .min(2)
    .max(10),
  explanation: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  topic: z.string().trim().optional(),
});

export const parseRawQuestionsAiSchema = z.object({
  rawText: z.string().trim().min(10).max(50_000),
  subject: z.string().trim().optional(),
  topic: z.string().trim().optional(),
  examName: z.string().trim().optional(),
});

export type CreateQuestionsInput = z.infer<typeof createQuestionsSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ReportQuestionInput = z.infer<typeof reportQuestionSchema>;
export type GenerateQuestionsAiInput = z.input<typeof generateQuestionsAiSchema>;
export type TranslateExplainAiInput = z.infer<typeof translateExplainAiSchema>;
export type ParseRawQuestionsAiInput = z.infer<typeof parseRawQuestionsAiSchema>;

