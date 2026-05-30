/* Thin data-access layer that routes every operation to either the in-memory
 * demo store or real Firestore, based on whether Firebase is configured.
 *
 * service.js builds all domain functions on top of this; nothing else imports
 * Firestore directly. Collections are subscribed whole-collection (fine at
 * this app's scale) and filtered in service.js. */

import {
  collection,
  onSnapshot,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc as fsGetDoc,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./config.js";
import * as demo from "./demoStore.js";

/** Realtime subscription to a whole collection. Returns an unsubscribe fn. */
export function subscribe(coll, cb, onError) {
  if (!firebaseEnabled) return demo.subscribe(coll, cb);
  return onSnapshot(
    collection(db, coll),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      // eslint-disable-next-line no-console
      console.error(`[KickSpot] ${coll} listener error:`, err);
      if (onError) onError(err);
    }
  );
}

/** One-time read of a whole collection (used by stats recalculation). */
export async function list(coll) {
  if (!firebaseEnabled) return demo.list(coll);
  const snap = await getDocs(collection(db, coll));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDoc(coll, id) {
  if (!firebaseEnabled) return demo.getDoc(coll, id);
  const snap = await fsGetDoc(doc(db, coll, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function add(coll, data) {
  if (!firebaseEnabled) return demo.add(coll, data);
  const ref = await addDoc(collection(db, coll), data);
  return ref.id;
}

export async function set(coll, id, data) {
  if (!firebaseEnabled) return demo.set(coll, id, data);
  await setDoc(doc(db, coll, id), data);
  return id;
}

export async function update(coll, id, patch) {
  if (!firebaseEnabled) return demo.update(coll, id, patch);
  await updateDoc(doc(db, coll, id), patch);
}

export async function remove(coll, id) {
  if (!firebaseEnabled) return demo.remove(coll, id);
  await deleteDoc(doc(db, coll, id));
}
