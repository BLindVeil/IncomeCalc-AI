import type { CSSProperties, ReactNode } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { RADIUS } from "./tokens";

interface EditorialCardProps {
  children: ReactNode;
  t: ThemeConfig;
  /** Adds the shared hover-lift (`.lp-card`). Use for clickable/linked cards only. */
  interactive?: boolean;
  padding?: number | string;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

/**
 * The house surface: a white/raised card on the canvas with a single hairline
 * border — no glass, no drop shadow at rest. Depth comes from the hairline and,
 * when interactive, a restrained lift on hover (defined in CSS, reduced-motion
 * safe).
 */
export function EditorialCard({
  children,
  t,
  interactive = false,
  padding = 24,
  onClick,
  style,
  className,
}: EditorialCardProps) {
  return (
    <div
      onClick={onClick}
      className={`${interactive ? "lp-card" : ""}${className ? ` ${className}` : ""}`}
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: RADIUS.card,
        padding,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
