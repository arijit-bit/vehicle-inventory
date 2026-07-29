# AI Prompt Log

This file records AI-assisted work transparently. Passwords, tokens, full connection strings, and
other secrets are removed.

## 2026-07-28 - Planning

**Prompt summary:** Plan a full-stack CRUD vehicle inventory assignment emphasizing TDD,
authentication and security, atomic stock updates, clean architecture, Git history, documentation,
and transparent AI usage.

**Decisions:**

- TypeScript, Express, PostgreSQL, Prisma, JWT, and bcrypt
- React, Vite, Tailwind CSS, React Router
- Vitest, Supertest, and React Testing Library
- Environment-seeded administrator; public registration cannot choose an admin role
- Atomic conditional database updates for purchasing

## 2026-07-28 - Milestone 1

**Prompt summary:** Start Milestone 1 and evaluate using Supabase as the database.

**Decision:** Use Supabase-hosted PostgreSQL with Prisma. Keep authentication in Express rather than
Supabase Auth so the assignment's JWT, password-hashing, and role-authorization requirements remain
visible and testable. Keep a local PostgreSQL 17 Docker service as an offline fallback.

**Connection setup:** The user supplied a Supabase project connection and database credential.
Secrets were excluded from Git and this prompt log. The schema was deployed and verified through
the authenticated Supabase connection. The pasted database password must be rotated because it was
shared in chat, even though it was not committed.

## 2026-07-28 - Milestone 1 publication

**Prompt summary:** Review the backend for unnecessary files, confirm Milestone 1, preserve
AI-coauthored Git history, create a public GitHub repository, push the branch, and create a
milestone tag.

**Actions:** Audited the workspace, removed verified-unnecessary output, verified tests and build,
confirmed AI trailers, and published the existing project history to GitHub.

## 2026-07-28 - Milestone 2 authentication and authorization

**User prompt summary:** Implement registration and login with special care for lowercase email
addresses and valid `@` plus dotted-domain formatting. Use JWT and bcrypt, keep the JWT secret in
environment variables, add authorization, and create a polished industry-level authentication UI
using shadcn-style components.

**AI-assisted work:**

- Defined backend registration, login, JWT, middleware, role-authorization, and HTTP contracts as
  failing tests before implementation.
- Added server-side email normalization and qualified-domain validation.
- Added an 8-to-72 UTF-8 byte password policy to avoid bcrypt truncation ambiguity.
- Implemented bcrypt hashing and comparison with configurable rounds.
- Implemented HS256 JWT signing and verification with expiry, issuer, audience, and claim-shape
  checks.
- Implemented generic invalid-credential errors and duplicate-email conflict handling.
- Implemented environment-seeded admin creation and fail-fast paired credential validation through
  additional Red-Green commits.
- Defined frontend routing, form, and API behavior as failing tests before implementation.
- Built responsive login and registration pages with shadcn-style source components, accessible
  password toggles, inline validation, API errors, session restoration, logout, and protected
  routing.
- Removed only verified-unused Vite starter assets.
- Ran formatting, linting, TypeScript checks, 43 tests, coverage, and production builds.
- Checked Supabase security/performance advisors and verified RLS plus revoked browser-role DML.
- Generated one MotoVault social-preview image using a navy/cyan enterprise visual brief and wired
  it into Open Graph and Twitter metadata.

**Review decisions:**

- Public registration always writes `USER`; clients cannot submit an admin role.
- Admin credentials are optional but must be provided as a complete pair.
- Tokens are stored in `sessionStorage` for this access-token-only milestone.
- Supabase Data API policies remain intentionally absent because `anon` and `authenticated` have no
  DML privileges and Express is the only public data boundary.
- An unrelated warning for an existing Supabase Storage bucket was documented but not modified
  because it is outside this repository's scope.

**Image-generation prompt summary:** Create a landscape MotoVault social card with a midnight navy
technical backdrop, one modern vehicle with cyan rim lighting, negative space for exact MotoVault
title text, and a restrained enterprise-security aesthetic. Avoid real vehicle brands, people,
watermarks, visual clutter, and generic stock-photo styling.

## 2026-07-29 - Milestone 3 vehicle CRUD and search

**User prompt summary:** Continue the project after the first two published milestones, follow the
provided seven-milestone delivery order, work carefully, and preserve the special Git rule that
every AI-assisted commit includes an AI co-author trailer.

