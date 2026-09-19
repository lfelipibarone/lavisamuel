# Backend + Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone Hono + Prisma + PostgreSQL API that stores guests and game results and serves the public leaderboard.

**Architecture:** `apps/api` as its own Node package (monorepo folder). Local Postgres via `docker-compose.dev.yml`. Web stays at repo root for now; wiring the Vite app is a follow-up plan.

**Tech Stack:** Hono, `@hono/node-server`, Prisma, PostgreSQL 16, Zod, TypeScript, tsx

## Global Constraints

- Follow `docs/superpowers/specs/2026-09-19-guest-leaderboard-design.md`
- Endpoints: `POST /guests`, `POST /results`, `GET /leaderboard`, `GET /health`
- Models: `Guest` (unique `nameKey`), `GameResult` (history rows; ranking = max score per guest per game)
- No frontend changes in this plan
- KISS: ranking computed on read; no Redis

---

### Task 1: Scaffold `apps/api`

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts` (placeholder listen)
- Create: `apps/api/.env.example`
- Create: `docker-compose.dev.yml` (Postgres only)
- Modify: `.gitignore` (add `.env`, Prisma generated if needed)

- [ ] Create package with scripts: `dev`, `build`, `start`, `db:migrate`, `db:generate`
- [ ] Add deps: `hono`, `@hono/node-server`, `@prisma/client`, `zod`; dev: `prisma`, `tsx`, `typescript`, `@types/node`
- [ ] `npm install` in `apps/api`
- [ ] Commit

### Task 2: Prisma schema + migration

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: migration via `prisma migrate`

- [ ] Define `Game` enum, `Guest`, `GameResult` with indexes from spec
- [ ] Start Postgres: `docker compose -f docker-compose.dev.yml up -d`
- [ ] Set `DATABASE_URL` in `apps/api/.env`
- [ ] Run `npx prisma migrate dev --name init_guests_and_results`
- [ ] Commit schema + migration (not `.env`)

### Task 3: Domain modules + routes

**Files:**
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/lib/normalize.ts` (`nameKey`)
- Create: `apps/api/src/lib/validate.ts` (zod schemas)
- Create: `apps/api/src/routes/guests.ts`
- Create: `apps/api/src/routes/results.ts`
- Create: `apps/api/src/routes/leaderboard.ts`
- Create: `apps/api/src/app.ts` (Hono app + CORS)
- Modify: `apps/api/src/index.ts`

- [ ] Implement find-or-create guest
- [ ] Implement create result (404 if guest missing)
- [ ] Implement leaderboard (best score per guest, top 10 each game)
- [ ] Wire CORS from `CORS_ORIGIN` (comma-separated OK)
- [ ] Commit

### Task 4: Verify

- [ ] `npm run dev` in `apps/api`
- [ ] `curl` health, create guest, post quiz+bouquet results, get leaderboard
- [ ] Document run steps in `apps/api/README.md`
- [ ] Commit README

**Done when:** API answers all four endpoints against local Postgres with correct ranking.
