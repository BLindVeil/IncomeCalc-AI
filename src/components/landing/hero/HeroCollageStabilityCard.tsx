import { MONO_FONT_STACK } from "@/lib/app-shared";

const CARD_WHITE = "#FFFFFF";
const CARD_TEXT = "#0F1A14";
const CARD_MUTED = "#6B7570";
const CARD_BORDER = "#E8E9E5";
const EV_500 = "#52B788";
const EV_700 = "#2D6A4F";
const CARD_SHADOW = "0 28px 65px rgba(0,0,0,0.42), 0 8px 20px rgba(0,0,0,0.22)";

function MiniIndicator({ label, fillPct, value }: { label: string; fillPct: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: CARD_MUTED, width: 60, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 3, background: CARD_BORDER, borderRadius: 2 }}>
        <div style={{ width: fillPct, height: "100%", background: EV_500, borderRadius: 2 }} />
      </div>
      <span
        style={{
          fontSize: 10,
          color: CARD_TEXT,
          fontWeight: 500,
          width: 32,
          textAlign: "right" as const,
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function HeroCollageStabilityCard({ mobile }: { mobile?: boolean }) {
  const positionStyles: React.CSSProperties = mobile
    ? { position: "static", width: "100%", transform: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }
    : { position: "absolute", top: 50, left: 0, width: 238, transform: "rotate(-4deg)", zIndex: 1, boxShadow: CARD_SHADOW };

  return (
    <div
      style={{
        ...positionStyles,
        background: CARD_WHITE,
        borderRadius: 16,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.1em",
          fontWeight: 500,
          color: CARD_MUTED,
          textTransform: "uppercase" as const,
        }}
      >
        STABILITY SCORE
      </div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: MONO_FONT_STACK,
            fontFeatureSettings: "'tnum', 'zero'",
            fontSize: 32,
            fontWeight: 700,
            color: CARD_TEXT,
            lineHeight: 1,
          }}
        >
          82
        </span>
        <span style={{ fontSize: 13, color: CARD_MUTED, fontWeight: 400 }}>/100</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: EV_700, marginTop: 2 }}>Strong</div>

      {/* Half-donut */}
      <svg
        width={200}
        height={100}
        viewBox="0 0 200 100"
        fill="none"
        style={{ display: "block", marginTop: 14 }}
      >
        <path
          d="M20 100 A 80 80 0 0 1 180 100"
          stroke={CARD_BORDER}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M20 100 A 80 80 0 0 1 180 100"
          stroke={EV_500}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray="251.3"
          strokeDashoffset="45.2"
        />
      </svg>

      {/* Mini indicators */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
        <MiniIndicator label="Housing" fillPct="72%" value="28%" />
        <MiniIndicator label="Savings" fillPct="60%" value="18%" />
        <MiniIndicator label="Debt" fillPct="85%" value="15%" />
      </div>
    </div>
  );
}
