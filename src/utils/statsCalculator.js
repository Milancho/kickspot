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
 * The full recalculateTeamStats(date) / recalculatePlayerStats() rebuild
 * (reads ALL matches, rewrites every stat from scratch) lands in Phase 7.
 * For now these are the pure display helpers the standings tables use.
 */

import { POINTS } from "../constants.js";

export { POINTS };

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
