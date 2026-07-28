import { useCallback, useEffect, useRef, useState } from "react";
import type { ExpenseData } from "@/lib/app-shared";
import {
  DRAFT_STORAGE_KEY,
  clearDraft,
  draftHasContent,
  readDraft,
  writeDraft,
  type ExpenseDraft,
} from "@/lib/expense-draft";
import {
  deleteRemoteDraft,
  fetchRemoteDraft,
  pushRemoteDraft,
  reconcile,
  type SyncCredentials,
} from "@/lib/expense-sync";

/** Local write is fast enough to feel immediate without thrashing storage. */
const LOCAL_DEBOUNCE_MS = 400;
/** The network write is coarser; nothing depends on it for durability. */
const REMOTE_DEBOUNCE_MS = 2000;

export type SaveStatus = "idle" | "saving" | "saved";

interface Values {
  expenseData: ExpenseData;
  taxRate: number;
  currentGrossIncome: number;
}

interface Options extends Values {
  /** Applied when a draft is restored on load or pulled from the account. */
  onRestore: (values: Values) => void;
  /** Null while signed out - layer 1 still runs. */
  credentials: SyncCredentials | null;
}

export interface ExpenseDraftState {
  status: SaveStatus;
  /** Epoch ms of the last successful local write, for the "Saved" receipt. */
  lastSavedAt: number | null;
  /** Set once when a draft was restored, so the UI can offer Undo. */
  restored: boolean;
  dismissRestored: () => void;
  /** Discard the restored draft and return to a blank slate. */
  discardDraft: () => void;
}

/**
 * Autosave for the expense working document.
 *
 * Layer 1 writes every change to localStorage. Layer 2 mirrors it to the
 * account when signed in. Nothing is ever prompted: the user is never asked
 * whether to save, on first entry or any other time.
 *
 * The first pass is a restore, not a save - otherwise mounting with defaults
 * would immediately overwrite the very draft being recovered.
 */
export function useExpenseDraft({
  expenseData,
  taxRate,
  currentGrossIncome,
  onRestore,
  credentials,
}: Options): ExpenseDraftState {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [restored, setRestored] = useState(false);

  const hydratedRef = useRef(false);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Values>({ expenseData, taxRate, currentGrossIncome });
  latest.current = { expenseData, taxRate, currentGrossIncome };

  // Keep the restore callback in a ref: callers pass an inline closure, and it
  // must not re-trigger hydration on every render.
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // ── Hydrate once, before any save is allowed to run ──────────────────────
  useEffect(() => {
    const local = readDraft();
    if (draftHasContent(local) && local) {
      onRestoreRef.current({
        expenseData: local.expenseData,
        taxRate: local.taxRate,
        currentGrossIncome: local.currentGrossIncome,
      });
      setLastSavedAt(local.updatedAt);
      setRestored(true);
    }
    hydratedRef.current = true;
  }, []);

  // ── Pull the account copy when credentials appear (sign-in) ──────────────
  useEffect(() => {
    if (!credentials) return;
    let cancelled = false;

    (async () => {
      const remote = await fetchRemoteDraft(credentials);
      if (cancelled) return;

      const local = readDraft();
      const { winner, source } = reconcile(local, remote);
      if (!winner || !draftHasContent(winner)) return;

      if (source === "remote") {
        // The account copy is newer: adopt it locally and in state.
        writeDraft({
          expenseData: winner.expenseData,
          taxRate: winner.taxRate,
          currentGrossIncome: winner.currentGrossIncome,
        });
        onRestoreRef.current({
          expenseData: winner.expenseData,
          taxRate: winner.taxRate,
          currentGrossIncome: winner.currentGrossIncome,
        });
        setRestored(true);
        setLastSavedAt(winner.updatedAt);
      } else {
        // Local is newer (typed while signed out, then signed in): push it up
        // rather than letting a stale account copy win.
        void pushRemoteDraft(credentials, winner);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [credentials?.userId, credentials?.sessionToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save on change ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydratedRef.current) return;

    setStatus("saving");
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      const stored = writeDraft(latest.current);
      if (stored) {
        setLastSavedAt(stored.updatedAt);
        setStatus("saved");

        if (credentials) {
          if (remoteTimer.current) clearTimeout(remoteTimer.current);
          remoteTimer.current = setTimeout(() => {
            void pushRemoteDraft(credentials, stored);
          }, REMOTE_DEBOUNCE_MS);
        }
      } else {
        // Storage refused (private mode, quota). Working from memory is still
        // correct; claiming "Saved" would not be.
        setStatus("idle");
      }
    }, LOCAL_DEBOUNCE_MS);

    return () => {
      if (localTimer.current) clearTimeout(localTimer.current);
    };
  }, [expenseData, taxRate, currentGrossIncome, credentials]);

  // ── Flush pending work when the tab goes away ────────────────────────────
  useEffect(() => {
    const flush = () => {
      if (!hydratedRef.current) return;
      writeDraft(latest.current);
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, []);

  // ── Multi-tab: adopt a newer draft written by another tab ────────────────
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DRAFT_STORAGE_KEY || !e.newValue) return;
      const incoming = readDraft();
      if (!incoming || !draftHasContent(incoming)) return;
      if (lastSavedAt && incoming.updatedAt <= lastSavedAt) return;
      onRestoreRef.current({
        expenseData: incoming.expenseData,
        taxRate: incoming.taxRate,
        currentGrossIncome: incoming.currentGrossIncome,
      });
      setLastSavedAt(incoming.updatedAt);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [lastSavedAt]);

  const dismissRestored = useCallback(() => setRestored(false), []);

  const discardDraft = useCallback(() => {
    clearDraft();
    setRestored(false);
    setLastSavedAt(null);
    setStatus("idle");
    if (credentials) void deleteRemoteDraft(credentials);
  }, [credentials]);

  return { status, lastSavedAt, restored, dismissRestored, discardDraft };
}
