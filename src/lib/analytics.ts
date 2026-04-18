// ─── PostHog Analytics ──────────────────────────────────────────────────────
// Centralized analytics client. Initializes PostHog once and provides
// typed event helpers with double-fire guards.

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) {
    console.warn("[Analytics] VITE_POSTHOG_KEY not set — analytics disabled.");
    return;
  }
  const host = (import.meta.env.VITE_POSTHOG_HOST as string) || "https://app.posthog.com";
  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false, // we fire manually
    persistence: "localStorage",
    loaded: () => {
      initialized = true;
    },
  });
  initialized = true;
}

// ─── Typed event names ──────────────────────────────────────────────────────

export type AnalyticsEvent =
  | "calc_started"
  | "results_viewed"
  | "pricing_viewed"
  | "checkout_clicked"
  | "purchase_success"
  | "restore_purchase_attempted"
  | "restore_purchase_success"
  | "restore_purchase_failed"
  // Guided flow
  | "calculator_completed"
  | "guided_step_viewed"
  | "diagnosis_generated"
  | "scenario_lab_opened"
  | "full_breakdown_opened"
  | "upgrade_intent"
  | "dashboard_opened"
  | "adjust_expenses_clicked"
  // Simulator
  | "diagnosis_to_simulator_click"
  | "scenario_added"
  | "scenario_closed"
  | "scenario_reopened"
  | "scenario_saved_to_dashboard"
  // Signup prompt
  | "signup_prompt_shown"
  | "signup_prompt_clicked"
  | "signup_prompt_dismissed"
  // Intent picker
  | "intent_selected"
  | "intent_skipped";

export interface EventProps {
  plan?: "pro" | "premium";
  billing?: "monthly" | "yearly";
  amount?: number;
  source_page?: string;
  [key: string]: string | number | boolean | undefined;
}

export function trackEvent(name: AnalyticsEvent, props?: EventProps): void {
  if (!initialized) return;
  try {
    posthog.capture(name, props ?? {});
  } catch {
    // silently ignore if PostHog is unavailable
  }
}

export function identifyUser(userId: string, traits?: Record<string, string>): void {
  if (!initialized) return;
  try {
    posthog.identify(userId, traits);
  } catch {
    // ignore
  }
}
