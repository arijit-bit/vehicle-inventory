import { afterEach, describe, expect, it, vi } from 'vitest';
import { JwtTokenService } from './jwt-token.service.js';

const user = {
  id: '9d2e9700-ddff-4957-965c-30bf44484461',
  email: 'driver@example.com',
  role: 'CUSTOMER' as const,
};

describe('JwtTokenService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('signs and verifies the expected identity claims', () => {
    const tokens = new JwtTokenService({
      secret: 'a-secure-test-secret-that-is-at-least-32-characters',
      expiresIn: '15m',
      issuer: 'vehicle-inventory-api',
      audience: 'vehicle-inventory-web',
    });

    const claims = tokens.verify(tokens.sign(user));

    expect(claims).toEqual({
      sub: user.id,
      email: 'driver@example.com',
      role: 'CUSTOMER',
    });
  });

  it('rejects tokens signed with another secret', () => {
    const trustedTokens = new JwtTokenService({
      secret: 'trusted-secret-that-is-at-least-32-characters-long',
      expiresIn: '15m',
      issuer: 'vehicle-inventory-api',
      audience: 'vehicle-inventory-web',
    });
    const untrustedTokens = new JwtTokenService({
      secret: 'different-secret-that-is-at-least-32-characters',
      expiresIn: '15m',
      issuer: 'vehicle-inventory-api',
      audience: 'vehicle-inventory-web',
    });

    expect(() => trustedTokens.verify(untrustedTokens.sign(user))).toThrow();
  });

  it('rejects expired tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'));

    const tokens = new JwtTokenService({
      secret: 'a-secure-test-secret-that-is-at-least-32-characters',
      expiresIn: '1s',
      issuer: 'vehicle-inventory-api',
      audience: 'vehicle-inventory-web',
    });
    const token = tokens.sign(user);

    vi.setSystemTime(new Date('2026-07-28T12:00:02.000Z'));

    expect(() => tokens.verify(token)).toThrow();
  });
});
