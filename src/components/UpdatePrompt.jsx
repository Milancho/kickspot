import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Shows a banner when a new version of the app is deployed.
 * The user taps "Refresh" to get the latest version immediately.
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds while the app is open.
      if (r) setInterval(() => r.update(), 60_000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="update-banner">
      <span>🆕 New version available!</span>
      <button
        className="btn btn-sm"
        onClick={() => updateServiceWorker(true)}
      >
        Refresh
      </button>
    </div>
  );
}
