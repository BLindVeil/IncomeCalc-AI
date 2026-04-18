import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800, MONO_FONT_STACK, fmt } from "@/lib/app-shared";

export interface TopMoveCardProps {
  t: ThemeConfig;
  category: string;
  amount: number;
  percentOfTotal: number;
  suggestion: string;
  onSimulator?: () => void;
}

export function TopMoveCard({ t, category, amount, percentOfTotal, suggestion, onSimulator }: TopMoveCardProps) {
  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "1.25rem",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>
        Top Move
      </div>
      <div style={{ fontSize: 12, color: t.muted, marginBottom: 16 }}>
        Your biggest expense lever
      </div>

      <div
        style={{
          background: `${EV_500}10`,
          border: `1px solid ${EV_500}25`,
          borderRadius: 12,
          padding: "1rem",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{category}</span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: EV_500,
              fontFamily: MONO_FONT_STACK,
              fontFeatureSettings: "'tnum', 'zero'",
            }}
          >
            {fmt(amount)}/mo
          </span>
        </div>
        <div style={{ fontSize: 12, color: t.muted }}>
          {percentOfTotal.toFixed(0)}% of your total monthly expenses
        </div>
      </div>

      <p style={{ fontSize: 13, color: t.text, lineHeight: 1.6, margin: "0 0 14px" }}>
        {suggestion}
      </p>

      <button
        onClick={onSimulator}
        style={{
          width: "100%",
          background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "10px 0",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Simulate reducing {category.toLowerCase()}
      </button>
    </div>
  );
}
