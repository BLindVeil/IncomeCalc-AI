// ─── Layer 2: account sync ───────────────────────────────────────────────────
// Mirrors the local draft to the signed-in user's account so their numbers
// survive a new device or a private window, not just a new tab.
//
// Every call fails soft. Layer 1 is the source of truth for "did my work
// survive"; the network is an upgrade, never a dependency, so a dead endpoint
// must never cost the user their typing.

import type { ExpenseDraft } from "@/lib/expense-draft";

export interface SyncCredentials {
  userId: string;
  sessionToken: string;
}

function headers({ userId, sessionToken }: SyncCredentials): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionToken}`,
    "X-User-Id": userId,
  };
}

/** Fetch the stored document, or null when absent or unreachable. */
export async function fetchRemoteDraft(creds: SyncCredentials): Promise<ExpenseDraft | null> {
  try {
    const res = await fetch("/api/expenses", { method: "GET", headers: headers(creds) });
    if (!res.ok) return null;
    const json = (await res.json()) as { expenses?: ExpenseDraft | null };
    return json.expenses ?? null;
  } catch {
    return null;
  }
}

/** Push the document up. Returns false when it did not land. */
export async function pushRemoteDraft(
  creds: SyncCredentials,
  draft: ExpenseDraft,
): Promise<boolean> {
  try {
    const res = await fetch("/api/expenses", {
      method: "PUT",
      headers: headers(creds),
      body: JSON.stringify({ expenses: draft }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteRemoteDraft(creds: SyncCredentials): Promise<boolean> {
  try {
    const res = await fetch("/api/expenses", { method: "DELETE", headers: headers(creds) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Decide which copy wins at sign-in.
 *
 * Last-write-wins on `updatedAt`, with one deliberate exception: a remote
 * document never replaces newer local work. Someone who typed while signed out
 * and then signed in keeps what they just entered - silently discarding it is
 * the single worst thing a sync layer can do.
 */
export function reconcile(
  local: ExpenseDraft | null,
  remote: ExpenseDraft | null,
): { winner: ExpenseDraft | null; source: "local" | "remote" | "none" } {
  if (!local && !remote) return { winner: null, source: "none" };
  if (!remote) return { winner: local, source: "local" };
  if (!local) return { winner: remote, source: "remote" };
  return local.updatedAt >= remote.updatedAt
    ? { winner: local, source: "local" }
    : { winner: remote, source: "remote" };
}
