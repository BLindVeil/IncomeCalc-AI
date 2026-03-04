// ─── Stability Metrics Engine ─────────────────────────────────────────────────
// Computes runway, income gap, alert rules, and ratios.
// Reuses CalcOutput from the shared calculation engine.

import { type CalcOutput } from "./calc";

// ─── Income Gap ──────────────────────────────────────────────────────────────

export interface IncomeGapResult {
  gapMonthly: number; // positive = shortfall, negative = surplus
  requiredMonthly: number;
  currentMonthly: number;
  hasGap: boolean;
}

export function computeIncomeGap(
  annualGrossRequired: number,
  currentGrossAnnualIncome: number
): IncomeGapResult {
  const requiredMonthly = annualGrossRequired / 12;
  const currentMonthly = currentGrossAnnualIncome / 12;
  const gapMonthly = requiredMonthly - currentMonthly;
  return {
    gapMonthly,
    requiredMonthly,
    currentMonthly,
    hasGap: gapMonthly > 0,
  };
}

// ─── Financial Runway ────────────────────────────────────────────────────────

export type RunwayLevel = "Critical" | "Fragile" | "Stable" | "Strong";

export interface RunwayResult {
  months: number;
  level: RunwayLevel;
  label: string;
}

export function computeRunway(
  emergencyFundTarget: number,
  monthlyExpensesTotal: number
): RunwayResult {
  const months =
    monthlyExpensesTotal > 0 ? emergencyFundTarget / monthlyExpensesTotal : 0;

  let level: RunwayLevel;
  if (months < 1) level = "Critical";
  else if (months < 3) level = "Fragile";
  else if (months < 6) level = "Stable";
  else level = "Strong";

  return {
    months,
    level,
    label: `You can survive ${months.toFixed(1)} months without income.`,
  };
}

// ─── Financial Alerts ────────────────────────────────────────────────────────

export interface FinancialAlert {
  id: string;
  title: string;
  severity: "warning" | "critical";
  explanation: string;
}

export function computeAlerts(
  outputs: CalcOutput,
  runwayMonths: number,
  savingsGoal: number
): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];

  if (outputs.ratios.rentRatio > 0.4) {
    alerts.push({
      id: "housing-risk",
      title: "Housing Risk",
      severity: "critical",
      explanation: `Your housing costs are ${(outputs.ratios.rentRatio * 100).toFixed(0)}% of your monthly total, exceeding the safe threshold of 40%. Consider finding more affordable housing or increasing income to reduce this ratio.`,
    });
  }

  if (outputs.ratios.debtRatio > 0.2) {
    alerts.push({
      id: "debt-pressure",
      title: "Debt Pressure",
      severity: "warning",
      explanation: `Your debt/other expenses are ${(outputs.ratios.debtRatio * 100).toFixed(0)}% of your monthly total, above the recommended 20% maximum. Prioritize paying down high-interest debt to free up cash flow.`,
    });
  }

  if (savingsGoal === 0) {
    alerts.push({
      id: "no-savings",
      title: "No Savings Buffer",
      severity: "critical",
      explanation: `You have no savings allocation in your budget. Even $50-100/month can start building a safety net. Without savings, any unexpected expense becomes a financial emergency.`,
    });
  }

  const emergencyMonthsCovered =
    outputs.monthlyExpensesTotal > 0
      ? outputs.emergencyFundTarget /
        (outputs.monthlyExpensesTotal - savingsGoal || 1)
      : 0;
  if (emergencyMonthsCovered < 3 && savingsGoal > 0) {
    alerts.push({
      id: "emergency-risk",
      title: "Emergency Risk",
      severity: "warning",
      explanation: `Your emergency fund covers only ${emergencyMonthsCovered.toFixed(1)} months of expenses. Financial experts recommend at least 3-6 months. Increase your savings rate or reduce expenses to build this buffer faster.`,
    });
  }

  if (runwayMonths < 2) {
    alerts.push({
      id: "low-runway",
      title: "Low Runway",
      severity: "critical",
      explanation: `Your financial runway is only ${runwayMonths.toFixed(1)} months. This means you have very little time to recover from income loss. Focus on building emergency savings to extend your runway to at least 3 months.`,
    });
  }

  return alerts;
}
