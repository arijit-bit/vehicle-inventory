import { z } from 'zod';

const hasQualifiedDomain = (email: string) => {
  const domain = email.split('@')[1];

  return Boolean(
    domain &&
      domain.includes('.') &&
      !domain.startsWith('.') &&
      !domain.endsWith('.') &&
      !domain.includes('..'),
  );
};

export const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(320, 'Email must be 320 characters or fewer')
  .email('Enter a valid email address')
  .refine(hasQualifiedDomain, 'Enter an email address with a valid domain');

const withinBcryptLimit = (password: string) => Buffer.byteLength(password, 'utf8') <= 72;

const registrationPasswordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters')
  .refine(withinBcryptLimit, 'Password must be 72 bytes or fewer');

const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine(withinBcryptLimit, 'Password must be 72 bytes or fewer');

export const registrationSchema = z.object({
  email: normalizedEmailSchema,
  password: registrationPasswordSchema,
});

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: loginPasswordSchema,
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
