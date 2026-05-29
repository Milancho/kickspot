import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True when a .env with real Firebase keys is present. When false the app
 *  runs in demo mode (pages fall back to fake data) instead of crashing. */
export const firebaseEnabled = Boolean(firebaseConfig.projectId);

let db = null;
if (firebaseEnabled) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[KickSpot] Firebase not configured — running in demo mode with fake data. " +
      "Copy .env.example to .env and add your keys to enable live data."
  );
}

export { db };
