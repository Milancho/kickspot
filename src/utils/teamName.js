/* Team-naming & identity helpers — pure JS.
 *
 * A team's `name` defaults to its players' (disambiguated) first names joined
 * with "&" (e.g. "Marko & Ana"). It is editable. A team may also have an
 * optional `nickname` (e.g. "Street Kings"); when set, the nickname is shown.
 *
 * IMPORTANT: a team is identified by its set of player *IDs*, never by names.
 * Names can repeat (two players called "Marko"); IDs are unique. */

/** First token of a full name — the short name used in auto team names. */
export function firstName(fullName) {
  return (fullName || "").trim().split(/\s+/)[0] || "";
}

/**
 * Display label for a player, disambiguated within a pool. Normally just the
 * first name ("Marko"); if another player in the pool shares that first name,
 * the nickname is appended ("Marko (Lefty)") so the two are distinguishable —
 * falling back to the full name if there's no nickname.
 */
export function playerLabel(player, pool) {
  if (!player) return "";
  const fn = firstName(player.name);
  const clash = (pool || []).some(
    (o) =>
      o.id !== player.id &&
      firstName(o.name).toLowerCase() === fn.toLowerCase()
  );
  if (!clash) return fn;
  const nick = (player.nickname || "").trim();
  return nick ? `${fn} (${nick})` : player.name || fn;
}

/**
 * Auto team name from already-resolved labels, joined with "&":
 *   []                       → ""
 *   ["Marko"]                → "Marko"
 *   ["Marko", "Ana"]         → "Marko & Ana"
 *   ["Marko", "Ana", "Luka"] → "Marko, Ana & Luka"
 */
export function defaultTeamName(labels) {
  const xs = (labels || []).map((s) => (s || "").trim()).filter(Boolean);
  if (xs.length === 0) return "";
  if (xs.length === 1) return xs[0];
  return xs.slice(0, -1).join(", ") + " & " + xs[xs.length - 1];
}

/** What to show for a team: its nickname if set, otherwise its name. */
export function teamDisplayName(team) {
  return ((team && team.nickname) || "").trim() || (team && team.name) || "";
}

/**
 * Order-independent identity key for a set of player IDs. {p1, p3} and
 * {p3, p1} produce the same key, so the same players are recognised as the
 * same team regardless of selection order — and two different players who
 * happen to share a name never collide (IDs are unique).
 */
export function playerSetKey(playerIds) {
  return (playerIds || [])
    .map((id) => String(id == null ? "" : id).trim())
    .filter(Boolean)
    .sort()
    .join("|");
}

/** True when two ID lists are the same set, ignoring order. */
export function samePlayerSet(a, b) {
  const key = playerSetKey(a);
  return key !== "" && key === playerSetKey(b);
}

/** Find an existing team whose player IDs match `playerIds` (order-independent). */
export function findTeamByPlayers(teams, playerIds) {
  return (teams || []).find((t) => samePlayerSet(t.playerIds, playerIds));
}