**AI-assisted work:**

- Audited the completed authentication branch, full assignment brief, existing Git history, and
  two unrelated uncommitted root package changes before editing.
- Created a dedicated Milestone 3 branch while preserving and excluding those existing changes.
- Defined failing backend contracts first for vehicle validation, protected reads, administrator
  mutation guards, combined search filters, and missing-record behavior.
- Implemented strict trimmed catalog fields, exact two-decimal money handling, non-negative integer
  stock validation, and inclusive price-range validation.
- Added protected vehicle list/search endpoints and administrator-only create/update/delete
  endpoints with stable validation, authorization, and not-found error responses.
- Added a service/repository boundary and Prisma persistence with case-insensitive contains filters,
  AND semantics, exact decimal serialization, partial updates, and Prisma `P2025` handling.
- Added direct regression tests for Prisma query construction and persistence edge cases.
- Consulted current Supabase changelog and database guidance before verification.
- Verified the live Supabase vehicle schema, database constraints, indexes, RLS, revoked browser
  privileges, security/performance advisors, and an `EXPLAIN` plan showing price-index use.
- Ran formatting, linting, TypeScript checks, 91 tests, coverage, and production builds.

**Review decisions:**

- Both `USER` and `ADMIN` may list, search, create, update, and purchase; delete and restock are
  administrator-only under the user's final endpoint contract.
- Vehicle prices cross the JSON boundary as two-decimal strings to preserve PostgreSQL `DECIMAL`
  precision.
- Zero-stock records remain visible so the later dashboard can disable purchase without hiding
  inventory.
- Search fields combine with AND semantics; text uses case-insensitive contains matching and price
  bounds are inclusive.
- Existing informational Supabase no-policy notices remain intentional because Express is the only
  public data boundary and browser roles have no table DML privileges.

## 2026-07-29 - Milestone 3 inventory contract completion

**User prompt summary:** Complete the protected vehicle milestone with efficient CRUD/search plus
purchase and restock endpoints. Allow protected vehicle creation, listing, searching, and updates;
keep deletion and restocking administrator-only; ensure every vehicle has a unique ID, make, model,
category, price, and stock quantity.

**AI-assisted work:**

- Corrected create/update authorization from administrator-only to any authenticated user to match
  the final endpoint contract.
- Defined failing tests for positive stock quantities, bodyless single-unit defaults,
  authenticated purchasing, administrator restocking, insufficient-stock conflicts, missing
  records, and atomic Prisma query construction.
- Implemented purchase with one conditional PostgreSQL `UPDATE ... RETURNING` operation so
  concurrent requests cannot reduce stock below zero.
- Implemented restock with an atomic database increment and preserved administrator authorization.
- Added stable `409 INSUFFICIENT_STOCK`, `404 VEHICLE_NOT_FOUND`, `401 UNAUTHENTICATED`, and
  `403 FORBIDDEN` responses.
- Ran a self-cleaning live Supabase test that purchased stock, rejected an oversell, restocked the
  record, asserted each quantity, and removed the temporary record.

**Review decisions:**

- Mutation bodies accept an optional positive integer `quantity`; omitting it defaults to one.
- The database retains its non-negative quantity constraint as defense in depth behind the
  conditional application query.
- Purchase distinguishes insufficient stock from a nonexistent vehicle without weakening the
  atomic decrement.
- No new schema or extension was needed, so no migration was introduced.

## 2026-07-29 - Milestone 4 atomic purchasing, restocking, and inventory UI

**User prompt summary:** Implement atomic, thread-safe purchasing and administrator inventory
management. Add a Purchase button disabled at zero stock, administrator add/update/delete forms,
database concurrency handling, lock-timeout behavior, simultaneous administrator/user stock
updates, and stable `409`, `403`, and related API errors.

**AI-assisted work:**

- Reviewed current Supabase/PostgreSQL pooling and locking guidance before changing the repository.
- Defined Red tests for transaction-local lock deadlines, retryable contention errors, admin-only
  CRUD, rejection of stock in generic updates, authenticated vehicle requests, sold-out controls,
  combined search, and administrator dialogs.
- Wrapped existing-row mutations in short Prisma transactions and applied PostgreSQL
  `lock_timeout` plus `statement_timeout` with transaction-local `set_config` calls.
