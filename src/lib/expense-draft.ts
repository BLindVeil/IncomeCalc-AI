// ─── Layer 1: the local working draft ────────────────────────────────────────
// Expense entry is the most expensive thing a visitor does here, so it is never
// held only in React state. Every change lands in localStorage, and the app
// rehydrates from it on load - no prompt, no account, no network.
//
// localStorage rather than sessionStorage: `pending-signup-data.ts` uses
// sessionStorage, which is why closing the tab lost everything. This survives
// tab close, reload, back-navigation, and an ErrorBoundary crash.

import type { ExpenseData } from "@/lib/app-shared";

const DRAFT_KEY = "ascentra-expense-draft";

/**
 * Bump when the stored shape changes incompatibly.
 *
 * Every read checks it, so a draft written by an older build is discarded
 * instead of being spread into state and crashing a component that expects a
 * field the old draft never had. This is the failure that makes autosave feel
 * worse than no autosave, so it is handled from the first version.
 */
export const DRAFT_VERSION = 1;

export interface ExpenseDraft {
  version: number;
  /** Epoch ms. The reconciliation key against the server copy in layer 2. */
  updatedAt: number;
  expenseData: ExpenseData;
  taxRate: number;
  currentGrossIncome: number;
}

/** Draft payload without the envelope the caller should not have to build. */
export type ExpenseDraftInput = Omit<ExpenseDraft, "version" | "updatedAt">;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** ExpenseData is a flat map of category → amount; reject anything else. */
function isExpenseData(v: unknown): v is ExpenseData {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const values = Object.values(v as Record<string, unknown>);
  return values.length > 0 && values.every(isFiniteNumber);
}

function isDraft(v: unknown): v is ExpenseDraft {
  if (!v || typeof v !== "object") return false;
  const d = v as Partial<ExpenseDraft>;
  return (
    d.version === DRAFT_VERSION &&
    isFiniteNumber(d.updatedAt) &&
    isFiniteNumber(d.taxRate) &&
    isFiniteNumber(d.currentGrossIncome) &&
    isExpenseData(d.expenseData)
  );
}

/**
 * Read the stored draft, or null when there is nothing usable.
 *
 * A draft that fails validation is removed rather than left to fail on every
 * subsequent load.
 */
export function readDraft(): ExpenseDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isDraft(parsed)) {
      window.localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    // Corrupt JSON, disabled storage, or a SecurityError in some private modes.
    return null;
  }
}

/**
 * Persist a draft. Returns the stored record, or null when storage refused.
 *
 * Private browsing and quota-exceeded both throw; the caller keeps working from
 * memory instead of surfacing an error for something the user cannot act on.
 */
export function writeDraft(input: ExpenseDraftInput): ExpenseDraft | null {
  if (typeof window === "undefined") return null;
  const draft: ExpenseDraft = {
    ...input,
    version: DRAFT_VERSION,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing useful to do */
  }
}

/** The storage key, exported so the multi-tab listener can filter on it. */
export const DRAFT_STORAGE_KEY = DRAFT_KEY;

/**
 * True when a draft holds anything worth restoring.
 *
 * Restoring a draft of all zeroes would show "Restored your last entry" to
 * someone who never entered anything.
 */
export function draftHasContent(draft: ExpenseDraft | null): boolean {
  if (!draft) return false;
  const anyExpense = Object.values(draft.expenseData).some((n) => n > 0);
  return anyExpense || draft.currentGrossIncome > 0;
}
