import { useState, useEffect } from "react";
import { Sparkles, Brain, AlertTriangle, Zap, TrendingUp, RefreshCw } from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";
import type { ExpenseData } from "@/lib/calc";

// ─── sessionStorage cache ───────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(input: object) {
  return `ai_cache_financialInsights_${JSON.stringify(input)}`;
}

function readCache(key: string): FinancialInsightsResult | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: FinancialInsightsResult; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function writeCache(key: string, data: FinancialInsightsResult) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface FinancialInsightsResult {
  insights: string[];
  riskWarning: string;
  optimization: string;
  projection: string;
}

export interface AIFinancialInsightsProps {
  data: ExpenseData;
  taxRate: number;
  grossAnnual: number;
  grossMonthly: number;
  totalMonthly: number;
  savingsRate: number;
  healthScore: number;
  hourlyRate: number;
  t: ThemeConfig;
  isDark: boolean;
  onGenerated?: () => void;
}

export function AIFinancialInsights({
  data,
  taxRate,
  grossAnnual,
  grossMonthly,
  totalMonthly,
  savingsRate,
  healthScore,
  hourlyRate,
  t,
  isDark,
  onGenerated,
}: AIFinancialInsightsProps) {
  const cacheInput = { grossAnnual, grossMonthly, taxRate, totalMonthly, healthScore, savingsRate, hourlyRate, ...data };
  const cacheKey = getCacheKey(cacheInput);

  const hasCached = readCache(cacheKey) !== null;
  const [result, setResult] = useState<FinancialInsightsResult | null>(() => readCache(cacheKey));
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
          feature: "financialInsights",
          input: {
            grossAnnual,
            netMonthly: totalMonthly,
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
            investments: 0,
            other: data.other,
            healthScore,
            savingsRate,
            hourlyRate,
          },
        }),
      });
      const json = (await res.json()) as FinancialInsightsResult & { error?: string };
      if (!res.ok || json.error) {
        setError((json as { error?: string }).error ?? "Failed to generate insights.");
      } else {
        const parsed = {
          insights: json.insights ?? [],
          riskWarning: json.riskWarning ?? "",
          optimization: json.optimization ?? "",
          projection: json.projection ?? "",
        };
        setResult(parsed);
        setGenerated(true);
        onGenerated?.();
        writeCache(cacheKey, parsed);
      }
    } catch {
      setError("Network error — please try again.");
    }
    setLoading(false);
  }

  const blockLabel: React.CSSProperties = {
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: t.text,
    marginBottom: "0.4rem",
  };
  const blockText: React.CSSProperties = {
    margin: 0,
    fontSize: "0.9rem",
    color: t.muted,
    lineHeight: 1.65,
    maxWidth: "62ch",
  };
  const blockRule: React.CSSProperties = {
    marginTop: "1.1rem",
    paddingTop: "1rem",
    borderTop: `1px solid ${t.border}`,
  };

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
            AI Financial Insights
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.014em", color: t.text, lineHeight: 1.25 }}>
            Your picture, risks, and 10-year outlook
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
        <div style={{ marginTop: "0.85rem" }}>
          <p style={{ ...blockText, marginBottom: "1.1rem" }}>
            One pass over everything you entered: what stands out, what could hurt
            you, and where a decade of your current pace lands.
          </p>
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
            Generate my insights
          </button>
        </div>
      )}

      {loading && (
        <div style={{ marginTop: "1.1rem" }} aria-label="Analyzing your financial picture" role="status">
          <style>{`
            @keyframes dx-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
            @media (prefers-reduced-motion: reduce) { .dx-skel { animation: none !important; } }
          `}</style>
          {[["88%", 12], ["76%", 12], ["52%", 12]].map(([w, h], i) => (
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
          <div style={{ fontSize: "0.8rem", color: t.muted, marginTop: "0.75rem" }}>
            Analyzing your complete financial picture…
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: t.text, fontSize: "0.88rem", fontWeight: 500, margin: "0.85rem 0 0" }}>
          {error}
        </p>
      )}

      {generated && !loading && result && (
        <div>
          {/* Key insights */}
          <div style={blockRule}>
            <div style={blockLabel}>Key insights</div>
            {result.insights.map((insight, i) => (
              <div key={i} style={{ display: "flex", gap: "0.6rem", marginBottom: "0.45rem" }}>
                <span style={{ fontSize: "0.82rem", color: t.subtle, flexShrink: 0, lineHeight: 1.65 }}>—</span>
                <p style={blockText}>{insight}</p>
              </div>
            ))}
          </div>

          {result.riskWarning && (
            <div style={blockRule}>
              <div style={{ ...blockLabel, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#DC2626", flexShrink: 0 }} />
                Risk warning
              </div>
              <p style={blockText}>{result.riskWarning}</p>
            </div>
          )}

          {result.optimization && (
            <div style={blockRule}>
              <div style={blockLabel}>Optimization opportunity</div>
              <p style={blockText}>{result.optimization}</p>
            </div>
          )}

          {result.projection && (
            <div style={{ marginTop: "1.1rem", background: t.primarySoft, borderRadius: 12, padding: "1rem 1.1rem" }}>
              <div style={blockLabel}>10-year projection</div>
              <p style={{ ...blockText, color: t.text }}>{result.projection}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