- Preserved the conditional purchase decrement and atomic restock increment while preventing
  generic `PUT` requests from replacing stock.
- Added `503 INVENTORY_BUSY` plus `Retry-After: 1` for PostgreSQL lock/statement deadlines.
- Built a responsive inventory dashboard with committed server-state updates, search filters,
  purchase controls, administrator create/edit/restock/delete workflows, accessible dialogs, and
  structured error feedback.
- Ran a live self-cleaning Supabase race with 12 purchases against stock 5, followed by concurrent
  purchase/restock operations.
- The live race exposed Prisma `P2028` pool-acquisition contention. A new Red test captured it; the
  Green fix maps it to the same retryable contract and allows transaction acquisition within the
  configured statement deadline.
- Verified zero temporary rows, RLS enabled, and no vehicle mutation privileges for Supabase
  browser roles.
- Ran 109 tests, coverage, linting, TypeScript checks, formatting, and production builds.

**Review decisions:**

- Milestone 4's administrator CRUD requirement supersedes Milestone 3's temporary authenticated
  create/update access: create, update, delete, and restock are now all administrator-only.
- Initial quantity is accepted only at creation. Later stock changes use relative purchase or
  restock operations.
- Purchase versus restock, update, or delete is serialized by PostgreSQL row locks. Metadata
  updates do not write quantity, eliminating the stale-form lost-update path.
- Lock settings are transaction-local so pooled connections cannot leak timeout configuration
  between requests.
- Database and transaction-start contention are retryable `503` errors; committed insufficient
  stock remains a non-retryable `409` business conflict.
- No migration was needed because existing `UPDATE`/`DELETE` statements acquire row locks and the
  non-negative stock constraint already provides defense in depth.

## 2026-07-29 - Milestone 5 React authentication and dashboard

**User prompt summary:** Continue the project with Milestone 5, act as a strong frontend and backend
developer, use shadcn-style UI elements to create polished authentication and dashboard pages,
validate the backend boundary, follow the repository's AI co-author rule, and commit the work.

**AI-assisted work:**

- Audited the earlier authentication and atomic-inventory milestones so Milestone 5 extended the
  existing React experience instead of duplicating it.
- Defined failing frontend contracts for session-restoration cancellation, expired-token logout,
  accessible auth error associations, signed-in identity display, and availability filtering.
- Prevented a late `/auth/me` response from restoring identity after logout.
- Cleared the tab-scoped session whenever a protected inventory call returns an unauthenticated
  `401` response.
- Connected validation messages to their inputs with `aria-invalid` and `aria-describedby`.
- Refined the responsive shadcn-style dashboard with a verified identity/role surface,
  all/available/sold-out tabs, announced result counts, and clearer protected-purchase context.
- Added a backend integration proof using the real bcrypt and JWT services from registration
  through `/auth/me`, protected inventory loading, and administrator-role denial.
- Ran 114 tests, coverage, linting, TypeScript checks, formatting, and production builds.

**Review decisions:**

- Existing Express JWT authentication remains the system of record; no second frontend or platform
  authentication stack was introduced.
- Availability tabs filter the server-returned collection locally and do not issue redundant API
  calls.
- The authenticated email and role come from verified server claims, never from editable client
  input.
- User-owned root package changes were preserved outside Milestone 5 commits.

## 2026-07-29 - Milestone 6 administrator interface and responsive polish

**User prompt summary:** Act as a strong full-stack developer and complete Milestone 6 with a
polished responsive administrator interface, forms to add/update/delete vehicles, special emphasis
on administrator-only `DELETE /api/vehicles/:id`, documentation, AI-coauthored commits, and GitHub
publication.

**AI-assisted work:**

- Audited the existing dashboard, role middleware, vehicle routes, tests, and uncommitted user
  assets before extending the interface.
- Defined frontend contracts for admin-only navigation, a dedicated management table, create,
  update, restock, delete confirmation, and Escape-based modal dismissal.
- Added a backend integration test with real signed `USER` and `ADMIN` JWTs to prove the delete
  endpoint returns `403` before the service for users and reaches the service for administrators.
- Built a dedicated administrator workspace with a responsive shadcn-style table and concise
  role-specific navigation.
