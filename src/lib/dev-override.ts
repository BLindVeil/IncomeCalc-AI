const STORAGE_KEY = "dev_override";

export function isDevOverrideActive(): boolean {
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
  try {
    localStorage.setItem(STORAGE_KEY, "true");
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
