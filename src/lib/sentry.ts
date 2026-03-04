// ─── Sentry Error Logging ──────────────────────────────────────────────────
// Initializes Sentry once at app startup. If VITE_SENTRY_DSN is missing,
// Sentry does nothing (graceful no-op).

import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    console.warn("[Sentry] VITE_SENTRY_DSN not set — error logging disabled.");
    return;
  }
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "production",
    // Keep sample rate low for production
    tracesSampleRate: 0.2,
    // Only send errors, skip performance in dev
    enabled: true,
  });
  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, string>): void {
  if (!initialized) return;
  try {
    Sentry.captureException(error, { extra: context });
  } catch {
    // ignore
  }
}

export { Sentry };
