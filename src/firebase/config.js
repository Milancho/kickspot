import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True when a .env with real Firebase keys is present. When false the app
 *  runs in demo mode (in-memory store) instead of crashing. */
export const firebaseEnabled = Boolean(firebaseConfig.projectId);

let db = null;

if (firebaseEnabled) {
  const app = initializeApp(firebaseConfig);

  // ── App Check (reCAPTCHA v3) ──────────────────────────────────────────────
  // Tells Firestore to reject requests that don't come from a real browser
  // running this app. Blocks scripts / direct API calls from flooding the DB.
  //
  // To activate:
  //   1. Register a reCAPTCHA v3 site key at https://www.google.com/recaptcha
  //      (choose "reCAPTCHA v3", add your domain + localhost)
  //   2. Add VITE_RECAPTCHA_SITE_KEY=<key> to your .env
  //   3. In the Firebase console → App Check → register your web app with that key
  //   4. Click "Enforce" on Firestore — from that point scripts are blocked
  //
  // In development (no key in .env) App Check is skipped so local dev still works.
  // The debug token flow (window.FIREBASE_APPCHECK_DEBUG_TOKEN) handles CI/CD.

  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (recaptchaKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      // Automatically refresh tokens before they expire.
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      "[KickSpot] App Check is not active — add VITE_RECAPTCHA_SITE_KEY to .env " +
        "and enforce App Check in the Firebase console to block automated writes."
    );
  }

  db = getFirestore(app);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[KickSpot] Firebase not configured — running in demo mode with fake data. " +
      "Copy .env.example to .env and add your keys to enable live data."
  );
}

export { db };
