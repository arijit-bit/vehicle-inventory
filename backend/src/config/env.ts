import { z } from 'zod';

const durationSchema = z
  .string()
  .regex(/^\d+(ms|s|m|h|d)$/, 'JWT_EXPIRES_IN must include a time unit such as 15m');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    CORS_ORIGIN: z.string().optional(),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DATABASE_LOCK_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(2_000),
    DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(500).max(60_000).default(10_000),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
    JWT_EXPIRES_IN: durationSchema.default('15m'),
    JWT_ISSUER: z.string().min(1).default('vehicle-inventory-api'),
    JWT_AUDIENCE: z.string().min(1).default('vehicle-inventory-web'),
    REFRESH_TOKEN_SECRET: z
      .string()
      .min(32, 'REFRESH_TOKEN_SECRET must contain at least 32 characters')
      .optional(),
    REFRESH_TOKEN_EXPIRES_IN: durationSchema.default('7d'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
    ADMIN_EMAIL: z.string().min(1).optional(),
    ADMIN_PASSWORD: z.string().min(1).optional(),
  })
  .superRefine((env, context) => {
    if (Boolean(env.ADMIN_EMAIL) !== Boolean(env.ADMIN_PASSWORD)) {
      context.addIssue({
        code: 'custom',
        message: 'ADMIN_EMAIL and ADMIN_PASSWORD must be provided together',
        path: ['ADMIN_EMAIL'],
      });
    }

    if (env.DATABASE_LOCK_TIMEOUT_MS >= env.DATABASE_STATEMENT_TIMEOUT_MS) {
      context.addIssue({
        code: 'custom',
        message: 'DATABASE_LOCK_TIMEOUT_MS must be lower than DATABASE_STATEMENT_TIMEOUT_MS',
        path: ['DATABASE_LOCK_TIMEOUT_MS'],
      });
    }
  });

export const loadEnv = (source: NodeJS.ProcessEnv = process.env) => envSchema.parse(source);

export type AppEnv = ReturnType<typeof loadEnv>;
