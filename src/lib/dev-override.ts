const STORAGE_KEY = "dev_override";

/**
 * SECURITY: Dev override only works in development builds.
 * Vite replaces import.meta.env.DEV with `false` in production,
 * so these code paths are dead-code-eliminated from the bundle.
 */

export function isDevOverrideActive(): boolean {
  if (!import.meta.env.DEV) return false;

  try {
    if (import.meta.env?.DEV_OVERRIDE === "true") return true;
  } catch {
    // env not available
  }
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function enableDevOverride(): void {
  if (!import.meta.env.DEV) return;
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // storage not available
  }
}

export function disableDevOverride(): void {
  if (!import.meta.env.DEV) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage not available
  }
}
