# KickSpot — User Stories

## Role Summary
- **Player** — no PIN. View, add themselves, mark availability, form teams, add matches.
- **Admin** — 4-digit PIN. Everything above + edit, delete, manage admins, share location.

---

## Epic 1 — Admin Access

### US-001 — First Launch PIN Setup
**As the first person to open the app**, I want to set a 4-digit PIN so the app is protected.

**Acceptance Criteria:**
- On first launch, app detects no PIN exists in Firestore
- Prompts to enter a name and set a 4-digit PIN
- PIN saved to `/config/admins` in Firestore
- Admin mode activates for that session

---

### US-002 — Enter Admin Mode
**As an Admin**, I want to enter my PIN to unlock edit and delete features.

**Acceptance Criteria:**
- Settings icon opens PIN entry dialog
- Correct PIN sets `adminMode = true` in React Context (memory only)
- Admin mode resets on page refresh or close
- Wrong PIN shows error — no lockout in v1

---

### US-003 — Manage Admins
**As an Admin**, I want to add or remove other admins so others can manage the group.

**Acceptance Criteria:**
- Admin sees list of current admins (names only, PINs hidden)
- Can add new admin: enter name + 4-digit PIN
- Can delete any admin except themselves
- Saved to Firestore `/config/admins`
- PIN required

---

## Epic 2 — Player Management

### US-004 — Player Adds Themselves
**As a Player**, I want to add my name so I appear in standings and the availability pool.

**Acceptance Criteria:**
- Any user taps "Join" and enters name (optional nickname)
- Saved to Firestore immediately
- No PIN required

---

### US-005 — Admin Adds a Player
**As an Admin**, I want to manually add a player to pre-register regulars.

**Acceptance Criteria:**
- Admin enters name and optional nickname
- PIN required

---

### US-006 — Admin Edits a Player
**As an Admin**, I want to edit a player's name or nickname.

**Acceptance Criteria:**
- Edit icon visible only in admin mode
- Changes reflect everywhere immediately
- PIN required

---

### US-007 — Admin Deletes a Player
**As an Admin**, I want to delete inactive players.

**Acceptance Criteria:**
- Delete icon visible only in admin mode
- Confirmation dialog required
- Soft delete (`isDeleted: true`) — historical data preserved
- PIN required

---

## Epic 3 — Availability Pool

### US-008 — Mark Availability
**As a Player**, I want to mark myself available or unavailable for a session.

**Acceptance Criteria:**
- Date selector (default: today)
- Player taps their name to toggle "I'm in" / "I'm out"
- Admin sees live count and full list per date
- No PIN required

---

### US-009 — Admin Overrides Availability
**As an Admin**, I want to toggle any player's availability to fix mistakes.

**Acceptance Criteria:**
- In admin mode all toggles are editable for any date
- PIN required

---

## Epic 4 — Team Formation

### US-010 — Anyone Forms a Team
**As a Player or Admin**, I want to create a team from available players.

**Acceptance Criteria:**
- Any user taps "Create Team" for a date
- Selects players from available list
- Team name auto-fills from the players' first names joined with "&"
  (e.g. "Marko & Ana"); editable, or use AI suggestion (see US-021)
- Optional nickname (e.g. "Street Kings"); shown instead of the name when set
- A team is identified by its player IDs (order-independent, not by name):
  forming the same set again reuses the existing team instead of duplicating.
  Same-name players are disambiguated by nickname (e.g. "Marko (Lefty)")
- Players in another team that day are greyed out
- 2 players per team by default (2v2); 3 or 4 allowed. Min 2, max 4.
- No PIN required

---

### US-011 — Admin Edits a Team
**As an Admin**, I want to edit a team's name or player list.

**Acceptance Criteria:**
- Edit visible only in admin mode
- Triggers stats recalculation
- PIN required

---

### US-012 — Admin Deletes a Team
**As an Admin**, I want to delete a team.

