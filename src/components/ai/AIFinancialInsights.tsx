import { useState } from "react";
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
}: AIFinancialInsightsProps) {
  const cacheInput = { grossAnnual, grossMonthly, taxRate, totalMonthly, healthScore, savingsRate, hourlyRate, ...data };
  const cacheKey = getCacheKey(cacheInput);

  const [result, setResult] = useState<FinancialInsightsResult | null>(() => readCache(cacheKey));
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(() => readCache(cacheKey) !== null);
  const [error, setError] = useState<string | null>(null);

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
        writeCache(cacheKey, parsed);
      }
    } catch {
      setError("Network error — please try again.");
    }
    setLoading(false);
  }

  const sectionStyle = (accent: string): React.CSSProperties => ({
    padding: "0.85rem 1rem",
    borderRadius: "10px",
    background: accent + "12",
    borderLeft: `3px solid ${accent}`,
    marginBottom: "0.65rem",
  });

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
      {/* Gradient accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
          borderRadius: "14px 14px 0 0",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={18} style={{ color: "#8b5cf6" }} />
          <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Financial Insights</span>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              color: "#fff",
              padding: "2px 7px",
              borderRadius: "20px",
              letterSpacing: "0.04em",
            }}
          >
            AI
          </span>
        </div>
        {generated && (
          <button
            onClick={generateInsights}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "2px" }}
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>
      <p style={{ color: t.muted, fontSize: "0.85rem", marginBottom: "1rem", margin: "0 0 1rem" }}>
        A complete AI analysis of your financial picture — insights, risks, and your 10-year outlook.
      </p>

      {!generated && !loading && (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <button
            onClick={generateInsights}
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "0.7rem 1.8rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            }}
          >
            <Sparkles size={16} />
            Generate My Financial Insights
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "1.75rem 0", color: t.muted, fontSize: "0.9rem" }}>
          <Sparkles size={20} style={{ marginBottom: "0.5rem", color: "#8b5cf6" }} />
          <div style={{ fontWeight: 500 }}>Analyzing your complete financial picture…</div>
        </div>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.88rem", textAlign: "center", margin: "0.5rem 0 0" }}>
          {error}
        </p>
      )}

      {generated && !loading && result && (
        <div>
          {/* Key Insights */}
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: "0.55rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6366f1",
              }}
            >
              <Brain size={13} />
              Key Insights
            </div>
            {result.insights.map((insight, i) => (
              <div key={i} style={sectionStyle("#6366f1")}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: t.text, lineHeight: 1.55 }}>{insight}</p>
              </div>
            ))}
          </div>

          {result.riskWarning && (
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.55rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={13} />
                Risk Warning
              </div>
              <div style={sectionStyle("#ef4444")}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: t.text, lineHeight: 1.55 }}>{result.riskWarning}</p>
              </div>
            </div>
          )}

          {result.optimization && (
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.55rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#22c55e",
                }}
              >
                <Zap size={13} />
                Optimization Opportunity
              </div>
              <div style={sectionStyle("#22c55e")}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: t.text, lineHeight: 1.55 }}>{result.optimization}</p>
              </div>
            </div>
          )}

          {result.projection && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.55rem",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#f59e0b",
                }}
              >
                <TrendingUp size={13} />
                10-Year Projection
              </div>
              <div style={sectionStyle("#f59e0b")}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: t.text, lineHeight: 1.55 }}>{result.projection}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
