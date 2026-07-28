# Test Report

Recorded on 2026-07-28 using Node.js `v24.8.0` and npm `11.6.0` on Windows.

## Result

| Area        | Test files | Tests | Result |
| ----------- | ---------: | ----: | ------ |
| Express API |          9 |    34 | Passed |
| React SPA   |          3 |     9 | Passed |
| Total       |         12 |    43 | Passed |

## Coverage

| Area        | Statements | Branches | Functions |  Lines |
| ----------- | ---------: | -------: | --------: | -----: |
| Express API |     88.05% |   85.10% |    82.92% | 87.69% |
| React SPA   |     80.88% |   77.27% |    75.00% | 80.95% |

Core authentication schemas, services, bcrypt adapter, JWT service, authorization middleware,
administrator seeder, and environment validation have 100% statement coverage. Lower aggregate
coverage primarily reflects the real Prisma repository and server bootstrap, which require a live
database integration environment, plus dashboard branches planned for later milestones.

## Quality gate

The following commands passed:

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Both the backend TypeScript build and the Vite production build completed successfully.

## Supabase verification

- `public.users`: RLS enabled; no DML privileges for `anon` or `authenticated`
- `public.vehicles`: RLS enabled; no DML privileges for `anon` or `authenticated`
- The advisor reports informational no-policy notices. This is intentional because the Express API
  is the only data boundary and browser roles have no table access.
- Unused vehicle-index notices are expected before inventory traffic exists; the indexes support
  the upcoming search milestone.

The advisor also reports a broad listing policy on an existing `projects` Storage bucket. That
bucket is unrelated to this repository and was not changed.
