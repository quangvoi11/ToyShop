import { z } from 'zod';

export const adjustStockSchema = z.object({
  productId: z.string().min(1, 'Sản phẩm không được để trống'),
  variantId: z.string().optional().nullable(),
  warehouseId: z.string().min(1, 'Kho không được để trống'),
  type: z.enum(['IN', 'OUT', 'ADJUST', 'RETURN']),
  quantity: z.number().int().positive('Số lượng phải lớn hơn 0'),
  note: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
});

export const createBatchSchema = z.object({
  productId: z.string().min(1, 'Sản phẩm không được để trống'),
  variantId: z.string().optional().nullable(),
  warehouseId: z.string().min(1, 'Kho không được để trống'),
  batchCode: z.string().min(1, 'Mã lô không được để trống'),
  quantity: z.number().int().positive('Số lượng phải lớn hơn 0'),
  costPrice: z.number().positive('Giá vốn phải lớn hơn 0'),
  expiryDate: z.string().optional().nullable(),
});

export const updateBatchSchema = z.object({
  batchCode: z.string().optional(),
  costPrice: z.number().positive().optional(),
  expiryDate: z.string().optional().nullable(),
});
