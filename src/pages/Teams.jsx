import { useEffect, useMemo, useState } from "react";
import { PageHeader, Empty, Loading, Modal } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import {
  getTeams,
  getPlayers,
  getAllMatches,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../firebase/service.js";
import {
  defaultTeamName,
  teamDisplayName,
  findTeamByPlayers,
  playerLabel,
} from "../utils/teamName.js";
import { suggestTeamNames, suggestBalancedTeams } from "../claude/aiService.js";
import { TEAM_MIN_PLAYERS, TEAM_MAX_PLAYERS } from "../constants.js";

function playersOf(team, players) {
  if (team.playerIds && team.playerIds.length) {
    return team.playerIds
      .map((id) => {
        const p = players.find((x) => x.id === id);
        return p ? playerLabel(p, players) : null;
      })
      .filter(Boolean);
  }
  return team.playerNames || [];
}

function TeamCard({ team, players, adminMode, hasMatches, onEdit, onDelete }) {
  const title = teamDisplayName(team);
  const showName = (team.nickname || "").trim() && team.name && team.name !== title;
  const list = playersOf(team, players);
  return (
    <div className="card">
      <div className="list-row">
        <div>
          <div className="name">{title}</div>
          {showName && <div className="meta">{team.name}</div>}
        </div>
        <div className="row-actions">
          <span className="meta">{team.wins}W · {team.losses}L</span>
          {adminMode && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(team)}>Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={() => onDelete(team, hasMatches)}>Delete</button>
            </>
          )}
        </div>
      </div>
      <div className="meta" style={{ marginTop: 6 }}>{list.join(", ")}</div>
    </div>
  );
}

