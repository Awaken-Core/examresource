import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().trim().min(1).max(250),
  description: z.string().trim().min(1).max(20_000),
  coverImage: z.string().trim().min(1).max(2_000),
  relatedCovers: z
    .array(z.string().trim().min(1).max(2_000))
    .max(20)
    .default([]),
  displayPrice: z.number().min(0).max(10_000_000),
  price: z.number().min(0).max(10_000_000),
  discount: z.number().min(0).max(100).default(0),
  tags: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  publishedAt: z.coerce.date(),
  author: z.string().trim().max(250).nullable().optional(),
  originalPublisher: z.string().trim().max(250).nullable().optional(),
  isArchived: z.boolean().default(false),
});

export const updateBookSchema = createBookSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required.',
  });

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
