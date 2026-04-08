import { useState, useEffect, useRef } from "react";
import { Stethoscope, RefreshCw } from "lucide-react";
import type { ThemeConfig, UserTier, PlanId } from "@/lib/app-shared";
import type { ExpenseData } from "@/lib/calc";
import type { FinancialDiagnosis, DiagnosisTone, DiagnosisInput } from "@/lib/diagnosis-types";
import { parseDiagnosis } from "@/lib/diagnosis-types";
import { trackEvent } from "@/lib/analytics";
import { useDiagnosisStore } from "@/lib/diagnosis-store";
import { DiagnosisToneSelector } from "./DiagnosisToneSelector";
import { FinancialDiagnosisCard } from "./FinancialDiagnosisCard";

// ─── sessionStorage cache ───────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(input: object) {
  return `ai_cache_diagnosis_${JSON.stringify(input)}`;
}

function readCache(key: string): FinancialDiagnosis | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: FinancialDiagnosis; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function writeCache(key: string, data: FinancialDiagnosis) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface FinancialDiagnosisSectionProps {
  data: ExpenseData;
  taxRate: number;
  grossAnnual: number;
  grossMonthly: number;
  totalMonthly: number;
  savingsRate: number;
  healthScore: number;
  hourlyRate: number;
  fragilityScore: number;
  debtRatio: number;
  emergencyFundTarget: number;
  userTier: UserTier;
  onUpgrade: (plan?: PlanId) => void;
  onSimulator?: () => void;
  t: ThemeConfig;
  isDark: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FinancialDiagnosisSection({
  data,
  taxRate,
  grossAnnual,
  grossMonthly,
  totalMonthly,
  savingsRate,
  healthScore,
  hourlyRate,
  fragilityScore,
  debtRatio,
  emergencyFundTarget,
  userTier,
  onUpgrade,
  onSimulator,
  t,
  isDark,
}: FinancialDiagnosisSectionProps) {
  const isPremium = userTier === "premium";
  const { savedDiagnosis, savedDiagnosisTone, savedDiagnosisFingerprint, setSavedDiagnosis, clearSavedDiagnosis } = useDiagnosisStore();
  const [tone, setTone] = useState<DiagnosisTone>(() => savedDiagnosisTone ?? "direct");

  // Build the input for cache keying (without tone — tone changes should regenerate)
  const baseInput = {
    grossAnnual, grossMonthly, taxRate, totalMonthly, healthScore, savingsRate, hourlyRate,
    ...data,
  };

  const fullCacheKey = cacheKey({ ...baseInput, tone });

  const [result, setResult] = useState<FinancialDiagnosis | null>(() => readCache(fullCacheKey));
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(() => readCache(fullCacheKey) !== null);
  const [error, setError] = useState<string | null>(null);

  // Restore from persisted store if sessionStorage cache is empty
  useEffect(() => {
    if (!result && savedDiagnosis) {
      const currentFingerprint = `${data.housing},${data.food},${data.transport},${data.healthcare},${data.utilities},${data.entertainment},${data.clothing},${data.savings},${data.other}`;
      if (savedDiagnosisFingerprint !== currentFingerprint) {
        clearSavedDiagnosis();
        return;
      }
      setResult(savedDiagnosis);
      setGenerated(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear persisted diagnosis when expense inputs change
  const expenseFingerprint = `${data.housing},${data.food},${data.transport},${data.healthcare},${data.utilities},${data.entertainment},${data.clothing},${data.savings},${data.other}`;
  const prevFingerprint = useRef(expenseFingerprint);
  useEffect(() => {
    if (prevFingerprint.current !== expenseFingerprint) {
      prevFingerprint.current = expenseFingerprint;
      clearSavedDiagnosis();
      // Targeted fallback — remove all AI cache keys without touching session/auth keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("ai_cache_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
  }, [expenseFingerprint, clearSavedDiagnosis]);

  // Determine top 3 expense categories
  const categories: { name: string; value: number }[] = [
    { name: "Housing", value: data.housing },
    { name: "Food", value: data.food },
    { name: "Transport", value: data.transport },
    { name: "Healthcare", value: data.healthcare },
    { name: "Utilities", value: data.utilities },
    { name: "Entertainment", value: data.entertainment },
    { name: "Clothing", value: data.clothing },
    { name: "Savings", value: data.savings },
    { name: "Other", value: data.other },
  ].sort((a, b) => b.value - a.value);

  const top3 = categories.slice(0, 3).map((c) => `${c.name}: $${Math.round(c.value)}`);
  const leftover = grossMonthly - totalMonthly;

  async function generateDiagnosis() {
    setLoading(true);
    setError(null);
    try {
      const input: DiagnosisInput = {
        grossAnnual,
        netMonthly: grossMonthly,
        taxRate,
        totalMonthly,
        leftover,
        savingsRate,
        healthScore,
        hourlyRate,
        housing: data.housing,
        food: data.food,
        transport: data.transport,
        healthcare: data.healthcare,
        utilities: data.utilities,
        entertainment: data.entertainment,
        clothing: data.clothing,
        savings: data.savings,
        other: data.other,
        top3Categories: top3,
        tone,
        fragilityScore,
        debtRatio,
        emergencyFundTarget,
      };

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "financialDiagnosis", input }),
      });
      const json = (await res.json()) as Record<string, unknown>;

      if (!res.ok || json.error) {
        setError((json.error as string) ?? "Failed to generate diagnosis.");
        setLoading(false);
        return;
      }

      const parsed = parseDiagnosis(json);
      if (!parsed) {
        setError("The AI returned an unexpected format. Please try again.");
        setLoading(false);
        return;
      }

      setResult(parsed);
      setGenerated(true);
      writeCache(cacheKey({ ...baseInput, tone }), parsed);
      setSavedDiagnosis(parsed, tone, expenseFingerprint);
      trackEvent("diagnosis_generated", { user_tier: userTier, source_page: "guided" });
    } catch {
      setError("Network error — please try again.");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${t.border}`,
        borderRadius: "14px",
        padding: "1.5rem",
        marginBottom: "1.25rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Premium gradient accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e, ${t.primary})`,
          borderRadius: "14px 14px 0 0",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Stethoscope size={18} style={{ color: t.primary }} />
          <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Your AI Financial Diagnosis</span>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              background: userTier === "premium"
                ? `linear-gradient(90deg, #ef4444, ${t.primary})`
                : `linear-gradient(90deg, ${t.primary}, ${t.accent})`,
              color: "#fff",
              padding: "2px 7px",
              borderRadius: "20px",
              letterSpacing: "0.04em",
            }}
          >
            {userTier === "premium" ? "PREMIUM" : "PREVIEW"}
          </span>
        </div>
        {generated && (
          <button
            onClick={generateDiagnosis}
            disabled={loading}
            style={{ background: "transparent", border: "none", cursor: loading ? "not-allowed" : "pointer", color: t.muted, padding: "10px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>
      <p style={{ color: t.muted, fontSize: "0.85rem", margin: "0 0 1rem" }}>
        A deep, structured analysis of your financial position with ranked actions and scenario projections.
      </p>

      {/* Tone selector + generate */}
      {(!generated || !result) && !loading && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: t.muted, marginBottom: "0.45rem" }}>
              Choose your coaching tone
            </div>
            <DiagnosisToneSelector value={tone} onChange={setTone} t={t} isDark={isDark} />
          </div>
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <button
              onClick={generateDiagnosis}
              style={{
                background: `linear-gradient(135deg, #ef4444, ${t.primary})`,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0.75rem 2rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: `0 4px 14px ${t.primary}59`,
              }}
            >
              <Stethoscope size={16} />
              {savedDiagnosis ? "Regenerate My Diagnosis" : "Generate My Diagnosis"}
            </button>
          </div>
        </>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem 0", color: t.muted, fontSize: "0.9rem" }}>
          <Stethoscope size={22} style={{ marginBottom: "0.5rem", color: t.primary }} />
          <div style={{ fontWeight: 500 }}>Diagnosing your financial position…</div>
          <div style={{ fontSize: "0.78rem", marginTop: "0.35rem", opacity: 0.7 }}>This may take a few seconds</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ textAlign: "center", margin: "0.75rem 0 0" }}>
          <p style={{ color: "#ef4444", fontSize: "0.88rem", marginBottom: "0.5rem" }}>
            {/529|overloaded/i.test(error)
              ? "Our AI is experiencing high demand right now. Please try again in a moment."
              : "Something went wrong. Please try again."}
          </p>
          <button
            onClick={generateDiagnosis}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: "8px",
              padding: "0.4rem 1rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: t.text,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Result */}
      {generated && !loading && result && (
        <FinancialDiagnosisCard diagnosis={result} savingsRate={savingsRate} monthlySurplus={leftover} grossMonthly={grossMonthly} totalMonthly={totalMonthly} data={data} isPremium={isPremium} onUpgrade={onUpgrade} onSimulator={onSimulator} t={t} isDark={isDark} />
      )}
    </div>
  );
}
