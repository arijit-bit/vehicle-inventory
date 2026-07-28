# AI Prompt Log

This file records AI-assisted work transparently. Passwords, tokens, connection strings, and other
secrets must be removed before prompts are added.

## 2026-07-28 — Planning

**Prompt summary:** Plan a full-stack CRUD vehicle inventory assignment emphasizing TDD,
authentication and security, atomic stock updates, clean architecture, Git history, documentation,
and transparent AI usage.

**Decisions:**

- TypeScript, Express, PostgreSQL, Prisma, JWT, bcrypt
- React, Vite, Tailwind CSS, React Router
- Vitest, Supertest, and React Testing Library
- Environment-seeded administrator; public registration cannot choose an admin role
- Atomic conditional database updates for purchasing

## 2026-07-28 — Milestone 1

**Prompt summary:** Start Milestone 1 and evaluate using Supabase as the database.

**Decision:** Use Supabase-hosted PostgreSQL with Prisma. Keep authentication in Express rather than
Supabase Auth so the assignment's JWT, password-hashing, and role-authorization requirements remain
visible and testable. Keep a local PostgreSQL 17 Docker service for offline development and CI-style
verification.

**Connection setup:** The user supplied a Supabase project connection and database credential.
Secrets were excluded from Git and this prompt log. The initial schema was deployed and verified
through the authenticated Supabase connector. The supplied password was rejected by PostgreSQL, so
the one-time Prisma migration baseline must be completed after the database password is rotated.
