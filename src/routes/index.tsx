import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { trackEvent } from "@/lib/analytics";
import { captureError } from "@/lib/sentry";
import { restorePurchase } from "@/lib/stripe-entitlements";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Home,
  Car,
  Utensils,
  Heart,
  Wifi,
  ShoppingBag,
  Plane,
  Moon,
  Sun,
  Sparkles,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Shield,
  Zap,
  Star,
  Lock,
  FileText,
  Target,
  Cloud,
  Brain,
  Users,
  ChevronLeft,
  CreditCard,
  Award,
  MessageCircle,
  Send,
  X,
  Lightbulb,
  RefreshCw,
  Copy,
  Trash2,
  Plus,
  Trophy,
  CalendarCheck,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  Edit3,
  Play,
  AlertTriangle,
  Share2,
  Flame,
  Gauge,
  Clock,
  TrendingDown,
  Wallet,
  Calendar,
  Milestone,
  LogIn,
  LogOut,
  User,
  LayoutDashboard,
  Save,
  ExternalLink,
  Mail,
  Settings,
  Eye,
  Globe,
  Link2,
} from "lucide-react";
import { calculate, estimateTaxRate, INCOME_RANGES, US_STATES, type CalcInput, type CalcOutput, type ExpenseData as CalcExpenseData, type IncomeRange, type FilingStatus } from "@/lib/calc";
import { answerQuestion, type PlanContext } from "@/lib/planRules";
import { computeIncomeGap, computeRunway, computeAlerts } from "@/lib/stabilityMetrics";
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

