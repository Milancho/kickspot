/* Sample data used to seed the in-memory demo backend (when Firebase is not
 * configured) and as a read fallback. The demo store recomputes player/team
 * win-loss from the matches below on startup, so standings are always
 * consistent with the recorded matches.
 *
 * Scoring is set-by-set: each match is one set, first to 21 wins (no draws).
 * Matches store player IDs per side (team1PlayerIds / team2PlayerIds) so the
 * right people are credited even when two players share a name. */

export const FAKE_PLAYERS = [
  { id: "p1", name: "Marko", nickname: "The Wall", wins: 0, losses: 0, isDeleted: false, createdAt: "2026-04-01" },
  { id: "p2", name: "Stefan", nickname: "Rocket", wins: 0, losses: 0, isDeleted: false, createdAt: "2026-04-02" },
  { id: "p3", name: "Ana", nickname: "Sniper", wins: 0, losses: 0, isDeleted: false, createdAt: "2026-04-03" },
  { id: "p4", name: "Luka", nickname: "", wins: 0, losses: 0, isDeleted: false, createdAt: "2026-04-04" },
  { id: "p5", name: "Nikola", nickname: "Tank", wins: 0, losses: 0, isDeleted: false, createdAt: "2026-04-05" },
  // A second "Marko" — same name, different person. Identity is by ID; the UI
  // disambiguates by nickname ("Marko (Lefty)").
  { id: "p6", name: "Marko", nickname: "Lefty", wins: 0, losses: 0, isDeleted: false, createdAt: "2026-04-06" },
];

export const FAKE_TEAMS = [
  {
    id: "t1",
    name: "Marko & Ana",
    nickname: "Street Kings",
    createdAt: "2026-05-22",
    playerIds: ["p1", "p3"],
    playerNames: ["Marko (The Wall)", "Ana"],
    wins: 0,
    losses: 0,
  },
  {
    id: "t2",
    name: "Stefan & Nikola",
    nickname: "Concrete Crew",
    createdAt: "2026-05-22",
    playerIds: ["p2", "p5"],
    playerNames: ["Stefan", "Nikola"],
    wins: 0,
    losses: 0,
  },
  {
    id: "t3",
    name: "Luka & Nikola",
    nickname: "The Outsiders",
    createdAt: "2026-05-22",
    playerIds: ["p4", "p5"],
    playerNames: ["Luka", "Nikola"],
    wins: 0,
    losses: 0,
  },
  {
    id: "t4",
    name: "Stefan & Marko (Lefty)",
    nickname: "",
    createdAt: "2026-05-22",
    playerIds: ["p2", "p6"],
    playerNames: ["Stefan", "Marko (Lefty)"],
    wins: 0,
    losses: 0,
  },
];

export const FAKE_MATCHES = [
  {
    id: "m1",
    date: "2026-05-26",
    createdAt: "2026-05-26",
    team1Id: "t1",
    team2Id: "t2",
    team1Name: "Street Kings",
    team2Name: "Concrete Crew",
    team1PlayerIds: ["p1", "p3"],
    team2PlayerIds: ["p2", "p5"],
    team1Players: ["Marko (The Wall)", "Ana"],
    team2Players: ["Stefan", "Nikola"],
    score1: 21,
    score2: 15,
  },
  {
    id: "m2",
    date: "2026-05-26",
    createdAt: "2026-05-26",
    team1Id: "t2",
    team2Id: "t1",
    team1Name: "Concrete Crew",
    team2Name: "Street Kings",
    team1PlayerIds: ["p2", "p5"],
    team2PlayerIds: ["p1", "p3"],
    team1Players: ["Stefan", "Nikola"],
    team2Players: ["Marko (The Wall)", "Ana"],
    score1: 21,
    score2: 18,
  },
  {
    id: "m3",
    date: "2026-05-28",
    createdAt: "2026-05-28",
    team1Id: "t3",
    team2Id: "t4",
    team1Name: "The Outsiders",
    team2Name: "Stefan & Marko (Lefty)",
    team1PlayerIds: ["p4", "p5"],
    team2PlayerIds: ["p2", "p6"],
    team1Players: ["Luka", "Nikola"],
    team2Players: ["Stefan", "Marko (Lefty)"],
    score1: 21,
    score2: 12,
  },
  {
    id: "m4",
    date: "2026-05-28",
    createdAt: "2026-05-28",
    team1Id: "t4",
    team2Id: "t3",
    team1Name: "Stefan & Marko (Lefty)",
    team2Name: "The Outsiders",
    team1PlayerIds: ["p2", "p6"],
    team2PlayerIds: ["p4", "p5"],
    team1Players: ["Stefan", "Marko (Lefty)"],
    team2Players: ["Luka", "Nikola"],
    score1: 21,
    score2: 19,
  },
  {
    id: "m5",
    date: "2026-05-29",
    createdAt: "2026-05-29",
    team1Id: "t3",
    team2Id: "t4",
    team1Name: "The Outsiders",
    team2Name: "Stefan & Marko (Lefty)",
    team1PlayerIds: ["p4", "p5"],
    team2PlayerIds: ["p2", "p6"],
    team1Players: ["Luka", "Nikola"],
    team2Players: ["Stefan", "Marko (Lefty)"],
    score1: 21,
    score2: 9,
  },
];

// Demo PIN is "1234" — stored as SHA-256 hash, same as production.
// SHA-256("1234") = 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
export const FAKE_ADMINS = {
  id: "admins",
  list: [
    {
      name: "Demo Admin",
      pin: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
    },
  ],
};

export const FAKE_VENUE = {
  id: "venue",
  name: "Hrom Sand Court",
  address: "Bulevar Jane Sandanski, Skopje",
  lat: 41.9981,
  lng: 21.4254,
};
