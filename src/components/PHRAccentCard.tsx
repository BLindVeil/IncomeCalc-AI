import { MONO_FONT_STACK } from "@/lib/app-shared";
import type { ThemeConfig } from "@/lib/app-shared";

export type PHRAccentKind = "reveal" | "topMove" | "stability" | "scenario";

interface PHRAccentCardProps {
  t: ThemeConfig;
  isDark: boolean;
  kind: PHRAccentKind;
}

export function PHRAccentCard({ kind }: PHRAccentCardProps) {
  const base: React.CSSProperties = {
    background: "linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)",
    borderRadius: 16,
    padding: 24,
    minHeight: 220,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  };

  const caption: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    opacity: 0.7,
    marginBottom: 12,
    fontWeight: 500,
  };

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    background: "#F1FAF4",
    color: "#081C15",
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    marginTop: 12,
    alignSelf: "flex-start",
  };

  if (kind === "reveal") {
    return (
      <div style={base}>
        <div style={caption}>REQUIRED INCOME</div>
        <div
          style={{
            fontFamily: MONO_FONT_STACK,
            fontFeatureSettings: "'tnum', 'zero'",
            fontSize: 40,
            fontWeight: 700,
          }}
        >
          $6,840
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>per month</div>
      </div>
    );
  }

  if (kind === "topMove") {
    return (
      <div style={base}>
        <div style={caption}>TOP MOVE</div>
        <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.4 }}>
          Cut subscriptions by $80/mo
        </div>
        <div style={pillStyle}>+$960/yr impact</div>
      </div>
    );
  }

  if (kind === "stability") {
    return (
      <div style={base}>
        <div style={caption}>STABILITY SCORE</div>
        <div
          style={{
            fontFamily: MONO_FONT_STACK,
            fontFeatureSettings: "'tnum', 'zero'",
            fontSize: 44,
            fontWeight: 700,
          }}
        >
          82
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Strong</div>
        {/* Half-donut arc */}
        <svg width={120} height={60} viewBox="0 0 120 60" fill="none" style={{ alignSelf: "flex-start" }}>
          {/* Background track */}
          <path
            d="M8 56 A52 52 0 0 1 112 56"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
          />
          {/* Foreground arc — 82% fill */}
          <path
            d="M8 56 A52 52 0 0 1 112 56"
            stroke="white"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${0.82 * 163} ${163}`}
          />
        </svg>
      </div>
    );
  }

  // kind === "scenario"
  return (
    <div style={base}>
      <div style={caption}>SCENARIO</div>
      <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>
        If I move to a $1,800 apt…
      </div>
      <div style={pillStyle}>Required income: −$400/mo</div>
    </div>
  );
}