export const Route = createFileRoute("/")({
  component: App,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = "landing" | "calculator" | "results" | "checkout" | "simulator" | "checkin" | "fire" | "forecast" | "debt" | "fi" | "dev-access" | "dashboard" | "share" | "digest-preview";
type UserTier = "free" | "pro" | "premium";
type Theme = "default" | "ocean" | "forest" | "sunset" | "lavender";
type PlanId = "pro" | "premium";

interface ExpenseData {
  housing: number;
  food: number;
  transport: number;
  healthcare: number;
  utilities: number;
  entertainment: number;
  clothing: number;
  savings: number;
  other: number;
}

interface ThemeConfig {
  name: string;
  icon: string;
  primary: string;
  accent: string;
  bg: string;
  cardBg: string;
  text: string;
  muted: string;
  border: string;
  headerBg: string;
}

// ─── Themes (Apple TV Cinematic) ──────────────────────────────────────────────

const THEMES: Record<Theme, ThemeConfig> = {
  default: {
    name: "Cinematic",
    icon: "◼",
    primary: "#5E5CE6",
    accent: "#8E44FF",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
  ocean: {
    name: "Deep Sea",
    icon: "◆",
    primary: "#5E5CE6",
    accent: "#50D4DC",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
  forest: {
    name: "Aurora",
    icon: "◇",
    primary: "#5E5CE6",
    accent: "#34D399",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
  sunset: {
    name: "Ember",
    icon: "●",
    primary: "#5E5CE6",
    accent: "#F97316",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
  lavender: {
    name: "Prism",
    icon: "◈",
    primary: "#8E44FF",
    accent: "#5E5CE6",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
};

const DARK_OVERRIDES = {
  bg: "#0F1115",
  cardBg: "rgba(255,255,255,0.06)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.45)",
  border: "rgba(255,255,255,0.08)",
  headerBg: "rgba(15,17,21,0.85)",
};

// ─── Expense fields config ─────────────────────────────────────────────────────

type ExpenseKey = keyof ExpenseData;

const EXPENSE_FIELDS: { name: ExpenseKey; label: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
  { name: "housing", label: "Housing / Rent", icon: Home },
  { name: "food", label: "Food & Groceries", icon: Utensils },
  { name: "transport", label: "Transportation", icon: Car },
  { name: "healthcare", label: "Healthcare", icon: Heart },
  { name: "utilities", label: "Utilities & Internet", icon: Wifi },
  { name: "entertainment", label: "Entertainment", icon: Plane },
  { name: "clothing", label: "Clothing & Personal", icon: ShoppingBag },
  { name: "savings", label: "Savings & Investments", icon: TrendingUp },
  { name: "other", label: "Other Expenses", icon: DollarSign },
];

// ─── Plan definitions ─────────────────────────────────────────────────────────

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  badge?: string;
  features: PlanFeature[];
}

const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    price: 4.99,
    yearlyPrice: 49,
    description: "Clarity & Control — know exactly what you need to earn and where it goes.",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Historical analytics dashboard", included: true },
      { text: "Retirement goal planner", included: true },
      { text: "Branded PDF report export", included: true },
      { text: "Compare 3 income scenarios", included: true },
      { text: "AI-powered recommendations", included: false },
      { text: "Multi-person household planning", included: false },
      { text: "Cloud sync across devices", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 19,
    yearlyPrice: 149,
    description: "Financial Growth & Long-Term Strategy — advanced planning, forecasting, and wealth optimization.",
    badge: "Most Popular",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited scenario comparisons", included: true },
      { text: "12-Month cashflow forecast", included: true },
      { text: "FIRE Retirement Estimator", included: true },
      { text: "Stability history tracking", included: true },
      { text: "Advanced AI Advisor", included: true },
      { text: "AI-powered spending recommendations", included: true },
      { text: "Multi-person household planning", included: true },
      { text: "Cloud sync across devices", included: true },
      { text: "Priority email support", included: true },
      { text: "Export to CSV / Google Sheets", included: true },
      { text: "Household multi-income modeling", included: true },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function applyDark(theme: ThemeConfig, isDark: boolean): ThemeConfig {
  if (!isDark) return theme;
  return { ...theme, ...DARK_OVERRIDES };
}

// ─── Scenario & Check-In types ──────────────────────────────────────────────

interface Scenario {
  id: string;
  name: string;
  expenses: ExpenseData;
  taxRate: number;
}

interface CheckInSnapshot {
  id: string;
  date: string; // ISO string
  expenses: ExpenseData;
  taxRate: number;
  outputs: CalcOutput;
  note?: string;
}

// ─── localStorage helpers ────────────────────────────────────────────────────

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem("incomecalc-scenarios");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveScenarios(scenarios: Scenario[]) {
  localStorage.setItem("incomecalc-scenarios", JSON.stringify(scenarios));
}

function loadSnapshots(): CheckInSnapshot[] {
  try {
    const raw = localStorage.getItem("incomecalc-snapshots");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSnapshots(snapshots: CheckInSnapshot[]) {
  localStorage.setItem("incomecalc-snapshots", JSON.stringify(snapshots));
}

function loadUserTier(): UserTier {
  try {
    const raw = localStorage.getItem("incomecalc-tier");
    if (raw === "pro" || raw === "premium") return raw;
    return "free";
  } catch { return "free"; }
}

function getScenarioLimit(tier: UserTier): number {
  if (tier === "premium") return 999;
  if (tier === "pro") return 3;
  return 1;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function computeForExpenses(expenses: ExpenseData, taxRate: number): CalcOutput {
  return calculate({ expenses, taxRate });
}

function generateICS(): string {
  const now = new Date();
  const dtStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IncomeCalc//Monthly Check-In//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmtDate(dtStart)}`,
    `DTEND:${fmtDate(new Date(dtStart.getTime() + 30 * 60000))}`,
    "RRULE:FREQ=MONTHLY;BYMONTHDAY=1",
    "SUMMARY:IncomeCalc Monthly Check-In",
    "DESCRIPTION:Time to update your IncomeCalc numbers! Review expenses\\, check your fragility score\\, and adjust your plan.",
    `UID:incomecalc-checkin-${Date.now()}@incomecalc`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
  onLogoClick?: () => void;
  devOverride?: boolean;
  onDevAccess?: () => void;
  accountUser?: AuthUser | null;
  onSignIn?: () => void;
  onDashboard?: () => void;
  onDigestPreview?: () => void;
  onSignOut?: () => void;
}

function Header({ isDark, setIsDark, currentTheme, baseTheme, setTheme, onLogoClick, devOverride: devOverrideProp, onDevAccess, accountUser, onSignIn, onDashboard, onDigestPreview, onSignOut }: HeaderProps) {
  const t = applyDark(currentTheme, isDark);
  const [themeOpen, setThemeOpen] = useState(false);
  const showDevBadge = devOverrideProp ?? isDevOverrideActive();
  const badgeLabel = getDevBadgeLabel() ?? (showDevBadge ? "DEV: PREMIUM UNLOCKED" : null);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: "rgba(15,17,21,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 100,
        padding: "0 1.25rem",
        gap: "1rem",
      }}
    >
      <button
        onClick={onLogoClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          background: "transparent",
          border: "none",
          cursor: onLogoClick ? "pointer" : "default",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #5E5CE6, #8E44FF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.75rem",
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(94,92,230,0.3)",
          }}
        >
          IC
        </div>
        <span style={{ fontWeight: 600, fontSize: "1rem", color: "#FFFFFF", letterSpacing: "-0.01em" }}>IncomeCalc</span>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, position: "relative" }}>
        {badgeLabel && (
          <span
            style={{
              background: "#dc2626",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              letterSpacing: "0.03em",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {badgeLabel}
          </span>
        )}
        {/* Dev Access */}
        {onDevAccess && (
          <button
            onClick={onDevAccess}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "0.35rem 0.65rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "rgba(255,255,255,0.65)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              height: "36px",
              whiteSpace: "nowrap",
              transition: "background 0.2s ease",
            }}
            title="Developer Access"
          >
            <Zap size={12} />
            Dev
          </button>
        )}
        {/* Theme picker */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "0.35rem 0.65rem",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              height: "36px",
              minWidth: "36px",
              color: "#FFFFFF",
              transition: "background 0.2s ease",
            }}
            title="Change theme"
          >
            {currentTheme.icon}
          </button>
          {themeOpen && (
            <div
              style={{
                position: "absolute",
                top: "44px",
                right: 0,
                background: "rgba(20,20,30,0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                padding: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                zIndex: 200,
                minWidth: "150px",
              }}
            >
              {(Object.entries(THEMES) as [Theme, ThemeConfig][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setThemeOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "10px",
                    background: baseTheme === key ? "rgba(94,92,230,0.2)" : "transparent",
                    border: baseTheme === key ? "1px solid rgba(94,92,230,0.4)" : "1px solid transparent",
                    cursor: "pointer",
                    fontSize: "0.88rem",
                    color: "#FFFFFF",
                    fontWeight: baseTheme === key ? 600 : 400,
                    transition: "background 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "0.75rem" }}>{cfg.icon}</span>
                  <span>{cfg.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark mode */}
        <button
          onClick={() => setIsDark(!isDark)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "0.35rem 0.65rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "36px",
            minWidth: "36px",
            color: "rgba(255,255,255,0.65)",
            transition: "background 0.2s ease",
          }}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Account Menu */}
        {(onSignIn || accountUser) && (
          <AccountMenu
            user={accountUser ?? null}
            onSignIn={onSignIn ?? (() => {})}
            onDashboard={onDashboard ?? (() => {})}
            onDigestPreview={onDigestPreview ?? (() => {})}
            onSignOut={onSignOut ?? (() => {})}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

interface LandingProps {
  onStart: () => void;
  onPricing: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
  onDevAccess?: () => void;
}

function Landing({ onStart, onPricing, isDark, setIsDark, currentTheme, baseTheme, setTheme, onDevAccess }: LandingProps) {
  const t = applyDark(currentTheme, isDark);

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" }}>
      {/* Apple TV Ambient Background */}
      <div className="atv-ambient-bg">
        <div className="atv-ambient-teal" />
      </div>

      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onDevAccess={onDevAccess} />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "96px 1.5rem 4rem", position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <div className="atv-fade-in" style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(94,92,230,0.12)",
              border: "1px solid rgba(94,92,230,0.25)",
              borderRadius: "20px",
              padding: "0.4rem 1.1rem",
              fontSize: "0.85rem",
              color: "#8E8AFF",
              fontWeight: 600,
              marginBottom: "1.5rem",
              backdropFilter: "blur(8px)",
            }}
          >
            <Sparkles size={14} />
            Free Income Calculator · Now with AI
          </div>

          <h1
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: "#FFFFFF",
              margin: "0 0 1.25rem",
            }}
          >
            Know Exactly Where You Stand{" "}
            <span style={{
              background: "linear-gradient(135deg, #8E8AFF, #B78AFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Financially.</span>
          </h1>

          <p style={{ fontSize: "1.15rem", color: "rgba(255,255,255,0.55)", maxWidth: "660px", margin: "0 auto 2.5rem", lineHeight: 1.65 }}>
            IncomeCalc analyzes your income, expenses, tax impact, risk, and runway — and builds your financial stability plan in 60 seconds.
          </p>

          <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onStart}
              className="atv-btn-primary"
              style={{
                padding: "0.95rem 2.5rem",
                fontSize: "1.05rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Calculate My Income
              <ArrowRight size={18} />
            </button>
            <button
              onClick={onPricing}
              className="atv-btn-secondary"
              style={{
                padding: "0.95rem 2rem",
                fontSize: "1.05rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Star size={16} />
              View Pricing
            </button>
          </div>

          {/* Trust row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1.5rem",
              marginTop: "2.5rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: <Target size={14} />, text: "AI-generated financial action plan" },
              { icon: <BarChart3 size={14} />, text: "Cashflow & risk analysis" },
              { icon: <Shield size={14} />, text: "Planner-level insights without the $3,000 fee" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: 500,
                }}
              >
                <span style={{ color: "#5E5CE6", display: "flex", alignItems: "center" }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div
          className="atv-fade-in atv-fade-in-delay-1"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            marginBottom: "3rem",
          }}
        >
          {[
            { Icon: Calculator, title: "Smart Calculator", desc: "9 expense categories with real tax calculations" },
            { Icon: Brain, title: "AI Financial Advisor", desc: "Chat with AI about your finances — personalized to your numbers" },
            { Icon: Lightbulb, title: "AI Income Ideas", desc: "Get realistic side hustle ideas matched to your expense profile" },
            { Icon: Zap, title: "Instant Results", desc: "See your required income update in real time" },
          ].map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="atv-glass"
              style={{
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "rgba(94,92,230,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.75rem",
                  color: "#8E8AFF",
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: "0.35rem", color: "#FFFFFF", letterSpacing: "-0.01em" }}>{title}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* How Financially Stable Are You? */}
        <div className="atv-fade-in atv-fade-in-delay-2" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#FFFFFF", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            How Financially Stable Are You?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", margin: 0 }}>
            IncomeCalc measures what matters most.
          </p>
        </div>
        <div
          className="atv-fade-in atv-fade-in-delay-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          {[
            { Icon: Gauge, title: "Income Gap", desc: "See exactly how much more you need to earn — or how much surplus you have.", color: "#FF6B6B" },
            { Icon: Clock, title: "Runway", desc: "Know how many months you can survive without income.", color: "#FFB800" },
            { Icon: Shield, title: "Stability Score", desc: "A single score that measures your overall financial health.", color: "#34D399" },
            { Icon: AlertTriangle, title: "Alerts", desc: "Instant warnings when your housing, debt, or savings ratios are risky.", color: "#8E8AFF" },
          ].map(({ Icon, title, desc, color }) => (
            <div
              key={title}
              className="atv-glass"
              style={{
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: color + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.65rem",
                  color,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "#FFFFFF", fontSize: "0.95rem" }}>{title}</div>
              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Premium teaser */}
        <div
          className="atv-glass-static atv-fade-in atv-fade-in-delay-3"
          style={{
            padding: "2rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Gradient accent bar at top */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #5E5CE6, #8E44FF)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Star size={18} style={{ color: "#FFB800" }} />
            <span style={{ fontWeight: 600, color: "#FFFFFF", fontSize: "1.1rem", letterSpacing: "-0.01em" }}>Unlock Premium Features</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", marginBottom: "1.25rem" }}>
            Advanced analytics, AI recommendations, goal planning, PDF exports, and cloud sync.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "1.5rem" }}>
            {["AI Financial Advisor Chat", "AI Income Ideas", "Analytics Dashboard", "Goal Planning", "PDF Reports"].map((f) => (
              <span
                key={f}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "20px",
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
          <button
            onClick={onPricing}
            className="atv-btn-primary"
            style={{
              padding: "0.75rem 2rem",
              fontSize: "0.95rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CreditCard size={16} />
            See Plans & Pricing
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {onDevAccess && (
            <button
              onClick={onDevAccess}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.25)",
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Zap size={12} />
              Developer Access
            </button>
          )}
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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
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
  baseTheme,
  setTheme,
  initialData,
  initialTaxRate,
  initialCurrentIncome,
}: CalculatorPageProps) {
  const t = applyDark(currentTheme, isDark);

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
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" }}>
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

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "96px 1.5rem 4rem", position: "relative", zIndex: 1 }}>
        <div className="atv-fade-in" style={{ marginBottom: "2rem" }}>
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.45)",
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
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#FFFFFF", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            Monthly Expenses
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", margin: 0 }}>
            Enter your monthly spending in each category. Leave blank for categories that don't apply.
          </p>
        </div>

        {/* Tax rate estimation card */}
        <div
          className="atv-glass-static"
          style={{
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
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
                  fontSize: "0.88rem",
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
                  fontSize: "0.88rem",
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
                  fontSize: "0.88rem",
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
          className="atv-glass-static"
          style={{
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
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.9rem",
                display: "block",
                marginBottom: "0.15rem",
              }}
            >
              Current Gross Annual Income
            </Label>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>Optional — used for Income Gap analysis</span>
            <div style={{ position: "relative", marginTop: "0.35rem" }}>
              <span
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.35)",
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
                className="atv-glass-static"
                style={{
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
                    background: "rgba(94,92,230,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#8E8AFF",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label
                    style={{
                      color: "#FFFFFF",
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
                        color: "rgba(255,255,255,0.35)",
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
            className="atv-glass-static"
            style={{
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              borderTop: "3px solid",
              borderImage: "linear-gradient(90deg, #5E5CE6, #8E44FF) 1",
            }}
          >
            <div>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.2rem" }}>Monthly expenses</div>
              <div className="atv-number-glow" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#8E8AFF" }}>{fmt(total)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.2rem" }}>Gross income needed</div>
              <div className="atv-number-glow" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#FFFFFF" }}>{fmt(grossNeeded)}/mo</div>
            </div>
          </div>
        )}

        <button
          onClick={() => onResults(formData, effectiveTax, currentIncome)}
          disabled={total === 0}
          className={total === 0 ? "" : "atv-btn-primary"}
          style={{
            width: "100%",
            background: total === 0 ? "rgba(255,255,255,0.08)" : undefined,
            color: total === 0 ? "rgba(255,255,255,0.3)" : "#fff",
            border: "none",
            borderRadius: "14px",
            padding: "0.95rem",
            fontSize: "1.05rem",
            fontWeight: 600,
            cursor: total === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <BarChart3 size={18} />
          See My Results
        </button>
      </div>
    </div>
  );
}

// ─── AI Components ────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  data: ExpenseData;
  taxRate: number;
  grossAnnual: number;
  grossMonthly: number;
  totalMonthly: number;
  t: ThemeConfig;
  isDark: boolean;
  onClose: () => void;
}

function AIChat({ data, taxRate, grossAnnual, grossMonthly, totalMonthly, t, isDark, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm your AI Financial Advisor 👋\n\nI can see your monthly expenses total **${fmt(totalMonthly)}**, meaning you need to earn **${fmt(grossAnnual)}/year** gross at a ${taxRate}% tax rate.\n\nAsk me anything — how to boost income, cut costs, invest smarter, or find realistic side hustles based on your numbers.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const systemPrompt = `You are a friendly, expert financial advisor helping a user who has submitted their monthly expense data. Here are their exact numbers:
- Total monthly expenses: ${fmt(totalMonthly)}
- Required gross annual income: ${fmt(grossAnnual)}
- Required gross monthly income: ${fmt(grossMonthly)}
- Effective tax rate: ${taxRate}%
- Housing/Rent: ${fmt(data.housing)}/mo
- Food & Groceries: ${fmt(data.food)}/mo
- Transportation: ${fmt(data.transport)}/mo
- Healthcare: ${fmt(data.healthcare)}/mo
- Utilities & Internet: ${fmt(data.utilities)}/mo
- Entertainment: ${fmt(data.entertainment)}/mo
- Clothing & Personal: ${fmt(data.clothing)}/mo
- Savings & Investments: ${fmt(data.savings)}/mo
- Other Expenses: ${fmt(data.other)}/mo

Give personalized, actionable advice based on these real numbers. Be concise, warm, and specific. Use bullet points where helpful. If they ask about side hustles or income ideas, suggest realistic options with estimated income ranges. Always reference their actual numbers when relevant.`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...newMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "advisor", input: { messages: apiMessages } }),
      });
      const json = await res.json() as { reply?: string; error?: string };
      const reply = json.reply ?? json.error ?? "Sorry, I couldn't get a response. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — please try again." }]);
    }
    setLoading(false);
  }

  return (
    /* Full-screen backdrop */
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div
        style={{
          width: "min(860px, 100%)",
          height: "min(700px, calc(100vh - 2rem))",
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: `linear-gradient(135deg, ${t.primary}12, ${t.accent ?? t.primary}08)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${t.primary}, ${t.accent ?? t.primary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Brain size={20} style={{ color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>AI Financial Advisor</div>
              <div style={{ fontSize: "0.78rem", color: "#22c55e", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />
                Online · Powered by GPT-4.1
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDark ? "#ffffff18" : "#00000010",
              border: "none",
              cursor: "pointer",
              color: t.muted,
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close (Esc)"
          >
            <X size={22} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "0.6rem",
                alignItems: "flex-end",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${t.primary}, ${t.accent ?? t.primary})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginBottom: "2px",
                  }}
                >
                  <Brain size={13} style={{ color: "#fff" }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: "72%",
                  padding: "0.75rem 1rem",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? t.primary : isDark ? "#2a2a2f" : "#f4f4f5",
                  color: msg.role === "user" ? "#fff" : t.text,
                  fontSize: "0.92rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  boxShadow: msg.role === "user" ? `0 2px 12px ${t.primary}40` : "none",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", paddingLeft: "2.5rem" }}>
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: t.muted, animation: "pulse 1s infinite" }} />
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: t.muted, animation: "pulse 1s 0.2s infinite" }} />
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: t.muted, animation: "pulse 1s 0.4s infinite" }} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ padding: "0 1.5rem 0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["How can I earn more?", "Cut my biggest expense", "Best side hustles for me", "Create a savings plan", "How much should I invest?"].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              style={{
                background: t.primary + "15",
                border: `1px solid ${t.primary}30`,
                borderRadius: "14px",
                padding: "0.35rem 0.85rem",
                fontSize: "0.82rem",
                color: t.primary,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div
          style={{
            padding: "0.85rem 1.5rem 1rem",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            gap: "0.6rem",
            flexShrink: 0,
            alignItems: "center",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask anything about your finances..."
            autoFocus
            style={{
              flex: 1,
              background: isDark ? "#2a2a2f" : "#f4f4f5",
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "0.75rem 1rem",
              fontSize: "0.95rem",
              color: t.text,
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              background: t.primary,
              border: "none",
              borderRadius: "12px",
              width: "46px",
              height: "46px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              opacity: input.trim() && !loading ? 1 : 0.5,
              flexShrink: 0,
              boxShadow: `0 2px 12px ${t.primary}50`,
            }}
          >
            <Send size={18} style={{ color: "#fff" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Budget Insights ────────────────────────────────────────────────────────

interface AIBudgetInsightsProps {
  data: ExpenseData;
  taxRate: number;
  grossAnnual: number;
  grossMonthly: number;
  totalMonthly: number;
  t: ThemeConfig;
  isDark: boolean;
}

function AIBudgetInsights({ data, taxRate, grossAnnual, grossMonthly, totalMonthly, t, isDark }: AIBudgetInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateInsights() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "budgetInsights",
          input: {
            grossAnnual,
            taxRate,
            totalMonthly,
            housing: data.housing,
            food: data.food,
            transport: data.transport,
            healthcare: data.healthcare,
            utilities: data.utilities,
            entertainment: data.entertainment,
            clothing: data.clothing,
            savings: data.savings,
            other: data.other,
          },
        }),
      });
      const json = await res.json() as { insights?: string[]; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to generate insights.");
      } else {
        setInsights(json.insights ?? []);
        setGenerated(true);
      }
    } catch {
      setError("Network error — please try again.");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Brain size={18} style={{ color: t.primary }} />
          <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>AI Budget Insights</span>
        </div>
        {generated && (
          <button
            onClick={generateInsights}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "2px" }}
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {!generated && !loading && (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <p style={{ color: t.muted, fontSize: "0.9rem", marginBottom: "1rem" }}>
            Get personalized AI tips based on your exact expense breakdown.
          </p>
          <button
            onClick={generateInsights}
            style={{
              background: t.primary,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Sparkles size={15} />
            Generate My AI Insights
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "1.5rem 0", color: t.muted, fontSize: "0.9rem" }}>
          <Sparkles size={18} style={{ marginBottom: "0.5rem", color: t.primary }} />
          <div>Analyzing your finances...</div>
        </div>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.88rem", textAlign: "center", padding: "0.5rem 0", margin: 0 }}>
          {error}
        </p>
      )}

      {generated && !loading && insights.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {insights.map((tip, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
                padding: "0.65rem 0.85rem",
                background: t.primary + "10",
                borderRadius: "8px",
              }}
            >
              <Brain size={14} style={{ color: t.primary, flexShrink: 0, marginTop: "2px" }} />
              <span style={{ fontSize: "0.88rem", color: t.text, lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Income Ideas ───────────────────────────────────────────────────────────

interface AIIncomeIdeasProps {
  data: ExpenseData;
  grossAnnual: number;
  totalMonthly: number;
  t: ThemeConfig;
  isDark: boolean;
}

interface IncomeIdea {
  title: string;
  range: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

function AIIncomeIdeas({ data, grossAnnual, totalMonthly, t, isDark }: AIIncomeIdeasProps) {
  const [ideas, setIdeas] = useState<IncomeIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gap = Math.max(0, grossAnnual * 0.2);

  async function generateIdeas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "incomeIdeas",
          input: {
            grossAnnual,
            totalMonthly,
            gap,
            housing: data.housing,
            food: data.food,
            transport: data.transport,
          },
        }),
      });
      const json = await res.json() as { ideas?: IncomeIdea[]; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to generate ideas.");
      } else {
        setIdeas((json.ideas ?? []).slice(0, 4));
        setGenerated(true);
      }
    } catch {
      setError("Network error — please try again.");
    }
    setLoading(false);
  }

  const difficultyColor = (d: string) =>
    d === "Easy" ? "#22c55e" : d === "Medium" ? "#f59e0b" : "#ef4444";

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Lightbulb size={18} style={{ color: "#f59e0b" }} />
          <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>AI Income Ideas</span>
        </div>
        {generated && (
          <button
            onClick={generateIdeas}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "2px" }}
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>
      <p style={{ color: t.muted, fontSize: "0.85rem", marginBottom: "1rem" }}>
        Realistic ways to earn an extra{" "}
        <strong style={{ color: t.text }}>{fmt(Math.round(gap))}/year</strong> toward financial freedom.
      </p>

      {!generated && !loading && (
        <div style={{ textAlign: "center", padding: "0.75rem 0" }}>
          <button
            onClick={generateIdeas}
            style={{
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Lightbulb size={15} />
            Find My Income Ideas
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "1.5rem 0", color: t.muted, fontSize: "0.9rem" }}>
          <Lightbulb size={18} style={{ marginBottom: "0.5rem", color: "#f59e0b" }} />
          <div>Finding personalized income opportunities...</div>
        </div>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.88rem", textAlign: "center", padding: "0.5rem 0", margin: 0 }}>
          {error}
        </p>
      )}

      {generated && !loading && ideas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {ideas.map((idea, i) => (
            <div
              key={i}
              style={{
                padding: "0.9rem 1rem",
                background: isDark ? "#2a2a2f" : "#f9f9fb",
                borderRadius: "10px",
                border: `1px solid ${t.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>{idea.title}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.88rem" }}>{idea.range}</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: difficultyColor(idea.difficulty),
                      background: difficultyColor(idea.difficulty) + "15",
                      border: `1px solid ${difficultyColor(idea.difficulty)}40`,
                      borderRadius: "6px",
                      padding: "1px 6px",
                    }}
                  >
                    {idea.difficulty}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: "0.85rem", color: t.muted, lineHeight: 1.5 }}>{idea.description}</div>
            </div>
          ))}
          <p style={{ fontSize: "0.78rem", color: t.muted, textAlign: "center", margin: "0.25rem 0 0" }}>
            Chat with the AI Advisor below for deeper guidance on any idea.
          </p>
        </div>
      )}

      {generated && !loading && ideas.length === 0 && (
        <p style={{ color: t.muted, fontSize: "0.9rem", textAlign: "center" }}>
          Couldn't generate ideas — try again.
        </p>
      )}
    </div>
  );
}

// ─── Results Page ─────────────────────────────────────────────────────────────

interface ResultsPageProps {
  data: ExpenseData;
  taxRate: number;
  currentGrossIncome: number;
  onBack: () => void;
  onRecalculate: () => void;
  onUpgrade: (plan?: PlanId) => void;
  onSimulator: () => void;
  onCheckIn: () => void;
  onFire: () => void;
  onForecast: () => void;
  onDebt: () => void;
  onFI: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
  userTier: UserTier;
  onDevAccess?: () => void;
  onSaveScenario?: () => void;
  onDashboard?: () => void;
  currentUser?: AuthUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onDigestPreview?: () => void;
}

