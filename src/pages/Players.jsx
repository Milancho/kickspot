import { useEffect, useState } from "react";
import { PageHeader, Loading, Empty } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import { getPlayers } from "../firebase/service.js";
import { firebaseEnabled } from "../firebase/config.js";
import { FAKE_PLAYERS } from "../data/fakeData.js";

export default function Players() {
  const { adminMode } = useAdmin();
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

  return (
    <div className="page">
      <PageHeader title="Players" subtitle="The squad">
        {/* "Join" form is wired in Phase 3 */}
        <button className="btn btn-sm" disabled title="Coming in Phase 3">
          + Join
        </button>
      </PageHeader>

      {players === null ? (
        <Loading label="Loading players…" />
      ) : players.length === 0 ? (
        <Empty>No players yet. Be the first to join!</Empty>
      ) : (
        players.map((p) => (
          <div className="card" key={p.id}>
            <div className="list-row">
              <div>
                <div className="name">{p.name}</div>
                {p.nickname && <div className="meta">“{p.nickname}”</div>}
              </div>
              {adminMode && (
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm" disabled>
                    Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
