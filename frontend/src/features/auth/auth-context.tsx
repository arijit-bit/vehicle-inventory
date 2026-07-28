import { useEffect, useState, type ReactNode } from 'react';
import { authApi, type AuthCredentials, type AuthUser } from './auth-api';
import { AuthContext, type AuthContextValue } from './auth-context-value';

const tokenStorageKey = 'motorvault.session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [storedToken] = useState(() =>
    sessionStorage.getItem(tokenStorageKey),
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(storedToken));

  useEffect(() => {
    if (!storedToken) {
      return;
    }

    authApi
      .me(storedToken)
      .then(({ user: currentUser }) => {
        setUser(currentUser);
      })
      .catch(() => {
        sessionStorage.removeItem(tokenStorageKey);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [storedToken]);

  const authenticate = async (
    operation: (
      credentials: AuthCredentials,
    ) => ReturnType<typeof authApi.login>,
    credentials: AuthCredentials,
  ) => {
    const result = await operation(credentials);
    sessionStorage.setItem(tokenStorageKey, result.token);
    setUser(result.user);
  };

  const login = (credentials: AuthCredentials) =>
    authenticate(authApi.login, credentials);
  const register = (credentials: AuthCredentials) =>
    authenticate(authApi.register, credentials);
  const logout = () => {
    sessionStorage.removeItem(tokenStorageKey);
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
