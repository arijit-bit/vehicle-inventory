import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroVehicle from '../assets/svg/Final-CarHero Page.svg';
import { AppNavigation } from '../components/app-navigation';
import { Button } from '../components/ui/button';
import { useAuth } from '../features/auth/auth-context-value';

export const HomePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#08090a] text-primary">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.09),transparent_30rem),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_35%)]"
      />
      <AppNavigation active="home" onLogout={logout} user={user} />

      <main className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-[1440px] flex-col px-5 pb-8 sm:px-8 lg:px-12">
        <section className="relative grid flex-1 items-center gap-8 py-12 lg:grid-cols-[0.78fr_1.22fr] lg:py-0">
          <div className="relative z-20 max-w-xl self-center lg:pb-16">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">
              Automotive excellence · Est. 2026
            </p>
            <h1
              aria-label="Engineered Perfection"
              className="hero-metal-text text-[clamp(3.4rem,7vw,7.5rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]"
            >
              <span className="block">Engineered</span>
              <span className="block">Perfection</span>
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-secondary sm:text-base">
              A private collection of exceptional machines, selected for their provenance,
              performance, and unmistakable presence.
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-none border-white/35 px-6 text-[10px] uppercase tracking-[0.18em]"
              variant="outline"
            >
              <Link to="/dashboard">
                Explore the collection
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="relative z-10 min-h-64 lg:min-h-[38rem]">
            <p
              aria-hidden="true"
              className="hero-ghost-word absolute left-1/2 top-[10%] -translate-x-1/2 whitespace-nowrap text-[clamp(4.5rem,11vw,11rem)] font-black uppercase leading-none tracking-[-0.075em]"
            >
              MotoVault
            </p>
            <div
              aria-hidden="true"
              className="absolute inset-x-[10%] bottom-[17%] h-24 rounded-[50%] bg-white/[0.09] blur-3xl"
            />
            <img
              alt="Silver exotic performance car"
              className="absolute bottom-[4%] left-1/2 w-[118%] max-w-none -translate-x-1/2 object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,0.95)] sm:w-[108%] lg:bottom-[15%] lg:left-[43%] lg:w-[126%]"
              src={heroVehicle}
            />
          </div>
        </section>

        <div className="relative z-20 grid shrink-0 gap-6 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
              Performance without compromise.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <p className="max-w-sm text-xs leading-6 text-secondary">
              Discover rare specifications and modern icons through a collection shaped by
              engineering integrity.
            </p>
            <div className="flex items-start gap-8 text-[10px] uppercase tracking-[0.16em] text-secondary">
              <span>
                <strong className="mb-1 block text-base font-semibold text-primary">01</strong>
                Curated
              </span>
              <span>
                <strong className="mb-1 block text-base font-semibold text-primary">24/7</strong>
                Concierge
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
