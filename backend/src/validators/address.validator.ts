import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1),
  ward: z.string().min(1),
  district: z.string().min(1),
  city: z.string().min(1),
  isDefault: z.boolean().optional(),
  phone: z.string().min(8),
});
