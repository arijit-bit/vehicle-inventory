import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import {
  DuplicateEmailError,
  InvalidCredentialsError,
  type AuthResult,
  type TokenVerifier,
} from './auth.types.js';

const authResult: AuthResult = {
  user: {
    id: '9d2e9700-ddff-4957-965c-30bf44484461',
    email: 'driver@example.com',
    role: 'USER',
  },
  token: 'signed.jwt.token',
};

describe('authentication HTTP API', () => {
  const authService = {
    register: vi.fn(),
    login: vi.fn(),
  };
  const tokenVerifier: TokenVerifier = {
    verify: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService.register.mockResolvedValue(authResult);
    authService.login.mockResolvedValue(authResult);
    vi.mocked(tokenVerifier.verify).mockReturnValue({
      sub: authResult.user.id,
      email: authResult.user.email,
      role: authResult.user.role,
    });
  });

  it('registers a user with a normalized email', async () => {
    const response = await request(createApp({ authService, tokenVerifier }))
      .post('/api/auth/register')
      .send({
        email: ' Driver@Example.COM ',
        password: 'SafePass123!',
      });

    expect(response.status).toBe(201);
    expect(authService.register).toHaveBeenCalledWith({
      email: 'driver@example.com',
      password: 'SafePass123!',
    });
    expect(response.body).toEqual(authResult);
  });

  it.each(['driver.example.com', 'driver@example', 'driver@.com'])(
    'returns 400 for malformed email %s',
    async (email) => {
      const response = await request(createApp({ authService, tokenVerifier }))
        .post('/api/auth/register')
        .send({
          email,
          password: 'SafePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(authService.register).not.toHaveBeenCalled();
    },
  );

  it('returns 409 for a duplicate registration', async () => {
    authService.register.mockRejectedValue(new DuplicateEmailError());

    const response = await request(createApp({ authService, tokenVerifier }))
      .post('/api/auth/register')
      .send({
        email: 'driver@example.com',
        password: 'SafePass123!',
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('returns a generic 401 response for invalid login credentials', async () => {
    authService.login.mockRejectedValue(new InvalidCredentialsError());

    const response = await request(createApp({ authService, tokenVerifier }))
      .post('/api/auth/login')
      .send({
        email: 'driver@example.com',
        password: 'WrongPass123!',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  });

  it('returns the verified current user from a protected endpoint', async () => {
    const response = await request(createApp({ authService, tokenVerifier }))
      .get('/api/auth/me')
      .set('Authorization', 'Bearer signed.jwt.token');

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      id: authResult.user.id,
      email: 'driver@example.com',
      role: 'USER',
    });
  });
});
