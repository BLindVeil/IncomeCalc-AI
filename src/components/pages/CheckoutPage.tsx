import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import { CreditCard, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  applyDark,
  PLANS,
  MONO_FONT_STACK,
  type ThemeConfig,
  type PlanId,
} from "@/lib/app-shared";
import { Header } from "@/components/Header";
import { AnnualUpsellModal, RestorePurchaseModal } from "@/components/pages/ResultsPage";

// ─── Constants ───────────────────────────────────────────────────────────────

const EVERGREEN = "#1B4332";
const GREEN_CHECK = "#059669";
const CHECK_FILL = "#52B788";
const HEADLINE = "#111827";
const MUTED_TEXT = "#6B7280";
const BORDER_LIGHT = "#E5E7EB";
const CARD_BG = "#FFFFFF";
const CTA_ORANGE = "#EA580C";
const CTA_ORANGE_HOVER = "#C2410C";

// ─── Inline CheckSVG (matches landing) ──────────────────────────────────────

function CheckSVG({ muted }: { muted?: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none"
      style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="9" cy="9" r="9" fill={muted ? "#D1D5DB" : CHECK_FILL} opacity={muted ? 0.6 : 1} />
      <path
        d="M5 9.2 L 7.8 12 L 13 6.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Feature comparison data ─────────────────────────────────────────────────

interface FeatureRow {
  label: string;
  pro: boolean;
  premium: boolean;
  category?: string;
}

const FEATURE_ROWS: FeatureRow[] = [
  { label: "", pro: false, premium: false, category: "CORE FINANCIAL TOOLS" },
  { label: "Income calculator", pro: true, premium: true },
  { label: "Expense breakdown charts", pro: true, premium: true },
  { label: "Financial health score", pro: true, premium: true },
  { label: "Historical analytics", pro: true, premium: true },
  { label: "Retirement goal planner", pro: true, premium: true },
  { label: "PDF report export", pro: true, premium: true },
  { label: "Compare income scenarios (3)", pro: true, premium: true },
  { label: "", pro: false, premium: false, category: "ADVANCED PLANNING" },
  { label: "Unlimited scenario comparisons", pro: false, premium: true },
  { label: "12-Month cashflow forecast", pro: false, premium: true },
  { label: "FIRE Retirement Estimator", pro: false, premium: true },
  { label: "Stability history tracking", pro: false, premium: true },
  { label: "Multi-person household", pro: false, premium: true },
  { label: "Household multi-income modeling", pro: false, premium: true },
  { label: "", pro: false, premium: false, category: "AI & INTELLIGENCE" },
  { label: "Advanced AI Advisor", pro: false, premium: true },
  { label: "AI spending recommendations", pro: false, premium: true },
  { label: "", pro: false, premium: false, category: "DATA & EXPORT" },
  { label: "Cloud sync across devices", pro: false, premium: true },
  { label: "CSV / Google Sheets export", pro: false, premium: true },
  { label: "Priority support", pro: false, premium: true },
];

// ─── FAQ data ────────────────────────────────────────────────────────────────

const FAQS = [
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
];

// ─── SiteFooter ──────────────────────────────────────────────────────────────

function SiteFooter({ t }: { t: ThemeConfig }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${t.border}`,
        padding: "1.5rem",
        textAlign: "center",
        background: t.headerBg,
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
        <a href="mailto:incomecalcai@proton.me" style={{ color: t.muted, textDecoration: "none" }}>Contact</a>
      </div>
      <div style={{ fontSize: "0.78rem", color: t.muted, opacity: 0.6 }}>
        Ascentra is not financial, tax, or legal advice. For informational and educational purposes only.
      </div>
    </footer>
  );
}

// ─── Hero trust items ────────────────────────────────────────────────────────

const HERO_CHECKS = [
  "Cancel anytime, no fees",
  "7-day money-back guarantee",
  "Secure Stripe checkout",
  "Instant access after payment",
];

// ─── CheckoutPage ────────────────────────────────────────────────────────────

export interface CheckoutPageProps {
  onBack: () => void;
  initialPlan: PlanId;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  onRequireAuth?: (mode: "signin" | "signup") => void;
  onCheckout: (plan: PlanId, billingPeriod: "monthly" | "yearly") => void;
}

export function CheckoutPage({
  onBack,
  initialPlan,
  isDark,
  setIsDark,
  currentTheme,
  onCheckout,
  onRequireAuth: _onRequireAuth,
}: CheckoutPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingCheckoutPlan, setPendingCheckoutPlan] = useState<PlanId>("pro");
  const [showFeatureTable, setShowFeatureTable] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ctaHover, setCtaHover] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Analytics
  const pricingTracked = useRef(false);
  useEffect(() => {
    if (!pricingTracked.current) {
      trackEvent("pricing_viewed", { source_page: "/checkout" });
      pricingTracked.current = true;
    }
  }, []);

  // Annual upsell
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
    trackEvent("checkout_clicked", { planId: pendingCheckoutPlan, billing: "yearly", amount: p.yearlyPrice, source_page: "/checkout" });
    onCheckout(pendingCheckoutPlan, "yearly");
  }

  function handleUpsellMonthly() {
    setShowUpsellModal(false);
    const p = PLANS.find((pp) => pp.id === pendingCheckoutPlan) ?? PLANS[0];
    trackEvent("checkout_clicked", { planId: pendingCheckoutPlan, billing: "monthly", amount: p.price, source_page: "/checkout" });
    onCheckout(pendingCheckoutPlan, "monthly");
  }

  const plan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0];
  const price = billing === "monthly" ? plan.price : plan.yearlyPrice;
  const yearlySavings = Math.round(plan.price * 12 - plan.yearlyPrice);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" }}>
      <div className="atv-ambient-bg">
        <div className="atv-ambient-teal" />
      </div>
      <Header
        isDark={isDark}
        setIsDark={setIsDark}
        currentTheme={currentTheme}
        onLogoClick={onBack}
      />

      {/* ── PRICING HERO ── */}
      <div style={{ paddingTop: isMobile ? 72 : 96, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <h1 style={{
            fontSize: isMobile ? 32 : 56,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: HEADLINE,
            margin: 0,
          }}>
            Simple pricing.
            <br />
            <span style={{ color: EVERGREEN }}>Real clarity.</span>
          </h1>
          <p style={{
            fontSize: isMobile ? 15 : 17,
            color: MUTED_TEXT,
            maxWidth: 560,
            margin: `${isMobile ? 16 : 20}px auto 0`,
            lineHeight: 1.6,
          }}>
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>

          {/* Orange CTA */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 12 : 16,
            marginTop: isMobile ? 24 : 32,
          }}>
            <button
              onClick={() => cardsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: isMobile ? "14px 28px" : "14px 24px",
                background: ctaHover ? CTA_ORANGE_HOVER : CTA_ORANGE,
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.005em",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                transition: "background 150ms",
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(234,88,12,0.25)",
              }}
            >
              See plans <ArrowRight size={17} strokeWidth={2.5} />
            </button>
            <span style={{
              fontSize: 14,
              color: "#9CA3AF",
              textAlign: "center",
            }}>
              Free forever. No credit card.
            </span>
          </div>

          {/* Green checkmark grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            rowGap: 16,
            columnGap: 32,
            maxWidth: 700,
            margin: "40px auto 0",
          }}>
            {HERO_CHECKS.map((text) => (
              <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <CheckSVG />
                <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "48px 16px 48px" : "64px 24px 64px", position: "relative", zIndex: 1 }}>

        {/* ── BILLING TOGGLE ── */}
        <div ref={cardsRef} style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex",
            padding: 4,
            background: "#F9FAFB",
            border: `1px solid ${BORDER_LIGHT}`,
            borderRadius: 999,
          }}>
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  background: billing === b ? EVERGREEN : "transparent",
                  color: billing === b ? "#fff" : "#374151",
                  border: "none",
                  borderRadius: 999,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {b === "monthly" ? "Monthly" : (
                  <>
                    Yearly
                    <span style={{
                      fontSize: 11,
                      background: GREEN_CHECK,
                      color: "#fff",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontWeight: 700,
                    }}>
                      SAVE
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── PRICING CARDS ── */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 24,
          maxWidth: 900,
          margin: "0 auto",
          marginBottom: 40,
        }}>
          {PLANS.map((p) => {
            const isSelected = selectedPlan === p.id;
            const isPremium = p.id === "premium";
            const displayPrice = billing === "monthly" ? p.price : p.yearlyPrice;
            const priceLabel = billing === "monthly" ? "/mo" : "/year";
            const monthlySave = Math.round(p.price * 12 - p.yearlyPrice);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "40px 36px",
                  cursor: "pointer",
                  position: "relative",
                  background: CARD_BG,
                  border: isPremium ? `1.5px solid ${EVERGREEN}` : `1px solid ${BORDER_LIGHT}`,
                  borderRadius: 20,
                  boxShadow: isPremium
                    ? "0 8px 32px rgba(27,67,50,0.08)"
                    : "none",
                }}
              >
                {/* Most Popular badge — centered mint pill */}
                {isPremium && (
                  <div style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#D1FAE5",
                    color: "#065F46",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 14px",
                    borderRadius: 999,
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                  }}>
                    Most Popular
                  </div>
                )}

                {/* Tier name */}
                <div style={{ fontSize: 22, fontWeight: 700, color: HEADLINE, marginBottom: 8 }}>
                  {p.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: 4 }}>
                  <span style={{
                    fontSize: 44,
                    fontWeight: 800,
                    color: HEADLINE,
                    fontFamily: MONO_FONT_STACK,
                    fontFeatureSettings: "'tnum', 'zero'",
                  }}>
                    ${displayPrice}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 400, color: MUTED_TEXT }}>{priceLabel}</span>
                </div>

                {/* Savings line */}
                {billing === "yearly" && monthlySave > 0 && (
                  <div style={{ fontSize: 14, fontWeight: 500, color: GREEN_CHECK, marginBottom: 4 }}>
                    Save ${monthlySave}/year vs monthly
                  </div>
                )}

                {/* Description */}
                <p style={{ fontSize: 15, color: MUTED_TEXT, lineHeight: 1.5, padding: "12px 0 20px 0", margin: 0 }}>
                  {p.description}
                </p>

                {/* CTA button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleCheckoutClick(p.id); }}
                  style={{
                    width: "100%",
                    padding: "16px 0",
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: isPremium || !isSelected ? "pointer" : "not-allowed",
                    background: isPremium
                      ? EVERGREEN
                      : isSelected
                        ? "#F9FAFB"
                        : "transparent",
                    color: isPremium
                      ? "#fff"
                      : isSelected
                        ? "#9CA3AF"
                        : EVERGREEN,
                    border: isPremium
                      ? "none"
                      : isSelected
                        ? `1px solid ${BORDER_LIGHT}`
                        : `1.5px solid ${EVERGREEN}`,
                  }}
                >
                  {isSelected ? "Current Plan" : isPremium ? "Upgrade to Premium" : "Start Pro"}
                </button>

                {/* Microcopy */}
                {!isSelected && (
                  <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingTop: 8 }}>
                    no credit card required
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: "#F3F4F6", margin: "20px 0" }} />

                {/* Feature list header */}
                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
                  {isPremium ? "Everything from Pro, and..." : "Everything in Free, and..."}
                </div>

                {/* Feature checklist */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {p.features.map((f) => (
                    <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <CheckSVG muted={!f.included} />
                      <span style={{
                        fontSize: 14,
                        color: f.included ? "#374151" : "#9CA3AF",
                        lineHeight: 1.5,
                        textDecoration: f.included ? "none" : "line-through",
                        opacity: f.included ? 1 : 0.5,
                      }}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── ORDER SUMMARY ── */}
        <div style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          padding: "1.75rem",
          marginBottom: "1rem",
        }}>
          <div style={{ fontWeight: 700, color: t.text, fontSize: "1rem", marginBottom: "1rem" }}>
            Order Summary
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span style={{ color: t.muted }}>Plan</span>
              <span style={{ color: t.text, fontWeight: 600 }}>Ascentra {plan.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
              <span style={{ color: t.muted }}>Billing</span>
              <span style={{ color: t.text, fontWeight: 600, textTransform: "capitalize" }}>{billing}</span>
            </div>
            {billing === "yearly" && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                <span style={{ color: t.muted }}>Savings</span>
                <span style={{ color: GREEN_CHECK, fontWeight: 600, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>-${yearlySavings} vs monthly</span>
              </div>
            )}
            <div style={{ height: 1, background: t.border, margin: "0.25rem 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
              <span style={{ color: t.text, fontWeight: 700 }}>Total</span>
              <span style={{ color: t.text, fontWeight: 800, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
                ${price}{billing === "monthly" ? "/mo" : "/year"}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleCheckoutClick(selectedPlan)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              width: "100%",
              padding: "0.95rem",
              fontSize: "1.05rem",
              boxSizing: "border-box",
              background: `linear-gradient(135deg, ${EVERGREEN}, #40916C)`,
              color: "#fff",
              border: "none",
              borderRadius: 16,
              boxShadow: "0 4px 14px rgba(27, 67, 50, 0.25)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <CreditCard size={18} />
            Continue to Payment — <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>${price}</span>{billing === "monthly" ? "/mo" : "/year"}
          </button>

          <p style={{ color: t.muted, fontSize: "0.8rem", textAlign: "center", margin: "1rem 0 0" }}>
            Secure checkout powered by Stripe. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>

      {/* ── FEATURE COMPARISON TOGGLE ── */}
      <div style={{ textAlign: "center", margin: "0 0 0", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => setShowFeatureTable(!showFeatureTable)}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#F9FAFB";
            e.currentTarget.style.borderColor = "#9CA3AF";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#D1D5DB";
          }}
          style={{
            background: "transparent",
            border: "1px solid #D1D5DB",
            color: "#374151",
            padding: "10px 24px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            transition: "background 180ms, border-color 180ms",
          }}
        >
          {showFeatureTable ? "Hide" : "Show"} full feature comparison
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#374151"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 200ms",
              transform: showFeatureTable ? "rotate(180deg)" : "rotate(0)",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* ── FEATURE COMPARISON TABLE ── */}
      {showFeatureTable && (
        <div style={{
          background: CARD_BG,
          maxWidth: 900,
          margin: "32px auto 0",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${BORDER_LIGHT}`,
          position: "relative",
          zIndex: 1,
        }}>
          {/* Header row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            padding: "16px 24px",
            background: "#F9FAFB",
            borderBottom: `1px solid ${BORDER_LIGHT}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: MUTED_TEXT }}>Feature</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: MUTED_TEXT, textAlign: "center" }}>PRO</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: MUTED_TEXT, textAlign: "center" }}>PREMIUM</div>
          </div>

          {FEATURE_ROWS.map((row, i) => {
            if (row.category) {
              return (
                <div key={row.category} style={{
                  background: "#FAFAFA",
                  padding: "12px 24px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  color: "#4B5563",
                  borderBottom: `1px solid ${BORDER_LIGHT}`,
                }}>
                  {row.category}
                </div>
              );
            }
            return (
              <div key={row.label} style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                padding: "14px 24px",
                borderTop: `1px solid #F3F4F6`,
                borderBottom: i === FEATURE_ROWS.length - 1 ? "none" : undefined,
                alignItems: "center",
              }}>
                <div style={{ fontSize: 14, color: "#374151" }}>{row.label}</div>
                <div style={{ textAlign: "center" }}>
                  {row.pro ? (
                    <svg width={20} height={20} viewBox="0 0 18 18" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
                      <circle cx="9" cy="9" r="9" fill={GREEN_CHECK} />
                      <path d="M5 9.2 L 7.8 12 L 13 6.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  ) : (
                    <span style={{ color: "#D1D5DB", fontSize: 18 }}>{"\u2014"}</span>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  {row.premium ? (
                    <svg width={20} height={20} viewBox="0 0 18 18" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
                      <circle cx="9" cy="9" r="9" fill={GREEN_CHECK} />
                      <path d="M5 9.2 L 7.8 12 L 13 6.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  ) : (
                    <span style={{ color: "#D1D5DB", fontSize: 18 }}>{"\u2014"}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Hide button inside table */}
          <div style={{ textAlign: "center", padding: 16, borderTop: `1px solid #F3F4F6` }}>
            <button
              onClick={() => setShowFeatureTable(false)}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#F9FAFB";
                e.currentTarget.style.borderColor = "#9CA3AF";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "#D1D5DB";
              }}
              style={{
                background: "transparent",
                border: "1px solid #D1D5DB",
                color: "#374151",
                padding: "10px 24px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "background 180ms, border-color 180ms",
              }}
            >
              Hide full feature comparison
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#374151"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "48px 16px" : "80px 24px 64px", position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontSize: isMobile ? 24 : 32,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: HEADLINE,
          textAlign: "center",
          margin: "0 0 32px",
        }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={faq.q}
                onClick={() => setOpenFaq(isOpen ? null : i)}
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER_LIGHT}`,
                  borderRadius: 16,
                  padding: "20px 24px",
                  cursor: "pointer",
                  transition: "border-color 180ms",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#D1D5DB"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_LIGHT; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: HEADLINE }}>{faq.q}</div>
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={MUTED_TEXT}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      flexShrink: 0,
                      transition: "transform 200ms ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                {isOpen && (
                  <div style={{
                    fontSize: 15,
                    color: "#4B5563",
                    lineHeight: 1.65,
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #F3F4F6",
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Restore Purchase */}
      <div style={{ textAlign: "center", paddingBottom: 32, position: "relative", zIndex: 1 }}>
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

      <SiteFooter t={t} />

      {/* Modals */}
      {showUpsellModal && (
        <AnnualUpsellModal
          plan={pendingCheckoutPlan}
          onAnnual={handleUpsellAnnual}
          onMonthly={handleUpsellMonthly}
          onClose={() => setShowUpsellModal(false)}
          t={t}
        />
      )}
      {showRestoreModal && (
        <RestorePurchaseModal
          onClose={() => setShowRestoreModal(false)}
          t={t}
        />
      )}
    </div>
  );
}
