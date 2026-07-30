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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.85rem" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: t.muted, marginBottom: "0.5rem" }}>
            AI Budget Insights
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.014em", color: t.text, lineHeight: 1.25 }}>
            Tips written from your exact breakdown
          </div>
        </div>
        {generated && (
          <button
            onClick={generateInsights}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "10px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {!generated && !loading && (
        <button
          onClick={generateInsights}
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
          <Sparkles size={15} />
          Generate my budget tips
        </button>
      )}

      {loading && (
        <div aria-label="Analyzing your budget" role="status">
          <style>{`
            @keyframes dx-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
            @media (prefers-reduced-motion: reduce) { .dx-skel { animation: none !important; } }
          `}</style>
          {[["84%", 12], ["68%", 12]].map(([w, h], i) => (
            <div
              key={i}
              className="dx-skel"
              style={{
                width: w as string,
                height: h as number,
                borderRadius: 6,
                background: t.border,
                marginBottom: 10,
                animation: `dx-pulse 1.6s ease-in-out ${i * 0.12}s infinite`,
              }}
            />
          ))}
          <div style={{ fontSize: "0.8rem", color: t.muted, marginTop: "0.6rem" }}>Analyzing your finances…</div>
        </div>
      )}

      {error && (
        <p style={{ color: t.text, fontSize: "0.88rem", fontWeight: 500, margin: 0 }}>
          {error}
        </p>
      )}

      {generated && !loading && insights.length > 0 && (
        <div>
          {insights.map((tip, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "0.6rem",
                padding: "0.6rem 0",
                borderTop: i > 0 ? `1px solid ${t.border}` : "none",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: t.subtle, flexShrink: 0, lineHeight: 1.55 }}>—</span>
              <span style={{ fontSize: "0.88rem", color: t.text, lineHeight: 1.55 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
