# Vehicle Inventory

A TDD-driven full-stack vehicle inventory application built with TypeScript, Express, React,
PostgreSQL/Supabase, Prisma, Tailwind CSS, JWT, and bcrypt.

## Current status

Milestone 6 is complete:

- Secure registration and login REST endpoints
- Lowercase, trimmed email normalization on the client and server
- Validation requiring `@` and a qualified dotted domain
- bcrypt password hashing with a configurable work factor
- Short-lived HS256 JWTs with issuer and audience verification
- Authentication middleware and reusable role authorization
- Environment-seeded administrator; public registration is always `USER`
- Responsive login and registration UI using shadcn-style source components
- Session restoration, logout, and protected React routes
- Protected vehicle listing and combined make, model, category, and price-range search
- Administrator-only vehicle creation, metadata updates, deletion, and restocking
- Exact two-decimal price serialization and non-negative stock validation
- Prisma persistence with stable not-found handling
- Atomic purchasing and restocking with row-lock serialization and transaction-local deadlines
- Retryable `503 INVENTORY_BUSY` responses for database and connection-pool contention
- Responsive inventory dashboard with search, stock-aware purchasing, and sold-out states
- Signed-in identity and role surface with responsive availability tabs and live result counts
- Session-race protection and automatic logout when protected APIs reject an expired token
- Accessible form errors linked to the affected authentication controls
- Dedicated administrator workspace with responsive inventory management table
- Administrator add, edit, restock, and delete forms with explicit destructive confirmation
- Mobile bottom-sheet dialogs with Escape, backdrop, focus, and scroll handling
- Real signed-token verification that `DELETE /api/vehicles/:id` is administrator-only
- End-to-end auth boundary proof from registration through profile restore and protected inventory
- 117 automated tests across the API and SPA

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

Public registration never accepts a role field and always creates `USER`.

### Supabase connection

Create a Supabase PostgreSQL project and copy its pooler URLs from **Connect** in the dashboard.
URL-encode special password characters. Database URLs are backend-only and must never use the
`VITE_` prefix.

The `users` and `vehicles` tables have RLS enabled. Supabase `anon` and `authenticated` roles have
no table DML privileges because Express is the only public data boundary. No permissive RLS policy
is intentionally defined.

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
| `POST` | `/api/auth/register` | Public     | Creates a `USER`, then returns the public user and JWT       |
| `POST` | `/api/auth/login`    | Public     | Verifies the bcrypt hash and returns the public user and JWT |
| `GET`  | `/api/auth/me`       | Bearer JWT | Returns identity claims for the current session              |

Registration body:

```json
{
  "email": "driver@example.com",
  "password": "SafePass123!"
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
All endpoints require a bearer JWT. `USER` and `ADMIN` accounts can list, search, and purchase.
Creating, updating, deleting, and restocking inventory requires an `ADMIN` role.

| Method   | Endpoint                     | Access     | Result                                             |
| -------- | ---------------------------- | ---------- | -------------------------------------------------- |
| `GET`    | `/api/vehicles`              | Bearer JWT | Lists every inventory record                       |
| `GET`    | `/api/vehicles/search`       | Bearer JWT | Searches with combinable query parameters          |
| `POST`   | `/api/vehicles`              | Admin      | Creates a vehicle with its initial quantity        |
| `PUT`    | `/api/vehicles/:id`          | Admin      | Updates make, model, category, and/or price        |
| `DELETE` | `/api/vehicles/:id`          | Admin      | Deletes a vehicle in a short protected transaction |
| `POST`   | `/api/vehicles/:id/purchase` | Bearer JWT | Atomically decreases available quantity            |
| `POST`   | `/api/vehicles/:id/restock`  | Admin      | Atomically increases available quantity            |

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

## Inventory interface

The protected React dashboard lists current stock and provides combined make, model, category, and
price filters. Availability tabs switch locally between all, purchasable, and sold-out records
without another network request, while an announced result count keeps the current view clear.
Every available card has a one-unit Purchase button. A zero-stock card remains visible in the
default view but renders a disabled **Out of stock** button.

The dashboard header shows the verified email and effective role returned by `/api/auth/me`.
Expired or rejected bearer tokens immediately clear the tab-scoped session and return the user to
the login route. A late profile response cannot restore identity after the user has signed out.

After purchase or restock, the UI replaces the card with the vehicle returned by the committed API
response rather than guessing the new quantity locally. Administrators additionally receive:

- an Add Vehicle form including initial quantity;
- an Edit form for descriptive fields and price, intentionally without quantity;
- a positive-quantity Restock form;
- a destructive Delete confirmation.

### Administrator interface

Only verified `ADMIN` users receive the **Manage inventory** workspace switcher. The administrator
view uses a shadcn-style responsive table: less important columns collapse at smaller breakpoints,
vehicle context remains visible, and touch-sized edit, restock, and delete controls stay available
without duplicating the DOM.

Create, edit, restock, and delete dialogs behave as centered modals on larger screens and
bottom-aligned sheets on mobile. They lock background scrolling, dismiss with Escape or a backdrop
press, and restore focus to the triggering control. Delete confirmation identifies the exact
vehicle, current stock, permanence, and database-serialization behavior before calling
`DELETE /api/vehicles/:id`.

Transient `INVENTORY_BUSY` responses tell the user to retry. `INSUFFICIENT_STOCK` explains that the
vehicle sold out, while authorization errors remain distinct.

## Security decisions

- Passwords are never returned or stored in plaintext.
- JWT verification pins `HS256`, issuer, and audience and validates decoded claim shape.
- JWT and administrator secrets are read only from environment variables.
- Authentication failures do not reveal whether an email exists.
- Express applies Helmet, a configured CORS origin, and a 1 MB JSON body limit.
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

- Create, update, delete, and restock require an administrator.
- Purchase and restock accept a positive integer quantity.
- Zero-stock vehicles remain visible but cannot be purchased.
- Insufficient stock returns `409 Conflict`.
- Transient lock, statement, and pool-acquisition timeouts return retryable `503 Service Unavailable`.
- Search filters are combinable, case-insensitive, and validate price ranges.
- `PUT` updates only supplied metadata fields, rejects stock, and rejects an empty body.

## My AI Usage

I used OpenAI Codex as a co-development assistant during planning and implementation. It helped me
turn the assignment into milestones, research current library/security guidance, draft Red tests,
implement the matching Green code, inspect architecture and unused files, and improve documentation.
It also generated the single MotorVault social-preview image from a project-specific visual brief.
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
