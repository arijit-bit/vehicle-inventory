export const App = () => (
  <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
    <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl sm:p-12">
      <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
        Milestone 1
      </span>
      <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        Vehicle inventory, built safely.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
        The TypeScript workspace, PostgreSQL schema, Supabase connection strategy, automated tests,
        and continuous integration pipeline are ready.
      </p>
      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ['Database', 'Supabase PostgreSQL'],
          ['API', 'Express + Prisma'],
          ['Web', 'React + Tailwind'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <dt className="text-sm text-slate-400">{label}</dt>
            <dd className="mt-1 font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  </main>
);
