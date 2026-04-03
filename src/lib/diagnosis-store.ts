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
      clearSavedDiagnosis: () => set({ savedDiagnosis: null, savedDiagnosisTone: null }),
    }),
    { name: "incomecalc-diagnosis" },
  ),
);
