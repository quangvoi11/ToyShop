import { z } from 'zod';

const coerceNum = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => {
    if (val === null || val === undefined) return val;
    if (val === '') return undefined;
    return Number(val);
  }, schema);

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: coerceNum(z.number().int().min(0)).default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
