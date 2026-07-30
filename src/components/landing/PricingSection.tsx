import { useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { FULL_PRICE } from "@/lib/app-shared";
import { INK, GREY, GREY_LIGHT, HAIRLINE, MINT, MONO, WHITE, RADIUS_CARD } from "./landing-theme";
import { PillButton } from "./PillButton";
import { Reveal } from "./Reveal";

interface PricingSectionProps {
  t: ThemeConfig;
  isDark: boolean;
  onStart: () => void;
  onUpgrade: () => void;
}

interface TierRow {
  id: "free" | "full";
  name: string;
  tagline: string;
  features: string;
  priceLabel: string;
  priceSuffix: string;
  recommended?: boolean;
}

const TIERS: TierRow[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Know your number",
    features: "Required income · Health score · Income gap · Top move · 2 debts tracked",
    priceLabel: "$0",
    priceSuffix: "forever",
  },
  {
    id: "full",
    name: "Full Diagnosis",
    tagline: "Everything, paid once — no subscription",
    features:
      "Complete AI diagnosis · Savings analysis · 12-month forecast · Unlimited scenarios · FIRE planning · Unlimited debts · Every tool, forever",
    priceLabel: `$${FULL_PRICE}`,
    priceSuffix: "once",
    recommended: true,
  },
];

export function PricingSection({ t: _t, isDark: _isDark, onStart, onUpgrade }: PricingSectionProps) {
  const [selected, setSelected] = useState<"free" | "full">("full");

  function handleContinue() {
    if (selected === "free") onStart();
    else onUpgrade();
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
            margin: "0 0 12px",
          }}
        >
          Pay once. Own it forever.
        </h2>
        <p style={{ fontSize: 15, color: GREY, lineHeight: 1.6, margin: "0 0 40px", maxWidth: 520 }}>
          Every budgeting app wants a monthly subscription. Ascentra is a one-time
          diagnosis — no renewals, nothing to cancel, no tracking homework.
        </p>
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
        {/* Tier rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {TIERS.map((tier, i) => {
            const isSelected = selected === tier.id;

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
                          NO SUBSCRIPTION
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: GREY, marginBottom: 4 }}>{tier.tagline}</div>
                    <div style={{ fontSize: 12, color: GREY, lineHeight: 1.5 }}>{tier.features}</div>
                  </div>

                  {/* Price */}
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          fontFamily: MONO,
                          fontFeatureSettings: "'tnum', 'zero'",
                          color: INK,
                        }}
                      >
                        {tier.priceLabel}
                      </span>
                      <span style={{ fontSize: 12, color: GREY_LIGHT }}>{tier.priceSuffix}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue button */}
        <div style={{ marginTop: 24 }}>
          <PillButton onClick={handleContinue}>
            {selected === "free" ? "Start free" : `Unlock Full Diagnosis — $${FULL_PRICE} once`}
          </PillButton>
        </div>
      </Reveal>
    </section>
  );
}
