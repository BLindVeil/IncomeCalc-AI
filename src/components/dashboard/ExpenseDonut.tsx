import { useEffect, useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { CountUpNumber, eyebrow as eyebrowStyle } from "@/components/editorial";

export interface ExpenseSlice {
  label: string;
  value: number;
  color: string;
}

export interface ExpenseDonutProps {
  t: ThemeConfig;
  slices: ExpenseSlice[];
  total: number;
  isMobile?: boolean;
}

export const DONUT_COLORS = [
  "#1B4332", "#40916C", "#52B788", "#74C69D", "#95D5B2",
  "#B7E4C7", "#D8F3DC", "#2D6A4F", "#081C15",
];

export function ExpenseDonut({ t, slices, total, isMobile }: ExpenseDonutProps) {
  const donutSize = isMobile ? 120 : 160;
  const radius = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * radius;

  // Signature draw-in: arcs grow from zero into place on first paint, honouring
  // reduced-motion (which renders them fully drawn immediately).
  const [drawn, setDrawn] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Build SVG arcs
  let offset = 0;
  const arcs = slices.map((s, i) => {
    const pct = total > 0 ? s.value / total : 0;
    const fullDash = pct * circumference;
    const dashLen = drawn ? fullDash : 0;
    const dashOffset = -offset;
    offset += fullDash;
    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={s.color || DONUT_COLORS[i % DONUT_COLORS.length]}
        strokeWidth={20}
        strokeDasharray={`${dashLen} ${circumference - dashLen}`}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.23,1,0.32,1)", transitionDelay: `${i * 70}ms` }}
      />
    );
  });

  return (
    <div
      className="lp-in"
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "1.25rem",
      }}
    >
      <div style={{ ...eyebrowStyle, color: t.muted, marginBottom: 16 }}>
        Expense Breakdown
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 16 : 24 }}>
        {/* SVG donut */}
        <div style={{ position: "relative", width: donutSize, height: donutSize, flexShrink: 0 }}>
          <svg width={donutSize} height={donutSize} viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
            {/* Background ring */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke={t.border} strokeWidth={20} />
            {arcs}
          </svg>
          {/* Center label */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 11, color: t.muted }}>Total</div>
            <CountUpNumber value={total} prefix="$" style={{ fontSize: 16, fontWeight: 700, color: t.text }} />
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
          {slices.map((s, i) => {
            const pct = total > 0 ? ((s.value / total) * 100).toFixed(0) : "0";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: s.color || DONUT_COLORS[i % DONUT_COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: t.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 11, color: t.muted, fontFamily: "'Geist Mono', ui-monospace, monospace", flexShrink: 0 }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
