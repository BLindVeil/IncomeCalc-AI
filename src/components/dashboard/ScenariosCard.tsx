import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800, MONO_FONT_STACK, fmt } from "@/lib/app-shared";

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
  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Scenario Suggestions</div>
        <button
          onClick={onSimulator}
          style={{
            background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
            color: "#fff",
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
                  background: `linear-gradient(90deg, ${EV_500}, ${EV_600})`,
                  borderRadius: 3,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