function TeamForm({ players, allTeams, editTeam, onDone }) {
  const isEdit = !!editTeam;
  const [selected, setSelected] = useState(editTeam?.playerIds || []);
  const [name, setName] = useState(editTeam?.name || "");
  const [nameEdited, setNameEdited] = useState(isEdit);
  const [nickname, setNickname] = useState(editTeam?.nickname || "");
  const [suggestions, setSuggestions] = useState(null);
  const [loadingNames, setLoadingNames] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedPlayers = players.filter((p) => selected.includes(p.id));
  const labels = selectedPlayers.map((p) => playerLabel(p, players));
  const autoName = defaultTeamName(labels);
  const enough = selected.length >= TEAM_MIN_PLAYERS && selected.length <= TEAM_MAX_PLAYERS;

  // Check if this player set already has a team (reuse instead of duplicate).
  const existing = !isEdit && enough && findTeamByPlayers(allTeams, selected);

  const formName = existing ? existing.name : nameEdited ? name : autoName;
  const formNick = existing ? existing.nickname || "" : nickname;

  const toggle = (id) =>
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= TEAM_MAX_PLAYERS) return prev;
      return [...prev, id];
    });

  const canSubmit = enough && !busy && (existing ? false : formName.trim().length > 0);

  const fetchNames = async () => {
    setLoadingNames(true);
    try { setSuggestions(await suggestTeamNames(labels)); }
    finally { setLoadingNames(false); }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (isEdit) {
        await updateTeam(editTeam.id, {
          name: formName.trim(),
          nickname: formNick.trim(),
          playerIds: [...selected],
          playerNames: labels,
        });
      } else {
        await createTeam({
          name: formName.trim(),
          nickname: formNick.trim(),
          playerIds: [...selected],
          playerNames: labels,
        });
      }
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <div className="card">
      <div className="meta">
        Select players — {selected.length}/{TEAM_MAX_PLAYERS} (min {TEAM_MIN_PLAYERS})
      </div>
      <div className="player-pills">
        {players.map((p) => {
          const on = selected.includes(p.id);
          const capped = !on && selected.length >= TEAM_MAX_PLAYERS;
          return (
            <button
              key={p.id}
              className={"toggle-pill " + (on ? "in" : "out")}
              disabled={capped}
              onClick={() => toggle(p.id)}
            >
              {playerLabel(p, players)}
            </button>
          );
        })}
      </div>

      {existing && (
        <div className="notice">
          This team already exists as "{teamDisplayName(existing)}" — no duplicate created.
          Pick them on the Matches page to record a result.
        </div>
      )}

      {!existing && (
        <>
          <label className="field">
            <span>Team name</span>
            <input
              type="text"
              value={formName}
              placeholder="Auto-filled from players"
              onChange={(e) => { setName(e.target.value); setNameEdited(true); }}
            />
          </label>
          {nameEdited && (
            <button className="link-btn" onClick={() => { setNameEdited(false); setName(""); }}>
              ↻ Reset to auto name
            </button>
          )}
          <label className="field">
            <span>Nickname (optional)</span>
            <input
              type="text"
              value={formNick}
              placeholder="e.g. Street Kings"
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
          <div style={{ marginTop: 6 }}>
            <button className="link-btn" disabled={!enough || loadingNames} onClick={fetchNames}>
              {loadingNames ? "✨ Thinking…" : "✨ Suggest a nickname"}
            </button>
            {suggestions && (
              <div className="player-pills">
                {suggestions.map((s) => (
                  <button key={s} className="toggle-pill out" onClick={() => setNickname(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-block" disabled={!canSubmit} onClick={submit}>
            {busy ? "Saving…" : isEdit ? "Save team" : "Add team"}
          </button>
        </>
      )}
    </div>
  );
}

export default function Teams() {
  const { adminMode } = useAdmin();
  const [teams, setTeams] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matchTeamIds, setMatchTeamIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balancing, setBalancing] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => getPlayers(setPlayers, () => setPlayers([])), []);
  useEffect(() => getTeams(setTeams), []);
  useEffect(() => getAllMatches((ms) => {
    const ids = new Set();
    ms.forEach((m) => { if (m.team1Id) ids.add(m.team1Id); if (m.team2Id) ids.add(m.team2Id); });
    setMatchTeamIds(ids);
  }), []);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  const suggestBalanced = async () => {
    setBalancing(true);
    try {
      const labelOf = (p) => playerLabel(p, players);
      const res = await suggestBalancedTeams(players.map((p) => ({ ...p, name: labelOf(p) })));
      setBalance(res);
    } finally { setBalancing(false); }
  };

  const acceptBalanced = async () => {
    for (const side of [balance.team1, balance.team2]) {
      const remaining = [...players];
      const ps = [];
      side.forEach((n) => {
        const i = remaining.findIndex((p) => playerLabel(p, players) === n);
        if (i >= 0) ps.push(remaining.splice(i, 1)[0]);
      });
      if (ps.length < TEAM_MIN_PLAYERS) continue;
      const labels = ps.map((p) => playerLabel(p, players));
      await createTeam({ name: defaultTeamName(labels), nickname: "", playerIds: ps.map((p) => p.id), playerNames: labels });
    }
    setBalance(null);
    flash("Balanced teams created.");
  };

  const removeTeam = async () => {
    await deleteTeam(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div className="page">
      <PageHeader title="Teams" subtitle={`${(teams || []).length} team(s) total`}>
        <button className="btn btn-sm" onClick={() => setCreating((c) => !c)}>
          {creating ? "Close" : "+ Create"}
        </button>
      </PageHeader>

      {adminMode && (
        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={balancing || players.length < TEAM_MIN_PLAYERS * 2}
            onClick={suggestBalanced}
          >
            {balancing ? "✨ Balancing…" : "✨ Suggest teams"}
          </button>
        </div>
      )}

      {creating && (
        <TeamForm
          players={players}
          allTeams={teams || []}
          onDone={() => setCreating(false)}
        />
      )}

      {teams === null ? (
        <Loading label="Loading teams…" />
      ) : teams.length === 0 ? (
        <Empty>No teams yet. Create your first team!</Empty>
      ) : (
        teams.map((t) => (
          <TeamCard
            key={t.id}
            team={t}
            players={players}
            adminMode={adminMode}
            hasMatches={matchTeamIds.has(t.id)}
            onEdit={setEditing}
            onDelete={setConfirmDelete}
          />
        ))
      )}

      {editing && (
        <Modal title="Edit team" onClose={() => setEditing(null)}>
          <TeamForm
            players={players}
            allTeams={(teams || []).filter((t) => t.id !== editing.id)}
            editTeam={editing}
            onDone={() => setEditing(null)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete team?" onClose={() => setConfirmDelete(null)}>
          <p className="meta">
            Delete <strong>{teamDisplayName(confirmDelete)}</strong>?
            {matchTeamIds.has(confirmDelete.id) && (
              <> ⚠️ This team has recorded matches — their history will remain.</>
            )}
          </p>
          <button className="btn btn-danger btn-block" onClick={removeTeam}>Delete</button>
        </Modal>
      )}

      {balance && (
        <Modal title="Suggested balanced teams" onClose={() => setBalance(null)}>
          <div className="card"><div className="name">Team 1</div><div className="meta">{balance.team1.join(", ") || "—"}</div></div>
          <div className="card"><div className="name">Team 2</div><div className="meta">{balance.team2.join(", ") || "—"}</div></div>
          <button className="btn btn-block" onClick={acceptBalanced}>Accept & create both</button>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
