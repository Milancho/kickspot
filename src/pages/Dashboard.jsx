import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loading } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import { getAllMatches, getPlayers, getTeams } from "../firebase/service.js";
import {
  computePlayerStats,
  computeWeeklyActivity,
  computePartnerStats,
  played,
} from "../utils/statsCalculator.js";
import { todayISO } from "../utils/dates.js";
import { playerLabel } from "../utils/teamName.js";

const PROJECT_ID = "kickspot-aecfd";

function StatRow({ label, value, sub }) {
  return (
    <div className="list-row" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="meta">{label}</div>
      <div style={{ textAlign: "right" }}>
        <div className="name">{value}</div>
        {sub && <div className="meta">{sub}</div>}
      </div>
    </div>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div
              style={{
                width: "100%",
                height: `${(d.count / max) * 44}px`,
                minHeight: d.count > 0 ? 4 : 0,
                background: "var(--primary)",
                borderRadius: "3px 3px 0 0",
                opacity: i === data.length - 1 ? 1 : 0.5 + (i / data.length) * 0.5,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.6rem", color: "var(--text-dim)" }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { adminMode } = useAdmin();
  const [matches, setMatches] = useState(null);
  const [players, setPlayers] = useState(null);
  const [teams, setTeams] = useState(null);

  // Redirect non-admins
  if (!adminMode) {
    navigate("/admin");
    return null;
  }

  useEffect(() => getAllMatches(setMatches), []);
  useEffect(() => getPlayers(setPlayers, () => setPlayers([])), []);
  useEffect(() => getTeams(setTeams), []);

  const loading = matches === null || players === null || teams === null;

  const stats = useMemo(() => {
    if (loading) return null;
    const today = todayISO();
    const monthStart = today.slice(0, 7) + "-01";
    const finished = matches.filter((m) => m.status !== "live");

    // App health
    const activePlayers = players.filter((p) => !p.isDeleted);
    const newThisMonth = activePlayers.filter((p) => p.createdAt >= monthStart);
    const ps = computePlayerStats(finished);
    const inactive = activePlayers.filter((p) => {
      const s = ps[p.id];
      return !s || (s.wins === 0 && s.losses === 0);
    });
    const dates = finished.map((m) => m.date).filter(Boolean).sort();
    const lastSession = dates[dates.length - 1] || "—";
    const liveNow = matches.filter((m) => m.status === "live").length;

    // Game analytics
    const weekly = computeWeeklyActivity(finished);
    const totalSets = finished.length;

    const topPlayers = activePlayers
      .map((p) => {
        const s = ps[p.id] || { wins: 0, losses: 0 };
        const p2 = s.wins + s.losses;
        return { ...p, ...s, winRate: p2 > 0 ? Math.round((s.wins / p2) * 100) : 0, played: p2 };
      })
      .filter((p) => p.played > 0)
      .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)
      .slice(0, 3);

    const partnerships = computePartnerStats(finished, activePlayers).slice(0, 3);

    const scores = finished.filter((m) => m.score1 != null && m.score2 != null);
    const avgWin = scores.length
      ? Math.round(scores.reduce((s, m) => s + Math.max(m.score1, m.score2), 0) / scores.length)
      : 0;
    const avgLoss = scores.length
      ? Math.round(scores.reduce((s, m) => s + Math.min(m.score1, m.score2), 0) / scores.length)
      : 0;

    const closest = scores.reduce((best, m) => {
      const diff = Math.abs(m.score1 - m.score2);
      return !best || diff < Math.abs(best.score1 - best.score2) ? m : best;
    }, null);

    const dominant = scores.reduce((best, m) => {
      const diff = Math.abs(m.score1 - m.score2);
      return !best || diff > Math.abs(best.score1 - best.score2) ? m : best;
    }, null);

    return {
      activePlayers: activePlayers.length,
      newThisMonth: newThisMonth.length,
      inactive: inactive.length,
      totalTeams: teams.length,
      totalSets,
      liveNow,
      lastSession,
      weekly,
      topPlayers,
      partnerships,
      avgWin,
      avgLoss,
      closest,
      dominant,
    };
  }, [matches, players, teams]);

  return (
    <div className="page">
      <PageHeader title="📊 Dashboard" subtitle="Owner view" />

      {loading ? (
        <Loading label="Loading metrics…" />
      ) : (
        <>
          {/* ── App Health ──────────────────────────────────────────────── */}
          <div className="card">
            <div className="name" style={{ marginBottom: 8 }}>🏥 App Health</div>
            <StatRow label="Active players" value={stats.activePlayers} sub={`+${stats.newThisMonth} this month`} />
            <StatRow label="Teams" value={stats.totalTeams} />
            <StatRow label="Sets played (total)" value={stats.totalSets} />
            <StatRow label="Live matches now" value={stats.liveNow} />
            <StatRow label="Last session" value={stats.lastSession} />
            <StatRow
              label="Never played"
              value={stats.inactive}
              sub={stats.inactive > 0 ? "players with 0 sets" : "everyone has played ✅"}
            />
          </div>

          {/* ── Game Analytics ──────────────────────────────────────────── */}
          <div className="card">
            <div className="name" style={{ marginBottom: 4 }}>📈 Sets per week</div>
            <div className="meta">Last 8 weeks</div>
            <MiniBarChart data={stats.weekly} />
          </div>

          <div className="card">
            <div className="name" style={{ marginBottom: 8 }}>🏆 Top players (win rate)</div>
            {stats.topPlayers.length === 0 ? (
              <div className="meta">Not enough data yet.</div>
            ) : (
              stats.topPlayers.map((p, i) => (
                <StatRow
                  key={p.id}
                  label={`${i + 1}. ${playerLabel(p, players)}`}
                  value={`${p.winRate}%`}
                  sub={`${p.wins}W · ${p.losses}L · ${p.played} sets`}
                />
              ))
            )}
          </div>

          <div className="card">
            <div className="name" style={{ marginBottom: 8 }}>🤝 Top partnerships</div>
            {stats.partnerships.length === 0 ? (
              <div className="meta">Not enough data yet.</div>
            ) : (
              stats.partnerships.map((p, i) => (
                <StatRow
                  key={i}
                  label={p.names.join(" & ")}
                  value={`${p.count} sets together`}
                  sub={`${p.wins}W · ${p.losses}L`}
                />
              ))
            )}
          </div>

          <div className="card">
            <div className="name" style={{ marginBottom: 8 }}>⚽ Score stats</div>
            <StatRow label="Avg winning score" value={stats.avgWin || "—"} />
            <StatRow label="Avg losing score" value={stats.avgLoss || "—"} />
            {stats.closest && (
              <StatRow
                label="Closest match"
                value={`${stats.closest.score1}–${stats.closest.score2}`}
                sub={`${stats.closest.team1Name} vs ${stats.closest.team2Name} · ${stats.closest.date}`}
              />
            )}
            {stats.dominant && (
              <StatRow
                label="Most dominant win"
                value={`${stats.dominant.score1}–${stats.dominant.score2}`}
                sub={`${stats.dominant.team1Name} vs ${stats.dominant.team2Name} · ${stats.dominant.date}`}
              />
            )}
          </div>

          {/* ── Technical Links ─────────────────────────────────────────── */}
          <div className="card">
            <div className="name" style={{ marginBottom: 8 }}>🔧 Technical</div>
            {[
              {
                label: "Firebase console",
                url: `https://console.firebase.google.com/project/${PROJECT_ID}/overview`,
              },
              {
                label: "Firestore usage",
                url: `https://console.firebase.google.com/project/${PROJECT_ID}/firestore/usage`,
              },
              {
                label: "Firebase Hosting",
                url: `https://console.firebase.google.com/project/${PROJECT_ID}/hosting`,
              },
              {
                label: "Anthropic console",
                url: "https://console.anthropic.com",
              },
            ].map((l) => (
              <div
                key={l.label}
                className="list-row"
                style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}
              >
                <div className="meta">{l.label}</div>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Open →
                </a>
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <div className="meta">App version: KickSpot v1</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
