/* PIN hashing — uses the built-in Web Crypto API (no dependency).
 * Stores SHA-256(pin) so PINs are never readable in Firestore,
 * even if someone reads the /config/admins document directly. */

export async function hashPin(pin) {
  const data = new TextEncoder().encode(String(pin));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
