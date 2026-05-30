import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loading } from "../components/ui.jsx";
import { useAdmin } from "../context/AdminContext.jsx";
import {
  getAdmins,
  checkPin,
  addAdmin,
  deleteAdmin,
  getVenue,
} from "../firebase/service.js";

function PinField({ value, onChange, onEnter, placeholder = "••••" }) {
  return (
    <input
      className="pin-input"
      type="password"
      inputMode="numeric"
      maxLength={4}
      autoFocus
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      onKeyDown={(e) => e.key === "Enter" && onEnter && onEnter()}
    />
  );
}

/** Locked view: first-launch setup if no admins exist, else PIN entry. */
function LockedView({ admins, onUnlock }) {
  const firstLaunch = admins.length === 0;
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pin.length !== 4 || busy) return;
    setBusy(true);
    setError("");
    try {
      if (firstLaunch) {
        if (!name.trim()) {
          setError("Enter your name.");
          return;
        }
        await addAdmin({ name: name.trim(), pin });
        onUnlock({ name: name.trim(), pin });
      } else {
        const admin = await checkPin(pin);
        if (admin) onUnlock(admin);
        else {
          setError("Wrong PIN.");
          setPin("");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="meta" style={{ marginBottom: 10 }}>
        {firstLaunch
          ? "No admin yet — set the first one up. Choose a name and a 4-digit PIN. Your PIN is stored as a SHA-256 hash, never in plain text."
          : "Enter your 4-digit PIN to unlock edit & delete."}
      </div>
      {firstLaunch && (
        <label className="field">
          <span>Your name</span>
          <input
            type="text"
            value={name}
            placeholder="e.g. Marko"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      )}
      <label className="field">
        <span>4-digit PIN</span>
        <PinField value={pin} onChange={setPin} onEnter={submit} />
      </label>
      {error && <div className="error-text">{error}</div>}
      <button
        className="btn btn-block"
        disabled={pin.length !== 4 || busy}
        onClick={submit}
      >
        {firstLaunch ? "Create admin & unlock" : "Unlock"}
      </button>
    </div>
  );
}

function AddAdminForm() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || pin.length !== 4 || busy) return;
    setBusy(true);
    try {
      await addAdmin({ name: name.trim(), pin });
      setName("");
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="name" style={{ marginBottom: 8 }}>
        Add admin
      </div>
      <label className="field">
        <span>Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="field">
        <span>4-digit PIN</span>
        <PinField value={pin} onChange={setPin} placeholder="1234" />
      </label>
      <button
        className="btn btn-block"
        disabled={!name.trim() || pin.length !== 4 || busy}
        onClick={submit}
      >
        Add admin
      </button>
    </div>
  );
}

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL;

function SupportCard() {
  if (!SUPPORT_URL) return null;

  const share = async () => {
    const text = `Support KickSpot — helps cover server & AI costs ☕ ${SUPPORT_URL}`;
    try {
      if (navigator.share) await navigator.share({ title: "Support KickSpot", text });
      else {
        await navigator.clipboard.writeText(text);
        alert("Support link copied to clipboard.");
      }
    } catch {
      /* user cancelled — ignore */
    }
  };

  return (
    <div className="card">
      <div className="name" style={{ marginBottom: 4 }}>☕ Support KickSpot</div>
      <div className="meta" style={{ marginBottom: 10 }}>
        Enjoying the app? A small tip helps cover Firebase & AI costs.
        Share the link with your group too — every coffee counts!
      </div>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-block"
        style={{ textDecoration: "none", textAlign: "center" }}
      >
        ☕ Open support page
      </a>
      <button className="btn btn-ghost btn-block" onClick={share} style={{ marginTop: 6 }}>
        Share with group
      </button>
    </div>
  );
}

function VenueShare() {
  const [venue, setVenue] = useState(null);
  useEffect(() => getVenue(setVenue), []);
  if (!venue) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;
  const text = `We're playing footvolley at ${venue.name}. Navigate here: ${mapsUrl}`;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "KickSpot", text });
      else {
        await navigator.clipboard.writeText(text);
        alert("Location copied to clipboard.");
      }
    } catch {
      /* user cancelled share — ignore */
    }
  };

  return (
    <div className="card">
      <div className="name">{venue.name}</div>
      <div className="meta" style={{ margin: "4px 0 10px" }}>
        {venue.address}
      </div>
      <button className="btn btn-block" onClick={share}>
        📍 Share venue location
      </button>
    </div>
  );
}

export default function AdminMenu() {
  const navigate = useNavigate();
  const { admin, adminMode, login, logout } = useAdmin();
  const [admins, setAdmins] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() =>
    getAdmins(setAdmins, () => {
      setAdmins([]);
      setLoadError(true);
    })
  , []);

  return (
    <div className="page">
      <PageHeader
        title="Admin"
        subtitle={adminMode ? `Unlocked as ${admin.name}` : "Settings & access"}
      />

      {loadError && (
        <div className="notice">
          ⚠️ Could not reach the database. Check your connection and refresh.
        </div>
      )}

      {admins === null ? (
        <Loading label="Loading…" />
      ) : !adminMode ? (
        <LockedView admins={admins} onUnlock={login} />
      ) : (
        <>
          <div className="card">
            <div className="list-row">
              <div className="name">Admin mode is on</div>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Lock
              </button>
            </div>
          </div>

          <div className="card">
            <div className="name" style={{ marginBottom: 8 }}>
              Admins
            </div>
            {admins.map((a) => (
              <div className="list-row" key={a.name} style={{ padding: "6px 0" }}>
                <div>
                  {a.name}
                  {a.name === admin.name && (
                    <span className="meta"> · you</span>
                  )}
                </div>
                {a.name !== admin.name && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => deleteAdmin(a.name)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <AddAdminForm />
          <VenueShare />
          <SupportCard />
        </>
      )}

      <button
        className="btn btn-ghost btn-block"
        style={{ marginTop: 12 }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div style={{ textAlign: "center", marginTop: 20, paddingBottom: 8 }}>
        <div className="meta">KickSpot v1</div>
        <div className="meta" style={{ marginTop: 2 }}>
          Made with ❤️ by Milancho
        </div>
      </div>
    </div>
  );
}
