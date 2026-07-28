# Test Report

Recorded on 2026-07-29 using Node.js `v24.8.0` and npm `11.6.0` on Windows.

## Result

| Area        | Test files | Tests | Result |
| ----------- | ---------: | ----: | ------ |
| Express API |         13 |    65 | Passed |
| React SPA   |          3 |     9 | Passed |
| Total       |         16 |    74 | Passed |

## Coverage

| Area        | Statements | Branches | Functions |  Lines |
| ----------- | ---------: | -------: | --------: | -----: |
| Express API |     89.86% |   84.37% |    88.23% | 89.62% |
| React SPA   |     80.88% |   77.27% |    75.00% | 80.95% |

Vehicle routes and schemas have 100% statement, branch, function, and line coverage. The vehicle
service, Prisma adapter, decimal serialization, combined search query, partial updates, and
missing-record paths have direct regression coverage. Lower aggregate coverage primarily reflects
the authentication Prisma repository and server bootstrap, which require a live database
integration environment, plus dashboard branches planned for later milestones.

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
- The live combined-search query plan uses `vehicles_price_idx` for inclusive price bounds.
- Unused make/model/category index notices are expected before inventory traffic exists. Contains
  searches currently filter after the selective price scan; index changes should be driven by
  production query statistics rather than premature removal or additional indexing.

The advisor also reports a broad listing policy on an existing `projects` Storage bucket. That
bucket is unrelated to this repository and was not changed.
