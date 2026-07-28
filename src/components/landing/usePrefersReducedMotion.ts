import { useEffect, useState } from "react";

/**
 * Tracks the user's reduced-motion preference.
 *
 * The CSS animations gate themselves with media queries, but the ambient video
 * in the comparison band has to be gated in JS - once a `<video autoplay>` is
 * in the tree, no stylesheet can stop it from playing.
 *
 * Defaults to `true` so the still frame is what renders before hydration; a
 * motion-tolerant browser drops to `false` on the first effect.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
