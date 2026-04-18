import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BudgetStore {
  customBudgets: Record<string, number>;
  setCustomBudget: (category: string, amount: number) => void;
  clearCustomBudget: (category: string) => void;
  clearAllCustomBudgets: () => void;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      customBudgets: {},
      setCustomBudget: (category, amount) =>
        set((state) => ({
          customBudgets: { ...state.customBudgets, [category]: amount },
        })),
      clearCustomBudget: (category) =>
        set((state) => {
          const next = { ...state.customBudgets };
          delete next[category];
          return { customBudgets: next };
        }),
      clearAllCustomBudgets: () => set({ customBudgets: {} }),
    }),
    { name: "incomecalc-custom-budgets" },
  ),
);
