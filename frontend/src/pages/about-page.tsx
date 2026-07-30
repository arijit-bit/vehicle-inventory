import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,
  CircleGauge,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroVehicle from '../assets/svg/Final-CarHero Page.svg';
import { AppNavigation } from '../components/app-navigation';
import { Button } from '../components/ui/button';
import { useAuth } from '../features/auth/auth-context-value';

const standards = [
  {
    icon: BadgeCheck,
    number: '01',
    title: 'Curated with intent',
    copy: 'Every model earns its place through engineering significance, design integrity, and lasting desirability.',
  },
  {
    icon: BookOpenCheck,
    number: '02',
    title: 'Details without ambiguity',
    copy: 'Specifications, pricing, availability, and reservation status stay clear from first look to final decision.',
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'Inventory you can trust',
    copy: 'Live stock and protected order history keep every reservation accountable and every release accurate.',
  },
] as const;

const journey = [
  {
    step: '01',
    title: 'Discover',
    copy: 'Explore a focused collection by marque, specification, availability, and price.',
  },
  {
    step: '02',
    title: 'Reserve',
    copy: 'Secure an available vehicle through a stock-aware reservation in a single action.',
  },
  {
    step: '03',
    title: 'Keep track',
    copy: 'Return to Orders for an enduring record of active and cancelled reservations.',
  },
] as const;

