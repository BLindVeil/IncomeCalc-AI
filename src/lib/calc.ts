// ─── Shared Calculation Engine ────────────────────────────────────────────────
// Single source of truth for all income calculations across
// Calculator, Results, Simulator, and Check-In pages.

export interface ExpenseData {
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

export interface CalcInput {
  expenses: ExpenseData;
  taxRate: number; // percentage, e.g. 25 means 25%
  hoursPerWeek?: number; // default 40
  weeksPerYear?: number; // default 52
  emergencyMonths?: number; // default 3
}

export interface CalcOutput {
  monthlyExpensesTotal: number;
  monthlyRequiredTotal: number; // same as monthlyExpensesTotal (net required)
  annualNetRequired: number;
  annualGrossRequired: number;
  grossMonthlyRequired: number;
  hourlyRequired: number;
  emergencyFundTarget: number;
  taxMonthly: number;
  fragilityScore: number; // 0–100
  fragilityLabel: string;
  ratios: {
    rentRatio: number;
    debtRatio: number;
    transportRatio: number;
    savingsRatio: number;
    entertainmentRatio: number;
  };
  healthScore: number;
  healthLabel: string;
  savingsHeavy: boolean;
  subScores: {
    cashflowStability: number;
    debtRisk: number;
    savingsStrength: number;
    incomeFragility: number;
  };
}

export function calculate(input: CalcInput): CalcOutput {
  const { expenses, taxRate } = input;
  const hoursPerWeek = input.hoursPerWeek ?? 40;
  const weeksPerYear = input.weeksPerYear ?? 52;
  const emergencyMonths = input.emergencyMonths ?? 3;

  const totalHoursPerYear = hoursPerWeek * weeksPerYear;

  // Monthly totals
  const monthlyExpensesTotal = Object.values(expenses).reduce((a, b) => a + b, 0);
  const monthlyRequiredTotal = monthlyExpensesTotal;

  // Annual
  const annualNetRequired = monthlyRequiredTotal * 12;

  // Gross calculations
  const effectiveRate = Math.min(99, Math.max(0, taxRate)) / 100;
  const grossMonthlyRequired = effectiveRate < 1
    ? monthlyRequiredTotal / (1 - effectiveRate)
    : 0;
  const annualGrossRequired = grossMonthlyRequired * 12;
  const hourlyRequired = totalHoursPerYear > 0 ? annualGrossRequired / totalHoursPerYear : 0;
  const taxMonthly = grossMonthlyRequired - monthlyRequiredTotal;

  // Emergency fund
  const emergencyBase = monthlyRequiredTotal - expenses.savings;
  const emergencyFundTarget = Math.max(0, emergencyBase) * emergencyMonths;

  // Ratios (based on monthlyRequiredTotal to stay consistent)
  const safe = Math.max(monthlyRequiredTotal, 1);
  const rentRatio = expenses.housing / safe;
  const debtRatio = expenses.other / safe; // "other" used as debt proxy
  const transportRatio = expenses.transport / safe;
  const savingsRatio = expenses.savings / safe;
  const entertainmentRatio = expenses.entertainment / safe;

  // Fragility score (0 = very fragile, 100 = very stable)
  // Higher savings, lower debt/rent ratios = more stable = higher score
  const savingsRate = monthlyRequiredTotal > 0 ? (expenses.savings / monthlyRequiredTotal) * 100 : 0;
  const emergencyMonthsCovered = emergencyBase > 0 ? expenses.savings / emergencyBase : 0;

  let fragility = 50; // start neutral
  // Savings impact
  if (savingsRate >= 20) fragility += 15;
  else if (savingsRate >= 10) fragility += 8;
  else if (savingsRate < 5) fragility -= 15;
  else fragility -= 5;
  // Emergency months
  if (emergencyMonthsCovered >= 6) fragility += 15;
  else if (emergencyMonthsCovered >= 3) fragility += 8;
  else if (emergencyMonthsCovered < 1) fragility -= 15;
  else fragility -= 5;
  // Housing burden
  if (rentRatio > 0.5) fragility -= 15;
  else if (rentRatio > 0.35) fragility -= 8;
  else if (rentRatio <= 0.25) fragility += 5;
  // Debt burden
  if (debtRatio > 0.2) fragility -= 10;
  else if (debtRatio > 0.1) fragility -= 5;
  else if (debtRatio === 0) fragility += 5;

  const fragilityScore = Math.min(100, Math.max(0, fragility));
  const fragilityLabel =
    fragilityScore >= 75 ? "Stable" :
    fragilityScore >= 50 ? "Moderate" :
    fragilityScore >= 25 ? "Fragile" :
    "Very Fragile";

  // Sub-scores for Financial Health 2.0 (matching existing Results page logic)
  const grossSafe = Math.max(grossMonthlyRequired, 1);
  const cashflowStability = Math.min(100, Math.round(
    grossMonthlyRequired > 0
      ? Math.max(0, 100 - (monthlyRequiredTotal / grossMonthlyRequired) * 100 * 1.5) + 25
      : 0
  ));
  const debtRisk = Math.min(100, Math.round(
    Math.max(0, 100 - (expenses.other / grossSafe) * 200)
  ));
  const savingsStrength = Math.min(100, Math.round(savingsRate * 5));
  const incomeFragility = Math.min(100, Math.round(
    expenses.savings > 0
      ? Math.min(100, (expenses.savings / Math.max(monthlyRequiredTotal - expenses.savings, 1)) * 100 * 3)
      : 0
  ));

  let healthScore = Math.min(100, Math.round(
    cashflowStability * 0.3 + debtRisk * 0.2 + savingsStrength * 0.3 + incomeFragility * 0.2
  ));

  // FIX 1: Cap health score at 25 when runway is effectively zero
  // (savings = 0 means no emergency buffer at all)
  if (expenses.savings === 0) {
    healthScore = Math.min(healthScore, 25);
  }

  const healthLabel =
    healthScore >= 80 ? "Excellent" :
    healthScore >= 60 ? "Good" :
    healthScore >= 40 ? "Fair" :
    "Needs Work";

  // FIX 3: Flag when savings dominates the budget (>60% of total expenses)
  const savingsHeavy = monthlyRequiredTotal > 0 && (expenses.savings / monthlyRequiredTotal) > 0.6;

  return {
    monthlyExpensesTotal,
    monthlyRequiredTotal,
    annualNetRequired,
    annualGrossRequired,
    grossMonthlyRequired,
    hourlyRequired,
    emergencyFundTarget,
    taxMonthly,
    fragilityScore,
    fragilityLabel,
    ratios: {
      rentRatio,
      debtRatio,
      transportRatio,
      savingsRatio,
      entertainmentRatio,
    },
    healthScore,
    healthLabel,
    savingsHeavy,
    subScores: {
      cashflowStability,
      debtRisk,
      savingsStrength,
      incomeFragility,
    },
  };
}

// ─── Tax Rate Estimation ─────────────────────────────────────────────────────

export type IncomeRange = "<30k" | "30k-60k" | "60k-100k" | "100k-150k" | "150k+";
export type FilingStatus = "single" | "married";

const TAX_TABLE_CA: Record<IncomeRange, number> = {
  "<30k": 0.18,
  "30k-60k": 0.24,
  "60k-100k": 0.28,
  "100k-150k": 0.31,
  "150k+": 0.34,
};

const TAX_TABLE_OTHER: Record<IncomeRange, number> = {
  "<30k": 0.15,
  "30k-60k": 0.20,
  "60k-100k": 0.24,
  "100k-150k": 0.27,
  "150k+": 0.30,
};

export function estimateTaxRate(
  state: string,
  filingStatus: FilingStatus,
  incomeRange: IncomeRange
): number {
  const table = state === "CA" ? TAX_TABLE_CA : TAX_TABLE_OTHER;
  let rate = table[incomeRange];
  if (filingStatus === "married") {
    rate = Math.max(0.10, rate - 0.01);
  }
  return Math.round(rate * 100); // return as percentage integer
}

export const INCOME_RANGES: { value: IncomeRange; label: string }[] = [
  { value: "<30k", label: "Under $30,000" },
  { value: "30k-60k", label: "$30,000 – $60,000" },
  { value: "60k-100k", label: "$60,000 – $100,000" },
  { value: "100k-150k", label: "$100,000 – $150,000" },
  { value: "150k+", label: "$150,000+" },
];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];
