import { useEffect, useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, MONO_FONT_STACK, fmt } from "@/lib/app-shared";
import { eyebrow as eyebrowStyle } from "@/components/editorial";

export interface ScenarioSuggestion {
  title: string;
  description: string;
  impact: number; // dollars saved monthly
  progress: number; // 0-100
}

export interface ScenariosCardProps {
  t: ThemeConfig;
  scenarios: ScenarioSuggestion[];
  onSimulator?: () => void;
}

export function ScenariosCard({ t, scenarios, onSimulator }: ScenariosCardProps) {
  // Progress bars fill on first paint (reduced-motion renders them filled).
  const [filled, setFilled] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="lp-in"
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ ...eyebrowStyle, color: t.muted }}>Scenario Suggestions</div>
        <button
          onClick={onSimulator}
          className="lp-press"
          style={{
            background: t.text,
            color: t.cardBg,
            border: "none",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Run scenario
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {scenarios.map((s, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{s.title}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: EV_500,
                  fontFamily: MONO_FONT_STACK,
                  fontFeatureSettings: "'tnum', 'zero'",
                }}
              >
                {fmt(s.impact)}/mo
              </div>
            </div>
            <div style={{ fontSize: 12, color: t.muted, marginBottom: 6 }}>{s.description}</div>
            <div style={{ height: 6, background: t.border, borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(s.progress, 100)}%`,
                  background: t.primary,
                  borderRadius: 3,
                  transformOrigin: "left",
                  transform: filled ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 0.7s cubic-bezier(0.23,1,0.32,1)",
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