export const AboutPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen overflow-hidden bg-[#08090a] text-primary">
      <AppNavigation active="about" onLogout={logout} user={user} />

      <main>
        <section className="relative mx-auto min-h-[calc(100svh-5rem)] max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div
            aria-hidden="true"
            className="luxury-grid pointer-events-none absolute inset-x-5 inset-y-0 opacity-70 sm:inset-x-8 lg:inset-x-12"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-16rem] top-[-12rem] size-[46rem] rounded-full bg-white/[0.045] blur-[100px]"
          />

          <div className="relative grid min-h-[calc(100svh-5rem)] items-center gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:py-10">
            <div className="relative z-20 max-w-2xl">
              <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-secondary">
                <span className="h-px w-8 bg-white/35" />
                The MotoVault point of view
              </p>
              <h1
                aria-label="Built for exceptional machines"
                className="mt-7 text-[clamp(3.75rem,7vw,7.8rem)] font-semibold leading-[0.86] tracking-[-0.075em]"
              >
                Built for
                <span className="hero-metal-text block pb-2">exceptional machines.</span>
              </h1>
              <p className="mt-8 max-w-xl text-sm leading-7 text-secondary sm:text-base">
                MotoVault is a digital home for cars that move the culture forward. We bring
                considered curation, exact specifications, and dependable reservation history into
                one quiet, confident experience.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-12 rounded-none px-6 text-[10px] uppercase tracking-[0.18em]"
                >
                  <Link to="/dashboard">
                    Explore the collection
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
                {!user && (
                  <Button
                    asChild
                    className="h-12 rounded-none border-white/25 px-6 text-[10px] uppercase tracking-[0.18em]"
                    variant="outline"
                  >
                    <Link to="/register">Request access</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="relative z-10 min-h-[24rem] sm:min-h-[31rem] lg:min-h-[42rem]">
              <p
                aria-hidden="true"
                className="absolute right-0 top-[8%] text-[clamp(5rem,12vw,12rem)] font-black leading-none tracking-[-0.08em] text-white/[0.025]"
              >
                ABOUT
              </p>
              <div
                aria-hidden="true"
                className="absolute inset-x-[8%] bottom-[16%] h-28 rounded-[50%] bg-white/[0.1] blur-3xl"
              />
              <img
                alt="Silver performance car representing the MotoVault collection"
                className="absolute bottom-[7%] left-1/2 w-[124%] max-w-none -translate-x-1/2 object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,0.95)] lg:bottom-[13%] lg:left-[48%] lg:w-[132%]"
                decoding="async"
                src={heroVehicle}
              />
              <div className="absolute bottom-0 right-0 hidden border-l border-white/15 pl-5 text-right sm:block">
                <p className="text-2xl font-semibold tracking-[-0.04em]">
                  Form. Function. Feeling.
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-secondary">
                  No compromise between them
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.018]">
          <div className="mx-auto grid max-w-[1440px] divide-y divide-white/10 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-12">
            {[
              ['Live', 'inventory'],
              ['Role-aware', 'access'],
              ['Enduring', 'order history'],
            ].map(([value, label]) => (
              <div className="py-8 md:px-8 md:first:pl-0 md:last:pr-0" key={label}>
                <p className="text-3xl font-semibold tracking-[-0.045em]">{value}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-secondary">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary">
                What guides us
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                Our standard
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-secondary lg:pt-6">
              Great automotive experiences are built on restraint. Less noise, better information,
              and a collection where every detail has a reason to be present.
            </p>
          </div>

          <div className="mt-14 grid border-y border-white/10 lg:grid-cols-3 lg:divide-x lg:divide-white/10">
            {standards.map(({ icon: Icon, number, title, copy }) => (
              <article
                className="group border-b border-white/10 py-9 last:border-b-0 lg:border-b-0 lg:px-8 lg:first:pl-0 lg:last:pr-0"
                key={number}
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full border border-white/15 text-secondary transition-colors group-hover:border-white/35 group-hover:text-primary">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="text-[10px] tracking-[0.2em] text-secondary/60">{number}</span>
                </div>
                <h3 className="mt-12 text-xl font-medium tracking-[-0.03em]">{title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-secondary">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative border-y border-white/10 bg-[#0e0e10]">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
            <div className="relative min-h-[28rem] overflow-hidden border-b border-white/10 lg:min-h-[42rem] lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(255,255,255,0.10),transparent_22rem)]" />
              <p
                aria-hidden="true"
                className="absolute left-8 top-8 text-[clamp(4rem,9vw,8rem)] font-black leading-none tracking-[-0.07em] text-white/[0.035]"
              >
                2026
              </p>
              <img
                alt="MotoVault curated performance vehicle"
                className="absolute bottom-[7%] left-1/2 w-[115%] max-w-none -translate-x-1/2 object-contain drop-shadow-[0_28px_38px_rgba(0,0,0,0.9)]"
                loading="lazy"
                src={heroVehicle}
              />
            </div>
            <div className="flex items-center px-5 py-16 sm:px-12 lg:px-16 lg:py-24">
              <div className="max-w-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary">
                  Engineering over noise
                </p>
                <h2 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl">
                  A more considered way to collect.
                </h2>
                <p className="mt-8 text-sm leading-7 text-secondary sm:text-base">
                  We designed MotoVault around the way enthusiasts actually make decisions: study
                  the machine, understand the specification, confirm availability, and keep a
                  reliable record of what comes next.
                </p>
                <p className="mt-5 text-sm leading-7 text-secondary sm:text-base">
                  The result is less like a marketplace and more like a private, living archive—one
                  where the collection stays current without losing its history.
                </p>
                <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-7">
                  <CircleGauge aria-hidden="true" className="size-5 text-secondary" />
                  <p className="text-xs uppercase tracking-[0.16em] text-secondary">
                    Precision at every interaction
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary">
                The experience
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                From discovery to your garage.
              </h2>
            </div>
            <ArrowDownRight aria-hidden="true" className="hidden size-8 text-secondary sm:block" />
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius)] border border-white/10 bg-white/10 md:grid-cols-3">
            {journey.map(({ step, title, copy }) => (
              <article className="min-h-64 bg-[#0c0c0e] p-8 sm:p-10" key={step}>
                <p className="text-[10px] tracking-[0.2em] text-secondary">{step}</p>
                <h3 className="mt-16 text-2xl font-medium tracking-[-0.035em]">{title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-secondary">{copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-20 flex flex-col items-start justify-between gap-8 border-t border-white/15 pt-10 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">
              The right car deserves the right context.
            </p>
            <Button
              asChild
              className="h-12 shrink-0 rounded-none border-white/30 px-6 text-[10px] uppercase tracking-[0.18em]"
              variant="outline"
            >
              <Link to="/dashboard">
                View available vehicles
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.18em] text-secondary">
          <p>MotoVault · Automotive excellence</p>
          <p>Established 2026</p>
        </div>
      </footer>
    </div>
  );
};
