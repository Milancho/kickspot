# CLAUDE.md — KickSpot

This file tells Claude everything it needs to know about this project.
Read this before writing any code.

---

## What Is This App

KickSpot is a Progressive Web App (PWA) for managing **footvolley** sessions —
the sand-court sport that mixes football and volleyball (2v2 over a net, feet
only, volleyball-style set scoring). One group of players. Hosted on Firebase.
Installs on mobile from the browser — no App Store.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Language | JavaScript (ES6+) — no TypeScript |
| Database | Firebase Firestore |
| Hosting | Firebase Hosting |
| PWA | vite-plugin-pwa |
| Styling | Custom CSS — no UI framework, no Tailwind |
| AI | Claude API — model `claude-opus` |
| Admin Auth | 4-digit PIN checked against Firestore — no Firebase Auth |

---

## Folder Structure

```
kickspot/
├── index.html
├── vite.config.js
├── package.json
├── .env                          ← API keys — never commit this
├── CLAUDE.md
├── README.md
├── docs/
└── src/
    ├── main.jsx
    ├── App.jsx                   ← Router + navigation
    ├── index.css                 ← Global styles + CSS variables
    ├── firebase/
    │   ├── config.js             ← Firebase init
    │   └── service.js            ← ALL Firestore CRUD — no Firestore calls outside this file
    ├── claude/
    │   └── aiService.js          ← ALL Claude API calls — no fetch to Claude outside this file
    ├── context/
    │   └── AdminContext.jsx      ← adminMode boolean shared across app
    ├── utils/
    │   └── statsCalculator.js    ← recalculateStats — pure JS, no Firebase imports
    └── pages/
        ├── Standings.jsx
        ├── Players.jsx
        ├── Availability.jsx
        ├── Teams.jsx
        ├── Matches.jsx
        ├── Reports.jsx
        └── AdminMenu.jsx
```

---

## Roles & Permissions

Two roles. No login. Admin is unlocked by 4-digit PIN.

| Action | Player (no PIN) | Admin (PIN required) |
|---|---|---|
| View standings, teams, matches | ✅ | ✅ |
| Add themselves as player | ✅ | ✅ |
| Mark availability | ✅ | ✅ |
| Form a team | ✅ | ✅ |
| Add a match result | ✅ | ✅ |
| Edit / delete player | ❌ | ✅ |
| Edit / delete team | ❌ | ✅ |
| Edit / delete match | ❌ | ✅ |
| Manage admins | ❌ | ✅ |
| Share venue location | ❌ | ✅ |

`adminMode` is a boolean in `AdminContext`. It lives in memory only — resets on page refresh.
Edit and delete buttons are conditionally rendered based on `adminMode`.

---

## Firestore Structure

```
/config/admins     { list: [{name: string, pin: string}] }  ← pin = SHA-256 hash, never plain text
/config/venue      { name: string, address: string, lat: number, lng: number }

/players/{id}      { name, nickname, wins, losses, isDeleted, createdAt }
/teams/{id}        { name, nickname, date, playerIds[], playerNames[], wins, losses }
/matches/{id}      { date, team1Id, team2Id, team1Name, team2Name, team1PlayerIds[], team2PlayerIds[], team1Players[], team2Players[], score1, score2, createdAt, updatedAt }
/availability/{id} { date, playerId, playerName, isAvailable, updatedAt }
```

Date format is always `"YYYY-MM-DD"` string. Never use Date objects as Firestore keys.

---

## Game & Stats Rules

Scoring is **set-by-set**, not goal-based:

- Each recorded result is a **single set/game** — first team to **21 points
  wins**. There is **no best-of-3 match**: every set is recorded on its own
  and counts on its own. Standings count sets won.
- `score1` / `score2` on the match store the rally points, e.g. `21:15`,
  `18:21` — used to decide the winner and for display. Cumulative point totals
  are **not** tracked on players/teams (no `goalsFor`/`goalsAgainst`).
- The outcome is **1:0** — the winning team takes the set. There are
  **no draws**; a set always has a winner (no `draws` field anywhere).
- Every player on the **winning team gets +1 win (1 point)**; every player on
  the losing team gets a loss. Points are team-based, not per individual score.
