// ─── Resume-flow: stash guided-flow state so /welcome can resume it ──────────

import type { ExpenseData } from "@/lib/app-shared";

const RESUME_KEY = "ascentra-resume-flow";

export interface ResumeFlowData {
  expenseData: ExpenseData;
  taxRate: number;
  currentGrossIncome: number;
}

export function stashResumeFlow(data: ResumeFlowData): void {
  try {
    sessionStorage.setItem(RESUME_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function readResumeFlow(): ResumeFlowData | null {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResumeFlowData;
  } catch {
    return null;
  }
}

export function clearResumeFlow(): void {
  try {
    sessionStorage.removeItem(RESUME_KEY);
  } catch {
    // ignore
  }
}
