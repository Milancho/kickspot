/* In-memory backend used when Firebase is NOT configured (demo mode).
 *
 * It mimics just enough of Firestore — collections of documents with realtime
 * subscriptions — so the whole app is fully functional locally. Data lives in
 * memory only and resets on refresh. `backend.js` routes to this or to real
 * Firestore based on `firebaseEnabled`, so pages/service code never branch. */

import {
  FAKE_PLAYERS,
  FAKE_TEAMS,
  FAKE_MATCHES,
  FAKE_ADMINS,
  FAKE_VENUE,
} from "../data/fakeData.js";
import { computePlayerStats, computeTeamStats } from "../utils/statsCalculator.js";

const clone = (x) => JSON.parse(JSON.stringify(x));

let seq = 1000;
const nextId = (prefix) => `${prefix}-${++seq}`;

const collections = {
  players: clone(FAKE_PLAYERS),
  teams: clone(FAKE_TEAMS),
  matches: clone(FAKE_MATCHES),
  availability: [],
  config: [clone(FAKE_ADMINS), clone(FAKE_VENUE)],
};

// Seed player/team win-loss consistently from the seeded matches.
(function seedStats() {
  const ps = computePlayerStats(collections.matches);
  const ts = computeTeamStats(collections.matches);
  collections.players.forEach((p) => {
    p.wins = ps[p.id]?.wins || 0;
    p.losses = ps[p.id]?.losses || 0;
  });
  collections.teams.forEach((t) => {
    t.wins = ts[t.id]?.wins || 0;
    t.losses = ts[t.id]?.losses || 0;
  });
})();

const listeners = {}; // collection -> Set<cb>

function emit(coll) {
  (listeners[coll] || []).forEach((cb) => cb(clone(collections[coll])));
}

export function subscribe(coll, cb) {
  if (!listeners[coll]) listeners[coll] = new Set();
  listeners[coll].add(cb);
  cb(clone(collections[coll] || []));
  return () => listeners[coll].delete(cb);
}

export async function list(coll) {
  return clone(collections[coll] || []);
}

export async function getDoc(coll, id) {
  const d = (collections[coll] || []).find((x) => x.id === id);
  return d ? clone(d) : null;
}

export async function add(coll, data) {
  if (!collections[coll]) collections[coll] = [];
  const id = data.id || nextId(coll);
  collections[coll].push({ ...clone(data), id });
  emit(coll);
  return id;
}

export async function set(coll, id, data) {
  if (!collections[coll]) collections[coll] = [];
  const i = collections[coll].findIndex((d) => d.id === id);
  const doc = { ...clone(data), id };
  if (i >= 0) collections[coll][i] = doc;
  else collections[coll].push(doc);
  emit(coll);
  return id;
}

export async function update(coll, id, patch) {
  const d = (collections[coll] || []).find((x) => x.id === id);
  if (d) Object.assign(d, clone(patch));
  emit(coll);
}

export async function remove(coll, id) {
  const arr = collections[coll] || [];
  const i = arr.findIndex((d) => d.id === id);
  if (i >= 0) arr.splice(i, 1);
  emit(coll);
}
