import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "./useReveal";

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms, applied via the shared --lp-delay custom property. */
  delay?: number;
  as?: "div" | "section" | "li" | "ul";
  style?: CSSProperties;
  className?: string;
}

/**
 * Scroll-reveal wrapper: fades + rises its children into view once. The motion
 * lives in CSS (`.lp-reveal`); this component only wires the observer and the
 * per-item delay, so it stays a cheap client leaf.
 */
export function Reveal({ children, delay = 0, as = "div", style, className }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      className={`lp-reveal${className ? ` ${className}` : ""}`}
      style={{ ...(delay ? { ["--lp-delay" as string]: `${delay}ms` } : null), ...style }}
    >
      {children}
    </Tag>
  );
}
