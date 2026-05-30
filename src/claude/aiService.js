/* ALL Claude API calls live here. No page calls Claude directly.
 *
 * Model claude-opus-4-8, max_tokens 300, short responses, JSON where expected.
 * Every call is wrapped in try/catch and falls back to a deterministic local
 * result, so an AI failure (or a missing key in demo mode) never breaks the
 * app. Callers still show a loading state while awaiting. */

const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const MODEL = "claude-opus-4-8";
const ENDPOINT = "https://api.anthropic.com/v1/messages";

export const aiEnabled = Boolean(API_KEY);

async function askClaude(prompt) {
  if (!API_KEY) throw new Error("No Claude API key configured");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      // Required for calling the API directly from a browser.
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text?.trim() || "";
}

/** Strip ```json fences if the model wraps its reply. */
function parseJson(text) {
  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  return JSON.parse(cleaned);
}

/* ── 1. Team name suggestions ────────────────────────────────────────────── */

export async function suggestTeamNames(playerNames) {
  const names = playerNames || [];
  try {
    const text = await askClaude(
      `You are naming a footvolley team.\n` +
        `The players are: ${names.join(", ")}.\n` +
        `Suggest 3 short, creative, fun team names.\n` +
        `Return only a JSON array of 3 strings. No explanation.`
    );
    const arr = parseJson(text);
    if (Array.isArray(arr) && arr.length) return arr.slice(0, 3).map(String);
    throw new Error("bad shape");
  } catch {
    return localTeamNames(names);
  }
}

function localTeamNames(names) {
  const adjectives = ["Sand", "Beach", "Net", "Sun", "Wave"];
  const nouns = ["Kings", "Aces", "Smashers", "Strikers", "Sharks"];
  const first = (names[0] || "Team").split(/\s+/)[0];
  const seed = first.length;
  return [
    `${adjectives[seed % adjectives.length]} ${nouns[seed % nouns.length]}`,
    `${first}'s ${nouns[(seed + 1) % nouns.length]}`,
    `${adjectives[(seed + 2) % adjectives.length]} ${
      nouns[(seed + 2) % nouns.length]
    }`,
  ];
}

/* ── 2. Balanced team split ──────────────────────────────────────────────── */

export async function suggestBalancedTeams(players) {
  const list = players || [];
  try {
    const stats = list.map((p) => ({
      name: p.name,
      wins: p.wins || 0,
      losses: p.losses || 0,
    }));
    const text = await askClaude(
      `You are balancing footvolley teams.\n` +
        `Available players and their records: ${JSON.stringify(stats)}.\n` +
        `Split them into 2 balanced teams.\n` +
        `Return only a JSON object: { "team1": [names], "team2": [names] }. No explanation.`
    );
    const obj = parseJson(text);
    if (obj && Array.isArray(obj.team1) && Array.isArray(obj.team2)) return obj;
    throw new Error("bad shape");
  } catch {
    return localBalancedTeams(list);
  }
}

function localBalancedTeams(players) {
  // Greedy: sort by win count desc, alternate assigning to the lighter side.
  const sorted = [...players].sort(
    (a, b) => (b.wins || 0) - (a.wins || 0)
  );
  const team1 = [];
  const team2 = [];
  let w1 = 0;
  let w2 = 0;
  for (const p of sorted) {
    if (w1 <= w2) {
      team1.push(p.name);
      w1 += p.wins || 0;
    } else {
      team2.push(p.name);
      w2 += p.wins || 0;
    }
  }
  return { team1, team2 };
}

/* ── 3. Match commentary ─────────────────────────────────────────────────── */

export async function generateMatchCommentary(
  team1Name,
  team2Name,
  score1,
  score2,
  team1Players,
  team2Players
) {
  try {
    return await askClaude(
      `Write a 2-sentence fun commentary for this footvolley match:\n` +
        `${team1Name} ${score1} - ${score2} ${team2Name}\n` +
        `Players: ${team1Name}: ${(team1Players || []).join(", ")} | ` +
        `${team2Name}: ${(team2Players || []).join(", ")}\n` +
        `Keep it short, energetic, and funny.`
    );
  } catch {
    return localCommentary(team1Name, team2Name, score1, score2);
  }
}

function localCommentary(t1, t2, s1, s2) {
  const winner = s1 > s2 ? t1 : t2;
  const loser = s1 > s2 ? t2 : t1;
  const margin = Math.abs(s1 - s2);
  const close = margin <= 3 ? "a nail-biter" : "a commanding display";
  return `${winner} took the set ${Math.max(s1, s2)}–${Math.min(
    s1,
    s2
  )} in ${close}. ${loser} will be hungry for revenge next time on the sand!`;
}
