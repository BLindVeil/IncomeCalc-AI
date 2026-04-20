import { useState, useEffect } from "react";
import { Brain, Sparkles, RefreshCw } from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";
import type { ExpenseData } from "@/lib/calc";

// ─── sessionStorage cache ───────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(input: object) {
  return `ai_cache_budgetInsights_${JSON.stringify(input)}`;
}

function readCache(key: string): string[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: string[]; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function writeCache(key: string, data: string[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface AIBudgetInsightsProps {
  data: ExpenseData;
  taxRate: number;
  grossAnnual: number;
  grossMonthly: number;
  totalMonthly: number;
  t: ThemeConfig;
  isDark: boolean;
  onGenerated?: () => void;
}

export function AIBudgetInsights({ data, taxRate, grossAnnual, grossMonthly, totalMonthly, t, isDark, onGenerated }: AIBudgetInsightsProps) {
  const cacheInput = { grossAnnual, grossMonthly, taxRate, totalMonthly, ...data };
  const cacheKey = getCacheKey(cacheInput);

  const hasCached = readCache(cacheKey) !== null;
  const [insights, setInsights] = useState<string[]>(() => readCache(cacheKey) ?? []);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(() => hasCached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (hasCached) onGenerated?.(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function generateInsights() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "budgetInsights",
          input: {
            grossAnnual,
            taxRate,
            totalMonthly,
            housing: data.housing,
            food: data.food,
            transport: data.transport,
            healthcare: data.healthcare,
            utilities: data.utilities,
            entertainment: data.entertainment,
            clothing: data.clothing,
            savings: data.savings,
            other: data.other,
          },
        }),
      });
      const json = await res.json() as { insights?: string[]; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to generate insights.");
      } else {
        const result = json.insights ?? [];
        setInsights(result);
        setGenerated(true);
        onGenerated?.();
        writeCache(cacheKey, result);
      }
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
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Brain size={18} style={{ color: t.primary }} />
          <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>AI Budget Insights</span>
        </div>
        {generated && (
          <button
            onClick={generateInsights}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "10px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {!generated && !loading && (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <p style={{ color: t.muted, fontSize: "0.9rem", marginBottom: "1rem" }}>
            Get personalized AI tips based on your exact expense breakdown.
          </p>
          <button
            onClick={generateInsights}
            style={{
              background: t.primary,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Sparkles size={15} />
            Generate My AI Insights
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "1.5rem 0", color: t.muted, fontSize: "0.9rem" }}>
          <Sparkles size={18} style={{ marginBottom: "0.5rem", color: t.primary }} />
          <div>Analyzing your finances...</div>
        </div>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.88rem", textAlign: "center", padding: "0.5rem 0", margin: 0 }}>
          {error}
        </p>
      )}

      {generated && !loading && insights.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {insights.map((tip, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
                padding: "0.65rem 0.85rem",
                background: t.primary + "10",
                borderRadius: "8px",
              }}
            >
              <Brain size={14} style={{ color: t.primary, flexShrink: 0, marginTop: "2px" }} />
              <span style={{ fontSize: "0.88rem", color: t.text, lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
