import { useEffect, useState, type ReactNode } from 'react';
import { authApi, type AuthCredentials, type AuthUser } from './auth-api';
import { AuthContext, type AuthContextValue } from './auth-context-value';

const tokenStorageKey = 'motorvault.session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenStorageKey));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      return;
    }

    authApi
      .me(token)
      .then(({ user: currentUser }) => {
        setUser(currentUser);
      })
      .catch(() => {
        sessionStorage.removeItem(tokenStorageKey);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const authenticate = async (
    operation: (credentials: AuthCredentials) => ReturnType<typeof authApi.login>,
    credentials: AuthCredentials,
  ) => {
    const result = await operation(credentials);
    sessionStorage.setItem(tokenStorageKey, result.token);
    setToken(result.token);
    setUser(result.user);
    setIsLoading(false);
  };

  const login = (credentials: AuthCredentials) => authenticate(authApi.login, credentials);
  const register = (credentials: AuthCredentials) => authenticate(authApi.register, credentials);
  const logout = () => {
    sessionStorage.removeItem(tokenStorageKey);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

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
