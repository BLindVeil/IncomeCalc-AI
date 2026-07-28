import { useCallback, useEffect, useRef } from "react";
import { DURATION, EASE_SETTLE, supportsFocalSequence } from "@/lib/motion";

/**
 * The hero's focal sequence: scattered expenses resolve into one number.
 *
 * Each ledger amount lifts out of its row, travels to the required-income
 * figure, and dissolves into it as that figure pulls into focus. It is the
 * product's claim performed rather than described - the reason it lives here
 * and not on any other surface.
 *
 * Positions are measured at run time (FLIP) instead of hard-coded, so the
 * sequence survives reflow, font swaps, and the mobile layout dropping the
 * ledger entirely. Nothing is hidden by default: every figure is already in
 * the document, and a browser that cannot run the sequence simply shows the
 * finished composition.
 */

interface Options {
  /**
   * Start with the panel's own entrance rather than after it.
   *
   * The mockup runs `lp-in` at a 420ms delay, so at 440ms it is still close to
   * transparent. Beginning here means the figure's soft-focus first frame is
   * masked by that fade instead of popping into blur on an already-visible
   * panel, and the whole sequence is finished sooner.
   */
  delay?: number;
  /** Gap between successive figures departing. Total stays under ~250ms. */
  stagger?: number;
}

export function useResolveSequence({ delay = 440, stagger = 70 }: Options = {}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const sourcesRef = useRef<Map<number, HTMLElement>>(new Map());
  const playedRef = useRef(false);

  const registerSource = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      if (el) sourcesRef.current.set(index, el);
      else sourcesRef.current.delete(index);
    },
    [],
  );

  useEffect(() => {
    if (playedRef.current || !supportsFocalSequence()) return;

    const stage = stageRef.current;
    const target = targetRef.current;
    if (!stage || !target) return;

    let cancelled = false;
    const animations: Animation[] = [];
    const ghosts: HTMLElement[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      for (const a of animations) a.cancel();
      for (const g of ghosts) g.remove();
      animations.length = 0;
      ghosts.length = 0;
    };

    const play = () => {
      if (cancelled) return;
      const stageRect = stage.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      // A collapsed stage means the mockup is not laid out yet; skip rather
      // than animate to meaningless coordinates.
      if (stageRect.width === 0 || targetRect.width === 0) return;

      playedRef.current = true;

      const sources = [...sourcesRef.current.entries()].sort((a, b) => a[0] - b[0]);
      const targetX = targetRect.left - stageRect.left + targetRect.width / 2;
      const targetY = targetRect.top - stageRect.top + targetRect.height / 2;

      sources.forEach(([, el], i) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) return;

        const ghost = document.createElement("span");
        ghost.textContent = el.textContent ?? "";
        ghost.setAttribute("aria-hidden", "true");
        const cs = getComputedStyle(el);
        Object.assign(ghost.style, {
          position: "absolute",
          left: `${rect.left - stageRect.left}px`,
          top: `${rect.top - stageRect.top}px`,
          width: `${rect.width}px`,
          margin: "0",
          font: cs.font,
          fontFamily: cs.fontFamily,
          fontFeatureSettings: cs.fontFeatureSettings,
          color: cs.color,
          textAlign: cs.textAlign,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          willChange: "transform, opacity, filter",
        } as Partial<CSSStyleDeclaration>);
        stage.appendChild(ghost);
        ghosts.push(ghost);

        // The real figure yields to its travelling ghost, then returns.
        const sourceFade = el.animate(
          [{ opacity: "1" }, { opacity: "0.22" }, { opacity: "1" }],
          {
            duration: DURATION.focal + 260,
            delay: i * stagger,
            easing: "ease-in-out",
            fill: "none",
          },
        );
        animations.push(sourceFade);

        const dx = targetX - (rect.left - stageRect.left + rect.width / 2);
        const dy = targetY - (rect.top - stageRect.top + rect.height / 2);

        const travel = ghost.animate(
          [
            { transform: "translate3d(0,0,0) scale(1)", opacity: 0, filter: "blur(0px)" },
            { transform: "translate3d(0,0,0) scale(1)", opacity: 1, filter: "blur(0px)", offset: 0.12 },
            {
              transform: `translate3d(${dx * 0.55}px, ${dy * 0.62}px, 0) scale(0.92)`,
              opacity: 0.9,
              filter: "blur(0.4px)",
              offset: 0.62,
            },
            {
              transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.58)`,
              opacity: 0,
              filter: "blur(3px)",
            },
          ],
          {
            duration: DURATION.focal,
            delay: i * stagger,
            easing: EASE_SETTLE,
            fill: "forwards",
          },
        );
        animations.push(travel);
      });

      // The figure resolves *while* the ghosts travel, never after them.
      //
      // No delay and no backwards fill: a delayed run with `fill: backwards`
      // pins the figure at full blur until the animation starts, which left the
      // most important number on the page unreadable for half a second. Running
      // it from zero with an exponential ease means it is legible almost
      // immediately and merely settling for the rest of the sequence.
      const resolve = target.animate(
        [
          { filter: "blur(6px)", opacity: 0.55, transform: "scale(1.028)" },
          { filter: "blur(0px)", opacity: 1, transform: "scale(1)" },
        ],
        {
          duration: DURATION.focal + 180,
          easing: EASE_SETTLE,
          fill: "none",
        },
      );
      animations.push(resolve);

      resolve.finished
        .then(() => {
          for (const g of ghosts) g.remove();
          ghosts.length = 0;
        })
        .catch(() => {});
    };

    timer = setTimeout(play, delay);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cleanup();
    };
  }, [delay, stagger]);

  return { stageRef, targetRef, registerSource };
}
