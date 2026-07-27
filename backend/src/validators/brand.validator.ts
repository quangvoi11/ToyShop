import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Tên thương hiệu không được để trống'),
  slug: z.string().optional(),
  logo: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();
