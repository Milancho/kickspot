# KickSpot — Architecture

## Folder Name: `kickspot`

---

## Guiding Principle

React PWA on Firebase. No custom backend.
Claude API powers AI features directly from the browser.
Simple, ships fast, scales later.

---

## Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 + Vite | Fast build, simple PWA setup |
| Language | JavaScript (ES6+) | No TypeScript complexity for v1 |
| Database | Firebase Firestore | Real-time, free tier, no backend |
| Hosting | Firebase Hosting | One command deploy |
| PWA | vite-plugin-pwa | Auto service worker, installable |
| Styling | Custom CSS | Full control, no framework dependency |
| AI | Claude API (`claude-opus-4-8`) | Team names, formations, commentary |
| Admin Auth | 4-digit PIN vs Firestore | No Firebase Auth needed in v1 |
| Location Share | Web Share API | Built into mobile browsers |

---

## Folder Structure

```
kickspot/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                     ← React entry point
    ├── App.jsx                      ← Router + navigation
    ├── index.css                    ← Global styles + CSS variables
    ├── firebase/
    │   ├── config.js                ← Firebase connection config
    │   └── service.js               ← ALL Firestore CRUD functions
    ├── claude/
    │   └── aiService.js             ← ALL Claude API calls
    ├── context/
    │   └── AdminContext.jsx         ← adminMode state across app
    ├── utils/
    │   └── statsCalculator.js       ← recalculateStats — pure JS
    └── pages/
        ├── Standings.jsx            ← Home — player + team leaderboards
        ├── Players.jsx              ← View players, join
        ├── Availability.jsx         ← Mark in/out per date
        ├── Teams.jsx                ← Form and view teams
        ├── Matches.jsx              ← Add and view match results
        ├── Reports.jsx              ← Weekly / monthly / yearly
        └── AdminMenu.jsx            ← PIN entry + admin management
```

---

## Claude AI Integration

All Claude API calls live in `src/claude/aiService.js`.
Called directly from the browser using `fetch`.
The API key is stored in a `.env` file — never committed to git.

```
src/claude/aiService.js
```

### Three Functions

```js
// 1. Suggest team names based on player names
async function suggestTeamNames(playerNames)

// 2. Suggest balanced team splits based on player stats
async function suggestBalancedTeams(availablePlayers)

// 3. Generate match commentary after a result is saved
async function generateMatchCommentary(team1, team2, score1, score2, players)
```

### API Call Pattern

```js
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": import.meta.env.VITE_CLAUDE_API_KEY,
    "anthropic-version": "2023-06-01"
  },
  body: JSON.stringify({
    model: "claude-opus-4-8",
    max_tokens: 300,
    messages: [{ role: "user", content: YOUR_PROMPT }]
  })
});
```

### Environment Variables (.env)

```
VITE_CLAUDE_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id
```

**Never commit `.env` to git. Add it to `.gitignore`.**

---

## Admin Mode — How It Works

```
App loads → adminMode = false (player mode, default)
      ↓
User taps Settings icon → PIN entry dialog
      ↓
PIN checked against Firestore /config/admins
      ↓
Match → adminMode = true in React Context
No match → show error
      ↓
Edit/delete buttons appear across all pages
adminMode resets on page refresh or close
```

`adminMode` is a boolean in `AdminContext`.
Every page reads it to conditionally render edit/delete controls.

---

## Firestore Structure

```
/config/
  admins     { list: [{name: "Marko", pin: "1234"}, ...] }
  venue      { name: "Hrom", address: "...", lat: 0.0, lng: 0.0 }

/players/{playerId}
  name            string
  nickname        string
  wins            number
  losses          number
  isDeleted       boolean
  createdAt       timestamp

/teams/{teamId}
  name            string       auto from player first names, e.g. "Marko & Ana"
  nickname        string       optional, shown instead of name when set
  date            string       "YYYY-MM-DD"
  playerIds       array
  playerNames     array
  wins            number
  losses          number

/matches/{matchId}
  date            string
  team1Id         string
  team2Id         string
  team1Name       string
  team2Name       string
  team1Players    array
  team2Players    array
  score1          number
  score2          number
  createdAt       timestamp
  updatedAt       timestamp

/availability/{availabilityId}
  date            string
  playerId        string
  playerName      string
  isAvailable     boolean
  updatedAt       timestamp
```

---

## Stats Calculation

Set-by-set: each recorded result is a single set/game, first team to **21
wins** it (1:0 outcome, no draws). No best-of-3 — every set counts on its own;
standings count sets won. `score1`/`score2` (rally points, e.g. 21:15) decide
the winner and are shown on the match, but cumulative point totals are not
tracked on players/teams. Every player on the winning team gets +1 win. Teams
are 2v2 (min 2, max 4 players).

```
Win  = 1 point
Loss = 0 points

Sort: points → fewer losses → name
```

`recalculateStats()` runs after every match save, edit, or delete.
Reads ALL matches → rebuilds all stats from scratch → writes back to Firestore.
Fine for 15 players. Optimize at scale.

---

## Data Flow

```
User saves a match
      ↓
Matches.jsx calls service.js → saveMatch()
      ↓
saveMatch() writes to Firestore
      ↓
statsCalculator.js reads all matches → rewrites team + player stats
      ↓
aiService.js calls Claude API → returns commentary
      ↓
Commentary shown as modal/toast
      ↓
onSnapshot listener detects Firestore change → UI updates automatically
```

---

## Packages (package.json)

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "firebase": "^10"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "vite-plugin-pwa": "^0.19"
  }
}
```

No UI library. No extra AI SDK — direct `fetch` to Claude API is enough.

---

## Build & Deploy

```bash
# Install
npm install

# Local dev
npm run dev

# Build
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

Live at: `https://kickspot.web.app`

---

## Build Order

```
Week 1 — React basics
  → Build all pages with fake hardcoded data
  → Learn components, useState, props, routing

Week 2 — Firebase reads
  → Connect Firestore, replace fake data with real streams
  → Learn useEffect, onSnapshot

Week 3 — Firebase writes
  → Add player form, availability toggles
  → Learn form handling, Firestore writes

Week 4 — Admin PIN
  → AdminContext, PIN entry, conditional UI

Week 5 — Teams + Matches
  → Team formation, match scoring
  → recalculateStats()

Week 6 — Claude AI
  → aiService.js — team names, balanced teams, commentary
  → Learn fetch + async/await with the Claude API

Week 7 — Reports + Location share
  → Date range filters, weekly/monthly/yearly views
  → Web Share API for location

Week 8 — PWA + Deploy
  → vite-plugin-pwa config
  → Firebase Hosting deploy
  → Test install on real phone
```

---

## When to Add Complexity

| When you feel this pain | Add this |
|---|---|
| One group is not enough | Multi-tenant: wrap everything under a `venueId` |
| PIN feels too weak | Firebase Auth |
| AI responses are slow | Show loading spinner, cache common responses |
| Stats recalculation is slow | Denormalized summary docs, recalc on server |

---

*KickSpot v1 — React PWA + Claude AI*