**Acceptance Criteria:**
- Delete visible only in admin mode
- Warning shown if matches exist for that team
- Triggers stats recalculation
- PIN required

---

### US-013 — Admin Copies Teams from Previous Day
**As an Admin**, I want to copy last session's teams so I don't rebuild from scratch.

**Acceptance Criteria:**
- Admin picks a past date to copy from
- Team names and players copied to the new date
- Stats reset to zero
- PIN required

---

## Epic 5 — Match Scoring

### US-014 — Anyone Adds a Match Result
**As a Player or Admin**, I want to record a match score so standings update.

**Acceptance Criteria:**
- Any user picks two teams from that day, enters the set score (rally points,
  e.g. 21:15) — first team to 21 wins; each set is its own result (no best-of-3)
- Scores cannot be equal; one team must win the set (no draws)
- The winning team's players each gain a win; the losers each gain a loss
- Save triggers `recalculateStats()`
- After saving, Claude generates a short match commentary (see US-023)
- No PIN required

---

### US-015 — Admin Edits a Match Score
**As an Admin**, I want to correct a wrong score.

**Acceptance Criteria:**
- Edit visible only in admin mode
- Triggers full stats recalculation
- PIN required

---

### US-016 — Admin Deletes a Match
**As an Admin**, I want to delete an incorrectly entered match.

**Acceptance Criteria:**
- Delete visible only in admin mode
- Confirmation required
- Triggers full stats recalculation
- PIN required

---

## Epic 6 — Standings & Reports

### US-017 — Player Leaderboard
**As anyone**, I want to see player standings.

**Acceptance Criteria:**
- Columns: rank, name, played, W/L, points
- Sort: points → fewer losses → name
- Filter: all-time / this week / this month / this year
- No PIN required

---

### US-018 — Team Leaderboard
**As anyone**, I want to see team standings for a given day.

**Acceptance Criteria:**
- Date selector
- Same columns and sort logic as player standings
- No PIN required

---

### US-019 — Weekly Report
**As anyone**, I want a weekly summary of the past 7 days.

**Acceptance Criteria:**
- Total matches played
- Top player and top team of the week

---

### US-020 — Monthly & Yearly Report
**As anyone**, I want monthly and yearly summaries.

**Acceptance Criteria:**
- Month/year selector
- Aggregated stats for all players and teams
- Champion player and team highlighted on yearly view

---

## Epic 7 — Claude AI Features

### US-021 — AI Team Name Generator
**As a Player forming a team**, I want Claude to suggest creative team names.

**Acceptance Criteria:**
- "Suggest name" button on the create team form
- Sends player names on the team to Claude API
- Claude returns 3 creative name suggestions
- Player picks one or ignores and types manually
- No PIN required

---

### US-022 — AI Balanced Team Suggester
**As an Admin**, I want Claude to suggest balanced team splits from available players.

**Acceptance Criteria:**
- "Suggest teams" button on the teams screen (admin mode only)
- Sends available players + their win rates to Claude API
- Claude suggests a balanced split into 2 (or more) teams
- Admin can accept the suggestion or adjust manually
- PIN required

---

### US-023 — AI Match Commentary
**As anyone**, I want a fun AI-generated summary after a match is saved.

**Acceptance Criteria:**
- Triggers automatically after any match result is saved
- Sends team names, player names, and score to Claude API
- Claude returns a short (2-3 sentence) fun commentary
- Displayed as a toast or modal after save
- No PIN required

---

## Epic 8 — Location Sharing

### US-024 — Admin Shares Venue Location
**As an Admin**, I want to send players the venue location with one tap.

**Acceptance Criteria:**
- Generates: "We're playing at [Venue Name]. Navigate here: [Google Maps link]"
- Opens native Web Share API (WhatsApp, SMS, etc.)
- PIN required

---

*KickSpot v1 — React PWA + Claude AI*
