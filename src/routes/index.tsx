import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { trackEvent } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Sparkles,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Zap,
  Lock,
  Target,
  Brain,
  ChevronLeft,
  Send,
  X,
  Lightbulb,
  Copy,
  Trash2,
  Plus,
  Trophy,
  Download,
  Info,
  Play,
  AlertTriangle,
  Share2,
  Flame,
  TrendingDown,
  Wallet,
  Milestone,
  User,
  Save,
  ExternalLink,
  Mail,
  Settings,
  Eye,
  Globe,
} from "lucide-react";
import { calculate, estimateTaxRate, INCOME_RANGES, US_STATES, type CalcInput, type CalcOutput, type IncomeRange, type FilingStatus } from "@/lib/calc";
import { answerQuestion, type PlanContext } from "@/lib/planRules";
import { computeFire } from "@/lib/fireCalc";
import { forecast12Months, type MonthSnapshot } from "@/lib/forecast";
import { simulateSnowball, simulateAvalanche, formatMonths, type DebtItem, type PayoffResult } from "@/lib/debt";
import { simulateFI, type FIOutput } from "@/lib/fi";
import { isDevOverrideActive, enableDevOverride, disableDevOverride } from "@/lib/dev-override";
import { getPlan, getDevOverride, getDevBadgeLabel, enableDevOverride as entitlementEnable, disableDevOverride as entitlementDisable, syncPlan } from "@/lib/entitlements";
import {
  signup as authSignup,
  login as authLogin,
  logout as authLogout,
  getSession,
  getCurrentUser,
  createScenario,
  listScenarios as listSavedScenarios,
  deleteScenario,
  publishScenario,
  unpublishScenario,
  getScenarioBySlug,
  updateUserPreferences,
  generateDigestForUser,
  buildDigestEmailHtml,
  sendEmail,
  runWeeklyDigest,
  isDevBypassPaywall,
  setDevAdminEmails,
  getDevAdminEmails,
  type User as AuthUser,
  type SavedScenario,
  type Session,
} from "@/lib/auth-store";
import { getDisplayName, getInitials } from "@/lib/user-display";
import {
  type Page,
  type UserTier,
  type PlanId,
  type ThemeConfig,
  type ExpenseData,
  type ExpenseKey,
  EXPENSE_FIELDS,
  DEFAULT_EXPENSES,
  fmt,
  applyDark,
  buildTheme,
  computeForExpenses,
  genId,
  loadUserTier,
  MONO_FONT_STACK,
} from "@/lib/app-shared";
import { Header, AUTH_EVENT } from "@/components/Header";
import { DashboardSidebar } from "@/components/ui/DashboardSidebar";
import { DashboardTopbar } from "@/components/ui/DashboardTopbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { OverviewSection } from "@/components/landing/OverviewSection";
import { WhyAscentraSection } from "@/components/landing/WhyAscentraSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { QuestionsSection } from "@/components/landing/QuestionsSection";
import { FinalCTABanner } from "@/components/landing/FinalCTABanner";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  readPendingData,
  clearPendingData,
  attachPendingDataToAccount,
  hasSeenWelcome,
  checkWelcomeSeenServer,
} from "@/lib/pending-signup-data";
import { readResumeFlow, clearResumeFlow } from "@/lib/resume-flow";
import { IntentPickerPage } from "@/components/pages/IntentPickerPage";
import { MobileNavShell } from "@/components/mobile/MobileNavShell";
import type { MobileTab } from "@/components/mobile/MobileBottomNav";

// ─── Lazy-loaded page components ─────────────────────────────────────────────

const ResultsPage = lazy(() => import("@/components/pages/ResultsPage").then(m => ({ default: m.ResultsPage })));
const GuidedFlowPage = lazy(() => import("@/components/pages/GuidedFlowPage").then(m => ({ default: m.GuidedFlowPage })));
const CheckoutPage = lazy(() => import("@/components/pages/CheckoutPage").then(m => ({ default: m.CheckoutPage })));
const SimulatorPage = lazy(() => import("@/components/pages/SimulatorPage").then(m => ({ default: m.SimulatorPage })));
const CheckInPage = lazy(() => import("@/components/pages/CheckInPage").then(m => ({ default: m.CheckInPage })));

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--background)" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid rgba(0,0,0,0.08)", borderTopColor: "var(--theme-primary, #1B4332)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: App,
});

// ─── Landing Page ─────────────────────────────────────────────────────────────

interface LandingProps {
  onStart: () => void;
  onPricing: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  onDevAccess?: () => void;
  onUpgrade?: (plan: "pro" | "premium") => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onDashboard?: () => void;
  currentUser?: AuthUser | null;
}

// ─── Landing sidebar nav icons ───────────────────────────────────────────────
const OverviewIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const WhyIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const HowIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const PricingIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const FAQIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const LANDING_NAV = [
  { id: "overview", label: "Overview", icon: OverviewIcon },
  { id: "why", label: "Why Ascentra", icon: WhyIcon },
  { id: "how", label: "How it works", icon: HowIcon },
  { id: "pricing", label: "Pricing", icon: PricingIcon },
  { id: "faq", label: "Questions", icon: FAQIcon },
];

const LANDING_BOTTOM = [
  { id: "get-started", label: "Get started →", icon: ArrowRightIcon },
];

function Landing({ onStart, onPricing, isDark, setIsDark, currentTheme, onDevAccess, onUpgrade, onSignIn, onSignOut, onDashboard, currentUser }: LandingProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const showSidebar = typeof window !== "undefined" && window.innerWidth > 980;

  function handleSidebarNav(id: string) {
    if (id === "get-started") {
      onStart();
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  const topbarLeft = (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: t.muted,
          marginBottom: 4,
        }}
      >
        PREVIEW
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.01em" }}>
        Know your number.
      </div>
    </div>
  );

  const topbarRight = currentUser ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
          color: "#fff", fontWeight: 600, fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
        onClick={onDashboard}
        title={currentUser.email}
      >
        {getInitials(currentUser)}
      </div>
    </div>
  ) : (
    <span
      onClick={onSignIn}
      style={{ fontSize: 14, color: t.muted, cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.color = t.text; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = t.muted; }}
    >
      Sign in
    </span>
  );

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text }}>
      {/* Hero — full-bleed above sidebar layout */}
      <LandingHero onStart={onStart} onSignIn={onSignIn} isSignedIn={!!currentUser} userName={currentUser?.email} onDashboard={onDashboard} onSignOut={onSignOut} />

      <div
        style={{
          display: showSidebar ? "grid" : "block",
          gridTemplateColumns: showSidebar ? "240px 1fr" : undefined,
        }}
      >
        {/* Sidebar */}
        {showSidebar && (
          <DashboardSidebar
            t={t}
            isDark={isDark}
            setIsDark={setIsDark}
            activeItem="overview"
            onNavigate={handleSidebarNav}
            items={LANDING_NAV}
            bottomItems={LANDING_BOTTOM}
          />
        )}

        {/* Main content */}
        <div style={{ minHeight: "100vh" }}>
          {/* Mobile: show Header instead of sidebar */}
          {!showSidebar && (
            <Header
              isDark={isDark}
              setIsDark={setIsDark}
              currentTheme={currentTheme}
              onDevAccess={onDevAccess}
              accountUser={currentUser}
              onSignIn={onSignIn}
              onSignOut={onSignOut}
              onDashboard={onDashboard}
            />
          )}

          <div style={{ padding: isMobile ? "24px 16px" : "32px 40px", maxWidth: 1000 }}>
            <DashboardTopbar
              t={t}
              isDark={isDark}
              isMobile={isMobile}
              leftContent={topbarLeft}
              ctaLabel="Calculate my number →"
              ctaOnClick={onStart}
              rightExtra={topbarRight}
              alerts={[]}
            />

            <OverviewSection t={t} isDark={isDark} isMobile={isMobile} onStart={onStart} />
            <WhyAscentraSection t={t} isDark={isDark} />
            <HowItWorksSection t={t} onStart={onStart} />
            <PricingSection
              t={t}
              isDark={isDark}
              onStart={onStart}
              onUpgrade={onUpgrade ?? ((plan) => onPricing())}
            />
            <QuestionsSection t={t} />
            <FinalCTABanner t={t} isMobile={isMobile} onStart={onStart} />
          </div>
        </div>
      </div>

      <SiteFooter t={t} />
    </div>
  );
}

// ─── Calculator Page ──────────────────────────────────────────────────────────

interface CalculatorPageProps {
  onResults: (data: ExpenseData, taxRate: number, currentIncome: number) => void;
  onBack: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  initialData: ExpenseData;
  initialTaxRate: number;
  initialCurrentIncome: number;
}

