import type { CSSProperties } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { TYPE, eyebrow as eyebrowStyle } from "./tokens";

interface StepHeaderProps {
  /** Small uppercase marker, e.g. "STEP 1 OF 2". */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  t: ThemeConfig;
  size?: "h1" | "h2";
  align?: "left" | "center";
  /** Base entrance delay in ms; the three lines stagger out from here. */
  delay?: number;
}

const d = (ms: number): CSSProperties => ({ ["--lp-delay" as string]: `${ms}ms` });

/**
 * The standard section/step lead-in: eyebrow → title → subtitle, each rising in
 * on first paint with a short stagger (via the shared `.lp-in` keyframe). The
 * title uses the tight-tracked editorial display scale.
 */
export function StepHeader({ eyebrow, title, subtitle, t, size = "h1", align = "left", delay = 0 }: StepHeaderProps) {
  const heading = size === "h1" ? TYPE.h1 : TYPE.h2;
  return (
    <div style={{ textAlign: align, maxWidth: align === "center" ? 640 : undefined, marginInline: align === "center" ? "auto" : undefined }}>
      {eyebrow && (
        <div className="lp-in" style={{ ...eyebrowStyle, color: t.muted, marginBottom: 12, ...d(delay) }}>
          {eyebrow}
        </div>
      )}
      <h1 className="lp-in" style={{ ...heading, color: t.text, margin: 0, ...d(delay + 80) }}>
        {title}
      </h1>
      {subtitle && (
        <p
          className="lp-in"
          style={{
            ...TYPE.body,
            color: t.muted,
            margin: `10px 0 0`,
            maxWidth: align === "center" ? 520 : 560,
            marginInline: align === "center" ? "auto" : undefined,
            ...d(delay + 160),
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
