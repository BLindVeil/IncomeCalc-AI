import { MONO_FONT_STACK } from "@/lib/app-shared";

const CARD_WHITE = "#FFFFFF";
const CARD_TEXT = "#0F1A14";
const CARD_MUTED = "#6B7570";
const CARD_BORDER = "#E8E9E5";
const EV_50 = "#F1FAF4";
const EV_800 = "#1B4332";
const CARD_SHADOW = "0 28px 65px rgba(0,0,0,0.42), 0 8px 20px rgba(0,0,0,0.22)";

export function HeroCollageTopMoveCard({ mobile }: { mobile?: boolean }) {
  const positionStyles: React.CSSProperties = mobile
    ? { position: "static", width: "100%", transform: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }
    : { position: "absolute", bottom: 4, left: 72, width: 264, transform: "rotate(-2deg)", zIndex: 3, boxShadow: CARD_SHADOW };

  return (
    <div
      style={{
        ...positionStyles,
        background: CARD_WHITE,
        borderRadius: 16,
        padding: 18,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            padding: "3px 10px",
            background: EV_50,
            color: EV_800,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            borderRadius: 999,
            textTransform: "uppercase" as const,
          }}
        >
          TOP MOVE
        </span>
        <span
          style={{
            padding: "3px 10px",
            background: EV_50,
            color: EV_800,
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 6,
            fontFamily: MONO_FONT_STACK,
            fontFeatureSettings: "'tnum', 'zero'",
          }}
        >
          +$2,400/yr
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: CARD_TEXT,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
        }}
      >
        Cut rent by $200/mo — switch to a similar apartment 2 miles east.
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: CARD_BORDER, marginTop: 12, marginBottom: 10 }} />

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: CARD_MUTED,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, color: CARD_MUTED }}>Based on your expense profile</span>
      </div>
    </div>
  );
}
