import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED']),
  cancelReason: z.string().optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED', 'FAILED']),
});
