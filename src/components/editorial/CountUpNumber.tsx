import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MONO } from "./tokens";

interface CountUpNumberProps {
  value: number;
  /** Digits after the decimal point. Default 0. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Group thousands with commas. Default true. */
  group?: boolean;
  /** Animation length in ms. Default 900. */
  durationMs?: number;
  /** Start counting only once scrolled into view (for below-the-fold stats). Default true. */
  startOnView?: boolean;
  style?: CSSProperties;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * A numeric display that counts from 0 → value on first appearance. Honours
 * `prefers-reduced-motion` (renders the final value immediately) and only
 * animates transform-free text, so it's cheap. Uses Geist Mono for tabular
 * alignment — the house treatment for figures.
 */
export function CountUpNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  group = true,
  durationMs = 900,
  startOnView = true,
  style,
  className,
}: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (started.current) return;
      started.current = true;
      if (reduced) {
        setDisplay(value);
        return;
      }
      const from = 0;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / durationMs);
        setDisplay(from + (value - from) * easeOutCubic(p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!startOnView || typeof IntersectionObserver === "undefined") {
      run();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            run();
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, durationMs, startOnView]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: group,
  });

  return (
    <span ref={ref} className={className} style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
