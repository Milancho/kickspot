/* ALL Firestore CRUD lives here. No page component touches Firestore directly.
 *
 * Phase 2 scope: real-time reads. Writes (addPlayer, createTeam, saveMatch, …)
 * arrive in later phases. Every listener returns an unsubscribe function.
 *
 * When Firebase is not configured (demo mode) the listeners are no-ops that
 * return a no-op unsubscribe, so callers can rely on their fake-data fallback. */

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, firebaseEnabled } from "./config.js";
import { Player } from "./models.js";

const noop = () => {};

/**
 * Subscribe to non-deleted players in real time.
 * @param {(players: Player[]) => void} onChange
 * @param {(err: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function getPlayers(onChange, onError) {
  if (!firebaseEnabled) return noop;

  const q = query(collection(db, "players"), where("isDeleted", "==", false));
  return onSnapshot(
    q,
    (snap) => {
      const players = snap.docs.map((d) => Player.fromFirestore(d.id, d.data()));
      onChange(players);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error("[KickSpot] getPlayers listener error:", err);
      if (onError) onError(err);
    }
  );
}
