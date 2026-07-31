import { API_BASE_URL } from '../../config/api-base-url';

export type UserRole = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
export type RegistrableRole = Extract<UserRole, 'CUSTOMER' | 'EMPLOYEE'>;

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthCredentials {
  email: string;
  password: string;
  role?: RegistrableRole;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const normalizeCredentials = (credentials: AuthCredentials): AuthCredentials => ({
  ...credentials,
  email: credentials.email.trim().toLowerCase(),
});

export const createAuthApi = (baseUrl: string) => {
  const request = async <T>(path: string, init: RequestInit): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
      // credentials: 'include' ensures the httpOnly refresh_token cookie is
      // sent automatically on every request to the same origin.
      credentials: 'include',
      ...init,
    });
    const body = (await response.json()) as T & ApiErrorBody;

    if (!response.ok) {
      throw new AuthApiError(
        body.error?.message ?? 'Unable to complete your request',
        body.error?.code ?? 'REQUEST_FAILED',
        response.status ?? 400,
      );
    }

    return body;
  };

  const authenticate = (path: '/auth/register' | '/auth/login', credentials: AuthCredentials) =>
    request<AuthResponse>(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalizeCredentials(credentials)),
    });

  return {
    register: (credentials: AuthCredentials) => authenticate('/auth/register', credentials),
    login: (credentials: AuthCredentials) => authenticate('/auth/login', credentials),
    me: (token: string) =>
      request<{ user: AuthUser }>('/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    /** Silently refresh the access token using the httpOnly cookie. */
    refresh: () =>
      request<{ token: string }>('/auth/refresh', {
        method: 'POST',
      }),
    /** Revoke the refresh token server-side and clear the cookie. */
    logout: () =>
      fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // best-effort — don't block client-side logout if server is unreachable
      }),
  };
};

export const authApi = createAuthApi(API_BASE_URL);
