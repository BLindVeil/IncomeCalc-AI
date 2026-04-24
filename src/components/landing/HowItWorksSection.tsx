import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";

interface HowItWorksSectionProps {
  t: ThemeConfig;
  isDark: boolean;
  onStart: () => void;
}

const STEPS = [
  {
    num: "01",
    label: "Enter your expenses",
    desc: "Rent, transport, food, subscriptions, debt. Rough estimates are fine.",
  },
  {
    num: "02",
    label: "Get your number",
    desc: "Required monthly income, health score, and where you stand against benchmarks.",
  },
  {
    num: "03",
    label: "See what to change",
    desc: "Your top moves ranked by impact. Test scenarios against your real numbers.",
  },
];

export function HowItWorksSection({ t, isDark, onStart }: HowItWorksSectionProps) {
  return (
    <section id="how" style={{ marginTop: 48 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: t.muted,
          marginBottom: 20,
        }}
      >
        HOW IT WORKS
      </div>

      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          padding: "1.5rem",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 24, lineHeight: 1.3 }}>
          Three steps. Sixty seconds.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {STEPS.map((step) => (
            <div key={step.num} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Step dot */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `1.5px solid ${EV_500}`,
                  flexShrink: 0,
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: EV_500 }} />
              </div>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: MONO_FONT_STACK,
                      fontFeatureSettings: "'tnum', 'zero'",
                      color: t.muted,
                      fontWeight: 500,
                    }}
                  >
                    {step.num}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
                    {step.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.5 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          style={{
            marginTop: 24,
            background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(27,67,50,0.25)",
          }}
        >
          Calculate my number →
        </button>
      </div>
    </section>
  );
}
