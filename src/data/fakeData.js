/* Hardcoded sample data for Phase 1. These let the whole app be navigable
 * before Firebase is wired up. Players/Standings fall back to these when
 * Firebase is not configured; the other pages use them directly for now.
 *
 * Scoring is set-by-set: each result is a single set, first to 21 wins (no
 * best-of-3). The match stores its rally points (e.g. 21:15) so the winner is
 * known, but standings only track sets won/lost — no cumulative point totals. */

export const FAKE_PLAYERS = [
  { id: "p1", name: "Marko", nickname: "The Wall", wins: 8, losses: 5, isDeleted: false },
  { id: "p2", name: "Stefan", nickname: "Rocket", wins: 11, losses: 2, isDeleted: false },
  { id: "p3", name: "Ana", nickname: "Sniper", wins: 7, losses: 6, isDeleted: false },
  { id: "p4", name: "Luka", nickname: "", wins: 5, losses: 8, isDeleted: false },
  { id: "p5", name: "Nikola", nickname: "Tank", wins: 4, losses: 9, isDeleted: false },
  // A second "Marko" — same name, different person. Identity is by ID, and the
  // UI disambiguates by nickname ("Marko (Lefty)").
  { id: "p6", name: "Marko", nickname: "Lefty", wins: 3, losses: 4, isDeleted: false },
];

/* The two matches below produce these team records:
 *   Street Kings:  won m1 (21:15), lost m2 (18:21)  → 1W 1L
 *   Concrete Crew: lost m1 (15:21), won m2 (21:18)  → 1W 1L */
export const FAKE_TEAMS = [
  {
    id: "t1",
    name: "Marko & Ana",
    nickname: "Street Kings",
    date: "2026-05-29",
    playerIds: ["p1", "p3"],
    playerNames: ["Marko", "Ana"],
    wins: 1,
    losses: 1,
  },
  {
    id: "t2",
    name: "Stefan & Nikola",
    nickname: "Concrete Crew",
    date: "2026-05-29",
    playerIds: ["p2", "p5"],
    playerNames: ["Stefan", "Nikola"],
    wins: 1,
    losses: 1,
  },
  {
    // A team formed at a previous session — forming Luka + Nikola again
    // (in any order) should reuse this team, not create a new one.
    id: "t3",
    name: "Luka & Nikola",
    nickname: "The Outsiders",
    date: "2026-05-22",
    playerIds: ["p4", "p5"],
    playerNames: ["Luka", "Nikola"],
    wins: 0,
    losses: 0,
  },
];

export const FAKE_MATCHES = [
  {
    id: "m1",
    date: "2026-05-29",
    team1Name: "Street Kings",
    team2Name: "Concrete Crew",
    team1Players: ["Marko", "Ana"],
    team2Players: ["Stefan", "Nikola"],
    score1: 21,
    score2: 15,
  },
  {
    id: "m2",
    date: "2026-05-29",
    team1Name: "Concrete Crew",
    team2Name: "Street Kings",
    team1Players: ["Stefan", "Nikola"],
    team2Players: ["Marko", "Ana"],
    score1: 21,
    score2: 18,
  },
];
