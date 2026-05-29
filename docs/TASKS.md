# KickSpot — Development Tasks

## How to Read This
- Build top to bottom — each phase depends on the previous
- **S** = few hours, **M** = 1 day, **L** = 2-3 days
- Don't move to the next task until the current one works and you understand it

---

## Phase 0 — Project Setup

| ID | Task | Effort |
|---|---|---|
| T-001 | Install Node.js, create React app: `npm create vite@latest kickspot -- --template react` | S |
| T-002 | Install dependencies: `npm install firebase react-router-dom` | S |
| T-003 | Create Firebase project, enable Firestore (test mode), add web app | S |
| T-004 | Create `.env` file with Firebase + Claude API keys | S |
| T-005 | Set up folder structure: `pages/`, `firebase/`, `claude/`, `context/`, `utils/` | S |
| T-006 | Set up React Router in `App.jsx` — 6 routes (Standings, Players, Availability, Teams, Matches, Reports) | M |
| T-007 | Build bottom navigation bar component — shared across all pages | S |
| T-008 | Install `vite-plugin-pwa`, add basic PWA manifest (name, icons, theme color) | S |

---

## Phase 1 — UI With Fake Data

**Goal: the whole app is navigable with fake hardcoded data before touching Firebase.**

| ID | Task | Effort |
|---|---|---|
| T-101 | `Standings.jsx` — player leaderboard table with 5 fake players | M |
| T-102 | Add team standings tab with date picker | S |
| T-103 | `Players.jsx` — list of fake players | S |
| T-104 | `Availability.jsx` — list of fake players with in/out toggle (local state only) | S |
| T-105 | `Teams.jsx` — list of fake teams for a date | S |
| T-106 | `Matches.jsx` — list of fake matches for a date | S |
| T-107 | `Reports.jsx` — placeholder weekly/monthly/yearly tabs | S |

---

## Phase 2 — Firebase Reads

| ID | Task | Effort |
|---|---|---|
| T-201 | Write `Player` model — JS class with `fromFirestore()` and `toFirestore()` | S |
| T-202 | Add `getPlayers()` real-time listener to `service.js` | S |
| T-203 | Manually add 3-4 test players in Firebase Console | S |
| T-204 | Replace fake players in `Players.jsx` with real Firestore data | M |
| T-205 | Replace fake standings in `Standings.jsx` with real player data | S |

---

## Phase 3 — Firebase Writes (Players)

| ID | Task | Effort |
|---|---|---|
| T-301 | Build "Join" form — name + nickname input, modal or bottom sheet | M |
| T-302 | Add `addPlayer()` to `service.js` | S |
| T-303 | Wire form submit to `addPlayer()` | S |
| T-304 | Admin-only: edit player inline (visible only when `adminMode = true`) | S |
| T-305 | Admin-only: delete player with confirmation (soft delete) | S |

---

## Phase 4 — Admin PIN

| ID | Task | Effort |
|---|---|---|
| T-401 | Manually create `/config/admins` document in Firebase Console: `{ list: [{name: "You", pin: "1234"}] }` | S |
| T-402 | Create `AdminContext.jsx` — provides `adminMode` boolean + `setAdminMode` to all components | M |
| T-403 | Build PIN entry dialog — 4 digit inputs | M |
| T-404 | Add `checkPin(pin)` to `service.js` — reads `/config/admins`, returns matching admin or null | S |
| T-405 | Wire PIN dialog to `checkPin()` — on match set `adminMode = true` | S |
| T-406 | Add Settings icon to navigation — opens PIN dialog | S |
| T-407 | Show/hide edit + delete buttons across all pages based on `adminMode` | S |
| T-408 | Build admin management screen — list admins, add admin, delete admin | M |
| T-409 | Add `addAdmin()` and `deleteAdmin()` to `service.js` | S |

---

## Phase 5 — Availability

| ID | Task | Effort |
|---|---|---|
| T-501 | Write `Availability` model | S |
| T-502 | Add `getAvailability(date)` real-time listener to `service.js` | S |
| T-503 | Add `setAvailability(playerId, date, isAvailable)` upsert to `service.js` | S |
| T-504 | Replace fake toggles in `Availability.jsx` with real Firestore data | M |
| T-505 | Show available player count on `Teams.jsx` header | S |

---

## Phase 6 — Teams

| ID | Task | Effort |
|---|---|---|
| T-601 | Write `Team` model | S |
| T-602 | Add `getTeams(date)` real-time listener to `service.js` | S |
| T-603 | Build create team form — multi-select players (2–4), auto-name from first names (editable), optional nickname | L |
| T-604 | Grey out players already assigned to a team on the same date | M |
| T-605 | Add `createTeam()` to `service.js` | S |
| T-606 | Admin-only: edit team name + players | M |
| T-607 | Admin-only: delete team with warning if matches exist | S |
| T-608 | Admin-only: copy teams from previous date | M |

