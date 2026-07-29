# Vehicle Inventory

A TDD-driven full-stack vehicle inventory application built with TypeScript, Express, React,
PostgreSQL/Supabase, Prisma, Tailwind CSS, JWT, and bcrypt.

## Current status

Milestone 7 is complete:

- Secure registration and login REST endpoints
- Lowercase, trimmed email normalization on the client and server
- Validation requiring `@` and a qualified dotted domain
- bcrypt password hashing with a configurable work factor
- Short-lived HS256 JWTs with issuer and audience verification
- Authentication middleware and reusable role authorization
- Environment-seeded administrator; public registration supports `CUSTOMER` and `EMPLOYEE`
- Reference-led dark-luxury landing page with metallic hero typography, responsive navigation, and
  the repository's exotic vehicle artwork
- A shared reference-led navigation header across Home, Inventory, Login, and Register
- Premium centered login and registration flows with email/password authentication
- Session restoration, logout, and protected React routes
- Protected vehicle listing and combined make, model, category, and price-range search
- Employee/Admin vehicle creation and updates; Administrator-only deletion and restocking
- Exact two-decimal price serialization and non-negative stock validation
- Prisma persistence with stable not-found handling
- Atomic purchasing and restocking with row-lock serialization and transaction-local deadlines
- Retryable `503 INVENTORY_BUSY` responses for database and connection-pool contention
- Persisted catalog year, artwork key, color, engine, transmission, fuel type, and description
- An idempotent four-vehicle starter collection applied through the Prisma migration history
- Dark-luxury collection with transparent vehicle artwork, brand filtering, price sorting, search,
  stock-aware purchasing, and sold-out states
- Signed-in identity and role surface with responsive availability tabs and live result counts
- Session-race protection and automatic logout when protected APIs reject an expired token
- Accessible form errors linked to the affected authentication controls
- Radix-powered Shadcn Navigation Menu, Select, Dialog, Button, Card, Input, and Table primitives
- Dedicated Employee/Administrator workspace with a responsive inventory management table
- Administrator add, edit, restock, and delete forms with explicit destructive confirmation
- Accessible dialogs with Escape, backdrop, focus trapping, and scroll handling
- Real signed-token verification that `DELETE /api/vehicles/:id` is administrator-only
- End-to-end auth boundary proof from registration through profile restore and protected inventory
- 143 automated tests across the API and SPA

## Architecture

```text
React SPA -> Express routes -> application services -> repository -> Prisma -> PostgreSQL/Supabase
```

Authentication stays in the Express API rather than Supabase Auth so password hashing, JWT
creation, and role authorization remain visible and testable for the assignment.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A Supabase project, or Docker for the local PostgreSQL fallback

## Setup

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run prisma:generate --workspace backend
npm run prisma:migrate:deploy --workspace backend
npm run dev
```

PowerShell equivalents:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

The API starts at `http://localhost:3000` and the SPA at `http://localhost:5173`.

### Environment variables

| Variable                        | Purpose                                                                    |
| ------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`                  | Runtime PostgreSQL URL; use the Supabase transaction pooler on port `6543` |
| `DIRECT_URL`                    | Prisma migration URL; use the Supabase session pooler on port `5432`       |
| `DATABASE_LOCK_TIMEOUT_MS`      | Per-transaction row-lock deadline, default `2000`                          |
| `DATABASE_STATEMENT_TIMEOUT_MS` | Per-transaction SQL deadline, default `10000`; must exceed lock timeout    |
| `JWT_SECRET`                    | Private signing secret containing at least 32 characters                   |
| `JWT_EXPIRES_IN`                | Access-token lifetime, default `15m`                                       |
| `JWT_ISSUER`                    | Expected JWT issuer                                                        |
| `JWT_AUDIENCE`                  | Expected JWT audience                                                      |
| `BCRYPT_ROUNDS`                 | bcrypt work factor from 10 through 14, default `12`                        |
| `ADMIN_EMAIL`                   | Optional administrator email; requires `ADMIN_PASSWORD`                    |
| `ADMIN_PASSWORD`                | Optional administrator password; requires `ADMIN_EMAIL`                    |
| `CORS_ORIGIN`                   | Allowed frontend origin                                                    |
| `VITE_API_URL`                  | Browser-visible API base URL, default `http://localhost:3000/api`          |

Generate a development JWT secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Never commit real database URLs, JWT secrets, or administrator credentials.

### Administrator account

