/* Date helpers — all dates are "YYYY-MM-DD" strings (local). */

export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Format "2026-05-29" → "29/05/2026" for display. */
export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Inclusive lower bound (as "YYYY-MM-DD") for a range ending at `ref`:
 *   week  → 6 days before ref      month → same day last month
 *   year  → same day last year     all   → "" (no bound)
 */
export function rangeStart(range, refISO) {
  if (range === "all") return "";
  const [y, m, d] = refISO.split("-").map(Number);
  const ref = new Date(y, m - 1, d);
  const out = new Date(ref);
  if (range === "week") {
    const day = ref.getDay();                  // 0=Sun, 1=Mon, …, 6=Sat
    const daysBack = day === 0 ? 6 : day - 1; // steps back to Monday
    out.setDate(ref.getDate() - daysBack);
  } else
  if (range === "month") out.setMonth(ref.getMonth() - 1);
  else if (range === "year") out.setFullYear(ref.getFullYear() - 1);
  const off = out.getTimezoneOffset() * 60000;
  return new Date(out.getTime() - off).toISOString().slice(0, 10);
}

/** Whether `dateISO` falls within [start, ref] (start "" means no lower bound). */
export function inRange(dateISO, range, refISO) {
  if (range === "all") return true;
  const start = rangeStart(range, refISO);
  return dateISO >= start && dateISO <= refISO;
}
