import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createTestSeriesSchema = z.object({
  title: z.string().trim().min(2).max(250),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(slugRegex, 'Slug must contain only lowercase alphanumeric characters and hyphens.'),
  description: z.string().trim().max(5_000).nullable().optional(),
  targetExam: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  organization: z.string().trim().max(200).nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  accessType: z.enum(['free', 'premium', 'freemium']).default('free'),
  supportedLanguages: z.array(z.string().trim().min(1)).min(1).default(['Hindi', 'English']),
  badge: z.string().trim().max(50).nullable().optional(),
  logoUrl: z.string().trim().max(2_000).nullable().optional(),
  order: z.number().int().min(0).default(0),
});

export const updateTestSeriesSchema = createTestSeriesSchema
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    'At least one field is required for update.',
  );

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(slugRegex, 'Slug must contain only lowercase alphanumeric characters and hyphens.'),
  description: z.string().trim().max(2_000).nullable().optional(),
  iconUrl: z.string().trim().max(2_000).nullable().optional(),
});

export const updateSubjectSchema = createSubjectSchema
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    'At least one field is required for update.',
  );

export const assignSubjectSchema = z.object({
  subjectId: z.string().min(1),
  order: z.number().int().min(0).default(0),
  customDisplayName: z.string().trim().max(150).nullable().optional(),
});

export const updateSubjectAssignmentSchema = z.object({
  order: z.number().int().min(0).optional(),
  customDisplayName: z.string().trim().max(150).nullable().optional(),
}).refine(
  (input) => Object.keys(input).length > 0,
  'At least one field is required for update.',
);

export const createChapterSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(slugRegex, 'Slug must contain only lowercase alphanumeric characters and hyphens.'),
  subjectId: z.string().min(1),
  description: z.string().trim().max(2_000).nullable().optional(),
  order: z.number().int().min(0).default(0),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});

export const updateChapterSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(slugRegex, 'Slug must contain only lowercase alphanumeric characters and hyphens.')
    .optional(),
  description: z.string().trim().max(2_000).nullable().optional(),
  order: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
}).refine(
  (input) => Object.keys(input).length > 0,
  'At least one field is required for update.',
);

export const reorderChaptersSchema = z.object({
  orders: z.array(
    z.object({
      chapterId: z.string().min(1),
      order: z.number().int().min(0),
    }),
  ).min(1),
});

export const createQuestionMappingSchema = z.object({
  questionId: z.string().min(1),
  testSeriesId: z.string().min(1),
  subjectId: z.string().min(1),
  chapterId: z.string().min(1).nullable().optional(),
  order: z.number().int().min(0).default(0),
});

export const updateQuestionMappingSchema = z.object({
  chapterId: z.string().min(1).nullable().optional(),
  order: z.number().int().min(0).optional(),
}).refine(
  (input) => Object.keys(input).length > 0,
  'At least one field is required for update.',
);

export const questionBankQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: z.enum(['single_choice', 'multiple_choice', 'numerical']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  subject: z.string().trim().optional(),
  subjectId: z.string().trim().optional(),
  chapterId: z.string().trim().optional(),
  topic: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isAvailableForNewTests: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().positive().max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateTestSeriesInput = z.infer<typeof createTestSeriesSchema>;
export type UpdateTestSeriesInput = z.infer<typeof updateTestSeriesSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type AssignSubjectInput = z.infer<typeof assignSubjectSchema>;
export type UpdateSubjectAssignmentInput = z.infer<typeof updateSubjectAssignmentSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type ReorderChaptersInput = z.infer<typeof reorderChaptersSchema>;
export type CreateQuestionMappingInput = z.infer<typeof createQuestionMappingSchema>;
export type UpdateQuestionMappingInput = z.infer<typeof updateQuestionMappingSchema>;
export type QuestionBankQueryInput = z.infer<typeof questionBankQuerySchema>;

// =========================================================================
// 8. INDIVIDUAL TEST BUILDER & SECTION DTOs (STAGE 4)
// =========================================================================

export const testQuestionItemInputSchema = z.object({
  questionId: z.string().min(1),
  marks: z.number().positive().max(10_000).nullable().optional(),
  negativeMarks: z.number().min(0).max(10_000).nullable().optional(),
});

export const testSectionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(200),
  topic: z.string().trim().max(200).nullable().optional(),
  subjectId: z.string().trim().nullable().optional(),
  chapterId: z.string().trim().nullable().optional(),
  order: z.number().int().min(0).default(0),
  durationMinutes: z.number().int().positive().max(1_440).nullable().optional(),
  positiveMarks: z.number().positive().max(100).default(1),
  negativeMarkingEnabled: z.boolean().default(false),
  negativeMarks: z.number().min(0).max(100).default(0),
  selectionMode: z.enum(['manual', 'automatic']).default('manual'),
  questionOrderMode: z.enum(['fixed', 'randomized']).default('fixed'),
  questionSetMode: z.enum(['fixed', 'random_per_attempt']).default('fixed'),
  requiredQuestionCount: z.number().int().positive().max(500).nullable().optional(),
  questions: z.array(testQuestionItemInputSchema).default([]),
});

export const createIndividualTestSchema = z.object({
  testSeriesId: z.string().min(1),
  title: z.string().trim().min(1).max(250),
  description: z.string().trim().max(5_000).nullable().optional(),
  testMode: z.enum(['subject', 'chapter', 'full']),
  subjectId: z.string().trim().nullable().optional(),
  chapterId: z.string().trim().nullable().optional(),
  access: z.enum(['free', 'premium']).default('free'),
  durationMinutes: z.number().int().positive().max(1_440).nullable().optional(),
  maxAttempts: z.number().int().positive().nullable().optional(),
  languages: z.array(z.string().trim().min(1)).min(1).default(['Hindi', 'English']),
  instructions: z.string().trim().max(10_000).nullable().optional(),
  positiveMarks: z.number().positive().max(100).default(1),
  negativeMarkingEnabled: z.boolean().default(false),
  negativeMarks: z.number().min(0).max(100).default(0),
  questionSelectionMode: z.enum(['manual', 'automatic']).default('manual'),
  questionOrderMode: z.enum(['fixed', 'randomized']).default('fixed'),
  questionSetMode: z.enum(['fixed', 'random_per_attempt']).default('fixed'),
  totalQuestionsCount: z.number().int().positive().max(1_000).nullable().optional(),
  availableFrom: z.string().datetime().nullable().optional(),
  availableTo: z.string().datetime().nullable().optional(),
  questions: z.array(testQuestionItemInputSchema).default([]),
  sections: z.array(testSectionInputSchema).default([]),
});

export const updateIndividualTestSchema = createIndividualTestSchema
  .omit({ testSeriesId: true })
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    'At least one field is required for update.',
  );

export const updateTestStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});

export const listIndividualTestsQuerySchema = z.object({
  testMode: z.enum(['subject', 'chapter', 'full']).optional(),
  subjectId: z.string().trim().optional(),
  chapterId: z.string().trim().optional(),
  access: z.enum(['free', 'premium']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type TestQuestionItemInput = z.infer<typeof testQuestionItemInputSchema>;
export type TestSectionInput = z.infer<typeof testSectionInputSchema>;
export type CreateIndividualTestInput = z.infer<typeof createIndividualTestSchema>;
export type UpdateIndividualTestInput = z.infer<typeof updateIndividualTestSchema>;
export type UpdateTestStatusInput = z.infer<typeof updateTestStatusSchema>;
export type ListIndividualTestsQueryInput = z.infer<typeof listIndividualTestsQuerySchema>;
