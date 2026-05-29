import { useEffect, useState } from "react";
import { PageHeader, Loading, Empty, Tabs, todayISO } from "../components/ui.jsx";
import { getPlayers } from "../firebase/service.js";
import { firebaseEnabled } from "../firebase/config.js";
import { FAKE_PLAYERS, FAKE_TEAMS } from "../data/fakeData.js";
import { sortStandings, points, played } from "../utils/statsCalculator.js";
import { teamDisplayName, playerLabel } from "../utils/teamName.js";

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

export default function Standings() {
  const [tab, setTab] = useState("players");
  const [date, setDate] = useState(todayISO());
  const [players, setPlayers] = useState(null);

  useEffect(() => {
    if (!firebaseEnabled) {
      setPlayers(FAKE_PLAYERS);
      return;
    }
    const unsub = getPlayers(
      (live) => setPlayers(live),
      () => setPlayers([])
    );
    return unsub;
  }, []);

  // Disambiguate same-name players (e.g. two "Marko"s) for the standings rows.
  const playerRows =
    players === null
      ? null
      : players.map((p) => ({ ...p, name: playerLabel(p, players) }));

  // Team standings are wired to Firebase in Phase 6; fake data for now.
  // Show the team's nickname when set, otherwise its name.
  const teams = FAKE_TEAMS.filter((t) => t.date === date).map((t) => ({
    ...t,
    name: teamDisplayName(t),
  }));

  return (
    <div className="page">
      <PageHeader title="Standings" subtitle="Find your game. Play your way." />

      {!firebaseEnabled && (
        <div className="notice">
          Demo mode — showing sample data. Add Firebase keys to <code>.env</code>{" "}
          for live standings.
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

      {tab === "players" &&
        (playerRows === null ? (
          <Loading label="Loading standings…" />
        ) : (
          <StandingsTable rows={playerRows} />
        ))}

      {tab === "teams" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <StandingsTable rows={teams} />
        </>
      )}
    </div>
  );
}
