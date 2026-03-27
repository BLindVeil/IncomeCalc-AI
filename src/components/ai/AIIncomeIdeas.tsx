import { useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { fmt } from "@/lib/app-shared";
import type { ThemeConfig } from "@/lib/app-shared";
import type { ExpenseData } from "@/lib/calc";

// ─── sessionStorage cache ───────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(input: object) {
  return `ai_cache_incomeIdeas_${JSON.stringify(input)}`;
}

function readCache(key: string): IncomeIdea[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: IncomeIdea[]; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function writeCache(key: string, data: IncomeIdea[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface IncomeIdea {
  title: string;
  range: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface AIIncomeIdeasProps {
  data: ExpenseData;
  grossAnnual: number;
  totalMonthly: number;
  t: ThemeConfig;
  isDark: boolean;
}

export function AIIncomeIdeas({ data, grossAnnual, totalMonthly, t, isDark }: AIIncomeIdeasProps) {
  const gap = Math.max(0, grossAnnual * 0.2);
  const cacheInput = { grossAnnual, totalMonthly, gap, housing: data.housing, food: data.food, transport: data.transport };
  const cacheKey = getCacheKey(cacheInput);

  const [ideas, setIdeas] = useState<IncomeIdea[]>(() => readCache(cacheKey) ?? []);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(() => readCache(cacheKey) !== null);
  const [error, setError] = useState<string | null>(null);

  async function generateIdeas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "incomeIdeas",
          input: {
            grossAnnual,
            totalMonthly,
            gap,
            housing: data.housing,
            food: data.food,
            transport: data.transport,
          },
        }),
      });
      const json = await res.json() as { ideas?: IncomeIdea[]; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to generate ideas.");
      } else {
        const result = (json.ideas ?? []).slice(0, 4);
        setIdeas(result);
        setGenerated(true);
        writeCache(cacheKey, result);
      }
    } catch {
      setError("Network error — please try again.");
    }
    setLoading(false);
  }

  const difficultyColor = (d: string) =>
    d === "Easy" ? "#22c55e" : d === "Medium" ? "#f59e0b" : "#ef4444";

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Lightbulb size={18} style={{ color: "#f59e0b" }} />
          <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>AI Income Ideas</span>
        </div>
        {generated && (
          <button
            onClick={generateIdeas}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "10px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>
      <p style={{ color: t.muted, fontSize: "0.85rem", marginBottom: "1rem" }}>
        Realistic ways to earn an extra{" "}
        <strong style={{ color: t.text }}>{fmt(Math.round(gap))}/year</strong> toward financial freedom.
      </p>

      {!generated && !loading && (
        <div style={{ textAlign: "center", padding: "0.75rem 0" }}>
          <button
            onClick={generateIdeas}
            style={{
              background: "#f59e0b",
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
            <Lightbulb size={15} />
            Find My Income Ideas
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "1.5rem 0", color: t.muted, fontSize: "0.9rem" }}>
          <Lightbulb size={18} style={{ marginBottom: "0.5rem", color: "#f59e0b" }} />
          <div>Finding personalized income opportunities...</div>
        </div>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.88rem", textAlign: "center", padding: "0.5rem 0", margin: 0 }}>
          {error}
        </p>
      )}

      {generated && !loading && ideas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {ideas.map((idea, i) => (
            <div
              key={i}
              style={{
                padding: "0.9rem 1rem",
                background: isDark ? "#2a2a2f" : "#f9f9fb",
                borderRadius: "10px",
                border: `1px solid ${t.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem" }}>{idea.title}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.88rem" }}>{idea.range}</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: difficultyColor(idea.difficulty),
                      background: difficultyColor(idea.difficulty) + "15",
                      border: `1px solid ${difficultyColor(idea.difficulty)}40`,
                      borderRadius: "6px",
                      padding: "1px 6px",
                    }}
                  >
                    {idea.difficulty}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: "0.85rem", color: t.muted, lineHeight: 1.5 }}>{idea.description}</div>
            </div>
          ))}
          <p style={{ fontSize: "0.78rem", color: t.muted, textAlign: "center", margin: "0.25rem 0 0" }}>
            Chat with the AI Advisor below for deeper guidance on any idea.
          </p>
        </div>
      )}

      {generated && !loading && ideas.length === 0 && (
        <p style={{ color: t.muted, fontSize: "0.9rem", textAlign: "center" }}>
          Couldn't generate ideas — try again.
        </p>
      )}
    </div>
  );
}