Set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`. At API startup, the email is
normalized, the password is bcrypt-hashed, and the account is idempotently upserted as `ADMIN`
before the server accepts requests. Leaving both variables unset disables seeding. Providing only
one makes startup fail fast.

Public registration accepts only `CUSTOMER` or `EMPLOYEE`; it never accepts `ADMIN`.

### Supabase connection

Create a Supabase PostgreSQL project and copy its pooler URLs from **Connect** in the dashboard.
URL-encode special password characters. Database URLs are backend-only and must never use the
`VITE_` prefix.

The `users` and `vehicles` tables have RLS enabled. Supabase `anon` and `authenticated` roles have
no table DML privileges because Express is the only public data boundary. No permissive RLS policy
is intentionally defined.

Vehicle SVGs remain versioned with the frontend bundle. The database stores a validated
`imageKey`, so each catalog row chooses its artwork without storing a fragile build filename or
duplicating repository-owned files in object storage. If future administrators upload arbitrary
media, move those uploads to a dedicated public Supabase Storage bucket, keep write operations
server-controlled, and persist the resulting object path rather than a temporary signed URL.

Verify the live table security and seeded catalog count with:

```bash
npm run verify:database-security --workspace backend
```

### Local PostgreSQL fallback

```bash
docker compose up -d
npm run prisma:migrate:dev --workspace backend -- --name init
```

Matching local connection strings are documented in `backend/.env.example`.

## Authentication API

All JSON error responses use `{ "error": { "code": "...", "message": "..." } }`.

| Method | Endpoint             | Access     | Result                                                       |
| ------ | -------------------- | ---------- | ------------------------------------------------------------ |
| `POST` | `/api/auth/register` | Public     | Creates a Customer/Employee and returns the user and JWT     |
| `POST` | `/api/auth/login`    | Public     | Verifies the bcrypt hash and returns the public user and JWT |
| `GET`  | `/api/auth/me`       | Bearer JWT | Returns identity claims for the current session              |

Registration body:

```json
{
  "email": "driver@example.com",
  "password": "SafePass123!",
  "role": "CUSTOMER"
}
```

The password must contain 8 to 72 UTF-8 bytes. The 72-byte ceiling prevents bcrypt truncation
ambiguity. Duplicate registration returns `409 Conflict`; invalid or unknown login credentials use
the same generic `401 Unauthorized` response to reduce account enumeration.

Use protected endpoints with:

```http
Authorization: Bearer <token>
```

## Vehicle API

Vehicle prices are returned as two-decimal strings so JSON clients do not lose decimal precision.
Guests can list and search. Any authenticated role can purchase. `EMPLOYEE` and `ADMIN` can create
and update vehicles, while only `ADMIN` can delete or restock.

| Method   | Endpoint                     | Access     | Result                                             |
| -------- | ---------------------------- | ---------- | -------------------------------------------------- |
| `GET`    | `/api/vehicles`              | Public     | Lists every inventory record                       |
| `GET`    | `/api/vehicles/search`       | Public     | Searches with combinable query parameters          |
| `POST`   | `/api/vehicles`              | Employee+  | Creates a vehicle with its initial quantity        |
| `PUT`    | `/api/vehicles/:id`          | Employee+  | Updates supplied catalog fields, excluding stock   |
| `DELETE` | `/api/vehicles/:id`          | Admin      | Deletes a vehicle in a short protected transaction |
| `POST`   | `/api/vehicles/:id/purchase` | Bearer JWT | Atomically decreases available quantity            |
| `POST`   | `/api/vehicles/:id/restock`  | Admin      | Atomically increases available quantity            |

Create payload:

```json
{
  "make": "Lamborghini",
  "model": "Revuelto",
  "year": 2024,
  "category": "Supercar",
  "imageKey": "GREEN_LAMBO",
  "colorName": "Verde Mantis",
  "colorHex": "#4D8D42",
  "engine": "6.5L V12 Hybrid",
  "transmission": "AUTOMATIC",
  "fuelType": "HYBRID",
  "details": "A V12 flagship enhanced by three electric motors.",
  "price": 620000,
  "quantity": 2
}
```

`imageKey` accepts `WHITE_RR`, `BLUE_BUGATTI`, `GREEN_LAMBO`, or `BLACK_CAR`.
`transmission` accepts `MANUAL` or `AUTOMATIC`; `fuelType` accepts `PETROL`, `DIESEL`, `HYBRID`,
or `ELECTRIC`.

## Administrator user API

Every endpoint requires an `ADMIN` bearer token. Responses never include password hashes.

| Method   | Endpoint         | Result                                       |
| -------- | ---------------- | -------------------------------------------- |
| `GET`    | `/api/users`     | Lists user accounts                          |
| `POST`   | `/api/users`     | Creates a Customer, Employee, or Admin       |
| `GET`    | `/api/users/:id` | Returns one user                             |
| `PUT`    | `/api/users/:id` | Updates email, password, and/or assigns role |
| `DELETE` | `/api/users/:id` | Deletes another user account                 |

Self-deletion and self-demotion are rejected to prevent an administrator from accidentally
locking themselves out.

Create body:

```json
{
  "make": "Toyota",
  "model": "Camry",
  "category": "Sedan",
  "price": "32999.90",
  "quantity": 4
}
```

`price` accepts a JSON number or decimal string with at most two fractional digits. `quantity`
must be a non-negative integer. Names are trimmed, required, and limited to 100 characters.

Update bodies deliberately exclude `quantity`:

```json
{
  "make": "Toyota",
  "model": "Camry Hybrid",
  "category": "Sedan",
  "price": "33999.90"
}
```

Stock can change only through `purchase` and `restock`. This prevents a stale administrator form
from replacing a quantity that changed while a user was purchasing.

Search parameters are optional and combined with AND semantics:

```http
GET /api/vehicles/search?make=toy&model=cam&category=sedan&minPrice=10000&maxPrice=40000
```

Text matching is case-insensitive and contains-based. Price bounds are inclusive. An inverted or
malformed range returns `400 VALIDATION_ERROR`; a missing update/delete target returns
`404 VEHICLE_NOT_FOUND`.

Purchase and restock accept an optional positive integer quantity:

```json
{
  "quantity": 2
}
```

Omitting the body defaults to one vehicle. Purchasing uses one conditional database
`UPDATE ... WHERE quantity >= requested RETURNING ...` statement, preventing concurrent requests
from overselling stock. Insufficient quantity returns `409 INSUFFICIENT_STOCK`. Restocking uses an
atomic database increment and remains administrator-only.

## Atomicity and concurrency strategy

Every existing-row mutation runs in a short Prisma interactive transaction. Before the mutation,
the transaction applies PostgreSQL `lock_timeout` and `statement_timeout` with
`set_config(..., true)`. The `true` scope is transaction-local, so the setting cannot leak through
the Supabase transaction pool to a later request.

| Competing operations       | Database behavior                                                  | API outcome                                                   |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| Purchase vs purchase       | Conditional decrements serialize on the vehicle row                | Winners return `200`; requests after stock reaches zero `409` |
| Purchase vs restock        | Relative decrement/increment operations wait for the same row lock | Both commit in lock order; no update is lost                  |
| Purchase vs metadata edit  | Edit waits but never writes `quantity`                             | Purchased quantity is preserved                               |
| Purchase vs delete         | Operations serialize; the later request observes committed state   | Purchase/delete succeeds or the later target receives `404`   |
| Lock/statement deadline    | PostgreSQL aborts and rolls back the transaction                   | `503 INVENTORY_BUSY` with `Retry-After: 1`                    |
| Prisma pool-start deadline | No transaction begins and no data changes                          | `503 INVENTORY_BUSY` with `Retry-After: 1`                    |

The lock deadline is intentionally lower than the statement deadline. A timed-out transaction is
fully rolled back; clients should wait for the `Retry-After` delay and retry the complete operation.
The database check constraint `quantity >= 0` remains a second line of defense.

No Milestone 4 schema migration is needed: PostgreSQL row locks are acquired by the existing
`UPDATE` and `DELETE` statements, and arithmetic stock updates preserve the existing constraint.

### Inventory errors

All errors use `{ "error": { "code": "...", "message": "..." } }`.

| Status | Code                 | Meaning                                                    |
| -----: | -------------------- | ---------------------------------------------------------- |
|    400 | `VALIDATION_ERROR`   | Invalid identifier, fields, price, or quantity             |
|    401 | `UNAUTHENTICATED`    | Missing, expired, or invalid bearer token                  |
|    403 | `FORBIDDEN`          | A non-admin attempted an administrator operation           |
|    404 | `VEHICLE_NOT_FOUND`  | The vehicle does not exist or was deleted concurrently     |
|    409 | `INSUFFICIENT_STOCK` | The purchase cannot be fulfilled from committed stock      |
|    503 | `INVENTORY_BUSY`     | Lock, statement, or transaction-start deadline was reached |

## Milestone 7 interface

The React collection uses an obsidian `#0B0B0C` canvas, charcoal `#161618` cards, silver
`#8E8E93` supporting type, `#242427` borders, and a shared 12px radius. A single reference-led
Navigation Menu now spans Home, Inventory, Login, and Register. Radix-powered Shadcn Select controls
provide brand filtering, price sorting, and expandable advanced search. Availability tabs switch
locally between all, purchasable, and sold-out records without another network request.

