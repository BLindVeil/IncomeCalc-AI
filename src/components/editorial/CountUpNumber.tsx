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
  /** First-reveal animation length in ms. Default 900. */
  durationMs?: number;
  /**
   * Re-settle length in ms when `value` changes after the first reveal.
   * Shorter than the reveal on purpose: the first count is an arrival, a later
   * change is a correction and should read as one. Default 420.
   */
  updateDurationMs?: number;
  /** Start counting only once scrolled into view (for below-the-fold stats). Default true. */
  startOnView?: boolean;
  style?: CSSProperties;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * A numeric display that counts from 0 → value on first appearance, and
 * re-settles to any later value from whatever is currently on screen.
 *
 * Animating from the *presentation* value rather than from zero is what keeps a
 * mid-flight change from snapping back and restarting: edit an expense twice in
 * a second and the figure tracks continuously instead of stuttering. It is also
 * the correctness fix — the figure follows its prop for the life of the mount
 * rather than freezing on the first number it ever showed.
 *
 * Honours `prefers-reduced-motion` (renders the value immediately, on first
 * paint and on every change) and animates only text content, so it never
 * touches layout or the compositor. Geist Mono with tabular figures is the
 * house treatment for numerals, so digits don't jitter as they tick.
 */
export function CountUpNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  group = true,
  durationMs = 900,
  updateDurationMs = 420,
  startOnView = true,
  style,
  className,
}: CountUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [active, setActive] = useState(!startOnView);

  // The value currently painted, kept in a ref so a retarget can read it
  // without making the animation effect depend on its own output.
  const displayRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const hasRevealedRef = useRef(false);

  // Arm the counter: immediately, or on first intersection for below-the-fold
  // figures. Runs once — later value changes must not wait to be re-seen.
  useEffect(() => {
    if (!startOnView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!active) return;

    const settle = (v: number) => {
      displayRef.current = v;
      setDisplay(v);
    };

    if (prefersReducedMotion()) {
      hasRevealedRef.current = true;
      settle(value);
      return;
    }

    const from = displayRef.current;
    if (from === value) {
      hasRevealedRef.current = true;
      return;
    }

    // A change already in flight is abandoned mid-frame; the new one picks up
    // from wherever the digits currently read.
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    const span = hasRevealedRef.current ? updateDurationMs : durationMs;
    hasRevealedRef.current = true;
    const start = performance.now();

    const tick = (now: number) => {
      const p = span <= 0 ? 1 : Math.min(1, (now - start) / span);
      settle(from + (value - from) * easeOutCubic(p));
      if (p < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [active, value, durationMs, updateDurationMs]);

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
