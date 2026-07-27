import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  slug: z.string().optional(),
  content: z.string().min(1, 'Nội dung không được để trống'),
  excerpt: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  tags: z.string().optional().default('[]'),
  categoryId: z.string().optional().nullable(),
  isPublished: z.boolean().optional().default(false),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export const updateArticleSchema = createArticleSchema.partial();