Vehicle cards use the repository's non-hero transparent automotive assets with database-backed
color, artwork selection, transmission, model year, engine, fuel, description, price, and stock.
Expanded details show the persisted specification instead of frontend placeholders. Guest visitors
can browse and filter but must sign in before reserving a vehicle.

The glass navigation header shows the verified email and effective role returned by `/api/auth/me`.
Expired or rejected bearer tokens immediately clear the tab-scoped session and return the user to
the login route. A late profile response cannot restore identity after the user has signed out.

After purchase or restock, the UI replaces the card with the vehicle returned by the committed API
response rather than guessing the new quantity locally. Administrators additionally receive:

- an Add Vehicle form including initial quantity;
- an Edit form for descriptive fields and price, intentionally without quantity;
- a positive-quantity Restock form;
- a destructive Delete confirmation.

### Administrator interface

Verified `EMPLOYEE` and `ADMIN` users receive the **Manage inventory** workspace switcher. The
responsive table gives both roles create/edit controls; restock and delete controls render only for
Administrators. Express independently enforces the same policy.

Create, edit, restock, and delete use Radix Dialog focus management. They dismiss with Escape or a
backdrop press and restore focus to the triggering control. Delete confirmation identifies the
exact vehicle, current stock, and permanence before calling `DELETE /api/vehicles/:id`.

