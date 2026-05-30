import { describe, it, expect } from "vitest";
import {
  POINTS,
  points,
  played,
  sortStandings,
  matchWinner,
  computePlayerStats,
  computeTeamStats,
} from "./statsCalculator.js";

describe("points & played", () => {
  it("scores 1 per win, 0 per loss (no draws)", () => {
    expect(POINTS).toEqual({ win: 1, loss: 0 });
    expect(points({ wins: 5, losses: 3 })).toBe(5);
    expect(points({})).toBe(0);
    expect(played({ wins: 5, losses: 3 })).toBe(8);
  });
});

describe("sortStandings", () => {
  it("orders by points, then fewer losses, then name", () => {
    const rows = [
      { id: "a", name: "Ana", wins: 5, losses: 6 },
      { id: "b", name: "Stefan", wins: 5, losses: 2 },
      { id: "c", name: "Luka", wins: 7, losses: 1 },
      { id: "d", name: "Marko", wins: 5, losses: 2 },
    ];
    const sorted = sortStandings(rows).map((r) => r.id);
    // Luka (7) first; then the two 5-2 players tie on points+losses → name
    // order (Marko before Stefan); then Ana (5-6).
    expect(sorted).toEqual(["c", "d", "b", "a"]);
  });

  it("does not mutate the input array", () => {
    const rows = [
      { id: "a", name: "A", wins: 1, losses: 0 },
      { id: "b", name: "B", wins: 2, losses: 0 },
    ];
    const copy = [...rows];
    sortStandings(rows);
    expect(rows).toEqual(copy);
  });
});

describe("matchWinner", () => {
  it("picks the higher score; null on a tie", () => {
    expect(matchWinner({ score1: 21, score2: 15 })).toBe("team1");
    expect(matchWinner({ score1: 18, score2: 21 })).toBe("team2");
    expect(matchWinner({ score1: 21, score2: 21 })).toBe(null);
  });
});

const MATCHES = [
  // team1 (p1,p2) beat team2 (p3,p4)
  {
    team1Id: "t1",
    team2Id: "t2",
    team1PlayerIds: ["p1", "p2"],
    team2PlayerIds: ["p3", "p4"],
    score1: 21,
    score2: 15,
  },
  // team2 beat team1
  {
    team1Id: "t1",
    team2Id: "t2",
    team1PlayerIds: ["p1", "p2"],
    team2PlayerIds: ["p3", "p4"],
    score1: 18,
    score2: 21,
  },
  // p1 (with p3) beat p2 (with p4) on a different team set
  {
    team1Id: "t3",
    team2Id: "t4",
    team1PlayerIds: ["p1", "p3"],
    team2PlayerIds: ["p2", "p4"],
    score1: 21,
    score2: 9,
  },
];

describe("computePlayerStats", () => {
  it("credits every player on the winning side and debits losers", () => {
    const s = computePlayerStats(MATCHES);
    expect(s.p1).toEqual({ wins: 2, losses: 1 }); // W, L, W
    expect(s.p2).toEqual({ wins: 1, losses: 2 }); // W, L, L
    expect(s.p3).toEqual({ wins: 2, losses: 1 }); // L, W, W
    expect(s.p4).toEqual({ wins: 1, losses: 2 }); // L, W, L
  });

  it("ignores tied (invalid) matches and handles empty input", () => {
    expect(computePlayerStats([])).toEqual({});
    expect(
      computePlayerStats([
        { team1PlayerIds: ["p1"], team2PlayerIds: ["p2"], score1: 5, score2: 5 },
      ])
    ).toEqual({});
  });
});

describe("computeTeamStats", () => {
  it("tallies team-document win-loss by team id", () => {
    const s = computeTeamStats(MATCHES);
    expect(s.t1).toEqual({ wins: 1, losses: 1 });
    expect(s.t2).toEqual({ wins: 1, losses: 1 });
    expect(s.t3).toEqual({ wins: 1, losses: 0 });
    expect(s.t4).toEqual({ wins: 0, losses: 1 });
  });
});
