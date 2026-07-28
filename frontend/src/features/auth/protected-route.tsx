import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context-value';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-cyan-300">
        <LoaderCircle aria-label="Restoring your session" className="size-7 animate-spin" />
      </main>
    );
  }

  return user ? children : <Navigate replace to="/login" />;
};