- Centralized management actions in the admin workspace while keeping purchasing in the catalog
  view.
- Polished dialogs into mobile bottom sheets and desktop modals with background scroll locking,
  Escape and backdrop dismissal, focused entry, focus restoration, bounded height, and safe
  scrolling.
- Strengthened deletion copy with exact vehicle identity, current stock, permanence, and
  concurrency behavior.
- Ran 117 tests, coverage, formatting, linting, TypeScript checks, and both production builds.

**Review decisions:**

- Frontend role-aware visibility improves usability but never replaces backend authorization.
- `DELETE /api/vehicles/:id` remains protected by JWT verification and `ADMIN` authorization before
  input reaches the vehicle service.
- One responsive semantic table avoids rendering duplicate mobile and desktop action controls.
- Quantity remains excluded from generic edit forms; restocking stays on its atomic endpoint.
- Existing root Supabase manifest changes and user-supplied vehicle artwork were preserved outside
  Milestone 6 commits.

## 2026-07-29 - Milestone 7 dark-luxury interface modernization

**User prompt summary:** Act as a Principal Frontend Engineer and UI/UX Architect. Modernize the
React application into a production-ready luxury automotive experience using React Router 6,
Tailwind CSS, Radix-powered Shadcn components, a strict obsidian/charcoal/silver design token
system, centered social-enabled authentication, glass navigation, functional brand and price
controls, and premium vehicle cards. Keep multi-page expansion out of scope for now and preserve
TDD, clean-code, documentation, and AI-transparency requirements.

**AI-assisted work:**

- Added failing interaction contracts for social authentication controls, collection chrome,
  Shadcn Select behavior, brand filtering, price sorting, vehicle specification metadata, and
  circular detail controls before implementing the UI.
- Replaced the earlier cyan dashboard styling with the exact dark-luxury CSS variables, a shared
  12px radius, Inter/Plus Jakarta Sans typography, restrained uppercase tracking, and subtle grid
  texture.
- Added reusable Radix-powered Shadcn Button, Card, Dialog, Navigation Menu, Select, Input, Label,
  and Table primitives that compose conditional classes through `cn()`.
- Built a sticky glass navigation shell, responsive collection controls, expandable automotive
  cards using the repository's transparent vehicle assets, and a compact private-sales value
  section.
- Preserved guest browsing, authenticated purchases, advanced API search, availability filtering,
  Employee create/update controls, and Administrator create/update/restock/delete workflows.
- Rebuilt login and registration as centered backdrop-filtered cards with Google and Apple
  controls, clear provider-configuration feedback, and the existing secure email/password state.
- Kept the declarative React Router 6 API while upgrading the package to the current v7 line after
  the dependency audit found open-redirect/XSS advisories on the v6 release line.

**Review decisions:**

- Existing local SVG assets were reused rather than generating or copying third-party vehicle
  artwork.
- Social buttons explicitly report that provider credentials are required instead of pretending a
  provider login succeeded.
- Client-side brand and price controls compose with server-backed advanced search and never replace
  backend authorization.
- Multi-page vehicle detail, concierge, and editorial routes remain intentionally deferred as
  requested.
- The remaining router audit advisory is specific to React Server Component action handling; this
  Vite SPA uses `BrowserRouter` only and exposes no RSC actions.

## 2026-07-30 - Authentication interface refinement

**User prompt summary:** Remove Google and Apple login options from login and registration, enlarge
and lift the authentication-page vehicle SVG, and rebuild the registration account-type dropdown
with Shadcn UI.

**AI-assisted work:**

- Added failing route and form tests for removing both social-provider controls, enlarging and
  lifting the shared vehicle artwork, and selecting the Employee role through an accessible Radix
  combobox.
- Removed the unused social-login controls, provider notice state, and email separator from both
  authentication routes.
- Increased the vehicle-art container and raised/scaled the existing transparent SVG on login and
  registration.
- Replaced the native account-type select with the shared Shadcn/Radix Select primitives while
  preserving Customer as the default and Employee registration behavior.
- Ran all 30 frontend tests plus lint, TypeScript checking, and the production build.

**Review decisions:**

- The shared authentication page keeps both routes visually consistent without duplicating markup.
- The account selector retains a programmatic accessible name and keyboard-operable Radix options.
- Existing authentication and role-submission contracts remain unchanged.
