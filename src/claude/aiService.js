/* ALL Claude API calls live here. No page component calls Claude directly.
 *
 * These three functions are the documented v1 AI surface. They are stubbed for
 * the foundation pass (Phases 0–2) and implemented in Phase 8. Model:
 * claude-opus-4-8, max_tokens 300, always wrapped in try/catch by callers,
 * always shown behind a loading state. See docs/TASKS.md Phase 8 for prompts. */

const NOT_IMPLEMENTED = "AI features are implemented in Phase 8.";

// eslint-disable-next-line no-unused-vars
export async function suggestTeamNames(playerNames) {
  throw new Error(NOT_IMPLEMENTED);
}

// eslint-disable-next-line no-unused-vars
export async function suggestBalancedTeams(players) {
  throw new Error(NOT_IMPLEMENTED);
}

export async function generateMatchCommentary(
  // eslint-disable-next-line no-unused-vars
  team1Name,
  // eslint-disable-next-line no-unused-vars
  team2Name,
  // eslint-disable-next-line no-unused-vars
  score1,
  // eslint-disable-next-line no-unused-vars
  score2,
  // eslint-disable-next-line no-unused-vars
  team1Players,
  // eslint-disable-next-line no-unused-vars
  team2Players
) {
  throw new Error(NOT_IMPLEMENTED);
}
