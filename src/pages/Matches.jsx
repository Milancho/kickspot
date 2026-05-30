import { useEffect, useState } from "react";
import { PageHeader, Empty, Loading, Modal, todayISO } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import {
  getMatches,
  getTeams,
  getAllMatches,
  startMatch,
  finishMatch,
  saveMatch,
  updateMatch,
  deleteMatch,
} from "../firebase/service.js";
import { teamDisplayName } from "../utils/teamName.js";
import { generateMatchCommentary } from "../claude/aiService.js";
import { WIN_TARGET } from "../constants.js";
import { predictWinner } from "../utils/statsCalculator.js";

function ScoreInputs({ s1, s2, setS1, setS2 }) {
  const num = (v) => v.replace(/\D/g, "").slice(0, 2);
  return (
    <div className="score-row">
      <input type="text" inputMode="numeric" value={s1} onChange={(e) => setS1(num(e.target.value))} />
      <span className="sep">:</span>
      <input type="text" inputMode="numeric" value={s2} onChange={(e) => setS2(num(e.target.value))} />
    </div>
  );
}

function validateScores(s1, s2) {
  const a = Number(s1);
  const b = Number(s2);
  if (s1 === "" || s2 === "") return "Enter both scores.";
  if (a === b) return "A set can't end in a draw — one team must win.";
  if (Math.max(a, b) < WIN_TARGET) return `The winning team must reach ${WIN_TARGET}.`;
  return "";
}

/** Form to START a match (pick teams, no score yet). */
function StartMatchForm({ date, teams, allMatches, onStarted, onSaved }) {
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [mode, setMode] = useState("live"); // "live" | "direct"
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [busy, setBusy] = useState(false);

  const team1 = teams.find((t) => t.id === t1);
  const team2 = teams.find((t) => t.id === t2);
  const prediction =
    team1 && team2
      ? predictWinner(team1.playerIds || [], team2.playerIds || [], allMatches)
      : null;
  const scoreError = mode === "direct" ? validateScores(s1, s2) : "";
  const canStart = t1 && t2 && t1 !== t2 && !busy;
  const canSave = canStart && !scoreError;

  const buildMatchData = () => ({
    date,
    team1Id: team1.id,
    team2Id: team2.id,
    team1Name: teamDisplayName(team1),
    team2Name: teamDisplayName(team2),
    team1PlayerIds: team1.playerIds,
    team2PlayerIds: team2.playerIds,
    team1Players: team1.playerNames,
    team2Players: team2.playerNames,
  });

  const handleStart = async () => {
    if (!canStart) return;
    setBusy(true);
    try {
      await startMatch(buildMatchData());
      onStarted();
    } finally { setBusy(false); }
  };

  const handleSaveDirect = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      const match = { ...buildMatchData(), score1: Number(s1), score2: Number(s2) };
      await saveMatch(match);
      onSaved(match);
    } finally { setBusy(false); }
  };

  if (teams.length < 2) {
    return <div className="notice">Need at least two teams to record a match. Create teams on the Teams page first.</div>;
  }

  return (
    <div className="card">
      <label className="field">
        <span>Team 1</span>
        <select value={t1} onChange={(e) => { setT1(e.target.value); if (t2 === e.target.value) setT2(""); }}>
          <option value="">Select…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{teamDisplayName(t)}</option>)}
        </select>
      </label>
      <label className="field">
        <span>Team 2</span>
        <select value={t2} onChange={(e) => setT2(e.target.value)}>
          <option value="">Select…</option>
          {teams.filter((t) => t.id !== t1).map((t) => <option key={t.id} value={t.id}>{teamDisplayName(t)}</option>)}
        </select>
      </label>

      {prediction && (
        <div className="prediction-bar">
          <span className="prediction-t1">{teamDisplayName(team1)} {prediction.team1Pct}%</span>
          <div className="prediction-track">
            <div className="prediction-fill" style={{ width: `${prediction.team1Pct}%` }} />
          </div>
          <span className="prediction-t2">{prediction.team2Pct}% {teamDisplayName(team2)}</span>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="btn btn-block" disabled={!canStart} onClick={handleStart}>
          {busy && mode === "live" ? "Starting…" : "🟢 Match is playing now (enter score later)"}
        </button>
        <div className="meta" style={{ textAlign: "center" }}>— or —</div>
        <label className="field"><span>Set score (first to {WIN_TARGET} wins)</span></label>
        <ScoreInputs s1={s1} s2={s2} setS1={setS1} setS2={setS2} />
        {(s1 || s2) && scoreError && <div className="error-text">{scoreError}</div>}
        <button className="btn btn-ghost btn-block" disabled={!canSave} onClick={handleSaveDirect}>
          {busy && mode === "direct" ? "Saving…" : "💾 Match finished — save result now"}
        </button>
      </div>
    </div>
  );
}

