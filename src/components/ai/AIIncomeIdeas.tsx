import { useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { fmt, MONO_FONT_STACK } from "@/lib/app-shared";
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
    d === "Easy" ? "#40916C" : d === "Medium" ? "#B45309" : "#DC2626";

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
            AI Income Ideas
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.014em", color: t.text, lineHeight: 1.25 }}>
            Realistic ways to close{" "}
            <span style={{ fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{fmt(Math.round(gap))}</span>/year
          </div>
        </div>
        {generated && (
          <button
            onClick={generateIdeas}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "10px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            title="Regenerate"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {!generated && !loading && (
        <button
          onClick={generateIdeas}
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
          <Lightbulb size={15} />
          Find my income ideas
        </button>
      )}

      {loading && (
        <div aria-label="Finding income opportunities" role="status">
          <style>{`
            @keyframes dx-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
            @media (prefers-reduced-motion: reduce) { .dx-skel { animation: none !important; } }
          `}</style>
          {[["72%", 12], ["86%", 12], ["58%", 12]].map(([w, h], i) => (
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
          <div style={{ fontSize: "0.8rem", color: t.muted, marginTop: "0.6rem" }}>Finding personalized income opportunities…</div>
        </div>
      )}

      {error && (
        <p style={{ color: t.text, fontSize: "0.88rem", fontWeight: 500, margin: 0 }}>
          {error}
        </p>
      )}

      {generated && !loading && ideas.length > 0 && (
        <div>
          {ideas.map((idea, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.85rem 0",
                borderTop: i > 0 ? `1px solid ${t.border}` : "none",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: t.text, fontSize: "0.92rem", letterSpacing: "-0.01em", marginBottom: "0.2rem" }}>
                  {idea.title}
                </div>
                <div style={{ fontSize: "0.85rem", color: t.muted, lineHeight: 1.55 }}>{idea.description}</div>
                <div style={{ fontSize: "0.76rem", color: t.subtle, marginTop: "0.3rem" }}>{idea.difficulty}</div>
              </div>
              <span style={{ fontWeight: 600, color: "#40916C", fontSize: "0.88rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'", whiteSpace: "nowrap", flexShrink: 0 }}>
                {idea.range}
              </span>
            </div>
          ))}
          <p style={{ fontSize: "0.78rem", color: t.muted, margin: "0.5rem 0 0" }}>
            Chat with the AI Advisor below for deeper guidance on any idea.
          </p>
        </div>
      )}

      {generated && !loading && ideas.length === 0 && (
        <p style={{ color: t.muted, fontSize: "0.9rem", margin: 0 }}>
          Couldn't generate ideas — try again.
        </p>
      )}
    </div>
  );
}
