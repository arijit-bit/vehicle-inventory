import { Boxes, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../features/auth/auth-context-value';

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Boxes aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-bold text-white">MotorVault</p>
              <p className="text-xs text-slate-500">Vehicle inventory</p>
            </div>
          </div>
          <Button onClick={logout} variant="outline">
            <LogOut aria-hidden="true" className="size-4" />
            Sign out
          </Button>
        </header>

        <section className="py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
              <ShieldCheck aria-hidden="true" className="size-4" />
              Authenticated as {user?.role.toLowerCase()}
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Welcome to your inventory.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-400">
              Signed in as {user?.email}. Vehicle search, purchasing, and management arrive in the
              next milestone.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
