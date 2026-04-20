import { useState, useEffect, useRef, type ReactNode } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  Calculator,
  TrendingUp,
  Home,
  ArrowRight,
  BarChart3,
  Lock,
  FileText,
  Target,
  MessageCircle,
  RefreshCw,
  AlertTriangle,
  Share2,
  Flame,
  Gauge,
  Clock,
  ChevronDown,
  ChevronUp,
  Wallet,
  CalendarCheck,
  Download,
  Save,
  Play,
  Sparkles,
  CheckCircle,
  X,
  Star,
  Milestone,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { trackEvent } from "@/lib/analytics";
import { answerQuestion, type PlanContext } from "@/lib/planRules";
import { computeIncomeGap, computeRunway, computeAlerts } from "@/lib/stabilityMetrics";
import type { CalcOutput } from "@/lib/calc";
import {
  applyDark,
  fmt,
  computeForExpenses,
  loadSnapshots,
  EXPENSE_FIELDS,
  MONO_FONT_STACK,
  hasRealExpenseData,
  type ThemeConfig,
  type UserTier,
  type PlanId,
  type ExpenseData,
} from "@/lib/app-shared";
import { Header } from "@/components/Header";
import { MobileNavShell } from "@/components/mobile/MobileNavShell";
import type { MobileTab } from "@/components/mobile/MobileBottomNav";
import { FormattedNumber } from "@/components/FormattedNumber";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AIFinancialInsights } from "@/components/ai/AIFinancialInsights";
import { AIBudgetInsights } from "@/components/ai/AIBudgetInsights";
import { AIIncomeIdeas } from "@/components/ai/AIIncomeIdeas";
import { AIChat } from "@/components/ai/AIChat";
import { FinancialDiagnosisSection } from "@/components/ai/FinancialDiagnosisSection";
import { getSession, type User as AuthUser } from "@/lib/auth-store";
import { getDisplayName } from "@/lib/user-display";
import { DashboardSidebar } from "@/components/ui/DashboardSidebar";
import { DashboardTopbar } from "@/components/ui/DashboardTopbar";
import { IncomeBarChart } from "@/components/dashboard/IncomeBarChart";
import { ExpenseDonut } from "@/components/dashboard/ExpenseDonut";
import { ScenariosCard } from "@/components/dashboard/ScenariosCard";
import { TopMoveCard } from "@/components/dashboard/TopMoveCard";
import { FirstVisitBanner } from "@/components/dashboard/FirstVisitBanner";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { BudgetPage } from "@/components/pages/BudgetPage";
import { AnalyticsPage } from "@/components/pages/AnalyticsPage";
import { ScenariosPage } from "@/components/pages/ScenariosPage";
import { useBudgetStore } from "@/lib/budget-store";

// ─── AnnualUpsellModal ────────────────────────────────────────────────────────

interface AnnualUpsellModalProps {
  plan: PlanId;
  onAnnual: () => void;
  onMonthly: () => void;
  onClose: () => void;
  t: ThemeConfig;
}

