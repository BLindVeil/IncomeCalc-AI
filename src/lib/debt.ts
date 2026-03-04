// ─── Debt Payoff Optimizer Engine ──────────────────────────────────────────────
// Simulates Snowball and Avalanche debt payoff strategies.

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  apr: number; // percentage, e.g. 18 means 18%
  minPayment: number;
}

export interface PayoffResult {
  months: number;
  totalInterestPaid: number;
  payoffOrder: string[]; // debt names in order they were paid off
  schedule: MonthlyDebtSnapshot[];
}

export interface MonthlyDebtSnapshot {
  month: number;
  totalBalance: number;
  totalInterest: number;
  debts: { name: string; balance: number }[];
}

interface SimDebt extends DebtItem {
  currentBalance: number;
}

function validateDebts(debts: DebtItem[]): DebtItem[] {
  return debts.map((d) => ({
    ...d,
    balance: Math.max(0, d.balance),
    apr: Math.max(0, Math.min(60, d.apr)),
    minPayment: Math.max(0, d.minPayment),
  }));
}

function simulatePayoff(
  inputDebts: DebtItem[],
  extraBudget: number,
  sortFn: (a: SimDebt, b: SimDebt) => number
): PayoffResult {
  const debts: SimDebt[] = validateDebts(inputDebts).map((d) => ({
    ...d,
    currentBalance: d.balance,
  }));

  let totalInterestPaid = 0;
  let month = 0;
  const maxMonths = 600;
  const payoffOrder: string[] = [];
  const schedule: MonthlyDebtSnapshot[] = [];
  let rolledOverExtra = 0;

  while (month < maxMonths) {
    // Check if all debts are paid off
    const totalRemaining = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    if (totalRemaining <= 0.01) break;

    month++;

    // Sort debts by strategy for allocation priority
    const activeDebts = debts.filter((d) => d.currentBalance > 0);
    activeDebts.sort(sortFn);

    // Apply interest to all active debts
    for (const debt of activeDebts) {
      const monthlyInterest = debt.currentBalance * (debt.apr / 100 / 12);
      debt.currentBalance += monthlyInterest;
      totalInterestPaid += monthlyInterest;
    }

    // Pay minimum on all debts first
    let availableExtra = extraBudget + rolledOverExtra;
    rolledOverExtra = 0;

    for (const debt of debts) {
      if (debt.currentBalance <= 0) continue;
      const payment = Math.min(debt.minPayment, debt.currentBalance);
      debt.currentBalance -= payment;
      if (debt.currentBalance <= 0.01) {
        debt.currentBalance = 0;
        payoffOrder.push(debt.name);
        // Roll freed min payment into extra budget
        rolledOverExtra += debt.minPayment;
      }
    }

    // Apply extra budget to target debt (first in sorted order)
    for (const debt of activeDebts) {
      if (debt.currentBalance <= 0 || availableExtra <= 0) continue;
      const extraPayment = Math.min(availableExtra, debt.currentBalance);
      debt.currentBalance -= extraPayment;
      availableExtra -= extraPayment;
      if (debt.currentBalance <= 0.01) {
        debt.currentBalance = 0;
        if (!payoffOrder.includes(debt.name)) {
          payoffOrder.push(debt.name);
          rolledOverExtra += debt.minPayment;
        }
      }
    }

    // Record snapshot every month (cap at 120 for performance)
    if (month <= 120 || month % 12 === 0) {
      schedule.push({
        month,
        totalBalance: Math.round(debts.reduce((sum, d) => sum + d.currentBalance, 0)),
        totalInterest: Math.round(totalInterestPaid),
        debts: debts.map((d) => ({ name: d.name, balance: Math.round(d.currentBalance) })),
      });
    }
  }

  return {
    months: month,
    totalInterestPaid: Math.round(totalInterestPaid),
    payoffOrder,
    schedule,
  };
}

export function simulateSnowball(debts: DebtItem[], extraBudget: number): PayoffResult {
  // Snowball: pay smallest balance first
  return simulatePayoff(debts, extraBudget, (a, b) => a.currentBalance - b.currentBalance);
}

export function simulateAvalanche(debts: DebtItem[], extraBudget: number): PayoffResult {
  // Avalanche: pay highest APR first
  return simulatePayoff(debts, extraBudget, (a, b) => b.apr - a.apr);
}

export function formatMonths(months: number): string {
  const years = Math.floor(months / 12);
  const mo = months % 12;
  if (years === 0) return `${mo} month${mo !== 1 ? "s" : ""}`;
  if (mo === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years}y ${mo}m`;
}