function ResultsPage({
  data,
  taxRate,
  currentGrossIncome,
  onBack,
  onRecalculate,
  onUpgrade,
  onSimulator,
  onCheckIn,
  onFire,
  onForecast,
  onDebt,
  onFI,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
  userTier,
  onDevAccess,
  onSaveScenario,
  onDashboard,
  currentUser,
  onSignIn,
  onSignOut,
  onDigestPreview,
}: ResultsPageProps) {
  const t = applyDark(currentTheme, isDark);
  const [chatOpen, setChatOpen] = useState(false);
  const [askPlanOpen, setAskPlanOpen] = useState(false);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState<string | null>(null);

  // Use shared calculation engine
  const outputs = computeForExpenses(data, taxRate);
  const totalMonthly = outputs.monthlyExpensesTotal;
  const grossMonthly = outputs.grossMonthlyRequired;
  const grossAnnual = outputs.annualGrossRequired;
  const taxMonthly = outputs.taxMonthly;
  const hourlyRate = outputs.hourlyRequired;

  const savingsRate = totalMonthly > 0 ? (data.savings / totalMonthly) * 100 : 0;

  // Stability metrics
  const incomeGap = computeIncomeGap(grossAnnual, currentGrossIncome);
  const runway = computeRunway(outputs.emergencyFundTarget, totalMonthly);
  const alerts = computeAlerts(outputs, runway.months, data.savings);

  // Analytics: results_viewed
  const resultsTracked = useRef(false);
  useEffect(() => {
    if (!resultsTracked.current && totalMonthly > 0) {
      trackEvent("results_viewed", { source_page: "/results" });
      resultsTracked.current = true;
    }
  }, [totalMonthly]);

  // Sub-scores from shared engine
  const { cashflowStability, debtRisk, savingsStrength, incomeFragility } = outputs.subScores;
  const healthScore = outputs.healthScore;
  const healthLabel = outputs.healthLabel;
  const healthColor =
    healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#84cc16" : healthScore >= 40 ? "#f59e0b" : "#ef4444";

  const housingPct = grossMonthly > 0 ? (data.housing / grossMonthly) * 100 : 0;

  const subScores = [
    { label: "Cashflow Stability", value: cashflowStability, color: cashflowStability >= 60 ? "#22c55e" : cashflowStability >= 40 ? "#f59e0b" : "#ef4444" },
    { label: "Debt Risk", value: debtRisk, color: debtRisk >= 60 ? "#22c55e" : debtRisk >= 40 ? "#f59e0b" : "#ef4444" },
    { label: "Savings Strength", value: savingsStrength, color: savingsStrength >= 60 ? "#22c55e" : savingsStrength >= 40 ? "#f59e0b" : "#ef4444" },
    { label: "Income Fragility", value: incomeFragility, color: incomeFragility >= 60 ? "#22c55e" : incomeFragility >= 40 ? "#f59e0b" : "#ef4444" },
  ];

  // Snapshots for check-in display
  const snapshots = loadSnapshots();

  const breakdownItems = EXPENSE_FIELDS.map((f) => ({
    label: f.label,
    Icon: f.icon,
    value: data[f.name],
    pct: totalMonthly > 0 ? (data[f.name] / totalMonthly) * 100 : 0,
  }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" }}>
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
        onDevAccess={onDevAccess}
        accountUser={currentUser}
        onSignIn={onSignIn}
        onDashboard={onDashboard}
        onDigestPreview={onDigestPreview}
        onSignOut={onSignOut}
      />

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "96px 1.5rem 4rem", position: "relative", zIndex: 1 }}>
        <div className="atv-fade-in" style={{ marginBottom: "2rem" }}>
          <button
            onClick={onRecalculate}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.9rem",
              padding: 0,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            ← Edit expenses
          </button>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#FFFFFF", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
            Your Income Report
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", margin: 0 }}>
            Based on {fmt(totalMonthly)}/mo in expenses at a {taxRate}% effective tax rate.
          </p>
        </div>

        {/* Hero card — Glass with gradient accent bar */}
        <div
          className="atv-glass-static atv-fade-in"
          style={{
            padding: "2rem",
            marginBottom: "1.25rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Gradient accent bar at top */}
          <div className="atv-accent-bar" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", marginBottom: "0.5rem" }}>
            You need to earn at least
          </div>
          <div className="atv-number-glow" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 700, lineHeight: 1.1, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
            {fmt(grossAnnual)}
          </div>
          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>per year</div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Monthly gross", value: fmt(grossMonthly) },
              { label: "Hourly rate", value: `${fmt(hourlyRate)}/hr` },
              { label: "Monthly taxes", value: fmt(taxMonthly) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>{label}</div>
                <div className="atv-number-glow" style={{ fontWeight: 600, fontSize: "1.1rem", color: "#FFFFFF" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Income split */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            { label: "Gross Income", value: grossMonthly, sub: "Before taxes", color: t.primary },
            { label: "Taxes Paid", value: taxMonthly, sub: `${taxRate}% effective rate`, color: "#ef4444" },
            { label: "Net Take-Home", value: totalMonthly, sub: "After taxes", color: "#22c55e" },
          ].map(({ label, value, sub, color }) => (
            <div
              key={label}
              style={{
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: "12px",
                padding: "1.25rem",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: t.muted, marginBottom: "0.35rem" }}>{sub}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{fmt(value)}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: t.text }}>{label}/mo</div>
            </div>
          ))}
        </div>

        {/* Health score 2.0 */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Financial Health Score</span>
            <span style={{ fontWeight: 700, color: healthColor, fontSize: "1.1rem" }}>
              {healthScore}/100 — {healthLabel}
            </span>
          </div>
          <Progress value={healthScore} className="h-3" />

          {/* Sub-scores */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.25rem" }}>
            {subScores.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.82rem", color: t.text, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: s.color }}>{s.value}/100</span>
                </div>
                <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${s.value}%`,
                      background: s.color,
                      borderRadius: "3px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: t.muted, fontSize: "0.85rem", margin: "1rem 0 0" }}>
            Weighted overall score based on cashflow, debt, savings, and income resilience.
            {savingsRate < 20 && " Aim for at least 20% savings for a healthy financial foundation."}
            {savingsRate >= 20 && savingsRate < 30 && " Great work! Consider pushing toward 30% for faster wealth building."}
            {savingsRate >= 30 && " Excellent savings discipline! You're on a strong financial path."}
          </p>
        </div>

        {/* Income Gap Meter */}
        {currentGrossIncome > 0 && (
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Gauge size={18} style={{ color: incomeGap.hasGap ? "#ef4444" : "#22c55e" }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Income Gap</span>
            </div>

            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: incomeGap.hasGap ? "#ef4444" : "#22c55e",
                marginBottom: "0.5rem",
              }}
            >
              {incomeGap.hasGap
                ? `You are short ${fmt(Math.abs(incomeGap.gapMonthly))}/month`
                : `You have ${fmt(Math.abs(incomeGap.gapMonthly))}/month surplus`}
            </div>

            {/* Horizontal meter */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: t.muted, marginBottom: "0.3rem" }}>
                <span>Current: {fmt(incomeGap.currentMonthly)}/mo</span>
                <span>Required: {fmt(incomeGap.requiredMonthly)}/mo</span>
              </div>
              <div style={{ height: "12px", background: t.border, borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                {(() => {
                  const maxVal = Math.max(incomeGap.currentMonthly, incomeGap.requiredMonthly, 1);
                  const currentPct = Math.min(100, (incomeGap.currentMonthly / maxVal) * 100);
                  const requiredPct = Math.min(100, (incomeGap.requiredMonthly / maxVal) * 100);
                  return (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: "100%",
                          width: `${requiredPct}%`,
                          background: "#ef444440",
                          borderRadius: "6px",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: "100%",
                          width: `${currentPct}%`,
                          background: incomeGap.hasGap ? "#f59e0b" : "#22c55e",
                          borderRadius: "6px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </>
                  );
                })()}
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: t.muted }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: incomeGap.hasGap ? "#f59e0b" : "#22c55e" }} />
                  Current Income
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: t.muted }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#ef444440" }} />
                  Required Income
                </div>
              </div>
            </div>

            {incomeGap.hasGap && (
              <button
                onClick={onSimulator}
                style={{
                  background: t.primary + "15",
                  color: t.primary,
                  border: `1px solid ${t.primary}30`,
                  borderRadius: "8px",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <ArrowRight size={14} />
                Close Gap with Scenarios
              </button>
            )}
          </div>
        )}

        {/* Financial Runway Tracker */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Clock size={18} style={{ color: runway.level === "Strong" ? "#22c55e" : runway.level === "Stable" ? "#84cc16" : runway.level === "Fragile" ? "#f59e0b" : "#ef4444" }} />
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Financial Runway</span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                background:
                  runway.level === "Strong" ? "#22c55e15" :
                  runway.level === "Stable" ? "#84cc1615" :
                  runway.level === "Fragile" ? "#f59e0b15" : "#ef444415",
                color:
                  runway.level === "Strong" ? "#22c55e" :
                  runway.level === "Stable" ? "#84cc16" :
                  runway.level === "Fragile" ? "#f59e0b" : "#ef4444",
                border: `1px solid ${
                  runway.level === "Strong" ? "#22c55e40" :
                  runway.level === "Stable" ? "#84cc1640" :
                  runway.level === "Fragile" ? "#f59e0b40" : "#ef444440"
                }`,
              }}
            >
              {runway.level}
            </span>
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color:
                runway.level === "Strong" ? "#22c55e" :
                runway.level === "Stable" ? "#84cc16" :
                runway.level === "Fragile" ? "#f59e0b" : "#ef4444",
              marginBottom: "0.35rem",
            }}
          >
            {runway.months.toFixed(1)} months
          </div>
          <p style={{ color: t.muted, fontSize: "0.88rem", margin: 0 }}>
            {runway.label}
          </p>
        </div>

        {/* Financial Alerts */}
        {alerts.length > 0 && (
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>
                {alerts.length} Active Alert{alerts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {alerts.map((alert) => (
                <div key={alert.id}>
                  <button
                    onClick={() => setAlertsExpanded(alertsExpanded === alert.id ? null : alert.id)}
                    style={{
                      width: "100%",
                      background: alert.severity === "critical" ? "#ef444410" : "#f59e0b10",
                      border: `1px solid ${alert.severity === "critical" ? "#ef444430" : "#f59e0b30"}`,
                      borderRadius: alertsExpanded === alert.id ? "8px 8px 0 0" : "8px",
                      padding: "0.65rem 0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <AlertTriangle size={14} style={{ color: alert.severity === "critical" ? "#ef4444" : "#f59e0b", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: t.text }}>{alert.title}</span>
                    </div>
                    {alertsExpanded === alert.id ? <ChevronUp size={14} style={{ color: t.muted }} /> : <ChevronDown size={14} style={{ color: t.muted }} />}
                  </button>
                  {alertsExpanded === alert.id && (
                    <div
                      style={{
                        background: alert.severity === "critical" ? "#ef444408" : "#f59e0b08",
                        border: `1px solid ${alert.severity === "critical" ? "#ef444430" : "#f59e0b30"}`,
                        borderTop: "none",
                        borderRadius: "0 0 8px 8px",
                        padding: "0.75rem 0.85rem",
                      }}
                    >
                      <p style={{ fontSize: "0.85rem", color: t.muted, lineHeight: 1.6, margin: 0 }}>
                        {alert.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Stability Score + FIRE CTA row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <button
            onClick={() => setShareCardOpen(true)}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.25rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Share2 size={16} style={{ color: t.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>Share My Score</span>
            </div>
            <p style={{ color: t.muted, fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
              Generate a branded stability card to download and share.
            </p>
          </button>
          <button
            onClick={onFire}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.25rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Flame size={16} style={{ color: "#f59e0b" }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>FIRE Estimator</span>
            </div>
            <p style={{ color: t.muted, fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
              Project your retirement countdown and target balance.
            </p>
          </button>
        </div>

        {/* New Feature Nav: Forecast, Debt, FI */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <button
            onClick={onForecast}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
              <TrendingUp size={14} style={{ color: currentTheme.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.82rem" }}>12-Mo Forecast</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.65rem", background: "#f59e0b20", color: "#f59e0b", borderRadius: "4px", padding: "0 4px", fontWeight: 600, border: "1px solid #f59e0b40" }}>Premium</span>
            </div>
          </button>
          <button
            onClick={onDebt}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
              <Wallet size={14} style={{ color: "#ef4444" }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.82rem" }}>Debt Payoff</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.65rem", background: currentTheme.primary + "20", color: currentTheme.primary, borderRadius: "4px", padding: "0 4px", fontWeight: 600, border: `1px solid ${currentTheme.primary}40` }}>Pro+</span>
            </div>
          </button>
          <button
            onClick={onFI}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
              <Milestone size={14} style={{ color: "#8b5cf6" }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.82rem" }}>FI Date</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.65rem", background: "#f59e0b20", color: "#f59e0b", borderRadius: "4px", padding: "0 4px", fontWeight: 600, border: "1px solid #f59e0b40" }}>Premium</span>
            </div>
          </button>
        </div>

        {/* Share Card Modal */}
        {shareCardOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShareCardOpen(false); }}
          >
            <div style={{ width: "min(420px, 100%)", background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "20px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
              {/* Share card header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontWeight: 700, color: t.text }}>Your Stability Card</span>
                <button onClick={() => setShareCardOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}>
                  <X size={18} />
                </button>
              </div>

              {/* The card itself */}
              <div id="stability-share-card" style={{ padding: "1.5rem", background: `linear-gradient(135deg, ${currentTheme.primary}12, ${currentTheme.accent}08)` }}>
                <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: currentTheme.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.5rem" }}>IC</div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: t.text }}>Financial Stability Report</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Stability Score */}
                  <div style={{ background: t.cardBg, borderRadius: "12px", padding: "1rem", textAlign: "center", border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: "0.78rem", color: t.muted, marginBottom: "0.25rem" }}>Stability Score</div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 900, color: healthColor }}>{healthScore}</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: healthColor }}>{healthLabel}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {/* Runway */}
                    <div style={{ background: t.cardBg, borderRadius: "10px", padding: "0.85rem", textAlign: "center", border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: "0.72rem", color: t.muted, marginBottom: "0.2rem" }}>Runway</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: runway.level === "Strong" ? "#22c55e" : runway.level === "Stable" ? "#84cc16" : runway.level === "Fragile" ? "#f59e0b" : "#ef4444" }}>
                        {runway.months.toFixed(1)}mo
                      </div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: t.muted }}>{runway.level}</div>
                    </div>

                    {/* Income Gap */}
                    <div style={{ background: t.cardBg, borderRadius: "10px", padding: "0.85rem", textAlign: "center", border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: "0.72rem", color: t.muted, marginBottom: "0.2rem" }}>Income Gap</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: currentGrossIncome > 0 ? (incomeGap.hasGap ? "#ef4444" : "#22c55e") : t.muted }}>
                        {currentGrossIncome > 0 ? (incomeGap.hasGap ? `-${fmt(Math.abs(incomeGap.gapMonthly))}` : `+${fmt(Math.abs(incomeGap.gapMonthly))}`) : "N/A"}
                      </div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: t.muted }}>{currentGrossIncome > 0 ? (incomeGap.hasGap ? "Shortfall/mo" : "Surplus/mo") : "Not set"}</div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.72rem", color: t.muted }}>
                  incomeCalc.ai
                </div>
              </div>

              {/* Download button */}
              <div style={{ padding: "1rem 1.25rem", borderTop: `1px solid ${t.border}` }}>
                <button
                  onClick={() => {
                    const card = document.getElementById("stability-share-card");
                    if (!card) return;
                    // Use canvas-based export
                    const canvas = document.createElement("canvas");
                    const scale = 2;
                    canvas.width = card.offsetWidth * scale;
                    canvas.height = card.offsetHeight * scale;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    ctx.scale(scale, scale);
                    // Draw background
                    ctx.fillStyle = isDark ? "#1a1a1f" : "#ffffff";
                    ctx.fillRect(0, 0, card.offsetWidth, card.offsetHeight);
                    // Use SVG foreignObject approach
                    const data2 = new XMLSerializer().serializeToString(card);
                    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${card.offsetWidth}" height="${card.offsetHeight}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${data2}</div></foreignObject></svg>`;
                    const img = new Image();
                    img.onload = () => {
                      ctx.drawImage(img, 0, 0);
                      const link = document.createElement("a");
                      link.download = "stability-score.png";
                      link.href = canvas.toDataURL("image/png");
                      link.click();
                    };
                    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
                  }}
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
                  <Download size={16} />
                  Download as Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expense breakdown */}
        {breakdownItems.length > 0 && (
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ fontWeight: 700, color: t.text, marginBottom: "1rem", fontSize: "1.05rem" }}>
              Expense Breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {breakdownItems.map(({ label, Icon, value, pct }) => (
                <div key={label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Icon size={14} style={{ color: t.primary }} />
                      <span style={{ fontSize: "0.9rem", color: t.text }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: t.muted }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>{fmt(value)}</span>
                    </div>
                  </div>
                  <div style={{ height: "6px", background: t.border, borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: t.primary,
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live AI Budget Insights */}
        <AIBudgetInsights
          data={data}
          taxRate={taxRate}
          grossAnnual={grossAnnual}
          grossMonthly={grossMonthly}
          totalMonthly={totalMonthly}
          t={t}
          isDark={isDark}
        />

        {/* Live AI Income Ideas */}
        <AIIncomeIdeas
          data={data}
          grossAnnual={grossAnnual}
          totalMonthly={totalMonthly}
          t={t}
          isDark={isDark}
        />

        {/* Export block - unlocked for Pro+ */}
        {(userTier === "pro" || userTier === "premium") ? (
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
              Export & Share
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  const header = "Category,Monthly Amount,% of Total\n";
                  const rows = breakdownItems.map((item) => `"${item.label}",${item.value.toFixed(2)},${item.pct.toFixed(1)}%`).join("\n");
                  const summary = `\nSummary\nTotal Monthly Expenses,${totalMonthly.toFixed(2)}\nGross Monthly Required,${grossMonthly.toFixed(2)}\nGross Annual Required,${grossAnnual.toFixed(2)}\nTax Rate,${taxRate}%\nHourly Rate Required,${hourlyRate.toFixed(2)}\nSavings Rate,${savingsRate.toFixed(1)}%\nHealth Score,${healthScore}/100\n`;
                  const blob = new Blob([header + rows + summary], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `incomecalc-report-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: "0.6rem 1rem",
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  color: t.text,
                  background: t.bg,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={() => {
                  const lines = [
                    "INCOMECALC REPORT",
                    `Generated: ${new Date().toLocaleDateString()}`,
                    "",
                    "EXPENSE BREAKDOWN",
                    ...breakdownItems.map((item) => `  ${item.label}: ${fmt(item.value)} (${item.pct.toFixed(1)}%)`),
                    "",
                    "SUMMARY",
                    `  Total Monthly Expenses: ${fmt(totalMonthly)}`,
                    `  Gross Monthly Required: ${fmt(grossMonthly)}`,
                    `  Gross Annual Required: ${fmt(grossAnnual)}`,
                    `  Tax Rate: ${taxRate}%`,
                    `  Hourly Rate Required: ${fmt(hourlyRate)}`,
                    `  Savings Rate: ${savingsRate.toFixed(1)}%`,
                    `  Financial Health Score: ${healthScore}/100 (${healthLabel})`,
                  ];
                  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `incomecalc-report-${new Date().toISOString().slice(0, 10)}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: "0.6rem 1rem",
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  color: t.text,
                  background: t.bg,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <FileText size={14} /> Download Report
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: t.cardBg,
              border: `1.5px dashed ${t.primary}50`,
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ filter: "blur(4px)", pointerEvents: "none" }}>
              <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
                Export & Share
              </div>
              <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                {["Download PDF Report", "Export to CSV", "Share to Google Sheets"].map((btn) => (
                  <div
                    key={btn}
                    style={{
                      padding: "0.6rem 1rem",
                      border: `1px solid ${t.border}`,
                      borderRadius: "8px",
                      fontSize: "0.9rem",
                      color: t.text,
                      background: t.bg,
                    }}
                  >
                    {btn}
                  </div>
                ))}
              </div>
            </div>
            <div
              className="atv-locked-overlay"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.65rem",
                borderRadius: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} className="atv-lock-icon-glow" />
                <span style={{ fontWeight: 600, color: "#FFFFFF" }}>Export features require Pro</span>
              </div>
              <button
                onClick={() => onUpgrade("pro")}
                className="atv-btn-primary"
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.88rem",
                }}
              >
                See Pro Plan &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Savings Potential - unlocked for Premium */}
        {userTier === "premium" ? (() => {
          const sortedExpenses = EXPENSE_FIELDS.map((f) => ({ key: f.name, label: f.label, value: data[f.name] }))
            .filter((e) => e.value > 0 && e.key !== "savings")
            .sort((a, b) => b.value - a.value);
          const top3 = sortedExpenses.slice(0, 3);
          const reductionPct = 15;
          const totalSavings = top3.reduce((sum, e) => sum + e.value * (reductionPct / 100), 0);
          return (
            <div
              style={{
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <TrendingUp size={18} style={{ color: "#22c55e" }} />
                <div style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Savings Potential Analysis</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                {top3.map(({ label, value }) => {
                  const saving = Math.round(value * (reductionPct / 100));
                  return (
                    <div key={label} style={{ padding: "0.65rem 0.85rem", background: t.primary + "10", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: t.muted, marginBottom: "0.2rem" }}>{label}</div>
                      <div style={{ fontSize: "0.85rem", color: t.text, marginBottom: "0.15rem" }}>Current: {fmt(value)}/mo</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#22c55e" }}>Save {fmt(saving)}/mo ({reductionPct}% cut)</div>
                    </div>
                  );
                })}
                <div style={{ padding: "0.65rem 0.85rem", background: "#22c55e15", borderRadius: "8px", border: "1px solid #22c55e30" }}>
                  <div style={{ fontSize: "0.75rem", color: t.muted, marginBottom: "0.2rem" }}>Total Annual Savings</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#22c55e" }}>{fmt(Math.round(totalSavings * 12))}/year</div>
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: t.muted, lineHeight: 1.5, padding: "0.75rem", background: t.bg, borderRadius: "8px", border: `1px solid ${t.border}` }}>
                <strong>How to save:</strong> Reducing your top 3 spending categories by {reductionPct}% could free up <strong style={{ color: "#22c55e" }}>{fmt(Math.round(totalSavings))}/mo</strong>.
                {data.housing > grossMonthly * 0.3 && " Your housing exceeds 30% of gross income — consider downsizing or negotiating rent."}
                {data.entertainment > totalMonthly * 0.1 && " Entertainment is above 10% of spending — look for free alternatives."}
                {data.food > grossMonthly * 0.15 && " Food costs are high — meal planning could cut this by 20-30%."}
              </div>
            </div>
          );
        })() : (
          <div
            style={{
              background: t.cardBg,
              border: `1.5px dashed ${t.primary}50`,
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ filter: "blur(5px)", pointerEvents: "none" }}>
              <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
                Savings Potential Analysis
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  { label: "Optimized housing", saving: fmt(Math.round(grossMonthly * 0.04)) + "/mo" },
                  { label: "Transport savings", saving: fmt(Math.round(grossMonthly * 0.02)) + "/mo" },
                  { label: "Retirement boost", saving: `+${Math.round(savingsRate * 1.4).toFixed(1)}% rate` },
                  { label: "Annual extra saved", saving: fmt(Math.round(grossAnnual * 0.06)) },
                ].map(({ label, saving }) => (
                  <div key={label} style={{ padding: "0.65rem 0.85rem", background: t.primary + "10", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", color: t.muted, marginBottom: "0.2rem" }}>{label}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#22c55e" }}>{saving}</div>
                  </div>
                ))}
              </div>
            </div>
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
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(94,92,230,0.15)",
                  border: "2px solid rgba(94,92,230,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={20} className="atv-lock-icon-glow" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, color: "#FFFFFF", marginBottom: "0.25rem" }}>Savings Potential</div>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>
                  See exactly where you could save{" "}
                  <span style={{ color: "#8E8AFF", fontWeight: 700 }}>
                    {fmt(Math.round(grossAnnual * 0.06))}+/year
                  </span>
                </div>
              </div>
              <button
                onClick={() => onUpgrade("premium")}
                className="atv-btn-primary"
                style={{
                  padding: "0.55rem 1.25rem",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <TrendingUp size={14} />
                Unlock Savings Analysis
              </button>
            </div>
          </div>
        )}

        {/* 12-Month Cashflow Forecast - unlocked for Premium */}
        {userTier === "premium" ? (() => {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const startMonth = new Date().getMonth();
          const incomePerMonth = grossMonthly;
          const expensePerMonth = totalMonthly;
          const forecastData = Array.from({ length: 12 }, (_, i) => {
            const monthIdx = (startMonth + i) % 12;
            const net = incomePerMonth - expensePerMonth;
            return {
              label: monthNames[monthIdx],
              income: Math.round(incomePerMonth),
              expenses: Math.round(expensePerMonth),
              net: Math.round(net),
              cumulative: Math.round(net * (i + 1)),
            };
          });
          const maxVal = Math.max(...forecastData.map((d) => Math.max(d.income, d.expenses)), 1);
          return (
            <div
              style={{
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <BarChart3 size={18} style={{ color: t.primary }} />
                <div style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>12-Month Cashflow Forecast</div>
              </div>
              {/* Bar chart */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px", marginBottom: "0.5rem" }}>
                {forecastData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", gap: "2px", alignItems: "flex-end", height: "100%" }}>
                    <div style={{ flex: 1, height: `${(d.income / maxVal) * 100}%`, background: "#22c55e80", borderRadius: "2px 2px 0 0", minHeight: "4px" }} />
                    <div style={{ flex: 1, height: `${(d.expenses / maxVal) * 100}%`, background: t.primary + "60", borderRadius: "2px 2px 0 0", minHeight: "4px" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                {forecastData.map((d, i) => (
                  <span key={i} style={{ fontSize: "0.6rem", color: t.muted, flex: 1, textAlign: "center" }}>{d.label}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: t.muted }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#22c55e80" }} /> Income
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: t.muted }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: t.primary + "60" }} /> Expenses
                </div>
              </div>
              {/* Summary table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600 }}>Month</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600 }}>Income</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600 }}>Expenses</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600 }}>Net</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600 }}>Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${t.border}20` }}>
                        <td style={{ padding: "0.3rem 0.5rem", color: t.text, fontWeight: 600 }}>{d.label}</td>
                        <td style={{ padding: "0.3rem 0.5rem", textAlign: "right", color: "#22c55e" }}>{fmt(d.income)}</td>
                        <td style={{ padding: "0.3rem 0.5rem", textAlign: "right", color: t.text }}>{fmt(d.expenses)}</td>
                        <td style={{ padding: "0.3rem 0.5rem", textAlign: "right", color: d.net >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{d.net >= 0 ? "+" : ""}{fmt(d.net)}</td>
                        <td style={{ padding: "0.3rem 0.5rem", textAlign: "right", color: d.cumulative >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{d.cumulative >= 0 ? "+" : ""}{fmt(d.cumulative)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })() : (
          <div
            style={{
              background: t.cardBg,
              border: `1.5px dashed ${t.primary}50`,
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ filter: "blur(5px)", pointerEvents: "none" }}>
              <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
                12-Month Cashflow Forecast
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "100px" }}>
                {[
                  { income: 85, expense: 72 },
                  { income: 87, expense: 74 },
                  { income: 86, expense: 71 },
                  { income: 90, expense: 76 },
                  { income: 88, expense: 73 },
                  { income: 92, expense: 78 },
                  { income: 91, expense: 75 },
                  { income: 94, expense: 77 },
                  { income: 93, expense: 74 },
                  { income: 96, expense: 79 },
                  { income: 95, expense: 76 },
                  { income: 98, expense: 80 },
                ].map((m, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", gap: "2px", alignItems: "flex-end", height: "100%" }}>
                    <div style={{ flex: 1, height: `${m.income}%`, background: "#22c55e80", borderRadius: "2px 2px 0 0" }} />
                    <div style={{ flex: 1, height: `${m.expense}%`, background: t.primary + "60", borderRadius: "2px 2px 0 0" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
                <span style={{ fontSize: "0.7rem", color: t.muted }}>Jan</span>
                <span style={{ fontSize: "0.7rem", color: t.muted }}>Jun</span>
                <span style={{ fontSize: "0.7rem", color: t.muted }}>Dec</span>
              </div>
            </div>
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
                borderRadius: "20px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(94,92,230,0.15)",
                  border: "2px solid rgba(94,92,230,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={20} className="atv-lock-icon-glow" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, color: "#FFFFFF", marginBottom: "0.25rem" }}>12-Month Cashflow Forecast</div>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>Projected monthly income vs expenses — Premium only</div>
              </div>
              <button
                onClick={() => onUpgrade("premium")}
                className="atv-btn-primary"
                style={{
                  padding: "0.55rem 1.25rem",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Lock size={14} />
                Unlock Forecasting
              </button>
            </div>
          </div>
        )}

        {/* AI Action Plan */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Target size={18} style={{ color: t.primary }} />
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Your AI Financial Plan</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {(() => {
              const steps: string[] = [];
              const netAfterSavings = totalMonthly - data.savings;
              const emergencyMonths = netAfterSavings > 0 ? data.savings / netAfterSavings : 0;

              if (savingsRate < 10) {
                steps.push("Increase your savings rate to at least 10% of net income. You're currently at " + savingsRate.toFixed(1) + "%.");
              }
              if (housingPct > 40) {
                steps.push("Housing imbalance detected — your rent/housing is " + housingPct.toFixed(0) + "% of gross income. Target under 30% for stability.");
              }
              if (data.other > 0) {
                steps.push("Consider an accelerated payoff plan for miscellaneous debt/expenses (" + fmt(data.other) + "/mo). Redirect freed-up cash to savings.");
              }
              if (emergencyMonths < 3) {
                steps.push("Build an emergency fund covering at least 3 months of expenses. You're currently at " + emergencyMonths.toFixed(1) + " months.");
              }
              // Fill up to 5 steps with general advice
              if (steps.length < 5) {
                if (savingsRate >= 10 && savingsRate < 20) {
                  steps.push("Push your savings rate toward 20% to accelerate wealth building. Consider automating transfers.");
                }
              }
              if (steps.length < 5) {
                if (data.entertainment > totalMonthly * 0.1) {
                  steps.push("Entertainment spending is " + ((data.entertainment / totalMonthly) * 100).toFixed(0) + "% of expenses — review for potential reductions.");
                }
              }
              if (steps.length < 5) {
                steps.push("Review and optimize your tax withholdings to ensure you're not over-paying throughout the year.");
              }
              if (steps.length < 5) {
                steps.push("Set up automatic investment contributions to grow wealth consistently over time.");
              }

              steps.push("Recalculate quarterly to stay on track.");

              return steps.slice(0, 6).map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.7rem 0.85rem",
                    background: i === steps.slice(0, 6).length - 1 ? t.primary + "10" : (isDark ? "#2a2a2f" : "#f9f9fb"),
                    borderRadius: "8px",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: i === steps.slice(0, 6).length - 1 ? t.primary : t.primary + "20",
                      color: i === steps.slice(0, 6).length - 1 ? "#fff" : t.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {i === steps.slice(0, 6).length - 1 ? <RefreshCw size={12} /> : i + 1}
                  </div>
                  <span style={{ fontSize: "0.88rem", color: t.text, lineHeight: 1.5 }}>{step}</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Premium upsell */}
        <div
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}12, ${currentTheme.accent}08)`,
            border: `1px solid ${currentTheme.primary}30`,
            borderRadius: "16px",
            padding: "1.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <Star size={16} style={{ color: "#f59e0b" }} />
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Upgrade Your Plan</span>
          </div>
          <p style={{ color: t.muted, fontSize: "0.9rem", margin: "0 0 1.25rem" }}>
            Unlock AI insights, goal planning, PDF exports, cloud sync and more.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Pro card */}
            <div
              style={{
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                flex: 1,
                minWidth: "130px",
              }}
            >
              <div style={{ fontWeight: 700, color: t.text, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Pro</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: t.primary }}>
                $4.99<span style={{ fontSize: "0.75rem", fontWeight: 400, color: t.muted }}>/mo</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: t.muted, marginBottom: "0.75rem" }}>or $49/year</div>
              <button
                onClick={() => onUpgrade("pro")}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: t.primary,
                  border: `1.5px solid ${t.primary}`,
                  borderRadius: "7px",
                  padding: "0.45rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Get Pro
              </button>
            </div>

            {/* Premium card */}
            <div
              style={{
                background: currentTheme.primary,
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                flex: 1,
                minWidth: "130px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>Premium</span>
                <span style={{ fontSize: "0.65rem", background: "#f59e0b", color: "#000", borderRadius: "4px", padding: "0 5px", fontWeight: 700 }}>
                  POPULAR
                </span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
                $9.99<span style={{ fontSize: "0.75rem", fontWeight: 400, opacity: 0.75 }}>/mo</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#fff", opacity: 0.75, marginBottom: "0.75rem" }}>or $99/year</div>
              <button
                onClick={() => onUpgrade("premium")}
                style={{
                  width: "100%",
                  background: "#fff",
                  color: currentTheme.primary,
                  border: "none",
                  borderRadius: "7px",
                  padding: "0.45rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Get Premium
              </button>
            </div>
          </div>
        </div>

        {/* Ask Your Plan panel */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageCircle size={18} style={{ color: t.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Ask Your Plan</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {[
              "What should I cut first?",
              "Is my rent too high?",
              "How much house can I afford?",
              "How do I get to a stable score?",
              "What happens if I save more?",
              "What's my fastest improvement?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => setAskPlanOpen(true)}
                style={{
                  background: t.primary + "10",
                  border: `1px solid ${t.primary}25`,
                  borderRadius: "8px",
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.82rem",
                  color: t.primary,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {q}
              </button>
            ))}
          </div>
          {askPlanOpen && (
            <AskYourPlan
              data={data}
              taxRate={taxRate}
              outputs={outputs}
              t={t}
              isDark={isDark}
              onSimulator={onSimulator}
              userTier={userTier}
              onUpgrade={onUpgrade}
            />
          )}
          {!askPlanOpen && (
            <button
              onClick={() => setAskPlanOpen(true)}
              style={{
                background: t.primary,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <MessageCircle size={15} />
              Open Ask Your Plan
            </button>
          )}
        </div>

        {/* Open in Simulator + Check-In cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Play size={16} style={{ color: t.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>Scenario Simulator</span>
            </div>
            <p style={{ color: t.muted, fontSize: "0.82rem", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
              Compare what-if scenarios side by side.
            </p>
            <button
              onClick={onSimulator}
              style={{
                background: t.primary + "15",
                color: t.primary,
                border: `1px solid ${t.primary}30`,
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <ArrowRight size={14} />
              Open in Simulator
            </button>
          </div>
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <CalendarCheck size={16} style={{ color: "#22c55e" }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>Monthly Check-In</span>
            </div>
            <p style={{ color: t.muted, fontSize: "0.82rem", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
              {snapshots.length > 0
                ? `Next check-in: in ~${Math.max(1, 30 - Math.round((Date.now() - new Date(snapshots[snapshots.length - 1].date).getTime()) / 86400000))} days`
                : "Track your progress month over month."}
            </p>
            <button
              onClick={onCheckIn}
              style={{
                background: "#22c55e15",
                color: "#22c55e",
                border: "1px solid #22c55e30",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <CalendarCheck size={14} />
              {snapshots.length > 0 ? "Continue Check-In" : "Start Monthly Check-In"}
            </button>
          </div>
        </div>

        {/* Save Scenario */}
        {onSaveScenario && (
          <div style={{ marginBottom: "1.25rem" }}>
            <button
              onClick={onSaveScenario}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                border: "none",
                borderRadius: "10px",
                padding: "0.85rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: `0 4px 16px ${currentTheme.primary}30`,
              }}
            >
              <Save size={16} />
              {currentUser ? "Save Scenario" : "Save Scenario — Create Free Account"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={onRecalculate}
            style={{
              flex: 1,
              minWidth: "140px",
              background: "transparent",
              border: `2px solid ${t.border}`,
              borderRadius: "10px",
              padding: "0.8rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              color: t.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Calculator size={16} />
            Adjust Expenses
          </button>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              minWidth: "140px",
              background: t.primary,
              border: "none",
              borderRadius: "10px",
              padding: "0.8rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Home size={16} />
            Start Over
          </button>
        </div>
      </div>

      {/* Floating AI Chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            height: "50px",
            borderRadius: "25px",
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent ?? currentTheme.primary})`,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0 1.25rem",
            boxShadow: `0 4px 24px ${currentTheme.primary}60`,
            zIndex: 150,
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.92rem",
          }}
          title="AI Financial Advisor"
        >
          <MessageCircle size={20} style={{ color: "#fff" }} />
          Ask AI Advisor
        </button>
      )}

      {/* AI Chat Panel */}
      {chatOpen && (
        <AIChat
          data={data}
          taxRate={taxRate}
          grossAnnual={grossAnnual}
          grossMonthly={grossMonthly}
          totalMonthly={totalMonthly}
          t={t}
          isDark={isDark}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Checkout Page ─────────────────────────────────────────────────────────────

interface CheckoutPageProps {
  onBack: () => void;
  initialPlan: PlanId;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

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

function CheckoutPage({
  onBack,
  initialPlan,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
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

  // Create a Stripe Checkout Session via the server and redirect the browser to it.
async function redirectToCheckout(plan: PlanId, billingPeriod: "monthly" | "yearly") {
  const user = getCurrentUser();
  const session = getSession();

  if (!user || !session) {
    setShowAuthModal(true);
    setAuthModalMode("signin");
    return;
  }
  
try {
  const resp = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({
      planTier: plan,
      billingPeriod,
      userId: user.id,
    }),
  });

  if (!resp.ok) {
    console.error("[checkout] Failed to create session:", await resp.text());
    return;
  }

  const { url } = (await resp.json()) as { url: string };
  window.location.href = url;
} catch (err) {
  console.error("[checkout] Network error:", err);
}
  }

  // Annual upsell: only show once per session per plan
  function handleCheckoutClick(plan: PlanId) {
    if (billing === "monthly") {
      const upsellKey = `incomecalc-upsell-shown-${plan}`;
      if (!sessionStorage.getItem(upsellKey)) {
        sessionStorage.setItem(upsellKey, "1");
        setPendingCheckoutPlan(plan);
        setShowUpsellModal(true);
        return;
      }
    }
    const p = PLANS.find((pp) => pp.id === plan) ?? PLANS[0];
    const amount = billing === "monthly" ? p.price : p.yearlyPrice;
    trackEvent("checkout_clicked", { plan, billing, amount, source_page: "/checkout" });
    redirectToCheckout(plan, billing);
  }

  function handleUpsellAnnual() {
    setShowUpsellModal(false);
    setBilling("yearly");
    const p = PLANS.find((pp) => pp.id === pendingCheckoutPlan) ?? PLANS[0];
    trackEvent("checkout_clicked", { plan: pendingCheckoutPlan, billing: "yearly", amount: p.yearlyPrice, source_page: "/checkout" });
    redirectToCheckout(pendingCheckoutPlan, "yearly");
  }

  function handleUpsellMonthly() {
    setShowUpsellModal(false);
    const p = PLANS.find((pp) => pp.id === pendingCheckoutPlan) ?? PLANS[0];
    trackEvent("checkout_clicked", { plan: pendingCheckoutPlan, billing: "monthly", amount: p.price, source_page: "/checkout" });
    redirectToCheckout(pendingCheckoutPlan, "monthly");
  }

  // Urgency countdown — resets to 15 min each session
  const [secsLeft, setSecsLeft] = useState(15 * 60);
  useEffect(() => {
    const id = setInterval(() => setSecsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mins = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const secs = String(secsLeft % 60).padStart(2, "0");

  const plan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0];
  const price = billing === "monthly" ? plan.price : plan.yearlyPrice;

  const yearlySavings = Math.round((plan.price * 12 - plan.yearlyPrice));

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" }}>
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
            color: "rgba(255,255,255,0.45)",
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

        {/* Urgency banner */}
        {secsLeft > 0 && (
          <div
            className="atv-glass-static"
            style={{
              padding: "0.65rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              textAlign: "center",
              borderTop: "3px solid",
              borderImage: "linear-gradient(90deg, #5E5CE6, #8E44FF) 1",
            }}
          >
            <Zap size={16} style={{ color: "#8E8AFF", flexShrink: 0 }} />
            <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "0.9rem" }}>
              Limited offer — first month 20% off. Expires in{" "}
              <span
                style={{
                  background: "rgba(94,92,230,0.2)",
                  borderRadius: "5px",
                  padding: "1px 7px",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                {mins}:{secs}
              </span>
            </span>
          </div>
        )}

        {/* Header */}
        <div className="atv-fade-in" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(94,92,230,0.12)",
              border: "1px solid rgba(94,92,230,0.25)",
              borderRadius: "20px",
              padding: "0.4rem 1.1rem",
              fontSize: "0.85rem",
              color: "#8E8AFF",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            <CreditCard size={14} />
            Upgrade IncomeCalc
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#FFFFFF", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
            Choose Your Plan
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1rem", margin: 0 }}>
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
                  background: billing === b ? "linear-gradient(135deg, #5E5CE6, #8E44FF)" : "transparent",
                  color: billing === b ? "#fff" : "rgba(255,255,255,0.45)",
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
                    ? "2px solid rgba(94,92,230,0.6)"
                    : "2px solid rgba(255,255,255,0.08)",
                  boxShadow: isSelected
                    ? "0 20px 40px rgba(0,0,0,0.35), 0 0 20px rgba(94,92,230,0.15)"
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
                      background: "linear-gradient(135deg, #5E5CE6, #8E44FF)",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "3px 12px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 0 12px rgba(94,92,230,0.4)",
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

// ─── Simulator Page (Feature 1) ──────────────────────────────────────────────

interface SimulatorPageProps {
  initialExpenses: ExpenseData;
  initialTaxRate: number;
  onBack: () => void;
  onUpgrade: (plan?: PlanId) => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

function SimulatorPage({
  initialExpenses,
  initialTaxRate,
  onBack,
  onUpgrade,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
}: SimulatorPageProps) {
  const t = applyDark(currentTheme, isDark);
  const limit = getScenarioLimit(userTier);

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const saved = loadScenarios();
    if (saved.length > 0) return saved;
    return [{ id: genId(), name: "Scenario A", expenses: { ...initialExpenses }, taxRate: initialTaxRate }];
  });
  const [activeId, setActiveId] = useState<string>(scenarios[0]?.id ?? "");
  const [editingName, setEditingName] = useState<string | null>(null);

  useEffect(() => { saveScenarios(scenarios); }, [scenarios]);

  const activeScenario = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  function addScenario() {
    if (scenarios.length >= limit) return;
    const newS: Scenario = {
      id: genId(),
      name: `Scenario ${String.fromCharCode(65 + scenarios.length)}`,
      expenses: { ...initialExpenses },
      taxRate: initialTaxRate,
    };
    setScenarios((prev) => [...prev, newS]);
    setActiveId(newS.id);
  }

  function duplicateScenario(id: string) {
    if (scenarios.length >= limit) return;
    const src = scenarios.find((s) => s.id === id);
    if (!src) return;
    const dup: Scenario = { ...src, id: genId(), name: src.name + " (copy)", expenses: { ...src.expenses } };
    setScenarios((prev) => [...prev, dup]);
    setActiveId(dup.id);
  }

  function deleteScenario(id: string) {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(scenarios.find((s) => s.id !== id)?.id ?? "");
  }

  function updateScenario(id: string, patch: Partial<Scenario>) {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function updateExpense(id: string, field: keyof ExpenseData, value: number) {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, expenses: { ...s.expenses, [field]: value } } : s
      )
    );
  }

  // Compute results for all scenarios
  const results = scenarios.map((s) => ({
    scenario: s,
    output: computeForExpenses(s.expenses, s.taxRate),
  }));

  // Winner: lowest fragility = highest fragilityScore, tie-break lowest hourly
  const winner = results.reduce((best, curr) => {
    if (curr.output.fragilityScore > best.output.fragilityScore) return curr;
    if (curr.output.fragilityScore === best.output.fragilityScore && curr.output.hourlyRequired < best.output.hourlyRequired) return curr;
    return best;
  }, results[0]);

  // Preset quick toggles
  function applyPreset(id: string, preset: string) {
    const s = scenarios.find((sc) => sc.id === id);
    if (!s) return;
    const newExpenses = { ...s.expenses };
    if (preset === "rent+200") newExpenses.housing += 200;
    if (preset === "rent-200") newExpenses.housing = Math.max(0, newExpenses.housing - 200);
    if (preset === "debt-100") newExpenses.other = Math.max(0, newExpenses.other - 100);
    if (preset === "savings+200") newExpenses.savings += 200;
    updateScenario(id, { expenses: newExpenses });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: "0 0 0.5rem" }}>Scenario Simulator</h1>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>Compare different financial scenarios side by side.</p>

        {/* Scenario tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {scenarios.map((s, i) => {
            const isActive = s.id === activeId;
            const isLocked = i >= limit;
            return (
              <button
                key={s.id}
                onClick={() => !isLocked && setActiveId(s.id)}
                style={{
                  background: isActive ? t.primary : isLocked ? t.border + "50" : t.cardBg,
                  color: isActive ? "#fff" : isLocked ? t.muted : t.text,
                  border: `1px solid ${isActive ? t.primary : t.border}`,
                  borderRadius: "8px",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: isLocked ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  filter: isLocked ? "blur(1px)" : "none",
                  position: "relative",
                }}
              >
                {winner && winner.scenario.id === s.id && <Trophy size={13} style={{ color: isActive ? "#fde68a" : "#f59e0b" }} />}
                {editingName === s.id ? (
                  <input
                    autoFocus
                    value={s.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateScenario(s.id, { name: e.target.value })}
                    onBlur={() => setEditingName(null)}
                    onKeyDown={(e) => { if (e.key === "Enter") setEditingName(null); }}
                    style={{ background: "transparent", border: "none", color: "inherit", fontSize: "inherit", fontWeight: "inherit", width: "80px", outline: "none" }}
                  />
                ) : (
                  <span onDoubleClick={() => setEditingName(s.id)}>{s.name}</span>
                )}
                {isLocked && <Lock size={12} />}
              </button>
            );
          })}
          {scenarios.length < limit ? (
            <button
              onClick={addScenario}
              style={{
                background: "transparent",
                border: `1px dashed ${t.border}`,
                borderRadius: "8px",
                padding: "0.45rem 0.75rem",
                fontSize: "0.85rem",
                color: t.muted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Plus size={14} /> Add
            </button>
          ) : (
            <button
              onClick={() => onUpgrade(userTier === "free" ? "pro" : "premium")}
              style={{
                background: "transparent",
                border: `1px dashed ${t.primary}50`,
                borderRadius: "8px",
                padding: "0.45rem 0.75rem",
                fontSize: "0.82rem",
                color: t.primary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Lock size={12} /> Upgrade to unlock more
            </button>
          )}
        </div>

        {/* Active scenario form */}
        {activeScenario && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
            {/* Left: form */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ fontWeight: 700, color: t.text }}>{activeScenario.name}</span>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button onClick={() => duplicateScenario(activeScenario.id)} title="Duplicate" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}><Copy size={14} /></button>
                  <button onClick={() => setEditingName(activeScenario.id)} title="Rename" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}><Edit3 size={14} /></button>
                  {scenarios.length > 1 && <button onClick={() => deleteScenario(activeScenario.id)} title="Delete" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}><Trash2 size={14} /></button>}
                </div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <Label style={{ fontSize: "0.78rem", color: t.muted, display: "block", marginBottom: "0.25rem" }}>Tax Rate (%)</Label>
                <Input
                  type="number" min={0} max={70}
                  value={activeScenario.taxRate}
                  onChange={(e) => updateScenario(activeScenario.id, { taxRate: Math.min(70, Math.max(0, parseFloat(e.target.value) || 0)) })}
                  style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, maxWidth: "120px" }}
                />
              </div>

              {EXPENSE_FIELDS.map((field) => {
                const Icon = field.icon;
                const val = activeScenario.expenses[field.name];
                return (
                  <div key={field.name} style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.5rem" }}>
                    <Icon size={14} style={{ color: t.primary, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.82rem", color: t.text, width: "110px", flexShrink: 0 }}>{field.label}</span>
                    <Input
                      type="number" min={0}
                      value={val === 0 ? "" : val}
                      onChange={(e) => updateExpense(activeScenario.id, field.name, Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0"
                      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, flex: 1 }}
                    />
                  </div>
                );
              })}

              {/* Quick presets */}
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {[
                  { key: "rent+200", label: "Rent +$200" },
                  { key: "rent-200", label: "Rent -$200" },
                  { key: "debt-100", label: "Debt -$100/mo" },
                  { key: "savings+200", label: "Savings +$200" },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(activeScenario.id, p.key)}
                    style={{
                      background: t.primary + "10",
                      border: `1px solid ${t.primary}25`,
                      borderRadius: "6px",
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.75rem",
                      color: t.primary,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: active scenario results */}
            {(() => {
              const out = computeForExpenses(activeScenario.expenses, activeScenario.taxRate);
              return (
                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
                  <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem", display: "block", marginBottom: "1rem" }}>Results</span>
                  {[
                    { label: "Hourly Required", value: `${fmt(out.hourlyRequired)}/hr` },
                    { label: "Annual Gross Required", value: fmt(out.annualGrossRequired) },
                    { label: "Monthly Required", value: fmt(out.monthlyRequiredTotal) },
                    { label: "Emergency Fund Target", value: fmt(out.emergencyFundTarget) },
                    { label: "Fragility Score", value: `${out.fragilityScore}/100 (${out.fragilityLabel})` },
                    { label: "Rent % of Monthly", value: `${(out.ratios.rentRatio * 100).toFixed(1)}%` },
                    { label: "Debt % of Monthly", value: `${(out.ratios.debtRatio * 100).toFixed(1)}%` },
                    { label: "Transport % of Monthly", value: `${(out.ratios.transportRatio * 100).toFixed(1)}%` },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: `1px solid ${t.border}20`, fontSize: "0.85rem" }}>
                      <span style={{ color: t.muted }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: t.text }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Comparison table */}
        {results.length > 1 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <BarChart3 size={18} style={{ color: t.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Comparison</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: t.muted, fontWeight: 600 }}>Metric</th>
                    {results.map((r) => (
                      <th key={r.scenario.id} style={{ textAlign: "right", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: t.text, fontWeight: 600 }}>
                        {winner?.scenario.id === r.scenario.id && <Trophy size={12} style={{ color: "#f59e0b", marginRight: "4px" }} />}
                        {r.scenario.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Hourly Required", fn: (o: CalcOutput) => `${fmt(o.hourlyRequired)}/hr` },
                    { label: "Annual Gross", fn: (o: CalcOutput) => fmt(o.annualGrossRequired) },
                    { label: "Monthly Total", fn: (o: CalcOutput) => fmt(o.monthlyRequiredTotal) },
                    { label: "Emergency Fund", fn: (o: CalcOutput) => fmt(o.emergencyFundTarget) },
                    { label: "Fragility", fn: (o: CalcOutput) => `${o.fragilityScore}/100` },
                    { label: "Rent %", fn: (o: CalcOutput) => `${(o.ratios.rentRatio * 100).toFixed(1)}%` },
                    { label: "Debt %", fn: (o: CalcOutput) => `${(o.ratios.debtRatio * 100).toFixed(1)}%` },
                    { label: "Transport %", fn: (o: CalcOutput) => `${(o.ratios.transportRatio * 100).toFixed(1)}%` },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td style={{ padding: "0.45rem 0.75rem", borderBottom: `1px solid ${t.border}20`, color: t.muted }}>{row.label}</td>
                      {results.map((r) => (
                        <td key={r.scenario.id} style={{ textAlign: "right", padding: "0.45rem 0.75rem", borderBottom: `1px solid ${t.border}20`, color: t.text, fontWeight: 500 }}>
                          {row.fn(r.output)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {winner && (
              <div style={{ marginTop: "1rem", padding: "0.6rem 0.85rem", background: "#f59e0b12", border: "1px solid #f59e0b30", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trophy size={16} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "0.88rem", color: t.text }}>
                  <strong>{winner.scenario.name}</strong> wins with the best fragility score ({winner.output.fragilityScore}/100) and {fmt(winner.output.hourlyRequired)}/hr required.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Check-In Page (Feature 2) ───────────────────────────────────────────────

interface CheckInPageProps {
  currentExpenses: ExpenseData;
  currentTaxRate: number;
  onBack: () => void;
  onUpgrade: (plan?: PlanId) => void;
  onForecast: () => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

function CheckInPage({
  currentExpenses,
  currentTaxRate,
  onBack,
  onUpgrade,
  onForecast,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
}: CheckInPageProps) {
  const t = applyDark(currentTheme, isDark);

  const [snapshots, setSnapshots] = useState<CheckInSnapshot[]>(loadSnapshots);
  const [showForm, setShowForm] = useState(false);
  const [deltaReport, setDeltaReport] = useState<{ prev: CalcOutput; curr: CalcOutput; drivers: string[] } | null>(null);

  // Change form
  const [rentChange, setRentChange] = useState(0);
  const [newExpense, setNewExpense] = useState(0);
  const [debtChange, setDebtChange] = useState(0);
  const [savingsChange, setSavingsChange] = useState(0);
  const [noteText, setNoteText] = useState("");

  const lastSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  function startFromCurrent() {
    setShowForm(true);
    setRentChange(0);
    setNewExpense(0);
    setDebtChange(0);
    setSavingsChange(0);
    setNoteText("");
    setDeltaReport(null);
  }

  function submitCheckIn() {
    const baseExpenses = lastSnapshot ? { ...lastSnapshot.expenses } : { ...currentExpenses };
    const baseTax = lastSnapshot ? lastSnapshot.taxRate : currentTaxRate;

    const newExpenses: ExpenseData = {
      ...baseExpenses,
      housing: Math.max(0, baseExpenses.housing + rentChange),
      other: Math.max(0, baseExpenses.other + newExpense - debtChange),
      savings: Math.max(0, baseExpenses.savings + savingsChange),
    };

    const newOutputs = computeForExpenses(newExpenses, baseTax);
    const prevOutputs = lastSnapshot ? lastSnapshot.outputs : computeForExpenses(currentExpenses, currentTaxRate);

    // Top 3 drivers
    const drivers: string[] = [];
    if (rentChange !== 0) drivers.push(`Housing ${rentChange > 0 ? "increased" : "decreased"} by ${fmt(Math.abs(rentChange))}/mo`);
    if (debtChange !== 0) drivers.push(`Debt payments reduced by ${fmt(debtChange)}/mo`);
    if (savingsChange !== 0) drivers.push(`Savings ${savingsChange > 0 ? "increased" : "decreased"} by ${fmt(Math.abs(savingsChange))}/mo`);
    if (newExpense !== 0) drivers.push(`New expense of ${fmt(newExpense)}/mo added`);
    if (drivers.length === 0) drivers.push("No significant changes this month");

    const snap: CheckInSnapshot = {
      id: genId(),
      date: new Date().toISOString(),
      expenses: newExpenses,
      taxRate: baseTax,
      outputs: newOutputs,
      note: noteText || undefined,
    };

    const updated = [...snapshots, snap];
    setSnapshots(updated);
    saveSnapshots(updated);
    setDeltaReport({ prev: prevOutputs, curr: newOutputs, drivers: drivers.slice(0, 3) });
    setShowForm(false);
  }

  function downloadICS() {
    const ics = generateICS();
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incomecalc-checkin.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Limit history view for free users
  const visibleSnapshots = userTier === "premium" ? snapshots : snapshots.slice(-3);

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: "0 0 0.5rem" }}>Monthly Check-In</h1>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>Track your financial progress month over month.</p>

        {/* Last snapshot summary */}
        {lastSnapshot && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.82rem", color: t.muted, marginBottom: "0.5rem" }}>
              Last check-in: {new Date(lastSnapshot.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { label: "Hourly Required", value: `${fmt(lastSnapshot.outputs.hourlyRequired)}/hr` },
                { label: "Annual Gross", value: fmt(lastSnapshot.outputs.annualGrossRequired) },
                { label: "Fragility Score", value: `${lastSnapshot.outputs.fragilityScore}/100` },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: "0.78rem", color: t.muted }}>{s.label}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delta report */}
        {deltaReport && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <TrendingUp size={18} style={{ color: t.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Change Report</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              {[
                { label: "Hourly Required", prev: deltaReport.prev.hourlyRequired, curr: deltaReport.curr.hourlyRequired, suffix: "/hr" },
                { label: "Annual Gross", prev: deltaReport.prev.annualGrossRequired, curr: deltaReport.curr.annualGrossRequired, suffix: "" },
                { label: "Fragility Score", prev: deltaReport.prev.fragilityScore, curr: deltaReport.curr.fragilityScore, suffix: "/100" },
              ].map((item) => {
                const diff = item.curr - item.prev;
                const isScore = item.label === "Fragility Score";
                const color = diff === 0 ? t.muted : (isScore ? (diff > 0 ? "#22c55e" : "#ef4444") : (diff > 0 ? "#ef4444" : "#22c55e"));
                return (
                  <div key={item.label}>
                    <div style={{ fontSize: "0.78rem", color: t.muted }}>{item.label}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text }}>{isScore ? `${item.curr}${item.suffix}` : `${fmt(item.curr)}${item.suffix}`}</div>
                    <div style={{ fontSize: "0.78rem", color, fontWeight: 600 }}>
                      {diff === 0 ? "No change" : `${diff > 0 ? "+" : ""}${isScore ? diff.toFixed(0) : fmt(diff)}`}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: "0.5rem" }}>Top Drivers:</div>
            {deltaReport.drivers.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0", fontSize: "0.85rem", color: t.muted }}>
                <CheckCircle size={13} style={{ color: t.primary }} />
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Check-in form */}
        {showForm ? (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem", display: "block", marginBottom: "1rem" }}>What changed since last month?</span>
            {[
              { label: "Rent change ($)", value: rentChange, set: setRentChange },
              { label: "New monthly expense ($)", value: newExpense, set: setNewExpense },
              { label: "Debt payment change ($)", value: debtChange, set: setDebtChange },
              { label: "Savings goal change ($)", value: savingsChange, set: setSavingsChange },
            ].map((f) => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.85rem", color: t.muted, width: "170px", flexShrink: 0 }}>{f.label}</span>
                <Input
                  type="number"
                  value={f.value === 0 ? "" : f.value}
                  onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, flex: 1 }}
                />
              </div>
            ))}
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Any big life change?</span>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g., got a raise, moved apartments, paid off a loan"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: `1px solid ${t.border}`,
                  background: t.bg,
                  color: t.text,
                  fontSize: "0.88rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={submitCheckIn} style={{
                background: t.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.25rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem",
              }}>
                <CheckCircle size={15} /> Submit Check-In
              </button>
              <button onClick={() => setShowForm(false)} style={{
                background: "transparent", color: t.muted, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <button onClick={startFromCurrent} style={{
              background: t.primary, color: "#fff", border: "none", borderRadius: "10px", padding: "0.75rem 1.5rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem",
            }}>
              <CalendarCheck size={16} /> {lastSnapshot ? "New Check-In" : "Start from Current Calculator Inputs"}
            </button>
            <button onClick={downloadICS} style={{
              background: "transparent", color: t.primary, border: `1.5px solid ${t.primary}`, borderRadius: "10px", padding: "0.75rem 1.25rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem",
            }}>
              <Download size={16} /> Set Monthly Reminder (.ics)
            </button>
          </div>
        )}

        {/* History */}
        {visibleSnapshots.length > 0 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem", display: "block", marginBottom: "1rem" }}>Check-In History</span>
            {visibleSnapshots.slice().reverse().map((snap) => (
              <div key={snap.id} style={{ padding: "0.75rem 0", borderBottom: `1px solid ${t.border}20`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: t.text, fontWeight: 600 }}>
                    {new Date(snap.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  {snap.note && <div style={{ fontSize: "0.78rem", color: t.muted, marginTop: "0.15rem" }}>{snap.note}</div>}
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.82rem" }}>
                  <span style={{ color: t.muted }}>{fmt(snap.outputs.hourlyRequired)}/hr</span>
                  <span style={{ color: t.muted }}>{fmt(snap.outputs.annualGrossRequired)}/yr</span>
                  <span style={{ color: snap.outputs.fragilityScore >= 50 ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>{snap.outputs.fragilityScore}/100</span>
                </div>
              </div>
            ))}
            {userTier !== "premium" && snapshots.length > 3 && (
              <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.85rem", background: t.primary + "08", border: `1px solid ${t.primary}20`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", color: t.muted }}>
                  {snapshots.length - 3} more check-ins hidden
                </span>
                <button onClick={() => onUpgrade("premium")} style={{ background: t.primary, color: "#fff", border: "none", borderRadius: "6px", padding: "0.3rem 0.7rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                  Get Premium
                </button>
              </div>
            )}
          </div>
        )}

        {/* Forecast from check-in CTA */}
        <button
          onClick={onForecast}
          style={{
            marginTop: "1.25rem",
            width: "100%",
            background: t.primary + "15",
            color: t.primary,
            border: `1px solid ${t.primary}30`,
            borderRadius: "10px",
            padding: "0.75rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          <TrendingUp size={16} />
          Forecast from this Check-In
          <span style={{ fontSize: "0.65rem", background: "#f59e0b20", color: "#f59e0b", borderRadius: "4px", padding: "0 4px", fontWeight: 600, border: "1px solid #f59e0b40", marginLeft: "0.25rem" }}>Premium</span>
        </button>
      </div>
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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

function FirePage({
  onBack,
  onUpgrade,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
}: FirePageProps) {
  const t = applyDark(currentTheme, isDark);
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
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
        <div style={{ position: "relative" }}>
          {!isPremium && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                background: isDark ? "rgba(15,15,17,0.85)" : "rgba(255,255,255,0.85)",
                backdropFilter: "blur(6px)",
                zIndex: 10,
                borderRadius: "16px",
              }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f59e0b20", border: "2px solid #f59e0b40", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
                <Lock size={22} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.25rem" }}>Premium Feature</div>
                <div style={{ fontSize: "0.85rem", color: t.muted }}>Unlock full FIRE projections with Premium</div>
              </div>
              <button
                onClick={() => onUpgrade("premium")}
                style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Flame size={15} />
                Get Premium
              </button>
            </div>
          )}

          <div style={{ filter: isPremium ? "none" : "blur(6px)", pointerEvents: isPremium ? "auto" : "none" }}>
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
              <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.1 }}>
                {fmt(fireResult.projectedBalance)}
              </div>
              <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.25rem" }}>
                in {fireResult.yearsUntilRetirement} years
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Monthly Income (4% rule)</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{fmt(fireResult.monthlyRetirementIncome)}/mo</div>
                </div>
                <div>
                  <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Annual Withdrawal</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{fmt(fireResult.annualWithdrawal)}/yr</div>
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
          </div>
        </div>
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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
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
  baseTheme,
  setTheme,
}: ForecastPageProps) {
  const t = applyDark(currentTheme, isDark);
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
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
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
                <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.25rem" }}>Unlock 12-Month Forecast</div>
                <div style={{ fontSize: "0.85rem", color: t.muted }}>Free/Pro users see first 2 months only</div>
              </div>
              <button onClick={() => onUpgrade("premium")} style={{ background: currentTheme.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Lock size={15} />
                Unlock 12-Month Forecast (Premium)
              </button>
            </div>
          )}

          <div style={{ filter: isPremium ? "none" : "blur(4px)", pointerEvents: isPremium ? "auto" : "none" }}>
            {/* Mini charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
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
                      <td style={{ padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: "#f59e0b", fontWeight: 600 }}>{fmt(s.emergencyFundBalance)}</td>
                      <td style={{ padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: "#3b82f6", fontWeight: 600 }}>{s.runwayMonths.toFixed(1)}mo</td>
                      {totalDebtBalance > 0 && (
                        <td style={{ padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: s.debtBalance > 0 ? "#ef4444" : "#22c55e", fontWeight: 600 }}>{fmt(s.debtBalance)}</td>
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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

function DebtPage({
  onBack,
  onUpgrade,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
}: DebtPageProps) {
  const t = applyDark(currentTheme, isDark);
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
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
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
                  style={{ background: "transparent", border: "none", fontWeight: 700, color: t.text, fontSize: "0.9rem", outline: "none", padding: 0, width: "150px" }}
                  placeholder="Debt name"
                />
                <button onClick={() => removeDebt(debt.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "2px" }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <Label style={{ fontSize: "0.72rem", color: t.muted, display: "block", marginBottom: "0.2rem" }}>Balance ($)</Label>
                  <Input type="number" min={0} value={debt.balance === 0 ? "" : debt.balance} onChange={(e) => updateDebt(debt.id, "balance", e.target.value)} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: "0.85rem" }} />
                </div>
                <div>
                  <Label style={{ fontSize: "0.72rem", color: t.muted, display: "block", marginBottom: "0.2rem" }}>APR (%)</Label>
                  <Input type="number" min={0} max={60} step={0.1} value={debt.apr === 0 ? "" : debt.apr} onChange={(e) => updateDebt(debt.id, "apr", e.target.value)} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: "0.85rem" }} />
                </div>
                <div>
                  <Label style={{ fontSize: "0.72rem", color: t.muted, display: "block", marginBottom: "0.2rem" }}>Min Payment ($)</Label>
                  <Input type="number" min={0} value={debt.minPayment === 0 ? "" : debt.minPayment} onChange={(e) => updateDebt(debt.id, "minPayment", e.target.value)} placeholder="0" style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: "0.85rem" }} />
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
            {isFree && (
              <div style={{
                position: "absolute", top: "60px", left: 0, right: 0, bottom: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                background: isDark ? "rgba(15,15,17,0.85)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", zIndex: 10, borderRadius: "0 0 16px 16px",
              }}>
                <Lock size={22} style={{ color: t.primary }} />
                <div style={{ fontWeight: 700, color: t.text }}>Upgrade for full comparison</div>
                <button onClick={() => onUpgrade("pro")} style={{ background: t.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0.55rem 1.25rem", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
                  Get Pro
                </button>
              </div>
            )}

            {/* Comparison cards */}
            {(mode === "compare" || mode === "snowball" || mode === "avalanche") && (
              <div style={{ display: "grid", gridTemplateColumns: mode === "compare" ? "1fr 1fr" : "1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                {(mode === "compare" || mode === "snowball") && (
                  <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <TrendingDown size={16} style={{ color: "#3b82f6" }} />
                      <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>Snowball</span>
                      <span style={{ fontSize: "0.72rem", color: t.muted }}>(Smallest balance first)</span>
                    </div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#3b82f6", marginBottom: "0.25rem" }}>{formatMonths(snowballResult.months)}</div>
                    <div style={{ fontSize: "0.85rem", color: t.muted, marginBottom: "0.25rem" }}>Total interest: <strong style={{ color: "#ef4444" }}>{fmt(snowballResult.totalInterestPaid)}</strong></div>
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
                    <div style={{ fontSize: "0.85rem", color: t.muted, marginBottom: "0.25rem" }}>Total interest: <strong style={{ color: "#ef4444" }}>{fmt(avalancheResult.totalInterestPaid)}</strong></div>
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
                    <strong style={{ color: "#22c55e" }}>Avalanche</strong> is the fastest strategy, saving you <strong style={{ color: "#22c55e" }}>{fmt(snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid)}</strong> in interest
                    {snowballResult.months !== avalancheResult.months && ` and ${snowballResult.months - avalancheResult.months} month${snowballResult.months - avalancheResult.months !== 1 ? "s" : ""}`}.
                    It targets the highest-interest debt first, minimizing total cost.
                  </p>
                ) : (
                  <p style={{ fontSize: "0.88rem", color: t.muted, margin: 0, lineHeight: 1.6 }}>
                    <strong style={{ color: "#3b82f6" }}>Snowball</strong> pays off debts fastest by targeting the smallest balance first.
                    Avalanche saves <strong style={{ color: "#22c55e" }}>{fmt(snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid)}</strong> in interest but takes {avalancheResult.months - snowballResult.months} month{avalancheResult.months - snowballResult.months !== 1 ? "s" : ""} longer.
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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
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
  baseTheme,
  setTheme,
}: FIPageProps) {
  const t = applyDark(currentTheme, isDark);
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
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Milestone size={22} style={{ color: "#8b5cf6" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: 0 }}>Financial Independence Date</h1>
          <Badge style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40", fontSize: "0.7rem" }}>Premium</Badge>
        </div>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
          Estimate when your invested assets can cover your annual expenses using the safe withdrawal rate.
        </p>

        {/* Inputs */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <Label style={{ fontSize: "0.82rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Annual Expenses (from calculator)</Label>
              <div style={{ padding: "0.55rem 0.75rem", background: t.primary + "10", borderRadius: "8px", fontWeight: 700, color: t.primary, fontSize: "0.95rem" }}>{fmt(annualExpenses)}/yr</div>
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

        {/* FI Target - always visible */}
        <div style={{ background: `linear-gradient(135deg, #8b5cf6, #6366f1)`, borderRadius: "16px", padding: "2rem", marginBottom: "1.25rem", color: "#fff", textAlign: "center" }}>
          <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.5rem" }}>FI Target Net Worth</div>
          <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.1 }}>{fmt(fiResult.targetNetWorth)}</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.25rem" }}>
            Based on {fmt(annualExpenses)}/yr expenses at {swr}% SWR
          </div>
        </div>

        {/* Progress bar - always visible */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: t.text }}>Progress to FI</span>
            <span style={{ fontWeight: 700, color: "#8b5cf6", fontSize: "0.9rem" }}>{fiResult.currentProgress}%</span>
          </div>
          <div style={{ height: "12px", background: t.border, borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fiResult.currentProgress}%`, background: "linear-gradient(90deg, #8b5cf6, #6366f1)", borderRadius: "6px", transition: "width 0.3s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem", fontSize: "0.78rem", color: t.muted }}>
            <span>{fmt(currentAssets)} now</span>
            <span>{fmt(fiResult.targetNetWorth)} target</span>
          </div>
        </div>

        {/* Premium-gated time estimate + chart */}
        <div style={{ position: "relative" }}>
          {!isPremium && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem",
              background: isDark ? "rgba(15,15,17,0.85)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", zIndex: 10, borderRadius: "16px",
            }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#8b5cf620", border: "2px solid #8b5cf640", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6" }}>
                <Lock size={22} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: t.text, marginBottom: "0.25rem" }}>Unlock Full FI Timeline</div>
                <div style={{ fontSize: "0.85rem", color: t.muted }}>Premium required for time estimate and chart</div>
              </div>
              <button onClick={() => onUpgrade("premium")} style={{ background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                Unlock FI Estimator
              </button>
            </div>
          )}

          <div style={{ filter: isPremium ? "none" : "blur(6px)", pointerEvents: isPremium ? "auto" : "none" }}>
            {/* Time to FI big number */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: t.muted, marginBottom: "0.35rem" }}>Time to FI</div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#8b5cf6" }}>
                  {fiResult.onTrack ? `${fiResult.yearsToFI} years` : "50+ years"}
                </div>
                <div style={{ fontSize: "0.82rem", color: t.muted }}>{fiResult.monthsToFI} months</div>
              </div>
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: t.muted, marginBottom: "0.35rem" }}>Projected FI Date</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#8b5cf6" }}>{fiDateStr}</div>
                <div style={{ fontSize: "0.82rem", color: fiResult.onTrack ? "#22c55e" : "#ef4444", fontWeight: 600, marginTop: "0.25rem" }}>
                  {fiResult.onTrack ? "On Track" : "Behind — increase savings or reduce expenses"}
                </div>
              </div>
            </div>

            {/* Assets growth chart */}
            {fiResult.schedule.length > 1 && (
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1rem" }}>
                <MiniLineChart data={fiResult.schedule.map(s => s.assets)} color="#8b5cf6" height={160} label="Projected Assets Over Time" />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: t.muted, paddingTop: "0.25rem" }}>
                  <span>Today</span>
                  <span>{fiResult.onTrack ? `Year ${Math.ceil(fiResult.monthsToFI / 12)}` : "Year 50+"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dev Access Page ──────────────────────────────────────────────────────────

interface DevAccessProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
  devOverride: boolean;
  devBadgeLabel: string | null;
  effectiveTier: UserTier;
  onToggle: (enabled: boolean, level?: "pro" | "premium") => void;
  onBack: () => void;
}

function DevAccessPage({ isDark, setIsDark, currentTheme, baseTheme, setTheme, devOverride, devBadgeLabel, effectiveTier, onToggle, onBack }: DevAccessProps) {
  const t = applyDark(currentTheme, isDark);

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} devOverride={devOverride} />
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
              Effective tier: <strong style={{ color: effectiveTier === "premium" ? "#a855f7" : effectiveTier === "pro" ? "#3b82f6" : t.muted }}>{effectiveTier.toUpperCase()}</strong>
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
                background: effectiveTier === "premium" && devOverride ? "#a855f7" : t.bg,
                color: effectiveTier === "premium" && devOverride ? "#fff" : "#a855f7",
                border: "2px solid #a855f7",
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
            <div style={{ fontFamily: "monospace", fontSize: "0.72rem", background: t.bg, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "0.65rem", lineHeight: 1.8 }}>
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
  onSuccess: (user: AuthUser) => void;
  t: ThemeConfig;
  isDark: boolean;
}

function AuthModal({ mode: initialMode, onClose, onSuccess, t, isDark }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
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
      ? authSignup(email, password)
      : authLogin(email, password);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onSuccess(result.user);
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
          <div style={{ marginBottom: "1rem" }}>
            <Label style={{ fontSize: "0.85rem", color: t.text, display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
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

// ─── Account Menu ────────────────────────────────────────────────────────────

interface AccountMenuProps {
  user: AuthUser | null;
  onSignIn: () => void;
  onDashboard: () => void;
  onDigestPreview: () => void;
  onSignOut: () => void;
  t: ThemeConfig;
}

function AccountMenu({ user, onSignIn, onDashboard, onDigestPreview, onSignOut, t }: AccountMenuProps) {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onSignIn}
        style={{
          background: "transparent",
          border: `1.5px solid ${t.border}`,
          borderRadius: "8px",
          padding: "0.35rem 0.65rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
          color: t.text,
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          height: "38px",
          whiteSpace: "nowrap",
        }}
      >
        <LogIn size={14} />
        Sign In
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: `1.5px solid ${t.border}`,
          borderRadius: "8px",
          padding: "0.35rem 0.65rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
          color: t.text,
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          height: "38px",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: t.primary,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.65rem",
          fontWeight: 700,
        }}>
          {user.email[0].toUpperCase()}
        </div>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "44px",
            right: 0,
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "10px",
            padding: "0.35rem",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            zIndex: 200,
            minWidth: "180px",
          }}
        >
          <div style={{ padding: "0.5rem 0.65rem", fontSize: "0.78rem", color: t.muted, borderBottom: `1px solid ${t.border}`, marginBottom: "0.25rem" }}>
            {user.email}
          </div>
          {[
            { label: "Dashboard", icon: <LayoutDashboard size={14} />, action: onDashboard },
            { label: "Email Digest Preview", icon: <Mail size={14} />, action: onDigestPreview },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={() => { setOpen(false); action(); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.65rem",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: t.text,
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <span style={{ color: t.muted }}>{icon}</span>
              {label}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${t.border}`, marginTop: "0.25rem", paddingTop: "0.25rem" }}>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.65rem",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#ef4444",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

function DashboardPage({ user, onBack, onLoadScenario, onShare, isDark, setIsDark, currentTheme, baseTheme, setTheme }: DashboardPageProps) {
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
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />
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
                    style={{ padding: "0.45rem 0.6rem", borderRadius: "6px", border: `1px solid ${t.border}`, background: t.bg, color: t.text, fontSize: "0.85rem" }}
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
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: t.text }}>{value}</div>
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
            <div style={{ fontSize: "2rem", fontWeight: 900, color: t.primary }}>${Math.round(scenario.resultsJson.hourlyRequired)}/hr</div>
            <div style={{ fontSize: "0.85rem", color: t.muted, marginTop: "0.25rem" }}>
              {fmt(scenario.resultsJson.annualGrossRequired)}/year · Score: {scenario.resultsJson.healthScore}/100
            </div>
            <div style={{ fontSize: "0.72rem", color: t.muted, marginTop: "0.5rem" }}>Built with IncomeCalc</div>
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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

function SharePage({ slug, onTryYourOwn, isDark, setIsDark, currentTheme, baseTheme, setTheme }: SharePageProps) {
  const t = applyDark(currentTheme, isDark);
  const scenario = getScenarioBySlug(slug);

  if (!scenario) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
        <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} />
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
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} />
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
          <div style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.1 }}>{fmt(r.annualGrossRequired)}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Hourly Rate</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>${Math.round(r.hourlyRequired)}/hr</div>
            </div>
            <div>
              <div style={{ opacity: 0.75, fontSize: "0.78rem" }}>Monthly Gross</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{fmt(r.grossMonthlyRequired)}</div>
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
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: t.text }}>{fmt(value)}/mo ({pct.toFixed(0)}%)</span>
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
            Built with IncomeCalc · Free income calculator
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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

function DigestPreviewPage({ user, onBack, isDark, setIsDark, currentTheme, baseTheme, setTheme }: DigestPreviewPageProps) {
  const t = applyDark(currentTheme, isDark);
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
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                {[
                  { label: "Monthly Required", value: fmt(digest.latestScenario.resultsJson.grossMonthlyRequired), delta: digest.deltas.monthlyRequired },
                  { label: "Hourly Rate", value: `${fmt(digest.latestScenario.resultsJson.hourlyRequired)}/hr`, delta: digest.deltas.hourlyRequired },
                  { label: "Health Score", value: `${digest.latestScenario.resultsJson.healthScore}/100`, delta: digest.deltas.healthScore },
                ].map(({ label, value, delta }) => (
                  <div key={label} style={{ padding: "0.75rem", background: isDark ? "#2a2a2f" : "#f9f9fb", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.72rem", color: t.muted, marginBottom: "0.25rem" }}>{label}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: t.text }}>{value}</div>
                    {delta !== null && (
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: label === "Health Score" ? (delta > 0 ? "#22c55e" : "#ef4444") : (delta > 0 ? "#ef4444" : "#22c55e") }}>
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
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "1.5rem",
        textAlign: "center",
        background: "rgba(15,17,21,0.6)",
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
        <Link to="/terms" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Terms</Link>
        <Link to="/privacy" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Privacy</Link>
        <Link to="/refund-policy" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Refund Policy</Link>
        <a href="mailto:support@yourdomain.com" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Contact</a>
      </div>
      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.25)" }}>
        IncomeCalc is not financial, tax, or legal advice. For informational and educational purposes only.
      </div>
    </footer>
  );
}

// ─── Annual Upsell Modal ──────────────────────────────────────────────────────

interface AnnualUpsellModalProps {
  plan: PlanId;
  onAnnual: () => void;
  onMonthly: () => void;
  onClose: () => void;
  t: ThemeConfig;
}

function AnnualUpsellModal({ plan, onAnnual, onMonthly, onClose, t }: AnnualUpsellModalProps) {
  const prices = plan === "premium"
    ? { monthly: 9.99, yearly: 99, savePercent: 17 }
    : { monthly: 4.99, yearly: 49, savePercent: 18 };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="atv-glass-static"
        style={{
          padding: "2rem",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="atv-accent-bar" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#x2728;</div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
          Save with Annual Billing
        </h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Get <strong style={{ color: "#FFFFFF" }}>2 months free</strong> when you switch to annual! Pay ${prices.yearly}/year instead of ${(prices.monthly * 12).toFixed(0)}/year.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            onClick={onAnnual}
            className="atv-btn-primary"
            style={{
              width: "100%",
              padding: "0.85rem",
              fontSize: "1rem",
            }}
          >
            Switch to Annual (Save {prices.savePercent}%)
          </button>
          <button
            onClick={onMonthly}
            className="atv-btn-secondary"
            style={{
              width: "100%",
              padding: "0.85rem",
              fontSize: "1rem",
            }}
          >
            Continue Monthly — ${prices.monthly}/mo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Restore Purchase Modal ───────────────────────────────────────────────────

interface RestorePurchaseModalProps {
  onClose: () => void;
  t: ThemeConfig;
}

function RestorePurchaseModal({ onClose, t }: RestorePurchaseModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "failed">("idle");

  async function handleRestore() {
    if (!email.trim()) return;
    setStatus("loading");
    trackEvent("restore_purchase_attempted", { source_page: "/checkout" });

    try {
      // Look up user by email in local auth store
      const { getCurrentUser, login } = await import("@/lib/auth-store");
      const currentUser = getCurrentUser();
      const userId = currentUser?.id || email.trim();

      const result = await restorePurchase(userId);
      if (result && result.planTier !== "free") {
        localStorage.setItem("incomecalc-tier", result.planTier);
        trackEvent("restore_purchase_success", { plan: result.planTier as "pro" | "premium", source_page: "/checkout" });
        setStatus("success");
      } else {
        trackEvent("restore_purchase_failed", { source_page: "/checkout" });
        setStatus("failed");
      }
    } catch {
      trackEvent("restore_purchase_failed", { source_page: "/checkout" });
      setStatus("failed");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "420px",
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: t.text, marginBottom: "0.75rem" }}>
          Restore Purchase
        </h2>
        {status === "idle" || status === "loading" ? (
          <>
            <p style={{ color: t.muted, fontSize: "0.9rem", marginBottom: "1rem" }}>
              Enter the email you used to purchase a plan.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                fontSize: "0.95rem",
                marginBottom: "1rem",
                background: t.bg,
                color: t.text,
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleRestore}
              disabled={status === "loading"}
              style={{
                width: "100%",
                background: t.primary,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.7rem",
                fontWeight: 700,
                cursor: status === "loading" ? "wait" : "pointer",
                opacity: status === "loading" ? 0.7 : 1,
              }}
            >
              {status === "loading" ? "Checking..." : "Restore"}
            </button>
          </>
        ) : status === "success" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
            <p style={{ color: t.text, fontWeight: 600 }}>Purchase restored! Reload to access your plan.</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: "1rem", background: t.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.5rem", fontWeight: 600, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>❌</div>
            <p style={{ color: t.text, fontWeight: 600, marginBottom: "0.5rem" }}>No active plan found for this email.</p>
            <p style={{ color: t.muted, fontSize: "0.85rem" }}>Contact support@yourdomain.com for help.</p>
            <button
              onClick={onClose}
              style={{ marginTop: "1rem", background: "transparent", color: t.muted, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "0.6rem 1.5rem", fontWeight: 600, cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

const DEFAULT_EXPENSES: ExpenseData = {
  housing: 0,
  food: 0,
  transport: 0,
  healthcare: 0,
  utilities: 0,
  entertainment: 0,
  clothing: 0,
  savings: 0,
  other: 0,
};

function App() {
  const [page, setPage] = useState<Page>("landing");
  const [isDark, setIsDark] = useState(true);
  const [baseTheme, setBaseTheme] = useState<Theme>("default");
  const [expenseData, setExpenseData] = useState<ExpenseData>(DEFAULT_EXPENSES);
  const [taxRate, setTaxRate] = useState(25);
  const [currentGrossIncome, setCurrentGrossIncome] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId>("pro");
  const [userTier] = useState<UserTier>(loadUserTier);
  const [devOverride, setDevOverride] = useState(getDevOverride);

  // ── Auth State ──
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [savePromptPending, setSavePromptPending] = useState(false);
  const [shareModalScenario, setShareModalScenario] = useState<SavedScenario | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  // ── DEV_BYPASS_PAYWALL ──
  const devBypassActive = isDevBypassPaywall();
  const effectiveTier: UserTier = devBypassActive ? "premium" : (devOverride ? (getPlan() as UserTier) : userTier);
  const devBadgeLabel = devBypassActive ? "DEV: PAYWALL BYPASS" : getDevBadgeLabel();
  const currentTheme = THEMES[baseTheme];

  // ── Entitlement sync on startup ──
  const entitlementSynced = useRef(false);
  useEffect(() => {
    if (entitlementSynced.current) return;
    entitlementSynced.current = true;
    const user = getCurrentUser();
    const session = getSession();
    if (user && session) {
      syncPlan(user.id, session.token); // fire-and-forget; updates localStorage
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
    setPage("results");
  }

  function handleStartOver() {
    setExpenseData(DEFAULT_EXPENSES);
    setPage("landing");
  }

  function handleUpgrade(plan: PlanId = "pro") {
    setCheckoutPlan(plan);
    setPage("checkout");
  }

  // ── Auth handlers ──
  function handleSignIn() {
    setAuthModalMode("signin");
    setShowAuthModal(true);
  }

  function handleSignOut() {
    authLogout();
    setCurrentUser(null);
  }

  function handleAuthSuccess(user: AuthUser) {
    setCurrentUser(user);
    // If user signed in to save a scenario, complete the save now
    if (savePromptPending) {
      setSavePromptPending(false);
      doSaveScenario(user);
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
    baseTheme,
    setTheme: setBaseTheme,
  };

  const backToResults = () => setPage(expenseData.housing || expenseData.food ? "results" : "landing");

  // ── Share Page (deep link) ──
  if (page === "share" && shareSlug) {
    return (
      <SharePage
        slug={shareSlug}
        onTryYourOwn={() => { setShareSlug(null); setPage("landing"); }}
        {...sharedProps}
      />
    );
  }

  // ── Dashboard ──
  if (page === "dashboard" && currentUser) {
    return (
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
      </>
    );
  }

  // ── Digest Preview ──
  if (page === "digest-preview" && currentUser) {
    return (
      <DigestPreviewPage
        user={currentUser}
        onBack={backToResults}
        {...sharedProps}
      />
    );
  }

  if (page === "landing") {
    return (
      <Landing
        onStart={() => setPage("calculator")}
        onPricing={() => handleUpgrade("pro")}
        onDevAccess={() => setPage("dev-access")}
        {...sharedProps}
      />
    );
  }

  if (page === "calculator") {
    return (
      <CalculatorPage
        onResults={handleResults}
        onBack={() => setPage("landing")}
        initialData={expenseData}
        initialTaxRate={taxRate}
        initialCurrentIncome={currentGrossIncome}
        {...sharedProps}
      />
    );
  }

  if (page === "checkout") {
    return (
      <CheckoutPage
        onBack={backToResults}
        initialPlan={checkoutPlan}
        {...sharedProps}
      />
    );
  }

  if (page === "simulator") {
    return (
      <SimulatorPage
        initialExpenses={expenseData}
        initialTaxRate={taxRate}
        onBack={backToResults}
        onUpgrade={handleUpgrade}
        userTier={effectiveTier}
        {...sharedProps}
      />
    );
  }

  if (page === "checkin") {
    return (
      <CheckInPage
        currentExpenses={expenseData}
        currentTaxRate={taxRate}
        onBack={backToResults}
        onUpgrade={handleUpgrade}
        onForecast={() => setPage("forecast")}
        userTier={effectiveTier}
        {...sharedProps}
      />
    );
  }

  if (page === "fire") {
    return (
      <FirePage
        onBack={backToResults}
        onUpgrade={handleUpgrade}
        userTier={effectiveTier}
        {...sharedProps}
      />
    );
  }

  if (page === "forecast") {
    return (
      <ForecastPage
        expenses={expenseData}
        taxRate={taxRate}
        onBack={backToResults}
        onUpgrade={handleUpgrade}
        userTier={effectiveTier}
        {...sharedProps}
      />
    );
  }

  if (page === "debt") {
    return (
      <DebtPage
        onBack={backToResults}
        onUpgrade={handleUpgrade}
        userTier={effectiveTier}
        {...sharedProps}
      />
    );
  }

  if (page === "fi") {
    return (
      <FIEstimatorPage
        expenses={expenseData}
        taxRate={taxRate}
        onBack={backToResults}
        onUpgrade={handleUpgrade}
        userTier={effectiveTier}
        {...sharedProps}
      />
    );
  }

  if (page === "dev-access") {
    return (
      <DevAccessPage
        devOverride={devOverride}
        devBadgeLabel={devBadgeLabel}
        effectiveTier={effectiveTier}
        onToggle={handleDevToggle}
        onBack={backToResults}
        {...sharedProps}
      />
    );
  }

  return (
    <>
      <ResultsPage
        data={expenseData}
        taxRate={taxRate}
        currentGrossIncome={currentGrossIncome}
        onBack={handleStartOver}
        onRecalculate={() => setPage("calculator")}
        onUpgrade={handleUpgrade}
        onSimulator={() => setPage("simulator")}
        onCheckIn={() => setPage("checkin")}
        onFire={() => setPage("fire")}
        onForecast={() => setPage("forecast")}
        onDebt={() => setPage("debt")}
        onFI={() => setPage("fi")}
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
      {showAuthModal && (
        <AuthModal
          mode={authModalMode}
          onClose={() => { setShowAuthModal(false); setSavePromptPending(false); }}
          onSuccess={handleAuthSuccess}
          t={applyDark(currentTheme, isDark)}
          isDark={isDark}
        />
      )}
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
    </>
  );
}