function CalculatorPage({
  onResults,
  onBack,
  isDark,
  setIsDark,
  currentTheme,
  initialData,
  initialTaxRate,
  initialCurrentIncome,
}: CalculatorPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState<ExpenseData>(initialData);
  const [taxRate, setTaxRate] = useState<number | "">(initialTaxRate);
  const [currentIncome, setCurrentIncome] = useState<number>(initialCurrentIncome);

  // Analytics: calc_started
  const calcTracked = useRef(false);
  useEffect(() => {
    if (!calcTracked.current) {
      trackEvent("calc_started", { source_page: "/calculator" });
      calcTracked.current = true;
    }
  }, []);

  // Feature 0: Tax rate estimation state
  const [taxState, setTaxState] = useState("CA");
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [incomeRange, setIncomeRange] = useState<IncomeRange>("60k-100k");
  const [taxOverride, setTaxOverride] = useState(false);

  // Auto-estimate tax rate when estimation inputs change (and override is OFF)
  useEffect(() => {
    if (!taxOverride) {
      const estimated = estimateTaxRate(taxState, filingStatus, incomeRange);
      setTaxRate(estimated);
    }
  }, [taxState, filingStatus, incomeRange, taxOverride]);

  const total = Object.values(formData).reduce((a, b) => a + b, 0);
  const effectiveTax = typeof taxRate === "number" ? taxRate : 25;
  const grossNeeded = effectiveTax < 100 ? total / (1 - effectiveTax / 100) : 0;

  function handleChange(field: ExpenseKey, raw: string) {
    const val = raw === "" ? 0 : Math.max(0, parseFloat(raw) || 0);
    setFormData((prev) => ({ ...prev, [field]: val }));
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

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: isMobile ? "72px 1rem 3rem" : "96px 1.5rem 4rem", position: "relative", zIndex: 1 }}>
        <div className="atv-fade-in" style={{ marginBottom: "2rem" }}>
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: t.muted,
              fontSize: "0.9rem",
              padding: 0,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: t.text, margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            Monthly Expenses
          </h1>
          <p style={{ color: t.muted, fontSize: "0.95rem", margin: 0 }}>
            Enter your monthly spending in each category. Leave blank for categories that don't apply.
          </p>
        </div>

        {/* Tax rate estimation card */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "16px",
            padding: "1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          <Label style={{ color: t.text, fontWeight: 700, marginBottom: "0.5rem", display: "block", fontSize: "1rem" }}>
            Estimate My Tax Rate
          </Label>
          <p style={{ color: t.muted, fontSize: "0.82rem", margin: "0 0 1rem" }}>
            This is an estimate. Your real effective rate depends on deductions.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            {/* State selector */}
            <div>
              <Label style={{ color: t.muted, fontSize: "0.78rem", display: "block", marginBottom: "0.3rem" }}>State</Label>
              <select
                value={taxState}
                onChange={(e) => setTaxState(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "8px",
                  border: `1px solid ${t.border}`,
                  background: t.bg,
                  color: t.text,
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Filing status */}
            <div>
              <Label style={{ color: t.muted, fontSize: "0.78rem", display: "block", marginBottom: "0.3rem" }}>Filing Status</Label>
              <select
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "8px",
                  border: `1px solid ${t.border}`,
                  background: t.bg,
                  color: t.text,
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
              </select>
            </div>

            {/* Income range */}
            <div>
              <Label style={{ color: t.muted, fontSize: "0.78rem", display: "block", marginBottom: "0.3rem" }}>Income Range</Label>
              <select
                value={incomeRange}
                onChange={(e) => setIncomeRange(e.target.value as IncomeRange)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "8px",
                  border: `1px solid ${t.border}`,
                  background: t.bg,
                  color: t.text,
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                {INCOME_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimated rate display */}
          {!taxOverride && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 0.85rem",
              background: t.primary + "10",
              borderRadius: "8px",
              marginBottom: "0.75rem",
            }}>
              <Info size={14} style={{ color: t.primary, flexShrink: 0 }} />
              <span style={{ fontSize: "0.88rem", color: t.text }}>
                Estimated effective tax rate: <strong style={{ color: t.primary }}>{effectiveTax}%</strong>
              </span>
            </div>
          )}

          {/* Override toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setTaxOverride(!taxOverride)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.82rem",
                color: t.muted,
                padding: 0,
              }}
            >
              <div style={{
                width: "32px",
                height: "18px",
                borderRadius: "9px",
                background: taxOverride ? t.primary : t.border,
                position: "relative",
                transition: "background 0.2s",
              }}>
                <div style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: "2px",
                  left: taxOverride ? "16px" : "2px",
                  transition: "left 0.2s",
                }} />
              </div>
              Advanced: Override tax rate manually
            </button>
          </div>

          {taxOverride && (
            <div style={{ marginTop: "0.75rem" }}>
              <Input
                type="number"
                min={0}
                max={70}
                value={taxRate === "" ? "" : taxRate}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") { setTaxRate(""); return; }
                  setTaxRate(Math.min(70, Math.max(0, parseFloat(v) || 0)));
                }}
                placeholder="25"
                style={{
                  background: t.bg,
                  border: `1px solid ${t.border}`,
                  color: t.text,
                  maxWidth: "180px",
                }}
              />
            </div>
          )}
        </div>

        {/* Current Gross Annual Income (optional) */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "16px",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(52,211,153,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#34D399",
              flexShrink: 0,
            }}
          >
            <DollarSign size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <Label
              style={{
                color: t.text,
                fontWeight: 600,
                fontSize: "0.9rem",
                display: "block",
                marginBottom: "0.15rem",
              }}
            >
              Current Gross Annual Income
            </Label>
            <span style={{ fontSize: "0.75rem", color: t.muted }}>Optional — used for Income Gap analysis</span>
            <div style={{ position: "relative", marginTop: "0.35rem" }}>
              <span
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: t.muted,
                  fontSize: "0.95rem",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                $
              </span>
              <Input
                type="number"
                min={0}
                value={currentIncome === 0 ? "" : currentIncome}
                onChange={(e) => setCurrentIncome(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="e.g. 65000"
                className="atv-input"
                style={{
                  paddingLeft: "1.5rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Expense inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {EXPENSE_FIELDS.map((field) => {
            const Icon = field.icon;
            const val = formData[field.name];
            return (
              <div
                key={field.name}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "16px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: `${t.primary}1F`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: t.primary,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label
                    style={{
                      color: t.text,
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      display: "block",
                      marginBottom: "0.35rem",
                    }}
                  >
                    {field.label}
                  </Label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: t.muted,
                        fontSize: "0.95rem",
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    >
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={val === 0 ? "" : val}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder="0"
                      className="atv-input"
                      style={{
                        paddingLeft: "1.5rem",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live summary bar */}
        {total > 0 && (
          <div
            style={{
              background: t.cardBg,
              padding: "1.15rem 1.35rem",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              borderRadius: "16px",
              border: `1px solid ${t.primary}30`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${t.primary}, ${t.accent})` }} />
            <div>
              <div style={{ fontSize: "0.8rem", color: t.muted, marginBottom: "0.2rem" }}>Monthly expenses</div>
              <div className="atv-number-glow" style={{ fontSize: "1.25rem", fontWeight: 700, color: t.primary, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(total)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.8rem", color: t.muted, marginBottom: "0.2rem" }}>Gross income needed</div>
              <div className="atv-number-glow" style={{ fontSize: "1.25rem", fontWeight: 700, color: t.text, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(grossNeeded)}/mo</div>
            </div>
          </div>
        )}

        <button
          onClick={() => onResults(formData, effectiveTax, currentIncome)}
          disabled={total === 0}
          style={{
            width: "100%",
            background: total === 0 ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "linear-gradient(135deg, #1B4332, #40916C)",
            color: total === 0 ? (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)") : "#fff",
            border: "none",
            borderRadius: "16px",
            padding: "0.95rem",
            fontSize: "1.05rem",
            fontWeight: 600,
            cursor: total === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            boxShadow: total === 0 ? "none" : "0 4px 14px rgba(27, 67, 50, 0.25)",
          }}
        >
          <BarChart3 size={18} />
          See My Results
        </button>
      </div>
    </div>
  );
}



// ─── Ask Your Plan (Feature 3) ────────────────────────────────────────────────

interface AskYourPlanProps {
  data: ExpenseData;
  taxRate: number;
  outputs: CalcOutput;
  t: ThemeConfig;
  isDark: boolean;
  onSimulator: () => void;
  userTier: UserTier;
  onUpgrade: (plan?: PlanId) => void;
}

function AskYourPlan({ data, taxRate, outputs, t, isDark, onSimulator, userTier, onUpgrade }: AskYourPlanProps) {
  const [selectedQ, setSelectedQ] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [fallbackAnswer, setFallbackAnswer] = useState<{ text: string; bullets: string[]; showScenarioButton?: boolean } | null>(null);

  const questions = [
    "What should I cut first?",
    "Is my rent too high?",
    "How much house can I afford?",
    "How do I get to a stable score?",
    "What happens if I save more?",
    "What's my fastest improvement?",
  ];

  async function handleQuestion(q: string) {
    setSelectedQ(q);
    setAiAnswer(null);
    setFallbackAnswer(null);

    // Always compute deterministic fallback
    const ctx: PlanContext = {
      expenses: data,
      taxRate,
      outputs,
    };
    const deterministic = answerQuestion(q, ctx);
    setFallbackAnswer(deterministic);

    // Try LLM for premium users
    if (userTier === "premium") {
      setAiLoading(true);
      try {
        const contextStr = `User data:
- Monthly expenses total: ${fmt(outputs.monthlyRequiredTotal)}
- Hourly required: ${fmt(outputs.hourlyRequired)}/hr
- Annual gross required: ${fmt(outputs.annualGrossRequired)}
- Fragility score: ${outputs.fragilityScore}/100 (${outputs.fragilityLabel})
- Housing: ${fmt(data.housing)}/mo (${(outputs.ratios.rentRatio * 100).toFixed(0)}% of total)
- Food: ${fmt(data.food)}/mo
- Transport: ${fmt(data.transport)}/mo (${(outputs.ratios.transportRatio * 100).toFixed(0)}% of total)
- Healthcare: ${fmt(data.healthcare)}/mo
- Utilities: ${fmt(data.utilities)}/mo
- Entertainment: ${fmt(data.entertainment)}/mo
- Clothing: ${fmt(data.clothing)}/mo
- Savings: ${fmt(data.savings)}/mo (${(outputs.ratios.savingsRatio * 100).toFixed(0)}% of total)
- Other/Debt: ${fmt(data.other)}/mo (${(outputs.ratios.debtRatio * 100).toFixed(0)}% of total)
- Tax rate: ${taxRate}%
- Emergency fund target: ${fmt(outputs.emergencyFundTarget)}
- Health score: ${outputs.healthScore}/100 (${outputs.healthLabel})`;

        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feature: "advisor",
            input: {
              messages: [
                {
                  role: "system",
                  content: `You are a financial advisor answering questions based ONLY on the user's actual numbers. You MUST cite at least 3 specific numbers from their data. Give maximum 3 action bullets. Be concise and specific. End with: "Estimates only. Not financial advice."`,
                },
                { role: "user", content: `${contextStr}\n\nQuestion: ${q}` },
              ],
            },
          }),
        });
        const json = await res.json() as { reply?: string; error?: string };
        if (json.reply) {
          setAiAnswer(json.reply);
        }
      } catch {
        // Fallback already set
      }
      setAiLoading(false);
    }
  }

  const displayAnswer = aiAnswer || fallbackAnswer;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => handleQuestion(q)}
            style={{
              background: selectedQ === q ? t.primary : t.primary + "10",
              color: selectedQ === q ? "#fff" : t.primary,
              border: `1px solid ${selectedQ === q ? t.primary : t.primary + "25"}`,
              borderRadius: "8px",
              padding: "0.4rem 0.75rem",
              fontSize: "0.82rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {aiLoading && (
        <div style={{ textAlign: "center", padding: "1rem 0", color: t.muted, fontSize: "0.9rem" }}>
          <Sparkles size={18} style={{ marginBottom: "0.5rem", color: t.primary }} />
          <div>Analyzing your plan...</div>
        </div>
      )}

      {!aiLoading && displayAnswer && (
        <div style={{ marginTop: "0.5rem" }}>
          {aiAnswer ? (
            <div
              style={{
                padding: "1rem",
                background: isDark ? "#2a2a2f" : "#f9f9fb",
                borderRadius: "10px",
                border: `1px solid ${t.border}`,
                fontSize: "0.88rem",
                color: t.text,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {aiAnswer}
            </div>
          ) : fallbackAnswer ? (
            <div>
              <p style={{ fontSize: "0.9rem", color: t.text, marginBottom: "0.75rem", fontWeight: 500 }}>
                {fallbackAnswer.text}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {fallbackAnswer.bullets.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      background: isDark ? "#2a2a2f" : "#f9f9fb",
                      borderRadius: "8px",
                      border: `1px solid ${t.border}`,
                    }}
                  >
                    <CheckCircle size={14} style={{ color: t.primary, flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ fontSize: "0.85rem", color: t.text, lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
              {fallbackAnswer.showScenarioButton && (
                <button
                  onClick={onSimulator}
                  style={{
                    marginTop: "0.75rem",
                    background: t.primary + "15",
                    color: t.primary,
                    border: `1px solid ${t.primary}30`,
                    borderRadius: "8px",
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <Play size={13} />
                  Run as Scenario
                </button>
              )}
            </div>
          ) : null}
          <p style={{ fontSize: "0.72rem", color: t.muted, marginTop: "0.75rem", fontStyle: "italic" }}>
            Estimates only. Not financial advice.
          </p>
          {userTier !== "premium" && (
            <div style={{
              marginTop: "0.75rem",
              padding: "0.6rem 0.85rem",
              background: t.primary + "08",
              border: `1px solid ${t.primary}20`,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}>
              <span style={{ fontSize: "0.82rem", color: t.muted }}>
                Get AI-powered answers with Premium
              </span>
              <button
                onClick={() => onUpgrade("premium")}
                style={{
                  background: t.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.3rem 0.7rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Get Premium
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── FIRE Countdown Estimator (Feature 4) ─────────────────────────────────

interface FirePageProps {
  onBack: () => void;
  onUpgrade: (plan?: PlanId) => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
}

function FirePage({
  onBack,
  onUpgrade,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
}: FirePageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const isPremium = userTier === "premium";

  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(6);

  const fireResult = computeFire({
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    annualReturn,
  });

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: isMobile ? "72px 1rem 3rem" : "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Flame size={22} style={{ color: "#f59e0b" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: 0 }}>FIRE Countdown Estimator</h1>
        </div>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
          Project your retirement balance using compound growth.
        </p>

        {/* Inputs */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Current Age", value: currentAge, set: (v: number) => setCurrentAge(v), min: 18, max: 80 },
              { label: "Retirement Age Target", value: retirementAge, set: (v: number) => setRetirementAge(v), min: 30, max: 90 },
            ].map((f) => (
              <div key={f.label}>
                <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>{f.label}</Label>
                <Input
                  type="number"
                  min={f.min}
                  max={f.max}
                  value={f.value}
                  onChange={(e) => f.set(Math.max(f.min, Math.min(f.max, parseInt(e.target.value) || f.min)))}
                  style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                />
              </div>
            ))}
            <div>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Current Retirement Savings ($)</Label>
              <Input
                type="number"
                min={0}
                value={currentSavings === 0 ? "" : currentSavings}
                onChange={(e) => setCurrentSavings(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="50000"
                style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }}
              />
            </div>
            <div>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Monthly Contribution ($)</Label>
              <Input
                type="number"
                min={0}
                value={monthlyContribution === 0 ? "" : monthlyContribution}
                onChange={(e) => setMonthlyContribution(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="500"
                style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }}
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Expected Annual Return (%)</Label>
              <Input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={annualReturn}
                onChange={(e) => setAnnualReturn(Math.max(0, Math.min(20, parseFloat(e.target.value) || 0)))}
                style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, maxWidth: "180px" }}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {isPremium ? (
          <>
            {/* Hero projection card */}
            <div
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                borderRadius: "16px",
                padding: "2rem",
                marginBottom: "1.25rem",
                color: "#fff",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.5rem" }}>Projected Retirement Balance</div>
              <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.1, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
                {fmt(fireResult.projectedBalance)}
              </div>
              <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.25rem" }}>
                in {fireResult.yearsUntilRetirement} years
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Monthly Income (4% rule)</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(fireResult.monthlyRetirementIncome)}/mo</div>
                </div>
                <div>
                  <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Annual Withdrawal</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(fireResult.annualWithdrawal)}/yr</div>
                </div>
                <div>
                  <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Years to Go</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{fireResult.yearsUntilRetirement}</div>
                </div>
              </div>
            </div>

            {/* On Track indicator */}
            <div
              style={{
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: "12px",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: fireResult.onTrack ? "#22c55e15" : "#ef444415",
                  border: `2px solid ${fireResult.onTrack ? "#22c55e40" : "#ef444440"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {fireResult.onTrack ? (
                  <CheckCircle size={22} style={{ color: "#22c55e" }} />
                ) : (
                  <AlertTriangle size={22} style={{ color: "#ef4444" }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: fireResult.onTrack ? "#22c55e" : "#ef4444", fontSize: "1.05rem" }}>
                  {fireResult.onTrack ? "On Track" : "Behind"}
                </div>
                <p style={{ fontSize: "0.85rem", color: t.muted, margin: "0.15rem 0 0" }}>
                  {fireResult.onTrack
                    ? `At ${annualReturn}% annual return, your projected monthly retirement income of ${fmt(fireResult.monthlyRetirementIncome)} exceeds your current contributions.`
                    : `Consider increasing your monthly contribution or starting earlier. Your projected monthly income of ${fmt(fireResult.monthlyRetirementIncome)} may not be sufficient.`}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Premium paywall with blurred preview */
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "16px",
              border: `1px solid ${t.primary}30`,
              boxShadow: `0 0 40px ${t.primary}15, 0 8px 32px rgba(0,0,0,0.12)`,
            }}
          >
            {/* Accent bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, #f59e0b, ${t.accent}, #f59e0b)`, zIndex: 3 }} />

            {/* Blurred preview — shows real computed data */}
            <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" as const }}>
              {/* Hero card preview */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  padding: "1.75rem",
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: "0.35rem" }}>Projected Retirement Balance</div>
                <div style={{ fontSize: "2.25rem", fontWeight: 900, lineHeight: 1.1, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(fireResult.projectedBalance)}</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "0.2rem" }}>in {fireResult.yearsUntilRetirement} years</div>
                <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ opacity: 0.7, fontSize: "0.72rem" }}>Monthly Income</div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(fireResult.monthlyRetirementIncome)}/mo</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.7, fontSize: "0.72rem" }}>Annual Withdrawal</div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(fireResult.annualWithdrawal)}/yr</div>
                  </div>
                </div>
              </div>

              {/* On-track preview */}
              <div style={{ background: t.cardBg, padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#22c55e15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={18} style={{ color: "#22c55e" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.95rem" }}>On Track</div>
                  <div style={{ fontSize: "0.8rem", color: t.muted }}>Your projection details are ready</div>
                </div>
              </div>
            </div>

            {/* Overlay CTA */}
            <div
              className="atv-locked-overlay"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                zIndex: 2,
                padding: "2rem",
                textAlign: "center",
                background: isDark
                  ? "linear-gradient(rgba(15,17,21,0.35), rgba(15,17,21,0.55))"
                  : "linear-gradient(rgba(248,249,252,0.35), rgba(248,249,252,0.55))",
              }}
            >
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: `linear-gradient(135deg, #f59e0b20, ${t.primary}20)`,
                border: `2px solid #f59e0b40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 20px #f59e0b20`,
              }}>
                <Flame size={24} style={{ color: "#f59e0b" }} />
              </div>

              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: t.text, margin: 0 }}>
                Your FIRE projection is ready
              </h3>
              <p style={{ fontSize: "0.85rem", color: t.muted, margin: 0, lineHeight: 1.5, maxWidth: "340px" }}>
                See your full retirement balance, monthly income, and on-track status.
              </p>

              {/* Feature pills */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                {["Projected Balance", "4% Rule Income", "On-Track Status"].map((label) => (
                  <span
                    key={label}
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "0.25rem 0.65rem",
                      borderRadius: "20px",
                      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                      color: t.muted,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onUpgrade("premium")}
                style={{
                  background: `linear-gradient(135deg, #f59e0b, #ea580c)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.75rem 2.25rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: `0 4px 20px rgba(245,158,11,0.35)`,
                  marginTop: "0.25rem",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(245,158,11,0.45)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,158,11,0.35)"; }}
              >
                <Lock size={15} />
                Unlock FIRE Estimator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Debts localStorage ──────────────────────────────────────────────────────

function loadDebts(): DebtItem[] {
  try {
    const raw = localStorage.getItem("incomecalc-debts");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDebts(debts: DebtItem[]) {
  localStorage.setItem("incomecalc-debts", JSON.stringify(debts));
}

// ─── Simple SVG Line Chart ──────────────────────────────────────────────────

function MiniLineChart({ data, color, height = 120, label }: { data: number[]; color: string; height?: number; label: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const pad = 8;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.25rem" }}>{label}</div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: `${h}px` }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => {
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = h - pad - ((v - min) / range) * (h - pad * 2);
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
        })}
      </svg>
    </div>
  );
}

// ─── Forecast Page ──────────────────────────────────────────────────────────

interface ForecastPageProps {
  expenses: ExpenseData;
  taxRate: number;
  onBack: () => void;
  onUpgrade: (plan?: PlanId) => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
}

function ForecastPage({
  expenses,
  taxRate,
  onBack,
  onUpgrade,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
}: ForecastPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const isPremium = userTier === "premium";

  const outputs = computeForExpenses(expenses, taxRate);

  // Override inputs
  const [startingEF, setStartingEF] = useState(0);
  const [monthlyEFContrib, setMonthlyEFContrib] = useState(expenses.savings);
  const [extraDebtPayment, setExtraDebtPayment] = useState(0);
  const [incomeGrowth, setIncomeGrowth] = useState(0);

  // Pull debt data from localStorage
  const savedDebts = loadDebts();
  const totalDebtBalance = savedDebts.reduce((sum, d) => sum + d.balance, 0);
  const totalDebtMinPayment = savedDebts.reduce((sum, d) => sum + d.minPayment, 0);

  const snapshots = forecast12Months({
    expenses,
    taxRate,
    startingEmergencyFund: startingEF,
    monthlyEmergencyContribution: monthlyEFContrib,
    extraDebtPaymentBudget: extraDebtPayment,
    incomeGrowthPct: incomeGrowth,
    currentDebtBalance: totalDebtBalance,
    currentDebtMinPayment: totalDebtMinPayment,
  });

  const visibleMonths = isPremium ? 12 : 2;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: isMobile ? "72px 1rem 3rem" : "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <TrendingUp size={22} style={{ color: currentTheme.primary }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: 0 }}>12-Month Forecast</h1>
          <Badge style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40", fontSize: "0.7rem" }}>Premium</Badge>
        </div>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
          Month-by-month projections for stability, runway, savings, and debt.
        </p>

        {/* Override inputs */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: t.text, marginBottom: "0.75rem" }}>Projection Settings</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label style={{ fontSize: "0.78rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Starting Emergency Fund ($)</Label>
              <Input type="number" min={0} value={startingEF === 0 ? "" : startingEF} onChange={(e) => setStartingEF(Math.max(0, parseFloat(e.target.value) || 0))} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
            </div>
            <div>
              <Label style={{ fontSize: "0.78rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Monthly Savings to Emergency Fund ($)</Label>
              <Input type="number" min={0} value={monthlyEFContrib === 0 ? "" : monthlyEFContrib} onChange={(e) => setMonthlyEFContrib(Math.max(0, parseFloat(e.target.value) || 0))} placeholder={String(expenses.savings)} style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
            </div>
            <div>
              <Label style={{ fontSize: "0.78rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Extra Debt Payment Budget ($)</Label>
              <Input type="number" min={0} value={extraDebtPayment === 0 ? "" : extraDebtPayment} onChange={(e) => setExtraDebtPayment(Math.max(0, parseFloat(e.target.value) || 0))} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
            </div>
            <div>
              <Label style={{ fontSize: "0.78rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Income Growth Over 12mo (%)</Label>
              <Input type="number" min={0} max={100} value={incomeGrowth === 0 ? "" : incomeGrowth} onChange={(e) => setIncomeGrowth(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
            </div>
          </div>
        </div>

        {/* Charts area with premium gate */}
        <div style={{ position: "relative" }}>
          {!isPremium && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem",
              background: isDark ? "rgba(15,15,17,0.85)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", zIndex: 10, borderRadius: "16px",
            }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: currentTheme.primary + "20", border: `2px solid ${currentTheme.primary}40`, display: "flex", alignItems: "center", justifyContent: "center", color: currentTheme.primary }}>
                <Lock size={22} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.25rem" }}>See Your Full 12-Month Outlook</div>
                <div style={{ fontSize: "0.85rem", color: t.muted }}>Unlock stability trends, runway projections, and debt paydown month by month.</div>
              </div>
              <button onClick={() => onUpgrade("premium")} style={{ background: currentTheme.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <TrendingUp size={15} />
                Unlock 12-Month Forecast
              </button>
            </div>
          )}

          <div style={{ filter: isPremium ? "none" : "blur(4px)", pointerEvents: isPremium ? "auto" : "none" }}>
            {/* Mini charts */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1rem" }}>
                <MiniLineChart data={snapshots.slice(0, visibleMonths).map(s => s.stabilityScore)} color="#22c55e" label="Stability Score" />
              </div>
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1rem" }}>
                <MiniLineChart data={snapshots.slice(0, visibleMonths).map(s => s.runwayMonths)} color="#3b82f6" label="Runway (months)" />
              </div>
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1rem" }}>
                <MiniLineChart data={snapshots.slice(0, visibleMonths).map(s => s.emergencyFundBalance)} color="#f59e0b" label="Emergency Fund ($)" />
              </div>
              {totalDebtBalance > 0 && (
                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1rem" }}>
                  <MiniLineChart data={snapshots.slice(0, visibleMonths).map(s => s.debtBalance)} color="#ef4444" label="Debt Balance ($)" />
                </div>
              )}
            </div>

            {/* Table view */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", overflow: "auto" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: t.text, marginBottom: "0.75rem" }}>Monthly Breakdown</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    {["Month", "Emergency Fund", "Runway", totalDebtBalance > 0 ? "Debt Balance" : null, "Stability"].filter(Boolean).map((h) => (
                      <th key={h!} style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: t.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.slice(0, visibleMonths).map((s) => (
                    <tr key={s.month}>
                      <td style={{ padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: t.text, fontWeight: 600 }}>Mo {s.month}</td>
                      <td style={{ padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: "#f59e0b", fontWeight: 600, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(s.emergencyFundBalance)}</td>
                      <td style={{ padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: "#3b82f6", fontWeight: 600, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{s.runwayMonths.toFixed(1)}mo</td>
                      {totalDebtBalance > 0 && (
                        <td style={{ padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: s.debtBalance > 0 ? "#ef4444" : "#22c55e", fontWeight: 600, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(s.debtBalance)}</td>
                      )}
                      <td style={{ padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, fontWeight: 700 }}>
                        <span style={{ color: s.stabilityScore >= 70 ? "#22c55e" : s.stabilityScore >= 50 ? "#f59e0b" : "#ef4444" }}>{s.stabilityScore}</span>
                        <span style={{ color: t.muted }}>/100</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Debt Payoff Optimizer Page ─────────────────────────────────────────────

interface DebtPageProps {
  onBack: () => void;
  onUpgrade: (plan?: PlanId) => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
}

function DebtPage({
  onBack,
  onUpgrade,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
}: DebtPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const isFree = userTier === "free";
  const isPro = userTier === "pro";
  const isPremium = userTier === "premium";

  const [debts, setDebts] = useState<DebtItem[]>(() => {
    const saved = loadDebts();
    return saved.length > 0 ? saved : [];
  });
  const [extraBudget, setExtraBudget] = useState(0);
  const [mode, setMode] = useState<"snowball" | "avalanche" | "compare">("compare");

  // Debt limits by tier
  const debtLimit = isPremium ? 999 : isPro ? 6 : 2;

  // Persist debts
  useEffect(() => { saveDebts(debts); }, [debts]);

  function addDebt() {
    if (debts.length >= debtLimit) return;
    setDebts([...debts, { id: genId(), name: `Debt ${debts.length + 1}`, balance: 0, apr: 0, minPayment: 0 }]);
  }

  function updateDebt(id: string, field: keyof Omit<DebtItem, "id">, value: string | number) {
    setDebts(debts.map((d) => d.id === id ? { ...d, [field]: typeof value === "string" && field !== "name" ? Math.max(0, parseFloat(value) || 0) : value } : d));
  }

  function removeDebt(id: string) {
    setDebts(debts.filter((d) => d.id !== id));
  }

  const validDebts = debts.filter((d) => d.balance > 0 && d.minPayment > 0);

  const snowballResult = validDebts.length > 0 ? simulateSnowball(validDebts, extraBudget) : null;
  const avalancheResult = validDebts.length > 0 ? simulateAvalanche(validDebts, extraBudget) : null;

  const canSeeDetails = !isFree;
  const showExport = isPremium;

  function exportCSV() {
    if (!avalancheResult) return;
    const result = mode === "snowball" ? snowballResult! : avalancheResult;
    const header = "Month,Total Balance,Total Interest\n";
    const rows = result.schedule.map((s) => `${s.month},${s.totalBalance},${s.totalInterest}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "debt-payoff-schedule.csv";
    link.click();
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: isMobile ? "72px 1rem 3rem" : "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Wallet size={22} style={{ color: "#ef4444" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: 0 }}>Debt Payoff Optimizer</h1>
        </div>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
          Compare Snowball vs Avalanche strategies and find the fastest payoff plan.
        </p>

        {/* Debt list editor */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: t.text }}>Your Debts</span>
            <span style={{ fontSize: "0.78rem", color: t.muted }}>{debts.length}/{debtLimit === 999 ? "Unlimited" : debtLimit}</span>
          </div>

          {debts.map((debt) => (
            <div key={debt.id} style={{ background: isDark ? "#2a2a2f" : "#f9f9fb", borderRadius: "10px", padding: "0.85rem", marginBottom: "0.65rem", border: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <input
                  value={debt.name}
                  onChange={(e) => updateDebt(debt.id, "name", e.target.value)}
                  style={{ background: "transparent", border: "none", fontWeight: 700, color: t.text, fontSize: "16px", outline: "none", padding: 0, width: "150px" }}
                  placeholder="Debt name"
                />
                <button onClick={() => removeDebt(debt.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "2px" }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <Label style={{ fontSize: "0.72rem", color: t.muted, display: "block", marginBottom: "0.2rem" }}>Balance ($)</Label>
                  <Input type="number" min={0} value={debt.balance === 0 ? "" : debt.balance} onChange={(e) => updateDebt(debt.id, "balance", e.target.value)} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: "16px" }} />
                </div>
                <div>
                  <Label style={{ fontSize: "0.72rem", color: t.muted, display: "block", marginBottom: "0.2rem" }}>APR (%)</Label>
                  <Input type="number" min={0} max={60} step={0.1} value={debt.apr === 0 ? "" : debt.apr} onChange={(e) => updateDebt(debt.id, "apr", e.target.value)} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: "16px" }} />
                </div>
                <div>
                  <Label style={{ fontSize: "0.72rem", color: t.muted, display: "block", marginBottom: "0.2rem" }}>Min Payment ($)</Label>
                  <Input type="number" min={0} value={debt.minPayment === 0 ? "" : debt.minPayment} onChange={(e) => updateDebt(debt.id, "minPayment", e.target.value)} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: "16px" }} />
                </div>
              </div>
            </div>
          ))}

          {debts.length < debtLimit ? (
            <button onClick={addDebt} style={{ background: t.primary + "15", color: t.primary, border: `1px solid ${t.primary}30`, borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <Plus size={14} /> Add Debt
            </button>
          ) : (
            <div style={{ fontSize: "0.82rem", color: t.muted }}>
              {isPremium ? null : (
                <button onClick={() => onUpgrade(isFree ? "pro" : "premium")} style={{ background: "transparent", border: "none", color: t.primary, cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", padding: 0 }}>
                  Upgrade for more debt slots
                </button>
              )}
            </div>
          )}
        </div>

        {/* Free users: paywall card replaces extra payment, strategy, and results */}
        {isFree ? (
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
              padding: "2.5rem 2rem",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              marginBottom: "1.25rem",
            }}
          >
            {/* Accent bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)" }} />

            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#ef444415", border: "2px solid #ef444430", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", margin: "0 auto 1rem" }}>
              <Wallet size={26} />
            </div>

            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: t.text, margin: "0 0 0.5rem" }}>
              Your payoff plan is ready
            </h3>
            <p style={{ fontSize: "0.9rem", color: t.muted, margin: "0 0 1.25rem", lineHeight: 1.55, maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
              See which strategy saves you the most interest, your optimal payoff order, and how long until you're debt-free — based on your debts.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {[
                { label: "Payoff Order", icon: "📋" },
                { label: "Interest Saved", icon: "💰" },
                { label: "Strategy Pick", icon: "🏆" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", color: t.muted }}>
                  <span style={{ fontSize: "0.9rem" }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>

            <button
              onClick={() => onUpgrade("pro")}
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0.7rem 2rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
              }}
            >
              <Wallet size={16} />
              Unlock Debt Optimizer
            </button>
          </div>
        ) : (
        <>
        {/* Extra payment field */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Extra Payment per Month ($)</Label>
            <Input type="number" min={0} value={extraBudget === 0 ? "" : extraBudget} onChange={(e) => setExtraBudget(Math.max(0, parseFloat(e.target.value) || 0))} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, maxWidth: "200px" }} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            {(["snowball", "avalanche", "compare"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                background: mode === m ? t.primary : "transparent",
                color: mode === m ? "#fff" : t.text,
                border: `1px solid ${mode === m ? t.primary : t.border}`,
                borderRadius: "8px", padding: "0.45rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
              }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {validDebts.length > 0 && snowballResult && avalancheResult && (
          <div style={{ position: "relative" }}>

            {/* Comparison cards */}
            {(mode === "compare" || mode === "snowball" || mode === "avalanche") && (
              <div style={{ display: "grid", gridTemplateColumns: mode === "compare" && !isMobile ? "1fr 1fr" : "1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                {(mode === "compare" || mode === "snowball") && (
                  <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <TrendingDown size={16} style={{ color: "#3b82f6" }} />
                      <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>Snowball</span>
                      <span style={{ fontSize: "0.72rem", color: t.muted }}>(Smallest balance first)</span>
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#3b82f6", marginBottom: "0.25rem" }}>{formatMonths(snowballResult.months)}</div>
                    <div style={{ fontSize: "0.85rem", color: t.muted, marginBottom: "0.25rem" }}>Total interest: <strong style={{ color: "#ef4444", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(snowballResult.totalInterestPaid)}</strong></div>
                    {canSeeDetails && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <div style={{ fontSize: "0.78rem", color: t.muted, marginBottom: "0.25rem" }}>Payoff order:</div>
                        {snowballResult.payoffOrder.map((name, i) => (
                          <div key={i} style={{ fontSize: "0.82rem", color: t.text, padding: "0.15rem 0" }}>{i + 1}. {name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {(mode === "compare" || mode === "avalanche") && (
                  <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <TrendingDown size={16} style={{ color: "#22c55e" }} />
                      <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>Avalanche</span>
                      <span style={{ fontSize: "0.72rem", color: t.muted }}>(Highest APR first)</span>
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#22c55e", marginBottom: "0.25rem" }}>{formatMonths(avalancheResult.months)}</div>
                    <div style={{ fontSize: "0.85rem", color: t.muted, marginBottom: "0.25rem" }}>Total interest: <strong style={{ color: "#ef4444", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(avalancheResult.totalInterestPaid)}</strong></div>
                    {canSeeDetails && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <div style={{ fontSize: "0.78rem", color: t.muted, marginBottom: "0.25rem" }}>Payoff order:</div>
                        {avalancheResult.payoffOrder.map((name, i) => (
                          <div key={i} style={{ fontSize: "0.82rem", color: t.text, padding: "0.15rem 0" }}>{i + 1}. {name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            {mode === "compare" && canSeeDetails && (
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Trophy size={16} style={{ color: "#f59e0b" }} />
                  <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>Recommendation</span>
                </div>
                {avalancheResult.months <= snowballResult.months ? (
                  <p style={{ fontSize: "0.88rem", color: t.muted, margin: 0, lineHeight: 1.6 }}>
                    <strong style={{ color: "#22c55e" }}>Avalanche</strong> is the fastest strategy, saving you <strong style={{ color: "#22c55e", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid)}</strong> in interest
                    {snowballResult.months !== avalancheResult.months && ` and ${snowballResult.months - avalancheResult.months} month${snowballResult.months - avalancheResult.months !== 1 ? "s" : ""}`}.
                    It targets the highest-interest debt first, minimizing total cost.
                  </p>
                ) : (
                  <p style={{ fontSize: "0.88rem", color: t.muted, margin: 0, lineHeight: 1.6 }}>
                    <strong style={{ color: "#3b82f6" }}>Snowball</strong> pays off debts fastest by targeting the smallest balance first.
                    Avalanche saves <strong style={{ color: "#22c55e", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid)}</strong> in interest but takes {avalancheResult.months - snowballResult.months} month{avalancheResult.months - snowballResult.months !== 1 ? "s" : ""} longer.
                  </p>
                )}
              </div>
            )}

            {/* CSV export for Premium */}
            {showExport && (
              <button onClick={exportCSV} style={{ background: t.primary + "15", color: t.primary, border: `1px solid ${t.primary}30`, borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        )}

        {validDebts.length === 0 && debts.length > 0 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
            <p style={{ color: t.muted, fontSize: "0.9rem", margin: 0 }}>Fill in balance and minimum payment for at least one debt to see results.</p>
          </div>
        )}

        {debts.length === 0 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
            <Wallet size={32} style={{ color: t.muted, marginBottom: "0.75rem" }} />
            <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1rem" }}>Add your debts to see payoff strategies and timelines.</p>
            <button onClick={addDebt} style={{ background: t.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <Plus size={15} /> Add Your First Debt
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

// ─── FI Date Estimator Page ─────────────────────────────────────────────────

interface FIPageProps {
  expenses: ExpenseData;
  taxRate: number;
  onBack: () => void;
  onUpgrade: (plan?: PlanId) => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
}

function FIEstimatorPage({
  expenses,
  taxRate,
  onBack,
  onUpgrade,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
}: FIPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const isPremium = userTier === "premium";

  const outputs = computeForExpenses(expenses, taxRate);
  const annualExpenses = outputs.monthlyExpensesTotal * 12;

  const [currentAssets, setCurrentAssets] = useState(0);
  const [monthlyInvest, setMonthlyInvest] = useState(expenses.savings);
  const [annualReturn, setAnnualReturn] = useState(6);
  const [swr, setSwr] = useState(4);

  const fiResult = simulateFI({
    annualExpenses,
    currentInvestedAssets: currentAssets,
    monthlyInvestableAmount: monthlyInvest,
    expectedAnnualReturn: annualReturn / 100,
    safeWithdrawalRate: swr / 100,
  });

  const fiDate = new Date(fiResult.projectedFIDate);
  const fiDateStr = fiResult.onTrack
    ? fiDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "50+ years";

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: isMobile ? "72px 1rem 3rem" : "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Milestone size={22} style={{ color: t.primary }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: 0 }}>Financial Independence Date</h1>
          <Badge style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40", fontSize: "0.7rem" }}>Premium</Badge>
        </div>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
          Estimate when your invested assets can cover your annual expenses using the safe withdrawal rate.
        </p>

        {/* Inputs */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Annual Expenses (from calculator)</Label>
              <div style={{ padding: "0.55rem 0.75rem", background: t.primary + "10", borderRadius: "8px", fontWeight: 700, color: t.primary, fontSize: "0.95rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(annualExpenses)}/yr</div>
            </div>
            <div>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Current Invested Assets ($)</Label>
              <Input type="number" min={0} value={currentAssets === 0 ? "" : currentAssets} onChange={(e) => setCurrentAssets(Math.max(0, parseFloat(e.target.value) || 0))} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
            </div>
            <div>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Monthly Investable Amount ($)</Label>
              <Input type="number" min={0} value={monthlyInvest === 0 ? "" : monthlyInvest} onChange={(e) => setMonthlyInvest(Math.max(0, parseFloat(e.target.value) || 0))} placeholder={String(expenses.savings)} style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
            </div>
            <div>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Expected Annual Return (%)</Label>
              <Input type="number" min={0} max={20} step={0.5} value={annualReturn} onChange={(e) => setAnnualReturn(Math.max(0, Math.min(20, parseFloat(e.target.value) || 0)))} style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Safe Withdrawal Rate (%)</Label>
              <Input type="number" min={1} max={10} step={0.5} value={swr} onChange={(e) => setSwr(Math.max(1, Math.min(10, parseFloat(e.target.value) || 4)))} style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, maxWidth: "180px" }} />
            </div>
          </div>
        </div>

        {/* Results — premium gets full view, others get paywall card */}
        {isPremium ? (
          <>
            {/* FI Target */}
            <div style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`, borderRadius: "16px", padding: "2rem", marginBottom: "1.25rem", color: "#fff", textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.5rem" }}>FI Target Net Worth</div>
              <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.1, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(fiResult.targetNetWorth)}</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.25rem" }}>
                Based on {fmt(annualExpenses)}/yr expenses at {swr}% SWR
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: t.text }}>Progress to FI</span>
                <span style={{ fontWeight: 700, color: t.primary, fontSize: "0.9rem" }}>{fiResult.currentProgress}%</span>
              </div>
              <div style={{ height: "12px", background: t.border, borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${fiResult.currentProgress}%`, background: `linear-gradient(90deg, ${t.primary}, ${t.accent})`, borderRadius: "6px", transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem", fontSize: "0.78rem", color: t.muted }}>
                <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(currentAssets)} now</span>
                <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(fiResult.targetNetWorth)} target</span>
              </div>
            </div>

            {/* Time to FI big number */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: t.muted, marginBottom: "0.35rem" }}>Time to FI</div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: t.primary }}>
                  {fiResult.onTrack ? `${fiResult.yearsToFI} years` : "50+ years"}
                </div>
                <div style={{ fontSize: "0.82rem", color: t.muted }}>{fiResult.monthsToFI} months</div>
              </div>
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: t.muted, marginBottom: "0.35rem" }}>Projected FI Date</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: t.primary }}>{fiDateStr}</div>
                <div style={{ fontSize: "0.82rem", color: fiResult.onTrack ? "#22c55e" : "#ef4444", fontWeight: 600, marginTop: "0.25rem" }}>
                  {fiResult.onTrack ? "On Track" : "Behind — increase savings or reduce expenses"}
                </div>
              </div>
            </div>

            {/* Assets growth chart */}
            {fiResult.schedule.length > 1 && (
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1rem" }}>
                <MiniLineChart data={fiResult.schedule.map(s => s.assets)} color={t.primary} height={160} label="Projected Assets Over Time" />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: t.muted, paddingTop: "0.25rem" }}>
                  <span>Today</span>
                  <span>{fiResult.onTrack ? `Year ${Math.ceil(fiResult.monthsToFI / 12)}` : "Year 50+"}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Premium paywall with blurred preview */
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "16px",
              border: `1px solid ${t.primary}30`,
              boxShadow: `0 0 40px ${t.primary}15, 0 8px 32px rgba(0,0,0,0.12)`,
            }}
          >
            {/* Accent bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${t.primary}, ${t.accent}, ${t.primary})`, zIndex: 3 }} />

            {/* Blurred preview — shows real computed data */}
            <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" as const }}>
              {/* FI target hero preview */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                  padding: "1.75rem",
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: "0.35rem" }}>FI Target Net Worth</div>
                <div style={{ fontSize: "2.25rem", fontWeight: 900, lineHeight: 1.1, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(fiResult.targetNetWorth)}</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "0.2rem" }}>
                  Based on {fmt(annualExpenses)}/yr at {swr}% SWR
                </div>
              </div>

              {/* Progress + timeline preview */}
              <div style={{ background: t.cardBg, padding: "1rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: t.text }}>Progress to FI</span>
                  <span style={{ fontWeight: 700, color: t.primary, fontSize: "0.85rem" }}>{fiResult.currentProgress}%</span>
                </div>
                <div style={{ height: "10px", background: t.border, borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${fiResult.currentProgress}%`, background: `linear-gradient(90deg, ${t.primary}, ${t.accent})`, borderRadius: "5px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: t.muted }}>Time to FI</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 900, color: t.primary }}>{fiResult.onTrack ? `${fiResult.yearsToFI} yrs` : "50+"}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: t.muted }}>Projected Date</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 900, color: t.primary }}>{fiDateStr}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay CTA */}
            <div
              className="atv-locked-overlay"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                zIndex: 2,
                padding: "2rem",
                textAlign: "center",
                background: isDark
                  ? "linear-gradient(rgba(15,17,21,0.35), rgba(15,17,21,0.55))"
                  : "linear-gradient(rgba(248,249,252,0.35), rgba(248,249,252,0.55))",
              }}
            >
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: `${t.primary}20`,
                border: `2px solid ${t.primary}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 20px ${t.primary}20`,
              }}>
                <Milestone size={24} style={{ color: t.primary }} />
              </div>

              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: t.text, margin: 0 }}>
                Your FI estimate is ready
              </h3>
              <p style={{ fontSize: "0.85rem", color: t.muted, margin: 0, lineHeight: 1.5, maxWidth: "340px" }}>
                See your target net worth, FI date, progress tracking, and growth chart.
              </p>

              {/* Feature pills */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                {["FI Target", "Timeline", "Progress", "Growth Chart"].map((label) => (
                  <span
                    key={label}
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "0.25rem 0.65rem",
                      borderRadius: "20px",
                      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                      color: t.muted,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onUpgrade("premium")}
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.75rem 2.25rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: `0 4px 20px ${t.primary}40`,
                  marginTop: "0.25rem",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 24px ${t.primary}55`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${t.primary}40`; }}
              >
                <Lock size={15} />
                Unlock FI Estimator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dev Access Page ──────────────────────────────────────────────────────────

interface DevAccessProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  devOverride: boolean;
  devBadgeLabel: string | null;
  effectiveTier: UserTier;
  onToggle: (enabled: boolean, level?: "pro" | "premium") => void;
  onBack: () => void;
}

function DevAccessPage({ isDark, setIsDark, currentTheme, devOverride, devBadgeLabel, effectiveTier, onToggle, onBack }: DevAccessProps) {
  const t = applyDark(currentTheme, isDark);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} devOverride={devOverride} />
      <div style={{ paddingTop: "80px", maxWidth: "480px", margin: "0 auto", padding: "80px 1rem 2rem" }}>
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Developer Tools</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>Developer Access Override</h2>
          <p style={{ fontSize: "0.85rem", color: t.muted, marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Bypass feature gates for testing. This sets a localStorage flag and does not affect Stripe or billing logic.
          </p>

          {/* Status badge */}
          <div style={{
            background: devOverride ? "#dc262615" : t.bg,
            border: `1px solid ${devOverride ? "#dc2626" : t.border}`,
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.25rem" }}>
              Status:{" "}
              {devOverride ? (
                <span style={{ color: "#dc2626" }}>Active</span>
              ) : (
                <span style={{ color: t.muted }}>Inactive</span>
              )}
            </div>
            <div style={{ fontSize: "0.78rem", color: t.muted, marginBottom: "0.25rem" }}>
              Effective tier: <strong style={{ color: effectiveTier === "premium" ? t.primary : effectiveTier === "pro" ? "#3b82f6" : t.muted }}>{effectiveTier.toUpperCase()}</strong>
            </div>
            {devBadgeLabel && (
              <div style={{
                display: "inline-block",
                background: "#dc2626",
                color: "#fff",
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
                letterSpacing: "0.04em",
                marginTop: "0.35rem",
              }}>
                {devBadgeLabel}
              </div>
            )}
          </div>

          {/* Tier buttons */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => onToggle(true, "pro")}
              style={{
                background: effectiveTier === "pro" && devOverride ? "#3b82f6" : t.bg,
                color: effectiveTier === "pro" && devOverride ? "#fff" : "#3b82f6",
                border: "2px solid #3b82f6",
                borderRadius: "8px",
                padding: "0.6rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Unlock Pro
            </button>
            <button
              onClick={() => onToggle(true, "premium")}
              style={{
                background: effectiveTier === "premium" && devOverride ? t.primary : t.bg,
                color: effectiveTier === "premium" && devOverride ? "#fff" : t.primary,
                border: `2px solid ${t.primary}`,
                borderRadius: "8px",
                padding: "0.6rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Unlock Premium
            </button>
            <button
              onClick={() => onToggle(false)}
              style={{
                background: !devOverride ? t.muted + "30" : "#dc2626",
                color: !devOverride ? t.muted : "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: !devOverride ? "not-allowed" : "pointer",
                opacity: !devOverride ? 0.5 : 1,
              }}
              disabled={!devOverride}
            >
              Lock (Free)
            </button>
          </div>

          {/* Info */}
          <div style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: t.muted, lineHeight: 1.5, textAlign: "left" }}>
            <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>Other ways to activate:</div>
            <div style={{ fontFamily: MONO_FONT_STACK, fontSize: "0.72rem", background: t.bg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "0.65rem", lineHeight: 1.8 }}>
              ?dev=1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&rarr; premium<br />
              ?dev=premium &nbsp;&nbsp;&nbsp;&rarr; premium<br />
              ?dev=pro &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&rarr; pro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Modal ──────────────────────────────────────────────────────────────

interface AuthModalProps {
  mode: "signin" | "signup";
  onClose: () => void;
  onSuccess: (user: AuthUser, mode: "signin" | "signup") => void;
  t: ThemeConfig;
  isDark: boolean;
}

function AuthModal({ mode: initialMode, onClose, onSuccess, t, isDark }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const result = mode === "signup"
      ? await authSignup(email, password, name.trim() || undefined)
      : await authLogin(email, password);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onSuccess(result.user, mode);
    setLoading(false);
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "min(400px, 100%)", background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={18} style={{ color: t.primary }} />
            <span style={{ fontWeight: 700, color: t.text }}>{mode === "signup" ? "Create Account" : "Sign In"}</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {error && (
            <div style={{ background: "#ef444415", border: "1px solid #ef444440", borderRadius: "8px", padding: "0.6rem 0.85rem", marginBottom: "1rem", fontSize: "0.85rem", color: "#ef4444" }}>
              {error}
            </div>
          )}
          {mode === "signup" && (
            <div style={{ marginBottom: "1rem" }}>
              <Label style={{ fontSize: "0.85rem", color: t.text, display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>Your name</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name works"
                maxLength={60}
                autoFocus
                style={{ background: isDark ? "#2a2a2f" : t.bg, border: `1px solid ${t.border}`, color: t.text }}
              />
            </div>
          )}
          <div style={{ marginBottom: "1rem" }}>
            <Label style={{ fontSize: "0.85rem", color: t.text, display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus={mode !== "signup"}
              style={{ background: isDark ? "#2a2a2f" : t.bg, border: `1px solid ${t.border}`, color: t.text }}
            />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <Label style={{ fontSize: "0.85rem", color: t.text, display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{ background: isDark ? "#2a2a2f" : t.bg, border: `1px solid ${t.border}`, color: t.text }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: t.primary,
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "0.75rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
          <div style={{ textAlign: "center", fontSize: "0.85rem", color: t.muted }}>
            {mode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
              style={{ background: "transparent", border: "none", color: t.primary, fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", padding: 0 }}
            >
              {mode === "signup" ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

interface DashboardPageProps {
  user: AuthUser;
  onBack: () => void;
  onLoadScenario: (s: SavedScenario) => void;
  onShare: (s: SavedScenario) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
}

function DashboardPage({ user, onBack, onLoadScenario, onShare, isDark, setIsDark, currentTheme }: DashboardPageProps) {
  const t = applyDark(currentTheme, isDark);
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [digestEnabled, setDigestEnabled] = useState(user.emailWeeklyDigestEnabled);
  const [digestDay, setDigestDay] = useState(user.digestDayOfWeek);
  const [showPrefs, setShowPrefs] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setScenarios(listSavedScenarios(user.id));
  }, [user.id]);

  function handleDelete(id: string) {
    deleteScenario(id, user.id);
    setScenarios(listSavedScenarios(user.id));
    setDeleteConfirm(null);
  }

  function handleTogglePublish(s: SavedScenario) {
    if (s.isPublic) {
      unpublishScenario(s.id, user.id);
    } else {
      publishScenario(s.id, user.id);
    }
    setScenarios(listSavedScenarios(user.id));
  }

  function handleSavePrefs() {
    updateUserPreferences(user.id, {
      emailWeeklyDigestEnabled: digestEnabled,
      digestDayOfWeek: digestDay,
    });
    setShowPrefs(false);
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} />
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: t.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem" }}>
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: t.text, margin: 0 }}>My Dashboard</h1>
            <p style={{ color: t.muted, fontSize: "0.85rem", margin: 0 }}>{user.email}</p>
          </div>
        </div>
        <p style={{ color: t.muted, fontSize: "0.9rem", margin: "0.5rem 0 1.5rem" }}>
          {scenarios.length} saved scenario{scenarios.length !== 1 ? "s" : ""}
        </p>

        {/* Email Digest Preferences */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Mail size={16} style={{ color: t.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>Weekly Email Digest</span>
            </div>
            <button onClick={() => setShowPrefs(!showPrefs)} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}>
              <Settings size={16} />
            </button>
          </div>
          <p style={{ color: t.muted, fontSize: "0.82rem", margin: "0.35rem 0 0" }}>
            {digestEnabled ? `Active — sent every ${dayNames[digestDay]}` : "Disabled"}
          </p>
          {showPrefs && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: isDark ? "#2a2a2f" : "#f9f9fb", borderRadius: "8px", border: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <button
                  onClick={() => setDigestEnabled(!digestEnabled)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: t.text, padding: 0 }}
                >
                  <div style={{ width: "36px", height: "20px", borderRadius: "10px", background: digestEnabled ? t.primary : t.border, position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: digestEnabled ? "18px" : "2px", transition: "left 0.2s" }} />
                  </div>
                  Weekly digest {digestEnabled ? "ON" : "OFF"}
                </button>
              </div>
              {digestEnabled && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <Label style={{ fontSize: "0.78rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Day of week</Label>
                  <select
                    value={digestDay}
                    onChange={(e) => setDigestDay(parseInt(e.target.value))}
                    style={{ padding: "0.45rem 0.6rem", borderRadius: "6px", border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontSize: "16px" }}
                  >
                    {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              <button onClick={handleSavePrefs} style={{ background: t.primary, color: "#fff", border: "none", borderRadius: "6px", padding: "0.45rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                Save Preferences
              </button>
            </div>
          )}
        </div>

        {/* Saved Scenarios */}
        {scenarios.length === 0 ? (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "2.5rem", textAlign: "center" }}>
            <Save size={32} style={{ color: t.muted, marginBottom: "0.75rem" }} />
            <p style={{ fontWeight: 700, color: t.text, marginBottom: "0.35rem" }}>No saved scenarios yet</p>
            <p style={{ color: t.muted, fontSize: "0.88rem", margin: 0 }}>
              Run the calculator and save your results to see them here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {scenarios.map((s) => (
              <div key={s.id} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: t.text, fontSize: "1rem", marginBottom: "0.15rem" }}>{s.name}</div>
                    <div style={{ fontSize: "0.78rem", color: t.muted }}>
                      {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {s.isPublic && (
                        <span style={{ marginLeft: "0.5rem", background: "#22c55e15", color: "#22c55e", borderRadius: "4px", padding: "1px 6px", fontSize: "0.7rem", fontWeight: 600, border: "1px solid #22c55e30" }}>
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    {deleteConfirm === s.id ? (
                      <>
                        <button onClick={() => handleDelete(s.id)} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setDeleteConfirm(s.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  {[
                    { label: "Monthly", value: fmt(s.resultsJson.grossMonthlyRequired) },
                    { label: "Hourly", value: `${fmt(s.resultsJson.hourlyRequired)}/hr` },
                    { label: "Annual", value: fmt(s.resultsJson.annualGrossRequired) },
                    { label: "Score", value: `${s.resultsJson.healthScore}/100` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.68rem", color: t.muted }}>{label}</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: t.text, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => onLoadScenario(s)}
                    style={{ background: t.primary + "15", color: t.primary, border: `1px solid ${t.primary}30`, borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <Play size={12} /> Open
                  </button>
                  <button
                    onClick={() => onShare(s)}
                    style={{ background: "#22c55e15", color: "#22c55e", border: "1px solid #22c55e30", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <Share2 size={12} /> Share
                  </button>
                  <button
                    onClick={() => handleTogglePublish(s)}
                    style={{ background: s.isPublic ? "#f59e0b15" : t.bg, color: s.isPublic ? "#f59e0b" : t.muted, border: `1px solid ${s.isPublic ? "#f59e0b30" : t.border}`, borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <Globe size={12} /> {s.isPublic ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Share Modal ─────────────────────────────────────────────────────────────

interface ShareModalProps {
  scenario: SavedScenario;
  userId: string;
  onClose: () => void;
  onRefresh: () => void;
  t: ThemeConfig;
  isDark: boolean;
}

function ShareModal({ scenario, userId, onClose, onRefresh, t, isDark }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(scenario.isPublic);
  const [slug, setSlug] = useState(scenario.shareSlug);

  function handlePublish() {
    const updated = publishScenario(scenario.id, userId);
    if (updated) {
      setPublished(true);
      setSlug(updated.shareSlug);
      onRefresh();
    }
  }

  function getShareUrl(): string {
    const base = window.location.origin + window.location.pathname;
    return `${base}?view=share&slug=${slug}`;
  }

  function handleCopy() {
    if (!slug) return;
    navigator.clipboard.writeText(getShareUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShareX() {
    if (!slug) return;
    const url = getShareUrl();
    const text = `I need $${Math.round(scenario.resultsJson.hourlyRequired)}/hr to cover my life. Health Score: ${scenario.resultsJson.healthScore}/100. Check yours:`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "min(420px, 100%)", background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontWeight: 700, color: t.text, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Share2 size={16} style={{ color: t.primary }} /> Share Scenario
          </span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "1.25rem" }}>
          {/* Preview card */}
          <div style={{ background: `linear-gradient(135deg, ${t.primary}12, ${t.primary}05)`, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem", textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.5rem" }}>{scenario.name}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: t.primary, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>${Math.round(scenario.resultsJson.hourlyRequired)}/hr</div>
            <div style={{ fontSize: "0.85rem", color: t.muted, marginTop: "0.25rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
              {fmt(scenario.resultsJson.annualGrossRequired)}/year · Score: {scenario.resultsJson.healthScore}/100
            </div>
            <div style={{ fontSize: "0.72rem", color: t.muted, marginTop: "0.5rem" }}>Built with Ascentra</div>
          </div>

          {!published ? (
            <button
              onClick={handlePublish}
              style={{
                width: "100%",
                background: t.primary,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0.75rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <Globe size={16} />
              Publish & Get Share Link
            </button>
          ) : (
            <div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{
                  flex: 1,
                  background: isDark ? "#2a2a2f" : "#f4f4f5",
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.78rem",
                  color: t.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {getShareUrl()}
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? "#22c55e" : t.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.55rem 0.75rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                onClick={handleShareX}
                style={{
                  width: "100%",
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.6rem",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <ExternalLink size={14} />
                Share to X (Twitter)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Public Share Page ───────────────────────────────────────────────────────

interface SharePageProps {
  slug: string;
  onTryYourOwn: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
}

function SharePage({ slug, onTryYourOwn, isDark, setIsDark, currentTheme }: SharePageProps) {
  const t = applyDark(currentTheme, isDark);
  const scenario = getScenarioBySlug(slug);

  if (!scenario) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
        <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} />
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "120px 1.5rem 4rem", textAlign: "center" }}>
          <AlertTriangle size={40} style={{ color: "#f59e0b", marginBottom: "1rem" }} />
          <h2 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>Scenario Not Found</h2>
          <p style={{ color: t.muted, marginBottom: "1.5rem" }}>This share link may have expired or been unpublished.</p>
          <button onClick={onTryYourOwn} style={{ background: t.primary, color: "#fff", border: "none", borderRadius: "10px", padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}>
            Try Your Own
          </button>
        </div>
      </div>
    );
  }

  const r = scenario.resultsJson;
  const expenses = scenario.inputsJson.expenses;
  const totalMonthly = r.monthlyExpensesTotal;

  // Top 3 categories for public display
  const topCategories = EXPENSE_FIELDS
    .map((f) => ({ label: f.label, value: expenses[f.name], pct: totalMonthly > 0 ? (expenses[f.name] / totalMonthly) * 100 : 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const scoreColor = r.healthScore >= 80 ? "#22c55e" : r.healthScore >= 60 ? "#84cc16" : r.healthScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: t.primary + "15", border: `1px solid ${t.primary}40`, borderRadius: "20px", padding: "0.35rem 1rem", fontSize: "0.85rem", color: t.primary, fontWeight: 600, marginBottom: "1rem" }}>
            <Eye size={14} /> Shared Income Report
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: "0 0 0.25rem" }}>{scenario.name}</h1>
          <p style={{ color: t.muted, fontSize: "0.88rem", margin: 0 }}>Created {new Date(scenario.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        {/* Hero card */}
        <div style={{ background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`, borderRadius: "16px", padding: "2rem", marginBottom: "1.25rem", color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: "0.85rem", opacity: 0.85, marginBottom: "0.5rem" }}>Required annual income</div>
          <div style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.1, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(r.annualGrossRequired)}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Hourly Rate</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>${Math.round(r.hourlyRequired)}/hr</div>
            </div>
            <div>
              <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Monthly Gross</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(r.grossMonthlyRequired)}</div>
            </div>
          </div>
        </div>

        {/* Health Score */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.82rem", color: t.muted, marginBottom: "0.5rem" }}>Financial Health Score</div>
          <div style={{ fontSize: "3rem", fontWeight: 900, color: scoreColor }}>{r.healthScore}</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: scoreColor }}>{r.healthLabel}</div>
          <Progress value={r.healthScore} className="h-2 mt-3" />
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.75rem", fontSize: "0.95rem" }}>Top Expense Categories</div>
            {topCategories.map(({ label, value, pct }) => (
              <div key={label} style={{ marginBottom: "0.6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.88rem", color: t.text }}>{label}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: t.text, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(value)}/mo ({pct.toFixed(0)}%)</span>
                </div>
                <div style={{ height: "5px", background: t.border, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: t.primary, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={onTryYourOwn}
            style={{
              background: t.primary,
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "0.9rem 2.5rem",
              fontSize: "1.05rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: `0 4px 24px ${t.primary}40`,
            }}
          >
            <Calculator size={18} />
            Try Your Own — Free
          </button>
          <p style={{ color: t.muted, fontSize: "0.82rem", marginTop: "0.75rem" }}>
            Built with Ascentra · Financial clarity platform
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Digest Preview Page ─────────────────────────────────────────────────────

interface DigestPreviewPageProps {
  user: AuthUser;
  onBack: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
}

function DigestPreviewPage({ user, onBack, isDark, setIsDark, currentTheme }: DigestPreviewPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const digest = generateDigestForUser(user.id);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendTest() {
    if (!digest) return;
    setSending(true);
    const appBaseUrl = window.location.origin + window.location.pathname;
    const html = buildDigestEmailHtml(digest, appBaseUrl);
    await sendEmail({ to: user.email, subject: `[TEST] Weekly Digest Preview`, html });
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  async function handleTriggerAll() {
    setSending(true);
    const appBaseUrl = window.location.origin + window.location.pathname;
    const result = await runWeeklyDigest(appBaseUrl);
    setSending(false);
    setSent(true);
    console.log("Weekly digest results:", result);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Mail size={22} style={{ color: t.primary }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: t.text, margin: 0 }}>Weekly Digest Preview</h1>
        </div>

        {!digest ? (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
            <Mail size={32} style={{ color: t.muted, marginBottom: "0.75rem" }} />
            <p style={{ fontWeight: 700, color: t.text, marginBottom: "0.35rem" }}>No scenarios saved</p>
            <p style={{ color: t.muted, fontSize: "0.88rem", margin: 0 }}>Save a scenario first to preview the weekly digest email.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={handleSendTest}
                disabled={sending}
                style={{ background: t.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0.55rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                <Send size={14} />
                {sent ? "Sent! (check console)" : sending ? "Sending..." : "Send Test Email"}
              </button>
              <button
                onClick={handleTriggerAll}
                disabled={sending}
                style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", padding: "0.55rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                <Mail size={14} />
                Trigger All Digests (DEV)
              </button>
            </div>
            <p style={{ color: t.muted, fontSize: "0.78rem", marginBottom: "1rem" }}>
              Email provider: <strong>console</strong> (emails logged to browser console). Set EMAIL_PROVIDER env var for production.
            </p>

            {/* Digest content preview */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ fontWeight: 700, color: t.text, marginBottom: "1rem", fontSize: "0.95rem" }}>Preview: {digest.latestScenario.name}</div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                {[
                  { label: "Monthly Required", value: fmt(digest.latestScenario.resultsJson.grossMonthlyRequired), delta: digest.deltas.monthlyRequired },
                  { label: "Hourly Rate", value: `${fmt(digest.latestScenario.resultsJson.hourlyRequired)}/hr`, delta: digest.deltas.hourlyRequired },
                  { label: "Health Score", value: `${digest.latestScenario.resultsJson.healthScore}/100`, delta: digest.deltas.healthScore },
                ].map(({ label, value, delta }) => (
                  <div key={label} style={{ padding: "0.75rem", background: isDark ? "#2a2a2f" : "#f9f9fb", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: t.muted, marginBottom: "0.25rem" }}>{label}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: t.text, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{value}</div>
                    {delta !== null && (
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'", color: label === "Health Score" ? (delta > 0 ? "#22c55e" : "#ef4444") : (delta > 0 ? "#ef4444" : "#22c55e") }}>
                        {delta > 0 ? "+" : ""}{label === "Health Score" ? delta.toFixed(0) : fmt(delta)} vs previous
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.5rem", fontSize: "0.9rem" }}>Recommendations</div>
              {digest.recommendations.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 0", borderBottom: i < digest.recommendations.length - 1 ? `1px solid ${t.border}` : "none" }}>
                  <span style={{ color: t.primary, fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: "0.85rem", color: t.text, lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Site Footer ──────────────────────────────────────────────────────────────

function SiteFooter({ t }: { t: ThemeConfig }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${t.border}`,
        padding: "1.5rem",
        textAlign: "center",
        background: t.cardBg,
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
        <Link to="/terms" style={{ color: t.muted, textDecoration: "none" }}>Terms</Link>
        <Link to="/privacy" style={{ color: t.muted, textDecoration: "none" }}>Privacy</Link>
        <Link to="/refund-policy" style={{ color: t.muted, textDecoration: "none" }}>Refund Policy</Link>
        <a href="mailto:incomecalcai@proton.me" style={{ color: t.muted, textDecoration: "none" }}>Contact</a>
      </div>
      <div style={{ fontSize: "0.78rem", color: t.muted, opacity: 0.6 }}>
        Ascentra is not financial, tax, or legal advice. For informational and educational purposes only.
      </div>
    </footer>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

const LAST_PAGE_KEY = "ascentra-last-page";

const PERSISTABLE_PAGES: Page[] = [
  "landing", "intent", "calculator", "results", "guided", "dashboard",
  "simulator", "checkin", "fire", "forecast", "debt", "fi",
];

function hasExpenseData(data: ExpenseData): boolean {
  return EXPENSE_FIELDS.some((f) => (data[f.name] ?? 0) > 0);
}

function App() {
  const [page, setPageRaw] = useState<Page>("landing");
  const setPage = (next: Page) => {
    setPageRaw(next);
    try {
      if ((PERSISTABLE_PAGES as string[]).includes(next)) {
        sessionStorage.setItem(LAST_PAGE_KEY, next);
      } else {
        sessionStorage.removeItem(LAST_PAGE_KEY);
      }
    } catch { /* sessionStorage can fail in private mode */ }
  };
  const [isDark, setIsDark] = useState(false);
  const currentTheme = buildTheme(isDark);
  const isMobile = useIsMobile();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    // Mobile status bar color matches the active mode background
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", buildTheme(isDark).bg);
  }, [isDark]);
  const [expenseData, setExpenseData] = useState<ExpenseData>(DEFAULT_EXPENSES);
  const [taxRate, setTaxRate] = useState(25);
  const [currentGrossIncome, setCurrentGrossIncome] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId>("pro");
  const [userTier, setUserTier] = useState<UserTier>(loadUserTier);
  const [devOverride, setDevOverride] = useState(getDevOverride);

  // Guided flow: lifted step state + return context for back navigation
  const [guidedStep, setGuidedStep] = useState(0);
  const [returnTo, setReturnTo] = useState<{ page: Page; guidedStep: number } | null>(null);
  const returnStack = useRef<{ page: Page; guidedStep: number }[]>([]);
  const savedScrollY = useRef(0);

  // ── Auth State ──
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [savePromptPending, setSavePromptPending] = useState(false);
  const [shareModalScenario, setShareModalScenario] = useState<SavedScenario | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  // ── Restore last page from sessionStorage on mount ──
  useEffect(() => {
    if (!currentUser) return;
    try {
      const saved = sessionStorage.getItem(LAST_PAGE_KEY);
      if (!saved) return;
      if (!(PERSISTABLE_PAGES as string[]).includes(saved)) {
        sessionStorage.removeItem(LAST_PAGE_KEY);
        return;
      }
      const requiresData: Page[] = ["guided", "simulator", "checkin", "fire", "forecast", "debt", "fi"];
      if (requiresData.includes(saved as Page) && !hasExpenseData(expenseData)) return;
      setPageRaw(saved as Page);
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resume flow from /welcome ──
  useEffect(() => {
    const resume = readResumeFlow();
    if (resume) {
      clearResumeFlow();
      setExpenseData(resume.expenseData);
      setTaxRate(resume.taxRate);
      setCurrentGrossIncome(resume.currentGrossIncome);
      setGuidedStep(0);
      setReturnTo(null);
      setPage("guided");
    }
  }, []);

  // ── Auth handlers ──
  function openAuthModal(mode: "signin" | "signup" = "signin") {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  }

  function handleSignIn() {
    openAuthModal("signin");
  }

  function handleSignOut() {
    // Clear session-scoped storage keys
    try {
      sessionStorage.removeItem("ascentra-resume-flow");
      sessionStorage.removeItem("ascentra-pending-signup-data");
      sessionStorage.removeItem("ascentra-signup-prompt-dismissed");
      sessionStorage.removeItem("ascentra-intent");
      sessionStorage.removeItem(LAST_PAGE_KEY);
    } catch { /* ignore */ }

    try {
      import("@/lib/auth-store").then(({ logout }) => {
        logout();
        setCurrentUser(null);
        setShowAuthModal(false);
        setSavePromptPending(false);
        setPage("landing");
      });
    } catch {
      setCurrentUser(null);
      setShowAuthModal(false);
      setSavePromptPending(false);
      setPage("landing");
    }
  }
  
  // Create a Stripe Checkout Session via the server and redirect the browser to it.
  async function redirectToCheckout(plan: PlanId, billingPeriod: "monthly" | "yearly") {
    const user = getCurrentUser();
    const session = getSession();

    if (!user || !session) {
      openAuthModal("signin");
      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
      "X-User-Id": user.id,
    };

    try {
      const resp = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers,
        body: JSON.stringify({
          planTier: plan,
          billingPeriod,
          userId: user.id,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "Unknown error");
        console.error("[checkout] Failed to create session:", text);
        alert("Unable to start checkout. Please try again or contact support.");
        return;
      }

      const { url } = (await resp.json()) as { url: string };
      if (url) {
        window.location.href = url;
      } else {
        alert("Unable to start checkout. Please try again.");
      }
    } catch (err) {
      console.error("[checkout] Network error:", err);
      alert("Network error. Please check your connection and try again.");
    }
  }

// ── Global auth event listener (Header dispatches when onSignIn/onSignOut props are absent) ──
  useEffect(() => {
    function onAuthEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.mode === "signout") {
        handleSignOut();
      } else if (detail?.mode === "dashboard") {
        setPage("dashboard");
      } else if (detail?.mode === "digest-preview") {
        setPage("digest-preview");
      } else {
        openAuthModal(detail?.mode === "signup" ? "signup" : "signin");
      }
    }
    window.addEventListener(AUTH_EVENT, onAuthEvent);
    return () => window.removeEventListener(AUTH_EVENT, onAuthEvent);
  }, []);

// ── DEV_BYPASS_PAYWALL ──
  const devBypassActive = isDevBypassPaywall();
  const effectiveTier: UserTier = devBypassActive ? "premium" : (devOverride ? (getPlan() as UserTier) : userTier);
  const devBadgeLabel = devBypassActive ? "DEV: PAYWALL BYPASS" : getDevBadgeLabel();
  // currentTheme is defined above alongside the useEffect

  // ── Entitlement sync on startup ──
  const entitlementSynced = useRef(false);
  useEffect(() => {
    if (entitlementSynced.current) return;
    entitlementSynced.current = true;
    const user = getCurrentUser();
    const session = getSession();
    if (user && session) {
      syncPlan(user.id, session.token).then(() => setUserTier(loadUserTier())); // updates localStorage then React state
    }
  }, []);

  // ── URL Parameter Handling (share pages + unsubscribe) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Handle share page: ?view=share&slug=xxx
    const view = params.get("view");
    const slug = params.get("slug");
    if (view === "share" && slug) {
      setShareSlug(slug);
      setPage("share");
      return;
    }

    // Handle unsubscribe: ?action=unsubscribe&token=xxx
    const action = params.get("action");
    const token = params.get("token");
    if (action === "unsubscribe" && token) {
      import("@/lib/auth-store").then(({ validateUnsubscribeToken, unsubscribeUser }) => {
        const userId = validateUnsubscribeToken(token);
        if (userId) {
          unsubscribeUser(userId);
          alert("You have been unsubscribed from weekly email digests.");
        } else {
          alert("Invalid or expired unsubscribe link.");
        }
      });
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  function handleDevToggle(enabled: boolean, level: "pro" | "premium" = "premium") {
    if (enabled) {
      enableDevOverride(); // legacy
      entitlementEnable(level);
    } else {
      disableDevOverride(); // legacy
      entitlementDisable();
    }
    setDevOverride(enabled);
  }

  function handleResults(data: ExpenseData, rate: number, income: number) {
    setExpenseData(data);
    setTaxRate(rate);
    setCurrentGrossIncome(income);
    setGuidedStep(0);
    setReturnTo(null);
    setPage("guided");
    trackEvent("calculator_completed", { source_page: "calculator", user_tier: userTier });
  }

  function handleStartOver() {
    setGuidedStep(0);
    setReturnTo(null);
    setExpenseData(DEFAULT_EXPENSES);
    setPage("landing");
  }

function handleUpgrade(plan: PlanId = "pro") {
  // Save scroll position before leaving so we can restore on Back
  savedScrollY.current = window.scrollY;
  // Push current returnTo onto stack so the full back-chain is preserved
  // e.g. Results → Fire → Checkout → Back → Fire → Back → Results
  if (returnTo) returnStack.current.push(returnTo);
  setReturnTo({ page, guidedStep });
  setCheckoutPlan(plan);
  setPage("checkout");
  window.scrollTo(0, 0);
}

async function handleAuthSuccess(user: AuthUser, mode: "signin" | "signup") {
  setCurrentUser(user);
  // Re-read tier from localStorage — login may have written a paid plan
  setUserTier(loadUserTier());
  // If user signed in to save a scenario, complete the save now
  if (savePromptPending) {
    setSavePromptPending(false);
    doSaveScenario(user);
  }

  const session = getSession();
  const isNewAccount = mode === "signup";

  if (isNewAccount) {
    // Attach any pending expense data captured before signup
    const pending = readPendingData();
    if (pending && session) {
      const attached = await attachPendingDataToAccount(user.id, session.token, pending);
      if (attached) clearPendingData();
    }
    // New users always go to /welcome
    window.location.href = "/welcome";
  } else {
    // Existing user sign-in — check welcome-seen flag
    if (!hasSeenWelcome(user.id) && session) {
      const { welcomeSeen, hasPendingData } = await checkWelcomeSeenServer(user.id, session.token);
      if (!welcomeSeen && hasPendingData) {
        window.location.href = "/welcome";
      }
    }
  }
}

  // ── Save Scenario ──
  function doSaveScenario(user: AuthUser) {
    const scenarioName = `Scenario — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    createScenario(user.id, scenarioName, expenseData, taxRate, currentGrossIncome);
  }

  function handleSaveScenario() {
    if (!currentUser) {
      // Prompt to sign up
      setSavePromptPending(true);
      setAuthModalMode("signup");
      setShowAuthModal(true);
      return;
    }
    doSaveScenario(currentUser);
    // Brief feedback
    alert("Scenario saved! View it in your Dashboard.");
  }

  // ── Load Scenario from Dashboard ──
  function handleLoadScenario(s: SavedScenario) {
    setExpenseData(s.inputsJson.expenses);
    setTaxRate(s.inputsJson.taxRate);
    setCurrentGrossIncome(s.inputsJson.currentGrossIncome ?? 0);
    setPage("results");
  }

  // ── Share from Dashboard ──
  function handleShareFromDashboard(s: SavedScenario) {
    setShareModalScenario(s);
  }

  const sharedProps = {
    isDark,
    setIsDark,
    currentTheme,
  };

  function backToResults() {
    if (returnTo) {
      const dest = returnTo.page;
      setPage(returnTo.page);
      setGuidedStep(returnTo.guidedStep);
      const prev = returnStack.current.pop() ?? null;
      setReturnTo(prev);
      // Only restore scroll when returning to a content page (results/guided), not a feature page
      if (dest === "results" || dest === "guided") {
        requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, savedScrollY.current)));
      }
      return;
    }
    setPage(expenseData.housing || expenseData.food ? "guided" : "landing");
  }

  // ── Mobile nav helpers ──
  function handleMobileTabChange(tab: MobileTab) {
    switch (tab) {
      case "dashboard": setPage("dashboard"); break;
      case "calculator": setPage("calculator"); break;
      case "diagnosis": setPage("results"); break;
      case "scenarios": setPage("results"); break;
    }
  }

  function handleMobileMoreNavigate(id: string) {
    switch (id) {
      case "simulator": setPage("simulator"); break;
      case "budget": setPage("results"); break;
      case "analytics": setPage("results"); break;
      case "forecast": setPage("forecast"); break;
      case "fire": setPage("fire"); break;
      case "fi": setPage("fi"); break;
      case "debt": setPage("debt"); break;
    }
  }

  // ── Page content (AuthModal rendered globally below) ──
  let pageContent: React.ReactNode;

  if (page === "share" && shareSlug) {
    pageContent = (
      <SharePage
        slug={shareSlug}
        onTryYourOwn={() => { setShareSlug(null); setPage("landing"); }}
        {...sharedProps}
      />
    );
  } else if (page === "dashboard" && currentUser) {
    pageContent = (
      <>
        <DashboardPage
          user={currentUser}
          onBack={backToResults}
          onLoadScenario={handleLoadScenario}
          onShare={handleShareFromDashboard}
          {...sharedProps}
        />
        {shareModalScenario && (
          <ShareModal
            scenario={shareModalScenario}
            userId={currentUser.id}
            onClose={() => setShareModalScenario(null)}
            onRefresh={() => {}}
            t={applyDark(currentTheme, isDark)}
            isDark={isDark}
          />
        )}
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="dashboard" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </>
    );
  } else if (page === "digest-preview" && currentUser) {
    pageContent = (
      <DigestPreviewPage
        user={currentUser}
        onBack={backToResults}
        {...sharedProps}
      />
    );
  } else if (page === "landing") {
    pageContent = (
      <Landing
        onStart={() => setPage("intent")}
        onPricing={() => handleUpgrade("pro")}
        onUpgrade={(plan) => handleUpgrade(plan)}
        onSignIn={() => openAuthModal("signin")}
        onSignOut={handleSignOut}
        onDashboard={() => setPage("results")}
        onDevAccess={() => setPage("dev-access")}
        currentUser={currentUser}
        {...sharedProps}
      />
    );
  } else if (page === "intent") {
    pageContent = (
      <IntentPickerPage
        t={currentTheme}
        isDark={isDark}
        setIsDark={setIsDark}
        onContinue={() => setPage("calculator")}
        onBack={() => setPage("landing")}
      />
    );
  } else if (page === "calculator") {
    pageContent = (
      <>
        <CalculatorPage
          onResults={handleResults}
          onBack={() => setPage("landing")}
          initialData={expenseData}
          initialTaxRate={taxRate}
          initialCurrentIncome={currentGrossIncome}
          {...sharedProps}
        />
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="calculator" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </>
    );
  } else if (page === "checkout") {
    pageContent = (
      <Suspense fallback={<PageLoader />}>
        <CheckoutPage
          onBack={backToResults}
          initialPlan={checkoutPlan}
          onRequireAuth={openAuthModal}
          onCheckout={redirectToCheckout}
          {...sharedProps}
        />
      </Suspense>
    );
  } else if (page === "guided") {
    pageContent = (
      <Suspense fallback={<PageLoader />}>
        <GuidedFlowPage
          data={expenseData}
          taxRate={taxRate}
          currentGrossIncome={currentGrossIncome}
          step={guidedStep}
          onStepChange={setGuidedStep}
          onBack={handleStartOver}
          onRecalculate={() => setPage("calculator")}
          onUpgrade={handleUpgrade}
          onSimulator={() => { savedScrollY.current = window.scrollY; setReturnTo({ page: "guided", guidedStep }); setPage("simulator"); }}
          onResults={() => { savedScrollY.current = window.scrollY; setReturnTo({ page: "guided", guidedStep }); setPage("results"); window.scrollTo(0, 0); }}
          onSaveScenario={handleSaveScenario}
          onDashboard={currentUser ? () => { savedScrollY.current = window.scrollY; setReturnTo({ page: "guided", guidedStep }); setPage("dashboard"); } : undefined}
          userTier={effectiveTier}
          currentUser={currentUser}
          onSignup={() => openAuthModal("signup")}
          {...sharedProps}
        />
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="more" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </Suspense>
    );
  } else if (page === "simulator") {
    pageContent = (
      <Suspense fallback={<PageLoader />}>
        <SimulatorPage
          initialExpenses={expenseData}
          initialTaxRate={taxRate}
          onBack={backToResults}
          onUpgrade={handleUpgrade}
          userTier={effectiveTier}
          {...sharedProps}
        />
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="more" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </Suspense>
    );
  } else if (page === "checkin") {
    pageContent = (
      <Suspense fallback={<PageLoader />}>
        <CheckInPage
          currentExpenses={expenseData}
          currentTaxRate={taxRate}
          onBack={backToResults}
          onUpgrade={handleUpgrade}
          onForecast={() => setPage("forecast")}
          userTier={effectiveTier}
          {...sharedProps}
        />
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="more" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </Suspense>
    );
  } else if (page === "fire") {
    pageContent = (
      <>
        <FirePage
          onBack={backToResults}
          onUpgrade={handleUpgrade}
          userTier={effectiveTier}
          {...sharedProps}
        />
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="more" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </>
    );
  } else if (page === "forecast") {
    pageContent = (
      <>
        <ForecastPage
          expenses={expenseData}
          taxRate={taxRate}
          onBack={backToResults}
          onUpgrade={handleUpgrade}
          userTier={effectiveTier}
          {...sharedProps}
        />
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="more" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </>
    );
  } else if (page === "debt") {
    pageContent = (
      <>
        <DebtPage
          onBack={backToResults}
          onUpgrade={handleUpgrade}
          userTier={effectiveTier}
          {...sharedProps}
        />
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="more" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </>
    );
  } else if (page === "fi") {
    pageContent = (
      <>
        <FIEstimatorPage
          expenses={expenseData}
          taxRate={taxRate}
          onBack={backToResults}
          onUpgrade={handleUpgrade}
          userTier={effectiveTier}
          {...sharedProps}
        />
        {isMobile && (
          <MobileNavShell t={applyDark(currentTheme, isDark)} activeTab="more" onTabChange={handleMobileTabChange} onMoreNavigate={handleMobileMoreNavigate} onSignOut={handleSignOut} />
        )}
      </>
    );
  } else if (page === "dev-access") {
    pageContent = (
      <DevAccessPage
        devOverride={devOverride}
        devBadgeLabel={devBadgeLabel}
        effectiveTier={effectiveTier}
        onToggle={handleDevToggle}
        onBack={backToResults}
        {...sharedProps}
      />
    );
  } else {
    // Default: Results page
    pageContent = (
      <Suspense fallback={<PageLoader />}>
        <ResultsPage
          data={expenseData}
          taxRate={taxRate}
          currentGrossIncome={currentGrossIncome}
          onBack={returnTo ? backToResults : handleStartOver}
          onRecalculate={() => setPage("calculator")}
          onUpgrade={handleUpgrade}
          onSimulator={() => { savedScrollY.current = window.scrollY; setReturnTo({ page: "results", guidedStep }); setPage("simulator"); }}
          fromGuidedFlow={!!returnTo}
          onCheckIn={() => { savedScrollY.current = window.scrollY; setReturnTo({ page: "results", guidedStep }); setPage("checkin"); }}
          onFire={() => { savedScrollY.current = window.scrollY; setReturnTo({ page: "results", guidedStep }); setPage("fire"); }}
          onForecast={() => {
            savedScrollY.current = window.scrollY; setReturnTo({ page: "results", guidedStep }); setPage("forecast");
          }}
          onDebt={() => {
            savedScrollY.current = window.scrollY; setReturnTo({ page: "results", guidedStep }); setPage("debt");
          }}
          onFI={() => {
            savedScrollY.current = window.scrollY; setReturnTo({ page: "results", guidedStep }); setPage("fi");
          }}
          userTier={effectiveTier}
          onDevAccess={() => setPage("dev-access")}
          onSaveScenario={handleSaveScenario}
          onDashboard={() => setPage("dashboard")}
          currentUser={currentUser}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onDigestPreview={() => setPage("digest-preview")}
          {...sharedProps}
        />
        {shareModalScenario && currentUser && (
          <ShareModal
            scenario={shareModalScenario}
            userId={currentUser.id}
            onClose={() => setShareModalScenario(null)}
            onRefresh={() => {}}
            t={applyDark(currentTheme, isDark)}
            isDark={isDark}
          />
        )}
      </Suspense>
    );
  }

  return (
    <>
      {pageContent}
      {showAuthModal && (
        <AuthModal
          mode={authModalMode}
          onClose={() => { setShowAuthModal(false); setSavePromptPending(false); }}
          onSuccess={handleAuthSuccess}
          t={applyDark(currentTheme, isDark)}
          isDark={isDark}
        />
      )}
    </>
  );
}
