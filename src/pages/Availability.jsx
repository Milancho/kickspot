import { useEffect, useState } from "react";
import { PageHeader, Loading, Empty, todayISO } from "../components/ui.jsx";
import { getPlayers, getAvailability, setAvailability } from "../firebase/service.js";
import { playerLabel } from "../utils/teamName.js";
import { formatDate } from "../utils/dates.js";

export default function Availability() {
  const [date, setDate] = useState(todayISO());
  const [players, setPlayers] = useState(null);
  const [avail, setAvail] = useState({}); // playerId -> isAvailable

  useEffect(() => getPlayers(setPlayers, () => setPlayers([])), []);

  useEffect(() => {
    const unsub = getAvailability(date, (rows) => {
      const map = {};
      rows.forEach((r) => {
        map[r.playerId] = r.isAvailable;
      });
      setAvail(map);
    });
    return unsub;
  }, [date]);

  const inCount = (players || []).filter((p) => avail[p.id]).length;

  return (
    <div className="page">
      <PageHeader
        title="Availability"
        subtitle={`${inCount} in for this session`}
      />

      <div style={{ marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <span className="meta" style={{ marginLeft: 8 }}>{formatDate(date)}</span>
      </div>

      {players === null ? (
        <Loading label="Loading players…" />
      ) : players.length === 0 ? (
        <Empty>No players yet — add some on the Players page.</Empty>
      ) : (
        players.map((p) => {
          const isIn = !!avail[p.id];
          return (
            <div className="card" key={p.id}>
              <div className="list-row">
                <div className="name">{playerLabel(p, players)}</div>
                <button
                  className={"toggle-pill " + (isIn ? "in" : "out")}
                  onClick={() => setAvailability(p, date, !isIn)}
                >
                  {isIn ? "I'm in" : "I'm out"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
