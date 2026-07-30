# Test Report

Recorded on 2026-07-30 using Node.js `v24.8.0` and npm `11.6.0` on Windows.

## Result

| Area        | Test files | Tests | Result |
| ----------- | ---------: | ----: | ------ |
| Express API |         19 |   125 | Passed |
| React SPA   |          8 |    42 | Passed |
| Total       |         27 |   167 | Passed |

## Coverage

| Area        | Statements | Branches | Functions |  Lines |
| ----------- | ---------: | -------: | --------: | -----: |
| Express API |     83.95% |   71.56% |    84.16% | 83.75% |
| React SPA   |     87.11% |   82.59% |    83.60% | 87.37% |

Vehicle routes and schemas have 100% statement, branch, function, and line coverage. The vehicle
service, Prisma adapter, exact two-decimal serialization, persisted catalog metadata, enum and color
validation, combined search query, partial updates, conditional purchase, atomic restock,
transaction-local timeouts, pool-acquisition timeouts, default quantities, insufficient stock, and
missing-record paths have direct regression coverage. Pagination tests cover fixed six-row limits,
aligned offsets, filtered counts, deterministic database ordering, and second-page API requests.
The React suite covers the luxury root-route
hero, shared navigation across public routes, guest inventory browsing, authenticated purchases,
combined search, brand filtering, price sorting, explicit database-key mapping to the centered
White-RR, Bugatti, black-car, Bentley, Porsche, Maybach, Audi, and Range Rover Supabase Storage
artwork, DB-backed media catalog loading, the bundled landing hero, expanded engine/fuel details,
social-provider removal, the accessible Shadcn account-type selector, Employee inventory controls,
Administrator create, edit, restock, and delete workflows, and accessible page navigation below the
six-card collection.
Backend tests cover Customer, Employee, and Administrator route boundaries plus Admin-only user
CRUD and role assignment. Integration tests use real bcrypt and JWT services to cross
registration, profile restoration, protected inventory, role authorization, and
administrator-only deletion boundaries.

## Quality gate

The following commands passed after the pagination implementation:

```text
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Both the backend TypeScript build and the Vite production build completed successfully. All files
touched by the pagination work were formatted.

## Supabase verification

- `public.users`: RLS enabled; no DML privileges for `anon` or `authenticated`
- `public.vehicles`: RLS enabled; no DML privileges for `anon` or `authenticated`
- `public.media_assets`: RLS enabled; no table privileges for `anon` or `authenticated`
- The configured runtime database contains 10 inventory records at verification time: five newly
  seeded vehicles and five pre-existing records. All include persisted artwork, year, color,
  engine, transmission, fuel, and descriptive metadata.
- `GET /api/assets` returns 10 verified metadata rows; nine semantic artwork keys are used by
  inventory records and the uploaded hero object is retained as an unused remote backup.
- The two Milestone 7 migrations extended the image/fuel enums and added Bentley, Porsche,
  Mercedes-Maybach, Audi, and Land Rover vehicle/media rows without resetting existing stock on
  conflict.
- The runtime project configured in `backend/.env` was migrated and verified through Prisma/direct
  PostgreSQL because the connected Supabase tool did not have permission to inspect that project.
- The public `Assets-SVG` bucket contains the nine card SVGs under `vehicles/`; all five newly
  referenced public URLs returned HTTP `200 image/svg+xml`. Their live object names end in
  `.svg.svg`, and the media catalog intentionally stores those exact paths.
- The localhost collection rendered Rolls-Royce, Bugatti, Lamborghini, and McLaren cards using the
  exact public Storage URLs. The Home route rendered the bundled `Final-CarHero Page.svg`.
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
