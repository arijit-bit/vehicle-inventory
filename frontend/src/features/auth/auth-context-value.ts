import { createContext, useContext } from 'react';
import type { AuthCredentials, AuthUser } from './auth-api';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  /** True when the session ended due to a failed background token refresh (not a manual logout). */
  sessionExpired: boolean;
  login(credentials: AuthCredentials): Promise<void>;
  register(credentials: AuthCredentials): Promise<void>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
