# Test Report

Recorded on 2026-07-29 using Node.js `v24.8.0` and npm `11.6.0` on Windows.

## Result

| Area        | Test files | Tests | Result |
| ----------- | ---------: | ----: | ------ |
| Express API |         15 |    93 | Passed |
| React SPA   |          6 |    24 | Passed |
| Total       |         21 |   117 | Passed |

## Coverage

| Area        | Statements | Branches | Functions |  Lines |
| ----------- | ---------: | -------: | --------: | -----: |
| Express API |     91.95% |   87.96% |    90.36% | 91.81% |
| React SPA   |     85.78% |   80.70% |    84.73% | 85.55% |

Vehicle routes and schemas have 100% statement, branch, function, and line coverage. The vehicle
service, Prisma adapter, decimal serialization, combined search query, partial updates, conditional
purchase, atomic restock, transaction-local timeouts, pool-acquisition timeouts, default
quantities, insufficient stock, and missing-record paths have direct regression coverage. The React
suite covers authenticated inventory requests, combined search, availability filtering, sold-out
purchase disabling, committed stock updates, retryable contention feedback, expired-session
logout, logout/profile-response race handling, accessible validation errors, and administrator
workspace visibility, responsive management, modal dismissal, create, edit, restock, and delete
workflows. Backend integration tests use real bcrypt and JWT services to cross registration,
profile restoration, protected inventory, role authorization, and administrator-only deletion
boundaries. Lower aggregate coverage primarily reflects the authentication Prisma repository and
server bootstrap, which require a live database integration environment.

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
- A self-cleaning live race sent 12 simultaneous one-unit purchases against stock 5. Exactly 5
  committed and 7 returned insufficient stock; the quantity never became negative.
- A simultaneous two-unit purchase and three-unit restock serialized to the expected final
  quantity 5.
- The live race exposed and then verified handling for Prisma transaction-pool acquisition timeout
  `P2028`; it now maps to retryable `503 INVENTORY_BUSY`.
- The verification left zero temporary rows.
- Unused make/model/category index notices are expected before inventory traffic exists. Contains
  searches currently filter after the selective price scan; index changes should be driven by
  production query statistics rather than premature removal or additional indexing.

The advisor also reports a broad listing policy on an existing `projects` Storage bucket. That
bucket is unrelated to this repository and was not changed.
