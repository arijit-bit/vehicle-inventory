# Test Report

Recorded on 2026-07-30 using Node.js `v24.8.0` and npm `11.6.0` on Windows.

## Result

| Area        | Test files | Tests | Result |
| ----------- | ---------: | ----: | ------ |
| Express API |         17 |   112 | Passed |
| React SPA   |          6 |    31 | Passed |
| Total       |         23 |   143 | Passed |

## Coverage

| Area        | Statements | Branches | Functions |  Lines |
| ----------- | ---------: | -------: | --------: | -----: |
| Express API |     82.80% |   71.64% |    83.48% | 82.57% |
| React SPA   |     88.41% |   84.42% |    85.16% | 88.69% |

Vehicle routes and schemas have 100% statement, branch, function, and line coverage. The vehicle
service, Prisma adapter, exact two-decimal serialization, persisted catalog metadata, enum and color
validation, combined search query, partial updates, conditional purchase, atomic restock,
transaction-local timeouts, pool-acquisition timeouts, default quantities, insufficient stock, and
missing-record paths have direct regression coverage. The React suite covers the luxury root-route
hero, shared navigation across public routes, guest inventory browsing, authenticated purchases,
combined search, brand filtering, price sorting, database-selected non-hero vehicle artwork,
expanded engine/fuel details, social-provider removal, the accessible Shadcn account-type selector,
Employee inventory controls, and Administrator create, edit, restock, and delete workflows.
Backend tests cover Customer, Employee, and Administrator route boundaries plus Admin-only user
CRUD and role assignment. Integration tests use real bcrypt and JWT services to cross
registration, profile restoration, protected inventory, role authorization, and
administrator-only deletion boundaries.

## Quality gate

The following commands passed after the catalog persistence migration:

```text
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Both the backend TypeScript build and the Vite production build completed successfully. The
repository-wide format check still reports existing formatting differences in files outside this
change; all RBAC files touched in this pass were formatted.

## Supabase verification

- `public.users`: RLS enabled; no DML privileges for `anon` or `authenticated`
- `public.vehicles`: RLS enabled; no DML privileges for `anon` or `authenticated`
- The configured runtime database contains four seeded catalog vehicles with persisted artwork,
  year, color, engine, transmission, fuel, and descriptive metadata.
- `GET /api/vehicles` and the rendered localhost dashboard both return all four records and seven
  available units.
- The runtime project configured in `backend/.env` was migrated and verified through Prisma/direct
  PostgreSQL because the connected Supabase tool exposed a different project.
- No Storage bucket or Storage policy was added; repository-owned SVGs remain bundled and are chosen
  through the validated `imageKey`.
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
