import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FinancialDiagnosis, DiagnosisTone } from "./diagnosis-types";

interface DiagnosisStore {
  savedDiagnosis: FinancialDiagnosis | null;
  savedDiagnosisTone: DiagnosisTone | null;
  setSavedDiagnosis: (d: FinancialDiagnosis, tone: DiagnosisTone) => void;
  clearSavedDiagnosis: () => void;
}

export const useDiagnosisStore = create<DiagnosisStore>()(
  persist(
    (set) => ({
      savedDiagnosis: null,
      savedDiagnosisTone: null,
      setSavedDiagnosis: (d, tone) => set({ savedDiagnosis: d, savedDiagnosisTone: tone }),
      clearSavedDiagnosis: () => {
        set({ savedDiagnosis: null, savedDiagnosisTone: null });
        localStorage.removeItem("incomecalc-diagnosis");
        // Clear every single AI cache key in sessionStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith("ai_cache_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      },
    }),
    { name: "incomecalc-diagnosis" },
  ),
);
