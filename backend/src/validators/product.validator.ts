import { z } from 'zod';

const coerceNum = (schema: z.ZodTypeAny) => z.preprocess(
  (val) => {
    if (val === null || val === undefined) return val;
    if (val === '') return undefined;
    return Number(val);
  },
  schema,
);

export const createProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  slug: z.string().optional(),
  description: z.string().optional(),
  basePrice: coerceNum(z.number().positive('Giá gốc phải lớn hơn 0')),
  salePrice: coerceNum(z.number().positive().optional().nullable()),
  sku: z.string().min(1, 'SKU không được để trống'),
  barcode: z.string().optional().nullable(),
  stock: coerceNum(z.number().int().min(0)).default(0),
  weight: coerceNum(z.number().positive().optional().nullable()),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  categoryId: z.string().min(1, 'Danh mục không được để trống'),
  brandId: z.string().optional().nullable(),
  images: z.array(z.object({
    url: z.string().url('URL ảnh không hợp lệ'),
    alt: z.string().optional().default(''),
    isPrimary: z.boolean().optional().default(false),
    sortOrder: coerceNum(z.number().int().optional()).default(0),
  })).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();
