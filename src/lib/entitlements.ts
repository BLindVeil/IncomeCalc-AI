// ─── Entitlement System ──────────────────────────────────────────────────────
// Single source of truth for plan tier and dev override logic.
// All feature gating in the app should use getPlan() from this module.

export type PlanTier = "free" | "pro" | "premium";

const STORAGE_KEY = "dev_override";
const TIER_KEY = "incomecalc-tier";

/**
 * Check if a dev override is active via any of the supported channels:
 *  1. URL param: ?dev=1, ?dev=pro, ?dev=premium
 *  2. localStorage: dev_override = "1" | "pro" | "premium"
 *  3. window.__DEV_OVERRIDE__ = true (optional)
 */
export function getDevOverride(): boolean {
  // 1. URL params
  try {
    const params = new URLSearchParams(window.location.search);
    const dev = params.get("dev");
    if (dev === "1" || dev === "pro" || dev === "premium") return true;
  } catch {
    // URL not available
  }

  // 2. localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1" || stored === "pro" || stored === "premium") return true;
  } catch {
    // storage not available
  }

  // 3. window global
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
 */
function getDevTier(): PlanTier | null {
  // Check URL params first (highest priority)
  try {
    const params = new URLSearchParams(window.location.search);
    const dev = params.get("dev");
    if (dev === "premium") return "premium";
    if (dev === "pro") return "pro";
    if (dev === "1") return "premium"; // ?dev=1 → premium
  } catch {
    // not available
  }

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
 * Dev override always wins over stored tier.
 * ?dev=1 → premium
 * ?dev=premium → premium
 * ?dev=pro → pro
 * localStorage dev_override = "premium" → premium
 * localStorage dev_override = "1" → premium
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