/** Form to FINISH a live match — just enter the score. */
function FinishMatchForm({ match, teams, onDone }) {
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [busy, setBusy] = useState(false);
  const error = validateScores(s1, s2);

  const save = async () => {
    if (error || busy) return;
    setBusy(true);
    try {
      await finishMatch(match.id, Number(s1), Number(s2));
      onDone({ ...match, score1: Number(s1), score2: Number(s2) });
    } finally { setBusy(false); }
  };

  const t1 = teams.find((t) => t.id === match.team1Id);
  const t2 = teams.find((t) => t.id === match.team2Id);

  return (
    <>
      <div className="meta" style={{ marginBottom: 8, textAlign: "center" }}>
        <strong>{match.team1Name}</strong> vs <strong>{match.team2Name}</strong>
      </div>
      <label className="field"><span>Final score (first to {WIN_TARGET} wins)</span></label>
      <ScoreInputs s1={s1} s2={s2} setS1={setS1} setS2={setS2} />
      {(s1 || s2) && error && <div className="error-text">{error}</div>}
      <button className="btn btn-block" disabled={!!error || busy} onClick={save}>
        {busy ? "Saving…" : "Finish match"}
      </button>
    </>
  );
}

function EditScoreForm({ match, onDone }) {
  const [s1, setS1] = useState(String(match.score1 || ""));
  const [s2, setS2] = useState(String(match.score2 || ""));
  const [busy, setBusy] = useState(false);
  const error = validateScores(s1, s2);

  const save = async () => {
    if (error || busy) return;
    setBusy(true);
    try {
      await updateMatch(match.id, { score1: Number(s1), score2: Number(s2) });
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="meta" style={{ marginBottom: 6 }}>{match.team1Name} vs {match.team2Name}</div>
      <ScoreInputs s1={s1} s2={s2} setS1={setS1} setS2={setS2} />
      {error && <div className="error-text">{error}</div>}
      <button className="btn btn-block" disabled={!!error || busy} onClick={save}>
        {busy ? "Saving…" : "Save score"}
      </button>
    </>
  );
}

function MatchCard({ match, adminMode, onFinish, onEdit, onDelete }) {
  const isLive = match.status === "live";
  const t1win = !isLive && match.score1 > match.score2;

  return (
    <div className={"card" + (isLive ? " match-live" : "")}>
      {isLive && <div className="live-badge">🟢 Live</div>}
      <div className="list-row">
        <div className="name" style={{ flex: 1 }}>
          {match.team1Name} {!isLive && t1win && <span className="winner-tag">▲</span>}
        </div>
        <div className="points">
          {isLive ? "—" : `${match.score1} – ${match.score2}`}
        </div>
        <div className="name" style={{ flex: 1, textAlign: "right" }}>
          {!isLive && !t1win && <span className="winner-tag">▲</span>} {match.team2Name}
        </div>
      </div>
      <div className="row-actions" style={{ marginTop: 8, justifyContent: "flex-end" }}>
        {isLive && (
          <>
            <button className="btn btn-sm" onClick={() => onFinish(match)}>
              Finish
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(match)}>
              Cancel
            </button>
          </>
        )}
        {adminMode && !isLive && (
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(match)}>Edit</button>
        )}
        {adminMode && !isLive && (
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(match)}>Delete</button>
        )}
      </div>
    </div>
  );
}