export function AnnualUpsellModal({ plan, onAnnual, onMonthly, onClose, t }: AnnualUpsellModalProps) {
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
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: "16px",
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
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text, marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
          Save with Annual Billing
        </h2>
        <p style={{ color: t.muted, fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Get <strong style={{ color: t.text }}>2 months free</strong> when you switch to annual! Pay <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>${prices.yearly}</span>/year instead of <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>${(prices.monthly * 12).toFixed(0)}</span>/year.
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
            Continue Monthly — <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>${prices.monthly}</span>/mo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RestorePurchaseModal ─────────────────────────────────────────────────────

interface RestorePurchaseModalProps {
  onClose: () => void;
  t: ThemeConfig;
}

export function RestorePurchaseModal({ onClose, t }: RestorePurchaseModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "failed">("idle");

  async function handleRestore() {
    if (!email.trim()) return;
    setStatus("loading");
    trackEvent("restore_purchase_attempted", { source_page: "/checkout" });

    try {
      const { getCurrentUser, getSession } = await import("@/lib/auth-store");
      const currentUser = getCurrentUser();
      const session = getSession();
      const userId = currentUser?.id || email.trim();
      const token = session?.token || "";

      const resp = await fetch("/api/entitlement", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Id": userId,
        },
      });

      if (resp.ok) {
        const data = (await resp.json()) as { plan?: string; status?: string };
        if (data.plan && data.plan !== "free" && data.status !== "expired") {
          localStorage.setItem("incomecalc-tier", data.plan);
          trackEvent("restore_purchase_success", { plan: data.plan as "pro" | "premium", source_page: "/checkout" });
          setStatus("success");
          return;
        }
      }

      trackEvent("restore_purchase_failed", { source_page: "/checkout" });
      setStatus("failed");
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
            <p style={{ color: t.muted, fontSize: "0.85rem" }}>Contact incomecalcai@proton.me for help.</p>
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

// ─── AskYourPlan ──────────────────────────────────────────────────────────────

interface AskYourPlanProps {
  data: ExpenseData;
  taxRate: number;
  outputs: CalcOutput;
  t: ThemeConfig;
  isDark: boolean;
  onSimulator: () => void;
  userTier: UserTier;
  onUpgrade: (plan?: PlanId) => void;
  initialQuestion?: string | null;
}

function AskYourPlan({ data, taxRate, outputs, t, isDark, onSimulator, userTier, onUpgrade, initialQuestion }: AskYourPlanProps) {
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

  // Auto-trigger initial question from outer suggestion buttons
  const initialHandled = useRef(false);
  useEffect(() => {
    if (initialQuestion && !initialHandled.current) {
      initialHandled.current = true;
      handleQuestion(initialQuestion);
    }
  }, [initialQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

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

// ─── ResultsPage ──────────────────────────────────────────────────────────────

export interface ResultsPageProps {
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
  userTier: UserTier;
  onDevAccess?: () => void;
  onSaveScenario?: () => void;
  onDashboard?: () => void;
  currentUser?: AuthUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onDigestPreview?: () => void;
  fromGuidedFlow?: boolean;
}

function resolveActiveTab(currentView: string): MobileTab {
  if (currentView === "dashboard") return "dashboard";
  if (currentView === "scenarios") return "scenarios";
  return "more";
}

function FadeIn({ opacity, setOpacity, children }: { opacity: number; setOpacity: (v: number) => void; children: ReactNode }) {
  useEffect(() => { requestAnimationFrame(() => setOpacity(1)); }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  return <div style={{ opacity, transition: "opacity 400ms ease" }}>{children}</div>;
}

export function ResultsPage({
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
  userTier,
  onDevAccess,
  onSaveScenario,
  onDashboard,
  currentUser,
  onSignIn,
  onSignOut,
  onDigestPreview,
  fromGuidedFlow,
}: ResultsPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const { customBudgets, setCustomBudget, clearCustomBudget, clearAllCustomBudgets } = useBudgetStore();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const [askPlanOpen, setAskPlanOpen] = useState(false);
  const [askPlanQuestion, setAskPlanQuestion] = useState<string | null>(null);
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState<string | null>(null);
  const [showBudgetInsights, setShowBudgetInsights] = useState(false);
  const [showIncomeIdeas, setShowIncomeIdeas] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showBudgetAnalysis, setShowBudgetAnalysis] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [budgetOpacity, setBudgetOpacity] = useState(0);
  const [ideasOpacity, setIdeasOpacity] = useState(0);

  // Progressive reveal: for free users, Budget Insights is locked so onGenerated never fires.
  // Trigger showIncomeIdeas after a short delay once Budget Insights section appears.
  useEffect(() => {
    if (showBudgetInsights && userTier === "free") {
      const timer = setTimeout(() => setShowIncomeIdeas(true), 600);
      return () => clearTimeout(timer);
    }
  }, [showBudgetInsights, userTier]);

  const [moreToolsOpen, setMoreToolsOpen] = useState(() => {
    try { return sessionStorage.getItem("incomecalc-tools-expanded") === "true"; } catch { return false; }
  });

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
  // FIX 4: Cap healthLabel at "Fair" if runway < 1 month or 2+ critical alerts
  const criticalAlertCount = alerts.filter((a) => a.severity === "critical").length;
  const healthLabel = (runway.months < 1 || criticalAlertCount >= 2)
    ? (outputs.healthLabel === "Excellent" || outputs.healthLabel === "Good" ? "Fair" : outputs.healthLabel)
    : outputs.healthLabel;
  const healthColor =
    healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#84cc16" : healthScore >= 40 ? "#f59e0b" : "#ef4444";

  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    setAnimatedScore(0);
    const id = setInterval(() => {
      setAnimatedScore((prev) => {
        if (prev >= healthScore) { clearInterval(id); return healthScore; }
        return prev + 1;
      });
    }, 20);
    return () => clearInterval(id);
  }, [healthScore]);

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

  // ─── Dashboard data ───────────────────────────────────────────────
  const DONUT_COLORS = [
    "#1B4332", "#40916C", "#52B788", "#74C69D", "#95D5B2",
    "#B7E4C7", "#D8F3DC", "#2D6A4F", "#081C15",
  ];
  const donutSlices = breakdownItems.map((item, i) => ({
    label: item.label,
    value: item.value,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const topExpense = breakdownItems[0];
  const topExpenseSuggestion = topExpense
    ? topExpense.pct > 35
      ? `${topExpense.label} represents ${topExpense.pct.toFixed(0)}% of your budget — well above the recommended 30%. Consider ways to reduce this category.`
      : `${topExpense.label} is your largest expense at ${topExpense.pct.toFixed(0)}% of budget. Explore alternatives to free up cash flow.`
    : "";

  const scenarioSuggestions = [
    {
      title: "Reduce housing by 10%",
      description: "Find a cheaper rent or refinance your mortgage",
      impact: data.housing * 0.1,
      progress: Math.min(100, housingPct > 30 ? 30 : 70),
    },
    {
      title: "Cut discretionary 15%",
      description: "Optimize entertainment and clothing spend",
      impact: (data.entertainment + data.clothing) * 0.15,
      progress: savingsRate >= 20 ? 80 : 40,
    },
    {
      title: "Boost savings to 20%",
      description: "Automate transfers to reach the savings benchmark",
      impact: Math.max(0, totalMonthly * 0.2 - data.savings),
      progress: Math.min(100, savingsRate / 20 * 100),
    },
  ];

  const isDesktop = typeof window !== "undefined" ? window.innerWidth > 980 : true;

  // Shared CSV export handler (reused by Analytics page)
  const handleExportCsv = () => {
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
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: isDesktop && !isMobile ? "240px 1fr" : "1fr", minHeight: "100vh" }}>
        {/* Sidebar — desktop only */}
        {isDesktop && !isMobile && (
          <DashboardSidebar
            t={t}
            isDark={isDark}
            setIsDark={setIsDark}
            activeItem={currentView}
            onNavigate={(view) => {
              // In-page sub-views
              if (["dashboard", "budget", "analytics", "scenarios"].includes(view)) {
                setCurrentView(view);
                const mainEl = document.querySelector("[data-main-content]");
                if (mainEl) mainEl.scrollTo(0, 0);
                return;
              }
              // App-level page navigation
              if (view === "calculator") onRecalculate();
              else if (view === "simulator") onSimulator();
              else if (view === "diagnosis") {
                setCurrentView("dashboard");
                setShowFullReport(true);
                // scroll to diagnosis after a tick
                requestAnimationFrame(() => {
                  const el = document.getElementById("diagnosis-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                });
              }
              // settings — not yet implemented
            }}
            onSignOut={onSignOut}
          />
        )}

        {/* Main content */}
        <div data-main-content style={{ minHeight: "100vh", overflow: "auto" }}>
          {/* Mobile: show Header; Desktop: hide it */}
          {(!isDesktop || isMobile) && (
            <>
              <div className="atv-ambient-bg">
                <div className="atv-ambient-teal" />
              </div>
              <Header
                isDark={isDark}
                setIsDark={setIsDark}
                currentTheme={currentTheme}
                onLogoClick={onBack}
                onDevAccess={onDevAccess}
                accountUser={currentUser}
                onSignIn={onSignIn}
                onDashboard={onDashboard}
                onDigestPreview={onDigestPreview}
                onSignOut={onSignOut}
              />
            </>
          )}

          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "72px 1rem calc(80px + env(safe-area-inset-bottom, 0px))" : isDesktop ? "2rem 2rem 4rem" : "96px 1.5rem 4rem", position: "relative", zIndex: 1 }}>

            {/* ─── Budget view ─────────────────────────────────────────── */}
            {currentView === "budget" && (
              <BudgetPage
                t={t}
                isDark={isDark}
                expenses={breakdownItems.map((item) => ({ category: item.label, amount: item.value }))}
                totalExpenses={totalMonthly}
                grossMonthlyIncome={grossMonthly}
                onBack={() => setCurrentView("dashboard")}
                customBudgets={customBudgets}
                onSetCustomBudget={setCustomBudget}
                onClearCustomBudget={clearCustomBudget}
                onClearAllCustomBudgets={clearAllCustomBudgets}
              />
            )}

            {/* ─── Analytics view ──────────────────────────────────────── */}
            {currentView === "analytics" && (
              <AnalyticsPage
                t={t}
                isDark={isDark}
                grossMonthlyIncome={grossMonthly}
                netMonthlyIncome={grossMonthly - taxMonthly}
                totalExpenses={totalMonthly}
                expenses={breakdownItems.map((item) => ({ category: item.label, amount: item.value }))}
                healthScore={healthScore}
                taxRate={taxRate}
                annualRequired={grossAnnual}
                currentAnnualIncome={currentGrossIncome}
                onBack={() => setCurrentView("dashboard")}
                onExportCsv={handleExportCsv}
              />
            )}

            {/* ─── Scenarios view ──────────────────────────────────────── */}
            {currentView === "scenarios" && (
              <ScenariosPage
                t={t}
                isDark={isDark}
                expenses={breakdownItems.map((item) => ({ category: item.label, amount: item.value }))}
                totalExpenses={totalMonthly}
                grossMonthlyIncome={grossMonthly}
                annualRequired={grossAnnual}
                currentAnnualIncome={currentGrossIncome}
                taxRate={taxRate}
                healthScore={healthScore}
                onBack={() => setCurrentView("dashboard")}
                onSimulator={onSimulator}
              />
            )}

            {/* ─── Dashboard view (default) ────────────────────────────── */}
            {currentView === "dashboard" && <>
            {/* Dashboard Topbar */}
            <DashboardTopbar
              t={t}
              isDark={isDark}
              isMobile={isMobile}
              userName={getDisplayName(currentUser) || "there"}
              onSimulator={onSimulator}
              alerts={hasRealExpenseData(data) ? alerts : []}
              onNavigate={(view) => {
                if (["dashboard", "budget", "analytics", "scenarios"].includes(view)) {
                  setCurrentView(view);
                  const mainEl = document.querySelector("[data-main-content]");
                  if (mainEl) mainEl.scrollTo(0, 0);
                }
              }}
              onDashboard={onDashboard}
              onSignOut={onSignOut}
              userEmail={currentUser?.email}
              currentUser={currentUser}
              subtitle={hasRealExpenseData(data) ? undefined : "Let's get started"}
            />

            {!hasRealExpenseData(data) ? (
              <DashboardEmptyState currentUser={currentUser} onGetStarted={onRecalculate} />
            ) : <>

            {/* First-visit welcome banner */}
            {currentUser && (() => {
              const session = getSession();
              return session ? (
                <FirstVisitBanner
                  t={t}
                  isDark={isDark}
                  userId={currentUser.id}
                  sessionToken={session.token}
                  requiredIncomeMonthly={grossMonthly > 0 ? grossMonthly : null}
                />
              ) : null;
            })()}

            {/* 4-Metric Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <MetricCard label="Annual Gross" value={grossAnnual} sub="Required income" color={t.primary} t={t} />
              <MetricCard label="Monthly Gross" value={grossMonthly} sub="Before taxes" color={t.text} t={t} />
              <MetricCard label="Monthly Net" value={totalMonthly} sub="After taxes" color={t.success} t={t} />
              <MetricCard label="Hourly Rate" value={hourlyRate} sub="40hrs/week" suffix="/hr" color={t.text} t={t} />
            </div>

            {/* 2-Column Charts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <IncomeBarChart
                t={t}
                isDark={isDark}
                currentIncome={currentGrossIncome / 12}
                requiredIncome={grossMonthly}
                isMobile={isMobile}
              />
              <ExpenseDonut
                t={t}
                slices={donutSlices}
                total={totalMonthly}
                isMobile={isMobile}
              />
            </div>

            {/* 2-Column: Scenarios + Top Move */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <ScenariosCard
                t={t}
                scenarios={scenarioSuggestions}
                onSimulator={onSimulator}
              />
              {topExpense && (
                <TopMoveCard
                  t={t}
                  category={topExpense.label}
                  amount={topExpense.value}
                  percentOfTotal={topExpense.pct}
                  suggestion={topExpenseSuggestion}
                  onSimulator={onSimulator}
                />
              )}
            </div>

            {/* Show Full Report toggle */}
            <button
              onClick={() => setShowFullReport(!showFullReport)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                cursor: "pointer",
                color: t.text,
                fontWeight: 600,
                fontSize: 14,
                width: "100%",
                justifyContent: "center",
                marginBottom: showFullReport ? "1.5rem" : 0,
              }}
            >
              {showFullReport ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showFullReport ? "Hide full report" : "Show full report"}
            </button>

            {showFullReport && (
            <div>
        <div className="atv-fade-in" style={{ marginBottom: "2rem" }}>
          {fromGuidedFlow ? (
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
              ← Back to Your Plan
            </button>
          ) : (
            <button
              onClick={onRecalculate}
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
              ← Edit expenses
            </button>
          )}
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: t.muted, margin: "0 0 0.35rem" }}>
            Your Income Report
          </div>
          <p style={{ color: t.muted, fontSize: "0.95rem", margin: 0 }}>
            That covers <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(totalMonthly)}</span>/mo in expenses at a <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{taxRate}%</span> effective tax rate.
          </p>
        </div>

        {/* Hero card */}
        <div
          className="atv-fade-in"
          style={{
            background: isDark ? `${t.primary}10` : `${t.primary}08`,
            border: `1px solid ${t.border}`,
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "1.25rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Gradient accent bar at top */}
          <div className="atv-accent-bar" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
          <div style={{ fontSize: "0.9rem", color: t.muted, marginBottom: "0.5rem" }}>
            You need to earn at least
          </div>
          <div className="atv-number-glow" style={{ lineHeight: 1.1 }}>
            <FormattedNumber value={grossAnnual} fontSize="clamp(2.5rem, 6vw, 4rem)" fontWeight={700} color={t.text} centsColor={t.muted} style={{ letterSpacing: "-0.03em" }} />
          </div>
          <div style={{ fontSize: "0.9rem", color: t.muted, marginTop: "0.25rem" }}>per year</div>
          {userTier === "free" && (
            <>
              <p style={{ fontSize: "0.9rem", color: t.muted, fontStyle: "italic", margin: "0.75rem 0 0" }}>
                Most people who see this number don't know what's pulling it up. The diagnosis does.
              </p>
              <p style={{ margin: "0.35rem 0 0" }}>
                <span
                  onClick={() => document.getElementById("diagnosis-section")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ fontSize: "0.9rem", color: t.primary, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
                >
                  See what's driving it &rarr;
                </span>
              </p>
            </>
          )}
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
              { label: "Monthly gross", val: grossMonthly, suffix: "" },
              { label: "Hourly rate", val: hourlyRate, suffix: "/hr" },
              { label: "Monthly taxes", val: taxMonthly, suffix: "" },
            ].map(({ label, val, suffix }) => (
              <div key={label}>
                <div style={{ color: t.muted, fontSize: "0.8rem" }}>{label}</div>
                <div className="atv-number-glow">
                  <FormattedNumber value={val} suffix={suffix} fontSize="1.1rem" fontWeight={600} color={t.text} centsColor={t.muted} />
                </div>
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
          <MetricCard label="Gross Income/mo" value={grossMonthly} sub="Before taxes" color={t.primary} t={t} />
          <MetricCard label="Taxes Paid/mo" value={taxMonthly} sub={`${taxRate}% effective rate`} color="#ef4444" t={t} />
          <MetricCard label="Net Take-Home/mo" value={totalMonthly} sub="After taxes" color="#22c55e" t={t} />
        </div>

        {/* Health score 2.0 */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <SectionHeader
            label="Financial Health Score"
            t={t}
            right={
              <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
                <span style={{ fontWeight: 700, color: healthColor, fontSize: "1.1rem" }}>{animatedScore}</span>
                <span style={{ fontWeight: 400, color: t.muted, fontSize: "1.1rem" }}>/100</span>
                <span style={{ fontWeight: 500, color: t.muted, fontSize: "0.95rem" }}> — {healthLabel}</span>
              </span>
            }
          />
          <Progress value={healthScore} className="h-3" />

          {/* Sub-scores */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem", marginTop: "1.25rem" }}>
            {subScores.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.82rem", color: t.text, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: "0.78rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}><span style={{ fontWeight: 700, color: s.color }}>{s.value}</span><span style={{ fontWeight: 400, color: t.muted }}>/100</span></span>
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
            {savingsRate >= 30 && !outputs.savingsHeavy && " Excellent savings discipline! You're on a strong financial path."}
            {outputs.savingsHeavy && " You're saving aggressively (60%+ of budget). Consider optimizing allocation between emergency fund, investments, and debt paydown."}
          </p>
        </div>

        {/* Income Gap Meter */}
        {currentGrossIncome > 0 && (
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <SectionHeader
              icon={<Gauge size={18} style={{ color: incomeGap.hasGap ? "#ef4444" : "#22c55e" }} />}
              label="Income Gap"
              t={t}
            />

            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: incomeGap.hasGap ? "#ef4444" : "#22c55e",
                marginBottom: "0.5rem",
                fontFamily: MONO_FONT_STACK,
                fontFeatureSettings: "'tnum', 'zero'",
              }}
            >
              {incomeGap.hasGap
                ? `You are short ${fmt(Math.abs(incomeGap.gapMonthly))}/month`
                : `You have ${fmt(Math.abs(incomeGap.gapMonthly))}/month surplus`}
            </div>

            {/* Horizontal meter */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: t.muted, marginBottom: "0.3rem" }}>
                <span>Current: <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(incomeGap.currentMonthly)}</span>/mo</span>
                <span>Required: <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(incomeGap.requiredMonthly)}</span>/mo</span>
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
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <SectionHeader
            icon={<Clock size={18} style={{ color: runway.level === "Strong" ? "#22c55e" : runway.level === "Stable" ? "#84cc16" : runway.level === "Fragile" ? "#f59e0b" : "#ef4444" }} />}
            label="Financial Runway"
            t={t}
            right={
              <StatusPill
                label={runway.level}
                variant={runway.level === "Strong" || runway.level === "Stable" ? "good" : runway.level === "Fragile" ? "warning" : "danger"}
              />
            }
          />
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
            <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{runway.months.toFixed(1)}</span> months
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
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <SectionHeader
              icon={<AlertTriangle size={18} style={{ color: "#f59e0b" }} />}
              label={`${alerts.length} Active Alert${alerts.length !== 1 ? "s" : ""}`}
              t={t}
            />
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
            <div style={{ width: "min(420px, 100%)", background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
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
                  <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`, display: "inline-grid", placeItems: "center", marginBottom: "0.5rem" }}>
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3L17 15H13L10 9.5L7 15H3L10 3Z" fill="white"/>
                      <line x1="6" y1="13" x2="14" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: t.text }}>Financial Stability Report</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Stability Score */}
                  <div style={{ background: t.cardBg, borderRadius: "16px", padding: "1rem", textAlign: "center", border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: "0.78rem", color: t.muted, marginBottom: "0.25rem" }}>Stability Score</div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 900, color: healthColor, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{healthScore}</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: healthColor }}>{healthLabel}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                    {/* Runway */}
                    <div style={{ background: t.cardBg, borderRadius: "10px", padding: "0.85rem", textAlign: "center", border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: "0.72rem", color: t.muted, marginBottom: "0.2rem" }}>Runway</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: runway.level === "Strong" ? "#22c55e" : runway.level === "Stable" ? "#84cc16" : runway.level === "Fragile" ? "#f59e0b" : "#ef4444", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
                        {runway.months.toFixed(1)}mo
                      </div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: t.muted }}>{runway.level}</div>
                    </div>

                    {/* Income Gap */}
                    <div style={{ background: t.cardBg, borderRadius: "10px", padding: "0.85rem", textAlign: "center", border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: "0.72rem", color: t.muted, marginBottom: "0.2rem" }}>Income Gap</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: currentGrossIncome > 0 ? (incomeGap.hasGap ? "#ef4444" : "#22c55e") : t.muted, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
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
                    const canvas = document.createElement("canvas");
                    const scale = 2;
                    canvas.width = card.offsetWidth * scale;
                    canvas.height = card.offsetHeight * scale;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    ctx.scale(scale, scale);
                    ctx.fillStyle = isDark ? "#1a1a1f" : "#ffffff";
                    ctx.fillRect(0, 0, card.offsetWidth, card.offsetHeight);
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

        {/* ═══ SECTION 2: Your Next Steps ═══ */}
        <div style={{ marginTop: "2rem", marginBottom: "1rem" }}>
          <div style={{ height: "3px", borderRadius: "2px", background: `linear-gradient(90deg, ${t.primary}, ${t.accent})`, marginBottom: "1rem" }} />
          <SectionHeader
            icon={<Sparkles size={18} style={{ color: t.primary }} />}
            label="Your Next Steps"
            t={t}
          />
        </div>

        {/* AI Financial Diagnosis — premium structured analysis */}
        <div id="diagnosis-section">
        <FinancialDiagnosisSection
          data={data}
          taxRate={taxRate}
          grossAnnual={grossAnnual}
          grossMonthly={grossMonthly}
          totalMonthly={totalMonthly}
          savingsRate={savingsRate}
          healthScore={healthScore}
          hourlyRate={hourlyRate}
          fragilityScore={outputs.fragilityScore}
          debtRatio={outputs.ratios.debtRatio}
          emergencyFundTarget={outputs.emergencyFundTarget}
          userTier={userTier}
          onUpgrade={onUpgrade}
          onSimulator={onSimulator}
          t={t}
          isDark={isDark}
        />
        </div>

        {/* Open in Simulator + Check-In cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
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
              borderRadius: "16px",
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

        {/* ═══ SECTION 3: More Tools & Insights (collapsible) ═══ */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0 0" }}>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${t.border}, transparent)` }} />
          <button
            onClick={() => setMoreToolsOpen((v) => { const next = !v; try { sessionStorage.setItem("incomecalc-tools-expanded", String(next)); } catch {} return next; })}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 0.75rem",
              fontSize: "0.78rem",
              minHeight: "44px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: t.muted,
              whiteSpace: "nowrap",
            }}
          >
            {moreToolsOpen ? "Show Less" : "More Tools & Insights"}
            {moreToolsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(270deg, ${t.border}, transparent)` }} />
        </div>

        <div
          style={{
            overflow: "hidden",
            transition: "max-height 0.4s ease, opacity 0.3s ease",
            maxHeight: moreToolsOpen ? "8000px" : "0px",
            opacity: moreToolsOpen ? 1 : 0,
          }}
        >
        <div style={{ paddingTop: "1.25rem" }}>

        {/* Expense breakdown (moved from Section 1) */}
        {breakdownItems.length > 0 && (
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <SectionHeader label="Expense Breakdown" t={t} />
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
                      <span style={{ fontSize: "0.8rem", color: t.muted, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(value)}</span>
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

        {/* Budget Analysis */}
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            onClick={() => setShowBudgetAnalysis(!showBudgetAnalysis)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 14,
              fontWeight: 500,
              color: t.primary,
              cursor: "pointer",
            }}
          >
            {showBudgetAnalysis ? "Hide budget analysis ↑" : "View full budget analysis →"}
          </button>
          {showBudgetAnalysis && (
            <div style={{ marginTop: 16 }}>
              <BudgetPage
                t={t}
                isDark={isDark}
                expenses={breakdownItems.map((item) => ({ category: item.label, amount: item.value }))}
                totalExpenses={totalMonthly}
                grossMonthlyIncome={grossMonthly}
                customBudgets={customBudgets}
                onSetCustomBudget={setCustomBudget}
                onClearCustomBudget={clearCustomBudget}
                onClearAllCustomBudgets={clearAllCustomBudgets}
              />
            </div>
          )}
        </div>

        {/* Analytics */}
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 14,
              fontWeight: 500,
              color: t.primary,
              cursor: "pointer",
            }}
          >
            {showAnalytics ? "Hide detailed analytics ↑" : "View detailed analytics →"}
          </button>
          {showAnalytics && (
            <div style={{ marginTop: 16 }}>
              <AnalyticsPage
                t={t}
                isDark={isDark}
                grossMonthlyIncome={grossMonthly}
                netMonthlyIncome={grossMonthly - taxMonthly}
                totalExpenses={totalMonthly}
                expenses={breakdownItems.map((item) => ({ category: item.label, amount: item.value }))}
                healthScore={healthScore}
                taxRate={taxRate}
                annualRequired={grossAnnual}
                currentAnnualIncome={currentGrossIncome}
                onExportCsv={handleExportCsv}
              />
            </div>
          )}
        </div>

        {/* Scenarios */}
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            onClick={() => setShowScenarios(!showScenarios)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 14,
              fontWeight: 500,
              color: t.primary,
              cursor: "pointer",
            }}
          >
            {showScenarios ? "Hide all scenarios ↑" : "View all scenarios →"}
          </button>
          {showScenarios && (
            <div style={{ marginTop: 16 }}>
              <ScenariosPage
                t={t}
                isDark={isDark}
                expenses={breakdownItems.map((item) => ({ category: item.label, amount: item.value }))}
                totalExpenses={totalMonthly}
                grossMonthlyIncome={grossMonthly}
                annualRequired={grossAnnual}
                currentAnnualIncome={currentGrossIncome}
                taxRate={taxRate}
                healthScore={healthScore}
                onSimulator={onSimulator}
              />
            </div>
          )}
        </div>

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
                borderRadius: "16px",
                padding: "1.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <TrendingUp size={18} style={{ color: "#22c55e" }} />
                <div style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Savings Potential Analysis</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                {top3.map(({ label, value }) => {
                  const saving = Math.round(value * (reductionPct / 100));
                  return (
                    <div key={label} style={{ padding: "0.65rem 0.85rem", background: t.primary + "10", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.75rem", color: t.muted, marginBottom: "0.2rem" }}>{label}</div>
                      <div style={{ fontSize: "0.85rem", color: t.text, marginBottom: "0.15rem" }}>Current: <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(value)}</span>/mo</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#22c55e", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>Save {fmt(saving)}/mo ({reductionPct}% cut)</div>
                    </div>
                  );
                })}
                <div style={{ padding: "0.65rem 0.85rem", background: "#22c55e15", borderRadius: "8px", border: "1px solid #22c55e30" }}>
                  <div style={{ fontSize: "0.75rem", color: t.muted, marginBottom: "0.2rem" }}>Total Annual Savings</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#22c55e", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(Math.round(totalSavings * 12))}/year</div>
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
              borderRadius: "16px",
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
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
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
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: `${t.primary}26`,
                  border: `2px solid ${t.primary}4D`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={20} className="atv-lock-icon-glow" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, color: t.text, marginBottom: "0.25rem" }}>Savings Potential</div>
                <div style={{ fontSize: "0.85rem", color: t.muted }}>
                  See exactly where you could save{" "}
                  <span style={{ color: t.primary, fontWeight: 700 }}>
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
                borderRadius: "16px",
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
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", minWidth: "420px", fontSize: "0.75rem", borderCollapse: "collapse", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600, whiteSpace: "nowrap" }}>Month</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600, whiteSpace: "nowrap" }}>Income</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600, whiteSpace: "nowrap" }}>Expenses</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600, whiteSpace: "nowrap" }}>Net</th>
                      <th style={{ textAlign: "right", padding: "0.35rem 0.5rem", color: t.muted, fontWeight: 600, whiteSpace: "nowrap" }}>Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${t.border}20` }}>
                        <td style={{ padding: "0.3rem 0.5rem", color: t.text, fontWeight: 600, whiteSpace: "nowrap" }}>{d.label}</td>
                        <td style={{ padding: "0.3rem 0.5rem", textAlign: "right", color: "#22c55e", whiteSpace: "nowrap" }}>{fmt(d.income)}</td>
                        <td style={{ padding: "0.3rem 0.5rem", textAlign: "right", color: t.text, whiteSpace: "nowrap" }}>{fmt(d.expenses)}</td>
                        <td style={{ padding: "0.3rem 0.5rem", textAlign: "right", color: d.net >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700, whiteSpace: "nowrap" }}>{d.net >= 0 ? "+" : ""}{fmt(d.net)}</td>
                        <td style={{ padding: "0.3rem 0.5rem", textAlign: "right", color: d.cumulative >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700, whiteSpace: "nowrap" }}>{d.cumulative >= 0 ? "+" : ""}{fmt(d.cumulative)}</td>
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
              borderRadius: "16px",
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
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: `${t.primary}26`,
                  border: `2px solid ${t.primary}4D`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={20} className="atv-lock-icon-glow" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, color: t.text, marginBottom: "0.25rem" }}>12-Month Cashflow Forecast</div>
                <div style={{ fontSize: "0.85rem", color: t.muted, lineHeight: 1.5 }}>
                  {grossMonthly > totalMonthly
                    ? <>See whether your <span style={{ color: t.primary, fontWeight: 600 }}>{fmt(Math.round(grossMonthly - totalMonthly))}/mo surplus</span> holds up over 12 months</>
                    : <>See how your expenses track against income month by month — and where pressure builds</>
                  }
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
                <Lock size={14} />
                See My 12-Month Forecast
              </button>
            </div>
          </div>
        )}

        {/* Share Stability Score + FIRE CTA row (moved from Section 1) */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <button
            onClick={() => setShareCardOpen(true)}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
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
              borderRadius: "16px",
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

        {/* Feature Nav: Forecast, Debt, FI (moved from Section 1) */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <button
            onClick={onForecast}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
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
              borderRadius: "16px",
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
              borderRadius: "16px",
              padding: "1rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
              <Milestone size={14} style={{ color: t.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "0.82rem" }}>FI Date</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.65rem", background: "#f59e0b20", color: "#f59e0b", borderRadius: "4px", padding: "0 4px", fontWeight: 600, border: "1px solid #f59e0b40" }}>Premium</span>
            </div>
          </button>
        </div>

        </div>{/* end paddingTop wrapper */}
        </div>{/* end collapsible wrapper */}

        {/* AI Financial Insight Engine */}
        <AIFinancialInsights
          data={data}
          taxRate={taxRate}
          grossAnnual={grossAnnual}
          grossMonthly={grossMonthly}
          totalMonthly={totalMonthly}
          savingsRate={savingsRate}
          healthScore={healthScore}
          hourlyRate={hourlyRate}
          t={t}
          isDark={isDark}
          onGenerated={() => setShowBudgetInsights(true)}
        />

        {/* Live AI Budget Insights — revealed after Financial Insights generates */}
        {showBudgetInsights && (
          <FadeIn opacity={budgetOpacity} setOpacity={setBudgetOpacity}>
            {userTier === "free" ? (
              <div
                style={{
                  position: "relative",
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "16px",
                  padding: "1.5rem",
                  marginBottom: "1.25rem",
                  minHeight: "120px",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Sparkles size={18} style={{ color: t.primary }} />
                  <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>AI Budget Insights</span>
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
                    borderRadius: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: `${t.primary}26`,
                      border: `2px solid ${t.primary}4D`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Lock size={20} className="atv-lock-icon-glow" />
                  </div>
                  <button
                    onClick={() => onUpgrade("pro")}
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
                    Unlock with Pro
                  </button>
                </div>
              </div>
            ) : (
              <AIBudgetInsights
                data={data}
                taxRate={taxRate}
                grossAnnual={grossAnnual}
                grossMonthly={grossMonthly}
                totalMonthly={totalMonthly}
                t={t}
                isDark={isDark}
                onGenerated={() => setShowIncomeIdeas(true)}
              />
            )}
          </FadeIn>
        )}

        {/* Live AI Income Ideas — revealed after Budget Insights generates */}
        {showIncomeIdeas && (
          <FadeIn opacity={ideasOpacity} setOpacity={setIdeasOpacity}>
            {userTier === "free" ? (
              <div
                style={{
                  position: "relative",
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "16px",
                  padding: "1.5rem",
                  marginBottom: "1.25rem",
                  minHeight: "120px",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Sparkles size={18} style={{ color: "#f59e0b" }} />
                  <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>AI Income Ideas</span>
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
                    borderRadius: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: `${t.primary}26`,
                      border: `2px solid ${t.primary}4D`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Lock size={20} className="atv-lock-icon-glow" />
                  </div>
                  <button
                    onClick={() => onUpgrade("pro")}
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
                    Unlock with Pro
                  </button>
                </div>
              </div>
            ) : (
              <AIIncomeIdeas
                data={data}
                grossAnnual={grossAnnual}
                totalMonthly={totalMonthly}
                t={t}
                isDark={isDark}
              />
            )}
          </FadeIn>
        )}

        {/* AI Action Plan */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "16px",
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

        {/* Ask Your Plan panel */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "16px",
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
          {!askPlanOpen && (
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
                  onClick={() => { setAskPlanQuestion(q); setAskPlanOpen(true); }}
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
          )}
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
              initialQuestion={askPlanQuestion}
            />
          )}
          {!askPlanOpen && (
            <button
              onClick={() => { setAskPlanQuestion(null); setAskPlanOpen(true); }}
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

        {/* Export block - unlocked for Pro+ */}
        {(userTier === "pro" || userTier === "premium") ? (
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "16px",
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
              borderRadius: "16px",
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
                borderRadius: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} className="atv-lock-icon-glow" />
                <span style={{ fontWeight: 600, color: t.text }}>Export features require Pro</span>
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

        {/* Premium upsell — inside collapsible, at the end */}
        {userTier === "free" && (
        <div
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}12, ${currentTheme.accent}08)`,
            border: `1px solid ${currentTheme.primary}30`,
            borderRadius: "16px",
            padding: "1.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <Star size={16} style={{ color: "#f59e0b" }} />
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Go deeper on your numbers</span>
          </div>
          <p style={{ color: t.muted, fontSize: "0.9rem", margin: "0 0 1.25rem" }}>
            You've seen where you stand. Upgrade to test changes, get a full diagnosis, and make stronger decisions.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Pro card */}
            <div
              style={{
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: "16px",
                padding: "0.85rem 1rem",
                flex: 1,
                minWidth: "160px",
              }}
            >
              <div style={{ fontWeight: 700, color: t.text, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Pro</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: t.primary }}>
                $4.99<span style={{ fontSize: "0.75rem", fontWeight: 400, color: t.muted }}>/mo</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: t.muted, marginBottom: "0.6rem" }}>or $49/year</div>
              <div style={{ fontSize: "0.78rem", color: t.muted, lineHeight: 1.55, marginBottom: "0.75rem" }}>
                <div style={{ marginBottom: "0.3rem" }}>✓ <span style={{ color: t.text, fontWeight: 500 }}>Build custom scenarios</span> and compare outcomes</div>
                <div style={{ marginBottom: "0.3rem" }}>✓ <span style={{ color: t.text, fontWeight: 500 }}>Edit any expense</span> and see the score impact</div>
                <div>✓ <span style={{ color: t.text, fontWeight: 500 }}>Find the trade-offs</span> that improve your position most</div>
              </div>
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
                borderRadius: "16px",
                padding: "0.85rem 1rem",
                flex: 1,
                minWidth: "160px",
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
              <div style={{ fontSize: "0.75rem", color: "#fff", opacity: 0.75, marginBottom: "0.6rem" }}>or $99/year</div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.55, marginBottom: "0.75rem" }}>
                <div style={{ marginBottom: "0.3rem" }}>✓ <span style={{ color: "#fff", fontWeight: 500 }}>Full AI diagnosis</span> with ranked actions</div>
                <div style={{ marginBottom: "0.3rem" }}>✓ <span style={{ color: "#fff", fontWeight: 500 }}>12-month forecast</span> and savings analysis</div>
                <div>✓ <span style={{ color: "#fff", fontWeight: 500 }}>Everything in Pro</span> plus deeper decision support</div>
              </div>
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
        )}


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
            {fromGuidedFlow ? "Back to Your Plan" : "Start Over"}
          </button>
        </div>
            </div>
            )}
            </>}</>}
          </div>
        </div>
      </div>

      {/* Floating AI Chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: "fixed",
            bottom: isMobile ? "calc(72px + env(safe-area-inset-bottom, 0px))" : "1.5rem",
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

      {/* Mobile bottom nav */}
      {isMobile && (
        <MobileNavShell
          t={t}
          activeTab={resolveActiveTab(currentView)}
          onTabChange={(tab) => {
            switch (tab) {
              case "dashboard": setCurrentView("dashboard"); break;
              case "calculator": onRecalculate(); break;
              case "diagnosis":
                setCurrentView("dashboard");
                setShowFullReport(true);
                requestAnimationFrame(() => {
                  const el = document.getElementById("diagnosis-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                });
                break;
              case "scenarios": setCurrentView("scenarios"); break;
            }
          }}
          onMoreNavigate={(id) => {
            if (id === "budget") { setCurrentView("budget"); return; }
            if (id === "analytics") { setCurrentView("analytics"); return; }
            if (id === "simulator") { onSimulator(); return; }
            if (id === "forecast") { onForecast(); return; }
            if (id === "fire") { onFire(); return; }
            if (id === "fi") { onFI(); return; }
            if (id === "debt") { onDebt(); return; }
          }}
          onSignOut={onSignOut ?? (() => {})}
        />
      )}
    </div>
  );
}
