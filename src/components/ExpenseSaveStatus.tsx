import { useEffect, useState } from "react";
import type { ExpenseDraftState } from "@/lib/useExpenseDraft";
import { EASE_OUT, DURATION } from "@/lib/motion";

/**
 * The visible receipt for invisible autosave.
 *
 * Saving silently is the right behaviour; saving *invisibly* is not. Someone
 * who has just typed a dozen figures into a finance tool needs evidence the
 * work stuck, or they re-enter it defensively. This is the smallest thing that
 * answers "did it save?" - a timestamp, and on recovery an explicit way out.
 *
 * Never a modal and never blocking: saving is background work, and a dialog
 * would interrupt the task it is reassuring the user about.
 */

function relativeTime(ts: number, now: number): string {
  const secs = Math.max(0, Math.round((now - ts) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

interface Props {
  state: ExpenseDraftState;
  /** Surface colours, so this sits correctly in light and dark. */
  surface: string;
  border: string;
  text: string;
  muted: string;
}

export function ExpenseSaveStatus({ state, surface, border, text, muted }: Props) {
  const { status, lastSavedAt, restored, dismissRestored, discardDraft } = state;
  const [now, setNow] = useState(() => Date.now());

  // Only tick while there is a timestamp on screen to keep fresh.
  useEffect(() => {
    if (lastSavedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  const showRestored = restored && lastSavedAt !== null;
  if (status === "idle" && lastSavedAt === null) return null;

  const shell: React.CSSProperties = {
    position: "fixed",
    left: 16,
    bottom: 16,
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 10,
    background: surface,
    border: `1px solid ${border}`,
    boxShadow: "0 8px 24px -12px rgba(10,10,10,0.28)",
    fontSize: 12.5,
    color: muted,
    maxWidth: "calc(100vw - 32px)",
    transition: `opacity ${DURATION.state}ms ${EASE_OUT}`,
  };

  return (
    <div style={shell} role="status" aria-live="polite">
      {showRestored ? (
        <>
          <span style={{ color: text }}>Restored your last entry</span>
          <button
            type="button"
            onClick={() => {
              discardDraft();
              dismissRestored();
            }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
              color: text,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Start fresh
          </button>
          <button
            type="button"
            onClick={dismissRestored}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              padding: "0 2px",
              font: "inherit",
              color: muted,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </>
      ) : (
        <span>
          {status === "saving"
            ? "Saving…"
            : lastSavedAt !== null
              ? `Saved · ${relativeTime(lastSavedAt, now)}`
              : ""}
        </span>
      )}
    </div>
  );
}
