import type { ThemeConfig } from "@/lib/app-shared";
import { INK, GREY, GREY_LIGHT, HAIRLINE, MONO } from "./landing-theme";
import { PillButton } from "./PillButton";

interface HowItWorksSectionProps {
  t: ThemeConfig;
  isDark: boolean;
  onStart: () => void;
}

const STEPS = [
  {
    label: "Enter your expenses",
    desc: "Rent, transport, food, subscriptions, debt. Rough estimates are fine, and you can refine any figure later.",
  },
  {
    label: "Get your number",
    desc: "Required monthly income, stability score, and where you stand against benchmarks for your situation.",
  },
  {
    label: "See what to change",
    desc: "Your moves ranked by dollar impact. Test scenarios against your real numbers before committing to any of them.",
  },
];

export function HowItWorksSection({ onStart }: HowItWorksSectionProps) {
  return (
    <section id="how">
      <h2
        style={{
          fontSize: 40,
          lineHeight: 1.1,
          letterSpacing: "-0.032em",
          fontWeight: 600,
          color: INK,
          margin: 0,
        }}
      >
        Three steps. Sixty seconds
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 32,
          marginTop: 48,
        }}
      >
        {STEPS.map((step, i) => (
          <div key={step.label} style={{ paddingTop: 20, borderTop: `1px solid ${HAIRLINE}` }}>
            <div style={{ fontFamily: MONO, fontSize: 11.5, color: GREY_LIGHT, marginBottom: 14 }}>
              0{i + 1}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: INK, margin: 0, letterSpacing: "-0.012em" }}>
              {step.label}
            </h3>
            <p style={{ fontSize: 13.5, color: GREY, lineHeight: 1.65, marginTop: 8, marginBottom: 0 }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 44 }}>
        <PillButton onClick={onStart}>Calculate my number</PillButton>
      </div>
    </section>
  );
}
