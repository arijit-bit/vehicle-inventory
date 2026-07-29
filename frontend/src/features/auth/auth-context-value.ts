import { createContext, useContext } from 'react';
import type { AuthCredentials, AuthUser } from './auth-api';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
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
