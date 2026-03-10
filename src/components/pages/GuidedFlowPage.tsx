import { useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  Activity,
  Stethoscope,
  Target,
  BarChart3,
  Lock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Beaker,
} from "lucide-react";
import {
  applyDark,
  fmt,
  computeForExpenses,
  EXPENSE_FIELDS,
  type ThemeConfig,
  type Theme,
  type UserTier,
  type PlanId,
  type ExpenseData,
} from "@/lib/app-shared";
import { computeIncomeGap, computeRunway, computeAlerts } from "@/lib/stabilityMetrics";
import { trackEvent } from "@/lib/analytics";
import { FinancialDiagnosisSection } from "@/components/ai/FinancialDiagnosisSection";
import { Header } from "@/components/Header";

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
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
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

  if (ratios.rentRatio > 0.4) {
    const target = Math.round(totalMonthly * 0.35);
    const adjustedVal = Math.min(data.housing, target);
    const adjusted = { ...data, housing: adjustedVal };
    const projectedOut = computeForExpenses(adjusted, taxRate);
    const diff = data.housing - adjustedVal;
    return {
      title: `Cut ${fieldLabel("housing")} by ${fmt(diff)}/mo`,
      description: `Housing is ${(ratios.rentRatio * 100).toFixed(0)}% of your budget, well above the safe 40% threshold. Dropping from ${fmt(data.housing)} to ${fmt(adjustedVal)}/mo brings it to ~35% and meaningfully improves your stability.`,
      field: "housing",
      currentValue: data.housing,
      adjustedValue: adjustedVal,
      currentHealth: outputs.healthScore,
      projectedHealth: projectedOut.healthScore,
    };
  }

  if (ratios.debtRatio > 0.2) {
    const target = Math.round(totalMonthly * 0.15);
    const adjustedVal = Math.min(data.other, target);
    const adjusted = { ...data, other: adjustedVal };
    const projectedOut = computeForExpenses(adjusted, taxRate);
    const diff = data.other - adjustedVal;
    return {
      title: `Reduce ${fieldLabel("other")} by ${fmt(diff)}/mo`,
      description: `Debt and other costs are ${(ratios.debtRatio * 100).toFixed(0)}% of your budget, above the recommended 20%. Bringing them from ${fmt(data.other)} down to ${fmt(adjustedVal)}/mo frees up cash flow for savings and emergencies.`,
      field: "other",
      currentValue: data.other,
      adjustedValue: adjustedVal,
      currentHealth: outputs.healthScore,
      projectedHealth: projectedOut.healthScore,
    };
  }

  if (ratios.savingsRatio < 0.1) {
    const target = Math.round(totalMonthly * 0.15);
    const adjustedVal = Math.max(data.savings, target);
    const adjusted = { ...data, savings: adjustedVal };
    const projectedOut = computeForExpenses(adjusted, taxRate);
    const diff = adjustedVal - data.savings;
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

  // Fallback: reduce largest non-savings expense by 10%
  const largestField: keyof ExpenseData = (["housing", "food", "transport", "healthcare", "utilities", "entertainment", "clothing", "other"] as const)
    .reduce((a, b) => (data[a] >= data[b] ? a : b));
  const reducedValue = Math.round(data[largestField] * 0.9);
  const diff = data[largestField] - reducedValue;
  const adjusted = { ...data, [largestField]: reducedValue };
  const projectedOut = computeForExpenses(adjusted, taxRate);
  return {
    title: `Trim ${fieldLabel(largestField)} by ${fmt(diff)}/mo`,
    description: `Your ratios are within safe ranges. A 10% reduction in ${fieldLabel(largestField)} (${fmt(data[largestField])} → ${fmt(reducedValue)}/mo) would still improve your position.`,
    field: largestField,
    currentValue: data[largestField],
    adjustedValue: reducedValue,
    currentHealth: outputs.healthScore,
    projectedHealth: projectedOut.healthScore,
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
  baseTheme,
  setTheme,
}: GuidedFlowPageProps) {
  const t = applyDark(currentTheme, isDark);
  const setStep = onStepChange;

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
  const healthLabel = outputs.healthLabel;
  const healthColor =
    healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#84cc16" : healthScore >= 40 ? "#f59e0b" : "#ef4444";

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
  const nextLabel = step === 0 ? "Get Diagnosis" : step === 1 ? "See Top Move" : step === 2 ? "See Your Plan" : "";

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF" }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        {/* Back */}
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>

        {/* ── Progress bar (minimal) ──────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                <button
                  onClick={() => isCompleted && setStep(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    background: "transparent",
                    border: "none",
                    cursor: isCompleted ? "pointer" : "default",
                    padding: 0,
                  }}
                >
                  <div style={{
                    width: isActive ? "10px" : "8px",
                    height: isActive ? "10px" : "8px",
                    borderRadius: "50%",
                    background: isActive ? t.primary : isCompleted ? t.primary : t.border,
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? t.text : isCompleted ? t.primary : t.muted,
                    whiteSpace: "nowrap",
                  }}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: "1px", background: isCompleted ? t.primary + "50" : t.border, margin: "0 0.6rem" }} />
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

          return (
            <div>
              {/* Dominant reveal */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Your Financial Reality</div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: "0 0 0.35rem", lineHeight: 1.2 }}>
                  Your life currently requires <span style={{ color: t.primary }}>{fmt(totalMonthly)}/month</span>
                </h2>
                <p style={{ fontSize: "0.95rem", color: t.muted, margin: 0, lineHeight: 1.5 }}>
                  {interpretation}
                </p>
              </div>

              {/* Supporting facts — compact row */}
              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                {/* Health Score badge */}
                <div style={{
                  flex: 1,
                  minWidth: "120px",
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                  padding: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: healthColor, lineHeight: 1 }}>{healthScore}</div>
                  <div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>Health</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: healthColor }}>{healthLabel}</div>
                  </div>
                </div>

                {/* Gross required */}
                <div style={{
                  flex: 1,
                  minWidth: "120px",
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                  padding: "0.85rem",
                }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.15rem" }}>You need to earn</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text }}>{fmt(grossAnnual)}<span style={{ fontSize: "0.78rem", fontWeight: 500, color: t.muted }}>/yr gross</span></div>
                </div>

                {/* Biggest pressure */}
                <div style={{
                  flex: 1,
                  minWidth: "120px",
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                  padding: "0.85rem",
                }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.15rem" }}>Biggest cost</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text }}>{fieldLabel(biggestField)} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: t.muted }}>({biggestPct}%)</span></div>
                </div>
              </div>

              {/* Income gap — single line */}
              {currentGrossIncome > 0 && (
                <div style={{
                  fontSize: "0.85rem",
                  color: incomeGap.hasGap ? "#ef4444" : "#22c55e",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  padding: "0.6rem 0.85rem",
                  background: incomeGap.hasGap ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
                  borderRadius: "8px",
                  border: `1px solid ${incomeGap.hasGap ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)"}`,
                }}>
                  {incomeGap.hasGap
                    ? `Income gap: you need ${fmt(incomeGap.gapMonthly)}/mo more than your current income covers.`
                    : `No income gap — you have ${fmt(Math.abs(incomeGap.gapMonthly))}/mo surplus.`
                  }
                </div>
              )}

              {/* Alerts — quiet context */}
              {alerts.length > 0 && (
                <div>
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: "0.5rem 0.75rem",
                        marginBottom: "0.35rem",
                        display: "flex",
                        gap: "0.45rem",
                        alignItems: "center",
                        fontSize: "0.8rem",
                        color: t.muted,
                      }}
                    >
                      <AlertTriangle size={12} style={{ color: alert.severity === "critical" ? "#ef4444" : "#f59e0b", flexShrink: 0 }} />
                      <span><span style={{ fontWeight: 600, color: t.text }}>{alert.title}</span> — {alert.explanation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Step 1: Diagnosis ────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: t.text, margin: "0 0 0.35rem" }}>Financial Diagnosis</h2>
            {/* Context bridge from Snapshot */}
            <p style={{ color: t.muted, fontSize: "0.88rem", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
              Your health score is <span style={{ color: healthColor, fontWeight: 700 }}>{healthScore}/100</span>
              {alerts.length > 0
                ? ` with ${alerts.length} active alert${alerts.length > 1 ? "s" : ""}. Here's a deeper look at what's driving it.`
                : ". Here's a deeper look at your financial position."
              }
            </p>

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
              t={t}
              isDark={isDark}
            />
          </div>
        )}

        {/* ── Step 2: Top Move + Scenario Lab CTA ─────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: t.text, margin: "0 0 0.35rem" }}>Your Top Move</h2>
            <p style={{ color: t.muted, fontSize: "0.88rem", margin: "0 0 1.5rem" }}>The single change with the biggest impact on your score.</p>

            {/* Recommendation card */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "14px", padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                <Target size={18} style={{ color: t.primary }} />
                <span style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text }}>{topMove.title}</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: t.muted, lineHeight: 1.55, margin: "0 0 1.25rem" }}>{topMove.description}</p>

              {/* Before → After inline */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>Now</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: healthColor, lineHeight: 1 }}>{topMove.currentHealth}</div>
                  <div style={{ fontSize: "0.72rem", color: t.muted, marginTop: "0.1rem" }}>{fmt(topMove.currentValue)}/mo</div>
                </div>

                <ArrowRight size={18} style={{ color: t.primary, flexShrink: 0 }} />

                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>After</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: healthDelta > 0 ? "#22c55e" : healthColor, lineHeight: 1 }}>{topMove.projectedHealth}</div>
                  <div style={{ fontSize: "0.72rem", color: t.muted, marginTop: "0.1rem" }}>{fmt(topMove.adjustedValue)}/mo</div>
                </div>

                {healthDelta !== 0 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    background: healthDelta > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${healthDelta > 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                    borderRadius: "16px",
                    padding: "0.25rem 0.6rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: healthDelta > 0 ? "#22c55e" : "#ef4444",
                    flexShrink: 0,
                  }}>
                    {healthDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {healthDelta > 0 ? "+" : ""}{healthDelta}
                  </div>
                )}
              </div>
            </div>

            {/* Scenario Lab CTA — not a separate step */}
            <div style={{
              background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
              border: `1px solid ${t.primary}20`,
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: t.text, marginBottom: "0.15rem" }}>Want to test this?</div>
                <div style={{ fontSize: "0.8rem", color: t.muted, lineHeight: 1.4 }}>
                  Open the Scenario Lab to try this change and compare outcomes side by side.
                </div>
              </div>
              <button
                onClick={() => { trackEvent("scenario_lab_opened", { user_tier: userTier, guided_step: step, source_page: "guided" }); onSimulator(); }}
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.accent || t.primary})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.55rem 1.15rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  whiteSpace: "nowrap",
                  boxShadow: `0 2px 10px ${t.primary}25`,
                }}
              >
                <Beaker size={14} />
                Open Scenario Lab
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Your Plan (conclusion) ────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: t.text, margin: "0 0 0.35rem" }}>Your Plan</h2>

            {/* Summary */}
            <div style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.15rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}>
              <div style={{ textAlign: "center", minWidth: "56px" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: healthColor, lineHeight: 1 }}>{healthScore}</div>
                <div style={{ fontSize: "0.65rem", color: t.muted, marginTop: "0.1rem" }}>Health</div>
              </div>
              <div style={{ fontSize: "0.88rem", color: t.text, lineHeight: 1.5 }}>
                {healthDelta > 0
                  ? <>Your top move — <span style={{ fontWeight: 700 }}>{topMove.title.toLowerCase()}</span> — could bring your score to <span style={{ fontWeight: 700, color: "#22c55e" }}>{topMove.projectedHealth}</span>. Test it in the Scenario Lab to see the full impact.</>
                  : <>Your ratios are in good shape. Use the Scenario Lab to explore what-if scenarios and fine-tune your position.</>
                }
              </div>
            </div>

            {/* Primary CTA: Scenario Lab */}
            <button
              onClick={() => { trackEvent("scenario_lab_opened", { user_tier: userTier, guided_step: step, source_page: "guided" }); onSimulator(); }}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${t.primary}, ${t.accent || t.primary})`,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0.85rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                marginBottom: "0.75rem",
                boxShadow: `0 4px 15px ${t.primary}25`,
              }}
            >
              <Beaker size={16} />
              Open Scenario Lab
            </button>

            {/* Secondary actions row */}
            <div style={{ display: "grid", gridTemplateColumns: onSaveScenario ? "1fr 1fr" : "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button
                onClick={() => { trackEvent("adjust_expenses_clicked", { user_tier: userTier, source_page: "guided" }); onRecalculate(); }}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  padding: "0.65rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: t.text,
                  cursor: "pointer",
                }}
              >
                Adjust Expenses
              </button>
              {onSaveScenario ? (
                <button
                  onClick={onSaveScenario}
                  style={{
                    background: t.cardBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: "8px",
                    padding: "0.65rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: t.text,
                    cursor: "pointer",
                  }}
                >
                  Save Scenario
                </button>
              ) : onDashboard ? (
                <button
                  onClick={() => { trackEvent("dashboard_opened", { user_tier: userTier, source_page: "guided" }); onDashboard(); }}
                  style={{
                    background: t.cardBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: "8px",
                    padding: "0.65rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: t.text,
                    cursor: "pointer",
                  }}
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => { trackEvent("full_breakdown_opened", { user_tier: userTier, source_page: "guided" }); onResults(); }}
                  style={{
                    background: t.cardBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: "8px",
                    padding: "0.65rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: t.text,
                    cursor: "pointer",
                  }}
                >
                  Full Breakdown
                </button>
              )}
            </div>

            {/* Tertiary link: Full Breakdown (always available) */}
            {(onSaveScenario || onDashboard) && (
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <button
                  onClick={() => { trackEvent("full_breakdown_opened", { user_tier: userTier, source_page: "guided" }); onResults(); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    color: t.muted,
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    padding: "0.25rem",
                  }}
                >
                  View full breakdown
                </button>
              </div>
            )}

            {/* Upgrade CTA for free users */}
            {!hasPaidAccess && (
              <div style={{
                padding: "1.15rem",
                borderRadius: "12px",
                background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: t.text, marginBottom: "0.25rem" }}>
                  Unlock the full experience
                </div>
                <div style={{ fontSize: "0.8rem", color: t.muted, lineHeight: 1.45, marginBottom: "0.75rem" }}>
                  AI diagnosis, multi-scenario comparison, debt payoff tools, and more.
                </div>
                <button
                  onClick={() => { trackEvent("upgrade_intent", { user_tier: userTier, source_page: "guided", plan: "pro" }); onUpgrade("pro"); }}
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.5rem 1.15rem",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    boxShadow: "0 2px 10px rgba(99,102,241,0.3)",
                  }}
                >
                  <Lock size={13} />
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step navigation ──────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1rem", borderTop: `1px solid ${t.border}20` }}>
          {step > 0 ? (
            <button
              onClick={goPrev}
              style={{
                background: "transparent",
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                padding: "0.45rem 0.9rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: t.muted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <ArrowLeft size={13} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              style={{
                background: t.primary,
                border: "none",
                borderRadius: "8px",
                padding: "0.5rem 1.15rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              {nextLabel}
              <ArrowRight size={14} />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
