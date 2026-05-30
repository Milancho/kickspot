import { useEffect, useMemo, useState } from "react";
import { PageHeader, Empty, Loading, Modal, todayISO } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import {
  getTeams,
  getAllTeams,
  getPlayers,
  getAvailability,
  getAllMatches,
  createTeam,
  updateTeam,
  deleteTeam,
  copyTeamsFromDate,
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
          <span className="meta">
            {team.wins}W · {team.losses}L
          </span>
          {adminMode && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(team)}>
                Edit
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onDelete(team, hasMatches)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      <div className="meta" style={{ marginTop: 6 }}>
        {list.join(", ")}
      </div>
    </div>
  );
}

function TeamForm({ date, pool, players, assignedIds, knownTeams, editTeam, onDone }) {
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
  const enough =
    selected.length >= TEAM_MIN_PLAYERS && selected.length <= TEAM_MAX_PLAYERS;

  // Reuse detection (create mode only): same player set already has a team.
  const existing =
    !isEdit && enough && findTeamByPlayers(knownTeams, selected);
  const existsThisDate = existing && existing.date === date;

  const formName = existing ? existing.name : nameEdited ? name : autoName;
  const formNick = existing ? existing.nickname || "" : nickname;

  const toggle = (id) =>
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= TEAM_MAX_PLAYERS) return prev;
      return [...prev, id];
    });

  const canSubmit =
    enough && (existing ? !existsThisDate : formName.trim().length > 0) && !busy;

  const fetchNames = async () => {
    setLoadingNames(true);
    try {
      setSuggestions(await suggestTeamNames(labels));
    } finally {
      setLoadingNames(false);
    }
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
        const src = existing || { name: formName, nickname: formNick };
        await createTeam({
          date,
          name: src.name.trim(),
          nickname: (src.nickname || "").trim(),
          playerIds: [...selected],
          playerNames: existing ? existing.playerNames : labels,
        });
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="meta">
        Select players — {selected.length}/{TEAM_MAX_PLAYERS} (min{" "}
        {TEAM_MIN_PLAYERS})
      </div>
      <div className="player-pills">
        {pool.map((p) => {
          const on = selected.includes(p.id);
          const assignedElsewhere = assignedIds.has(p.id) && !on;
          const capped = !on && selected.length >= TEAM_MAX_PLAYERS;
          return (
            <button
              key={p.id}
              className={"toggle-pill " + (on ? "in" : "out")}
              disabled={assignedElsewhere || capped}
              title={assignedElsewhere ? "Already on a team this date" : ""}
              onClick={() => toggle(p.id)}
            >
              {playerLabel(p, players)}
            </button>
          );
        })}
      </div>

      {existing && (
        <div className="notice">
          {existsThisDate
            ? `These players already form “${teamDisplayName(existing)}” for this date — no duplicate created.`
            : `Existing team “${teamDisplayName(existing)}” (${existing.date}) — reusing it instead of making a new one.`}
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

      {!existing && (
        <div style={{ marginTop: 6 }}>
          <button
            className="link-btn"
            disabled={!enough || loadingNames}
            onClick={fetchNames}
          >
            {loadingNames ? "✨ Thinking…" : "✨ Suggest a nickname"}
          </button>
          {suggestions && (
            <div className="player-pills">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="toggle-pill out"
                  onClick={() => setNickname(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button className="btn btn-block" disabled={!canSubmit} onClick={submit}>
        {isEdit
          ? "Save team"
          : existing
          ? existsThisDate
            ? "Already a team for this date"
            : "Reuse team"
          : "Add team"}
      </button>
    </div>
  );
}

export default function Teams() {
  const { adminMode } = useAdmin();
  const [date, setDate] = useState(todayISO());
  const [teams, setTeams] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [availIds, setAvailIds] = useState(null); // Set or null (none set)
  const [matchTeamIds, setMatchTeamIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [balance, setBalance] = useState(null); // { team1, team2 } suggestion
  const [balancing, setBalancing] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => getPlayers(setPlayers, () => setPlayers([])), []);
  useEffect(() => getAllTeams(setAllTeams), []);
  useEffect(
    () =>
      getAllMatches((ms) => {
        const ids = new Set();
        ms.forEach((m) => {
          if (m.team1Id) ids.add(m.team1Id);
          if (m.team2Id) ids.add(m.team2Id);
        });
        setMatchTeamIds(ids);
      }),
    []
  );
  useEffect(() => getTeams(date, setTeams), [date]);
  useEffect(
    () =>
      getAvailability(date, (rows) => {
        const ins = rows.filter((r) => r.isAvailable);
        setAvailIds(ins.length ? new Set(ins.map((r) => r.playerId)) : null);
      }),
    [date]
  );

  // Selection pool: available players for the date, or all if none marked.
  const pool = useMemo(() => {
    if (availIds) return players.filter((p) => availIds.has(p.id));
    return players;
  }, [players, availIds]);

  const assignedIds = useMemo(() => {
    const s = new Set();
    (teams || []).forEach((t) =>
      (t.playerIds || []).forEach((id) => s.add(id))
    );
    return s;
  }, [teams]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const suggestBalanced = async () => {
    setBalancing(true);
    try {
      const labelOf = (p) => playerLabel(p, players);
      const res = await suggestBalancedTeams(pool.map((p) => ({ ...p, name: labelOf(p) })));
      setBalance(res);
    } finally {
      setBalancing(false);
    }
  };

  const resolveByLabel = (names) => {
    // Map suggested labels back to player objects (consume each once).
    const remaining = [...pool];
    const picked = [];
    names.forEach((n) => {
      const i = remaining.findIndex((p) => playerLabel(p, players) === n);
      if (i >= 0) picked.push(remaining.splice(i, 1)[0]);
    });
    return picked;
  };

  const acceptBalanced = async () => {
    for (const side of [balance.team1, balance.team2]) {
      const ps = resolveByLabel(side);
      if (ps.length < TEAM_MIN_PLAYERS) continue;
      const labels = ps.map((p) => playerLabel(p, players));
      await createTeam({
        date,
        name: defaultTeamName(labels),
        nickname: "",
        playerIds: ps.map((p) => p.id),
        playerNames: labels,
      });
    }
    setBalance(null);
    flash("Balanced teams created.");
  };

  const removeTeam = async () => {
    await deleteTeam(confirmDelete.id);
    setConfirmDelete(null);
  };

  const doCopy = async () => {
    const from = prompt("Copy teams from which date? (YYYY-MM-DD)", "2026-05-22");
    if (!from) return;
    const n = await copyTeamsFromDate(from, date);
    flash(n ? `Copied ${n} team(s) from ${from}.` : `No teams found on ${from}.`);
  };

  return (
    <div className="page">
      <PageHeader title="Teams" subtitle={`${(teams || []).length} team(s) this session`}>
        <button className="btn btn-sm" onClick={() => setCreating((c) => !c)}>
          {creating ? "Close" : "+ Create"}
        </button>
      </PageHeader>

      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {adminMode && (
          <>
            <button
              className="btn btn-ghost btn-sm"
              disabled={balancing || pool.length < TEAM_MIN_PLAYERS * 2}
              onClick={suggestBalanced}
            >
              {balancing ? "✨ Balancing…" : "✨ Suggest teams"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={doCopy}>
              Copy from date
            </button>
          </>
        )}
      </div>

      {availIds && (
        <div className="notice">
          Showing {pool.length} player(s) marked available for this date.
        </div>
      )}

      {creating && (
        <TeamForm
          date={date}
          pool={pool}
          players={players}
          assignedIds={assignedIds}
          knownTeams={allTeams}
          onDone={() => setCreating(false)}
        />
      )}

      {teams === null ? (
        <Loading label="Loading teams…" />
      ) : teams.length === 0 ? (
        <Empty>No teams formed for this date.</Empty>
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
            date={date}
            pool={players}
            players={players}
            assignedIds={new Set()}
            knownTeams={allTeams}
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
              <>
                {" "}
                ⚠️ This team has recorded matches — deleting it removes the team
                but leaves the match history.
              </>
            )}
          </p>
          <button className="btn btn-danger btn-block" onClick={removeTeam}>
            Delete
          </button>
        </Modal>
      )}

      {balance && (
        <Modal title="Suggested balanced teams" onClose={() => setBalance(null)}>
          <div className="card">
            <div className="name">Team 1</div>
            <div className="meta">{balance.team1.join(", ") || "—"}</div>
          </div>
          <div className="card">
            <div className="name">Team 2</div>
            <div className="meta">{balance.team2.join(", ") || "—"}</div>
          </div>
          <button className="btn btn-block" onClick={acceptBalanced}>
            Accept & create both
          </button>
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
