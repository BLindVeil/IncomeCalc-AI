// ─── Entitlement System ──────────────────────────────────────────────────────
// Single source of truth for plan tier and dev override logic.
// All feature gating in the app should use getPlan() from this module.

export type PlanTier = "free" | "pro" | "premium";

const STORAGE_KEY = "dev_override";
const TIER_KEY = "incomecalc-tier";

/**
 * Check if a dev override is active via any of the supported channels:
 *  1. localStorage: dev_override = "1" | "pro" | "premium"
 *  2. window.__DEV_OVERRIDE__ = true (optional)
 *
 * SECURITY: Only works in development builds. Vite strips this in production.
 */
export function getDevOverride(): boolean {
  if (!import.meta.env.DEV) return false;

  // 1. localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1" || stored === "pro" || stored === "premium") return true;
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
 * Determine the dev-requested tier level (granular).
 * Returns the specific tier requested by the dev override, or null if no override.
 *
 * SECURITY: Only works in development builds. Vite strips this in production.
 */
function getDevTier(): PlanTier | null {
  if (!import.meta.env.DEV) return null;

  // Check localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "premium") return "premium";
    if (stored === "pro") return "pro";
    if (stored === "1") return "premium";
  } catch {
    // not available
  }

  // Check window global
  try {
    if ((window as unknown as Record<string, unknown>).__DEV_OVERRIDE__ === true) return "premium";
  } catch {
    // not available
  }

  return null;
}

/**
 * Load the user's actual paid tier from localStorage.
 */
function loadStoredTier(): PlanTier {
  try {
    const raw = localStorage.getItem(TIER_KEY);
    if (raw === "pro" || raw === "premium") return raw;
  } catch {
    // storage not available
  }
  return "free";
}

/**
 * Get the effective plan tier, accounting for dev overrides.
 * This is THE single function all feature gating should use.
 *
 * Dev override always wins over stored tier (set via localStorage dev_override).
 * For server-verified plan, call syncPlan() on app startup and after payment.
 */
export function getPlan(): PlanTier {
  const devTier = getDevTier();
  if (devTier) return devTier;
  return loadStoredTier();
}

/** Convenience: is the effective plan at least "pro"? */
export function hasProAccess(): boolean {
  const plan = getPlan();
  return plan === "pro" || plan === "premium";
}

/** Convenience: is the effective plan "premium"? */
export function hasPremiumAccess(): boolean {
  return getPlan() === "premium";
}

// ─── Dev override management ────────────────────────────────────────────────

export function enableDevOverride(level: "pro" | "premium" = "premium"): void {
  if (!import.meta.env.DEV) return;
  try {
    localStorage.setItem(STORAGE_KEY, level);
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
  const devTier = getDevTier();
  if (!devTier) return null;
  return `DEV: ${devTier.toUpperCase()} UNLOCKED`;
}

// ─── Server-side plan sync ───────────────────────────────────────────────────

/**
 * Fetch the server-verified plan tier from /api/entitlement.
 * Falls back to the current localStorage value if the request fails.
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
    if (plan === "pro" || plan === "premium") return plan;
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
