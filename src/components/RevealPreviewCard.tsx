import type { ThemeConfig } from "@/lib/app-shared";
import { EV_300, EV_500, EV_600, EV_800 } from "@/lib/app-shared";
import { FormattedNumber } from "@/components/FormattedNumber";
import { useIsMobile } from "@/lib/useIsMobile";

interface RevealPreviewCardProps {
  t: ThemeConfig;
  isDark: boolean;
}

const SEGMENTS = [
  { pct: "35%", color: EV_800 },
  { pct: "25%", color: EV_600 },
  { pct: "18%", color: EV_500 },
  { pct: "22%", color: EV_300 },
];

const LEGEND = [
  { color: EV_800, label: "Housing 35%" },
  { color: EV_600, label: "Transport + Food 25%" },
  { color: EV_500, label: "Debt + Subs 18%" },
  { color: EV_300, label: "Other 22%" },
];

export function RevealPreviewCard({ t }: RevealPreviewCardProps) {
  const isMobile = useIsMobile();
  const cardWidth = isMobile ? 280 : 340;

  const cardStyle: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 16,
    padding: 28,
    width: cardWidth,
    position: "relative",
    zIndex: 1,
  };

  const shadowCardStyle: React.CSSProperties = {
    ...cardStyle,
    position: "absolute",
    top: 8,
    left: 8,
    opacity: 0.4,
    zIndex: 0,
    pointerEvents: "none",
  };

  return (
    <div style={{ position: "relative", width: cardWidth + 8, height: "fit-content" }}>
      <div style={shadowCardStyle} aria-hidden />

      <div style={cardStyle}>
        {/* Label */}
        <div style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.08em", fontWeight: 500, color: t.muted, marginBottom: 8 }}>
          YOUR REQUIRED INCOME
        </div>

        {/* Main number */}
        <FormattedNumber value={6840} fontSize={isMobile ? 36 : 44} fontWeight={700} color={t.text} centsColor={t.muted} />

        {/* Sub-label */}
        <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>monthly, post-tax</div>

        {/* Bar chart */}
        <div style={{ display: "flex", gap: 2, height: 12, borderRadius: 8, overflow: "hidden", marginTop: 20 }}>
          {SEGMENTS.map((s, i) => (
            <div key={i} style={{ width: s.pct, background: s.color, height: "100%" }} />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 12, rowGap: 6, marginTop: 8 }}>
          {LEGEND.map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: t.muted, fontWeight: 400 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: t.border, marginTop: 20, marginBottom: 16 }} />

        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: EV_500, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>Financial health: Strong</span>
        </div>
      </div>
    </div>
  );
}
