// ─── FIRE Countdown Estimator ─────────────────────────────────────────────────
// Computes retirement projections using compound growth formula.

export interface FireInput {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturn: number; // percentage, e.g. 6 means 6%
}

export interface FireOutput {
  yearsUntilRetirement: number;
  projectedBalance: number;
  monthlyRetirementIncome: number; // 4% withdrawal rule / 12
  onTrack: boolean; // true if monthly retirement income >= monthly contribution * 2
  annualWithdrawal: number;
}

export function computeFire(input: FireInput): FireOutput {
  const { currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn } = input;

  const yearsUntilRetirement = Math.max(0, retirementAge - currentAge);
  const monthlyRate = annualReturn / 100 / 12;
  const totalMonths = yearsUntilRetirement * 12;

  // Future value of current savings
  const fvLumpSum = currentSavings * Math.pow(1 + monthlyRate, totalMonths);

  // Future value of monthly contributions (annuity)
  const fvContributions =
    monthlyRate > 0
      ? monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
      : monthlyContribution * totalMonths;

  const projectedBalance = fvLumpSum + fvContributions;

  // 4% withdrawal rule
  const annualWithdrawal = projectedBalance * 0.04;
  const monthlyRetirementIncome = annualWithdrawal / 12;

  // "On Track" if projected monthly income >= 2x current monthly contribution
  // (a rough heuristic indicating you'll have enough to live on)
  const onTrack = monthlyRetirementIncome >= monthlyContribution * 2;

  return {
    yearsUntilRetirement,
    projectedBalance,
    monthlyRetirementIncome,
    onTrack,
    annualWithdrawal,
  };
}
