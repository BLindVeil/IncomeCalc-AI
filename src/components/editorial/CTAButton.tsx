import type { CSSProperties, ReactNode } from "react";
import { PillButton } from "@/components/landing/PillButton";
import type { ThemeConfig } from "@/lib/app-shared";
import { EASE_OUT, RADIUS } from "./tokens";

interface CTAButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** Drives the primary pill tone: ink pill on light canvas, white pill on dark. */
  isDark?: boolean;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  t: ThemeConfig;
  style?: CSSProperties;
}

const PAD = { sm: "9px 18px", md: "11px 22px", lg: "13px 26px" };
const FONT = { sm: 13, md: 14, lg: 15.5 };

/**
 * The house call-to-action. Primary is the editorial pill (ink on light, white
 * on dark) — never a green gradient; green is reserved for data. Secondary is a
 * quiet hairline pill. Disabled renders inert and muted.
 */
export function CTAButton({
  children,
  onClick,
  isDark = false,
  variant = "primary",
  size = "md",
  disabled = false,
  t,
  style,
}: CTAButtonProps) {
  if (disabled) {
    return (
      <span
        aria-disabled
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: PAD[size],
          background: t.border,
          color: t.subtle,
          borderRadius: RADIUS.pill,
          fontSize: FONT[size],
          fontWeight: 550,
          letterSpacing: "-0.01em",
          cursor: "not-allowed",
          userSelect: "none",
          ...style,
        }}
      >
        {children}
      </span>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="lp-press"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: PAD[size],
          background: "transparent",
          color: t.text,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: RADIUS.pill,
          fontSize: FONT[size],
          fontWeight: 550,
          letterSpacing: "-0.01em",
          cursor: "pointer",
          transition: `background 180ms ${EASE_OUT}, border-color 180ms ${EASE_OUT}`,
          ...style,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = t.primarySoft;
          e.currentTarget.style.borderColor = t.muted;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = t.borderStrong;
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <PillButton onClick={onClick} tone={isDark ? "light" : "dark"} size={size} style={style}>
      {children}
    </PillButton>
  );
}
