import { useEffect, useState } from "react";
import { PageHeader, Loading, Empty, Modal } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import {
  getPlayers,
  addPlayer,
  updatePlayer,
  softDeletePlayer,
} from "../firebase/service.js";
import { playerLabel } from "../utils/teamName.js";

const contactsSupported =
  typeof navigator !== "undefined" &&
  "contacts" in navigator &&
  "ContactsManager" in window;

function PlayerForm({ initial, onSubmit, onClose, submitLabel }) {
  const [name, setName] = useState(initial?.name || "");
  const [nickname, setNickname] = useState(initial?.nickname || "");
  const [busy, setBusy] = useState(false);

  const pickContact = async () => {
    try {
      const results = await navigator.contacts.select(["name"], { multiple: false });
      if (results && results[0]?.name?.[0]) {
        setName(results[0].name[0]);
      }
    } catch {
      /* user cancelled or API unavailable */
    }
  };

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), nickname: nickname.trim() });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <label className="field">
        <span>Name</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={name}
            autoFocus
            placeholder="Player name"
            style={{ flex: 1 }}
            onChange={(e) => setName(e.target.value)}
          />
          {contactsSupported && (
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              title="Pick from contacts"
              onClick={pickContact}
            >
              📋
            </button>
          )}
        </div>
      </label>
      <label className="field">
        <span>Nickname (optional)</span>
        <input
          type="text"
          value={nickname}
          placeholder="e.g. Rocket"
          onChange={(e) => setNickname(e.target.value)}
        />
      </label>
      <button
        className="btn btn-block"
        disabled={!name.trim() || busy}
        onClick={submit}
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </>
  );
}

export default function Players() {
  const { adminMode } = useAdmin();
  const [players, setPlayers] = useState(null);
  const [joining, setJoining] = useState(false);
  const [editing, setEditing] = useState(null); // player or null
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const unsub = getPlayers(
      (live) => setPlayers(live),
      () => setPlayers([])
    );
    return unsub;
  }, []);

  return (
    <div className="page">
      <PageHeader title="Players" subtitle="The squad">
        {adminMode && (
          <button className="btn btn-sm" onClick={() => setJoining(true)}>
            + Add player
          </button>
        )}
      </PageHeader>

      {players === null ? (
        <Loading label="Loading players…" />
      ) : players.length === 0 ? (
        <Empty>No players yet.{adminMode ? ' Tap “+ Add player” to get started.' : ' Ask the admin to add players.'}</Empty>
      ) : (
        players.map((p) => {
          const label = playerLabel(p, players);
          const initials = label.split(/[\s(&]/)[0].slice(0, 2).toUpperCase();
          const winRate = p.wins + p.losses > 0
            ? Math.round((p.wins / (p.wins + p.losses)) * 100)
            : null;
          const avatarColor = winRate === null ? "var(--surface-2)"
            : winRate >= 60 ? "var(--primary)"
            : winRate >= 40 ? "var(--accent)"
            : "var(--danger)";
          return (
          <div className="card" key={p.id}>
            <div className="list-row">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="player-avatar" style={{ background: avatarColor }}>
                  {initials}
                </div>
                <div>
                  <div className="name">{label}</div>
                  <div className="meta">
                    {p.wins}W · {p.losses}L{winRate !== null ? ` · ${winRate}%` : ""}
                  </div>
                </div>
              </div>
              {adminMode && (
                <div className="row-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditing(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirmDelete(p)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })
      )}

      {joining && (
        <Modal title="Join the squad" onClose={() => setJoining(false)}>
          <PlayerForm
            onSubmit={addPlayer}
            onClose={() => setJoining(false)}
            submitLabel="Join"
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit player" onClose={() => setEditing(null)}>
          <PlayerForm
            initial={editing}
            onSubmit={(data) => updatePlayer(editing.id, data)}
            onClose={() => setEditing(null)}
            submitLabel="Save"
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete player?" onClose={() => setConfirmDelete(null)}>
          <p className="meta">
            Remove <strong>{confirmDelete.name}</strong>? Their match history is
            kept (soft delete) — they just disappear from lists.
          </p>
          <button
            className="btn btn-danger btn-block"
            onClick={async () => {
              await softDeletePlayer(confirmDelete.id);
              setConfirmDelete(null);
            }}
          >
            Delete
          </button>
        </Modal>
      )}
    </div>
  );
}
