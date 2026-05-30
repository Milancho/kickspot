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

/**
 * Predict win probability using individual player win rates.
 *
 * For each team, averages the win rate of its players across ALL matches
 * they've personally played (regardless of which team). This means:
 * - New team combinations can still be predicted
 * - Strong players raise their team's prediction even with new partners
 *
 * Returns { team1Pct, team2Pct } as integers summing to 100.
 * Returns null if no player on either team has played any match yet.
 */
export function predictWinner(team1PlayerIds, team2PlayerIds, allMatches) {
  if (!team1PlayerIds?.length || !team2PlayerIds?.length) return null;
  const finished = (allMatches || []).filter((m) => m.status !== "live");
  const ps = computePlayerStats(finished);

  const avgRate = (playerIds) => {
    const rates = playerIds.map((id) => {
      const s = ps[id] || { wins: 0, losses: 0 };
      const total = s.wins + s.losses;
      return total > 0 ? s.wins / total : null; // null = no history
    });
    const known = rates.filter((r) => r !== null);
    if (known.length === 0) return null;
    return known.reduce((a, b) => a + b, 0) / known.length;
  };

  const r1 = avgRate(team1PlayerIds);
  const r2 = avgRate(team2PlayerIds);

  if (r1 === null && r2 === null) return null;
  const rate1 = r1 ?? 0.5; // unknown player → treat as 50%
  const rate2 = r2 ?? 0.5;
  const total = rate1 + rate2 || 1;
  const t1Pct = Math.round((rate1 / total) * 100);
  return { team1Pct: t1Pct, team2Pct: 100 - t1Pct };
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
/**
 * Group finished matches by ISO week (YYYY-Www) for the last N weeks.
 * Returns [{ week, label, count }, ...] oldest first.
 */
export function computeWeeklyActivity(matches, weeks = 8) {
  const finished = (matches || []).filter((m) => m.status !== "live" && m.date);
  const now = new Date();
  const result = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const ws = weekStart.toISOString().slice(0, 10);
    const we = weekEnd.toISOString().slice(0, 10);
    const count = finished.filter((m) => m.date >= ws && m.date <= we).length;
    result.push({
      week: ws,
      label: `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      count,
    });
  }
  return result;
}

/**
 * Count how often each player pair appears on the same team.
 * Returns [{ pair: [id1, id2], names: [n1, n2], count, wins, losses }, ...]
 * sorted by count desc.
 */
export function computePartnerStats(matches, players) {
  const finished = (matches || []).filter((m) => m.status !== "live");
  const pairMap = {};
  const key = (a, b) => [a, b].sort().join("|");
  const playerName = (id) => players.find((p) => p.id === id)?.name || id;

  for (const m of finished) {
    const w = matchWinner(m);
    for (const side of ["team1", "team2"]) {
      const ids = m[`${side}PlayerIds`] || [];
      const won = w === side;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const k = key(ids[i], ids[j]);
          if (!pairMap[k]) pairMap[k] = { ids: [ids[i], ids[j]], count: 0, wins: 0, losses: 0 };
          pairMap[k].count++;
          if (won) pairMap[k].wins++;
          else pairMap[k].losses++;
        }
      }
    }
  }

  return Object.values(pairMap)
    .map((p) => ({ ...p, names: p.ids.map(playerName) }))
    .sort((a, b) => b.count - a.count);
}

export function sortStandings(stats) {
  return [...stats].sort((a, b) => {
    const pts = points(b) - points(a);
    if (pts !== 0) return pts;
    const losses = (a.losses || 0) - (b.losses || 0);
    if (losses !== 0) return losses;
    return (a.name || "").localeCompare(b.name || "");
  });
}
