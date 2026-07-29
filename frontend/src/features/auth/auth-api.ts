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
    const response = await fetch(`${baseUrl}${path}`, init);
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
  };
};

export const authApi = createAuthApi(
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000/api',
);
