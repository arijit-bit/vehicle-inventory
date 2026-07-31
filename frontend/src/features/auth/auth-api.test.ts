import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthApiError, createAuthApi } from './auth-api';

describe('auth API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts normalized registration credentials to the backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        user: {
          id: '9d2e9700-ddff-4957-965c-30bf44484461',
          email: 'driver@example.com',
          role: 'CUSTOMER',
        },
        token: 'signed.jwt.token',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const api = createAuthApi('http://localhost:3000/api');
    await api.register({
      email: 'DRIVER@EXAMPLE.COM',
      password: 'SafePass123!',
      role: 'CUSTOMER',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'driver@example.com',
          password: 'SafePass123!',
          role: 'CUSTOMER',
        }),
      }),
    );
  });

  it('surfaces the safe API error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        }),
      }),
    );

    const api = createAuthApi('http://localhost:3000/api');

    await expect(
      api.login({
        email: 'driver@example.com',
        password: 'WrongPass123!',
      }),
    ).rejects.toEqual(new AuthApiError('Invalid email or password', 'INVALID_CREDENTIALS', 400));
  });

  it('sends the refresh request with credentials included', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ token: 'renewed.jwt.token' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const api = createAuthApi('/api');
    await api.refresh();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', {
      credentials: 'include',
      method: 'POST',
    });
  });
});
