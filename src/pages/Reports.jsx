import { useEffect, useMemo, useState } from "react";
import { PageHeader, Tabs, Empty } from "../components/ui.jsx";
import { getAllMatches, getPlayers, getTeams } from "../firebase/service.js";
import {
  computePlayerStats,
  computeTeamStats,
} from "../utils/statsCalculator.js";
import { teamDisplayName, playerLabel } from "../utils/teamName.js";
import { inRange, todayISO } from "../utils/dates.js";

function topEntry(stats) {
  let best = null;
  for (const [id, s] of Object.entries(stats)) {
    if (!best || s.wins > best.wins) best = { id, ...s };
  }
  return best;
}

export default function Reports() {
  const [range, setRange] = useState("week");
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => getAllMatches(setMatches), []);
  useEffect(() => getPlayers(setPlayers, () => setPlayers([])), []);
  useEffect(() => getTeams(setTeams), []);

  const report = useMemo(() => {
    const today = todayISO();
    const inWindow = matches.filter((m) => inRange(m.date, range, today));
    const ps = computePlayerStats(inWindow);
    const ts = computeTeamStats(inWindow);
    const topP = topEntry(ps);
    const topT = topEntry(ts);
    const player = topP && players.find((p) => p.id === topP.id);
    const team = topT && teams.find((t) => t.id === topT.id);
    return {
      total: inWindow.length,
      topPlayer: player
        ? { name: playerLabel(player, players), wins: topP.wins }
        : null,
      topTeam: team
        ? { name: teamDisplayName(team), wins: topT.wins }
        : null,
    };
  }, [matches, players, teams, range]);

  const label = { week: "Past 7 days", month: "Past month", year: "Past year" }[
    range
  ];

  return (
    <div className="page">
      <PageHeader title="Reports" subtitle="Summaries over time" />

      <Tabs
        options={[
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "year", label: "Year" },
        ]}
        value={range}
        onChange={setRange}
      />

      <div className="page-subtitle" style={{ marginBottom: 12 }}>
        {label}
      </div>

      {report.total === 0 ? (
        <Empty>No matches in this period.</Empty>
      ) : (
        <>
          <div className="card">
            <div className="list-row">
              <div className="name">Sets played</div>
              <div className="points">{report.total}</div>
            </div>
          </div>
          <div className="card">
            <div className="meta">🏆 Top player</div>
            <div className="list-row" style={{ marginTop: 4 }}>
              <div className="name">{report.topPlayer?.name || "—"}</div>
              <div className="meta">{report.topPlayer?.wins || 0} sets won</div>
            </div>
          </div>
          <div className="card">
            <div className="meta">🛡️ Top team</div>
            <div className="list-row" style={{ marginTop: 4 }}>
              <div className="name">{report.topTeam?.name || "—"}</div>
              <div className="meta">{report.topTeam?.wins || 0} sets won</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
