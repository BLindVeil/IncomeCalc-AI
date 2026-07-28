// ─── Landing design language ─────────────────────────────────────────────────
// Monochrome first: white canvas, near-black ink, grey supporting text.
// Colour appears only where it carries meaning - brand green on data, and one
// pale mint highlight card. Photography does the atmospheric work, not gradients.

export const WHITE = "#FFFFFF";
export const CANVAS = "#F7F7F5"; // off-white section band
export const INK = "#0A0A0A";
export const INK_80 = "#3F3F46";
export const GREY = "#71717A"; // body copy
export const GREY_LIGHT = "#A1A1AA"; // the upper, receding headline line
export const HAIRLINE = "#E4E4E7";

// Single highlight: the "this is us" card in the comparison block.
export const MINT = "#D8F3DC";

// Brand green stays, but only on data and marks.
export const GREEN_DEEP = "#1B4332";
export const GREEN = "#52B788";

export const GLASS_DARK = "rgba(255,255,255,0.08)";
export const GLASS_DARK_BORDER = "rgba(255,255,255,0.16)";

// Re-exported so the curve is declared once, in the motion system.
export { EASE_OUT as EASE_OUT_CSS } from "@/lib/motion";
/** Control-point form, for APIs that take the points rather than a CSS string. */
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export const RADIUS_CARD = 16;
export const RADIUS_IMG = 16;

export const FONT_STACK = "'Geist', -apple-system, system-ui, 'Segoe UI', sans-serif";
export const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/** Small uppercase tracked label, used sparingly (max 1 per 3 sections). */
export const eyebrow = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: GREY,
};

/** Outline pill label, the Synex-style section marker. */
export const pillLabel = {
  ...eyebrow,
  display: "inline-block",
  padding: "6px 13px",
  border: `1px solid ${HAIRLINE}`,
  borderRadius: 999,
  color: INK_80,
};
