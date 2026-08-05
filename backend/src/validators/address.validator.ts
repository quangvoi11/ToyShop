import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().optional(),
  recipientName: z.string().min(2, 'Tên người nhận bắt buộc'),
  street: z.string().min(1),
  ward: z.string().min(1),
  city: z.string().min(1),
  isDefault: z.boolean().optional(),
  phone: z.string().min(8),
});

export const updateAddressSchema = createAddressSchema.partial();