Transient `INVENTORY_BUSY` responses tell the user to retry. `INSUFFICIENT_STOCK` explains that the
vehicle sold out, while authorization errors remain distinct.

## Security decisions

- Passwords are never returned or stored in plaintext.
- JWT verification pins `HS256`, issuer, and audience and validates decoded claim shape.
- JWT and administrator secrets are read only from environment variables.
- Authentication failures do not reveal whether an email exists.
- Express applies Helmet, a configured CORS origin, and a 1 MB JSON body limit.
- The SPA uses the declarative React Router API only. It does not enable React Server Components or
  server actions.
- Tokens are kept in `sessionStorage`, limiting persistence to the current browser tab. An
  HTTP-only secure-cookie design would be preferred when refresh tokens and CSRF protection are
  introduced.
- Session restoration responses are ignored after logout, preventing a stale request from
  resurrecting local identity.
- Any protected inventory `401` clears the client session instead of leaving stale dashboard
  access visible.
- Role checks return `401` for missing/invalid identity and `403` for insufficient permissions.
- Administrator navigation is hidden for regular users, while Express independently enforces the
  role boundary for every mutation.
- A real-JWT integration test proves that regular users receive `403` from vehicle deletion and
  administrators reach the delete service.
- Generic updates cannot write stock; only relative purchase/restock operations can mutate it.
- Database lock and statement limits are transaction-local and safe with pooled connections.

## Quality commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

GitHub Actions runs the same checks on every push and pull request. See
[TEST_REPORT.md](./TEST_REPORT.md) for the latest recorded results.

## Documented inventory assumptions

- Create and update require an Employee or Administrator; delete and restock require Administrator.
- Purchase and restock accept a positive integer quantity.
- Zero-stock vehicles remain visible but cannot be purchased.
- Insufficient stock returns `409 Conflict`.
- Transient lock, statement, and pool-acquisition timeouts return retryable `503 Service Unavailable`.
- Search filters are combinable, case-insensitive, and validate price ranges.
- `PUT` updates only supplied catalog metadata fields, rejects stock, and rejects an empty body.
- Static repository-owned SVGs are selected by a validated database `imageKey`; Supabase Storage is
  reserved for future user-managed media uploads.

## My AI Usage

I used OpenAI Codex as a co-development assistant during planning and implementation. It helped me
turn the assignment into milestones, research current library/security guidance, draft Red tests,
implement the matching Green code, inspect architecture and unused files, and improve documentation.
It also generated the single MotoVault social-preview image from a project-specific visual brief.
I reviewed the resulting behavior through tests, linting, type checking, production builds, Git
diffs, and Supabase security checks.

AI was most useful for accelerating repetitive setup and expanding edge-case coverage, including
email normalization, bcrypt's 72-byte input boundary, generic login failures, JWT claim
verification, role middleware, decimal money validation, combined inventory filters, and missing
database records. The important lesson was that generated code still required human-style
verification: static analysis caught a React state-effect issue, an architecture review found the
missing administrator seed path, and live query planning confirmed which inventory index the
combined search actually used. Each issue was checked before handoff.

Every AI-assisted commit includes:

```text
Co-authored-by: OpenAI Codex <noreply@openai.com>
```

Sanitized prompt history and decisions are preserved in [PROMPTS.md](./PROMPTS.md). Credentials,
tokens, and connection strings are deliberately omitted.
