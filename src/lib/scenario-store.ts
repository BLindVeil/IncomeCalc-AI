import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExpenseData } from "./calc";
import { genId } from "./app-shared";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DashboardScenarioStatus = "draft" | "in_progress" | "completed";

export interface ExpenseChange {
  category: string;
  before: number;
  after: number;
}

export interface DashboardScenario {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  status: DashboardScenarioStatus;
  progress: number; // 0–100
  changes: ExpenseChange[];
  monthlyImpact: number;
  annualImpact: number;
  adjustedAnnualRequired: number;
  taxRate: number;
  expenses: ExpenseData;
  baselineExpenses: ExpenseData;
}

interface ScenarioStore {
  scenarios: DashboardScenario[];
  addScenario: (scenario: Omit<DashboardScenario, "id" | "createdAt" | "updatedAt">) => DashboardScenario;
  updateScenario: (id: string, patch: Partial<Pick<DashboardScenario, "name" | "description" | "status" | "progress">>) => void;
  deleteScenario: (id: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function computeChanges(
  baseline: ExpenseData,
  modified: ExpenseData,
  categoryLabels: Record<string, string>,
): ExpenseChange[] {
  const changes: ExpenseChange[] = [];
  for (const key of Object.keys(baseline) as (keyof ExpenseData)[]) {
    const before = baseline[key];
    const after = modified[key];
    if (before !== after) {
      changes.push({
        category: categoryLabels[key] ?? key,
        before,
        after,
      });
    }
  }
  return changes;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useScenarioStore = create<ScenarioStore>()(
  persist(
    (set, get) => ({
      scenarios: [],

      addScenario: (data) => {
        const now = new Date().toISOString();
        const scenario: DashboardScenario = {
          ...data,
          id: genId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ scenarios: [...state.scenarios, scenario] }));
        return scenario;
      },

      updateScenario: (id, patch) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id
              ? { ...s, ...patch, updatedAt: new Date().toISOString() }
              : s,
          ),
        })),

      deleteScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
        })),
    }),
    { name: "incomecalc-dashboard-scenarios" },
  ),
);
