import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import { CreditCard, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  applyDark,
  FULL_PLAN,
  FULL_PRICE,
  MONO_FONT_STACK,
  type ThemeConfig,
} from "@/lib/app-shared";
import { Header } from "@/components/Header";
import { RestorePurchaseModal } from "@/components/pages/ResultsPage";

// ─── Constants ───────────────────────────────────────────────────────────────

const EVERGREEN = "#1B4332";
const GREEN_CHECK = "#059669";
const CHECK_FILL = "#52B788";
const HEADLINE = "#111827";
const MUTED_TEXT = "#6B7280";
const BORDER_LIGHT = "#E5E7EB";
const CARD_BG = "#FFFFFF";

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

// ─── FAQ data ────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Is this really a one-time payment?",
    a: "Yes. You pay once and the full diagnosis is yours forever. There is no subscription, no renewal, and nothing to cancel — that's the point.",
  },
  {
    q: "What do I get for free vs. paid?",
    a: "The calculator, your required-income number, and your financial health snapshot are free. The one-time purchase unlocks the complete AI diagnosis, savings analysis, 12-month forecast, unlimited scenarios, and every planning tool.",
  },
  {
    q: "Is my payment information secure?",
    a: "All payments are processed by Stripe, which is PCI-DSS Level 1 certified. We never see your card details.",
  },
  {
    q: "Can I come back after my life changes?",
    a: "Yes. Your purchase never expires — update your numbers and re-run your diagnosis whenever something changes: new job, new city, new rent.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 7-day refund policy. If the diagnosis doesn't earn its price, contact us within 7 days of purchase for a full refund.",
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
  "One payment — no subscription, ever",
  "7-day money-back guarantee",
  "Secure Stripe checkout",
  "Instant access after payment",
];

// ─── CheckoutPage ────────────────────────────────────────────────────────────

export interface CheckoutPageProps {
  onBack: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  onRequireAuth?: (mode: "signin" | "signup") => void;
  onCheckout: () => void;
}

export function CheckoutPage({
  onBack,
  isDark,
  setIsDark,
  currentTheme,
  onCheckout,
  onRequireAuth: _onRequireAuth,
}: CheckoutPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Analytics
  const pricingTracked = useRef(false);
  useEffect(() => {
    if (!pricingTracked.current) {
      trackEvent("pricing_viewed", { source_page: "/checkout" });
      pricingTracked.current = true;
    }
  }, []);

  function handleCheckoutClick() {
    trackEvent("checkout_clicked", { amount: FULL_PRICE, source_page: "/checkout" });
    onCheckout();
  }

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
            One diagnosis.
            <br />
            <span style={{ color: EVERGREEN }}>One payment.</span>
          </h1>
          <p style={{
            fontSize: isMobile ? 15 : 17,
            color: MUTED_TEXT,
            maxWidth: 560,
            margin: `${isMobile ? 16 : 20}px auto 0`,
            lineHeight: 1.6,
          }}>
            Every budgeting app wants a subscription. Ascentra wants{" "}
            <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'", color: HEADLINE, fontWeight: 600 }}>${FULL_PRICE}</span>, once.
            Your full diagnosis, yours forever.
          </p>

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

      {/* ── PRODUCT CARD ── */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: isMobile ? "48px 16px" : "64px 24px", position: "relative", zIndex: 1 }}>
        <div
          ref={cardRef}
          style={{
            padding: isMobile ? "32px 24px" : "40px 36px",
            background: CARD_BG,
            border: `1.5px solid ${EVERGREEN}`,
            borderRadius: 20,
            boxShadow: "0 8px 32px rgba(27,67,50,0.08)",
            position: "relative",
          }}
        >
          {/* Pay-once badge */}
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
            Pay once — no subscription
          </div>

          <div style={{ fontSize: 22, fontWeight: 700, color: HEADLINE, marginBottom: 8 }}>
            {FULL_PLAN.name}
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
              ${FULL_PRICE}
            </span>
            <span style={{ fontSize: 16, fontWeight: 400, color: MUTED_TEXT }}> once</span>
          </div>

          <p style={{ fontSize: 15, color: MUTED_TEXT, lineHeight: 1.5, padding: "12px 0 20px 0", margin: 0 }}>
            {FULL_PLAN.description}
          </p>

          {/* CTA button */}
          <button
            onClick={handleCheckoutClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              width: "100%",
              padding: "16px 0",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              background: EVERGREEN,
              color: "#fff",
              border: "none",
            }}
          >
            <CreditCard size={18} />
            Unlock Full Diagnosis — <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>${FULL_PRICE}</span>
            <ArrowRight size={17} strokeWidth={2.5} />
          </button>

          <div style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingTop: 8 }}>
            secure Stripe checkout · instant access
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#F3F4F6", margin: "20px 0" }} />

          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
            Everything included:
          </div>

          {/* Feature checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FULL_PLAN.features.map((f) => (
              <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <CheckSVG muted={!f.included} />
                <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: t.muted, fontSize: "0.8rem", textAlign: "center", margin: "1rem 0 0" }}>
          Secure checkout powered by Stripe. One payment, no renewals, no hidden fees.
        </p>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 24px 64px", position: "relative", zIndex: 1 }}>
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
          Already purchased? Restore your access
        </button>
      </div>

      <SiteFooter t={t} />

      {/* Modals */}
      {showRestoreModal && (
        <RestorePurchaseModal
          onClose={() => setShowRestoreModal(false)}
          t={t}
        />
      )}
    </div>
  );
}
