import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  CreditCard,
  CheckCircle,
  Shield,
  Star,
  Zap,
  Award,
  Target,
  Users,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  applyDark,
  PLANS,
  type ThemeConfig,
  type Theme,
  type PlanId,
} from "@/lib/app-shared";
import { Header } from "@/components/Header";
import { AnnualUpsellModal, RestorePurchaseModal } from "@/components/pages/ResultsPage";

// ─── SiteFooter ───────────────────────────────────────────────────────────────

function SiteFooter({ t }: { t: ThemeConfig }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${t.border}`,
        padding: "1.5rem",
        textAlign: "center",
        background: t.headerBg,
        backdropFilter: "blur(12px)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
          fontSize: "0.85rem",
        }}
      >
        <a href="/terms" style={{ color: t.muted, textDecoration: "none" }}>Terms</a>
        <a href="/privacy" style={{ color: t.muted, textDecoration: "none" }}>Privacy</a>
        <a href="/refund-policy" style={{ color: t.muted, textDecoration: "none" }}>Refund Policy</a>
        <a href="mailto:support@yourdomain.com" style={{ color: t.muted, textDecoration: "none" }}>Contact</a>
      </div>
      <div style={{ fontSize: "0.78rem", color: t.muted, opacity: 0.6 }}>
        IncomeCalc is not financial, tax, or legal advice. For informational and educational purposes only.
      </div>
    </footer>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Freelance Designer",
    text: "The AI recommendations alone saved me $340/month. I had no idea my housing was eating 42% of my income.",
    stars: 5,
    plan: "Premium",
  },
  {
    name: "James T.",
    role: "Software Engineer",
    text: "The retirement planner showed me I was 8 years behind my goal. Now I'm on track after adjusting my savings rate.",
    stars: 5,
    plan: "Pro",
  },
  {
    name: "Priya K.",
    role: "Small Business Owner",
    text: "Household planning for my family of 4 is a game changer. We found $600/mo we didn't know we were wasting.",
    stars: 5,
    plan: "Premium",
  },
];

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

export interface CheckoutPageProps {
  onBack: () => void;
  initialPlan: PlanId;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
  onRequireAuth?: (mode: "signin" | "signup") => void;
  onCheckout: (plan: PlanId, billingPeriod: "monthly" | "yearly") => void;
}

export function CheckoutPage({
  onBack,
  initialPlan,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
  onCheckout,
  onRequireAuth: _onRequireAuth,
}: CheckoutPageProps) {
  const t = applyDark(currentTheme, isDark);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingCheckoutPlan, setPendingCheckoutPlan] = useState<PlanId>("pro");

  // Analytics: pricing_viewed
  const pricingTracked = useRef(false);
  useEffect(() => {
    if (!pricingTracked.current) {
      trackEvent("pricing_viewed", { source_page: "/checkout" });
      pricingTracked.current = true;
    }
  }, []);

  // Annual upsell: show once per session per plan (when user is on monthly)
  function handleCheckoutClick(planId: PlanId) {
    if (billing === "monthly") {
      const upsellKey = `incomecalc-upsell-shown-${planId}`;
      if (!sessionStorage.getItem(upsellKey)) {
        sessionStorage.setItem(upsellKey, "1");
        setPendingCheckoutPlan(planId);
        setShowUpsellModal(true);
        return;
      }
    }

    const p = PLANS.find((pp) => pp.id === planId) ?? PLANS[0];
    const amount = billing === "monthly" ? p.price : p.yearlyPrice;

    trackEvent("checkout_clicked", { planId, billing, amount, source_page: "/checkout" });
    onCheckout(planId, billing);
  }

  function handleUpsellAnnual() {
    setShowUpsellModal(false);
    setBilling("yearly");

    const p = PLANS.find((pp) => pp.id === pendingCheckoutPlan) ?? PLANS[0];
    trackEvent("checkout_clicked", {
      planId: pendingCheckoutPlan,
      billing: "yearly",
      amount: p.yearlyPrice,
      source_page: "/checkout",
    });

    onCheckout(pendingCheckoutPlan, "yearly");
  }

  function handleUpsellMonthly() {
    setShowUpsellModal(false);

    const p = PLANS.find((pp) => pp.id === pendingCheckoutPlan) ?? PLANS[0];
    trackEvent("checkout_clicked", {
      planId: pendingCheckoutPlan,
      billing: "monthly",
      amount: p.price,
      source_page: "/checkout",
    });

    onCheckout(pendingCheckoutPlan, "monthly");
  }

  const plan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0];
  const price = billing === "monthly" ? plan.price : plan.yearlyPrice;

  const yearlySavings = Math.round((plan.price * 12 - plan.yearlyPrice));

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" }}>
      <div className="atv-ambient-bg">
        <div className="atv-ambient-teal" />
      </div>
      <Header
        isDark={isDark}
        setIsDark={setIsDark}
        currentTheme={currentTheme}
        baseTheme={baseTheme}
        setTheme={setTheme}
        onLogoClick={onBack}
      />

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "96px 1.5rem 4rem", position: "relative", zIndex: 1 }}>
        {/* Back nav */}
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: t.muted,
            fontSize: "0.9rem",
            padding: 0,
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="atv-fade-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: `${t.primary}1F`,
              border: `1px solid ${t.primary}40`,
              borderRadius: "20px",
              padding: "0.4rem 1.1rem",
              fontSize: "0.85rem",
              color: t.primary,
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            <CreditCard size={14} />
            Upgrade IncomeCalc
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: t.text, margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
            Choose Your Plan
          </h1>
          <p style={{ color: t.muted, fontSize: "1rem", margin: 0 }}>
            Unlock powerful features to take control of your financial future.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div
            className="atv-glass-static"
            style={{
              display: "inline-flex",
              padding: "4px",
              gap: "4px",
              borderRadius: "14px",
            }}
          >
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  background: billing === b ? `linear-gradient(135deg, ${t.primary}, ${t.accent})` : "transparent",
                  color: billing === b ? "#fff" : t.muted,
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s ease",
                }}
              >
                {b === "monthly" ? "Monthly" : (
                  <>
                    Yearly
                    <span
                      style={{
                        fontSize: "0.7rem",
                        background: "#34D399",
                        color: "#fff",
                        borderRadius: "6px",
                        padding: "1px 6px",
                        fontWeight: 700,
                      }}
                    >
                      SAVE
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}
        >
          {PLANS.map((p) => {
            const isSelected = selectedPlan === p.id;
            const displayPrice = billing === "monthly" ? p.price : p.yearlyPrice;
            const priceLabel = billing === "monthly" ? "/mo" : "/year";
            const monthlySave = Math.round(p.price * 12 - p.yearlyPrice);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className="atv-glass"
                style={{
                  padding: "1.75rem",
                  cursor: "pointer",
                  position: "relative",
                  border: isSelected
                    ? `2px solid ${t.primary}99`
                    : `2px solid ${t.border}`,
                  boxShadow: isSelected
                    ? `0 20px 40px rgba(0,0,0,0.35), 0 0 20px ${t.primary}26`
                    : "0 20px 40px rgba(0,0,0,0.35)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {p.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "3px 12px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                      boxShadow: `0 0 12px ${t.primary}66`,
                    }}
                  >
                    {p.badge}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: t.text }}>{p.name}</div>
                  {isSelected && (
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: currentTheme.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckCircle size={14} style={{ color: "#fff" }} />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "2.25rem", fontWeight: 900, color: isSelected ? currentTheme.primary : t.text }}>
                    ${displayPrice}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: t.muted }}>{priceLabel}</span>
                </div>

                {billing === "yearly" && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#22c55e",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Save ${monthlySave}/year vs monthly
                  </div>
                )}

                <p style={{ color: t.muted, fontSize: "0.88rem", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
                  {p.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {p.features.map((f) => (
                    <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <CheckCircle
                        size={14}
                        style={{
                          color: f.included ? (isSelected ? currentTheme.primary : "#22c55e") : t.border,
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: f.included ? t.text : t.muted,
                          textDecoration: f.included ? "none" : "line-through",
                        }}
                      >
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary + CTA */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "16px",
            padding: "1.75rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: 700, color: t.text, fontSize: "1rem", marginBottom: "1rem" }}>
            Order Summary
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span style={{ color: t.muted }}>Plan</span>
              <span style={{ color: t.text, fontWeight: 600 }}>IncomeCalc {plan.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span style={{ color: t.muted }}>Billing</span>
              <span style={{ color: t.text, fontWeight: 600, textTransform: "capitalize" }}>{billing}</span>
            </div>
            {billing === "yearly" && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                <span style={{ color: t.muted }}>Savings</span>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>-${yearlySavings} vs monthly</span>
              </div>
            )}
            <div
              style={{
                height: "1px",
                background: t.border,
                margin: "0.25rem 0",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
              <span style={{ color: t.text, fontWeight: 700 }}>Total</span>
              <span style={{ color: t.text, fontWeight: 800 }}>
                ${price}{billing === "monthly" ? "/mo" : "/year"}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleCheckoutClick(selectedPlan)}
            className="atv-btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              width: "100%",
              padding: "0.95rem",
              fontSize: "1.05rem",
              boxSizing: "border-box",
            }}
          >
            <CreditCard size={18} />
            Continue to Payment — ${price}{billing === "monthly" ? "/mo" : "/year"}
          </button>

          <p style={{ color: t.muted, fontSize: "0.8rem", textAlign: "center", margin: "1rem 0 0" }}>
            Secure checkout powered by Stripe. Cancel anytime. No hidden fees.
          </p>
          <p style={{ color: t.primary, fontSize: "0.82rem", textAlign: "center", margin: "0.5rem 0 0", fontWeight: 500, fontStyle: "italic" }}>
            Most users recover the subscription cost in their first month.
          </p>

          {/* Money-back guarantee */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: "14px",
              padding: "0.75rem 1rem",
              marginTop: "1rem",
            }}
          >
            <Award size={20} style={{ color: "#34D399", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: t.text, fontSize: "0.88rem" }}>7-Day Money-Back Guarantee</div>
              <div style={{ fontSize: "0.78rem", color: t.muted }}>
                Not satisfied? Email us within 7 days for a full refund — no questions asked.
              </div>
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { Icon: Shield, text: "256-bit SSL encryption" },
            { Icon: Star, text: "Cancel anytime" },
            { Icon: Zap, text: "Instant access" },
          ].map(({ Icon, text }) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.82rem",
                color: t.muted,
              }}
            >
              <Icon size={14} style={{ color: t.primary }} />
              {text}
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ marginTop: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.3rem", marginBottom: "0.5rem" }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
              ))}
            </div>
            <div style={{ fontWeight: 700, color: t.text, fontSize: "1.15rem" }}>What our users are saying</div>
            <div style={{ color: t.muted, fontSize: "0.88rem", marginTop: "0.25rem" }}>
              Join 5,000+ users who upgraded their financial clarity
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {TESTIMONIALS.map(({ name, role, text, stars, plan: tPlan }) => (
              <div
                key={name}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "12px",
                  padding: "1.25rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.2rem", marginBottom: "0.65rem" }}>
                  {[...Array(stars)].map((_, i) => (
                    <Star key={i} size={12} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                  ))}
                </div>
                <p style={{ color: t.text, fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 1rem", fontStyle: "italic" }}>
                  "{text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: t.text, fontSize: "0.85rem" }}>{name}</div>
                    <div style={{ fontSize: "0.75rem", color: t.muted }}>{role}</div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: t.primary + "20",
                      color: t.primary,
                      borderRadius: "20px",
                      padding: "2px 9px",
                    }}
                  >
                    {tPlan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ marginTop: "3rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text, marginBottom: "1.25rem", textAlign: "center" }}>
            What's included in each plan?
          </h2>
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 80px",
                padding: "0.75rem 1.25rem",
                background: t.primary + "10",
                borderBottom: `1px solid ${t.border}`,
                gap: "1rem",
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: t.muted }}>Feature</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: t.muted, textAlign: "center" }}>Pro</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: currentTheme.primary, textAlign: "center" }}>Premium</div>
            </div>

            {[
              { label: "Income calculator", pro: true, premium: true },
              { label: "Expense breakdown charts", pro: true, premium: true },
              { label: "Financial health score", pro: true, premium: true },
              { label: "Historical analytics", pro: true, premium: true },
              { label: "Retirement goal planner", pro: true, premium: true },
              { label: "PDF report export", pro: true, premium: true },
              { label: "Compare income scenarios (3)", pro: true, premium: true },
              { label: "Unlimited scenario comparisons", pro: false, premium: true },
              { label: "12-Month cashflow forecast", pro: false, premium: true },
              { label: "FIRE Retirement Estimator", pro: false, premium: true },
              { label: "Stability history tracking", pro: false, premium: true },
              { label: "Advanced AI Advisor", pro: false, premium: true },
              { label: "AI spending recommendations", pro: false, premium: true },
              { label: "Multi-person household", pro: false, premium: true },
              { label: "Cloud sync across devices", pro: false, premium: true },
              { label: "CSV / Google Sheets export", pro: false, premium: true },
              { label: "Priority support", pro: false, premium: true },
              { label: "Household multi-income modeling", pro: false, premium: true },
            ].map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 80px",
                  padding: "0.65rem 1.25rem",
                  borderBottom: i < 16 ? `1px solid ${t.border}` : "none",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: "0.88rem", color: t.text }}>{row.label}</div>
                <div style={{ textAlign: "center" }}>
                  {row.pro ? (
                    <CheckCircle size={16} style={{ color: "#22c55e" }} />
                  ) : (
                    <span style={{ color: t.border, fontSize: "1rem" }}>—</span>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  {row.premium ? (
                    <CheckCircle size={16} style={{ color: currentTheme.primary }} />
                  ) : (
                    <span style={{ color: t.border, fontSize: "1rem" }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: "3rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text, marginBottom: "1.25rem", textAlign: "center" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel anytime from your account settings — no questions asked, no cancellation fees.",
              },
              {
                q: "How does billing work?",
                a: "You're charged immediately upon subscribing. Monthly plans renew each month; yearly plans renew annually at the same rate.",
              },
              {
                q: "Is my payment information secure?",
                a: "All payments are processed by Stripe, which is PCI-DSS Level 1 certified. We never see your card details.",
              },
              {
                q: "Can I switch plans later?",
                a: "Yes. You can upgrade or downgrade between Pro and Premium at any time. Changes take effect immediately.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 7-day refund policy. If you're not satisfied, contact us within 7 days of purchase for a full refund.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                }}
              >
                <div style={{ fontWeight: 600, color: t.text, marginBottom: "0.4rem", fontSize: "0.95rem" }}>{q}</div>
                <div style={{ color: t.muted, fontSize: "0.88rem", lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: "3rem",
            background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.accent}10)`,
            border: `1px solid ${currentTheme.primary}30`,
            borderRadius: "16px",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem", marginBottom: "0.75rem" }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
            ))}
          </div>
          <p style={{ color: t.text, fontWeight: 600, marginBottom: "0.35rem", fontSize: "1rem" }}>
            Join thousands of people who know their real income needs.
          </p>
          <p style={{ color: t.muted, fontSize: "0.88rem", marginBottom: "1.5rem" }}>
            Start with a free calculation, upgrade when you're ready.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => handleCheckoutClick("pro")}
              style={{
                background: "transparent",
                color: currentTheme.primary,
                border: `2px solid ${currentTheme.primary}`,
                borderRadius: "10px",
                padding: "0.75rem 1.75rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Target size={16} />
              Start Pro — $4.99/mo
            </button>
            <button
              onClick={() => handleCheckoutClick("premium")}
              style={{
                background: currentTheme.primary,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0.75rem 1.75rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: `0 4px 16px ${currentTheme.primary}40`,
              }}
            >
              <Users size={16} />
              Start Premium — $19/mo
            </button>
          </div>
        </div>

        {/* Restore Purchase */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            onClick={() => setShowRestoreModal(true)}
            style={{
              background: "transparent",
              border: "none",
              color: t.muted,
              fontSize: "0.85rem",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Already purchased? Restore your plan
          </button>
        </div>
      </div>
      <SiteFooter t={t} />

      {/* Annual Upsell Modal */}
      {showUpsellModal && (
        <AnnualUpsellModal
          plan={pendingCheckoutPlan}
          onAnnual={handleUpsellAnnual}
          onMonthly={handleUpsellMonthly}
          onClose={() => setShowUpsellModal(false)}
          t={t}
        />
      )}

      {/* Restore Purchase Modal */}
      {showRestoreModal && (
        <RestorePurchaseModal
          onClose={() => setShowRestoreModal(false)}
          t={t}
        />
      )}
    </div>
  );
}
