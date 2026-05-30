# KickSpot

PWA for managing **footvolley** sessions — the sand-court sport that mixes
football and volleyball (2v2 over a net, feet only, set-by-set scoring to 21).
One group of players. Built with React + Vite, Firebase, and Claude AI.
Installs on a phone straight from the browser — no App Store.

> *Find your game. Play your way.*

---

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server → http://localhost:5173/
npm run build    # production build into dist/
npm run preview  # serve the built bundle (test the PWA)
npm test         # run unit tests (statsCalculator)
```

### Demo mode vs live data

With no `.env`, the app runs in **demo mode** — sample players/teams/matches
with a yellow notice on the Standings page. To use live Firebase data:

```bash
cp .env.example .env   # fill in Firebase + Claude + reCAPTCHA keys
npm run dev            # switches to live Firestore automatically
```

---

## How scoring works

- A match is one **set** — first to **21 points wins** (no best-of-3, no draws).
- The rally score (e.g. `21:15`) is stored and displayed; the outcome is **1:0**.
- Every player on the winning team gets **+1 point**. Standings rank by **points → fewer losses**.
- Teams are **2v2** (min 2, max 4 players), identified by **player IDs** — so same players = same team in any order, and two players with the same name never collide.

---

## App structure

| Page | What it does |
|---|---|
| **Standings** | Player & team leaderboard with week/month/year/all-time filter |
| **Players** | Join, view, edit (admin), soft-delete (admin) |
| **Availability** | Mark in/out per session date |
| **Teams** | Form teams from available players, auto-name, nickname, reuse across dates |
| **Matches** | Record set results, auto stats recalc, AI match commentary |
| **Reports** | Weekly/monthly/yearly: sets played, top player, top team |
| **Admin** | PIN unlock, admin management, venue share, Ko-fi support card |

---

## Security

| Layer | What it does |
|---|---|
| **PIN hashing** | SHA-256 — plain PINs never stored in Firestore |
| **App Check** | reCAPTCHA v3 blocks scripts from flooding the DB (activate via `VITE_RECAPTCHA_SITE_KEY` + Firebase console) |
| **Firestore rules** | Validate document shape — set in Firebase console before going live |

---

## Status — all application code complete ✅

Everything is built and tested locally (Phases 0–10). **Remaining steps are Firebase setup and deploy** — see [docs/TASKS.md](docs/TASKS.md) for the step-by-step checklist.

`npm test` — 7 passing · `npm run build` — clean · zero console errors

---

## Docs

- [Product Vision](docs/PRODUCT_VISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [User Stories](docs/USER_STORIES.md)
- [Tasks & deploy checklist](docs/TASKS.md)
- [CLAUDE.md](CLAUDE.md) — project rules & conventions (read before coding)
