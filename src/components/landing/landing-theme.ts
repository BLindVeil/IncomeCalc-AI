// ─── Landing design language ─────────────────────────────────────────────────
// Organic-fintech palette: lime-paper canvas, green-black ink, glass surfaces.
// One accent (CTA orange), one radius system (pill interactive / 20px cards).

export const PAPER = "#F4F7EA";
export const PAPER_DEEP = "#EAF1DC";
export const INK = "#0C1A12";
export const INK_SOFT = "#31402F";
export const SAGE = "#5F6E58";
export const SAGE_FAINT = "#8B977F";

export const GLASS_BG = "rgba(255,255,255,0.62)";
export const GLASS_BORDER = "rgba(12,26,18,0.10)";
export const GLASS_HIGHLIGHT = "inset 0 1px 0 rgba(255,255,255,0.65)";

export const CTA_ORANGE = "#EA580C";
export const CTA_ORANGE_HOVER = "#C2410C";

// Strong ease-out for entrances (feels intentional, responds instantly)
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export const EASE_OUT_CSS = "cubic-bezier(0.23, 1, 0.32, 1)";

// Green-tinted shadows only on this canvas; never pure black
export const SHADOW_FLOAT = "0 24px 64px -16px rgba(27,67,50,0.28), 0 4px 16px rgba(27,67,50,0.10)";
export const SHADOW_CHIP = "0 2px 10px rgba(27,67,50,0.10)";

export const FONT_STACK = "'Geist', -apple-system, system-ui, 'Segoe UI', sans-serif";

// Film-grain overlay for organic surfaces (SVG turbulence, no network request)
export const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")";
