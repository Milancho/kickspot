/* Single source of truth for KickSpot's game rules. Used by team formation
 * (Phase 6) and match entry / stats (Phase 7). Keep in sync with CLAUDE.md. */

/* Each recorded result is a single set/game — first team to WIN_TARGET points
 * wins it. There is NO best-of-3 match: every set is recorded on its own and
 * counts on its own. The stored score (score1/score2) is the rally points,
 * e.g. 21:15. The outcome is 1:0 — the winning team takes the set and every
 * player on it gets +1 win (1 point); every loser gets a loss. There are no
 * draws: a set always has a winner. Standings count sets won. */
export const WIN_TARGET = 21;

/* Points awarded per match outcome. */
export const POINTS = { win: 1, loss: 0 };

/* Team size: 2v2 by default, but a team may field 3 or 4. */
export const TEAM_MIN_PLAYERS = 2;
export const TEAM_MAX_PLAYERS = 4;
