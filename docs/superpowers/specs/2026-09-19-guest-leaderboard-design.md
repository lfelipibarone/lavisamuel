# Guest results & public leaderboard

**Date:** 2026-09-19  
**Status:** Approved for planning  
**Context:** Lavi & Samuel wedding site — public portfolio/case study

## Goal

Store each guest’s name and game history (Quiz + Bouquet) in PostgreSQL via a separate Node API, and show a public leaderboard on the site with two independent rankings (no combined score).

## Decisions (confirmed)

| Topic | Choice |
|--------|--------|
| Purpose | Public ranking on the site |
| Ranking shape | Two side-by-side lists: Top Quiz and Top Bouquet (1st, 2nd, 3rd…) |
| Scoring | No sum across games; each list uses that game’s score only |
| Name entry | Once at the start of the games flow |
| Persistence of plays | Every finished play creates a new result row (history) |
| Rank value | Best score per guest per game |
| Browser cache | `localStorage` for guest id/name and local game progress |
| Architecture | Monorepo: Vite web + separate Node API |
| Stack | Hono + Prisma + PostgreSQL; keep existing Vite + React front |

## Architecture

```
apps/web  (Vite)  --HTTPS-->  apps/api  (Hono)  -->  PostgreSQL
     |                              |
 localStorage                  Prisma Client
 (guestId, name,               Guest + GameResult
  quiz/bouquet progress)
```

- Front and API deploy independently.
- API owns all authoritative scores; browser cache is convenience only.

## Data model

### Guest

| Field | Type | Notes |
|--------|------|--------|
| id | cuid/uuid | Primary key; stored in `localStorage` |
| name | string | Display name as entered |
| nameKey | string | Normalized (`trim` + lower) for reuse lookup |
| createdAt | datetime | |

Unique on `nameKey` so the same typed name reuses one guest row.

### GameResult

| Field | Type | Notes |
|--------|------|--------|
| id | cuid/uuid | |
| guestId | FK → Guest | |
| game | enum `QUIZ` \| `BOUQUET` | |
| score | int | Points achieved |
| maxScore | int | e.g. quiz question count, bouquet rounds (5) |
| createdAt | datetime | |

Indexes: `(game, score DESC)`, `(guestId, game, createdAt)`.

**Leaderboard query:** for each game, group by guest, take `MAX(score)`, order desc, limit N (default 10; UI emphasizes 1–3).

## API

Base URL from `VITE_API_URL` (web) / listen port env (api).

| Method | Path | Body / response |
|--------|------|------------------|
| `POST` | `/guests` | `{ name }` → `{ id, name }` (find-or-create by `nameKey`) |
| `POST` | `/results` | `{ guestId, game, score, maxScore }` → `{ id, … }` |
| `GET` | `/leaderboard` | `{ quiz: RankEntry[], bouquet: RankEntry[] }` |
| `GET` | `/health` | `{ ok: true }` |

`RankEntry`: `{ rank, name, score, maxScore }`.

### Validation & safety

- Name: required, 2–40 chars, strip control chars; reject empty after trim.
- `game`: only `QUIZ` | `BOUQUET`.
- `score` / `maxScore`: non-negative ints; `score <= maxScore`; sensible caps (e.g. maxScore ≤ 100).
- CORS: allow configured `CORS_ORIGIN` (localhost in dev + production front origin).
- No auth in v1 (public write for wedding guests). Rate-limit lightly if host supports it; document as follow-up if not.

## Frontend UX

1. **Guest gate** — Before playing (games section / first game open): if no `guestId` in `localStorage`, show short form “Seu nome” → `POST /guests` → save `guestId` + `guestName`.
2. **Change name** — Small control to clear local guest and re-register.
3. **Games** — Existing Quiz and Bouquet behavior; keep local progress in `localStorage`.
4. **On finish** — `POST /results` with that play’s score. On network error: non-blocking message + retry; play remains usable.
5. **Leaderboard section** — Public section with two columns:
   - **Pontuação Quiz**
   - **Pontuação Buquê**  
   Positions 1, 2, 3… Guests missing a game omit from that list only. Refresh on section view / after returning from a game.

## Repo layout

```
/
  apps/
    web/                 # current Vite app moved here
    api/                 # Hono + Prisma
  package.json           # npm/pnpm workspaces
  docs/superpowers/specs/
```

Move existing root Vite app into `apps/web` without changing product behavior beyond the features above. Update Docker/nginx docs to mention API separately (or document dual deploy).

## Config

| Variable | App | Purpose |
|----------|-----|---------|
| `DATABASE_URL` | api | Postgres connection |
| `CORS_ORIGIN` | api | Allowed front origin(s) |
| `PORT` | api | Listen port (default 3001) |
| `VITE_API_URL` | web | API base URL |

## Deploy (suggested)

- **Web:** static host (Vercel/Netlify/current Docker+nginx).
- **API + Postgres:** Railway / Render / Fly (managed Postgres + Node service).

Exact provider can be chosen at implementation time; design only requires env-based config.

## Out of scope (v1)

- Login / admin panel
- Server-side Redis or CDN ranking cache
- Combined / summed global ranking
- Next.js migration
- Fullscreen / new-tab game changes beyond what already shipped
- Editing or deleting past results from the UI

## Success criteria

- Guest enters name once per browser; id persists in `localStorage`.
- Each finished Quiz or Bouquet play creates a `GameResult`.
- Public page shows two ranked lists by best score per guest per game.
- API and web run as separate apps in one monorepo.
- Case-study README can describe: Vite + Hono + Prisma + PostgreSQL + public leaderboard.

## Implementation notes (for planning)

- Prefer small modules: routes, prisma client, leaderboard query, zod (or similar) validation.
- Keep KISS: no job queue; ranking computed on read with SQL/`groupBy`.
- Preserve current mobile bouquet fullscreen behavior; only add guest gate + submit + ranking UI.
