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
- Generated one MotorVault social-preview image using a navy/cyan enterprise visual brief and wired
  it into Open Graph and Twitter metadata.

**Review decisions:**

- Public registration always writes `USER`; clients cannot submit an admin role.
- Admin credentials are optional but must be provided as a complete pair.
- Tokens are stored in `sessionStorage` for this access-token-only milestone.
- Supabase Data API policies remain intentionally absent because `anon` and `authenticated` have no
  DML privileges and Express is the only public data boundary.
- An unrelated warning for an existing Supabase Storage bucket was documented but not modified
  because it is outside this repository's scope.

**Image-generation prompt summary:** Create a landscape MotorVault social card with a midnight navy
technical backdrop, one modern vehicle with cyan rim lighting, negative space for exact MotorVault
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
