import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  CreditCard,
  CheckCircle,
  Shield,
  Award,
} from "lucide-react";
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
const EVERGREEN_MID = "#2D6A4F";
const MINT = "#34D399";
const GREEN_CHECK = "#059669";
const HEADLINE = "#111827";
const MUTED_TEXT = "#6B7280";
const BORDER_LIGHT = "#E5E7EB";
const CARD_BG = "#FFFFFF";
const FAQ_BG = "#FAFAFA";
const STAR_GOLD = "#FBBF24";

// ─── Testimonials ────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    plan: "Premium",
    featureName: "AI FINANCIAL DIAGNOSIS",
    featureDesc: "Get a complete breakdown of your financial health with AI-powered analysis.",
    quote: "The AI recommendations alone saved me $340/month. I had no idea my housing was eating 42% of my income.",
    icon: "\u{1F4CA}",
  },
  {
    name: "James T.",
    plan: "Pro",
    featureName: "SCENARIO SIMULATOR",
    featureDesc: "Test different income and expense scenarios before making real decisions.",
    quote: "The retirement planner showed me I was 8 years behind my goal. Now I'm on track after adjusting my savings rate.",
    icon: "\u{1F3AF}",
  },
  {
    name: "Priya K.",
    plan: "Premium",
    featureName: "BUDGET OPTIMIZER",
    featureDesc: "Track spending by category and find exactly where to cut without sacrificing lifestyle.",
    quote: "Household planning for my family of 4 is a game changer. We found $600/mo we didn't know we were wasting.",
    icon: "\u{1F4B0}",
  },
];

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
            fontSize: isMobile ? 28 : 42,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            color: HEADLINE,
            margin: 0,
          }}>
            The financial clarity<br />you've been meaning to find.
          </h1>
          <p style={{
            fontSize: isMobile ? 15 : 17,
            color: MUTED_TEXT,
            maxWidth: 640,
            margin: "16px auto 0",
            lineHeight: 1.6,
          }}>
            Ascentra gives you powerful income planning tools — and Premium takes it further with advanced scenarios, AI diagnosis, and 12-month forecasting.
          </p>
        </div>

        {/* ── SOCIAL PROOF BANNER ── */}
        <div style={{
          background: EVERGREEN,
          padding: "16px 24px",
          marginTop: 40,
          marginBottom: 32,
        }}>
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "center",
            alignItems: "center",
            gap: isMobile ? 12 : 32,
            maxWidth: 800,
            margin: "0 auto",
          }}>
            {/* Stars */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 14 }}>
              <span style={{ color: STAR_GOLD, letterSpacing: 2 }}>{"\u2605\u2605\u2605\u2605\u2605"}</span>
              <span><strong style={{ fontWeight: 700 }}>5/5</strong> <span style={{ opacity: 0.9 }}>from early users</span></span>
            </div>
            {!isMobile && <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)" }} />}
            {/* User count */}
            <div style={{ color: "#fff", fontSize: 14 }}>
              <strong style={{ fontWeight: 700 }}>5,000+</strong> <span style={{ opacity: 0.9 }}>people using Ascentra</span>
            </div>
            {!isMobile && <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)" }} />}
            {/* Stripe */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 14 }}>
              <Shield size={14} style={{ opacity: 0.9 }} />
              <span>Built with <strong style={{ fontWeight: 700 }}>Stripe</strong> <span style={{ opacity: 0.9 }}>security</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 24px 64px", position: "relative", zIndex: 1 }}>

        {/* ── BILLING TOGGLE ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
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
                      background: MINT,
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
                  padding: "36px 32px",
                  cursor: "pointer",
                  position: "relative",
                  background: CARD_BG,
                  border: isPremium ? `2px solid ${EVERGREEN}` : `2px solid ${BORDER_LIGHT}`,
                  borderRadius: 16,
                  boxShadow: isPremium
                    ? "0 4px 16px rgba(27,67,50,0.12)"
                    : "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Most Popular badge */}
                {isPremium && (
                  <div style={{
                    position: "absolute",
                    top: -14,
                    right: 24,
                    background: EVERGREEN,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 14px",
                    borderRadius: 999,
                    letterSpacing: "0.02em",
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
                    padding: "14px 0",
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: isSelected ? "transparent" : EVERGREEN,
                    color: isSelected ? EVERGREEN : "#fff",
                    border: isSelected ? `2px solid ${EVERGREEN}` : "2px solid transparent",
                  }}
                >
                  {isSelected ? "Current Plan" : isPremium ? "Upgrade to Premium" : "Start Pro"}
                </button>

                {/* Microcopy */}
                {!isSelected && (
                  <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingTop: 8 }}>
                    no credit card required · Cancel anytime
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
                      <span style={{
                        fontSize: 18,
                        lineHeight: 1,
                        color: f.included ? GREEN_CHECK : "#D1D5DB",
                        flexShrink: 0,
                        marginTop: -1,
                      }}>
                        {"\u2713"}
                      </span>
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
          <p style={{ color: t.primary, fontSize: "0.82rem", textAlign: "center", margin: "0.5rem 0 0", fontWeight: 500, fontStyle: "italic" }}>
            Most users recover the subscription cost in their first month.
          </p>

          {/* Money-back guarantee */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: 14,
            padding: "0.75rem 1rem",
            marginTop: "1rem",
          }}>
            <Award size={20} style={{ color: MINT, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: t.text, fontSize: "0.88rem" }}>7-Day Money-Back Guarantee</div>
              <div style={{ fontSize: "0.78rem", color: t.muted }}>
                Not satisfied? Email us within 7 days for a full refund — no questions asked.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW PREMIUM PAYS FOR ITSELF ── */}
      <div style={{
        background: EVERGREEN,
        padding: isMobile ? "48px 16px" : "64px 24px",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{
            fontSize: isMobile ? 24 : 32,
            fontWeight: 800,
            color: "#fff",
            textAlign: "center",
            margin: "0 0 8px",
          }}>
            How Premium pays for itself
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 16,
            textAlign: "center",
            margin: "0 0 40px",
          }}>
            Real features. Real users. Real results at $9.99/month.
          </p>

          {/* Value-testimonial cards */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 24,
          }}>
            {TESTIMONIALS.map((item) => (
              <div key={item.name} style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: "28px 24px",
              }}>
                {/* Icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}>
                  {item.icon}
                </div>

                {/* Feature name */}
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: MINT,
                  marginTop: 16,
                }}>
                  {item.featureName}
                </div>

                {/* Feature description */}
                <div style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 14,
                  lineHeight: 1.5,
                  margin: "8px 0 20px",
                }}>
                  {item.featureDesc}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 20 }} />

                {/* Quote */}
                <div style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 14,
                  fontStyle: "italic",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}>
                  "{item.quote}"
                </div>

                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                  <span style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: 11,
                    padding: "2px 10px",
                    borderRadius: 999,
                  }}>
                    {item.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Toggle feature comparison */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              onClick={() => setShowFeatureTable(!showFeatureTable)}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {showFeatureTable ? "Hide feature comparison \u25B2" : "Show full feature comparison \u25BC"}
            </button>
          </div>

          {/* ── FEATURE COMPARISON TABLE ── */}
          {showFeatureTable && (
            <div style={{
              background: CARD_BG,
              maxWidth: 1000,
              margin: "24px auto 0",
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${BORDER_LIGHT}`,
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
                      background: "#F3F4F6",
                      padding: "12px 24px",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                      color: "#374151",
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
                    borderBottom: i < FEATURE_ROWS.length - 1 ? `1px solid #F3F4F6` : "none",
                    alignItems: "center",
                  }}>
                    <div style={{ fontSize: 14, color: "#374151" }}>{row.label}</div>
                    <div style={{ textAlign: "center" }}>
                      {row.pro ? (
                        <CheckCircle size={16} style={{ color: GREEN_CHECK }} />
                      ) : (
                        <span style={{ color: "#D1D5DB", fontSize: 16 }}>—</span>
                      )}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {row.premium ? (
                        <CheckCircle size={16} style={{ color: EVERGREEN }} />
                      ) : (
                        <span style={{ color: "#D1D5DB", fontSize: 16 }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Hide button */}
              <div style={{ textAlign: "center", padding: 16 }}>
                <button
                  onClick={() => setShowFeatureTable(false)}
                  style={{
                    background: "transparent",
                    border: `1px solid ${BORDER_LIGHT}`,
                    color: MUTED_TEXT,
                    padding: "10px 24px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Hide feature comparison {"\u25B2"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "48px 16px" : "64px 24px", position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontSize: isMobile ? 24 : 32,
          fontWeight: 800,
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
                  background: FAQ_BG,
                  borderRadius: 12,
                  padding: "20px 24px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: HEADLINE }}>{faq.q}</div>
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={MUTED_TEXT}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      flexShrink: 0,
                      transition: "transform 200ms",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                {isOpen && (
                  <div style={{ fontSize: 15, color: MUTED_TEXT, lineHeight: 1.6, marginTop: 8 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BOTTOM CTA BAND ── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 24px 64px", position: "relative", zIndex: 1 }}>
        <div style={{
          background: `linear-gradient(135deg, ${EVERGREEN} 0%, ${EVERGREEN_MID} 100%)`,
          borderRadius: 24,
          padding: isMobile ? "32px 24px" : "48px 40px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Geometric art — desktop only */}
          {!isMobile && (
            <>
              <div style={{
                position: "absolute",
                right: -20,
                top: -20,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
              }} />
              <div style={{
                position: "absolute",
                right: 60,
                bottom: -30,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(52,211,153,0.15)",
              }} />
              <div style={{
                position: "absolute",
                right: 160,
                top: 10,
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
              }} />
            </>
          )}

          <div style={{ position: "relative", zIndex: 1, maxWidth: 520 }}>
            <div style={{
              color: "#fff",
              fontSize: isMobile ? 22 : 28,
              fontWeight: 700,
              lineHeight: 1.3,
            }}>
              Your path to <em style={{ fontWeight: 800, fontStyle: "italic" }}>financial clarity</em> starts here.
            </div>
            <div style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 15,
              marginTop: 8,
            }}>
              Start with a free calculation, upgrade when you're ready.
            </div>
            <button
              onClick={() => handleCheckoutClick(selectedPlan)}
              style={{
                background: "#fff",
                color: EVERGREEN,
                fontWeight: 600,
                padding: "14px 28px",
                borderRadius: 12,
                fontSize: 16,
                border: "none",
                cursor: "pointer",
                marginTop: 20,
              }}
            >
              Start Your Free Trial
            </button>
          </div>
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
