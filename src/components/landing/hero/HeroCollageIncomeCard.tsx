import { MONO_FONT_STACK } from "@/lib/app-shared";

const CARD_WHITE = "#FFFFFF";
const CARD_TEXT = "#0F1A14";
const CARD_MUTED = "#6B7570";
const CARD_BORDER = "#E8E9E5";
const EV_500 = "#52B788";
const CARD_SHADOW = "0 28px 65px rgba(0,0,0,0.42), 0 8px 20px rgba(0,0,0,0.22)";

interface HeroCollageIncomeCardProps {
  mobile?: boolean;
}

export function HeroCollageIncomeCard({ mobile }: HeroCollageIncomeCardProps) {
  const positionStyles: React.CSSProperties = mobile
    ? {
        position: "static",
        margin: "0 auto",
        width: 280,
        transform: "none",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      }
    : {
        position: "absolute",
        top: 8,
        right: 10,
        width: 196,
        transform: "rotate(3deg)",
        zIndex: 2,
        boxShadow: CARD_SHADOW,
      };

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
          marginBottom: 8,
        }}
      >
        REQUIRED INCOME
      </div>
      <div style={{ lineHeight: 1, letterSpacing: "-0.02em" }}>
        <span
          style={{
            fontFamily: MONO_FONT_STACK,
            fontFeatureSettings: "'tnum', 'zero'",
            fontSize: 30,
            fontWeight: 700,
            color: CARD_TEXT,
          }}
        >
          $6,840
        </span>
        <span
          style={{
            fontFamily: MONO_FONT_STACK,
            fontFeatureSettings: "'tnum', 'zero'",
            fontSize: 30,
            fontWeight: 400,
            color: "#A8B0AB",
          }}
        >
          .00
        </span>
      </div>
      <div style={{ fontSize: 11, color: CARD_MUTED, fontWeight: 500, marginTop: 8 }}>
        per month, post-tax
      </div>

      <div
        style={{
          height: 1,
          background: CARD_BORDER,
          marginTop: 14,
          marginBottom: 12,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: EV_500,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 500, color: CARD_TEXT }}>
          Financial health: Strong
        </span>
      </div>
    </div>
  );
}
