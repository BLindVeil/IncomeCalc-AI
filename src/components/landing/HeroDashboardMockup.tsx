import { INK, GREY, GREY_LIGHT, HAIRLINE, GREEN, GREEN_DEEP, MONO, WHITE } from "./landing-theme";

/**
 * Product preview for the hero. Deliberately dense: a headline figure, supporting
 * breakdown, a hairline activity chart and a ledger table, so it reads as real
 * software rather than a diagram of software.
 */

const SIDEBAR_GROUPS: { label: string; items: string[] }[] = [
  { label: "", items: ["Dashboard", "Calculator"] },
  { label: "Analysis", items: ["Diagnosis", "Stability score", "Income gap"] },
  { label: "Planning", items: ["Scenarios", "Forecast", "Debt payoff", "FIRE"] },
];

const LEDGER = [
  ["Housing", "Rent + utilities", "$2,340", "34%"],
  ["Transport", "Car, fuel, transit", "$1,180", "17%"],
  ["Food", "Groceries + dining", "$1,368", "20%"],
  ["Debt", "Minimum payments", "$612", "9%"],
];

// Deterministic bar heights: dense hairline chart, stable across renders.
const BARS = Array.from({ length: 68 }, (_, i) => {
  const wave = Math.sin(i / 5.5) * 0.28 + Math.sin(i / 2.1) * 0.14;
  return 0.42 + wave + (i % 7) * 0.022;
});

export function HeroDashboardMockup({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        background: WHITE,
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${HAIRLINE}`,
        display: "flex",
        height: isMobile ? 340 : 486,
        fontSize: 10,
        boxSizing: "border-box",
      }}
    >
      {/* Sidebar */}
      {!isMobile && (
        <div
          style={{
            width: 178,
            flexShrink: 0,
            background: GREEN_DEEP,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 6px 14px" }}>
            <img src="/logo-mark.svg" alt="" width={19} height={19} style={{ borderRadius: 5 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: WHITE, letterSpacing: "-0.01em" }}>
              Ascentra
            </span>
          </div>

          {SIDEBAR_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              {group.label && (
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.38)",
                    padding: "8px 6px 5px",
                  }}
                >
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const active = item === "Dashboard";
                return (
                  <div
                    key={item}
                    style={{
                      padding: "6px 8px",
                      borderRadius: 6,
                      fontSize: 10.5,
                      color: active ? WHITE : "rgba(255,255,255,0.55)",
                      background: active ? "rgba(255,255,255,0.12)" : "transparent",
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, padding: isMobile ? "14px" : "18px 22px", overflow: "hidden", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#E7E5E4",
                fontSize: 9,
                fontWeight: 600,
                color: GREY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              AR
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: INK }}>Alex Rivera</div>
              <div style={{ fontSize: 8.5, color: GREY_LIGHT }}>Household of 2</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {["H", "D", "W", "M", "All"].map((k) => (
              <span
                key={k}
                style={{
                  fontSize: 8.5,
                  padding: "3px 7px",
                  borderRadius: 5,
                  color: k === "M" ? INK : GREY_LIGHT,
                  background: k === "M" ? "#F4F4F5" : "transparent",
                  fontFamily: MONO,
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Headline figure */}
        <div style={{ fontSize: 8.5, letterSpacing: "0.14em", color: GREY_LIGHT, textTransform: "uppercase" }}>
          Required monthly income
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 3, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: isMobile ? 27 : 34,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: INK,
              fontFamily: MONO,
              fontFeatureSettings: "'tnum','zero'",
            }}
          >
            $6,840.00
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: "2.5px 7px",
              borderRadius: 999,
              background: "#DCFCE7",
              color: "#15803D",
            }}
          >
            2.4% closer
          </span>
          <span style={{ fontSize: 8.5, color: GREY_LIGHT }}>vs. current $5,400.00</span>
        </div>

        {/* Sub-metrics */}
        <div style={{ display: "flex", gap: isMobile ? 14 : 26, marginTop: 12, flexWrap: "wrap" }}>
          {([
            ["Stability score", "82", GREEN],
            ["Income gap", "$1,440", "#DC2626"],
            ["Runway", "3.0 mo", INK],
            ["Savings rate", "11.4%", INK],
          ] as const).map(([label, value, color]) => (
            <div key={label}>
              <div style={{ fontSize: 8, color: GREY_LIGHT, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color,
                  fontFamily: MONO,
                  fontFeatureSettings: "'tnum','zero'",
                  marginTop: 2,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Hairline activity chart */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${HAIRLINE}`,
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            height: isMobile ? 52 : 78,
          }}
        >
          {BARS.slice(0, isMobile ? 34 : 68).map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(8, h * 100)}%`,
                background: i > (isMobile ? 26 : 52) ? GREEN : "#D4D4D8",
              }}
            />
          ))}
        </div>

        {/* Ledger table */}
        {!isMobile && (
          <div style={{ marginTop: 14 }}>
            {LEDGER.map(([cat, note, amount, share], i) => (
              <div
                key={cat}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.4fr 0.7fr 0.4fr",
                  gap: 8,
                  padding: "7px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${HAIRLINE}`,
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 10.5, fontWeight: 500, color: INK }}>{cat}</span>
                <span style={{ fontSize: 9.5, color: GREY_LIGHT }}>{note}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: INK,
                    fontFamily: MONO,
                    fontFeatureSettings: "'tnum','zero'",
                    textAlign: "right",
                  }}
                >
                  {amount}
                </span>
                <span style={{ fontSize: 9.5, color: GREY, fontFamily: MONO, textAlign: "right" }}>{share}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
