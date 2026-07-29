import { z } from 'zod';
import { normalizedEmailSchema } from './auth.schemas.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters')
  .refine(
    (password) => Buffer.byteLength(password, 'utf8') <= 72,
    'Password must be 72 bytes or fewer',
  );

export const userIdSchema = z.string().uuid('User ID must be a valid UUID');

export const createUserSchema = z.object({
  email: normalizedEmailSchema,
  password: passwordSchema,
  role: z.enum(['CUSTOMER', 'EMPLOYEE', 'ADMIN']),
});

export const updateUserSchema = z
  .object({
    email: normalizedEmailSchema.optional(),
    password: passwordSchema.optional(),
    role: z.enum(['CUSTOMER', 'EMPLOYEE', 'ADMIN']).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, 'Provide at least one field to update');

export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
