import { z } from 'zod';

export const blogStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] as const;

export const blockTypes = [
  'PARAGRAPH',
  'HEADING_1',
  'HEADING_2',
  'HEADING_3',
  'HEADING_4',
  'HEADING_5',
  'HEADING_6',
  'IMAGE',
  'VIDEO',
  'QUOTE',
  'CODE',
  'BULLET_LIST',
  'NUMBERED_LIST',
  'DIVIDER',
  'TABLE',
  'CALLOUT',
] as const;

export const createBlockSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(blockTypes),
  value: z.string().max(200_000),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateBlockSchema = createBlockSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required.',
  });

export const reorderBlocksSchema = z.object({
  blockIds: z
    .array(z.string().uuid())
    .max(1_000)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Block IDs must be unique.',
    }),
});

export const createBlogSchema = z.object({
  title: z.string().trim().min(1).max(250),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(250)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2_000).nullable().optional(),
  coverImage: z.string().trim().max(2_000).nullable().optional(),
  status: z.enum(blogStatuses).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  metaTitle: z.string().trim().max(300).nullable().optional(),
  metaDescription: z.string().trim().max(1_000).nullable().optional(),
  canonicalUrl: z.string().trim().url().nullable().optional().or(z.literal('')),
  imageAlt: z.string().trim().max(500).nullable().optional(),
  imageCaption: z.string().trim().max(500).nullable().optional(),
  noindex: z.boolean().optional(),
  version: z.number().int().positive().optional(),
  htmlContent: z.string().optional(), // Raw editor HTML to be parsed to blocks if blocks not provided directly
  blocks: z.array(createBlockSchema).max(1_000).optional(),
});

export const updateBlogSchema = createBlogSchema
  .omit({ blocks: true })
  .partial()
  .extend({
    blocks: z.array(createBlockSchema).max(1_000).optional(),
    currentVersion: z.number().int().positive().optional(), // Optimistic lock
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required.',
  });

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
