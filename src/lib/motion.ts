// ─── Motion system ───────────────────────────────────────────────────────────
// Single source of truth for easing and duration. `landing-theme.ts` and
// `components/editorial/tokens.ts` both used to declare their own EASE_OUT with
// the same value; they now re-export from here so a change lands everywhere.
//
// Durations express distance and consequence, not preference:
//   feedback   an acknowledgement the user should barely perceive
//   state      a routine change of appearance
//   transition a layout, overlay, or view change with somewhere to travel
//   focal      the one authored entrance a surface has earned
//
// Exits run faster than entrances - a slow dismissal reads as latency.

export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_IO = "cubic-bezier(0.77, 0, 0.175, 1)";

/** Deep exponential deceleration. For arrivals that should feel inevitable. */
export const EASE_SETTLE = "cubic-bezier(0.16, 1, 0.3, 1)";

export const DURATION = {
  feedback: 140,
  state: 220,
  transition: 380,
  focal: 720,
} as const;

/** Exits are quicker than their matching entrance. */
export const DURATION_OUT = {
  state: 160,
  transition: 260,
} as const;

export type MotionDuration = keyof typeof DURATION;

/**
 * True when the user has asked for less motion.
 *
 * Read at call time rather than cached: the preference can change mid-session,
 * and a sequence that is about to start is exactly when the current answer
 * matters. Returns `true` when the environment cannot be queried, so a
 * non-browser render never schedules motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True when the browser can run the focal sequence at all.
 *
 * The sequence uses the Web Animations API for interruption and dynamic
 * measurement. Without it the surface simply keeps its static composition -
 * the figures it would have animated are already on screen.
 */
export function supportsFocalSequence(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof Element !== "undefined" &&
    typeof Element.prototype.animate === "function" &&
    !prefersReducedMotion()
  );
}
