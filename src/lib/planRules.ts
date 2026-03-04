// ─── Deterministic Plan Rules for "Ask Your Plan" Fallback ───────────────────
// When no LLM is available, these rules generate grounded financial advice
// using the user's actual numbers.

import { type CalcOutput, type ExpenseData } from "./calc";

export interface PlanContext {
  expenses: ExpenseData;
  taxRate: number;
  filingStatus?: string;
  state?: string;
  emergencyMonths?: number;
  outputs: CalcOutput;
  lastSnapshot?: {
    date: string;
    outputs: CalcOutput;
  } | null;
}

export interface PlanAnswer {
  text: string;
  bullets: string[];
  showScenarioButton?: boolean;
  scenarioOverrides?: Partial<ExpenseData>;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

export function answerQuestion(question: string, ctx: PlanContext): PlanAnswer {
  const { expenses, outputs } = ctx;
  const { ratios, fragilityScore, fragilityLabel, monthlyRequiredTotal, hourlyRequired, annualGrossRequired, emergencyFundTarget } = outputs;

  const q = question.toLowerCase();

  // "What should I cut first?"
  if (q.includes("cut first") || q.includes("cut")) {
    const items: { label: string; value: number; ratio: number }[] = [
      { label: "housing", value: expenses.housing, ratio: ratios.rentRatio },
      { label: "transportation", value: expenses.transport, ratio: ratios.transportRatio },
      { label: "entertainment", value: expenses.entertainment, ratio: ratios.entertainmentRatio },
      { label: "other/debt", value: expenses.other, ratio: ratios.debtRatio },
    ].filter(i => i.value > 0).sort((a, b) => b.ratio - a.ratio);

    const top = items[0];
    const bullets: string[] = [];
    if (top) {
      bullets.push(`Your ${top.label} is ${fmt(top.value)}/mo (${pct(top.ratio)} of your monthly total). This is your biggest lever.`);
    }
    if (items[1]) {
      bullets.push(`Next, look at ${items[1].label} at ${fmt(items[1].value)}/mo (${pct(items[1].ratio)}).`);
    }
    if (expenses.savings === 0) {
      bullets.push("You have no savings allocation — add even $50/mo to start building a buffer.");
    }

    return {
      text: `Based on your ${fmt(monthlyRequiredTotal)}/mo total, here's where to cut first:`,
      bullets: bullets.slice(0, 3),
    };
  }

  // "Is my rent too high?"
  if (q.includes("rent") || q.includes("housing")) {
    const isHigh = ratios.rentRatio > 0.35;
    const text = isHigh
      ? `Your rent of ${fmt(expenses.housing)}/mo is ${pct(ratios.rentRatio)} of your required monthly total of ${fmt(monthlyRequiredTotal)}. The recommended threshold is 30%. You're ${pct(ratios.rentRatio - 0.30)} over.`
      : `Your rent of ${fmt(expenses.housing)}/mo is ${pct(ratios.rentRatio)} of your required monthly total of ${fmt(monthlyRequiredTotal)}. That's within the recommended 30% threshold.`;

    const bullets: string[] = [];
    if (isHigh) {
      const targetRent = Math.round(monthlyRequiredTotal * 0.30);
      bullets.push(`Target rent: ${fmt(targetRent)}/mo to hit 30%.`);
      bullets.push(`That's a reduction of ${fmt(expenses.housing - targetRent)}/mo.`);
      bullets.push(`Consider roommates, downsizing, or relocating to a lower-cost area.`);
    } else {
      bullets.push(`Good job keeping housing costs manageable.`);
      if (expenses.savings < monthlyRequiredTotal * 0.15) {
        bullets.push(`Redirect some surplus toward savings — you're at ${pct(ratios.savingsRatio)} savings rate.`);
      }
    }

    return { text, bullets: bullets.slice(0, 3) };
  }

  // "How much house can I afford?"
  if (q.includes("house") || q.includes("afford")) {
    const maxMonthlyHousing = Math.round(monthlyRequiredTotal * 0.30);
    const annualHousingBudget = maxMonthlyHousing * 12;
    // Rough rule: home price ≈ 4x annual income allocated to housing
    const homePrice = Math.round(annualHousingBudget * 4);

    return {
      text: `Based on your ${fmt(annualGrossRequired)}/year gross required income, here's your housing budget:`,
      bullets: [
        `Max monthly housing: ${fmt(maxMonthlyHousing)}/mo (30% of ${fmt(monthlyRequiredTotal)}).`,
        `Estimated home price range: ${fmt(homePrice)} (using 4x annual housing budget rule).`,
        `Your current housing is ${fmt(expenses.housing)}/mo (${pct(ratios.rentRatio)} of monthly total).`,
      ],
    };
  }

  // "How do I get to a stable score?"
  if (q.includes("stable") || q.includes("score") || q.includes("fragility")) {
    const bullets: string[] = [];
    if (ratios.rentRatio > 0.35) {
      bullets.push(`Reduce housing from ${fmt(expenses.housing)} (${pct(ratios.rentRatio)}) toward 30% of monthly total.`);
    }
    if (expenses.other > 0) {
      bullets.push(`Pay down debt/other expenses of ${fmt(expenses.other)}/mo to reduce financial pressure.`);
    }
    if (ratios.savingsRatio < 0.15) {
      bullets.push(`Increase savings from ${fmt(expenses.savings)} (${pct(ratios.savingsRatio)}) to at least 15% of monthly total.`);
    }
    if (bullets.length === 0) {
      bullets.push(`Your fragility score is ${fragilityScore}/100 (${fragilityLabel}). You're on a solid path.`);
      bullets.push(`Maintain your savings rate and keep debt low.`);
    }

    return {
      text: `Your current fragility score is ${fragilityScore}/100 (${fragilityLabel}). To improve:`,
      bullets: bullets.slice(0, 3),
    };
  }

  // "What happens if I save $X/month?"
  if (q.includes("save") || q.includes("saving")) {
    const currentSavings = expenses.savings;
    const suggestedIncrease = Math.max(100, Math.round(monthlyRequiredTotal * 0.05));
    const newSavings = currentSavings + suggestedIncrease;

    return {
      text: `You're currently saving ${fmt(currentSavings)}/mo (${pct(ratios.savingsRatio)} of monthly total). Here's what boosting savings would do:`,
      bullets: [
        `Adding ${fmt(suggestedIncrease)}/mo would bring savings to ${fmt(newSavings)}/mo.`,
        `Your emergency fund target is ${fmt(emergencyFundTarget)}. At ${fmt(newSavings)}/mo you'd reach it in ${Math.ceil(emergencyFundTarget / Math.max(newSavings, 1))} months.`,
        `Your hourly rate would increase by ~${fmt(suggestedIncrease / 173)}/hr to cover the extra savings.`,
      ],
      showScenarioButton: true,
      scenarioOverrides: { savings: newSavings },
    };
  }

  // "What's my fastest improvement?"
  if (q.includes("fastest") || q.includes("improvement") || q.includes("quick")) {
    const bullets: string[] = [];
    // Find the single biggest lever
    if (ratios.rentRatio > 0.35) {
      bullets.push(`Housing is ${pct(ratios.rentRatio)} of your budget — the single biggest lever. Reducing it by even 10% saves ${fmt(Math.round(expenses.housing * 0.1))}/mo.`);
    }
    if (expenses.other > 0) {
      bullets.push(`Eliminating ${fmt(expenses.other)}/mo in other/debt expenses would drop your required hourly rate by ${fmt(expenses.other / 173)}/hr.`);
    }
    if (ratios.transportRatio > 0.15) {
      bullets.push(`Transportation at ${pct(ratios.transportRatio)} is high. Switching to public transit or carpooling could save ${fmt(Math.round(expenses.transport * 0.3))}/mo.`);
    }
    if (bullets.length === 0) {
      bullets.push(`Your budget is well-balanced. Focus on increasing income — you need ${fmt(hourlyRequired)}/hr currently.`);
      bullets.push(`Even a ${fmt(200)}/mo side income would reduce required salary by ${fmt(2400)}/year.`);
    }

    return {
      text: `Here's the fastest way to improve your financial position based on your ${fmt(monthlyRequiredTotal)}/mo profile:`,
      bullets: bullets.slice(0, 3),
    };
  }

  // Generic fallback
  const bullets: string[] = [];
  if (ratios.rentRatio > 0.35) {
    bullets.push(`Your rent ratio is ${pct(ratios.rentRatio)} — above the recommended 30%. Consider housing alternatives.`);
  }
  if (expenses.other > 0) {
    bullets.push(`You have ${fmt(expenses.other)}/mo in other expenses/debt. Prioritize paying this down.`);
  }
  if (ratios.savingsRatio < 0.10) {
    bullets.push(`Your savings rate is only ${pct(ratios.savingsRatio)}. Aim for at least 10-15%.`);
  }
  if (bullets.length === 0) {
    bullets.push(`You need ${fmt(hourlyRequired)}/hr or ${fmt(annualGrossRequired)}/year gross.`);
    bullets.push(`Your fragility score is ${fragilityScore}/100 (${fragilityLabel}).`);
    bullets.push(`Emergency fund target: ${fmt(emergencyFundTarget)}.`);
  }

  return {
    text: `Based on your ${fmt(monthlyRequiredTotal)}/mo expenses at ${ctx.taxRate}% tax rate:`,
    bullets: bullets.slice(0, 3),
  };
}
