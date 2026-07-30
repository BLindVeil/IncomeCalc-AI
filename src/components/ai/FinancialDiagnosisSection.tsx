import { useState, useEffect, useRef } from "react";
import { Stethoscope, RefreshCw } from "lucide-react";
import type { ThemeConfig, UserTier } from "@/lib/app-shared";
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
  onUpgrade: () => void;
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
  const isPremium = userTier === "paid";
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
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: "16px",
        padding: "1.5rem",
        marginBottom: "1.25rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: t.muted,
              marginBottom: "0.5rem",
            }}
          >
            AI Financial Diagnosis
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 600, letterSpacing: "-0.016em", color: t.text, lineHeight: 1.2 }}>
            {generated && result ? "Your report" : "Read your position like a clinician would"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
          {userTier !== "paid" && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: t.muted,
                border: `1px solid ${t.borderStrong}`,
                borderRadius: "999px",
                padding: "4px 10px",
              }}
            >
              Preview
            </span>
          )}
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
      </div>

      {/* Tone selector + generate */}
      {(!generated || !result) && !loading && (
        <>
          <p style={{ color: t.muted, fontSize: "0.9rem", lineHeight: 1.6, margin: "0.6rem 0 1.25rem", maxWidth: "52ch" }}>
            One structured read of your position: the main issue, what it costs you,
            and the moves that change it — ranked by dollar impact.
          </p>
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, marginBottom: "0.5rem" }}>
              Coaching tone
            </div>
            <DiagnosisToneSelector value={tone} onChange={setTone} t={t} isDark={isDark} />
          </div>
          <button
            onClick={generateDiagnosis}
            className="lp-press"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 22px",
              background: t.text,
              color: t.cardBg,
              border: "none",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 550,
              letterSpacing: "-0.01em",
              cursor: "pointer",
            }}
          >
            <Stethoscope size={15} />
            {savedDiagnosis ? "Run my diagnosis again" : "Run my diagnosis"}
          </button>
        </>
      )}

      {/* Loading — skeleton report, not a spinner */}
      {loading && (
        <div style={{ marginTop: "1.25rem" }} aria-label="Generating your diagnosis" role="status">
          <style>{`
            @keyframes dx-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
            @media (prefers-reduced-motion: reduce) { .dx-skel { animation: none !important; } }
          `}</style>
          {[["58%", 18], ["92%", 12], ["84%", 12], ["40%", 12], ["70%", 34]].map(([w, h], i) => (
            <div
              key={i}
              className="dx-skel"
              style={{
                width: w as string,
                height: h as number,
                borderRadius: 6,
                background: t.border,
                marginBottom: i === 0 ? 14 : 10,
                animation: `dx-pulse 1.6s ease-in-out ${i * 0.12}s infinite`,
              }}
            />
          ))}
          <div style={{ fontSize: "0.8rem", color: t.muted, marginTop: "0.85rem" }}>
            Reading your numbers — a few seconds.
          </div>
        </div>
      )}

      {/* Error — the unconfigured/overloaded state is real and reachable */}
      {error && !loading && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: `1px solid ${t.border}` }}>
          <p style={{ color: t.text, fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.2rem" }}>
            {/529|overloaded/i.test(error)
              ? "The AI is under heavy demand right now."
              : /not configured/i.test(error)
                ? "AI is not configured on this deployment."
                : "The diagnosis didn't come back."}
          </p>
          <p style={{ color: t.muted, fontSize: "0.82rem", margin: "0 0 0.75rem" }}>
            {/not configured/i.test(error)
              ? "Your numbers are unaffected — every calculator and tool still works."
              : "Nothing was lost — run it again."}
          </p>
          {!/not configured/i.test(error) && (
            <button
              onClick={generateDiagnosis}
              className="lp-press"
              style={{
                background: "transparent",
                border: `1px solid ${t.borderStrong}`,
                borderRadius: 999,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 550,
                color: t.text,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {generated && !loading && result && (
        <FinancialDiagnosisCard diagnosis={result} savingsRate={savingsRate} monthlySurplus={leftover} grossMonthly={grossMonthly} totalMonthly={totalMonthly} data={data} isPremium={isPremium} onUpgrade={onUpgrade} onSimulator={onSimulator} t={t} isDark={isDark} />
      )}
    </div>
  );
}
