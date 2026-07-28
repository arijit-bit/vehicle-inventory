import { z } from 'zod';

const durationSchema = z
  .string()
  .regex(/^\d+(ms|s|m|h|d)$/, 'JWT_EXPIRES_IN must include a time unit such as 15m');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: durationSchema.default('15m'),
  JWT_ISSUER: z.string().min(1).default('vehicle-inventory-api'),
  JWT_AUDIENCE: z.string().min(1).default('vehicle-inventory-web'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
});

export const loadEnv = (source: NodeJS.ProcessEnv = process.env) => envSchema.parse(source);

export type AppEnv = ReturnType<typeof loadEnv>;
