// ─── Editorial design tokens ─────────────────────────────────────────────────
// The canonical, app-wide design language (promoted from the landing DNA).
// Monochrome-first: white/canvas surfaces, ink text, grey support copy, hairline
// borders. Brand green appears only on data and marks. Surface COLOURS come from
// the themed `t: ThemeConfig` object; this module owns the non-colour scale —
// type, spacing, radii, easing — plus a couple of shared label styles.

import type { CSSProperties } from "react";

export const FONT_STACK = "'Geist', -apple-system, system-ui, 'Segoe UI', sans-serif";
export const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/** The house curves, re-exported from the motion system (`--lp-ease-out`). */
export { EASE_OUT, EASE_IO } from "@/lib/motion";

/** Editorial type scale (px). Display sizes are tight-tracked; body is relaxed. */
export const TYPE = {
  display: { fontSize: 56, lineHeight: 1.04, letterSpacing: "-0.038em", fontWeight: 600 },
  h1: { fontSize: 40, lineHeight: 1.06, letterSpacing: "-0.03em", fontWeight: 600 },
  h2: { fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.024em", fontWeight: 600 },
  h3: { fontSize: 21, lineHeight: 1.2, letterSpacing: "-0.016em", fontWeight: 600 },
  body: { fontSize: 15.5, lineHeight: 1.6, letterSpacing: "0em", fontWeight: 400 },
  small: { fontSize: 13, lineHeight: 1.5, letterSpacing: "0em", fontWeight: 400 },
} as const satisfies Record<string, CSSProperties>;

/** 4px base spacing scale. */
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48, "4xl": 72 } as const;

/** Radii — cards read soft, pills are fully round. */
export const RADIUS = { sm: 10, md: 14, card: 16, lg: 20, pill: 999 } as const;

/** Small uppercase tracked label. Use sparingly — at most one per section. */
export const eyebrow: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

/** Outline pill section marker. Pass the themed border/text colours at the call site. */
export function pillLabel(borderColor: string): CSSProperties {
  return {
    ...eyebrow,
    display: "inline-block",
    padding: "6px 13px",
    border: `1px solid ${borderColor}`,
    borderRadius: RADIUS.pill,
  };
}
