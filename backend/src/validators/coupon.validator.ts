import { z } from 'zod';

const coerceNum = (schema: z.ZodTypeAny) => z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === '') return undefined;
    return Number(val);
  },
  schema,
);

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).transform(s => s.toUpperCase()),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: coerceNum(z.number().positive('Giá trị giảm phải lớn hơn 0')),
  minOrder: coerceNum(z.number().positive().optional()),
  maxDiscount: coerceNum(z.number().positive().optional()),
  usageLimit: coerceNum(z.number().int().positive().optional()),
  startsAt: z.string().min(1, 'Ngày bắt đầu không hợp lệ'),
  expiresAt: z.string().min(1, 'Ngày hết hạn không hợp lệ'),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã giảm giá'),
});
