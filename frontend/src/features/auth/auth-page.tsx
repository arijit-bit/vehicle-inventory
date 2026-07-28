import { BadgeCheck, Boxes, Gauge, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import type { AuthCredentials } from './auth-api';
import { useAuth } from './auth-context-value';
import { AuthForm } from './auth-form';

interface AuthPageProps {
  mode: 'login' | 'register';
}

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Protected by design',
    description: 'Hashed credentials and short-lived signed access.',
  },
  {
    icon: Gauge,
    title: 'Inventory in real time',
    description: 'Know what is available before the next purchase.',
  },
  {
    icon: BadgeCheck,
    title: 'Role-aware control',
    description: 'Administrative actions stay with administrators.',
  },
];

export const AuthPage = ({ mode }: AuthPageProps) => {
  const { user, isLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const isRegistration = mode === 'register';

  if (!isLoading && user) {
    return <Navigate replace to="/dashboard" />;
  }

  const handleSubmit = async (credentials: AuthCredentials) => {
    await (isRegistration ? register(credentials) : login(credentials));
    navigate('/dashboard', { replace: true });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="auth-grid absolute inset-0 opacity-50" />
      <div className="absolute -left-40 top-1/4 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -right-36 bottom-0 size-96 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden border-r border-white/5 px-12 py-10 lg:flex lg:flex-col xl:px-20 xl:py-14">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-[0_12px_32px_-10px_rgba(34,211,238,0.9)]">
              <Boxes aria-hidden="true" className="size-6" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">MotorVault</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Vehicle inventory
              </p>
            </div>
          </div>

          <div className="my-auto max-w-xl py-16">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
              Secure inventory operations
            </div>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.08] tracking-[-0.045em] text-white xl:text-6xl">
              Every vehicle.
              <span className="block text-slate-500">One trusted view.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
              Purchase with confidence, manage stock precisely, and keep administrative actions
              protected behind verified access.
            </p>

            <div className="mt-12 grid gap-5">
              {trustPoints.map(({ icon: Icon, title, description }) => (
                <div className="flex items-start gap-4" key={title}>
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-300">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-100">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-600">Purpose-built for accountable vehicle operations.</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
                <Boxes aria-hidden="true" className="size-5" />
              </span>
              <span className="font-bold text-white">MotorVault</span>
            </div>

            <Card>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  {isRegistration ? 'Start securely' : 'Secure access'}
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white">
                  {isRegistration ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="text-sm leading-6 text-slate-400">
                  {isRegistration
                    ? 'Create a customer account to explore and purchase available vehicles.'
                    : 'Sign in to continue to your vehicle inventory workspace.'}
                </p>
              </CardHeader>
              <CardContent>
                <AuthForm mode={mode} onSubmit={handleSubmit} />
                <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
                  {isRegistration ? 'Already have an account?' : 'New to MotorVault?'}{' '}
                  <Link
                    className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                    to={isRegistration ? '/login' : '/register'}
                  >
                    {isRegistration ? 'Sign in' : 'Create account'}
                  </Link>
                </div>
              </CardContent>
            </Card>

            <p className="mt-5 text-center text-xs text-slate-600">
              Passwords are never stored in readable form.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
