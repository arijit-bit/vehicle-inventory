import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { authApi, type AuthCredentials, type AuthUser } from './auth-api';
import { AuthContext, type AuthContextValue } from './auth-context-value';

// Refresh the access token 1 minute before it expires (access token is 15m → refresh at 14m).
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
const REFRESH_BEFORE_EXPIRY_MS = 1 * 60 * 1000;
const AUTO_REFRESH_INTERVAL_MS = ACCESS_TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS; // 14 min

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Access token lives in memory only — never persisted to storage.
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  // isLoading is true while we're doing the initial silent refresh attempt on mount.
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current !== null) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const startRefreshTimer = useCallback((currentToken: string) => {
    clearRefreshTimer();
    refreshTimerRef.current = setInterval(async () => {
      try {
        const { token: newToken } = await authApi.refresh();
        setToken(newToken);
      } catch {
        // Refresh failed (e.g. token expired on server) — log the user out silently.
        setToken(null);
        setUser(null);
        clearRefreshTimer();
      }
    }, AUTO_REFRESH_INTERVAL_MS);
  }, []);

  // On mount: attempt a silent refresh. If the browser has a valid refresh token
  // cookie, this restores the session without the user needing to log in again.
  useEffect(() => {
    let active = true;

    authApi
      .refresh()
      .then(async ({ token: newToken }) => {
        if (!active) return;
        setToken(newToken);
        const { user: currentUser } = await authApi.me(newToken);
        if (active) {
          setUser(currentUser);
          startRefreshTimer(newToken);
        }
      })
      .catch(() => {
        // No valid refresh token — user is not logged in. That's fine.
        if (active) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timer when the component unmounts.
  useEffect(() => clearRefreshTimer, []);

  const authenticate = async (
    operation: (credentials: AuthCredentials) => ReturnType<typeof authApi.login>,
    credentials: AuthCredentials,
  ) => {
    const result = await operation(credentials);
    setToken(result.token);
    setUser(result.user);
    setIsLoading(false);
    startRefreshTimer(result.token);
  };

  const login = (credentials: AuthCredentials) => authenticate(authApi.login, credentials);
  const register = (credentials: AuthCredentials) => authenticate(authApi.register, credentials);

  const logout = useCallback(async () => {
    clearRefreshTimer();
    setToken(null);
    setUser(null);
    setIsLoading(false);
    // Revoke the refresh token server-side (best-effort).
    await authApi.logout();
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
