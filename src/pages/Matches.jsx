import { useState } from "react";
import { PageHeader, Empty, todayISO } from "../components/ui.jsx";
import { FAKE_MATCHES } from "../data/fakeData.js";

export default function Matches() {
  const [date, setDate] = useState(todayISO());
  const matches = FAKE_MATCHES.filter((m) => m.date === date);

  return (
    <div className="page">
      <PageHeader title="Matches" subtitle={`${matches.length} played this session`}>
        <button className="btn btn-sm" disabled title="Coming in Phase 7">
          + Result
        </button>
      </PageHeader>

      <div style={{ marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {matches.length === 0 ? (
        <Empty>No matches recorded for this date.</Empty>
      ) : (
        matches.map((m) => (
          <div className="card" key={m.id}>
            <div className="list-row">
              <div className="name">{m.team1Name}</div>
              <div className="points">
                {m.score1} – {m.score2}
              </div>
              <div className="name">{m.team2Name}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
