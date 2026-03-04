// ─── Financial Independence (FI) Date Estimator ──────────────────────────────
// Simulates monthly compounding to determine when assets >= FI target.

export interface FIInput {
  annualExpenses: number;
  currentInvestedAssets: number;
  monthlyInvestableAmount: number;
  expectedAnnualReturn: number; // decimal, e.g. 0.06 = 6%
  safeWithdrawalRate: number; // decimal, e.g. 0.04 = 4%
}

export interface FIOutput {
  targetNetWorth: number;
  monthsToFI: number;
  yearsToFI: number;
  projectedFIDate: string; // ISO date string
  onTrack: boolean; // true if reachable within 50 years
  currentProgress: number; // 0-100 percentage
  schedule: FIMonthSnapshot[];
}

export interface FIMonthSnapshot {
  month: number;
  assets: number;
}

export function simulateFI(input: FIInput): FIOutput {
  const {
    annualExpenses,
    currentInvestedAssets,
    monthlyInvestableAmount,
    expectedAnnualReturn,
    safeWithdrawalRate,
  } = input;

  const swr = Math.max(0.01, safeWithdrawalRate);
  const targetNetWorth = annualExpenses / swr;

  // If already at target
  if (currentInvestedAssets >= targetNetWorth) {
    const now = new Date();
    return {
      targetNetWorth: Math.round(targetNetWorth),
      monthsToFI: 0,
      yearsToFI: 0,
      projectedFIDate: now.toISOString(),
      onTrack: true,
      currentProgress: 100,
      schedule: [{ month: 0, assets: Math.round(currentInvestedAssets) }],
    };
  }

  const monthlyReturn = expectedAnnualReturn / 12;
  const maxMonths = 600; // 50-year cap
  let assets = currentInvestedAssets;
  let months = 0;
  const schedule: FIMonthSnapshot[] = [{ month: 0, assets: Math.round(assets) }];

  while (months < maxMonths && assets < targetNetWorth) {
    months++;
    assets = assets * (1 + monthlyReturn) + monthlyInvestableAmount;

    // Record yearly snapshots + the final month
    if (months % 12 === 0 || assets >= targetNetWorth) {
      schedule.push({ month: months, assets: Math.round(assets) });
    }
  }

  const yearsToFI = Math.round((months / 12) * 10) / 10;
  const onTrack = months < maxMonths;

  // Calculate projected FI date
  const now = new Date();
  const fiDate = new Date(now);
  fiDate.setMonth(fiDate.getMonth() + months);

  const currentProgress = Math.min(
    100,
    Math.round((currentInvestedAssets / Math.max(targetNetWorth, 1)) * 100)
  );

  return {
    targetNetWorth: Math.round(targetNetWorth),
    monthsToFI: months,
    yearsToFI,
    projectedFIDate: fiDate.toISOString(),
    onTrack,
    currentProgress,
    schedule,
  };
}
