import { useEffect, useState } from "react";
import { PageHeader, Empty, Loading, Modal, todayISO } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import {
  getMatches,
  getTeams,
  saveMatch,
  updateMatch,
  deleteMatch,
} from "../firebase/service.js";
import { teamDisplayName } from "../utils/teamName.js";
import { generateMatchCommentary } from "../claude/aiService.js";
import { WIN_TARGET } from "../constants.js";
import { formatDate } from "../utils/dates.js";

function ScoreInputs({ s1, s2, setS1, setS2 }) {
  const num = (v) => v.replace(/\D/g, "").slice(0, 2);
  return (
    <div className="score-row">
      <input
        type="text"
        inputMode="numeric"
        value={s1}
        onChange={(e) => setS1(num(e.target.value))}
      />
      <span className="sep">:</span>
      <input
        type="text"
        inputMode="numeric"
        value={s2}
        onChange={(e) => setS2(num(e.target.value))}
      />
    </div>
  );
}

function validateScores(s1, s2) {
  const a = Number(s1);
  const b = Number(s2);
  if (s1 === "" || s2 === "") return "Enter both scores.";
  if (a === b) return "A set can't be a draw — one team must win.";
  if (Math.max(a, b) < WIN_TARGET)
    return `The winning team must reach ${WIN_TARGET}.`;
  return "";
}

function AddMatchForm({ date, teams, onSaved }) {
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [busy, setBusy] = useState(false);

  const team1 = teams.find((t) => t.id === t1);
  const team2 = teams.find((t) => t.id === t2);
  const missingIds = (team1 && !team1.playerIds?.length) || (team2 && !team2.playerIds?.length);

  const error = missingIds
    ? "Team player data is missing. Open Teams, edit each team, and re-save."
    : t1 && t2 && t1 === t2
    ? "Pick two different teams."
    : validateScores(s1, s2);
  const ready = t1 && t2 && t1 !== t2 && !missingIds && !validateScores(s1, s2) && !busy;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      const match = {
        date,
        team1Id: team1.id,
        team2Id: team2.id,
        team1Name: teamDisplayName(team1),
        team2Name: teamDisplayName(team2),
        team1PlayerIds: team1.playerIds,
        team2PlayerIds: team2.playerIds,
        team1Players: team1.playerNames,
        team2Players: team2.playerNames,
        score1: Number(s1),
        score2: Number(s2),
      };
      await saveMatch(match);
      onSaved(match);
    } finally {
      setBusy(false);
    }
  };

  if (teams.length < 2) {
    return (
      <div className="notice">
        Need at least two teams to record a match. Create teams on the Teams page first.
      </div>
    );
  }

  return (
    <div className="card">
      <label className="field">
        <span>Team 1</span>
        <select value={t1} onChange={(e) => { setT1(e.target.value); if (t2 === e.target.value) setT2(""); }}>
          <option value="">Select…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {teamDisplayName(t)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Team 2</span>
        <select value={t2} onChange={(e) => setT2(e.target.value)}>
          <option value="">Select…</option>
          {teams
            .filter((t) => t.id !== t1)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {teamDisplayName(t)}
              </option>
            ))}
        </select>
      </label>
      <label className="field">
        <span>Set score (first to {WIN_TARGET} wins)</span>
      </label>
      <ScoreInputs s1={s1} s2={s2} setS1={setS1} setS2={setS2} />
      {(s1 || s2 || (t1 && t2)) && error && (
        <div className="error-text">{error}</div>
      )}
      <button className="btn btn-block" disabled={!ready} onClick={submit}>
        {busy ? "Saving…" : "Save result"}
      </button>
    </div>
  );
}

function EditScoreForm({ match, onDone }) {
  const [s1, setS1] = useState(String(match.score1));
  const [s2, setS2] = useState(String(match.score2));
  const [busy, setBusy] = useState(false);
  const error = validateScores(s1, s2);

  const save = async () => {
    if (error || busy) return;
    setBusy(true);
    try {
      await updateMatch(match.id, { score1: Number(s1), score2: Number(s2) });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="meta" style={{ marginBottom: 6 }}>
        {match.team1Name} vs {match.team2Name}
      </div>
      <ScoreInputs s1={s1} s2={s2} setS1={setS1} setS2={setS2} />
      {error && <div className="error-text">{error}</div>}
      <button className="btn btn-block" disabled={!!error || busy} onClick={save}>
        {busy ? "Saving…" : "Save score"}
      </button>
    </>
  );
}

function MatchCard({ match, adminMode, onEdit, onDelete }) {
  const t1win = match.score1 > match.score2;
  return (
    <div className="card">
      <div className="list-row">
        <div className="name" style={{ flex: 1 }}>
          {match.team1Name} {t1win && <span className="winner-tag">▲</span>}
        </div>
        <div className="points">
          {match.score1} – {match.score2}
        </div>
        <div className="name" style={{ flex: 1, textAlign: "right" }}>
          {!t1win && <span className="winner-tag">▲</span>} {match.team2Name}
        </div>
      </div>
      {adminMode && (
        <div className="row-actions" style={{ marginTop: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(match)}>
            Edit
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(match)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Matches() {
  const { adminMode } = useAdmin();
  const [date, setDate] = useState(todayISO());
  const [matches, setMatches] = useState(null);
  const [teams, setTeams] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [commentary, setCommentary] = useState(null); // { loading, text }

  useEffect(() => getMatches(date, setMatches), [date]);
  useEffect(() => getTeams(setTeams), []);

  const onSaved = async (match) => {
    setAdding(false);
    setCommentary({ loading: true, text: "" });
    const text = await generateMatchCommentary(
      match.team1Name,
      match.team2Name,
      match.score1,
      match.score2,
      match.team1Players,
      match.team2Players
    );
    setCommentary({ loading: false, text });
  };

  return (
    <div className="page">
      <PageHeader title="Matches" subtitle={`${(matches || []).length} played this session`}>
        <button className="btn btn-sm" onClick={() => setAdding((a) => !a)}>
          {adding ? "Close" : "+ Result"}
        </button>
      </PageHeader>

      <div style={{ marginBottom: 12 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <span className="meta" style={{ marginLeft: 8 }}>{formatDate(date)}</span>
      </div>

      {adding && <AddMatchForm date={date} teams={teams} onSaved={onSaved} />}

      {matches === null ? (
        <Loading label="Loading matches…" />
      ) : matches.length === 0 ? (
        <Empty>No matches recorded for this date.</Empty>
      ) : (
        matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            adminMode={adminMode}
            onEdit={setEditing}
            onDelete={setConfirmDelete}
          />
        ))
      )}

      {editing && (
        <Modal title="Edit score" onClose={() => setEditing(null)}>
          <EditScoreForm match={editing} onDone={() => setEditing(null)} />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete match?" onClose={() => setConfirmDelete(null)}>
          <p className="meta">
            Delete {confirmDelete.team1Name} {confirmDelete.score1}–
            {confirmDelete.score2} {confirmDelete.team2Name}? Stats will
            recalculate.
          </p>
          <button
            className="btn btn-danger btn-block"
            onClick={async () => {
              await deleteMatch(confirmDelete.id);
              setConfirmDelete(null);
            }}
          >
            Delete
          </button>
        </Modal>
      )}

      {commentary && (
        <Modal title="Match commentary" onClose={() => setCommentary(null)}>
          {commentary.loading ? (
            <Loading label="Claude is writing…" />
          ) : (
            <p style={{ lineHeight: 1.5 }}>{commentary.text}</p>
          )}
        </Modal>
      )}
    </div>
  );
}
