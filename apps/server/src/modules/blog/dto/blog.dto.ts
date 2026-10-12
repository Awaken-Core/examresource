import { z } from 'zod';

const blogStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
const blockTypes = [
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
] as const;

export const createBlockSchema = z.object({
  type: z.enum(blockTypes),
  value: z.string().max(100_000),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateBlockSchema = createBlockSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required.',
  });

export const reorderBlocksSchema = z.object({
  blockIds: z
    .array(z.uuid())
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
  blocks: z.array(createBlockSchema).max(1_000).optional(),
});

export const updateBlogSchema = createBlogSchema
  .omit({ blocks: true })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required.',
  });

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
