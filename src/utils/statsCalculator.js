/* ── statsCalculator — pure JS, NO Firebase imports ──────────────────────────
 *
 * Each recorded result is a single set/game — first team to 21 wins it.
 * There is no best-of-3 match; every set counts on its own. The outcome is
 * 1:0 — no draws, a set always has a winner. Every player on the winning
 * team gets +1 win (1 point). Standings count sets won.
 *
 * Points:
 *   Win  = 1 point
 *   Loss = 0 points
 *
 * Sort order: points → fewer losses → name
 * (cumulative point totals / goal difference are not tracked)
 *
 * `computePlayerStats` / `computeTeamStats` rebuild win-loss FROM SCRATCH out
 * of the full match list — this is what prevents drift. `service.js` calls
 * them after every match save / edit / delete and writes the results back.
 * They stay pure (no Firebase) so they're trivially unit-testable.
 */

import { POINTS } from "../constants.js";

export { POINTS };

/** Winner of a match: "team1", "team2", or null if scores tie (shouldn't happen). */
export function matchWinner(match) {
  if (match.score1 === match.score2) return null;
  return match.score1 > match.score2 ? "team1" : "team2";
}

/**
 * Win-loss per player ID across all matches, rebuilt from scratch.
 * Returns { [playerId]: { wins, losses } }.
 */
export function computePlayerStats(matches) {
  const stats = {};
  const bump = (id, key) => {
    if (!id) return;
    if (!stats[id]) stats[id] = { wins: 0, losses: 0 };
    stats[id][key] += 1;
  };
  for (const m of matches || []) {
    const w = matchWinner(m);
    if (!w) continue;
    const winners = w === "team1" ? m.team1PlayerIds : m.team2PlayerIds;
    const losers = w === "team1" ? m.team2PlayerIds : m.team1PlayerIds;
    (winners || []).forEach((id) => bump(id, "wins"));
    (losers || []).forEach((id) => bump(id, "losses"));
  }
  return stats;
}

/**
 * Win-loss per team document ID across all matches, rebuilt from scratch.
 * Returns { [teamId]: { wins, losses } }.
 */
export function computeTeamStats(matches) {
  const stats = {};
  const bump = (id, key) => {
    if (!id) return;
    if (!stats[id]) stats[id] = { wins: 0, losses: 0 };
    stats[id][key] += 1;
  };
  for (const m of matches || []) {
    const w = matchWinner(m);
    if (!w) continue;
    bump(m.team1Id, w === "team1" ? "wins" : "losses");
    bump(m.team2Id, w === "team1" ? "losses" : "wins");
  }
  return stats;
}

/** Points for an entity with { wins, losses }. */
export function points(stat) {
  const wins = stat.wins || 0;
  const losses = stat.losses || 0;
  return wins * POINTS.win + losses * POINTS.loss;
}

/** Games played. */
export function played(stat) {
  return (stat.wins || 0) + (stat.losses || 0);
}

/**
 * Returns a new array sorted for a standings table:
 * points (desc) → fewer losses (asc) → name (asc, for stable ordering).
 */
export function sortStandings(stats) {
  return [...stats].sort((a, b) => {
    const pts = points(b) - points(a);
    if (pts !== 0) return pts;
    const losses = (a.losses || 0) - (b.losses || 0);
    if (losses !== 0) return losses;
    return (a.name || "").localeCompare(b.name || "");
  });
}
