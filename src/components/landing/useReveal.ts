import { useEffect, useRef } from "react";

/**
 * Adds `is-in` to the element the first time it scrolls into view, then stops
 * observing. Pairs with the `.lp-reveal` / `.lp-bars` CSS classes.
 *
 * Uses IntersectionObserver rather than a scroll listener (no per-frame work on
 * the main thread). If the element is already in view on mount - or the browser
 * has no IO - it reveals immediately so nothing can get stranded invisible.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  amount?: number;
  rootMargin?: string;
}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      {
        threshold: options?.amount ?? 0.15,
        rootMargin: options?.rootMargin ?? "0px 0px -8% 0px",
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [options?.amount, options?.rootMargin]);

  return ref;
}
