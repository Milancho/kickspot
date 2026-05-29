import { useState } from "react";
import { PageHeader, Empty, todayISO } from "../components/ui.jsx";
import { FAKE_TEAMS, FAKE_PLAYERS } from "../data/fakeData.js";
import {
  defaultTeamName,
  teamDisplayName,
  findTeamByPlayers,
  playerLabel,
} from "../utils/teamName.js";
import { TEAM_MIN_PLAYERS, TEAM_MAX_PLAYERS } from "../constants.js";

function playersOf(team) {
  // Prefer disambiguated labels resolved from player IDs; fall back to the
  // denormalised names if a player isn't in the current pool.
  if (team.playerIds && team.playerIds.length) {
    return team.playerIds
      .map((id) => {
        const p = FAKE_PLAYERS.find((x) => x.id === id);
        return p ? playerLabel(p, FAKE_PLAYERS) : null;
      })
      .filter(Boolean);
  }
  return team.playerNames || [];
}

function TeamCard({ team }) {
  const title = teamDisplayName(team);
  // Show the player-combo name as a subtitle when a nickname is the title.
  const showName = (team.nickname || "").trim() && team.name && team.name !== title;
  const players = playersOf(team);
  return (
    <div className="card">
      <div className="list-row">
        <div>
          <div className="name">{title}</div>
          {showName && <div className="meta">{team.name}</div>}
        </div>
        <div className="meta">
          {players.length} players{team.local ? " · unsaved" : ""}
        </div>
      </div>
      <div className="meta" style={{ marginTop: 6 }}>
        {players.join(", ")}
      </div>
    </div>
  );
}

function CreateTeamForm({ date, knownTeams, onCreate }) {
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [nickname, setNickname] = useState("");

  const selectedPlayers = FAKE_PLAYERS.filter((p) => selected.includes(p.id));
  // Labels disambiguate same-name players (e.g. "Marko (Lefty)").
  const selectedLabels = selectedPlayers.map((p) => playerLabel(p, FAKE_PLAYERS));
  const autoName = defaultTeamName(selectedLabels);
  const enoughPlayers =
    selected.length >= TEAM_MIN_PLAYERS && selected.length <= TEAM_MAX_PLAYERS;

  // A team with this exact player set may already exist (any date, any order).
  // Matched by player IDs, so two different "Marko"s never collide.
  const existing = enoughPlayers && findTeamByPlayers(knownTeams, selected);
  const existsThisDate = existing && existing.date === date;

  // When reusing an existing team, its identity (name + nickname) wins; the
  // inputs are locked. Otherwise the user edits name / nickname freely.
  const formName = existing ? existing.name : nameEdited ? name : autoName;
  const formNick = existing ? existing.nickname || "" : nickname;

  const toggle = (id) =>
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= TEAM_MAX_PLAYERS) return prev; // cap at max
      return [...prev, id];
    });

  const canSubmit =
    enoughPlayers &&
    (existing ? !existsThisDate : formName.trim().length > 0);

  const submit = () => {
    if (!canSubmit) return;
    const source = existing || { name: formName, nickname: formNick };
    onCreate({
      date,
      name: source.name.trim(),
      nickname: (source.nickname || "").trim(),
      playerIds: [...selected],
      playerNames: existing ? existing.playerNames : selectedLabels,
      wins: 0,
      losses: 0,
      local: true,
      reusedFrom: existing ? existing.id : null,
    });
  };

  return (
    <div className="card">
      <div className="meta">
        Select players — {selected.length}/{TEAM_MAX_PLAYERS} (min{" "}
        {TEAM_MIN_PLAYERS})
      </div>
      <div className="player-pills">
        {FAKE_PLAYERS.map((p) => {
          const on = selected.includes(p.id);
          const disabled = !on && selected.length >= TEAM_MAX_PLAYERS;
          return (
            <button
              key={p.id}
              className={"toggle-pill " + (on ? "in" : "out")}
              disabled={disabled}
              onClick={() => toggle(p.id)}
            >
              {playerLabel(p, FAKE_PLAYERS)}
            </button>
          );
        })}
      </div>

      {existing && (
        <div className="notice">
          {existsThisDate
            ? `These players already form “${teamDisplayName(
                existing
              )}” for this date — no duplicate created.`
            : `Existing team “${teamDisplayName(
                existing
              )}” (${existing.date}) — reusing it instead of making a new one.`}
        </div>
      )}

      <label className="field">
        <span>Team name</span>
        <input
          type="text"
          value={formName}
          readOnly={!!existing}
          placeholder="Auto-filled from players"
          onChange={(e) => {
            setName(e.target.value);
            setNameEdited(true);
          }}
        />
      </label>
      {!existing && nameEdited && (
        <button
          className="link-btn"
          onClick={() => {
            setNameEdited(false);
            setName("");
          }}
        >
          ↻ Reset to auto name
        </button>
      )}

      <label className="field">
        <span>Nickname (optional)</span>
        <input
          type="text"
          value={formNick}
          readOnly={!!existing}
          placeholder="e.g. Street Kings"
          onChange={(e) => setNickname(e.target.value)}
        />
      </label>

      <button className="btn" disabled={!canSubmit} onClick={submit}>
        {existing
          ? existsThisDate
            ? "Already a team for this date"
            : "Reuse team"
          : "Add team"}
      </button>

      <div className="notice" style={{ marginTop: 12, marginBottom: 0 }}>
        Preview only — saving teams to Firestore arrives in Phase 6.
      </div>
    </div>
  );
}

export default function Teams() {
  const [date, setDate] = useState(todayISO());
  const [creating, setCreating] = useState(false);
  const [localTeams, setLocalTeams] = useState([]);
  const [seq, setSeq] = useState(0);

  // All teams across every date — used to recognise a player set that already
  // has a team (order-independent) so we reuse it instead of duplicating.
  const knownTeams = [...localTeams, ...FAKE_TEAMS];

  const teams = knownTeams.filter((t) => t.date === date);

  const handleCreate = (team) => {
    setLocalTeams((prev) => [{ ...team, id: `local-${seq}` }, ...prev]);
    setSeq((s) => s + 1);
    setCreating(false);
  };

  return (
    <div className="page">
      <PageHeader title="Teams" subtitle={`${teams.length} team(s) this session`}>
        <button className="btn btn-sm" onClick={() => setCreating((c) => !c)}>
          {creating ? "Close" : "+ Create"}
        </button>
      </PageHeader>

      <div style={{ marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {creating && (
        <CreateTeamForm
          date={date}
          knownTeams={knownTeams}
          onCreate={handleCreate}
        />
      )}

      {teams.length === 0 ? (
        <Empty>No teams formed for this date.</Empty>
      ) : (
        teams.map((t) => <TeamCard key={t.id} team={t} />)
      )}
    </div>
  );
}
