// ─── 12-Month Forecast Engine ─────────────────────────────────────────────────
// Deterministic month-by-month projection for emergency fund,
// debt balance, runway, and stability score.

import { calculate, type ExpenseData, type CalcOutput } from "./calc";

export interface ForecastInputs {
  expenses: ExpenseData;
  taxRate: number;
  startingEmergencyFund: number;
  monthlyEmergencyContribution: number;
  extraDebtPaymentBudget: number;
  incomeGrowthPct: number; // 0-100, total growth over 12 months
  currentDebtBalance: number; // total debt balance (from debt tool or manual)
  currentDebtMinPayment: number; // monthly min payment on debt
}

export interface MonthSnapshot {
  month: number; // 1-12
  emergencyFundBalance: number;
  runwayMonths: number;
  debtBalance: number;
  stabilityScore: number;
  monthlyExpenses: number;
  savingsGoal: number;
}

export function forecast12Months(inputs: ForecastInputs): MonthSnapshot[] {
  const {
    expenses,
    taxRate,
    startingEmergencyFund,
    monthlyEmergencyContribution,
    extraDebtPaymentBudget,
    incomeGrowthPct,
    currentDebtBalance,
    currentDebtMinPayment,
  } = inputs;

  const snapshots: MonthSnapshot[] = [];
  let emergencyFund = startingEmergencyFund;
  let debtBalance = currentDebtBalance;

  // Monthly growth factor (linear interpolation over 12 months)
  const monthlyGrowthFactor = incomeGrowthPct / 100 / 12;

  for (let month = 1; month <= 12; month++) {
    // Apply income growth to savings component proportionally
    const growthMultiplier = 1 + monthlyGrowthFactor * month;

    // Adjust savings to reflect income growth (more income = potentially more savings)
    const adjustedExpenses: ExpenseData = {
      ...expenses,
      savings: Math.round(expenses.savings * growthMultiplier),
    };

    // Compute outputs for this month's snapshot
    const outputs: CalcOutput = calculate({ expenses: adjustedExpenses, taxRate });

    // Emergency fund accumulation
    emergencyFund += monthlyEmergencyContribution;

    // Debt paydown
    if (debtBalance > 0) {
      const totalDebtPayment = currentDebtMinPayment + extraDebtPaymentBudget;
      debtBalance = Math.max(0, debtBalance - totalDebtPayment);
    }

    // Compute runway based on actual emergency fund balance vs monthly expenses
    const monthlyExpensesExSavings = outputs.monthlyExpensesTotal - adjustedExpenses.savings;
    const effectiveMonthlyExpenses = Math.max(monthlyExpensesExSavings, 1);
    const runwayMonths = emergencyFund / effectiveMonthlyExpenses;

    // Compute stability score with improved runway
    // Start from base health score + runway bonus
    let stabilityScore = outputs.healthScore;

    // Runway improvement bonus (up to +15 for 6+ months runway)
    if (runwayMonths >= 6) stabilityScore += 15;
    else if (runwayMonths >= 3) stabilityScore += 8;
    else if (runwayMonths >= 1) stabilityScore += 3;

    // Debt reduction bonus (up to +10 for zero debt)
    if (currentDebtBalance > 0) {
      const debtReductionPct = 1 - debtBalance / Math.max(currentDebtBalance, 1);
      stabilityScore += Math.round(debtReductionPct * 10);
    }

    stabilityScore = Math.min(100, Math.max(0, stabilityScore));

    snapshots.push({
      month,
      emergencyFundBalance: Math.round(emergencyFund),
      runwayMonths: Math.round(runwayMonths * 10) / 10,
      debtBalance: Math.round(debtBalance),
      stabilityScore,
      monthlyExpenses: outputs.monthlyExpensesTotal,
      savingsGoal: adjustedExpenses.savings,
    });
  }

  return snapshots;
}
