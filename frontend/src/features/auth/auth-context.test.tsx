import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from './auth-api';
import { AuthProvider } from './auth-context';
import { useAuth } from './auth-context-value';

vi.mock('./auth-api', async (importOriginal) => {
  const original = await importOriginal<typeof import('./auth-api')>();

  return {
    ...original,
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      me: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
    },
  };
});

const SessionProbe = () => {
  const { user, isLoading, logout } = useAuth();

  return (
    <div>
      <p>{isLoading ? 'Restoring' : (user?.email ?? 'Anonymous')}</p>
      <button onClick={logout} type="button">
        Sign out
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores a stored session through the authenticated profile endpoint', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({ token: 'refreshed-token' });
    vi.mocked(authApi.me).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'driver@example.com',
        role: 'CUSTOMER',
      },
    });

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    expect(screen.getByText('Restoring')).toBeInTheDocument();
    expect(await screen.findByText('driver@example.com')).toBeInTheDocument();
    expect(authApi.refresh).toHaveBeenCalledOnce();
    expect(authApi.me).toHaveBeenCalledWith('refreshed-token');
  });

  it('does not allow a late profile response to restore a session after logout', async () => {
    const user = userEvent.setup();
    let resolveProfile!: (value: Awaited<ReturnType<typeof authApi.me>>) => void;
    vi.mocked(authApi.refresh).mockResolvedValue({ token: 'refreshed-token' });
    vi.mocked(authApi.me).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve;
        }),
    );
    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    resolveProfile({
      user: {
        id: 'user-1',
        email: 'driver@example.com',
        role: 'CUSTOMER',
      },
    });

    await waitFor(() => expect(screen.getByText('Anonymous')).toBeInTheDocument());
    expect(screen.queryByText('driver@example.com')).not.toBeInTheDocument();
  });
});

