# Vehicle Inventory

A TDD-driven full-stack vehicle inventory application built with TypeScript, Express, React,
PostgreSQL/Supabase, Prisma, Tailwind CSS, JWT, and bcrypt.

## Current status

Milestone 2 is complete:

- Secure registration and login REST endpoints
- Lowercase, trimmed email normalization on the client and server
- Validation requiring `@` and a qualified dotted domain
- bcrypt password hashing with a configurable work factor
- Short-lived HS256 JWTs with issuer and audience verification
- Authentication middleware and reusable role authorization
- Environment-seeded administrator; public registration is always `USER`
- Responsive login and registration UI using shadcn-style source components
- Session restoration, logout, and protected React routes
- 43 automated tests across the API and SPA

Vehicle CRUD, search, purchase/restock workflows, and the completed dashboard belong to later
milestones.

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

| Variable         | Purpose                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`   | Runtime PostgreSQL URL; use the Supabase transaction pooler on port `6543` |
| `DIRECT_URL`     | Prisma migration URL; use the Supabase session pooler on port `5432`       |
| `JWT_SECRET`     | Private signing secret containing at least 32 characters                   |
| `JWT_EXPIRES_IN` | Access-token lifetime, default `15m`                                       |
| `JWT_ISSUER`     | Expected JWT issuer                                                        |
| `JWT_AUDIENCE`   | Expected JWT audience                                                      |
| `BCRYPT_ROUNDS`  | bcrypt work factor from 10 through 14, default `12`                        |
| `ADMIN_EMAIL`    | Optional administrator email; requires `ADMIN_PASSWORD`                    |
| `ADMIN_PASSWORD` | Optional administrator password; requires `ADMIN_EMAIL`                    |
| `CORS_ORIGIN`    | Allowed frontend origin                                                    |
| `VITE_API_URL`   | Browser-visible API base URL, default `http://localhost:3000/api`          |

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

## Security decisions

- Passwords are never returned or stored in plaintext.
- JWT verification pins `HS256`, issuer, and audience and validates decoded claim shape.
- JWT and administrator secrets are read only from environment variables.
- Authentication failures do not reveal whether an email exists.
- Express applies Helmet, a configured CORS origin, and a 1 MB JSON body limit.
- Tokens are kept in `sessionStorage`, limiting persistence to the current browser tab. An
  HTTP-only secure-cookie design would be preferred when refresh tokens and CSRF protection are
  introduced.
- Role checks return `401` for missing/invalid identity and `403` for insufficient permissions.

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

- Create, update, delete, and restock operations are admin-only.
- Purchase and restock accept a positive integer quantity.
- Zero-stock vehicles remain visible but cannot be purchased.
- Insufficient stock returns `409 Conflict`.
- Search filters are combinable, case-insensitive, and validate price ranges.
- `PUT` performs a complete vehicle replacement.

## My AI Usage

I used OpenAI Codex as a co-development assistant during planning and implementation. It helped me
turn the assignment into milestones, research current library/security guidance, draft Red tests,
implement the matching Green code, inspect architecture and unused files, and improve documentation.
I reviewed the resulting behavior through tests, linting, type checking, production builds, Git
diffs, and Supabase security checks.

AI was most useful for accelerating repetitive setup and expanding edge-case coverage, including
email normalization, bcrypt's 72-byte input boundary, generic login failures, JWT claim
verification, and role middleware. The important lesson was that generated code still required
human-style verification: static analysis caught a React state-effect issue, and an architecture
review found the missing administrator seed path. Both were corrected before handoff.

Every AI-assisted commit includes:

```text
Co-authored-by: OpenAI Codex <noreply@openai.com>
```

Sanitized prompt history and decisions are preserved in [PROMPTS.md](./PROMPTS.md). Credentials,
tokens, and connection strings are deliberately omitted.
