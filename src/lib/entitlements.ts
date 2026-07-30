// ─── Entitlement System ──────────────────────────────────────────────────────
// Single source of truth for access and dev override logic.
// All feature gating in the app should use getPlan() / hasFullAccess().
//
// Ascentra is a one-time purchase: the only tiers are "free" and "paid".
// Legacy localStorage values ("pro"/"premium") from the subscription era are
// read as "paid" so existing customers keep their access.

export type PlanTier = "free" | "paid";

const STORAGE_KEY = "dev_override";
const TIER_KEY = "incomecalc-tier";

/**
 * Check if a dev override is active via any of the supported channels:
 *  1. localStorage: dev_override = "1" | "paid" (legacy "pro"/"premium" accepted)
 *  2. window.__DEV_OVERRIDE__ = true (optional)
 *
 * SECURITY: Only works in development builds. Vite strips this in production.
 */
export function getDevOverride(): boolean {
  if (!import.meta.env.DEV) return false;

  // 1. localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1" || stored === "paid" || stored === "pro" || stored === "premium") return true;
  } catch {
    // storage not available
  }

  // 2. window global
  try {
    if ((window as unknown as Record<string, unknown>).__DEV_OVERRIDE__ === true) return true;
  } catch {
    // not available
  }

  return false;
}

/**
 * Load the user's actual purchase state from localStorage.
 * Legacy subscription-era values map to "paid".
 */
function loadStoredTier(): PlanTier {
  try {
    const raw = localStorage.getItem(TIER_KEY);
    if (raw === "paid" || raw === "pro" || raw === "premium") return "paid";
  } catch {
    // storage not available
  }
  return "free";
}

/**
 * Get the effective plan, accounting for dev overrides.
 * This is THE single function all feature gating should use.
 *
 * Dev override always wins over stored tier (set via localStorage dev_override).
 * For server-verified plan, call syncPlan() on app startup and after payment.
 */
export function getPlan(): PlanTier {
  if (getDevOverride()) return "paid";
  return loadStoredTier();
}

/** Convenience: has the user unlocked the full diagnosis? */
export function hasFullAccess(): boolean {
  return getPlan() === "paid";
}

// ─── Dev override management ────────────────────────────────────────────────

export function enableDevOverride(): void {
  if (!import.meta.env.DEV) return;
  try {
    localStorage.setItem(STORAGE_KEY, "paid");
  } catch {
    // storage not available
  }
}

export function disableDevOverride(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage not available
  }
}

/** Get the dev override label for the badge, or null if not active. */
export function getDevBadgeLabel(): string | null {
  if (!getDevOverride()) return null;
  return "DEV: FULL ACCESS";
}

// ─── Server-side plan sync ───────────────────────────────────────────────────

/**
 * Fetch the server-verified plan from /api/entitlement.
 * Falls back to the current localStorage value if the request fails.
 * The API maps legacy pro/premium records to "paid" server-side.
 */
export async function fetchPlanFromServer(
  userId: string,
  sessionToken: string,
): Promise<PlanTier> {
  try {
    const resp = await fetch("/api/entitlement", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "X-User-Id": userId,
      },
    });
    if (!resp.ok) return loadStoredTier();
    const data = (await resp.json()) as { plan?: string };
    const plan = data.plan;
    if (plan === "paid" || plan === "pro" || plan === "premium") return "paid";
    return "free";
  } catch {
    return loadStoredTier();
  }
}

/**
 * Fetch the server-verified plan and write it to localStorage so that
 * the synchronous getPlan() reflects the true server state.
 * Safe to call fire-and-forget; swallows all errors.
 */
export async function syncPlan(userId: string, sessionToken: string): Promise<void> {
  try {
    const plan = await fetchPlanFromServer(userId, sessionToken);
    localStorage.setItem(TIER_KEY, plan);
  } catch {
    // ignore — localStorage already has the last known value
  }
}
