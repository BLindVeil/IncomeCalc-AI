import { useState, type CSSProperties } from "react";
import { INK, WHITE, EASE_OUT_CSS } from "./landing-theme";

interface PillButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  /** dark = filled ink pill (primary). light = white pill, for use on photography. */
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  style?: CSSProperties;
}

const PAD = { sm: "8px 8px 8px 16px", md: "10px 10px 10px 20px", lg: "13px 13px 13px 26px" };
const FONT = { sm: 13, md: 14, lg: 15.5 };
const DOT = { sm: 22, md: 26, lg: 32 };

/**
 * The house CTA: a pill with the label and a small circular arrow badge, mirroring
 * the reference "Launch app" control. The badge inverts against the pill so the
 * arrow reads at any size.
 */
export function PillButton({ children, onClick, tone = "dark", size = "md", style }: PillButtonProps) {
  const [hover, setHover] = useState(false);
  const dark = tone === "dark";
  const bg = dark ? INK : WHITE;
  const fg = dark ? WHITE : INK;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "lg" ? 14 : 10,
        padding: PAD[size],
        background: bg,
        color: fg,
        border: "none",
        borderRadius: 999,
        fontSize: FONT[size],
        fontWeight: 550,
        letterSpacing: "-0.01em",
        cursor: "pointer",
        transition: `transform 160ms ${EASE_OUT_CSS}, opacity 160ms ease`,
        transform: hover ? "translateY(-1px)" : "none",
        opacity: hover ? 0.9 : 1,
        ...style,
      }}
      onPointerDown={(e) => {
        e.currentTarget.style.transform = "scale(0.975)";
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
    >
      {children}
      <span
        style={{
          width: DOT[size],
          height: DOT[size],
          borderRadius: "50%",
          background: dark ? WHITE : INK,
          color: dark ? INK : WHITE,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width={size === "lg" ? 14 : 12} height={size === "lg" ? 14 : 12} viewBox="0 0 14 14" fill="none">
          <path
            d="M3 11 L11 3 M5 3 h6 v6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
