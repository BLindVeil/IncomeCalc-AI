import { flushSync } from "react-dom";
import { prefersReducedMotion } from "@/lib/motion";

// ─── View transitions ────────────────────────────────────────────────────────
// Continuity for in-place view swaps: the shell stays put and only the content
// changes, so the swap should read as movement inside one surface rather than
// a page replacing itself.
//
// Operate surfaces, so this stays fast and never blocks. Every path degrades to
// an ordinary synchronous update - an unsupported browser gets the old instant
// swap, which was already the shipped behaviour.

/**
 * Minimal shape of the API we rely on.
 *
 * Read off `document` structurally rather than by augmenting `Document`: the
 * DOM lib already declares this method in some TS versions and not others, and
 * a redeclaration conflicts wherever it does exist.
 */
type StartViewTransition = (callback: () => void) => { finished: Promise<unknown> };

function getStartViewTransition(): StartViewTransition | null {
  const fn = (document as unknown as { startViewTransition?: unknown }).startViewTransition;
  return typeof fn === "function" ? (fn as StartViewTransition).bind(document) : null;
}

export type TransitionDirection = "forward" | "backward" | "none";

/** Drives the direction-aware CSS; read off `document.documentElement`. */
const DIRECTION_ATTR = "data-vt-direction";

/**
 * Identifies the transition that currently owns the direction attribute.
 *
 * A user clicking through the nav faster than 320ms leaves two transitions in
 * flight, and the first to settle must not clear the direction the second is
 * still animating on.
 */
let activeTransition = 0;

/**
 * Apply a state update inside a view transition when the browser allows it.
 *
 * `flushSync` is required: `startViewTransition` snapshots the DOM when its
 * callback returns, and a normal React update has not committed by then - the
 * transition would capture the old tree twice and animate nothing.
 *
 * Resolves once the view has settled, so a caller can sequence work that would
 * otherwise fight the transition - a smooth scroll, chiefly. It never rejects:
 * an interrupted transition still applied its update, so callers should carry
 * on rather than treat it as a failure.
 */
export function runViewTransition(
  update: () => void,
  direction: TransitionDirection = "none",
): Promise<void> {
  const start = getStartViewTransition();

  if (prefersReducedMotion() || !start) {
    update();
    return Promise.resolve();
  }

  const token = ++activeTransition;
  document.documentElement.setAttribute(DIRECTION_ATTR, direction);

  const transition = start(() => {
    flushSync(update);
  });

  return transition.finished
    .catch(() => {
      // A transition interrupted by a faster second navigation rejects; the
      // update itself already applied, so there is nothing to recover.
    })
    .then(() => {
      if (token === activeTransition) {
        document.documentElement.removeAttribute(DIRECTION_ATTR);
      }
    });
}

/**
 * Direction of travel between two positions in an ordered nav.
 *
 * Unknown entries yield "none" rather than guessing a direction, so a view
 * reached from outside the sidebar does not slide the wrong way.
 */
export function directionBetween(
  order: readonly string[],
  from: string,
  to: string,
): TransitionDirection {
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a === -1 || b === -1 || a === b) return "none";
  return b > a ? "forward" : "backward";
}
