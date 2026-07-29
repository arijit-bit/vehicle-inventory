import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

const validEnvironment = {
  DATABASE_URL: 'postgresql://inventory:inventory@localhost:5432/inventory',
  JWT_SECRET: 'a-secure-development-secret-with-32-chars',
};

describe('loadEnv', () => {
  it('allows administrator seeding to remain disabled', () => {
    const env = loadEnv(validEnvironment);

    expect(env.ADMIN_EMAIL).toBeUndefined();
    expect(env.ADMIN_PASSWORD).toBeUndefined();
    expect(env.DATABASE_LOCK_TIMEOUT_MS).toBe(2_000);
    expect(env.DATABASE_STATEMENT_TIMEOUT_MS).toBe(10_000);
  });

  it.each([{ ADMIN_EMAIL: 'admin@example.com' }, { ADMIN_PASSWORD: 'AdminPass123!' }])(
    'rejects incomplete administrator credentials: %o',
    (partialAdmin) => {
      expect(() =>
        loadEnv({
          ...validEnvironment,
          ...partialAdmin,
        }),
      ).toThrow(/ADMIN_EMAIL and ADMIN_PASSWORD must be provided together/);
    },
  );

  it('requires the lock timeout to be shorter than the statement timeout', () => {
    expect(() =>
      loadEnv({
        ...validEnvironment,
        DATABASE_LOCK_TIMEOUT_MS: '10000',
        DATABASE_STATEMENT_TIMEOUT_MS: '5000',
      }),
    ).toThrow(/DATABASE_LOCK_TIMEOUT_MS must be lower/);
  });
});
