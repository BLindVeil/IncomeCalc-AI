import type { ThemeConfig } from "@/lib/app-shared";
import { MONO_FONT_STACK, fmt } from "@/lib/app-shared";

export interface ExpenseSlice {
  label: string;
  value: number;
  color: string;
}

export interface ExpenseDonutProps {
  t: ThemeConfig;
  slices: ExpenseSlice[];
  total: number;
}

const DONUT_COLORS = [
  "#1B4332", "#40916C", "#52B788", "#74C69D", "#95D5B2",
  "#B7E4C7", "#D8F3DC", "#2D6A4F", "#081C15",
];

export function ExpenseDonut({ t, slices, total }: ExpenseDonutProps) {
  const radius = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * radius;

  // Build SVG arcs
  let offset = 0;
  const arcs = slices.map((s, i) => {
    const pct = total > 0 ? s.value / total : 0;
    const dashLen = pct * circumference;
    const dashOffset = -offset;
    offset += dashLen;
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
        style={{ transition: "stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease" }}
      />
    );
  });

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "1.25rem",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 16 }}>
        Expense Breakdown
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* SVG donut */}
        <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
          <svg width={160} height={160} viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text, fontFamily: MONO_FONT_STACK }}>
              {fmt(total)}
            </div>
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
                <span style={{ fontSize: 11, color: t.muted, fontFamily: MONO_FONT_STACK, flexShrink: 0 }}>
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
