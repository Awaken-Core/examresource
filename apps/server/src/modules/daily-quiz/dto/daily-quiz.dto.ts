import { z } from 'zod';

export const dailyQuizOptionDtoSchema = z.object({
  id: z.string().min(1),
  text: z.object({
    en: z.string().min(1),
    hi: z.string().optional().nullable(),
  }),
  isCorrect: z.boolean().default(false),
});

export const dailyQuizQuestionDtoSchema = z.object({
  content: z.object({
    en: z.string().min(1),
    hi: z.string().optional().nullable(),
  }),
  options: z.array(dailyQuizOptionDtoSchema).min(2).max(6),
  explanation: z
    .object({
      en: z.string().min(1),
      hi: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  examTip: z
    .object({
      en: z.string().min(1),
      hi: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  marks: z.number().min(0.5).default(1),
  negativeMarks: z.number().min(0).default(0.25),
});

export const createDailyQuizDtoSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  title: z.string().min(3).max(250),
  category: z.enum([
    'current-affairs',
    'quantitative-aptitude',
    'reasoning',
    'english',
    'general-science',
  ]).default('current-affairs'),
  description: z.string().max(1000).optional().nullable(),
  targetExams: z.array(z.string()).default(['ssc', 'rrb', 'banking']),
  durationMinutes: z.number().min(1).max(60).default(10),
  questions: z.array(dailyQuizQuestionDtoSchema).min(1).max(30),
});

export const submitDailyQuizDtoSchema = z.object({
  userResponses: z.record(z.string(), z.string()), // questionId -> optionId
  timeSpentSeconds: z.number().min(0).max(7200).default(0),
});
