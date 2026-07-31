import { z } from 'zod';
import { passwordSchema } from './auth.validator';

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN']),
});

export const resetUserPasswordSchema = z.object({
  newPassword: passwordSchema,
});
