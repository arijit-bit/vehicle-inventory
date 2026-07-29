import { describe, expect, it } from 'vitest';
import { loginSchema, registrationSchema } from './auth.schemas.js';

describe('authentication schemas', () => {
  it('normalizes registration email addresses to lowercase', () => {
    const result = registrationSchema.parse({
      email: '  Driver@Example.COM  ',
      password: 'SafePass123!',
    });

    expect(result.email).toBe('driver@example.com');
    expect(result.role).toBe('CUSTOMER');
  });

  it('allows customer and employee self-registration but never administrator registration', () => {
    expect(
      registrationSchema.parse({
        email: 'sales@example.com',
        password: 'SafePass123!',
        role: 'EMPLOYEE',
      }).role,
    ).toBe('EMPLOYEE');

    expect(
      registrationSchema.safeParse({
        email: 'attacker@example.com',
        password: 'SafePass123!',
        role: 'ADMIN',
      }).success,
    ).toBe(false);
  });

  it.each(['driver.example.com', 'driver@example', 'driver@.com', '@example.com'])(
    'rejects malformed registration email %s',
    (email) => {
      const result = registrationSchema.safeParse({
        email,
        password: 'SafePass123!',
      });

      expect(result.success).toBe(false);
    },
  );

  it('rejects passwords shorter than 8 characters', () => {
    const result = registrationSchema.safeParse({
      email: 'driver@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('rejects passwords longer than the bcrypt 72-byte limit', () => {
    const result = registrationSchema.safeParse({
      email: 'driver@example.com',
      password: 'a'.repeat(73),
    });

    expect(result.success).toBe(false);
  });

  it('normalizes and validates login email addresses too', () => {
    expect(
      loginSchema.parse({
        email: 'OWNER@GARAGE.IO',
        password: 'SafePass123!',
      }).email,
    ).toBe('owner@garage.io');

    expect(
      loginSchema.safeParse({
        email: 'owner@garage',
        password: 'SafePass123!',
      }).success,
    ).toBe(false);
  });
});
