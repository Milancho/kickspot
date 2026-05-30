/* ALL Firestore access goes through here. No page component touches the
 * backend directly. Works identically against the in-memory demo store
 * (no Firebase) or live Firestore — see backend.js.
 *
 * Subscriptions use realtime listeners; one-time reads are only used inside
 * stats recalculation. Every listener returns an unsubscribe function. */

import * as backend from "./backend.js";
import { Player, Team, MatchResult, Availability } from "./models.js";
import { computePlayerStats, computeTeamStats } from "../utils/statsCalculator.js";
import { hashPin } from "../utils/crypto.js";

const nowISO = () => new Date().toISOString();

/* ── Players ─────────────────────────────────────────────────────────────── */

export function getPlayers(onChange, onError) {
  return backend.subscribe(
    "players",
    (rows) => {
      const players = rows
        .map((r) => Player.fromFirestore(r.id, r))
        .filter((p) => !p.isDeleted)
        .sort((a, b) => a.name.localeCompare(b.name));
      onChange(players);
    },
    onError
  );
}

export function addPlayer({ name, nickname = "" }) {
  return backend.add("players", {
    name: name.trim(),
    nickname: nickname.trim(),
    wins: 0,
    losses: 0,
    isDeleted: false,
    createdAt: nowISO(),
  });
}

export function updatePlayer(id, patch) {
  return backend.update("players", id, patch);
}

/** Soft delete — historical data is preserved. */
export function softDeletePlayer(id) {
  return backend.update("players", id, { isDeleted: true });
}

/* ── Admins (single /config/admins doc with a `list` array) ──────────────── */

export function getAdmins(onChange, onError) {
  return backend.subscribe(
    "config",
    (rows) => {
      const admins = rows.find((r) => r.id === "admins");
      onChange(admins?.list || []);
    },
    onError
  );
}

export async function checkPin(pin) {
  const admins = await backend.getDoc("config", "admins");
  const hashed = await hashPin(pin);
  const match = (admins?.list || []).find((a) => a.pin === hashed);
  return match || null;
}

export async function hasAnyAdmin() {
  const admins = await backend.getDoc("config", "admins");
  return (admins?.list || []).length > 0;
}

export async function addAdmin({ name, pin }) {
  const admins = (await backend.getDoc("config", "admins")) || { list: [] };
  const hashed = await hashPin(pin);
  const list = [...(admins.list || []), { name: name.trim(), pin: hashed }];
  return backend.set("config", "admins", { list });
}

export async function deleteAdmin(name) {
  const admins = (await backend.getDoc("config", "admins")) || { list: [] };
  const list = (admins.list || []).filter((a) => a.name !== name);
  return backend.set("config", "admins", { list });
}

/* ── Venue ───────────────────────────────────────────────────────────────── */

export function getVenue(onChange, onError) {
  return backend.subscribe(
    "config",
    (rows) => onChange(rows.find((r) => r.id === "venue") || null),
    onError
  );
}

/* ── Availability (one doc per player+date) ──────────────────────────────── */

export function getAvailability(date, onChange, onError) {
  return backend.subscribe(
    "availability",
    (rows) =>
      onChange(
        rows
          .filter((r) => r.date === date)
          .map((r) => Availability.fromFirestore(r.id, r))
      ),
    onError
  );
}

export function setAvailability(player, date, isAvailable) {
  const id = `${player.id}_${date}`; // deterministic upsert key
  return backend.set("availability", id, {
    date,
    playerId: player.id,
    playerName: player.name,
    isAvailable,
    updatedAt: nowISO(),
  });
}

/* ── Teams ───────────────────────────────────────────────────────────────── */

export function getTeams(date, onChange, onError) {
  return backend.subscribe(
    "teams",
    (rows) => {
      const teams = rows
        .map((r) => Team.fromFirestore(r.id, r))
        .filter((t) => !date || t.date === date);
      onChange(teams);
    },
    onError
  );
}

/** All teams across every date — used for order-independent reuse detection. */
export function getAllTeams(onChange, onError) {
  return getTeams(null, onChange, onError);
}

export function createTeam(team) {
  return backend.add("teams", {
    name: team.name.trim(),
    nickname: (team.nickname || "").trim(),
    date: team.date,
    playerIds: team.playerIds,
    playerNames: team.playerNames,
    wins: 0,
    losses: 0,
  });
}

export function updateTeam(id, patch) {
  return backend.update("teams", id, patch);
}

export function deleteTeam(id) {
  return backend.remove("teams", id);
}

/** Copy a previous date's teams to a new date with stats reset to zero. */
export async function copyTeamsFromDate(fromDate, toDate) {
  const all = await backend.list("teams");
  const source = all.filter((t) => t.date === fromDate);
  await Promise.all(
    source.map((t) =>
      backend.add("teams", {
        name: t.name,
        nickname: t.nickname || "",
        date: toDate,
        playerIds: t.playerIds,
        playerNames: t.playerNames,
        wins: 0,
        losses: 0,
      })
    )
  );
  return source.length;
}

/* ── Matches & stats ─────────────────────────────────────────────────────── */

export function getMatches(date, onChange, onError) {
  return backend.subscribe(
    "matches",
    (rows) => {
      const matches = rows
        .map((r) => MatchResult.fromFirestore(r.id, r))
        .filter((m) => !date || m.date === date);
      onChange(matches);
    },
    onError
  );
}

export function getAllMatches(onChange, onError) {
  return getMatches(null, onChange, onError);
}

export async function saveMatch(match) {
  const id = await backend.add("matches", {
    ...match,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  });
  await recalculateStats();
  return id;
}

export async function updateMatch(id, patch) {
  await backend.update("matches", id, { ...patch, updatedAt: nowISO() });
  await recalculateStats();
}

export async function deleteMatch(id) {
  await backend.remove("matches", id);
  await recalculateStats();
}

/**
 * Rebuild ALL player and team win-loss from the full match list and write them
 * back. Runs after every match save / edit / delete. Reading everything and
 * rewriting from scratch is what prevents stat drift.
 */
export async function recalculateStats() {
  const [matches, players, teams] = await Promise.all([
    backend.list("matches"),
    backend.list("players"),
    backend.list("teams"),
  ]);
  const ps = computePlayerStats(matches);
  const ts = computeTeamStats(matches);
  await Promise.all([
    ...players.map((p) =>
      backend.update("players", p.id, {
        wins: ps[p.id]?.wins || 0,
        losses: ps[p.id]?.losses || 0,
      })
    ),
    ...teams.map((t) =>
      backend.update("teams", t.id, {
        wins: ts[t.id]?.wins || 0,
        losses: ts[t.id]?.losses || 0,
      })
    ),
  ]);
}
