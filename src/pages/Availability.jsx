import { useState } from "react";
import { PageHeader, Empty, todayISO } from "../components/ui.jsx";
import { FAKE_PLAYERS } from "../data/fakeData.js";
import { playerLabel } from "../utils/teamName.js";

/* Phase 1: local-state toggles only. Real per-date Firestore availability
 * arrives in Phase 5. */
export default function Availability() {
  const [date, setDate] = useState(todayISO());
  const [available, setAvailable] = useState(() => ({}));

  const toggle = (id) =>
    setAvailable((prev) => ({ ...prev, [id]: !prev[id] }));

  const inCount = FAKE_PLAYERS.filter((p) => available[p.id]).length;

  return (
    <div className="page">
      <PageHeader title="Availability" subtitle={`${inCount} in for this session`} />

      <div style={{ marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {FAKE_PLAYERS.length === 0 ? (
        <Empty>No players to mark.</Empty>
      ) : (
        FAKE_PLAYERS.map((p) => {
          const isIn = !!available[p.id];
          return (
            <div className="card" key={p.id}>
              <div className="list-row">
                <div className="name">{playerLabel(p, FAKE_PLAYERS)}</div>
                <button
                  className={"toggle-pill " + (isIn ? "in" : "out")}
                  onClick={() => toggle(p.id)}
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
