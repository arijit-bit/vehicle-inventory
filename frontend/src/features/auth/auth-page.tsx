import { Apple, CarFront } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import heroVehicle from '../../assets/svg/Final-CarHero Page.svg';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import type { AuthCredentials } from './auth-api';
import { useAuth } from './auth-context-value';
import { AuthForm } from './auth-form';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export const AuthPage = ({ mode }: AuthPageProps) => {
  const { user, isLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const isRegistration = mode === 'register';

  if (!isLoading && user) {
    return <Navigate replace to="/dashboard" />;
  }

  const handleSubmit = async (credentials: AuthCredentials) => {
    await (isRegistration ? register(credentials) : login(credentials));
    navigate('/dashboard', { replace: true });
  };

  const announceSocialSetup = (provider: 'Google' | 'Apple') => {
    setSocialNotice(`${provider} sign-in will be available after provider credentials are added.`);
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-primary">
      <div aria-hidden="true" className="luxury-grid absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[-10%] mx-auto h-[48vh] max-w-6xl opacity-[0.08]"
      >
        <img
          alt=""
          className="size-full object-contain object-bottom grayscale"
          src={heroVehicle}
        />
      </div>

      <div className="relative w-full max-w-md">
        <Link className="mx-auto mb-8 flex w-fit items-center gap-3 text-primary" to="/dashboard">
          <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card">
            <CarFront aria-hidden="true" className="size-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.24em]">MotoVault</span>
        </Link>

        <Card className="border-border/90 bg-card/85 shadow-[0_40px_120px_-48px_rgba(0,0,0,1)] backdrop-blur-2xl">
          <CardHeader className="space-y-3 px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">
              {isRegistration ? 'Private client registration' : 'Client access'}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-primary">
              {isRegistration ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm leading-6 text-secondary">
              {isRegistration
                ? 'Choose customer or employee access and enter the collection.'
                : 'Sign in to purchase vehicles or manage dealership inventory.'}
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-7 sm:px-8 sm:pb-8">
            <div className="grid grid-cols-2 gap-3">
              <Button
                aria-label="Continue with Google"
                onClick={() => announceSocialSetup('Google')}
                type="button"
                variant="outline"
              >
                <span aria-hidden="true" className="text-sm font-bold">
                  G
                </span>
                Google
              </Button>
              <Button
                aria-label="Continue with Apple"
                onClick={() => announceSocialSetup('Apple')}
                type="button"
                variant="outline"
              >
                <Apple aria-hidden="true" className="size-4" />
                Apple
              </Button>
            </div>

            {socialNotice && (
              <p className="mt-3 text-center text-xs leading-5 text-secondary" role="status">
                {socialNotice}
              </p>
            )}

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">
                or continue with email
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <AuthForm mode={mode} onSubmit={handleSubmit} />

            <div className="mt-7 border-t border-border pt-6 text-center text-sm text-secondary">
              {isRegistration ? 'Already a member?' : 'New to MotoVault?'}{' '}
              <Link
                className="font-semibold text-primary hover:underline"
                to={isRegistration ? '/login' : '/register'}
              >
                {isRegistration ? 'Sign in' : 'Create account'}
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.16em] text-secondary/65">
          Secure access · Curated inventory · Private service
        </p>
      </div>
    </main>
  );
};
