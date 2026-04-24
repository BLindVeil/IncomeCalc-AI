import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";

interface WhyAscentraSectionProps {
  t: ThemeConfig;
  isDark: boolean;
}

interface InsightCard {
  category: string;
  title: string;
  description: string;
  numeric?: string;
  numericLabel?: string;
}

const INSIGHTS: InsightCard[] = [
  {
    category: "DIAGNOSIS",
    title: "Most people don't know their required income.",
    description:
      "Your number depends on rent, debt, tax bracket, and savings goals interacting. We calculate it in 60 seconds so you stop guessing at what 'enough' means.",
  },
  {
    category: "CLARITY",
    title: "One number beats forty charts.",
    description:
      "Budgeting apps show you twelve dashboards and call it insight. Ascentra gives you one required-income number and one next move.",
    numeric: "60 sec",
  },
  {
    category: "STABILITY",
    title: "A single score for your financial health.",
    description:
      "Your stability score combines runway, debt ratio, and savings rate into one number. Watch it move as your situation changes — no spreadsheet required.",
    numeric: "82",
    numericLabel: "SAMPLE SCORE",
  },
  {
    category: "SCENARIO",
    title: "Test decisions before you make them.",
    description:
      "Moving to a cheaper apartment, taking a different job, cutting subscriptions — see the required-income impact of every change against your actual numbers.",
    numeric: "−$400/mo",
  },
  {
    category: "SIMPLICITY",
    title: "No bank linking. No credit pull. No onboarding quiz.",
    description:
      "Enter what you spend, get your number, get on with your life. Most people finish in under a minute.",
  },
  {
    category: "TRANSPARENCY",
    title: "Your number is yours. No lock-in.",
    description:
      "Free tier gives you your required income forever. Pro and Premium unlock deeper insights, scenarios, and AI-powered planning.",
  },
];

export function WhyAscentraSection({ t, isDark }: WhyAscentraSectionProps) {
  return (
    <section id="why" style={{ marginTop: 48 }}>
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
        WHY ASCENTRA
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {INSIGHTS.map((card) => (
          <div
            key={card.category}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: t.primarySoft,
                    color: isDark ? EV_500 : EV_800,
                    marginBottom: 10,
                  }}
                >
                  {card.category}
                </span>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 6, lineHeight: 1.4 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.55 }}>
                  {card.description}
                </div>
              </div>

              {card.numeric && (
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  {card.numericLabel && (
                    <div style={{ fontSize: 10, color: t.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                      {card.numericLabel}
                    </div>
                  )}
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: card.numericLabel ? 24 : 12,
                      fontWeight: card.numericLabel ? 700 : 500,
                      fontFamily: MONO_FONT_STACK,
                      fontFeatureSettings: "'tnum', 'zero'",
                      color: EV_500,
                      ...(card.numericLabel
                        ? {}
                        : {
                            background: t.primarySoft,
                            padding: "4px 10px",
                            borderRadius: 999,
                          }),
                    }}
                  >
                    {card.numeric}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
