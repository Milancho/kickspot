import { useEffect, useMemo, useState } from "react";
import { PageHeader, Loading, Empty, Tabs, todayISO } from "../components/ui.jsx";
import { getPlayers, getTeams, getAllMatches } from "../firebase/service.js";
import { firebaseEnabled } from "../firebase/config.js";
import {
  sortStandings,
  points,
  played,
  computePlayerStats,
} from "../utils/statsCalculator.js";
import { teamDisplayName, playerLabel } from "../utils/teamName.js";
import { inRange } from "../utils/dates.js";

function StandingsTable({ rows }) {
  if (!rows.length) return <Empty>No standings yet.</Empty>;
  const sorted = sortStandings(rows);
  return (
    <table className="table">
      <thead>
        <tr>
          <th className="rank">#</th>
          <th className="col-name">Name</th>
          <th>P</th>
          <th>W</th>
          <th>L</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => (
          <tr key={row.id}>
            <td className="rank">{i + 1}</td>
            <td className="col-name">{row.name}</td>
            <td>{played(row)}</td>
            <td>{row.wins || 0}</td>
            <td>{row.losses || 0}</td>
            <td className="points">{points(row)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const RANGES = [
  { value: "all", label: "All-time" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export default function Standings() {
  const [tab, setTab] = useState("players");
  const [range, setRange] = useState("all");
  const [players, setPlayers] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => getPlayers(setPlayers, () => setPlayers([])), []);
  useEffect(() => getAllMatches(setMatches), []);
  useEffect(() => getTeams(setTeams), []);

  // Player standings: all-time uses the player docs; a range recomputes from
  // matches within that range.
  const playerRows = useMemo(() => {
    if (players === null) return null;
    const today = todayISO();
    let rows;
    if (range === "all") {
      rows = players;
    } else {
      const inWindow = matches.filter((m) => inRange(m.date, range, today));
      const stats = computePlayerStats(inWindow);
      rows = players.map((p) => ({
        ...p,
        wins: stats[p.id]?.wins || 0,
        losses: stats[p.id]?.losses || 0,
      }));
    }
    return rows.map((p) => ({ ...p, name: playerLabel(p, players) }));
  }, [players, matches, range]);

  const teamRows = teams.map((t) => ({ ...t, name: teamDisplayName(t) }));

  return (
    <div className="page">
      <PageHeader title="Standings" subtitle="Find your game. Play your way." />

      {!firebaseEnabled && (
        <div className="notice">
          Demo mode — sample data. Add Firebase keys to <code>.env</code> for live
          standings.
        </div>
      )}

      <Tabs
        options={[
          { value: "players", label: "Players" },
          { value: "teams", label: "Teams" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "players" && (
        <>
          <Tabs options={RANGES} value={range} onChange={setRange} />
          {playerRows === null ? (
            <Loading label="Loading standings…" />
          ) : (
            <StandingsTable rows={playerRows} />
          )}
        </>
      )}

      {tab === "teams" && <StandingsTable rows={teamRows} />}

    </div>
  );
}
