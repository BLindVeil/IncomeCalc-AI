// ─── AI Financial Diagnosis Types ─────────────────────────────────────────────

export type DiagnosisTone = "direct" | "supportive" | "disciplined";

export type DiagnosisAction = {
  title: string;
  explanation: string;
  impact: "low" | "medium" | "high";
  difficulty: "easy" | "moderate" | "hard";
};

export type FinancialDiagnosis = {
  mainIssue: string;
  summary: string;
  riskLevel: "low" | "medium" | "high";
  topMoves: DiagnosisAction[];
  ifUnchanged30d: string;
  ifOptimized30d: string;
  ifUnchanged12m: string;
  ifOptimized12m: string;
  verdict: string;
  cutFirst?: string[];
  hiddenStrength?: string;
  toneUsed: DiagnosisTone;
};

/** Input payload sent to /api/ai for the diagnosis feature. */
export interface DiagnosisInput {
  grossAnnual: number;
  netMonthly: number;
  taxRate: number;
  totalMonthly: number;
  leftover: number;
  savingsRate: number;
  healthScore: number;
  hourlyRate: number;
  housing: number;
  food: number;
  transport: number;
  healthcare: number;
  utilities: number;
  entertainment: number;
  clothing: number;
  savings: number;
  other: number;
  top3Categories: string[];
  tone: DiagnosisTone;
  fragilityScore?: number;
  debtRatio?: number;
  emergencyFundTarget?: number;
}

/** Validates parsed JSON into a FinancialDiagnosis, returning null on failure. */
export function parseDiagnosis(raw: unknown): FinancialDiagnosis | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  if (typeof d.mainIssue !== "string" || !d.mainIssue) return null;
  if (typeof d.summary !== "string" || !d.summary) return null;
  if (!["low", "medium", "high"].includes(d.riskLevel as string)) return null;
  if (!Array.isArray(d.topMoves) || d.topMoves.length === 0) return null;
  if (typeof d.ifUnchanged30d !== "string") return null;
  if (typeof d.ifOptimized30d !== "string") return null;
  if (typeof d.ifUnchanged12m !== "string") return null;
  if (typeof d.ifOptimized12m !== "string") return null;
  if (typeof d.verdict !== "string" || !d.verdict) return null;
  if (!["direct", "supportive", "disciplined"].includes(d.toneUsed as string)) return null;

  const validMoves = (d.topMoves as unknown[]).every((m) => {
    if (!m || typeof m !== "object") return false;
    const mv = m as Record<string, unknown>;
    return (
      typeof mv.title === "string" &&
      typeof mv.explanation === "string" &&
      ["low", "medium", "high"].includes(mv.impact as string) &&
      ["easy", "moderate", "hard"].includes(mv.difficulty as string)
    );
  });
  if (!validMoves) return null;

  return {
    mainIssue: d.mainIssue as string,
    summary: d.summary as string,
    riskLevel: d.riskLevel as FinancialDiagnosis["riskLevel"],
    topMoves: (d.topMoves as DiagnosisAction[]).slice(0, 5),
    ifUnchanged30d: d.ifUnchanged30d as string,
    ifOptimized30d: d.ifOptimized30d as string,
    ifUnchanged12m: d.ifUnchanged12m as string,
    ifOptimized12m: d.ifOptimized12m as string,
    verdict: d.verdict as string,
    cutFirst: Array.isArray(d.cutFirst) ? (d.cutFirst as string[]).filter((s) => typeof s === "string") : undefined,
    hiddenStrength: typeof d.hiddenStrength === "string" ? d.hiddenStrength : undefined,
    toneUsed: d.toneUsed as DiagnosisTone,
  };
}