- Teams are **2v2** by default but may have **3 or 4** players (min 2, max 4).
- A team's **name** defaults to its players' first names joined with `&`
  (e.g. "Marko & Ana", "Marko, Ana & Luka") — editable on the create form. A
  team may also have an optional **nickname** (e.g. "Street Kings"); when set,
  the nickname is what's displayed. Naming helpers live in
  `src/utils/teamName.js`.
- A team is identified by its **set of player IDs, order-independent** — never
  by names. Names can repeat (two players called "Marko"); IDs are unique, so
  the same players are the same team in any order and two different "Marko"s
  never collide. Forming a player set that already has a team **reuses** it
  (keeping its name + nickname) rather than duplicating. See
  `findTeamByPlayers` / `playerSetKey`.
- Same-name players are disambiguated in the UI by nickname — `playerLabel`
  shows "Marko (Lefty)" when another "Marko" exists, else just "Marko".

```
Win  = 1 point
Loss = 0 points

Sort order: points → fewer losses → name
```

Game-rule constants live in `src/constants.js` (`WIN_TARGET`, `POINTS`,
`TEAM_MIN_PLAYERS`, `TEAM_MAX_PLAYERS`) — the single source of truth.

`recalculateStats()` runs after every match save, edit, or delete.
It reads ALL matches and rewrites ALL team and player stats from scratch.
This prevents drift. Do not change this logic without fully understanding it.

---

## Claude AI Features

All Claude API calls go through `src/claude/aiService.js`.
Use model `claude-opus-4-8`. Max tokens 300 — responses must be short.
API key is in `.env` as `VITE_CLAUDE_API_KEY`.

Three functions:

```js
suggestTeamNames(playerNames)
// Returns 3 creative team name suggestions based on player names
// Response format: JSON array of 3 strings

suggestBalancedTeams(players)
// players = [{ name, wins, losses }]
// Returns balanced split into 2 teams
// Response format: { team1: [names], team2: [names] }

generateMatchCommentary(team1Name, team2Name, score1, score2, team1Players, team2Players)
// Returns 2-sentence fun match summary
// Response format: plain text string
```

Always prompt Claude to return only JSON where JSON is expected — no markdown, no explanation.
Always wrap Claude API calls in try/catch — never let an AI failure break the app.
Show a loading state while waiting for Claude response.

---

## Code Rules

- No TypeScript — plain JavaScript only
- No UI component libraries — build all components from scratch
- No CSS frameworks — custom CSS only, use CSS variables for theming
- All Firestore calls go in `service.js` — never call Firestore directly from a page component
- All Claude API calls go in `aiService.js` — never call the Claude API directly from a page component
- Use `onSnapshot` for real-time listeners, not one-time `getDocs` calls
- Always handle loading and empty states on every page
- Soft delete players — set `isDeleted: true`, never hard delete
- Never commit `.env` to git

---

## Environment Variables

```
VITE_CLAUDE_API_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Security

| Layer | What it does |
|---|---|
| **PIN hashing** | `addAdmin` / `checkPin` always use `hashPin()` (SHA-256). Firestore never stores a plain PIN. |
| **App Check** | reCAPTCHA v3 token attached to every Firestore request. Blocks scripts / direct API calls. Activated by adding `VITE_RECAPTCHA_SITE_KEY` + enforcing in Firebase console. Skipped in local dev (no key in `.env`). |
| **Firestore rules** | Validate document shape. Without Firebase Auth, they can't enforce who writes — App Check handles that. |
| **Claude key exposure** | `VITE_CLAUDE_API_KEY` is visible in the browser bundle. Set a monthly spending cap in the Anthropic console. |

Admin mode resets on page refresh — the PIN gate is a UI convenience, not a cryptographic boundary. Its purpose is preventing casual accidents, not defending against a determined attacker.

---

## What Not To Change Without Reading First

- `statsCalculator.js` — easy to introduce silent stat bugs
- Date format — always `"YYYY-MM-DD"` string, used as Firestore query key
- Firestore collection names — changing them breaks existing data
- PIN check logic in `AdminContext` — security boundary

---

## Full Documentation

- [Product Vision](docs/PRODUCT_VISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [User Stories](docs/USER_STORIES.md)
- [Tasks](docs/TASKS.md)

---

*KickSpot v1 — React PWA + Claude AI*
