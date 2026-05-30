# KickSpot

PWA for managing **footvolley** sessions — the sand-court sport that mixes
football and volleyball (2v2 over a net, feet only, volleyball-style set
scoring). One group of players. Built with React + Vite, Firebase, and Claude AI.
Installs on a phone straight from the browser — no App Store.

> *Find your game. Play your way.*

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server → http://localhost:5173/
npm run build    # production build into dist/
npm run preview  # serve the built bundle (test the PWA)
```

Open the printed URL (default http://localhost:5173/). The app hot-reloads on edit.

### Demo mode vs live data

With no `.env`, the app runs in **demo mode** — sample players/teams/matches,
with a yellow notice on the Standings page. To use live data:

```bash
cp .env.example .env   # then fill in your keys
```

Set the Firebase keys (`VITE_FIREBASE_PROJECT_ID` is what switches off demo
mode) and the Claude key (`VITE_CLAUDE_API_KEY`) for AI features. Restart the
dev server — Standings and Players switch to live Firestore automatically.

## How scoring works

- A match is a **single set** — first team to **21 points wins** (no best-of-3).
- The set score (e.g. `21:15`) is stored; the outcome is **1:0**, no draws.
- Each player on the **winning team gets +1 point**. Standings rank by
  **points → fewer losses**.
- Teams are **2v2** (2–4 players). A team is identified by its **player IDs**,
  so the same players are one team in any order, and two players named "Marko"
  never collide. Same-name players are disambiguated by nickname.

## Status

All application code (Phases 0–10) is implemented and runs end-to-end:
players (join / edit / soft-delete), admin PIN + first-launch setup,
per-date availability, team formation (auto-naming, nickname, order-independent
reuse by player ID), match recording with live stats recalculation, Claude AI
features (team names, balanced split, commentary — with offline fallbacks),
date-range standings, reports, and venue sharing. Unit tests cover the stats
calculator (`npm test`).

Architecture: all data access goes through `service.js` → `backend.js`, which
routes to **Firestore** (when `.env` keys exist) or an **in-memory demo store**
otherwise — so the app is fully usable locally now and goes live with no code
changes. **Still to do (human-owned):** create the Firebase project, hosting,
CI/CD, and seed real data. See [docs/TASKS.md](docs/TASKS.md).

## Docs

- [Product Vision](docs/PRODUCT_VISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [User Stories](docs/USER_STORIES.md)
- [Tasks](docs/TASKS.md)
- [CLAUDE.md](CLAUDE.md) — project rules & conventions