---

## Phase 7 — Matches & Stats (Most Important Phase)

| ID | Task | Effort |
|---|---|---|
| T-701 | Write `MatchResult` model | S |
| T-702 | Add `getMatches(date)` real-time listener to `service.js` | S |
| T-703 | Build add match form — pick Team 1 vs Team 2, enter set score (first to 21; scores can't tie) | M |
| T-704 | Add `saveMatch()` to `service.js` | S |
| T-705 | Write `recalculateTeamStats(date)` in `statsCalculator.js` | L |
| T-706 | Write `recalculatePlayerStats()` in `statsCalculator.js` | L |
| T-707 | Call both recalculate functions in `saveMatch()`, `updateMatch()`, `deleteMatch()` | S |
| T-708 | Admin-only: edit match score form | S |
| T-709 | Admin-only: delete match with confirmation | S |
| T-710 | Write unit tests for `statsCalculator.js` — test wins, losses, edge cases | M |

**Do not skip T-710. Stats bugs are silent and hard to find later.**

---

## Phase 8 — Claude AI Features

| ID | Task | Effort |
|---|---|---|
| T-801 | Create `src/claude/aiService.js` with base fetch function | S |
| T-802 | Write `suggestTeamNames(playerNames)` — prompt Claude, return 3 name suggestions | M |
| T-803 | Add "Suggest name" button to create team form — show 3 suggestions, player picks one | M |
| T-804 | Write `suggestBalancedTeams(players)` — send player stats, Claude returns balanced split | M |
| T-805 | Admin-only: "Suggest teams" button on Teams page — show Claude's suggestion, admin accepts or adjusts | M |
| T-806 | Write `generateMatchCommentary(team1, team2, score1, score2, players)` | M |
| T-807 | Show commentary as modal after match is saved — loading state while Claude responds | M |

### Example Prompts for aiService.js

```js
// suggestTeamNames
`You are naming a footvolley team. 
The players are: ${playerNames.join(", ")}.
Suggest 3 short, creative, fun team names. 
Return only a JSON array of 3 strings. No explanation.`

// suggestBalancedTeams
`You are balancing footvolley teams.
Available players and their win rates: ${JSON.stringify(playerStats)}.
Split them into 2 balanced teams.
Return only a JSON object: { team1: [...names], team2: [...names] }. No explanation.`

// generateMatchCommentary
`Write a 2-sentence fun commentary for this footvolley match:
${team1Name} ${score1} - ${score2} ${team2Name}
Players: ${team1Name}: ${team1Players.join(", ")} | ${team2Name}: ${team2Players.join(", ")}
Keep it short, energetic, and funny.`
```

---

## Phase 9 — Reports & Location

| ID | Task | Effort |
|---|---|---|
| T-901 | Add date range filter to `Standings.jsx` — week/month/year/all-time | M |
| T-902 | Build weekly report view — matches this week, top player, top team | M |
| T-903 | Build monthly report view — aggregated stats per month | M |
| T-904 | Build yearly report — full season, champion player and team | M |
| T-905 | Manually add venue to `/config/venue` in Firebase Console | S |
| T-906 | Admin-only: share location button — generates Maps link + opens Web Share API | M |

---

## Phase 10 — Polish & Deploy

| ID | Task | Effort |
|---|---|---|
| T-1001 | Loading spinner on all async operations | S |
| T-1002 | Empty state messages on all lists ("No players yet", "No matches today") | S |
| T-1003 | Error handling — network failures, Firestore errors | M |
| T-1004 | App icon + PWA manifest icons (512x512, 192x192) | S |
| T-1005 | Test "Add to Home Screen" on real Android phone (Chrome) | S |
| T-1006 | Test on iOS Safari | S |
| T-1007 | Run `npm run build` — fix any build errors | S |
| T-1008 | `firebase init` → select Hosting → set `dist` as public folder | S |
| T-1009 | `firebase deploy` — app is live | S |

---

## recalculateStats — Reference Logic

```js
// statsCalculator.js

export async function recalculateTeamStats(date, db) {
  // 1. Get all matches for this date
  // 2. For each team that day: count sets won / lost (W/L)
  // 3. Write updated stats back to each team document
}

export async function recalculatePlayerStats(db) {
  // 1. Get ALL matches across all dates
  // 2. For each player: count sets won / lost (W/L) across all matches
  // 3. Write updated stats back to each player document
}

// Points: Win=1, Loss=0  (footvolley sets always have a winner — no draws)
// Sort:   points → fewer losses → name
```

---

*KickSpot v1 — Development Tasks*
