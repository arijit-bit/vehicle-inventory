import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { authenticate, authorize } from './auth.middleware.js';
import type { TokenVerifier } from './auth.types.js';

const userClaims = {
  sub: '9d2e9700-ddff-4957-965c-30bf44484461',
  email: 'driver@example.com',
  role: 'CUSTOMER' as const,
};

const createProtectedApp = (verifier: TokenVerifier) => {
  const app = express();

  app.get('/profile', authenticate(verifier), (req, res) => {
    res.status(200).json({ auth: req.auth });
  });
  app.delete('/admin-only', authenticate(verifier), authorize('ADMIN'), (_req, res) => {
    res.status(204).send();
  });

  return app;
};

describe('authentication middleware', () => {
  it('returns 401 when the bearer token is missing', async () => {
    const verifier: TokenVerifier = { verify: vi.fn() };

    const response = await request(createProtectedApp(verifier)).get('/profile');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid or expired token', async () => {
    const verifier: TokenVerifier = {
      verify: vi.fn().mockImplementation(() => {
        throw new Error('invalid token');
      }),
    };

    const response = await request(createProtectedApp(verifier))
      .get('/profile')
      .set('Authorization', 'Bearer invalid.jwt.token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('attaches verified claims to the request', async () => {
    const verifier: TokenVerifier = {
      verify: vi.fn().mockReturnValue(userClaims),
    };

    const response = await request(createProtectedApp(verifier))
      .get('/profile')
      .set('Authorization', 'Bearer valid.jwt.token');

    expect(response.status).toBe(200);
    expect(response.body.auth).toEqual(userClaims);
  });

  it('returns 403 when a normal user accesses an admin route', async () => {
    const verifier: TokenVerifier = {
      verify: vi.fn().mockReturnValue(userClaims),
    };

    const response = await request(createProtectedApp(verifier))
      .delete('/admin-only')
      .set('Authorization', 'Bearer valid.jwt.token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('allows administrators through role authorization', async () => {
    const verifier: TokenVerifier = {
      verify: vi.fn().mockReturnValue({
        ...userClaims,
        role: 'ADMIN',
      }),
    };

    const response = await request(createProtectedApp(verifier))
      .delete('/admin-only')
      .set('Authorization', 'Bearer valid.jwt.token');

    expect(response.status).toBe(204);
  });
});
