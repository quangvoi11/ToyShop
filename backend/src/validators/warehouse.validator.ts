import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Tên kho không được để trống'),
  address: z.string().optional().nullable(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();
