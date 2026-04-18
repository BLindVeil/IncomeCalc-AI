import { useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_50, EV_500, EV_600, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";

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
    features: "Required income · Health score · Income gap · Top move",
    monthly: 0,
    yearly: 0,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Go deeper on your diagnosis",
    features: "Everything in Free · AI diagnosis · Scenario simulator · Saved scenarios · Budget tracking",
    monthly: 4.99,
    yearly: 49,
    yearlySavings: "save 18%",
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "The full Ascentra experience",
    features: "Everything in Pro · AI action plan · 12-month forecast · Advanced analytics · Priority support",
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
    background: active ? t.primary : "transparent",
    color: active ? "#fff" : t.muted,
  });

  function handleContinue() {
    if (selected === "free") onStart();
    else onUpgrade(selected);
  }

  return (
    <section id="pricing" style={{ marginTop: 48 }}>
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
        PLAN & BILLING
      </div>

      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          padding: "1.5rem",
        }}
      >
        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <div
            style={{
              display: "inline-flex",
              gap: 2,
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
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
                {i > 0 && <div style={{ height: 1, background: t.border }} />}
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
                    borderLeft: tier.recommended ? `3px solid ${EV_500}` : "3px solid transparent",
                  }}
                >
                  {/* Radio */}
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? EV_500 : t.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: EV_500 }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{tier.name}</span>
                      {tier.recommended && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: isDark ? "rgba(82,183,136,0.12)" : EV_50,
                            color: isDark ? EV_500 : EV_800,
                          }}
                        >
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: t.muted, marginBottom: 4 }}>{tier.tagline}</div>
                    <div style={{ fontSize: 12, color: t.muted, opacity: 0.8 }}>{tier.features}</div>
                  </div>

                  {/* Price */}
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          fontFamily: MONO_FONT_STACK,
                          fontFeatureSettings: "'tnum', 'zero'",
                          color: t.text,
                        }}
                      >
                        ${price === 0 ? "0" : price}
                      </span>
                      <span style={{ fontSize: 12, color: t.muted }}>{priceSuffix}</span>
                    </div>
                    {tier.yearlySavings && billing === "monthly" && (
                      <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                        ${tier.yearly}/yr — {tier.yearlySavings}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          style={{
            marginTop: 20,
            width: "100%",
            background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
          }}
        >
          Continue with {selected === "free" ? "Free" : selected === "pro" ? "Pro" : "Premium"} →
        </button>
      </div>
    </section>
  );
}