export default function Matches() {
  const { adminMode } = useAdmin();
  const [date, setDate] = useState(todayISO());
  const [matches, setMatches] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [adding, setAdding] = useState(false);
  const [finishing, setFinishing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [commentary, setCommentary] = useState(null);

  useEffect(() => getMatches(date, setMatches), [date]);
  useEffect(() => getAllMatches(setAllMatches), []);
  useEffect(() => getTeams(setTeams), []);

  const onSaved = async (match) => {
    setAdding(false);
    setCommentary({ loading: true, text: "" });
    const text = await generateMatchCommentary(
      match.team1Name, match.team2Name,
      match.score1, match.score2,
      match.team1Players, match.team2Players
    );
    setCommentary({ loading: false, text });
  };

  const onFinished = async (match) => {
    setFinishing(null);
    setCommentary({ loading: true, text: "" });
    const text = await generateMatchCommentary(
      match.team1Name, match.team2Name,
      match.score1, match.score2,
      match.team1Players, match.team2Players
    );
    setCommentary({ loading: false, text });
  };

  const liveMatches = (matches || []).filter((m) => m.status === "live");
  const finishedMatches = (matches || []).filter((m) => m.status !== "live");

  return (
    <div className="page">
      <PageHeader title="Matches" subtitle={`${finishedMatches.length} set(s) played`}>
        <button className="btn btn-sm" onClick={() => setAdding((a) => !a)}>
          {adding ? "Close" : "+ Match"}
        </button>
      </PageHeader>

      <div style={{ marginBottom: 12 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {adding && (
        <StartMatchForm
          date={date}
          teams={teams}
          allMatches={allMatches}
          onStarted={() => setAdding(false)}
          onSaved={onSaved}
        />
      )}

      {matches === null ? (
        <Loading label="Loading matches…" />
      ) : matches.length === 0 ? (
        <Empty>No matches recorded for this date.</Empty>
      ) : (
        <>
          {liveMatches.map((m) => (
            <MatchCard key={m.id} match={m} adminMode={adminMode}
              onFinish={setFinishing} onEdit={setEditing} onDelete={setConfirmDelete} />
          ))}
          {finishedMatches.map((m) => (
            <MatchCard key={m.id} match={m} adminMode={adminMode}
              onFinish={setFinishing} onEdit={setEditing} onDelete={setConfirmDelete} />
          ))}
        </>
      )}

      {finishing && (
        <Modal title="Finish match" onClose={() => setFinishing(null)}>
          <FinishMatchForm match={finishing} teams={teams} onDone={onFinished} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit score" onClose={() => setEditing(null)}>
          <EditScoreForm match={editing} onDone={() => setEditing(null)} />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete match?" onClose={() => setConfirmDelete(null)}>
          <p className="meta">
            {confirmDelete.status === "live"
              ? `Cancel the live match ${confirmDelete.team1Name} vs ${confirmDelete.team2Name}? No stats are affected.`
              : `Delete ${confirmDelete.team1Name} vs ${confirmDelete.team2Name}? Stats will recalculate.`}
          </p>
          <button className="btn btn-danger btn-block" onClick={async () => { await deleteMatch(confirmDelete.id); setConfirmDelete(null); }}>
            Delete
          </button>
        </Modal>
      )}

      {commentary && (
        <Modal title="Match commentary" onClose={() => setCommentary(null)}>
          {commentary.loading ? <Loading label="Claude is writing…" /> : <p style={{ lineHeight: 1.5 }}>{commentary.text}</p>}
        </Modal>
      )}
    </div>
  );
}
