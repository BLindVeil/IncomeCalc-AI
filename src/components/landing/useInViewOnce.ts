import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref and a boolean that flips true the first time the element enters
 * view, then stops observing.
 *
 * `useReveal` toggles a CSS class, which is enough for fade-and-rise. The
 * dashboard charts animate from inside React on mount instead, so they need the
 * mount itself deferred — otherwise every bar and arc draws itself at page load,
 * far below the fold, and the visitor scrolls down to a finished chart. Gate the
 * render on this and the draw-in plays exactly when it is looked at.
 */
export function useInViewOnce<T extends HTMLElement = HTMLDivElement>(options?: {
  amount?: number;
  rootMargin?: string;
}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      {
        threshold: options?.amount ?? 0.2,
        rootMargin: options?.rootMargin ?? "0px 0px -10% 0px",
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [inView, options?.amount, options?.rootMargin]);

  return [ref, inView] as const;
}
