import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  Target,
  Lock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Beaker,
} from "lucide-react";
import {
  applyDark,
  fmt,
  computeForExpenses,
  EXPENSE_FIELDS,
  MONO_FONT_STACK,
  type ThemeConfig,
  type UserTier,
  type PlanId,
  type ExpenseData,
} from "@/lib/app-shared";
import { computeIncomeGap, computeRunway, computeAlerts } from "@/lib/stabilityMetrics";
import { trackEvent } from "@/lib/analytics";
import { FinancialDiagnosisSection } from "@/components/ai/FinancialDiagnosisSection";
import { SignupPromptCard } from "@/components/auth/SignupPromptCard";
import { capturePendingData } from "@/lib/pending-signup-data";
import { readIntent, getIntentSnapshotCopy } from "@/lib/intent";
import { Header } from "@/components/Header";
import {
  StepHeader,
  EditorialCard,
  CountUpNumber,
  CTAButton,
  Reveal,
  FONT_STACK,
  eyebrow as eyebrowStyle,
} from "@/components/editorial";
import type { User as AuthUser } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GuidedFlowPageProps {
  data: ExpenseData;
  taxRate: number;
  currentGrossIncome: number;
  step: number;
  onStepChange: (step: number) => void;
  onBack: () => void;
  onRecalculate: () => void;
  onUpgrade: (plan?: PlanId) => void;
  onSimulator: () => void;
  onResults: () => void;
  onSaveScenario?: () => void;
  onDashboard?: () => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  currentUser?: AuthUser | null;
  onSignup?: () => void;
}

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { label: "Snapshot" },
  { label: "Diagnosis" },
  { label: "Top Move" },
  { label: "Your Plan" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fieldLabel(field: keyof ExpenseData): string {
  return EXPENSE_FIELDS.find((f) => f.name === field)?.label ?? field;
}

// ─── Top Move logic ─────────────────────────────────────────────────────────

interface TopMoveResult {
  title: string;
  description: string;
  field: keyof ExpenseData;
  currentValue: number;
  adjustedValue: number;
  currentHealth: number;
  projectedHealth: number;
}

function computeTopMove(data: ExpenseData, taxRate: number, outputs: ReturnType<typeof computeForExpenses>): TopMoveResult {
  const { ratios } = outputs;
  const totalMonthly = outputs.monthlyExpensesTotal;

  // FIX 2: Each branch checks that the diff > 0 before recommending
  if (ratios.rentRatio > 0.4 && data.housing > 0) {
    const nonHousing = totalMonthly - data.housing;
    const targetHousing = Math.round((0.35 / 0.65) * nonHousing);
    const adjustedVal = Math.min(data.housing, targetHousing);
    const diff = data.housing - adjustedVal;
    if (diff > 0) {
      const adjusted = { ...data, housing: adjustedVal };
      const projectedOut = computeForExpenses(adjusted, taxRate);
      return {
        title: `Cut ${fieldLabel("housing")} by ${fmt(diff)}/mo`,
        description: `Housing is ${(ratios.rentRatio * 100).toFixed(0)}% of your budget, well above the safe 35% threshold. Dropping from ${fmt(data.housing)} to ${fmt(adjustedVal)}/mo brings it to ~35% and meaningfully improves your stability.`,
        field: "housing",
        currentValue: data.housing,
        adjustedValue: adjustedVal,
        currentHealth: outputs.healthScore,
        projectedHealth: projectedOut.healthScore,
      };
    }
  }

  if (ratios.debtRatio > 0.2 && data.other > 0) {
    const nonDebt = totalMonthly - data.other;
    const targetDebt = Math.round((0.15 / 0.85) * nonDebt);
    const adjustedVal = Math.min(data.other, targetDebt);
    const diff = data.other - adjustedVal;
    if (diff > 0) {
      const adjusted = { ...data, other: adjustedVal };
      const projectedOut = computeForExpenses(adjusted, taxRate);
      return {
        title: `Reduce ${fieldLabel("other")} by ${fmt(diff)}/mo`,
        description: `Debt and other costs are ${(ratios.debtRatio * 100).toFixed(0)}% of your budget, above the recommended 15%. Bringing them from ${fmt(data.other)} down to ${fmt(adjustedVal)}/mo frees up cash flow for savings and emergencies.`,
        field: "other",
        currentValue: data.other,
        adjustedValue: adjustedVal,
        currentHealth: outputs.healthScore,
        projectedHealth: projectedOut.healthScore,
      };
    }
  }

  if (ratios.savingsRatio < 0.1) {
    const nonSavings = totalMonthly - data.savings;
    const targetSavings = Math.round((0.15 / 0.85) * nonSavings);
    const adjustedVal = Math.max(data.savings, targetSavings);
    const diff = adjustedVal - data.savings;
    if (diff > 0) {
      const adjusted = { ...data, savings: adjustedVal };
      const projectedOut = computeForExpenses(adjusted, taxRate);
      return {
        title: `Add ${fmt(diff)}/mo to ${fieldLabel("savings")}`,
        description: `You're only saving ${(ratios.savingsRatio * 100).toFixed(0)}% of your budget. Increasing from ${fmt(data.savings)} to ${fmt(adjustedVal)}/mo builds a real safety net and significantly improves your health score.`,
        field: "savings",
        currentValue: data.savings,
        adjustedValue: adjustedVal,
        currentHealth: outputs.healthScore,
        projectedHealth: projectedOut.healthScore,
      };
    }
  }

  // Fallback: reduce largest non-savings, non-zero expense by 10%
  const nonZeroFields = (["housing", "food", "transport", "healthcare", "utilities", "entertainment", "clothing", "other"] as const)
    .filter((f) => data[f] > 0);
  if (nonZeroFields.length > 0) {
    const largestField = nonZeroFields.reduce((a, b) => (data[a] >= data[b] ? a : b));
    const reducedValue = Math.round(data[largestField] * 0.9);
    const diff = data[largestField] - reducedValue;
    if (diff > 0) {
      const adjusted = { ...data, [largestField]: reducedValue };
      const projectedOut = computeForExpenses(adjusted, taxRate);
      return {
        title: `Trim ${fieldLabel(largestField)} by ${fmt(diff)}/mo`,
        description: `A 10% reduction in ${fieldLabel(largestField)} (${fmt(data[largestField])} → ${fmt(reducedValue)}/mo) would improve your position.`,
        field: largestField,
        currentValue: data[largestField],
        adjustedValue: reducedValue,
        currentHealth: outputs.healthScore,
        projectedHealth: projectedOut.healthScore,
      };
    }
  }

  // Ultimate fallback: no actionable move (all expenses at $0 or negligible)
  return {
    title: "Start building an emergency fund",
    description: "Your expenses are minimal. Focus on setting aside savings to build a financial buffer.",
    field: "savings",
    currentValue: data.savings,
    adjustedValue: data.savings,
    currentHealth: outputs.healthScore,
    projectedHealth: outputs.healthScore,
  };
}

// ─── Snapshot interpretation ─────────────────────────────────────────────────

function buildInterpretation(
  healthScore: number,
  data: ExpenseData,
  totalMonthly: number,
  ratios: { rentRatio: number; debtRatio: number; transportRatio: number; savingsRatio: number },
): string {
  // Find the single biggest pressure
  const pressures: { label: string; pct: number; threshold: number }[] = [];
  if (ratios.rentRatio > 0.35) pressures.push({ label: "housing", pct: ratios.rentRatio * 100, threshold: 35 });
  if (ratios.debtRatio > 0.15) pressures.push({ label: "debt", pct: ratios.debtRatio * 100, threshold: 15 });
  if (ratios.savingsRatio < 0.1 && data.savings < totalMonthly * 0.1) pressures.push({ label: "low savings", pct: ratios.savingsRatio * 100, threshold: 10 });
  pressures.sort((a, b) => (b.pct - b.threshold) - (a.pct - a.threshold));

  const pressure = pressures[0];
  const pressureSuffix = pressure
    ? pressure.label === "low savings"
      ? ` — savings are only ${pressure.pct.toFixed(0)}% of your budget.`
      : ` — ${pressure.label} is consuming ${pressure.pct.toFixed(0)}% of your budget.`
    : ".";

  if (healthScore >= 80) return `That's a strong position` + pressureSuffix;
  if (healthScore >= 60) return `That's a decent position, with room to improve` + pressureSuffix;
  if (healthScore >= 40) return `That's a position under pressure` + pressureSuffix;
  return `That's a fragile position` + pressureSuffix;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GuidedFlowPage({
  data,
  taxRate,
  currentGrossIncome,
  step,
  onStepChange,
  onBack,
  onRecalculate,
  onUpgrade,
  onSimulator,
  onResults,
  onSaveScenario,
  onDashboard,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
  currentUser,
  onSignup,
}: GuidedFlowPageProps) {
  const t = applyDark(currentTheme, isDark);
  const setStep = onStepChange;

  // ── Signup prompt dismiss (per-session) ──
  const DISMISS_KEY = "ascentra-signup-prompt-dismissed";
  const [promptDismissed, setPromptDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "true";
  });

  const showSignupPrompt = !currentUser && !promptDismissed && step < 3;

  const handlePromptDismiss = () => {
    setPromptDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "true"); } catch { /* incognito */ }
    trackEvent("signup_prompt_dismissed", { step });
  };

  const handleSignupClick = () => {
    trackEvent("signup_prompt_clicked", { step, variant: step === 0 ? "inline" : "sticky" });
    // Capture current expense snapshot to sessionStorage before opening auth modal
    capturePendingData({
      expenseData: data,
      taxRate,
      currentGrossIncome,
      grossMonthlyRequired: grossMonthly,
      healthScore,
      capturedAt: Date.now(),
      intent: readIntent(),
    });
    if (onSignup) { onSignup(); }
  };

  // ── Track first prompt render ──
  const promptShownRef = useRef(false);
  useEffect(() => {
    if (showSignupPrompt && !promptShownRef.current) {
      promptShownRef.current = true;
      trackEvent("signup_prompt_shown", { step });
    }
  }, [showSignupPrompt, step]);

  // Shared calculation
  const outputs = computeForExpenses(data, taxRate);
  const totalMonthly = outputs.monthlyExpensesTotal;
  const grossMonthly = outputs.grossMonthlyRequired;
  const grossAnnual = outputs.annualGrossRequired;
  const hourlyRate = outputs.hourlyRequired;
  const savingsRate = totalMonthly > 0 ? (data.savings / totalMonthly) * 100 : 0;

  // Stability metrics
  const incomeGap = computeIncomeGap(grossAnnual, currentGrossIncome);
  const runway = computeRunway(outputs.emergencyFundTarget, totalMonthly);
  const alerts = computeAlerts(outputs, runway.months, data.savings);

  // Health
  const healthScore = outputs.healthScore;
  // FIX 4: Cap healthLabel at "Fair" if runway < 1 month or 2+ critical alerts
  const criticalAlertCount = alerts.filter((a) => a.severity === "critical").length;
  const healthLabel = (runway.months < 1 || criticalAlertCount >= 2)
    ? (outputs.healthLabel === "Excellent" || outputs.healthLabel === "Good" ? "Fair" : outputs.healthLabel)
    : outputs.healthLabel;
  // Signal colours aligned to the editorial brand palette (green on data only).
  const healthColor =
    healthScore >= 80 ? t.success : healthScore >= 60 ? t.accent : healthScore >= 40 ? t.warning : t.danger;

  const interpretation = buildInterpretation(healthScore, data, totalMonthly, outputs.ratios);

  // Top move
  const topMove = computeTopMove(data, taxRate, outputs);
  const healthDelta = topMove.projectedHealth - topMove.currentHealth;

  const hasPaidAccess = userTier === "pro" || userTier === "premium";

  // ── Analytics: track step views ──
  const STEP_NAMES = ["snapshot_viewed", "diagnosis_viewed", "top_move_viewed", "your_plan_viewed"] as const;
  const trackedSteps = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (trackedSteps.current.has(step)) return;
    trackedSteps.current.add(step);
    trackEvent("guided_step_viewed", {
      step_name: STEP_NAMES[step],
      step_index: step,
      user_tier: userTier,
      health_score: healthScore,
      source_page: "guided",
    });
  }, [step]);

  function goNext() { if (step < STEPS.length - 1) setStep(step + 1); }
  function goPrev() { if (step > 0) setStep(step - 1); }

  // Step-specific CTA labels
  const nextLabel = step === 0 ? "See What's Driving It" : step === 1 ? "See Top Move" : step === 2 ? "See Your Plan" : "";

  const mono = { fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" } as const;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: FONT_STACK }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "96px 1.5rem 4rem", paddingBottom: showSignupPrompt && (step === 1 || step === 2) ? "88px" : "48px" }}>
        {/* Back */}
        <button
          onClick={onBack}
          className="lp-in lp-underline"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontFamily: "inherit" }}
        >
          <ChevronLeft size={16} /> Back
        </button>

        {/* ── Progress rail (editorial) ─────────────────────────── */}
        <div className="lp-in" style={{ display: "flex", alignItems: "center", marginBottom: "2.25rem", ["--lp-delay" as string]: "60ms" }}>
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isCompleted = i < step;
            const dotColor = isActive ? t.text : isCompleted ? t.primary : t.border;
            return (
              <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                <button
                  onClick={() => isCompleted && setStep(i)}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "none", cursor: isCompleted ? "pointer" : "default", padding: 0 }}
                >
                  <span style={{ width: isActive ? 9 : 7, height: isActive ? 9 : 7, borderRadius: "50%", background: dotColor, transition: "background 0.2s, width 0.2s, height 0.2s", flexShrink: 0 }} />
                  <span style={{ ...eyebrowStyle, fontWeight: isActive ? 700 : 500, color: isActive ? t.text : isCompleted ? t.primary : t.subtle, whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span style={{ flex: 1, height: 1, background: isCompleted ? t.primary : t.border, margin: "0 0.7rem", opacity: isCompleted ? 0.5 : 1 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 0: Snapshot ─────────────────────────────────── */}
        {step === 0 && (() => {
          // Biggest expense category
          const biggestField = (["housing", "food", "transport", "healthcare", "utilities", "entertainment", "clothing", "other"] as const)
            .filter((f) => data[f] > 0)
            .reduce((a, b) => (data[a] >= data[b] ? a : b), "housing" as keyof ExpenseData);
          const biggestPct = totalMonthly > 0 ? ((data[biggestField] / totalMonthly) * 100).toFixed(0) : "0";

          const intentCopy = getIntentSnapshotCopy(readIntent());

          return (
            <div className="lp-page">
              {/* Intent-specific framing */}
              {intentCopy && (
                <div style={{ fontSize: 15, color: t.muted, lineHeight: 1.55, fontStyle: "italic", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
                  {intentCopy}
                </div>
              )}

              {/* Dominant reveal — the funnel's signature number */}
              <div className="lp-in" style={{ marginBottom: "1.75rem", ["--lp-delay" as string]: "120ms" }}>
                <div style={{ ...eyebrowStyle, color: t.muted, marginBottom: "0.6rem" }}>Your financial reality</div>
                <h2 style={{ fontSize: "2rem", fontWeight: 600, color: t.text, margin: "0 0 0.5rem", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                  You need to earn{" "}
                  <CountUpNumber value={grossMonthly} prefix="$" startOnView={false} style={{ color: t.text, fontWeight: 700 }} />
                  <span style={{ color: t.muted, fontWeight: 500 }}>/month</span>
                </h2>
                <p style={{ fontSize: "0.95rem", color: t.muted, margin: 0, lineHeight: 1.55 }}>
                  That covers <span style={mono}>{fmt(totalMonthly)}</span>/mo in expenses at a <span style={mono}>{taxRate}%</span> effective tax rate.
                </p>
              </div>

              {/* Supporting facts — staggered reveal */}
              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <Reveal delay={240} style={{ flex: 1, minWidth: "120px" }}>
                  <EditorialCard t={t} padding="0.9rem" style={{ display: "flex", alignItems: "center", gap: "0.75rem", height: "100%" }}>
                    <CountUpNumber value={healthScore} startOnView={false} style={{ fontSize: "1.75rem", fontWeight: 700, color: healthColor, lineHeight: 1 }} />
                    <span>
                      <span style={{ ...eyebrowStyle, color: t.subtle, display: "block" }}>Health</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: healthColor }}>{healthLabel}</span>
                    </span>
                  </EditorialCard>
                </Reveal>

                <Reveal delay={300} style={{ flex: 1, minWidth: "120px" }}>
                  <EditorialCard t={t} padding="0.9rem" style={{ height: "100%" }}>
                    <span style={{ ...eyebrowStyle, color: t.subtle, display: "block", marginBottom: "0.25rem" }}>You need to earn</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text, ...mono }}>{fmt(grossAnnual)}<span style={{ fontSize: "0.78rem", fontWeight: 500, color: t.muted, fontFamily: FONT_STACK }}>/yr gross</span></span>
                  </EditorialCard>
                </Reveal>

                <Reveal delay={360} style={{ flex: 1, minWidth: "120px" }}>
                  <EditorialCard t={t} padding="0.9rem" style={{ height: "100%" }}>
                    <span style={{ ...eyebrowStyle, color: t.subtle, display: "block", marginBottom: "0.25rem" }}>Biggest cost</span>
                    <span style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text }}>{fieldLabel(biggestField)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: t.muted, ...mono }}>({biggestPct}%)</span></span>
                  </EditorialCard>
                </Reveal>
              </div>

              {/* Income gap — single line */}
              {currentGrossIncome > 0 && (() => {
                const surplusButFragile = !incomeGap.hasGap && healthScore < 70;
                const gapColor = incomeGap.hasGap ? t.danger : surplusButFragile ? t.warning : t.success;

                return (
                  <Reveal delay={420}>
                    <div style={{ fontSize: "0.85rem", color: gapColor, fontWeight: 600, marginBottom: "1rem", padding: "0.65rem 0.9rem", background: `color-mix(in srgb, ${gapColor} 7%, transparent)`, borderRadius: "10px", border: `1px solid color-mix(in srgb, ${gapColor} 20%, transparent)` }}>
                      {incomeGap.hasGap
                        ? <>Income gap: you need <span style={mono}>{fmt(incomeGap.gapMonthly)}</span>/mo more than your current income covers.</>
                        : surplusButFragile
                          ? <>You earn enough to cover expenses (<span style={mono}>+{fmt(Math.abs(incomeGap.gapMonthly))}</span>/mo), but your financial structure is still under pressure.</>
                          : <>No income gap — you have <span style={mono}>{fmt(Math.abs(incomeGap.gapMonthly))}</span>/mo surplus.</>
                      }
                    </div>
                  </Reveal>
                );
              })()}

              {/* Alerts — quiet context */}
              {alerts.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  {alerts.map((alert) => (
                    <div key={alert.id} style={{ padding: "0.5rem 0", marginBottom: "0.35rem", display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.8rem", color: t.muted }}>
                      <AlertTriangle size={12} style={{ color: alert.severity === "critical" ? t.danger : t.warning, flexShrink: 0 }} />
                      <span><span style={{ fontWeight: 600, color: t.text }}>{alert.title}</span> — {alert.explanation}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Signup prompt — inline */}
              {showSignupPrompt && step === 0 && (
                <SignupPromptCard t={t} isDark={isDark} variant="inline" onSignup={handleSignupClick} onDismiss={handlePromptDismiss} />
              )}

              {/* Bridge to Diagnosis */}
              {healthScore < 80 && (
                <p style={{ fontSize: "0.84rem", color: t.muted, margin: "0.5rem 0 0", lineHeight: 1.5, fontStyle: "italic" }}>
                  {healthScore < 50
                    ? "Your numbers reveal structural risk that surplus income alone won't fix. The diagnosis will show you exactly what's driving it."
                    : healthScore < 70
                      ? "There's room to strengthen your position. The diagnosis will pinpoint what to change first."
                      : "You're in good shape overall. The diagnosis can help you optimize further."
                  }
                </p>
              )}
            </div>
          );
        })()}

        {/* ── Step 1: Diagnosis ────────────────────────────────── */}
        {step === 1 && (
          <div className="lp-page">
            <StepHeader
              title="Financial Diagnosis"
              subtitle={
                alerts.length > 0
                  ? `Your health score is ${healthScore}/100 with ${alerts.length} active alert${alerts.length > 1 ? "s" : ""}. Here's a deeper look at what's driving it.`
                  : `Your health score is ${healthScore}/100. Here's a deeper look at your financial position.`
              }
              t={t}
              size="h2"
            />
            <div style={{ marginTop: "1.5rem" }}>
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
          </div>
        )}

        {/* ── Step 2: Top Move + Scenario Lab CTA ─────────────── */}
        {step === 2 && (
          <div className="lp-page">
            <StepHeader title="Your Top Move" subtitle="The single change with the biggest impact on your score." t={t} size="h2" />

            {/* Recommendation card */}
            <Reveal delay={120}>
              <EditorialCard t={t} padding="1.5rem" style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                  <Target size={18} style={{ color: t.primary }} />
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text, letterSpacing: "-0.01em" }}>{topMove.title}</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: t.muted, lineHeight: 1.55, margin: "0 0 1.25rem" }}>{topMove.description}</p>

                {/* Before → After inline */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem", borderRadius: "12px", background: t.bg, border: `1px solid ${t.border}` }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ ...eyebrowStyle, color: t.subtle, marginBottom: "0.25rem" }}>Now</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: healthColor, lineHeight: 1, ...mono }}>{topMove.currentHealth}</div>
                    <div style={{ fontSize: "0.72rem", color: t.muted, marginTop: "0.15rem", ...mono }}>{fmt(topMove.currentValue)}/mo</div>
                  </div>

                  <ArrowRight size={18} style={{ color: t.subtle, flexShrink: 0 }} />

                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ ...eyebrowStyle, color: t.subtle, marginBottom: "0.25rem" }}>After</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: healthDelta > 0 ? t.success : healthColor, lineHeight: 1, ...mono }}>{topMove.projectedHealth}</div>
                    <div style={{ fontSize: "0.72rem", color: t.muted, marginTop: "0.15rem", ...mono }}>{fmt(topMove.adjustedValue)}/mo</div>
                  </div>

                  {healthDelta !== 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", background: `color-mix(in srgb, ${healthDelta > 0 ? t.success : t.danger} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${healthDelta > 0 ? t.success : t.danger} 22%, transparent)`, borderRadius: "999px", padding: "0.25rem 0.6rem", fontSize: "0.78rem", fontWeight: 700, color: healthDelta > 0 ? t.success : t.danger, flexShrink: 0 }}>
                      {healthDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span style={mono}>{healthDelta > 0 ? "+" : ""}{healthDelta}</span>
                    </div>
                  )}
                </div>
              </EditorialCard>
            </Reveal>

            {/* Scenario Lab CTA */}
            <Reveal delay={200}>
              <EditorialCard t={t} padding="1rem 1.25rem" style={{ background: t.primarySoft, borderColor: `color-mix(in srgb, ${t.primary} 22%, transparent)`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: t.text, marginBottom: "0.15rem" }}>Want to test this?</div>
                  <div style={{ fontSize: "0.8rem", color: t.muted, lineHeight: 1.4 }}>
                    Open the Scenario Lab to try this change and compare outcomes side by side.
                  </div>
                </div>
                <CTAButton t={t} isDark={isDark} size="sm" onClick={() => { trackEvent("scenario_lab_opened", { user_tier: userTier, guided_step: step, source_page: "guided" }); onSimulator(); }}>
                  Open Scenario Lab
                </CTAButton>
              </EditorialCard>
            </Reveal>
          </div>
        )}

        {/* ── Step 3: Your Plan (conclusion) ────────────────────── */}
        {step === 3 && (
          <div className="lp-page">
            <StepHeader title="Your Plan" t={t} size="h2" />

            {/* Summary */}
            <Reveal delay={120}>
              <EditorialCard t={t} padding="1.15rem" style={{ marginTop: "1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ textAlign: "center", minWidth: "56px" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: healthColor, lineHeight: 1, ...mono }}>{healthScore}</div>
                  <div style={{ ...eyebrowStyle, color: t.subtle, marginTop: "0.2rem" }}>Health</div>
                </div>
                <div style={{ fontSize: "0.88rem", color: t.text, lineHeight: 1.5 }}>
                  {healthDelta > 0
                    ? <>Your top move — <span style={{ fontWeight: 700 }}>{topMove.title.toLowerCase()}</span> — could bring your score to <span style={{ fontWeight: 700, color: t.success, ...mono }}>{topMove.projectedHealth}</span>. Test it in the Scenario Lab to see the full impact.</>
                    : healthScore < 40
                      ? <>Your position needs work across multiple areas. Start with <span style={{ fontWeight: 700 }}>{topMove.title.toLowerCase()}</span>, then use the Scenario Lab to test further changes.</>
                      : healthScore < 60
                        ? <>Your top move — <span style={{ fontWeight: 700 }}>{topMove.title.toLowerCase()}</span> — is a solid starting point. Use the Scenario Lab to test combinations and find the strongest path forward.</>
                        : <>Your ratios are in a healthy range. Use the Scenario Lab to explore what-if scenarios and fine-tune your position.</>
                  }
                </div>
              </EditorialCard>
            </Reveal>

            {/* Primary CTA: Scenario Lab */}
            <Reveal delay={200}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <CTAButton t={t} isDark={isDark} size="lg" onClick={() => { trackEvent("scenario_lab_opened", { user_tier: userTier, guided_step: step, source_page: "guided" }); onSimulator(); }}>
                  Open Scenario Lab
                </CTAButton>
              </div>

              {/* Secondary actions row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <CTAButton t={t} variant="secondary" size="sm" style={{ justifyContent: "center", width: "100%" }} onClick={() => { trackEvent("adjust_expenses_clicked", { user_tier: userTier, source_page: "guided" }); onRecalculate(); }}>
                  Adjust Expenses
                </CTAButton>
                {hasPaidAccess && onSaveScenario ? (
                  <CTAButton t={t} variant="secondary" size="sm" style={{ justifyContent: "center", width: "100%" }} onClick={onSaveScenario}>
                    Save Scenario
                  </CTAButton>
                ) : (
                  <CTAButton t={t} variant="secondary" size="sm" style={{ justifyContent: "center", width: "100%" }} onClick={() => { trackEvent("full_breakdown_opened", { user_tier: userTier, source_page: "guided" }); onResults(); }}>
                    Full Breakdown
                  </CTAButton>
                )}
              </div>
            </Reveal>

            {/* Tertiary link: Full Breakdown (shown when Save Scenario takes the grid slot) */}
            {hasPaidAccess && onSaveScenario ? (
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <button
                  onClick={() => { trackEvent("full_breakdown_opened", { user_tier: userTier, source_page: "guided" }); onResults(); }}
                  className="lp-underline"
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.78rem", color: t.muted, padding: "0.25rem", fontFamily: "inherit" }}
                >
                  View full breakdown
                </button>
              </div>
            ) : null}

            {/* Upgrade CTA for free users */}
            {!hasPaidAccess && (
              <Reveal delay={260}>
                <EditorialCard t={t} padding="1.25rem" style={{ background: t.primarySoft, borderColor: `color-mix(in srgb, ${t.primary} 30%, transparent)` }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: t.text, marginBottom: "0.35rem" }}>
                    {healthScore < 60
                      ? "Your score is " + healthScore + " — there's real room to improve"
                      : "You've seen the snapshot — now work the problem"
                    }
                  </div>
                  <div style={{ fontSize: "0.82rem", color: t.muted, lineHeight: 1.55, marginBottom: "0.95rem" }}>
                    {healthScore < 60
                      ? "Pro lets you build custom scenarios, test different expense changes, and find the specific combination that moves your score the most. See exactly which trade-offs are worth making before you commit."
                      : "Pro lets you build and compare scenarios side by side, test real trade-offs, and find the strongest path from here. One change helped — now find the combination that helps the most."
                    }
                  </div>
                  <CTAButton t={t} isDark={isDark} size="sm" onClick={() => { trackEvent("upgrade_intent", { user_tier: userTier, source_page: "guided", plan: "pro" }); onUpgrade("pro"); }}>
                    <Lock size={13} /> Upgrade to Pro
                  </CTAButton>
                </EditorialCard>
              </Reveal>
            )}
          </div>
        )}

        {/* ── Step navigation ──────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2.5rem", paddingTop: "1.25rem", borderTop: `1px solid ${t.border}` }}>
          {step > 0 ? (
            <CTAButton t={t} variant="secondary" size="sm" onClick={goPrev}>
              <ArrowLeft size={13} /> Back
            </CTAButton>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <CTAButton t={t} isDark={isDark} size="md" onClick={goNext}>
              {nextLabel}
            </CTAButton>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Signup prompt — sticky bar for Diagnosis & Top Move steps */}
      {showSignupPrompt && (step === 1 || step === 2) && (
        <SignupPromptCard t={t} isDark={isDark} variant="sticky" onSignup={handleSignupClick} onDismiss={handlePromptDismiss} />
      )}
    </div>
  );
}
