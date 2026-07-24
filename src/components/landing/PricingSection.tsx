import { useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { INK, GREY, GREY_LIGHT, HAIRLINE, MINT, MONO, WHITE, RADIUS_CARD } from "./landing-theme";
import { PillButton } from "./PillButton";
import { Reveal } from "./Reveal";

interface PricingSectionProps {
  t: ThemeConfig;
  isDark: boolean;
  onStart: () => void;
  onUpgrade: (plan: "pro" | "premium") => void;
}

type Billing = "monthly" | "yearly";

interface TierRow {
  id: "free" | "pro" | "premium";
  name: string;
  tagline: string;
  features: string;
  monthly: number;
  yearly: number;
  yearlySavings?: string;
  recommended?: boolean;
}

const TIERS: TierRow[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Know your number",
    features: "Required income · Health score · Income gap · Top move · 2 debts tracked",
    monthly: 0,
    yearly: 0,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Clarity on what to change",
    features: "Everything in Free · AI budget insights · AI income ideas · Scenario simulator · Saved scenarios · 6 debts tracked",
    monthly: 4.99,
    yearly: 49,
    yearlySavings: "save 18%",
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Full planning and forecasting",
    features: "Everything in Pro · AI advisor · Savings analysis · 12-month forecast · FIRE planning · Unlimited debts",
    monthly: 19,
    yearly: 99,
    yearlySavings: "save 57%",
    recommended: true,
  },
];

export function PricingSection({ t, isDark, onStart, onUpgrade }: PricingSectionProps) {
  const [billing, setBilling] = useState<Billing>("yearly");
  const [selected, setSelected] = useState<"free" | "pro" | "premium">("premium");

  const segmentStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background: active ? INK : "transparent",
    color: active ? WHITE : GREY,
    transition: "background 180ms ease, color 180ms ease",
  });

  function handleContinue() {
    if (selected === "free") onStart();
    else onUpgrade(selected);
  }

  return (
    <section id="pricing" style={{ marginTop: 48 }}>
      <Reveal>
        <h2
          style={{
            fontSize: 40,
            lineHeight: 1.1,
            letterSpacing: "-0.032em",
            fontWeight: 600,
            color: INK,
            margin: "0 0 40px",
          }}
        >
          Start free. Upgrade when it pays for itself
        </h2>
      </Reveal>

      <Reveal
        delay={90}
        style={{
          background: WHITE,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: RADIUS_CARD,
          padding: "1.5rem",
        }}
      >
        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <div
            style={{
              display: "inline-flex",
              gap: 2,
              background: "#F4F4F5",
              borderRadius: 999,
              padding: 2,
            }}
          >
            <button style={segmentStyle(billing === "monthly")} onClick={() => setBilling("monthly")}>
              Monthly
            </button>
            <button style={segmentStyle(billing === "yearly")} onClick={() => setBilling("yearly")}>
              Yearly
            </button>
          </div>
        </div>

        {/* Tier rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {TIERS.map((tier, i) => {
            const isSelected = selected === tier.id;
            const price = billing === "monthly" ? tier.monthly : tier.yearly;
            const priceSuffix = billing === "monthly" ? "/mo" : "/yr";

            return (
              <div key={tier.id}>
                {i > 0 && <div style={{ height: 1, background: HAIRLINE }} />}
                <div
                  onClick={() => setSelected(tier.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 12px",
                    cursor: "pointer",
                    borderRadius: 12,
                    position: "relative",
                    transition: "background 200ms ease, border-color 200ms ease",
                    background: tier.recommended ? MINT : "transparent",
                  }}
                >
                  {/* Radio */}
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? INK : "#D4D4D8"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "border-color 200ms ease",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: INK,
                        transform: isSelected ? "scale(1)" : "scale(0.4)",
                        opacity: isSelected ? 1 : 0,
                        transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms ease",
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{tier.name}</span>
                      {tier.recommended && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "rgba(10,10,10,0.08)",
                            color: INK,
                          }}
                        >
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: GREY, marginBottom: 4 }}>{tier.tagline}</div>
                    <div style={{ fontSize: 12, color: GREY, lineHeight: 1.5 }}>{tier.features}</div>
                  </div>

                  {/* Price */}
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          fontFamily: MONO,
                          fontFeatureSettings: "'tnum', 'zero'",
                          color: INK,
                        }}
                      >
                        ${price === 0 ? "0" : price}
                      </span>
                      <span style={{ fontSize: 12, color: GREY_LIGHT }}>{priceSuffix}</span>
                    </div>
                    {tier.yearlySavings && billing === "yearly" && (
                      <div style={{ fontSize: 11, color: GREY, fontWeight: 500, marginTop: 2 }}>
                        {tier.yearlySavings}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        <div style={{ marginTop: 24 }}>
          <PillButton onClick={handleContinue}>
            Continue with {selected === "free" ? "Free" : selected === "pro" ? "Pro" : "Premium"}
          </PillButton>
        </div>
      </Reveal>
    </section>
  );
}
